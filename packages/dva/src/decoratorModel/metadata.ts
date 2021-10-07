// interface
import { Target } from './types';

/**
 * @summary 进行原型对象的属性增删查
 */
const metadata = {
    /**
     * @summary 设置属性值放入class.prototype
     * @param key {decoratorSymbols}
     * @param value effects/reducers/subscriptions/state
     * @param target class.prototype
     */
    define(key: symbol, value: any, target: Target) {
        Reflect.defineProperty(target, key, {
            value,
            enumerable: false,
            writable: true,
            configurable: true,
        });
    },
    /**
     * @summary 查询class.prototype自身上的属性值
     * @param key {decoratorSymbols}
     * @param target class.prototype
     * @returns {boolean}
     */
    hasOwn(key: symbol, target: Target) {
        return Object.prototype.hasOwnProperty.call(target, key);
    },
    /**
     * @summary 返回class.prototype自身上的属性值
     * @param key {decoratorSymbols}
     * @param target class.prototype
     * @returns effects/reducers/subscriptions/state | undefined
     */
    getOwn(key: symbol | string, target: Target): any | undefined {
        const currentDescriptor = Reflect.getOwnPropertyDescriptor(target, key);
        if (currentDescriptor) {
            return currentDescriptor.value;
        }
        return undefined;
    },
    /**
     * @summary 返回指定的属性。考虑到继承,使用get,可以沿着原型链查找
     * @param key {decoratorSymbols}
     * @param target class.prototype
     * @returns {any | undefined}
     */
    get(key: symbol | string, target: Target) {
        return Reflect.get(target, key);
    },
    /**
     * @summary 返回__proto__上指定的属性。
     * @param key {decoratorSymbols}
     * @param target Class Instance(类的实例)
     * @returns {any | undefined}
     */
    getPrototypeOfValue(key: symbol | string, target: Target) {
        const currentProto = Reflect.getPrototypeOf(target);
        if (currentProto) {
            return metadata.getOwn(key, currentProto);
        }
        return undefined;
    }
};

export default metadata;
