import DvaCore from "../index";

// interface
import type {
    AnyAction,
    Dispatch,
} from "redux";
import type { ExtraEnhancers } from '../../types';

function delay(timeout: number) {
    return new Promise(resolve => setTimeout(resolve, timeout));
};

describe("opts and hooks", () => {
    it("basic", (done) => {
        const core = new DvaCore();
        core.model({
            namespace: 'loading',
            state: false,
            reducers: {
                show() {
                    return true;
                },
                hide() {
                    return false;
                },
            },
        });
        const nsAction = (namespace: string) => (action: string) => `${namespace}/${action}`;
        const ADD = 'add';
        const ADD_DELAY = 'addDelay';
        const countAction = nsAction('count');
        const loadingAction = nsAction('loading');
        core.model({
            namespace: 'count',
            state: 0,
            subscriptions: {
                setup({ dispatch }) {
                    dispatch({ type: ADD });
                },
            },
            reducers: {
                [ADD](state, { payload }) {
                    return state + payload || 1;
                },
            },
            effects: {
                *[ADD_DELAY]({ payload }, { call, put }) {
                    yield put({ type: loadingAction('show') });
                    yield call(delay, 100);
                    yield put({ type: ADD, payload });
                    yield put({ type: loadingAction('hide') });
                },
            },
        });
        core.start();

        expect(core._store?.getState().count).toEqual(1);
        expect(core._store?.getState().loading).toEqual(false);
        core._store?.dispatch({ type: countAction(ADD_DELAY), payload: 2 });
        expect(core._store?.getState().loading).toEqual(true);
        setTimeout(() => {
            expect(core._store?.getState().count).toEqual(3);
            expect(core._store?.getState().loading).toEqual(false);
            done();
        }, 200);
    });

    it("opts.onError prevent reject error", done => {
        let rejectCount = 0;
        const core = new DvaCore({
            onError(e) {
                e.preventDefault?.();
            },
        });
        core.model({
            namespace: 'count',
            state: 0,
            effects: {
                // eslint-disable-next-line require-yield
                *add() {
                    throw new Error('add failed');
                },
            },
        });
        core.start();
        /**
         * dispatch是个黑盒
         */
        (core._store?.dispatch({
            type: 'count/add',
        }) as any).catch(() => {
            rejectCount += 1;
        });
        setTimeout(() => {
            expect(rejectCount).toEqual(0);
            done();
        }, 200);
    });

    it("opts.initialState", () => {
        const core = new DvaCore({
            initialState: { count: 1 },
        });
        core.model({
            namespace: 'count',
            state: 0,
        });
        core.start();
        expect(core._store?.getState().count).toEqual(1);
    });

    it("opts.onAction", () => {
        let count = 0;
        const countMiddleware = () => (next: Dispatch) => (action: AnyAction) => {
            count += 1;
            next(action);
        };
        const core = new DvaCore({
          onAction: countMiddleware,
        });
        core.start();
        core._store?.dispatch({ type: 'test' });

        expect(count).toEqual(1);
    });

    it("opts.onAction with array", () => {
        let count = 0;
        const countMiddleware = () => (next: Dispatch) => (action: AnyAction) => {
            count += 1;
            next(action);
        };
        const count2Middleware = () => (next: Dispatch) => (action: AnyAction) => {
            count += 2;
            next(action);
        };
        const core = new DvaCore({
            onAction: [countMiddleware, count2Middleware],
        });
        core.start();
        core._store?.dispatch({ type: 'test' });

        expect(count).toEqual(3);
    });

    it("opts.extraEnhancers", () => {
        let count = 0;
        const countEnhancer: ExtraEnhancers = (
            storeCreator
        ) => (
            reducer,
            preloadedState,
            enhancer,
        ) => {
            const store = storeCreator(reducer, preloadedState, enhancer);
            const oldDispatch = store.dispatch;
            store.dispatch = (action: any) => {
                count += 1;
                return oldDispatch(action);
            };
            return store;
        };
        const core = new DvaCore({
            extraEnhancers: [countEnhancer],
        });
        core.start();
        core._store?.dispatch({ type: 'abc' });

        expect(count).toEqual(1);
    });

    it('opts.onStateChange', () => {
        let savedState = {
            count: 0,
        };
        const core = new DvaCore({
            onStateChange(state) {
                savedState = state;
            },
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

        expect(savedState.count).toEqual(1);
    });
});
