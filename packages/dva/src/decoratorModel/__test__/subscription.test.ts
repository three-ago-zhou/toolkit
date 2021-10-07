import DvaCore from '../../core/index';
import BaseModel from '../BaseModel';
import model from '../model';
import reducer from '../reducer';
import subscription from '../subscription';
import { getModel } from '../utils';
import modelsContainer from '../modelContainer';

// interface
import type { SubscriptionAPI } from '../../types';

beforeEach(() => {
    modelsContainer.clear();
});

describe("decoratorModel subscription", () => {
    it("dispatch action", () => {
        interface ModelState {
            count: number;
        }
        @model<ModelState>({
            namespace: 'count',
            state: {
                count: 0,
            }
        })
        class Model extends BaseModel<ModelState> {
            @reducer<ModelState>()
            add({ count }: ModelState) {
                return {
                    count: this.state.count + count,
                }
            };
            @subscription
            setup({ dispatch }: SubscriptionAPI) {
                dispatch({ type: 'add', payload: { count: 2 } });
            };
        };
        const core = new DvaCore();
        core.model(getModel(Model)!);
        core.start();
        expect(core._store?.getState()).toHaveProperty(['count', 'count'], 2);
    });

    it('dispatch not valid action', () => {
        interface ModelState {
            count: number;
        }
        @model<ModelState>({
            namespace: 'count',
            state: {
                count: 0,
            }
        })
        class Model extends BaseModel<ModelState> {
            @reducer<ModelState>()
            add({ count }: ModelState) {
                return {
                    count: this.state.count + count,
                }
            };
            @subscription
            setup({ dispatch }: SubscriptionAPI) {
                dispatch('add');
            };
        };
        const core = new DvaCore();
        core.model(getModel(Model)!);
        expect(() => {
            core.start();
        }).toThrowError(/dispatch: action should be a plain Object with type/);
    });

    it('dispatch action for other models', () => {
        interface ModelState {
            loading: boolean;
        }
        @model<ModelState>({
            namespace: 'loading',
            state: {
                loading: false,
            },
        })
        class Model extends BaseModel<ModelState> {
            @reducer<ModelState>()
            show() {
                return {
                    loading: true,
                }
            };
            @subscription
            setup({ dispatch }: SubscriptionAPI) {
                dispatch({ type: 'show' });
            };
        };
        const core = new DvaCore();
        core.model(getModel(Model)!);
        core.start();
        expect(core._store?.getState()).toHaveProperty(['loading', 'loading'], true);
    });
});
