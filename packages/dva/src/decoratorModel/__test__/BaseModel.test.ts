import DvaCore from "../../core/index";
import BaseModel from "../BaseModel";
import effect from "../effect";
import model from "../model";
import reducer from "../reducer";
import subscription from "../subscription";
import { getModel } from "../utils";

// interface
import type { SubscriptionAPI } from '../../types';

describe("decoratorModel BaseModel", () => {
    it("extends BaseModel", () => {
        interface Users {
            users: string[];
        }
        @model<Users>({
            namespace: 'user',
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

            @reducer()
            createUser({ user }: { user: string }) {
                return {
                    users: [...this.state.users, user],
                };
            };

            @effect()
            *addUser({ user }: { user: string }) {
                yield this.effects.put(this.createUser({ user }));
            };

            @subscription
            setup({ dispatch }: SubscriptionAPI) {
                dispatch({
                    type: 'setState',
                    payload: {
                        users: ['spike'],
                    }
                });
            }
        };
        const userInstance = new User();
        const core = new DvaCore<{
            users: Users,
        }>();
        core.model(getModel(User)!);
        core.start();

        expect(core._store?.getState()).toHaveProperty(['user', 'users'], ['spike']);

        // TODO: instance return type ??
        core._store?.dispatch(
            userInstance.add({
                user: 'hello',
            }) as any
        );

        expect(core._store?.getState()).toHaveProperty(['user', 'users'], ['spike', 'hello']);

        core._store?.dispatch(
            userInstance.addUser({
                user: 'createUser',
            }) as any
        );

        expect(core._store?.getState()).toHaveProperty(['user', 'users'], ['spike', 'hello', 'createUser']);
    });
});
