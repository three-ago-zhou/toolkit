import { HELPER, CANCEL } from '../symbols';
import delay from './delay';
import { deferred } from '../utils';
import { TaskStatusEnum } from '../types';

// interface
import type { RequestInterface, HelperProperty } from '../types';
import type { DefaultTask, DelayReturn } from './types';

/**
 * @summary debounce,事件等待delayLength时间后将会触发,每次的等待时间内操作,都会重置等待时机
 * @param delayLength 延迟时间(毫秒)
 * @param coreRequest Core.request
 * @returns {RequestInterface}
 */
export default function debounceHelper<
    T extends DefaultTask
>(
    delayLength: number,
    coreRequest: T,
) {
    type CoreRequestType = typeof coreRequest;
    type Return = ReturnType<CoreRequestType>;
    const task = coreRequest as (T & {
        [HELPER: symbol]: DelayReturn;
    });
    let deferRequest = deferred();
    let taskInstance: RequestInterface<Return> | undefined;
    return function debounceTask(...args: Parameters<CoreRequestType>) {
        /** 确认函数上是否已经挂载了debounce */
        const debounceP = task[HELPER];
        /** 创建一个delay */
        const delayP = delay(delayLength);
        if (!debounceP) {
            /** 挂载delay */
            (task[HELPER] as any) = delayP;
        } else {
            /** 如果还未到等到时间就调用的话,就重新计时等待 */
            task[HELPER]?.[CANCEL]?.();
            /** 重新挂载 */
            (task[HELPER] as any) = delayP;
        }
        task[HELPER]?.then(() => {
            taskInstance = task(...args);
            taskInstance.task?.request.then(deferRequest.resolve).catch(deferRequest.reject);
        }).finally(() => {
            Reflect.deleteProperty(task, HELPER);
            taskInstance = undefined;
            deferRequest = deferred();
        });
        const helperProperty = {
            abort: (reason?: string) => {
                if (taskInstance?.abort) {
                    taskInstance.abort(reason);
                } else {
                    task[HELPER]?.[CANCEL]?.();
                    deferRequest.reject({
                        name: 'PromiseAbortError',
                        message: 'PromiseAborted',
                        type: TaskStatusEnum.ABORTED,
                    });
                }
            },
            task: taskInstance?.task,
        } as HelperProperty<Return>;
        return Object.assign(
            deferRequest.promise as Return,
            helperProperty,
        );
    };
};
