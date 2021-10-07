import { useDispatch as reduxDispatch } from 'react-redux';

// interface
import type { Model } from '../types';

// function createModel<
//     S extends any,
//     M extends Model<S>
// >(m: M) {
//     return m;
// };

// interface ModelState {
//     hello?: string;
//     world: string;
// }
// const model = createModel<
//     ModelState,
//     {
//         namespace: 'todo';
//         state: ModelState;
//         reducers: {
//             add: (state: ModelState, payload: ModelState) => ModelState;
//         };
//         effects: {
//             save: (
//                 action: {
//                     payload: {
//                         hello: string;
//                     }
//                 },
//                 effects: any
//             ) => any;
//             delete: (
//                 action: {},
//                 effects: any
//             ) => any;
//         };
//         subscriptions: SubscriptionsMapObject;
//     }
// >({
//     namespace: 'todo',
//     state: {
//         hello: undefined,
//         world: '',
//     },
//     reducers: {
//       add(state, { world, hello }) {
//         // 保存数据到 state
//         return {
//             ...state,
//             world,
//             hello,
//         };
//       },
//     },
//     effects: {
//       *save({ payload: { hello } }, { put, call }) {
//         // 调用 saveTodoToServer，成功后触发 `add` action 保存到 state
//         yield put({ type: 'add', payload: hello });
//         return true;
//       },
//       *delete({}, { put, call }) {
//         // 调用 saveTodoToServer，成功后触发 `add` action 保存到 state
//         yield put({ type: 'add' });
//         return true;
//       },
//     },
//     subscriptions: {
//       setup({ history, dispatch }) {
//         // 监听 history 变化，当进入 `/` 时触发 `load` action
//         return history.listen(({ pathname }) => {
//           if (pathname === '/') {
//             dispatch({ type: 'load' });
//           }
//         });
//       },
//     },
// });

// const dispatch = useDispatch<typeof model>();
// dispatch<'add'>({
//     type: 'todo/add',
//     payload: {
//         hello: ''
//     },
// });
// dispatch({
//     type: 'todo/save',
//     payload: {
//         hello: ''
//     }
// });
// dispatch<'delete'>({
//     type: 'todo/delete',
// });

type ReducerPayload<
    O extends Record<string, any>,
    K extends keyof O
> = O[K] extends (s: any, P: infer R) => any ? Partial<R> : unknown;

type EffectPayload<
    O extends Record<string, any>,
    K extends keyof O
> = O[K] extends (P: infer R, effect: any) => any
    ? R extends { payload: any }
    ? R['payload']
    : unknown
    : unknown;

type ModelReducersAndEffectsKey<M extends Model> = keyof (M['reducers'] & M['effects']);

type ModelDispatchType<M extends Model, T extends string & ModelReducersAndEffectsKey<M>> = `${M['namespace']}/${T}`;

type ModelDispatchPayload<
    M extends Model,
    T extends string & ModelReducersAndEffectsKey<M>,
> = T extends keyof M['reducers']
    ? ReducerPayload<NonNullable<M['reducers']>, T>
    : T extends keyof M['effects']
    ? EffectPayload<NonNullable<M['effects']>, T>
    : unknown;

/**
 * @name ModelDispatch
 * @summary 仅限于触发Model中的reducers/effect中行为可以做出类型推论
 * @returns {Function} Dispatch
 */
function useDispatch<
    M extends Model,
    K extends ModelReducersAndEffectsKey<M>,
>() {
    function dispatch<
        T extends string & K,
    >(
        action: ModelDispatchPayload<M, T> extends Record<string, any>
            ? {
                type: ModelDispatchType<M, T>,
                payload: ModelDispatchPayload<M, T>
            } : {
                type: ModelDispatchType<M, T>,
            }
    ) {
        return reduxDispatch()<unknown>(action);
    }
    return dispatch;
};

export default useDispatch;
