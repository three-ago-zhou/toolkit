import DvaCore from "../index";

describe("subscriptions", () => {
    it("dispatch action", () => {
        const core = new DvaCore();
        core.model({
            namespace: 'count',
            state: 0,
            reducers: {
                add(state, { payload }) {
                    return state + payload || 1;
                },
            },
            subscriptions: {
                setup({ dispatch }) {
                    dispatch({ type: 'add', payload: 2 });
                },
            },
        });
        core.start();
        expect(core._store?.getState().count).toEqual(2);
    });

    it('dispatch action with namespace will get a warn', () => {
        const core = new DvaCore();
        core.model({
            namespace: 'count',
            state: 0,
            reducers: {
                add(state, { payload }) {
                    return state + payload || 1;
                },
            },
            subscriptions: {
                setup({ dispatch }) {
                    dispatch({ type: 'add', payload: 2 });
                },
            },
        });
        core.start();
        expect(core._store?.getState().count).toEqual(2);
    });

    it('dispatch not valid action', () => {
        const core = new DvaCore();
        core.model({
            namespace: 'count',
            state: 0,
            subscriptions: {
                setup({ dispatch }) {
                    dispatch('add');
                },
            },
        });
        expect(() => {
            core.start();
        }).toThrowError(/dispatch: action should be a plain Object with type/);
    });

    it('dispatch action for other models', () => {
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
            subscriptions: {
                setup({ dispatch }) {
                    dispatch({ type: 'loading/show' });
                },
            },
        });
        core.start();
        expect(core._store?.getState().loading).toEqual(true);
    });

    it('onError', () => {
        const errors: any[] = [];
        const core = new DvaCore({
            onError: error => {
                expect(error.message).toBe('subscription error')
                errors.push(error.message);
            },
        });
        core.model({
            namespace: '-',
            state: {},
            subscriptions: {
                setup(_obj, done) {
                    done('subscription error');
                },
            },
        });
        core.start();
        expect(errors).toEqual(['subscription error']);
    });

    it('onError async', done => {
        const errors: any[] = [];
        const core = new DvaCore({
            onError: error => {
                errors.push(error.message);
            },
        });
        core.model({
            namespace: '-',
            state: {},
            subscriptions: {
                setup(_obj, done) {
                    setTimeout(() => {
                        done('subscription error');
                    }, 100);
                },
            },
        });
        core.start();
        expect(errors).toEqual([]);
        setTimeout(() => {
            expect(errors).toEqual(['subscription error']);
            done();
        }, 200);
    });
});
