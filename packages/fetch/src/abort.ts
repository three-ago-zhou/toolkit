import { AbortEnum, TaskStatusEnum } from './types';

// interface
import type {
    TaskBase,
    AbortReason,
    AbortBase,
} from './types'; 

const isCanAbortController = typeof AbortController !== 'undefined';
export class CreamsAbortController implements AbortController {
    readonly signal: AbortSignal = {
        aborted: false,
        addEventListener() {/* eslint-disable @typescript-eslint/no-empty-function */},
        dispatchEvent() {
            return false;
        },
        onabort() {/* eslint-disable @typescript-eslint/no-empty-function */},
        removeEventListener() {/* eslint-disable @typescript-eslint/no-empty-function */},
    };

    abort = () => {/* eslint-disable @typescript-eslint/no-empty-function  */};
};
/**
 * @summary 可暂停request的API
 */
const AC = isCanAbortController
? AbortController
: CreamsAbortController;

class Abort<R = unknown> extends AC implements AbortBase<R> {
    /**
     * @summary Promise 实例的reject
     */
    private reject?: (reason?: AbortReason) => void | undefined;

    /**
     * @summary 可供fetch和手动abort进行竞速时使用
     */
    public abortedPromise: Promise<never>;

    /**
     * @summary abortReason
     */
    private abortReason: string | undefined;

    private task: TaskBase<R> | undefined;

    constructor() {
        super();
        this.abortedPromise = new Promise<never>((_, reject) => {
            this.signal.addEventListener('abort', () => {
                const error = {
                    name: 'AbortError',
                    message: this.abortReason,
                    type: AbortEnum.ABORT,
                };
                if (this.task) {
                    this.task.taskError = {
                        ...error,
                        type: TaskStatusEnum.ABORTED,
                    };
                }
            });
            this.reject = reject;
        });
    }

    public abortTask = (
        task: TaskBase<R>,
        reason?: string
    ) => {
        this.abortReason = reason;
        this.task = task;
        const error = {
            name: 'PromiseAbortError',
            message: this.abortReason || 'PromiseAborted',
            type: AbortEnum.ABORT,
        };
        this.task.taskError = {
            ...error,
            type: TaskStatusEnum.ABORTED,
        };
        /**
         * fetch正在执行状态可以用AbortController.abort断开
         */
        if (task.isRunning() && isCanAbortController) {
            this.abort();
        } else {
            this.reject?.(error);
        }
        if (!this.task.isAborted()) {
            this.task.taskStatus = TaskStatusEnum.ABORTED;
        }
    };
};

export default Abort;
