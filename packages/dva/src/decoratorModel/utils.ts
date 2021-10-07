import warning from 'warning';

// tool
import { MODEL_MODEL_TYPE } from './decoratorSymbols';
import metadata from './metadata';
import { NAMESPACE_SEP } from '../core/constants';

// interface
import type { Model } from '../types';
import type { ClassTarget } from './types';

/**
 * @summary 判断是否ClassTarget类型,ts的类型收窄
 * @param target 
 * @returns {boolean}
 */
export function isClassModel(
    target: Model | ClassTarget
): target is ClassTarget {
    if (
        typeof target === 'function'
        && target.prototype
        // && target.toString().indexOf('class') > -1 // 不同的编译环境可能会有不同的结果(jest 环境class.toString() === function xxx. v8环境是 class xxx{})
    ) {
        return true;
    }
    return false;
};

/**
 * 获取一个类上的modal
 * @param target class
 * @returns {modal}
 */
export function getModel<
    T extends ClassTarget
>(target: T): undefined | Model {
    if (!isClassModel(target)) {
        warning(isClassModel(target), `${(target as any).name || (target as any).toString()}并不是一个类,请传入class类`);
        return undefined;
    }
    if (
        metadata.hasOwn(MODEL_MODEL_TYPE, target.prototype)
    ) {
        const modal: Model = metadata.getOwn(MODEL_MODEL_TYPE, target.prototype);
        if (!modal.namespace || modal.namespace.length === 0) {
            warning(false, `${target.name || target.toString()}类上的modal.namespace不存在`);
            return undefined;
        }
        return modal;
    }
    warning(false, `${target.name || target.toString()}并没有modal`);
    return undefined;
};

/**
 * @summary 得到action.type重的namespace
 * @param type {string} action.type
 * @returns {string | undefined}
 */
export function getActionNamespace(type: string): string | undefined {
    const splitArr = type.split(NAMESPACE_SEP);
    if (splitArr.length === 1 || splitArr[0]?.length === 0) {
        return undefined;
    }
    return splitArr[0];
};