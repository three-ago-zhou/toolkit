import { HELPER, CANCEL } from '../symbols';
import { deferred } from '../utils';
import delay from './delay';
import { TaskStatusEnum } from '../types';

// interface
import type { DefaultTask, DelayReturn } from './types';
import type { RequestInterface, HelperProperty } from '../types';

/**
 * @summary throttle,事件等待throttleLength时间后将会触发,每次的触发的时候返回最后一次的结果
 * @param throttleLength 节流时间
 * @param coreRequest Core.request
 * @returns {RequestInterface}
 */
export default function throttleHelper<
T extends DefaultTask
>(
    throttleLength: number,
    coreRequest: T,
) {
    type CoreRequestType = typeof coreRequest;
    type Return = ReturnType<CoreRequestType>;
    const task = coreRequest as (T & {
        [HELPER: symbol]: DelayReturn;
    });
    let deferRequest = deferred();
    let taskInstance: RequestInterface<Return> | undefined;
    let lastParams: Parameters<CoreRequestType> | undefined;
    return function throttleTask(...args: Parameters<CoreRequestType>) {
        lastParams = args;
        /** 确认函数上是否已经挂载了debounce */
        const throttleP = task[HELPER];
        if (!throttleP) {
            /** 挂载delay */
            (task[HELPER] as any) = delay(throttleLength);
            task[HELPER]?.then(() => {
                taskInstance = task(...lastParams!);
                taskInstance.task?.request.then(deferRequest.resolve).catch(deferRequest.reject);
            }).finally(() => {
                Reflect.deleteProperty(task, HELPER);
                taskInstance = undefined;
                lastParams = undefined;
                deferRequest = deferred();
            });
        }
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