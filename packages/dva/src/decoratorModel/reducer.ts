import warning from 'warning';
import invariant from 'invariant';

// tool
import metadata from './metadata';
import {
    MODEL_REDUCERS_TYPE,
    MODEL_NAMESPACE_TYPE,
    MODEL_STATE_TYPE,
} from './decoratorSymbols';
import { getActionNamespace } from './utils';
import modelsContainer from './modelContainer';

// interface
import type {
    ModalReducerEnhancer,
    ClassGetReducer,
    ClassReturnReducer,
    ClassReducerAction,
    Instance,
} from './types';

/**
 * @summary 将reducer设置在当前的class.proptype上
 * @param enhancer reducer的加强函数
 * @returns MethodDecorator
*/
export default function reducer<S = any>(
    enhancer?: ModalReducerEnhancer<S>,
) {
    return function(
        target: Record<string, any>,
        propertyKey: string | symbol,
        descriptor: TypedPropertyDescriptor<ClassGetReducer>
    ): TypedPropertyDescriptor<ClassReturnReducer>{
        let existReducer = false;
        let newValue = function(...args: any) {
            return {
                type: '',
                payload: args,
            };
        };
        const currentProto = Reflect.getPrototypeOf(target);
        if (currentProto) {
            existReducer = Reflect.has(currentProto, propertyKey);
        }
        if (existReducer) {
            warning(false, '设置reducer无效,当前类/父类已经存在此方法,请勿重复添加');
        } else if (typeof propertyKey === 'symbol') {
            warning(false, '请勿传入symbol类型的key.如若特殊原因,请使用xxx.description取出symbol中定义的字符传入');
        } else {
            if (!metadata.hasOwn(MODEL_REDUCERS_TYPE, target)) {
                metadata.define(MODEL_REDUCERS_TYPE, {}, target);
            }
            const reducers = metadata.getOwn(MODEL_REDUCERS_TYPE, target);
            const oldDescriptorValue = descriptor.value;
            reducers[propertyKey] = function (_state: S, action: ClassReducerAction) {
                const namespace = getActionNamespace(action.type);
                invariant(namespace, `${propertyKey}方法中的action.type不存在namespace属性,调用此方法失败`);
                const currentTargetPrototype = modelsContainer.get(namespace);
                invariant(currentTargetPrototype, `${propertyKey}方法中的action.type的namespace不存在对应的model,调用此方法失败`);
                // 获取存储的实例上的model -> state
                const currentState = currentTargetPrototype[MODEL_STATE_TYPE];
                // 做个代理state,防止误修改state
                const { proxy: proxyState, revoke } = Proxy.revocable(currentState, {
                    set(_target, _propKey, _value, _receiver) {
                        warning(false, '请勿在state属性上直接设置值,state值只能通过reducer方法改变');
                        return false;
                    }
                });
                // 创建个新的作用域
                const currentTarget = Object.create(currentTargetPrototype, {
                    state: {
                        value: proxyState,
                        configurable: false,
                        enumerable: true,
                        writable: false
                    }
                });
                const args = Array.isArray(action.payload) ? action.payload : [action.payload];
                let newState = oldDescriptorValue?.apply(currentTarget, args);
                // 调用结束后释放proxy
                revoke();
                if (enhancer && newState) {
                    newState = enhancer(newState, action);
                }
                metadata.define(MODEL_STATE_TYPE, newState, currentTargetPrototype);
                return newState;
            };
            // 让修饰的方法 返回 redux action
            newValue = function(this: Instance, ...args: any) {
                const namespace = this[MODEL_NAMESPACE_TYPE];
                if (!namespace) {
                    warning(false, `当前model的reducer方法${propertyKey}无法寻找到正确的namespace`);
                }
                return {
                    type: `${namespace}/${propertyKey}`,
                    payload: args,
                };
            };
        }
        return {
            enumerable: true,
            writable: false,
            configurable: false,
            value: newValue,
        };
    }
};
