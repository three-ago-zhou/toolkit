import DvaCore from '../index';

// interface
import type { Reducer, DvaAction } from '../../types';

describe("reducers", () => {
    it("enhancer", () => {
        function enhancer(reducer: Reducer) {
            return (state: any, action: DvaAction) => {
                if (action.type === 'square') {
                    return state * state;
                }
                return reducer(state, action);
            };
        };
        const core = new DvaCore();
        core.model({
            namespace: 'count',
            state: 3,
            reducers: [
                {
                    add(state, { payload }) {
                        return state + (payload || 1);
                    },
                },
                enhancer,
            ],
        });
        core.start();
        core._store?.dispatch({ type: 'square' });
        core._store?.dispatch({ type: 'count/add' });
        expect(core._store?.getState().count).toEqual(10);
    });

    it('extraReducers', () => {
        const reducers = {
            count: (state: any, { type }: DvaAction) => {
                if (type === 'add') {
                    return state + 1;
                }
                // default state
                return 0;
            },
        };
        const core = new DvaCore({
            extraReducers: reducers,
        });
        core.start();
        expect(core._store?.getState().count).toEqual(0);
        core._store?.dispatch({ type: 'add' });
        expect(core._store?.getState().count).toEqual(1);
    });

    it('onReducer with saveAndLoad', () => {
        let savedState: any = null;
        const saveAndLoad = (r: Reducer) => (state: any, action: DvaAction) => {
            const newState = r(state, action);
            if (action.type === 'save') {
                savedState = newState;
            }
            if (action.type === 'load') {
                return savedState;
            }
            return newState;
        };
        const core = new DvaCore({
            onReducer: saveAndLoad,
        });
        core.model({
            namespace: 'count',
            state: 0,
            reducers: {
                add(state) {
                    return state + 1;
                },
            },
        });
        core.start();
    
        core._store?.dispatch({ type: 'count/add' });
        expect(core._store?.getState().count).toEqual(1);
        core._store?.dispatch({ type: 'save' });
        expect(core._store?.getState().count).toEqual(1);
        core._store?.dispatch({ type: 'count/add' });
        core._store?.dispatch({ type: 'count/add' });
        expect(core._store?.getState().count).toEqual(3);
        core._store?.dispatch({ type: 'load' });
        expect(core._store?.getState().count).toEqual(1);
    });

    it('onReducer', () => {
        const undo = (r: Reducer) => (state: any, action: DvaAction) => {
            const newState = r(state, action);
            return { present: newState, routing: newState.routing };
        };
        const core = new DvaCore({
            onReducer: undo,
        });
        core.model({
            namespace: 'count',
            state: 0,
            reducers: {
                update(state) {
                    return state + 1;
                },
            },
        });
        core.start();
    
        expect(core._store?.getState().present.count).toEqual(0);
    });

    it('effects put reducers when reducers is array', () => {
        const enhancer = (r: Reducer) => (state: any, action: DvaAction) => {
            const newState = r(state, action);
            return newState;
        };
        const core = new DvaCore();
        core.model({
            namespace: 'count',
            state: 0,
            effects: {
                *putSetState(_, { put }) {
                    yield put({ type: 'setState' });
                },
            },
            reducers: [
                {
                    setState(state) {
                        return state + 1;
                    },
                },
                enhancer,
            ],
        });
        core.start();
        core._store?.dispatch({ type: 'count/putSetState' });
        
        expect(core._store?.getState().count).toEqual(1);
    });
});
