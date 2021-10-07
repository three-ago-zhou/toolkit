import prefixNamespace from '../prefixNamespace';

// interface
import type { Model, Reducer, DvaAction } from '../../types';

describe("prefixNamespace", () => {
    test.skip("model not namespace, should get throwError", () => {
        const noneNamespaceModel: Model = {
            state: {},
            reducers: {
                setState() {},
            },
            effects: {
                *effectTest() {},
            },
            subscriptions: {
                subscriptionsTest() {}
            },
        };
        expect(prefixNamespace(noneNamespaceModel)).toBeUndefined();
        const emptyNamespaceModel: Model = {
            namespace: '',
            state: {},
            reducers: {
                setState() {},
            },
            effects: {
                *effectTest() {},
            },
            subscriptions: {
                subscriptionsTest() {}
            },
        };
        expect(prefixNamespace(emptyNamespaceModel)).toBeUndefined();
    });
    it("should get prefixNamespace Model", () => {
        const model: Model = {
            namespace: "model",
            state: {},
            reducers: {
                setState() {},
            },
            effects: {
                *effectTest() {},
            },
        };
        const prefixNamespaceModel = prefixNamespace(model);
        expect(prefixNamespaceModel).not.toBeUndefined();
        expect(prefixNamespaceModel?.reducers).toHaveProperty('model/setState');
        expect(prefixNamespaceModel?.effects).toHaveProperty('model/effectTest');
    });
    it("array reducers should get prefixNamespace Model", () => {
        function enhancer<S>(
            reducer: Reducer,
        ) {
            return (state: S, action: DvaAction) => {
              return reducer(state, action);
            };
        }
        const model: Model = {
            namespace: "model",
            state: {},
            reducers: [
                {
                    setState() {

                    },
                },
                enhancer,
            ],
            effects: {
                *effectTest() {},
            },
        };
        const prefixNamespaceModel = prefixNamespace(model);
        expect(prefixNamespaceModel).not.toBeUndefined();
        expect(prefixNamespaceModel?.effects).toHaveProperty('model/effectTest');
        expect(prefixNamespaceModel?.reducers).toHaveProperty([0, 'model/setState']);
    });
});

