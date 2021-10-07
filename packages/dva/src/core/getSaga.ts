import invariant from 'invariant';
import warning from 'warning';
import * as sagaEffects from 'redux-saga/effects';

// tool
import { NAMESPACE_SEP } from './constants';
import prefixType from './prefixType';

// interface
import type {
    EffectsMapObject,
    Model,
    InsideOnError,
    EffectWithType,
    Effect,
    ICreateHooksAndOpts,
    EffectsCommandMap,
    OnEffect,
    InsideError,
} from '../types';
import { Task } from '@redux-saga/types';
/* eslint-disable import/no-extraneous-dependencies */
import { TakeEffect } from '@redux-saga/core/effects';
import { AnyAction } from 'redux';

const effectTypes = [
    'watcher',
    'takeEvery',
    'takeLatest',
    'takeLeading',
    'throttle',
    'poll',
    'debounce',
];

/* eslint-disable no-param-reassign */
function applyOnEffect(
    fns: OnEffect[],
    effect: (...args: any[]) => Generator,
    model: Model,
    key: string,
) {
    for (const fn of fns) {
        effect = fn(effect, sagaEffects, model, key);
    }
    return effect;
}

function createEffects(
    model: Model,
    opts: Partial<ICreateHooksAndOpts> = {
        namespacePrefixWarning: true
    }
) {
    function assertAction(
        type: string,
        name: string,
    ) {
        invariant(type, 'dispatch: action should be a plain Object with type');

        if (opts.namespacePrefixWarning) {
            warning(
                type.indexOf(`${model.namespace}${NAMESPACE_SEP}`) !== 0,
                `[${name}] ${type} should not be prefixed with namespace ${model.namespace}`,
            );
        }
    }
    function put(action: AnyAction) {
        const { type } = action;
        assertAction(type, 'sagaEffects.put');
        return sagaEffects.put({ ...action, type: prefixType(type, model) });
    }

    // The operator `put` doesn't block waiting the returned promise to resolve.
    // Using `put.resolve` will wait until the promsie resolve/reject before resuming.
    // It will be helpful to organize multi-effects in order,
    // and increase the reusability by seperate the effect in stand-alone pieces.
    // https://github.com/redux-saga/redux-saga/issues/336
    function resolve(action: AnyAction) {
        const { type } = action;
        assertAction(type, 'sagaEffects.put.resolve');
        return sagaEffects.putResolve({
            ...action,
            type: prefixType(type, model),
        });
    };
    
    put.resolve = resolve;

    function take(type: string | string[]) {
        if (typeof type === 'string') {
            assertAction(type, 'sagaEffects.take');
            return sagaEffects.take(prefixType(type, model));
            /* eslint-disable no-else-return */
        } else if (Array.isArray(type)) {
            return sagaEffects.take(
                type.map(t => {
                    if (typeof t === 'string') {
                        assertAction(t, 'sagaEffects.take');
                        return prefixType(t, model);
                    }
                    return t;
                }),
            );
        }
        return sagaEffects.take(type);
    };

    return { ...sagaEffects, put, take };
}

function getWatcher(
    key: string,
    _effect: EffectWithType | Effect,
    model: Model,
    onError: InsideOnError,
    onEffect: OnEffect[],
    opts: Partial<ICreateHooksAndOpts>,
) {
    let effect: Effect;
    let type = 'takeEvery';
    let ms: number;
    let delayMs: number;
    const noop = () => {};

    if (Array.isArray(_effect)) {
        [effect] = _effect;
        const _opts = _effect[1];
        if (_opts && _opts.type) {
            ({ type } = _opts);
            if (type === 'throttle') {
                invariant(_opts.ms, 'app.start: opts.ms should be defined if type is throttle');
                ({ ms } = _opts);
            }
            if (type === 'poll') {
                invariant(_opts.delay, 'app.start: opts.delay should be defined if type is poll');
                ({ delay: delayMs } = _opts);
            }
            if (type === 'debounce') {
                invariant(_opts.ms, 'app.start: opts.ms should be defined if type is debounce');
                ({ ms } = _opts);
            }
        }
        invariant(
            effectTypes.indexOf(type) > -1,
            `app.start: effect type should be ${effectTypes.join(', ')}`,
        );
    } else {
        effect = _effect;
    }

    function* sagaWithCatch(...args: any[]) {
        const {
            __dva_resolve: resolve = noop,
            __dva_reject: reject = noop
        } = args.length > 0 ? args[0] : {};
        try {
            yield sagaEffects.put({ type: `${key}${NAMESPACE_SEP}@@start` });
            /** TODO: effect type */
            /* eslint-disable @typescript-eslint/ban-ts-comment */
            // @ts-ignore
            const ret = yield effect(...args.concat(createEffects(model, opts)));
            yield sagaEffects.put({ type: `${key}${NAMESPACE_SEP}@@end` });
            resolve(ret);
        } catch (e) {
            onError(e as InsideError, {
                key,
                effectArgs: args,
            });
            if (!(e as InsideError)._dontReject) {
                reject(e);
            }
        }
    }

    const sagaWithOnEffect = applyOnEffect(onEffect, sagaWithCatch, model, key);

    switch (type) {
        case 'watcher':
            return sagaWithCatch;
        case 'takeLatest':
            return function*() {
                yield sagaEffects.takeLatest(key, sagaWithOnEffect);
            };
        case 'takeLeading':
            return function*() {
                yield sagaEffects.takeLeading(key, sagaWithOnEffect);
            };
        case 'throttle':
            return function*() {
                yield sagaEffects.throttle(ms, key, sagaWithOnEffect);
            };
        case 'debounce':
            return function *() {
                yield sagaEffects.debounce(ms, key, sagaWithOnEffect);
            };
        case 'poll':
            return function*() {
                function* pollSagaWorker(sagaEffects: EffectsCommandMap, action: TakeEffect) {
                    const { call, delay } = sagaEffects;
                    while (true) {
                        yield call(sagaWithOnEffect, action);
                        yield delay(delayMs);
                    }
                }
                const { call, take, race } = sagaEffects;
                while (true) {
                    const action: TakeEffect = yield take(`${key}-start`);
                    yield race([
                        call(pollSagaWorker, sagaEffects, action),
                        take(`${key}-stop`),
                    ]);
                };
            };
        default:
            return function*() {
                yield sagaEffects.takeEvery(key, sagaWithOnEffect);
            };
    }
}

export default function getSaga(
    effects: EffectsMapObject,
    model: Model,
    onError: InsideOnError,
    onEffect: OnEffect[],
    opts: Partial<ICreateHooksAndOpts> = {}
) {
    return function*() {
        for (const key in effects) {
            if (Object.prototype.hasOwnProperty.call(effects, key) && effects[key] !== undefined) {
                /** TODO: effects[key]会有undefined风险? */
                const watcher = getWatcher(key, effects[key]!, model, onError, onEffect, opts);
                const task: Task = yield sagaEffects.fork(watcher);
                yield sagaEffects.fork(function*() {
                    yield sagaEffects.take(`${model.namespace}/@@CANCEL_EFFECTS`);
                    yield sagaEffects.cancel(task);
                });
            }
        }
    };
}
