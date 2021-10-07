import React from 'react';
import {
    render,
    fireEvent,
    cleanup,
    waitFor
} from '@testing-library/react';

// tool
import DvaCore from '../core/index';
import dynamic from '../dynamic';
import modelContainer from '../decoratorModel/modelContainer';
import BaseModel from "../decoratorModel/BaseModel";
import effect from "../decoratorModel/effect";
import model from "../decoratorModel/model";
import reducer from "../decoratorModel/reducer";
import subscription from "../decoratorModel/subscription";

// interface
import type { Model, SubscriptionAPI } from '../types';


beforeEach(() => {
    modelContainer.clear();
});
afterEach(cleanup);

describe("dynamic", () => {
    it("render dynamic Component", async () => {
        interface Users {
            user: string[];
        };
        const user: Model<Users> = {
            namespace: 'users',
            state: {
                user: [],
            },
            effects: {
                *addUser({ payload }, { put }) {
                    yield put({ type: 'add', payload });
                },
            },
            reducers: {
                add(state, { payload }) {
                    return {
                        ...state,
                        user: [...state.user, ...payload?.user!],
                    };
                },
            },
        };
        
        interface IClassModel {
            count: number;
        };
        @model<IClassModel>({
            namespace: 'classModel',
            state: {
                count: 0,
            },
        })
        class ClassModel extends BaseModel<IClassModel> {
            @reducer<IClassModel>()
            add({ count }: IClassModel) {
                return {
                    ...this.state,
                    count: this.state.count + count,
                };
            };
            @effect()
            *addCount({ count }: IClassModel) {
                yield this.effects.put({
                    type: 'add',
                    payload: {
                        count,
                    },
                });
            }
            @subscription
            setup({ dispatch }: SubscriptionAPI) {
                dispatch({
                    type: 'setState',
                    payload: {
                        count: 1,
                    },
                });
            }
        }
        const core = new DvaCore<{
            users: Users,
        }>();
        core.start();
        const UserPage = () => {
            return (
                <div>
                    <div data-testid="dynamic-id">
                        hello
                    </div>
                    <button
                        data-testid="click-id"
                        onClick={() => {
                            core._store?.dispatch({ type: 'classModel/add', payload: { count: 1 } });
                        }}
                    >
                        click me
                    </button>
                </div>
            );
        };
        const UserPageComponent = dynamic({
            app: core,
            models: () => [
                new Promise((r) => r({ default: user })),
                new Promise((r) => r({ default: ClassModel })),
            ],
            component: () => new Promise((r) => r({ default: UserPage })),
        });
        const { getByTestId } = await waitFor(() => render(<UserPageComponent />));

        expect(getByTestId('dynamic-id').innerHTML).toBe('hello');
        expect(core._store?.getState()).toHaveProperty(['users', 'user'], []);
        expect(core._store?.dispatch({ type: 'users/addUser', payload: { user: ['hello'] } }));
        expect(core._store?.getState()).toHaveProperty(['users', 'user'], ['hello']);
        expect(core._store?.getState()).toHaveProperty(['classModel', 'count'], 1);

        core._store?.dispatch({
            type: 'classModel/addCount',
            payload: {
                count: 2,
            },
        });

        expect(core._store?.getState()).toHaveProperty(['classModel', 'count'], 3);
        fireEvent.click(getByTestId('click-id'));
        expect(core._store?.getState()).toHaveProperty(['classModel', 'count'], 4);
    });
});
