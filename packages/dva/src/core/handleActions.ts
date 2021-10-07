import invariant from 'invariant';
import produce, {
    isDraftable,
    nothing,
} from 'immer';

// interface
import type {
    ModelReducer,
    Reducer,
    DvaAction,
    ImmerReducers,
} from '../types';
import type { Draft } from 'immer';

function handleAction<S>(
    actionType: string,
    reducer?: Reducer<S>,
) {
    return (state: S, action: DvaAction) => {
        const { type } = action;
        invariant(type, 'dispatch: action should be a plain Object with type');
        if (actionType === type && reducer) {
            return reducer(state, action);
        }
        return state;
    };
};

function reduceReducers<S>(...reducers: Reducer<S>[]) {
    return (previous: S, current: DvaAction) => reducers.reduce((p, r) => r(p, current), previous);
};

/**
 * @summary 聚合reducer
 * @param handlers reducers
 * @param defaultState initialState
 * @returns Reducer
 */
function handleActions<S = any>(
    handlers: ModelReducer<S> = {},
    defaultState: S,
) {
    const reducers = Object.keys(handlers).map((type) => handleAction<S>(type, handlers[type]));
    const reducer = reduceReducers<S>(...reducers);
    return (state = defaultState, action: DvaAction) => reducer(state, action);
};

/**
 * @summary immer加持的state
 * @param handlers 
 * @param defaultState 
 * @returns Reducer
 */
export function immerReduces<S = any>(
    handlers: ImmerReducers<S> = {},
    defaultState: S,
): Reducer<S> {
    return (previousState = defaultState, action: DvaAction<S>): S => {
        const { type } = action;
        const caseReducer = handlers[type];
        if (caseReducer) {
            // not object,(e.g: number)
            if (!isDraftable(previousState)) {
                const result = caseReducer(previousState, action);
                if (typeof result === 'undefined' || (result as any) === nothing) {
                    throw Error('A case reducer on a non-draftable value must not return undefined');
                }
                return result as S;
            }
            const result = produce(previousState, (draft: Draft<S>) => caseReducer(draft, action) as any);
            if (typeof result === 'undefined') {
                throw Error('A case reducer on a non-draftable value must not return undefined');
            }
            return result;
        }
        return previousState;
    };
};

export default handleActions;
