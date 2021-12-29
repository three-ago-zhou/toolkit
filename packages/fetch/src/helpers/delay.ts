import { CANCEL } from '../symbols';

// interface
import type { DelayReturn } from './types';

/**
 * @summary 延迟promise
 * @param ms 延迟时间
 */
export default function delay(ms: number): DelayReturn {
    let timeoutId: NodeJS.Timeout;
    const promise = new Promise<void>(resolve => {
        timeoutId = setTimeout(resolve, ms);
    });
    return Object.assign(promise, {
        [CANCEL]: () => {
            clearTimeout(timeoutId);
        },
    });
};