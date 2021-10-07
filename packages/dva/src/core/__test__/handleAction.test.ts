import { nothing } from 'immer';
import handleActions, { immerReduces } from "../handleActions";

describe("handleActions", () => {
    const LOGIN_START = 'user/login/start';
    const LOGIN_END = 'user/login/end';
    const initialState = {
        isLoading: false,
    };
    const reducers = handleActions(
        {
            [LOGIN_START](state) {
                return {
                    ...state,
                    isLoading: true,
                };
            },
            [LOGIN_END](state) {
                return {
                    ...state,
                    isLoading: false,
                };
            },
        },
        initialState,
    );

    it("LOGIN_START", () => {
        expect(reducers(initialState, { type: LOGIN_START })).toEqual({
            isLoading: true,
        });
    });
    it("LOGIN_END", () => {
        expect(reducers(initialState, { type: LOGIN_END })).toEqual({
            isLoading: false,
        });
    });
    it("dispatch not valid action", () => {
        expect(() => {
            reducers(initialState, { type: '' });
        }).toThrow(/dispatch: action should be a plain Object with type/);
    });
});

describe("immerReduces, test complex object", () => {
    const ADD_COUNT = 'add/count';
    const PUSH_ARR = 'push/arr';
    const CHANGE_BOOL = 'change/bool';
    const DEFINE_OBJ = 'define/obj';
    const ERROR = 'ERROR';
    const initialState = {
        obj: {},
        arr: [] as number[],
        bool: false,
        count: 1,
    };
    const reducers = immerReduces(
        {
            [ADD_COUNT](state, { payload }) {
                state.count += payload!.count!;
            },
            [PUSH_ARR](state, { payload }) {
                state.arr.push(...payload!.arr!);
            },
            [CHANGE_BOOL](state, { payload }) {
                state.bool = payload!.bool!;
            },
            [DEFINE_OBJ](state, { payload }) {
                Object.keys(payload!.obj!).forEach((key) => {
                    // @ts-ignore
                    state.obj[key] = payload!.obj![key];
                });
            },
            [ERROR]() {
                // only test.normal is ts error
                return nothing as any;
            },
        },
        initialState,
    );

    it("ADD_COUNT", () => {
        const result = reducers(initialState, { type: ADD_COUNT, payload: { count: 1 } });
        expect(result.count).toBe(2);
        expect(result.arr).toStrictEqual(initialState.arr);
    });

    it("PUSH_ARR", () => {
        const result = reducers(initialState, { type: PUSH_ARR, payload: { arr: [1, 2] } });
        expect(result.arr).toEqual(
            expect.arrayContaining([1, 2])
        );
        expect(result.obj).toStrictEqual(initialState.obj);
    });

    it("CHANGE_BOOL", () => {
        const result = reducers(initialState, { type: CHANGE_BOOL, payload: { bool: true } });
        expect(result.bool).toBeTruthy();
        expect(result.count).toBe(1);
    });

    it("DEFINE_OBJ", () => {
        const result = reducers(initialState, { type: DEFINE_OBJ, payload: { obj: { hello: 'hello', world: 'world' } } });
        expect(result.obj).toEqual({
            hello: 'hello',
            world: 'world',
        });
        expect(result.bool).toBe(false);
    });

    it("not match reducer type, return origin state", () => {
        const result = reducers(initialState, { type: 'OTHER' });
        expect(result).toStrictEqual(initialState);
    });

    it("return NOTHING, get throw error", () => {
        expect(() => {
            reducers(initialState, { type: ERROR })
        }).toThrowError(Error('A case reducer on a non-draftable value must not return undefined'));
    });
});

describe("immerReduces, test number type", () => {
    const initialState = 0;
    const ADD_COUNT = 'add/count';
    const ERROR = 'ERROR';
    const reducers = immerReduces(
        {
            [ADD_COUNT](count, { payload }) {
                return count + payload!;
            },
            [ERROR]() {
                // only test.normal is ts error
                return nothing as any;
            },
        },
        initialState,
    );

    it("ADD_COUNT", () => {
        const result = reducers(initialState, { type: ADD_COUNT, payload: 1 });
        expect(result).toBe(1);
    });

    it("return NOTHING, get throw error", () => {
        expect(() => {
            reducers(initialState, { type: ERROR })
        }).toThrowError(Error('A case reducer on a non-draftable value must not return undefined'));
    });
});
