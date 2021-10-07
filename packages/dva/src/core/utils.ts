// interface
import type { Middleware } from 'redux';

export const isFunction = (o: any) => typeof o === 'function';
export const returnSelf = (m: Middleware[]) => m;
export const noop = () => {};

export function isObject(o: any) {
    return Object.prototype.toString.call(o) === '[object Object]';
}
export function isPlainObject(o: Record<string, any>) {
    if (isObject(o) === false) return false;

    const ctor = o.constructor;
    if (ctor === undefined) return true;

    const prot = ctor.prototype;
    if (isObject(prot) === false) return false;

    if (Object.prototype.hasOwnProperty.call(prot, 'isPrototypeOf') === false) {
        return false;
    }
    return true;
};
