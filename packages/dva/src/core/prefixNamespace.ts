import warning from 'warning';
import { NAMESPACE_SEP } from './constants';

// interface
import type { Model } from '../types';

export enum prefixTypeEnum {
    reducer = 'reducer',
    effect = 'effect',
};

type PrefixReturnType<
    O extends NonNullable<Model['reducers'] | Model['effects']>,
    N extends string,
> = {
    [K in string & keyof O as `${N}${typeof NAMESPACE_SEP}${K}`]: O[K];
};
/**
 * 将属性改为 -> `${namespace}${NAMESPACE_SEP}${key}`
 * @param obj reducers or effects
 * @param namespace 
 * @param type 
 * @returns {PrefixReturnType}
 */
function prefix<
    O extends NonNullable<Model['reducers'] | Model['effects']>,
    N extends string,
>(
    obj: O,
    namespace: N,
    type: prefixTypeEnum
) {
    return Object.keys(obj).reduce<PrefixReturnType<O, N>>((memo, key) => {
        const _memo = { ...memo };
        warning(
            key.indexOf(`${namespace}${NAMESPACE_SEP}`) !== 0,
            `[prefixNamespace]: ${type} ${key} should not be prefixed with namespace ${namespace}`,
        );
        const newKey = `${namespace}${NAMESPACE_SEP}${key}`;
        /**
         * TODO: 类型未完整
         */
        /* eslint-disable  @typescript-eslint/ban-ts-comment */
        // @ts-ignore
        _memo[newKey] = obj[key];
        return _memo;
    }, {} as PrefixReturnType<O, N>);
};

export default function prefixNamespace(
    model: Model,
): undefined | Model {
    const _model = { ...model };
    const { namespace = '', reducers, effects } = _model;
    if (!namespace || namespace.length === 0) {
        warning(false, `${JSON.stringify(_model)} should set namespace`);
        return undefined;
    }
    if (reducers) {
        if (Array.isArray(reducers)) {
            // 需要复制一份,不能直接修改 model.reducers[0],会导致微前端场景下,重复添加前缀
            const [reducer, ...rest] = reducers;
            _model.reducers = [
                prefix(reducer, namespace, prefixTypeEnum.reducer),
                ...rest,
            ];
        } else {
            _model.reducers = prefix(reducers, namespace, prefixTypeEnum.reducer);
        }
    }
    if (effects) {
        _model.effects = prefix(effects, namespace, prefixTypeEnum.effect);
    }
    return _model;
};
