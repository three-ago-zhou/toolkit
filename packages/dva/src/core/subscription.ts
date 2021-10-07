import warning from 'warning';

// tool
import { isFunction } from './utils';
import prefixedDispatch from './prefixedDispatch';

// interface
import type {
    SubscriptionsMapObject,
    Model,
    DvaCoreBase,
    InsideOnError,
    Unlisteners,
} from '../types';

export function run(
    subs: SubscriptionsMapObject,
    model: Model,
    app: DvaCoreBase,
    onError: InsideOnError,
) {
    /* eslint-disable @typescript-eslint/ban-types */
    const funcs: (Function | void)[] = [];
    const nonFuncs: string[] = [];
    if (!app._store) {
        return {
            funcs,
            nonFuncs,
        };
    }
    Object.keys(subs).forEach((key) => {
        if (Object.prototype.hasOwnProperty.call(subs, key)) {
            const sub = subs[key]!;
            const unlistener = sub(
                {
                    dispatch: prefixedDispatch(app._store!.dispatch, model),
                    history: app._history!,
                },
                onError,
            );
            if (isFunction(unlistener)) {
                funcs.push(unlistener);
            } else {
                nonFuncs.push(key);
            }
        }
    });
    return { funcs, nonFuncs };
}

export function unlisten<
    T extends Unlisteners,
    K extends string & keyof T,
>(
    unlisteners: Unlisteners,
    namespace: K,
) {
    if (!unlisteners[namespace]) return;

    const { funcs, nonFuncs } = unlisteners[namespace]!;
    warning(
        nonFuncs.length === 0,
        `[app.unmodel] subscription should return unlistener function, check these subscriptions ${nonFuncs.join(
            ', ',
        )}`,
    );
    funcs.forEach((unlistener) => {
        if (unlistener) {
            unlistener();
        }
    });
    /* eslint-disable no-param-reassign */
    delete unlisteners[namespace];
}
