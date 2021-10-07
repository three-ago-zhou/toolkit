import model from '../model';
import reducer from '../reducer';
import effect from '../effect';
import BaseModel from '../BaseModel';
import { getModel } from '../utils';
import DvaCore from '../../core/index';
import modelsContainer from '../modelContainer';

// interface
import { DvaAction } from '../../types';

beforeEach(() => {
    modelsContainer.clear();
});

describe("decoratorModel reducer", () => {
    it("enhancer", () => {
        interface ModelState {
            count: number;
        }
        let count = 0;
        function enhancer(state: ModelState, action: DvaAction) {
            if (action.type === 'model/add') {
                count = state.count;
            }
            return {
                ...state,
                count: 6,
            };
        }
        @model<ModelState>({
            namespace: 'model',
            state: {
                count: 0,
            },
        })
        class Model extends BaseModel<ModelState>{
            @reducer<ModelState>(enhancer)
            add({ count }: ModelState) {
                return {
                    ...this.state,
                    count: this.state.count + count,
                };
            };
        };
        const core = new DvaCore();
        core.model(getModel(Model)!);
        core.start();
        core._store?.dispatch({
            type: 'model/add',
            payload: {
                count: 2,
            }
        });

        expect(core._store?.getState()).toHaveProperty(['model', 'count'], 6);
        expect(count).toBe(2);
    });
    it('effects put reducers when reducers is enhancer', () => {
        interface ModelState {
            count: number;
        }
        let count = 0;
        function enhancer(state: ModelState, action: DvaAction) {
            if (action.type === 'model/add') {
                count = state.count;
            }
            return {
                ...state,
                count: state.count + 1,
            };
        }
        @model<ModelState>({
            namespace: 'model',
            state: {
                count: 0,
            },
        })
        class Model extends BaseModel<ModelState>{
            @effect()
            *putSetState() {
                yield this.effects.put({ type: 'add', payload: { count: 1 } });
            };
            @reducer<ModelState>(enhancer)
            add({ count }: { count: number }, second?: number) {
                return {
                    ...this.state,
                    count: this.state.count + count + (second ?? 0),
                };
            };
        };
        const core = new DvaCore();
        core.model(getModel(Model)!);
        core.start();
        core._store?.dispatch({ type: 'model/putSetState' });
        const instance = new Model();
        core._store?.dispatch(instance.add({ count: 1 }, 1) as any);

        expect(core._store?.getState()).toHaveProperty(['model', 'count'], 5);
        expect(count).toBe(4);
    });
});
