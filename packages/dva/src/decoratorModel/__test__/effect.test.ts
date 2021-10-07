import { END } from "redux-saga";
import model from '../model';
import reducer from '../reducer';
import effect from '../effect';
import BaseModel from '../BaseModel';
import { getModel } from '../utils';
import DvaCore from '../../core/index';
import modelsContainer from '../modelContainer';

beforeEach(() => {
    modelsContainer.clear();
});

const delay = (timeout: number) => new Promise(resolve => setTimeout(resolve, timeout));

describe("decoratorModel effects", () => {
    it("put action", (done) => {
        interface ModelState {
            count: number;
        }
        @model<ModelState>({
            namespace: 'model',
            state: {
                count: 0,
            },
        })
        class Model extends BaseModel<ModelState>{
            @effect()
            *addDelay({ count }: ModelState) {
                yield this.effects.call(delay, 100);
                yield this.effects.put({ type: 'add', payload: { count, } });
            };
            @reducer<ModelState>()
            add({ count }: ModelState) {
                return {
                    ...this.state,
                    count: this.state.count + count,
                }
            };
        };
        const core = new DvaCore();
        core.model(getModel(Model)!);
        core.start();
        core._store?.dispatch({ type: 'model/addDelay', payload: { count: 2 } });

        expect(core._store?.getState()).toHaveProperty(['model', 'count'], 0);

        setTimeout(() => {
            expect(core._store?.getState()).toHaveProperty(['model', 'count'], 2);
            done();
        }, 200);
    });

    it("put multi effects in order", done => {
        interface ModelState {
            count: number;
            resolveCount: number;
        }
        @model<ModelState>({
            namespace: 'counter',
            state: {
                count: 0,
                resolveCount: 0,
            },
        })
        class Model extends BaseModel<ModelState>{
            @effect()
            *changeCountDelay({ count }: ModelState) {
                yield this.effects.call(delay, 200);
                yield this.effects.put({ type: 'dump', payload: { count } });
            };
            @effect()
            *process({ count }: Partial<ModelState>) {
                yield this.effects.put.resolve({ type: 'changeCountDelay', payload: { count } });
                const {
                    count: _count,
                } = yield this.effects.select<{ counter: ModelState }>((state) => ({
                    count: state.counter.count
                }));
                yield this.effects.put({ type: 'dump', payload: { resolveCount: _count } });
            };
            @reducer<ModelState>()
            dump(payload: ModelState) {
                return {
                    ...this.state,
                    ...payload,
                };
            };
        };
        const core = new DvaCore();
        core.model(getModel(Model)!);
        core.start();
        (core._store?.dispatch({ type: 'counter/process', payload: { count: 1 } }) as any).then(() => {
            expect(core._store?.getState().counter.resolveCount).toBe(1);
            done();
        });

        expect(core._store?.getState().counter.resolveCount).toBe(0);
    });

    it("take", done => {
        interface ModelState {
            amount: number;
        }
        @model<ModelState>({
            namespace: 'count',
            state: {
                amount: 0,
            },
        })
        class Model extends BaseModel<ModelState>{
            @effect()
            *addDelay({ delay: _delay, amount }: { delay: number, amount: number }) {
                yield this.effects.call(delay, _delay || 100);
                yield this.effects.put({ type: 'add', payload: { amount } });
            };
            @effect()
            *test() {
                yield this.effects.put({ type: 'addDelay', payload: { amount: 2 } });
                yield this.effects.take('addDelay/@@end');
                const {
                    amount
                } = yield this.effects.select<{ count: ModelState }>((state) => ({ amount: state.count.amount }));
                yield this.effects.put({ type: 'addDelay', payload: { amount, delay: 0 } });
            };
            @reducer<ModelState>()
            add({ amount }: ModelState) {
                return {
                    ...this.state,
                    amount: this.state.amount + amount,
                }
            };
        };
        const core = new DvaCore();
        core.model(getModel(Model)!);
        core.start();
        core._store?.dispatch({ type: 'count/test' });

        setTimeout(() => {
            expect(core._store?.getState().count.amount).toBe(4);
            done();
        }, 300);
    });

    it("take with array of actions", () => {
        interface ModelState {
            count: number;
        }
        @model<ModelState>({
            namespace: 'count',
            state: {
                count: 0,
            },
        })
        class Model extends BaseModel<ModelState>{
            @effect()
            *add({ amount }: { amount: number }) {
                yield this.effects.put({ type: 'addRequest' });
                if (amount > 0.5) {
                    yield this.effects.put({ type: 'addSuccess' });
                } else {
                    yield this.effects.put({ type: 'addFailure' });
                }
            };
            @effect()
            *test({ amount }: { amount: number }) {
                yield this.effects.put({ type: 'add', payload: { amount } });
                yield this.effects.take(['addSuccess', 'addFailure']);
                takenCount += 1;
            };
            @reducer()
            addRequest() {
                return {
                    ...this.state,
                    count: 1,
                };
            };
            @reducer()
            addFailure() {
                return {
                    ...this.state,
                    count: -1,
                };
            };
            @reducer()
            addSuccess() {
                return {
                    ...this.state,
                    count: 0,
                };
            };
        };
        const core = new DvaCore();
        let takenCount = 0;
        core.model(getModel(Model)!);
        core.start();
        core._store?.dispatch({ type: 'count/test', payload: { amount: 0 } });

        expect(core._store?.getState().count.count).toBe(-1);

        core._store?.dispatch({ type: 'count/test', payload: { amount: 1 } });

        expect(core._store?.getState().count.count).toBe(0);
        expect(takenCount).toBe(2);
    });

    it("dispatch action for other models", () => {
        const core = new DvaCore();
        @model({
            namespace: 'loading',
            state: {
                loading: false,
            },
        })
        class Loading extends BaseModel{
            @reducer()
            show() {
                return {
                    loading: true,
                };
            };
        };
        @model({
            namespace: 'count',
        })
        class Count extends BaseModel{
            @effect()
            *addDelay() {
                yield this.effects.put({ type: 'loading/show' });
            };
        }
        core.model(getModel(Loading)!);
        core.start();
        core.model(getModel(Count)!);
        core._store?.dispatch({ type: 'count/addDelay' });

        expect(core._store?.getState()).toHaveProperty(['loading', 'loading'], true);
    });

    it("type: takeLatest", done => {
        @model({
            namespace: 'count',
            state: {
                count: 0,
            }
        })
        class Count extends BaseModel<{ count: number }>{
            @effect({
                type: 'takeLatest',
            })
            *addDelay(payload: { count: number }) {
                yield this.effects.call(delay, 100);
                yield this.effects.put({ type: 'add', payload });
            };
            @reducer()
            add({ count }: { count: number }) {
                return {
                    count: this.state.count + count,
                };
            };
        }
        const core = new DvaCore();
        core.model(getModel(Count)!);
        core.start();
        // Only catch the last one.
        core._store?.dispatch({ type: 'count/addDelay', payload: { count: 2 } });
        core._store?.dispatch({ type: 'count/addDelay', payload: { count: 3 } });
    
        setTimeout(() => {
            expect(core._store?.getState()).toHaveProperty(['count', 'count'], 3);
            done();
        }, 200);
    });

    it("return Promise", done => {
        @model({
            namespace: 'count',
            state: {
                count: 0,
            }
        })
        class Count extends BaseModel<{ count: number }>{
            @effect({
                type: 'takeLatest',
            })
            *addDelay({ delay: _delay, amount }: { amount: number, delay: number }): any {
                yield this.effects.call(delay, _delay || 100);
                yield this.effects.put({ type: 'add', payload: { count: amount } });
                return yield this.effects.select((state: any) => ({ count: state.count.count }));
            };
            @reducer()
            add({ count }: { count: number }) {
                return {
                    count: this.state.count + count,
                };
            };
        }
        const core = new DvaCore();
        core.model(getModel(Count)!);
        core.start();
        const p1 = core._store?.dispatch({
            type: 'count/addDelay',
            payload: { amount: 2 },
        });
        const p2 = core._store?.dispatch({
            type: 'count/add',
            payload: {
                count: 2
            },
        });

        expect(p1).toBeInstanceOf(Promise);
        expect(p2).toEqual({
            type: 'count/add',
            payload: {
                count: 2
            },
        });
        expect(core._store?.getState().count.count).toBe(2);

        (p1 as any).then((count: any) => {
            expect(count.count).toBe(4);
            expect(core._store?.getState().count.count).toBe(4);
            done();
        });
    });

    it("return Promises when trigger the same effect multiple times", (done) => {
        @model({
            namespace: 'count',
            state: {
                count: 0,
            }
        })
        class Count extends BaseModel<{ count: number }>{
            @effect({
                type: 'takeLatest',
            })
            *addDelay({ delay: _delay, amount }: { amount: number, delay: number }): any {
                yield this.effects.call(delay, _delay);
                yield this.effects.put({ type: 'add', payload: { count: amount } });
                return yield this.effects.select((state: any) => ({ count: state.count.count }));
            };
            @reducer()
            add({ count }: { count: number }) {
                return {
                    count: this.state.count + count,
                };
            };
        };
        const core = new DvaCore();
        core.model(getModel(Count)!);
        core.start();
        const p1 = core._store?.dispatch({
            type: 'count/addDelay',
            payload: { delay: 100, amount: 1 },
        });
        const p2 = core._store?.dispatch({
            type: 'count/add',
            payload: {
                count: 2,
            },
        });
        // const p3 = core._store?.dispatch({
        //     type: 'count/addDelay',
        //     payload: { delay: 200, amount: 3 },
        // });
        expect(p1).toBeInstanceOf(Promise);
        expect(p2).toEqual({ type: 'count/add', payload: { count: 2 } });
        expect(core._store?.getState().count.count).toBe(2);
        (p1 as any).then((count: any) => {
            expect(count.count).toBe(3);
            expect(core._store?.getState().count.count).toBe(3);
            done();
            // (p3 as any).then((_count: any) => {
            //     expect(_count.count).toBe(6);
            //     expect(core._store?.getState().count.count).toBe(6);
            //     done();
            // });
        });
    });

    it("debounce action", (done) => {
        const core = new DvaCore();
        @model({
            namespace: 'count',
            state: {
                count: 0,
            }
        })
        class Count extends BaseModel<{ count: number }>{
            @effect({
                type: 'debounce',
                ms: 50,
            })
            *addDelay({ count }: { count: number }) {
                yield this.effects.put({ type: 'add', payload: { count } });
            };
            @reducer()
            add({ count }: { count: number }) {
                return {
                    count: this.state.count + count,
                };
            };
        };
        core.start();
        core.model(getModel(Count)!);
        core._store?.dispatch({ type: 'count/addDelay', payload: { count: 2 } });
        core._store?.dispatch({ type: 'count/addDelay', payload:  { count: 3 } });

        setTimeout(() => {
            expect(core._store?.getState()).toHaveProperty(['count', 'count'], 3);
            done();
        }, 100);
    });

    it("debounce action: pattern END", (done) => {
        const core = new DvaCore();
        @model({
            namespace: 'count',
            state: {
                count: 0,
            }
        })
        class Count extends BaseModel<{ count: number }>{
            @effect({
                type: 'debounce',
                ms: 50,
            })
            *addDelay({ count }: { count: number }) {
                yield this.effects.put({ type: 'add', payload: { count } });
            };
            @reducer()
            add({ count }: { count: number }) {
                return {
                    count: this.state.count + count,
                };
            };
        };
        core.start();
        core.model(getModel(Count)!);
        core._store?.dispatch({ type: 'count/addDelay', payload: { count: 2 } });
        core._store?.dispatch({ type: 'count/addDelay', payload: { count: 3 } });
        core._store?.dispatch(END);

        setTimeout(() => {
            expect(core._store?.getState()).toHaveProperty(['count', 'count'], 0);
            done();
        }, 100);
    });

    it('type: poll', done => {
        const core = new DvaCore();
        @model({
            namespace: 'count',
            state: {
                count: 0,
            }
        })
        class Count extends BaseModel<{ count: number }>{
            @effect({
                type: 'poll',
                delay: 1000,
            })
            *pollAdd() {
                yield this.effects.put({ type: 'add', payload: { count: 1 } });
            };
            @reducer()
            add({ count }: { count: number }) {
                return {
                    count: this.state.count + count,
                };
            };
        };
        core.start();
        core.model(getModel(Count)!);
        core._store?.dispatch({ type: 'count/pollAdd-start' });
    
        setTimeout(() => {
            core._store?.dispatch({ type: 'count/pollAdd-stop' });
            expect(core._store?.getState()).toHaveProperty(['count', 'count'], 2);
            done();
        }, 2000);
    });

    it('type: poll and stop', done => {
        const core = new DvaCore();
        @model({
            namespace: 'count',
            state: {
                count: 0,
            }
        })
        class Count extends BaseModel<{ count: number }>{
            @effect({
                type: 'poll',
                delay: 1000,
            })
            *pollAdd() {
                yield this.effects.put({ type: 'add', payload: { count: 1 } });
            };
            @reducer()
            add({ count }: { count: number }) {
                return {
                    count: this.state.count + count,
                };
            };
        };
        core.start();
        core.model(getModel(Count)!);
        core._store?.dispatch({ type: 'count/pollAdd-start' });
        // should work one time
        core._store?.dispatch({ type: 'count/pollAdd-stop' });
    
        setTimeout(() => {
            expect(core._store?.getState()).toHaveProperty(['count', 'count'], 1);
            done();
        }, 200);
    });
});