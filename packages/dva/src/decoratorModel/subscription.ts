import warning from 'warning';

// tool
import metadata from './metadata';
import {
    MODEL_SUBSCRIPTIONS_TYPE,
} from './decoratorSymbols';

// interface
import { SubscriptionAPI } from '../types';

/**
 * 将subscription设置在当前的class.proptype上
 * @param target class.proptype
 * @param propertyKey 
 * @param descriptor 
 * @returns self
 */
export default function subscription(
    target: Record<string, any>,
    propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<any>
) {
    let existSub = false;
    const currentProto = Reflect.getPrototypeOf(target);
    if (currentProto) {
        existSub = Reflect.has(currentProto, propertyKey);
    }
    if (existSub) {
        warning(false, '设置subscription无效,当前类/父类已经存在此方法,请勿重复添加');
    } else if (typeof propertyKey === 'symbol') {
        warning(false, '请勿传入symbol类型的key.如若特殊原因,请使用xxx.description取出symbol中定义的字符传入');
    } else {
        if (!metadata.hasOwn(MODEL_SUBSCRIPTIONS_TYPE, target)) {
            metadata.define(MODEL_SUBSCRIPTIONS_TYPE, {}, target);
        }
        const subscriptions = metadata.getOwn(MODEL_SUBSCRIPTIONS_TYPE, target);
        subscriptions[propertyKey] = (args: SubscriptionAPI) => descriptor.value.call(Object.create(target), args);
    }
    return descriptor;
}
