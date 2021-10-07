// tool
import { NAMESPACE_SEP } from './constants';

// interface
import type {
    DvaCoreBase
} from '../types';
import type { Dispatch } from 'redux';

export default function createPromiseMiddleware(app: DvaCoreBase) {
    function isEffect(type: string) {
        if (!type || typeof type !== 'string') return false;
        const [namespace] = type.split(NAMESPACE_SEP);
        const model = app._models.filter(m => m.namespace === namespace)[0];
        if (model) {
            if (model.effects && model.effects[type]) {
                return true;
            }
        }
        return false;
    };
    return () => (next: Dispatch) => (action: any) => {
        const { type } = action;
        if (isEffect(type)) {
            return new Promise((resolve, reject) => {
                next({
                    __dva_resolve: resolve,
                    __dva_reject: reject,
                    ...action,
                });
            });
        }
        return next(action);
    };
}
