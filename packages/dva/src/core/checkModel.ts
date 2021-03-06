import invariant from 'invariant';
import { isFunction, isPlainObject } from './utils';

// interface
import type { Model, SubscriptionsMapObject } from '../types';

function isAllFunction(
    obj: SubscriptionsMapObject
) {
    return Object.keys(obj).every(key => isFunction(obj[key]));
}

export default function checkModel(
    model: Model,
    existModels: Model[],
) {
    const { namespace, reducers, effects, subscriptions } = model;
    // namespace 必须被定义
    invariant(namespace, `[app.model] namespace should be defined`);
    // 并且是字符串
    invariant(
        typeof namespace === 'string',
        `[app.model] namespace should be string, but got ${typeof namespace}`,
    );
    // 并且唯一
    invariant(
        !existModels.some(model => model.namespace === namespace),
        `[app.model] namespace should be unique`,
    );

    // state 可以为任意值

    // reducers 可以为空,可以是PlainObject 或者数组
    if (reducers) {
        invariant(
            isPlainObject(reducers) || Array.isArray(reducers),
            `[app.model] reducers should be plain object or array, but got ${typeof reducers}`,
        );
        // 数组的 reducers 必须是 [Object, Function] 的格式
        invariant(
            !Array.isArray(reducers) || (isPlainObject(reducers[0]) && isFunction(reducers[1])),
            `[app.model] reducers with array should be [Object, Function]`,
        );
    }

    // effects 可以为空，PlainObject
    if (effects) {
        invariant(
            isPlainObject(effects),
            `[app.model] effects should be plain object, but got ${typeof effects}`,
        );
    }

    if (subscriptions) {
        // subscriptions 可以为空，PlainObject
        invariant(
            isPlainObject(subscriptions),
            `[app.model] subscriptions should be plain object, but got ${typeof subscriptions}`,
        );

        // subscription 必须为函数
        invariant(isAllFunction(subscriptions), `[app.model] subscription should be function`);
    }
}
