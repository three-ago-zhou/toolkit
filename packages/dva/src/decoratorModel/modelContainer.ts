import warning from 'warning';

// tool
import {
    MODEL_NAMESPACE_TYPE
} from './decoratorSymbols';

// interface
import type { Instance } from './types';

/**
 * @summary 存储每个Decorator代理的model
 * @description 用于在每个effect/reducer代理的方法中,能找到属于自身的类数据
 */
const container = new Map<string, Instance>();

/**
 * @summary 存储classModel的instance
 */
const modelsContainer = {
    /**
     * {
     *   [namespace]: instance
     * } 存储
     * @param instance instance
     * @returns {undefined | Instance}
     */
    set(instance: Instance): undefined | Instance {
        const namespace = instance[MODEL_NAMESPACE_TYPE];
        if (!namespace) {
            const className = instance.constructor.name;
            warning(false, `modelsContainer.set(${className})失败,${className}类必须有[MODEL_NAMESPACE_TYPE]属性`);
            return undefined;
        }
        const existed = modelsContainer.has(namespace);
        /**
         * app.replace会触发触在的警告
         */
        if (existed) {
            warning(false, `${namespace} is existed, but replece old model`);
            // return;
        }
        return container.set(namespace, instance);
    },
    /**
     * @summary 根据namespace查找对应的Instance
     * @param namespace {string}
     * @returns {undefined | Instance}
     */
    get(namespace: string): undefined | Instance {
        if (typeof namespace === 'undefined') {
            return undefined;
        }
        if (!container.has(namespace)) {
            warning(false, `a ${namespace} key does not exist in modelsContainer`);
            return undefined;
        }
        return container.get(namespace);
    },
    /**
     * @summary 根据namespace判断是否已经存在相应的ClassModel.prototype
     * @param namespace {string}
     * @returns {boolean}
     */
    has(namespace: string) {
        return container.has(namespace);
    },
    /**
     * @summary 根据namespace删除container中对应的Instance
     * @param namespace {string}
     * @returns {boolean}
     */
    delete(namespace: string) {
        const existed = modelsContainer.has(namespace);
        if (existed) {
            return container.delete(namespace);
        }
        warning(false, `${namespace}对应的Instance不存在,无需删除`);
        return true;
    },
    /**
     * @summary 清除所有的model
     */
    clear() {
        container.clear();
    },
};

export default modelsContainer;
