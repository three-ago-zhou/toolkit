import DvaCore from '../index';

describe("app.model", () => {
    it("dynamic model", () => {
        interface State {
            users: string[];
            tasks: string[]
        };
        let count = 0;
        const core = new DvaCore<State>();
        core.model({
            namespace: 'users',
            state: [],
            reducers: {
                add(state, { payload }) {
                    return [...state, payload]
                }
            },
        });
        core.start();

        // inject model
        core.model({
            namespace: 'tasks',
            state: [],
            reducers: {
                add(state, { payload }) {
                    return [...state, payload];
                },
            },
            effects: {},
            subscriptions: {
                setup() {
                    count += 1;
                },
            },
        });

        // subscriptions
        expect(count).toBe(1);

        // reducers
        core._store?.dispatch({ type: 'tasks/add', payload: 'foo' });
        core._store?.dispatch({ type: 'users/add', payload: 'foo' });
        const state = core._store?.getState();
        expect(state?.tasks).toEqual(['foo']);
        expect(state?.tasks).toEqual(['foo']);
    });

    it("don't inject if exists", () => {
        const core = new DvaCore();
        const model = {
            namespace: 'count',
            state: 0,
            subscriptions: {
                setup() {},
            },
        };
        core.model(model);
        core.start();
        expect(() => {
          core.model(model);
        }).toThrow(/\[app\.model\] namespace should be unique/);
    });

    it("unmodel", () => {
        const core = new DvaCore<{
            a: number;
            b: number;
        }>();
        core.model({
            namespace: 'a',
            state: 0,
            reducers: {
                add(state) {
                    return state + 1;
                },
            },
        });
        core.model({
            namespace: 'b',
            state: 0,
            reducers: {
                add(state) {
                    return state + 1;
                },
            },
            effects: {
                *addBoth(_, { put }) {
                    yield put({ type: 'a/add' });
                    yield put({ type: 'add' });
                },
            },
        });
        core.start();
        core.unmodel('b');

        core._store?.dispatch({ type: 'b/addBoth' });
        const { a, b } = core._store?.getState()!;
        expect({ a, b }).toEqual({ a:0, b: undefined });
    });

    it("don't run saga when effects is not provided", () => {
        let count = 0;
        const core = new DvaCore<{
            users: string[];
            tasks: string[];
        }>();
        core.model({
            namespace: 'users',
            state: [],
            reducers: {
                add(state, { payload }) {
                    return [...state, payload];
                },
            },
        });
        core.start();
        // inject model
        core.model({
            namespace: 'tasks',
            state: [],
            reducers: {
                add(state, { payload }) {
                    return [...state, payload];
                },
            },
            subscriptions: {
                setup() {
                    count += 1;
                }
            }
        });
        // subscriptions
        expect(count).toBe(1);

        // reducers
        core._store?.dispatch({ type: 'tasks/add', payload: 'foo' });
        core._store?.dispatch({ type: 'users/add', payload: 'foo' });
        const state = core._store?.getState();
        expect(state?.users).toEqual(['foo']);
        expect(state?.tasks).toEqual(['foo']);

        // effects is not taken
        expect(count).toEqual(1);
    });

    it("unmodel with asyncReducers", () => {
        const core = new DvaCore();
        core.model({
            namespace: 'a',
            state: 0,
            reducers: {
                add(state) {
                    return state + 1;
                },
            },
        });
        core.start();
        core.model({
            namespace: 'b',
            state: 0,
            reducers: {
                add(state) {
                    return state + 1;
                },
            },
            effects: {
                *addBoth(_, { put }) {
                    yield put({ type: 'a/add' });
                    yield put({ type: 'add' });
                },
            },
        });
        core._store?.dispatch({ type: 'b/addBoth' });
        core.unmodel('b');
        core._store?.dispatch({ type: 'b/addBoth' });
        const { a, b } = core._store?.getState();
        expect({ a, b }).toEqual({ a: 1, b: undefined });
    });

    test.skip("unmodel, subscription don't return function", () => {
        const core = new DvaCore();
        core.model({
            namespace: 'a',
            state: 0,
            subscriptions: {
                a() {},
            },
        });
        core.start();
        core.unmodel('a');
    });

    test.skip('unmodel with other type of effects', () => {
        const core = new DvaCore();
        let countA = 0;
        let countB = 0;
        let countC = 0;
        let countD = 0;
        core.model({
            namespace: 'a',
            state: 0,
            effects: {
                a: [
                    function*() {
                        yield (countA += 1);
                    },
                    { type: 'throttle', ms: 100 },
                ],
                b: [
                    function*() {
                        yield (countB += 1);
                    },
                    { type: 'takeEvery' },
                ],
                c: [
                    function*() {
                        yield (countC += 1);
                    },
                    { type: 'takeLatest' },
                ],
                d: [
                    function*({ take }) {
                        while (true) {
                        yield take('a/d');
                        countD += 1;
                        }
                    },
                    { type: 'watcher' },
                ],
            },
        });
        core.start();
        core._store?.dispatch({ type: 'a/a' });
        core._store?.dispatch({ type: 'a/b' });
        core._store?.dispatch({ type: 'a/c' });
        core._store?.dispatch({ type: 'a/d' });
        expect([countA, countB, countC, countD]).toEqual([1, 1, 1, 1]);
        core.unmodel('a');
        // core._store?.dispatch({ type: 'a/b' });
        // core._store?.dispatch({ type: 'a/c' });
        // core._store?.dispatch({ type: 'a/d' });
        expect([countA, countB, countC, countD]).toEqual([1, 1, 1, 1]);
    });
    
    it('register the model without affecting itself', () => {
        const countModel = {
            namespace: 'count',
            state: 0,
            reducers: {
                add() {},
            },
        };
        const core = new DvaCore();
        core.model(countModel);
        core.start();
        expect(Object.keys(countModel.reducers)).toEqual(['add']);
    });
});
