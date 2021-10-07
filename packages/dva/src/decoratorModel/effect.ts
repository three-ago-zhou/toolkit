import warning from 'warning';
import invariant from 'invariant';

// tool
import metadata from './metadata';
import {
    MODEL_EFFECTS_TYPE,
    MODEL_NAMESPACE_TYPE,
    MODEL_STATE_TYPE,
} from './decoratorSymbols';
import { getActionNamespace } from './utils';
import modelsContainer from './modelContainer';

// interface
import type { EffectOptions, Instance } from './types';
import type { EffectsCommandMap, DvaAction } from '../types';

/**
 * 将effect设置在当前的class.proptype上
 * @param options effect的额外值,例如: { type: 'throttle', ms: 100 }, { type: 'watcher' }
 * @returns MethodDecorator
 */
export default function effect(
    options?: EffectOptions,
): MethodDecorator {
    return (
        target: Record<string, any>,
        propertyKey: string | symbol,
        descriptor: TypedPropertyDescriptor<any>
    ) => {
        let existEffect = false;
        const currentProto = Reflect.getPrototypeOf(target);
        if (currentProto) {
            existEffect = Reflect.has(currentProto, propertyKey);
        }
        if (existEffect) {
            warning(false, '设置effect无效,当前类/父类已经存在此方法,请勿重复添加');
        } else if (typeof propertyKey === 'symbol') {
            warning(false, '请勿传入symbol类型的key.如若特殊原因,请使用xxx.description取出symbol中定义的字符传入');
        } else {
            const oldDescriptorValue = descriptor.value;
            const func = function* (action: DvaAction, effects: EffectsCommandMap) {
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
                    },
                    effects: {
                        writable: false,
                        configurable: false,
                        enumerable: true,
                        value: effects,
                    },
                });
                // const args = Array.isArray(action.payload) ? action.payload.concat(effects) : [action.payload, effects];
                const args = Array.isArray(action.payload) ? action.payload : [action.payload];
                const result = yield* oldDescriptorValue.apply(currentTarget, args);
                // 调用结束后释放proxy
                revoke();
                return result;
            };
            const targetFunc = options ? [func, options] : func;
            if (!metadata.hasOwn(MODEL_EFFECTS_TYPE, target)) {
                metadata.define(MODEL_EFFECTS_TYPE, {}, target);
            }
            const effects = metadata.getOwn(MODEL_EFFECTS_TYPE, target);
            effects[propertyKey] = targetFunc;
            /* eslint-disable no-param-reassign */
            /**
             * 让修饰的方法 返回 redux action
             * @todo 应该接收对象形式的payload,但是老代码是数组形式的聚合
             * @param payload 
             * @returns 
             */
            descriptor.value = function(this: Instance, ...payload: any[]) {
                const namespace = this[MODEL_NAMESPACE_TYPE];
                warning(namespace, `当前model的effect方法${propertyKey}无法寻找到正确的namespace`);
                return {
                    type: `${namespace}/${propertyKey}`,
                    payload,
                };
            };
        }
        return descriptor;
    };
};
