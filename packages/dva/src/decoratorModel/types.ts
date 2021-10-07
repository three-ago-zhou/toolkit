import {
    MODEL_MODEL_TYPE,
    MODEL_EFFECTS_TYPE,
    MODEL_NAMESPACE_TYPE,
    MODEL_REDUCERS_TYPE,
    MODEL_STATE_TYPE,
    MODEL_SUBSCRIPTIONS_TYPE,
} from './decoratorSymbols';

// interface
import type { AnyAction } from 'redux';
import type { EffectType, DvaAction } from '../types';
import type { Model } from '../types';

/**
 * @summary classModel的参数
 */
export interface DvaModelOptions<State extends object = object> {
    namespace?: string;
    state?: State;
};
export type Target = any;
/**
 * @summary classModel的类型
 */
export interface ClassTarget extends Function {}
/**
 * @summary instance
 */
export interface Instance extends Object {
    [MODEL_MODEL_TYPE]?: Model;
    [MODEL_EFFECTS_TYPE]?: Model['effects'];
    [MODEL_NAMESPACE_TYPE]?: Model['namespace'];
    [MODEL_REDUCERS_TYPE]?: Model['reducers'];
    [MODEL_STATE_TYPE]?: Model['state'];
    [MODEL_SUBSCRIPTIONS_TYPE]?: Model['subscriptions'];
}
/**
 * @summary effect的接受参数类型
 */
export type EffectOptions = {
    type: EffectType,
    ms?: number,
    delay?: number,
};
/**
 * @summary 延迟类型
 */
export interface Throttle {
    type: 'throttle';
    // 当 type 为 throttle 时使用，设置节流时间
    ms?: number;
}
/**
 * @summary reducer的加强函数
 */
export interface ModalReducerEnhancer<S = any> {
    (state: S, payload: DvaAction): S
}
/**
 * @summary ClassModel中的reducer,装饰的目标方法
 * @todo decorator 如何才能改变装饰函数的返回类型???
 */
export type ClassGetReducer = (...s: any[]) => any;
// {
//     [P in keyof S]: S[P];
// };
 /**
  * @summary ClassModel中的reducer,装饰完成后,返回的方法
  * @todo decorator 如何才能改变装饰函数的返回类型???
  */
export type ClassReturnReducer = (...s: any[]) => any;
//  Action & {
//      payload: S;
//  };

export interface ClassReducerAction<S = any> extends AnyAction {
    payload: S;
}