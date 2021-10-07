import DvaCore from "../../core/index";
import BaseModel from "../BaseModel";
import effect from "../effect";
import model from "../model";
import modelsContainer from "../modelContainer";
import reducer from "../reducer";
import subscription from "../subscription";
import { getModel } from "../utils";

beforeEach(() => {
    modelsContainer.clear();
});

describe("decoratorModel model", () => {
    it("should have model if exist namespace", () => {
        @model({
            namespace: 'model',
            state: {
                count: 0,
            },
        })
        class Model {};
        const core = new DvaCore();
        const _model = getModel(Model);
        core.model(_model!);
        core.start();

        expect(_model).toHaveProperty('namespace', 'model');
        expect(_model).toEqual({
            namespace: 'model',
            state: {
                count: 0,
            },
            effects: {},
            reducers: {},
            subscriptions: {},
        });
        expect(core._store?.getState()).toHaveProperty(['model', 'count'], 0);
    });

    test.skip("should be get undefined, if namespace is undefined", () => {
        @model({})
        class ModelTwo {};

        expect(getModel(ModelTwo)).toBeUndefined();
    });

    test.skip("should get new state if model exist", () => {
        const core = new DvaCore();
        @model({
            namespace: 'model',
            state: {
                count: 0,
            }
        })
        class Model {}
        const _model = getModel(Model);
        core.model(_model!);
        core.start();

        expect(core._store?.getState()).toHaveProperty(['model', 'count'], 0);

        @model({
            namespace: 'model',
        })
        class Replace {}
        const _replace = getModel(Replace);
        core.replaceModel?.(_replace!);

        expect(core._store?.getState()).toHaveProperty(['model', 'count'], 0);
    });

    it("dynamic model", () => {
        interface Users {
            users: string[];
        }
        interface Tasks {
            tasks: string[];
        }
        let count = 0;
        @model<Users>({
            namespace: 'users',
            state: {
                users: [],
            },
        })
        class User extends BaseModel<Users> {
            @reducer()
            add({ user }: { user: string }) {
                return {
                    users: [...this.state.users, user],
                }
            };
        };
        const core = new DvaCore<{
            users: Users,
            tasks: Tasks,
        }>();
        core.model(getModel(User)!);
        core.start();

        // inject model
        @model<Tasks>({
            namespace: 'tasks',
            state: {
                tasks: [],
            },
        })
        class Task extends BaseModel<Tasks> {
            @reducer()
            add({ task }: { task: string }) {
                return {
                    tasks: [...this.state.tasks, task],
                }
            };
            @subscription
            setup() {
                count += 1;
            };
        };
        core.model(getModel(Task)!);

        // subscriptions
        expect(count).toBe(1);

        // reducers
        core._store?.dispatch({ type: 'tasks/add', payload: { task: 'foo' } });
        core._store?.dispatch({ type: 'users/add', payload: { user: 'foo' } });
        const state = core._store?.getState();
        expect(state?.users.users).toEqual(['foo']);
        expect(state?.tasks.tasks).toEqual(['foo']);
    });

    it("unmodel", () => {
        interface A {
            a: number;
        };
        interface B {
            b: number;
        }
        @model<A>({
            namespace: 'a',
            state: {
                a: 0,
            },
        })
        class AModel extends BaseModel<A> {
            @reducer()
            add() {
                return {
                    a: this.state.a + 1,
                };
            }
        };
        @model<B>({
            namespace: 'b',
            state: {
                b: 0,
            },
        })
        class BModel extends BaseModel<B> {
            @reducer()
            add() {
                return {
                    b: this.state.b + 1,
                };
            };
            @effect()
            *addBoth() {
                yield this.effects.put({ type: 'a/add' });
                yield this.effects.put({ type: 'add' });
            };
        };
        const core = new DvaCore<{
            a: A;
            b: B;
        }>();
        core.model(getModel(AModel)!);
        core.model(getModel(BModel)!);
        core.start();
        core.unmodel('b');
        core._store?.dispatch({ type: 'b/addBoth' });
        const { a, b } = core._store?.getState()!;

        expect({ a, b }).toEqual({
            a: {
                a: 0,
            },
            b: undefined,
        });
        expect(modelsContainer.has('b')).toBe(false);
        expect(modelsContainer.has('a')).toBe(true);
    });
});
