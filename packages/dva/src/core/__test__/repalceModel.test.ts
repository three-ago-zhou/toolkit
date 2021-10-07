import DvaCore from "../index";

describe("app.replaceModel", () => {
    it("should not be available before app.start() get called", () => {
        const core = new DvaCore();
        expect(core).toHaveProperty('replaceModel', undefined);
    });

    it("should add model if it doesn't exist", () => {
        const core = new DvaCore();
        core.start();

        expect(core.replaceModel).toBeDefined()

        const oldCount = core._models.length;
        core.replaceModel?.({
            namespace: 'users',
            state: [],
            reducers: {
                add(state, { payload }) {
                    return [...state, payload];
                },
            },
        });

        expect(core._models.length).toBe(oldCount + 1);

        core._store?.dispatch({ type: 'users/add', payload: 'jack' });
        const state = core._store?.getState();

        expect(state.users).toEqual(['jack']);
    });

    it("should run new reducers if model exists", () => {
        const core = new DvaCore();
        core.model({
            namespace: 'users',
            state: ['foo'],
            reducers: {
                add(state, { payload }) {
                    return [...state, payload];
                },
            },
        });
        core.start();
        const oldCount = core._models.length;
        core.replaceModel?.({
            namespace: 'users',
            state: ['bar'],
            reducers: {
                add(state, { payload }) {
                    return [...state, 'world', payload];
                },
                clear() {
                    return [];
                },
            },
        });
    
        expect(core._models.length).toEqual(oldCount);

        let state = core._store?.getState();

        expect(state.users).toEqual(['foo']);
    
        core._store?.dispatch({ type: 'users/add', payload: 'jack' });
        state = core._store?.getState();

        expect(state.users).toEqual(['foo', 'world', 'jack']);
    
        // test new added action
        core._store?.dispatch({ type: 'users/clear' });
        state = core._store?.getState();

        expect(state.users).toEqual([]);
    });

    it('should run new effects if model exists', () => {
        const core = new DvaCore();
        core.model({
            namespace: 'users',
            state: [],
            reducers: {
                setter(state, { payload }) {
                    return [...state, payload];
                },
            },
            effects: {
                *add({ payload }, { put }) {
                    yield put({
                        type: 'setter',
                        payload,
                    });
                },
            },
        });
        core.start();
        core.replaceModel?.({
            namespace: 'users',
            state: [],
            reducers: {
                setter(state, { payload }) {
                    return [...state, payload];
                },
            },
            effects: {
                *add(_, { put }) {
                    yield put({
                        type: 'setter',
                        payload: 'mock',
                    });
                },
            },
        });
        core._store?.dispatch({ type: 'users/add', payload: 'jack' });
        const state = core._store?.getState();

        expect(state.users).toEqual(['mock']);
    });

    it('should run subscriptions after replaceModel', () => {
        const core = new DvaCore();
        core.model({
            namespace: 'users',
            state: [],
            reducers: {
                add(state, { payload }) {
                    return [...state, payload];
                },
            },
            subscriptions: {
                setup({ dispatch }) {
                    // should return unlistener but omitted here
                    dispatch({ type: 'add', payload: 1 });
                    return () => {};
                },
            },
        });
        core.start();
        core.replaceModel?.({
            namespace: 'users',
            state: [],
            reducers: {
                add(state, { payload }) {
                    return [...state, payload];
                },
            },
            subscriptions: {
                setup({ dispatch }) {
                    // should return unlistener but omitted here
                    dispatch({ type: 'add', payload: 2 });
                    return () => {};
                },
            },
        });
        const state = core._store?.getState();
        // This should be an issue but can't be avoided with dva
        // To avoid, in client code, setup method should be idempotent when running multiple times
        expect(state.users).toEqual([1, 2]);
    });

    it('should remove old subscription listeners after replaceModel', () => {
        const core = new DvaCore();
        let emitterCount = 0;
        function run() {
            emitterCount += 1;
        };
        let start: any = null;
        core.model({
            namespace: 'users',
            state: [],
            subscriptions: {
                setup() {
                    start = run;
                    return () => {
                        start = null;
                    };
                },
            },
        });
        core.start();
        start && start();
        core.replaceModel?.({
            namespace: 'users',
            state: [],
        });
        start && start();
        expect(emitterCount).toEqual(1);
    });

    test.skip('should trigger onError if error is thown after replaceModel', () => {
        let triggeredError = false;
        const core = new DvaCore({
            onError(_e, dispatch, extension) {
                triggeredError = true;
                expect(dispatch).toEqual(core._store?.dispatch);
                expect(extension).toHaveProperty(['key'], 'users/add');
                expect(extension).toHaveProperty(['effectArgs', 0, '__dva_reject']);
                expect(extension).toHaveProperty(['effectArgs', 0, '__dva_resolve']);
                expect(extension).toHaveProperty(['effectArgs', 0, 'type'], 'users/add');
            },
        });
        core.model({
            namespace: 'users',
            state: [],
        });
        core.start();
        core.replaceModel?.({
            namespace: 'users',
            state: [],
            effects: {
                *add() {
                    yield 'fake';
                    throw new Error('fake error');
                },
            },
        });
        core._store?.dispatch({
            type: 'users/add',
        });
        expect(triggeredError).toEqual(true);
    });
});

