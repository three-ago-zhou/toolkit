import { END } from "redux-saga";
import DvaCore from "../index";

describe("effects", () => {
    it("put action", done => {
        const core = new DvaCore();
        core.model({
            namespace: 'count',
            state: 0,
            reducers: {
                add(state, { payload }) {
                    return state + payload || 1;
                },
            },
            effects: {
                *addDelay({ payload }, { put, delay }) {
                    yield delay(100);
                    yield put({ type: 'add', payload });
                },
            },
        });
        core.start();
        core._store?.dispatch({ type: 'count/addDelay', payload: 2 });

        expect(core._store?.getState().count).toBe(0);

        setTimeout(() => {
            expect(core._store?.getState().count).toBe(2);
            done();
        }, 200);
    });

    it("put multi effects in order", done => {
        const core = new DvaCore();
        core.model({
            namespace: 'counter',
            state: {
                count: 0,
                resolveCount: 0,
            },
            reducers: {
                dump(state, { payload }) {
                    return {
                        ...state,
                        ...payload,
                    };
                },
            },
            effects: {
                *changeCountDelay({ payload }, { put, delay }) {
                    yield delay(200);
                    yield put({ type: 'dump', payload: { count: payload } });
                },
                *process({ payload }, { put, select }) {
                    yield put.resolve({ type: 'changeCountDelay', payload });
                    const count = yield select((state: any) => state.counter.count);
                    yield put({ type: 'dump', payload: { resolveCount: count } });
                },
            },
        });
        core.start();
        (core._store?.dispatch({ type: 'counter/process', payload: 1 }) as any).then(() => {
            expect(core._store?.getState().counter.resolveCount).toBe(1);
            done();
        });

        expect(core._store?.getState().counter.resolveCount).toBe(0);
    });

    it("take", done => {
        const core = new DvaCore();
        core.model({
            namespace: 'count',
            state: 0,
            reducers: {
                add(state, { payload }) {
                    return state + payload || 1;
                },
            },
            effects: {
                *addDelay({ payload }, { put, delay }) {
                    yield delay(payload.delay || 100);
                    yield put({ type: 'add', payload: payload.amount });
                },
                *test(_action, { put, select, take }) {
                    yield put({ type: 'addDelay', payload: { amount: 2 } });
                    yield take('addDelay/@@end');
                    const count = yield select((state: any) => state.count);
                    yield put({ type: 'addDelay', payload: { amount: count, delay: 0 } });
                },
            },
        });
        core.start();
        core._store?.dispatch({ type: 'count/test' });

        setTimeout(() => {
            expect(core._store?.getState().count).toBe(4);
            done();
        }, 300);
    });

    it("take with array of actions", () => {
        const core = new DvaCore();
        let takenCount = 0;
        core.model({
            namespace: 'count',
            state: null,
            reducers: {
                addRequest() {
                    return 1;
                },
                addFailure() {
                    return -1;
                },
                addSuccess() {
                    return 0;
                },
            },
            effects: {
                *add(action, { put }) {
                    yield put({ type: 'addRequest' });
                    if (action.amount > 0.5) {
                        yield put({ type: 'addSuccess' });
                    } else {
                        yield put({ type: 'addFailure' });
                    }
                },
                *test(action, { put, take }) {
                    yield put({ type: 'add', amount: action.amount });
                    yield take(['addSuccess', 'addFailure']);
                    takenCount += 1;
                },
            },
        });
        core.start();
        core._store?.dispatch({ type: 'count/test', amount: 0 });

        expect(core._store?.getState().count).toBe(-1);

        core._store?.dispatch({ type: 'count/test', amount: 1 });

        expect(core._store?.getState().count).toBe(0);
        expect(takenCount).toBe(2);
    });

    it("dispatch action for other models", () => {
        const core = new DvaCore();
        core.model({
            namespace: 'loading',
            state: false,
            reducers: {
                show() {
                    return true;
                },
            },
        });
        core.model({
            namespace: 'count',
            state: 0,
            effects: {
                *addDelay(_, { put }) {
                    yield put({ type: 'loading/show' });
                },
            },
        });
        core.start();
        core._store?.dispatch({ type: 'count/addDelay' });

        expect(core._store?.getState().loading).toBe(true);
    });

    it("onError", () => {
        const errors: string[] = [];
        const core = new DvaCore({
            onError: (error, dispatch) => {
                error.preventDefault?.();
                errors.push(error.message);
                dispatch?.({ type: 'count/add' });
            },
        });
        core.model({
            namespace: 'count',
            state: 0,
            reducers: {
                add(state, { payload }) {
                    return state + payload || 1;
                },
            },
            effects: {
                *addDelay({ payload }, { put }) {
                    if (!payload) {
                        throw new Error('effect error');
                    } else {
                        yield put({ type: 'add', payload });
                    }
                },
            },
        });
        core.start();
        core._store?.dispatch({ type: 'count/addDelay' });

        expect(errors).toEqual(['effect error']);
        expect(core._store?.getState().count).toBe(1);

        core._store?.dispatch({ type: 'count/addDelay', payload: 2 });

        expect(core._store?.getState().count).toBe(3);
    });

    it("onError: extension", () => {
        const core = new DvaCore({
            onError(err, dispatch, extension) {
                err.preventDefault?.();
                dispatch?.({
                    type: 'err/append',
                    payload: extension,
                });
            },
        });
        core.model({
            namespace: 'err',
            state: [],
            reducers: {
                append(state, action) {
                    return [...state, action.payload];
                },
            },
            effects: {
                // eslint-disable-next-line
                *generate() {
                    throw new Error('Effect error');
                },
            },
        });
        core.start();
        core._store?.dispatch({
            type: 'err/generate',
            payload: 'err.payload',
        });
        const err = core._store?.getState().err;
        expect(err.length).toBe(1);
        expect(err).toHaveProperty([0, 'key'], 'err/generate');
        expect(err).toHaveProperty([0, 'effectArgs', 0, 'type'], 'err/generate');
        expect(err).toHaveProperty([0, 'effectArgs', 0, 'payload'], 'err.payload');
    });

    it("type: takeLatest", done => {
        const core = new DvaCore();
        core.model({
            namespace: 'count',
            state: 0,
            reducers: {
                add(state, { payload }) {
                    return state + payload || 1;
                },
            },
            effects: {
                addDelay: [
                    function*({ payload }, { delay, put }) {
                        yield delay(100);
                        yield put({ type: 'add', payload });
                    },
                    { type: 'takeLatest' },
                ],
            },
        });
        core.start();
        // Only catch the last one.
        core._store?.dispatch({ type: 'count/addDelay', payload: 2 });
        core._store?.dispatch({ type: 'count/addDelay', payload: 3 });
    
        setTimeout(() => {
            expect(core._store?.getState().count).toBe(3);
            done();
        }, 200);
    });

    it("onEffect", done => {
        const SHOW = '@@LOADING/SHOW';
        const HIDE = '@@LOADING/HIDE';
        const core = new DvaCore();
        // Test model should be accessible
        let modelNamespace = null;
        // Test onEffect should be run orderly
        let count = 0;
        let expectedKey = null;
        core.use({
            extraReducers: {
                loading(state = false, action) {
                    switch (action.type) {
                        case SHOW:
                            return true;
                        case HIDE:
                            return false;
                        default:
                            return state;
                    }
                },
            },
            onEffect(effect, { put }, model, key) {
                expectedKey = key;
                modelNamespace = model.namespace;
                return function*(...args) {
                    count *= 2;
                    yield put({ type: SHOW });
                    yield effect(...args);
                    yield put({ type: HIDE });
                };
            },
        });
        core.use({
            onEffect(effect) {
                return function*(...args) {
                    count += 2;
                    yield effect(...args);
                    count += 1;
                };
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
            effects: {
                *addRemote(_, { put, delay }) {
                    yield delay(100);
                    yield put({ type: 'add' });
                },
            },
        });
        core.start();
    
        expect(core._store?.getState().loading).toBe(false);
    
        core._store?.dispatch({ type: 'count/addRemote' });

        expect(core._store?.getState().loading).toBe(true);
        expect(modelNamespace).toBe('count');
        expect(expectedKey).toBe('count/addRemote');
    
        setTimeout(() => {
            expect(core._store?.getState().loading).toBe(false);
            expect(core._store?.getState().count).toBe(1);
            expect(count).toBe(5);
            done();
        }, 200);
    });

    it("return Promise", done => {
        const core = new DvaCore();
        core.model({
            namespace: 'count',
            state: 0,
            reducers: {
                add(state, { payload }) {
                    return state + payload || 1;
                },
            },
            effects: {
                *addDelay({ payload }, { put, delay, select }) {
                    yield delay(payload.delay || 100);
                    yield put({ type: 'add', payload: payload.amount });
                    return yield select<{ count: number }>((state) => state.count);
                },
            },
        });
        core.start();
        const p1 = core._store?.dispatch({
            type: 'count/addDelay',
            payload: { amount: 2 },
        });
        const p2 = core._store?.dispatch({
            type: 'count/add',
            payload: 2,
        });

        expect(p1).toBeInstanceOf(Promise);
        expect(p2).toEqual({ type: 'count/add', payload: 2 });
        expect(core._store?.getState().count).toBe(2);

        (p1 as any).then((count: any) => {
            expect(count).toBe(4);
            expect(core._store?.getState().count).toBe(4);
            done();
        });
    });

    it("return Promises when trigger the same effect multiple times", done => {
        const core = new DvaCore();
        core.model({
            namespace: 'count',
            state: 0,
            reducers: {
                add(state, { payload }) {
                    return state + payload || 1;
                },
            },
            effects: {
                *addDelay({ payload }, { put, delay, select }) {
                    yield delay(payload.delay || 100);
                    yield put({ type: 'add', payload: payload.amount });
                    return yield select((state: any) => state.count);
                },
            },
        });
        core.start();
        const p1 = core._store?.dispatch({
            type: 'count/addDelay',
            payload: { delay: 100, amount: 1 },
        });
        const p2 = core._store?.dispatch({
            type: 'count/add',
            payload: 2,
        });
        const p3 = core._store?.dispatch({
            type: 'count/addDelay',
            payload: { delay: 200, amount: 3 },
        });
        
        expect(p1).toBeInstanceOf(Promise);
        expect(p2).toEqual({ type: 'count/add', payload: 2 });
        expect(core._store?.getState().count).toBe(2);
        (p1 as any).then((count: any) => {
            expect(count).toBe(3);
            expect(core._store?.getState().count).toBe(3);
            (p3 as any).then((count: any) => {
                expect(count).toBe(6);
                expect(core._store?.getState().count).toBe(6);
                done();
            });
        });
    });

    it("debounce action", (done) => {
        const core = new DvaCore();
        core.model({
            namespace: 'count',
            state: 0,
            reducers: {
                add(state, { payload }) {
                    return state + payload || 1;
                },
            },
            effects: {
                addDelay: [
                    function *({ payload }, { put }) {
                        yield put({ type: 'add', payload });
                    },
                    {
                        type: 'debounce',
                        ms: 50,
                    }
                ],
            },
        });
        core.start();
        core._store?.dispatch({ type: 'count/addDelay', payload: 2 });
        core._store?.dispatch({ type: 'count/addDelay', payload: 3 });

        setTimeout(() => {
            expect(core._store?.getState()).toHaveProperty(['count'], 3);
            done();
        }, 100);
    });

    it("debounce action: pattern END", (done) => {
        const core = new DvaCore();
        core.model({
            namespace: 'count',
            state: 0,
            reducers: {
                add(state, { payload }) {
                    return state + payload || 1;
                },
            },
            effects: {
                addDelay: [
                    function *({ payload }, { put }) {
                        yield put({ type: 'add', payload });
                    },
                    {
                        type: 'debounce',
                        ms: 50,
                    }
                ],
            },
        });
        core.start();
        core._store?.dispatch({ type: 'count/addDelay', payload: 2 });
        core._store?.dispatch({ type: 'count/addDelay', payload: 3 });
        core._store?.dispatch(END);

        setTimeout(() => {
            expect(core._store?.getState()).toHaveProperty(['count'], 0);
            done();
        }, 100);
    });

    it('type: poll', done => {
        const core = new DvaCore();
        core.model({
            namespace: 'count',
            state: 0,
            reducers: {
                add(state, { payload }) {
                    return state + payload || 1;
                },
            },
            effects: {
                pollAdd: [
                    function*(_, { put }) {
                        yield put({ type: 'add', payload: 1 });
                    },
                    {
                        type: 'poll',
                        delay: 1000,
                    },
                ],
            },
        });
        core.start();
        core._store?.dispatch({ type: 'count/pollAdd-start' });
    
        setTimeout(() => {
            core._store?.dispatch({ type: 'count/pollAdd-stop' });
            expect(core._store?.getState().count).toBe(2);
            done();
        }, 2000);
    });

    it('type: poll and stop', done => {
        const core = new DvaCore();
        core.model({
            namespace: 'count',
            state: 0,
            reducers: {
                add(state, { payload }) {
                    return state + payload || 1;
                },
            },
            effects: {
                pollAdd: [
                    function*(_, { put }) {
                        yield put({ type: 'add', payload: 1 });
                    },
                    { type: 'poll', delay: 1000 },
                ],
            },
        });
        core.start();
        core._store?.dispatch({ type: 'count/pollAdd-start' });
        // should work one time
        core._store?.dispatch({ type: 'count/pollAdd-stop' });
    
        setTimeout(() => {
            expect(core._store?.getState().count).toEqual(1);
            done();
        }, 200);
    });

    it('type: poll, start many time', done => {
        const core = new DvaCore();
        core.model({
            namespace: 'count',
            state: 0,
            reducers: {
                add(state, { payload }) {
                    return state + payload || 1;
                },
            },
            effects: {
                pollAdd: [
                    function*({ payload }, { put }) {
                        yield put({ type: 'add', payload });
                    },
                    { type: 'poll', delay: 1000 },
                ],
            },
        });
        core.start();
        core._store?.dispatch({ type: 'count/pollAdd-start', payload: 2 });
        
        setTimeout(() => {
            // second start should not work
            core._store?.dispatch({ type: 'count/pollAdd-start', payload: 3 });
            core._store?.dispatch({ type: 'count/pollAdd-stop' });
            expect(core._store?.getState().count).toEqual(6);
            done();
        }, 3000);
    });

    it('type: poll, start and stop many time', done => {
        const core = new DvaCore();
        core.model({
            namespace: 'count',
            state: 0,
            reducers: {
                add(state, { payload }) {
                    return state + payload || 1;
                },
            },
            effects: {
                pollAdd: [
                    function*(_, { put }) {
                        yield put({ type: 'add', payload: 1 });
                    },
                    { type: 'poll', delay: 1000 },
                ],
            },
        });
        core.start();
        core._store?.dispatch({ type: 'count/pollAdd-start' });
        core._store?.dispatch({ type: 'count/pollAdd-stop' });
        core._store?.dispatch({ type: 'count/pollAdd-start' });
    
        setTimeout(() => {
            core._store?.dispatch({ type: 'count/pollAdd-stop' });
            expect(core._store?.getState().count).toEqual(3);
            done();
        }, 2000);
    });
});