import { deferred } from '../utils';
import delay from './delay';
import { TaskStatusEnum } from '../types';

// interface
import type { DefaultTask } from './types';
import type { RequestInterface, HelperProperty } from '../types';

const noop = (_arg: any) => true;

/**
 * @summary retry,一个请求的重试函数
 * @param maxTries 最大重试次数
 * @param delayLength 每次重试延迟时间(ms)
 * @param coreRequest Core.request
 * @param retryCondition 重试的条件(true重试,false不重试),接入fulfilled回调,rejected默认没有回调的意义(注意接口response.ok === false也是走rejected)
 * @returns {RequestInterface}
 */
export default function retryHelper<
    T extends DefaultTask
>(
    maxTries: number,
    delayLength = 0,
    coreRequest: T,
    retryCondition: (arg?: unknown) => boolean = noop,
) {
    type CoreRequestType = typeof coreRequest;
    type Return = ReturnType<CoreRequestType>;
    const task = coreRequest;
    let deferRequest = deferred();
    let taskInstance: RequestInterface<Return> | undefined;
    return function throttleTask(...args: Parameters<CoreRequestType>) {
        let count = 0;
        function responseProcess(response: Return) {
            const continueBoolean = retryCondition(response);
            if (continueBoolean) {
                count += 1;
                if (delayLength !== 0) {
                    delay(delayLength).then(() => {
                        taskInstance = task(...args);
                        taskInstance.then(responseProcess);
                    });
                } else {
                    taskInstance = task(...args);
                    taskInstance.then(responseProcess);
                }
            }
            // 如果重试条件为false或者重试次数达到,就返回response
            if (!continueBoolean || count === maxTries) {
                deferRequest.resolve(response);
            }
        };
        taskInstance = task(...args);
        taskInstance.then(responseProcess).catch(deferRequest.reject);
        deferRequest.promise.finally(() => {
            count = 0;
            taskInstance = undefined;
            deferRequest = deferred();
        })
        const helperProperty = {
            abort: (reason?: string) => {
                if (taskInstance?.abort) {
                    taskInstance.abort(reason);
                } else {
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
    }
};
