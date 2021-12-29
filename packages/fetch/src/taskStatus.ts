import { deferred } from './utils';

import { TaskStatusEnum } from './types';

// interface
import type {
    TaskErrorReason,
    TaskStatusBase,
    TaskMeta,
    DeferredType,
} from './types';

/**
 * @class
 * @classdesc task状态
 */
class TaskStatus<R = unknown> implements TaskStatusBase<R> {
    /**
     * @summary task提供的一些额外信息
     * @todo 可以额外拓展一些性能方面的信息
     */
    public readonly meta: TaskMeta;
    
    /**
     * @summary task状态
     */
    public taskStatus: TaskStatusEnum;

    /**
     * @summary task回调值
     */
    protected taskResult: R | undefined;

    /**
     * @summary task错误值(包含中断fetch请求的原因)
     */
    public taskError: TaskErrorReason | undefined;

    /**
     * @summary 等待结果的promise变量
     */
    public deferredEnd?: DeferredType<R>;

    constructor({
        meta,
    }: {
        meta: TaskMeta;
    }) {
        this.taskStatus = TaskStatusEnum.BEFORE;
        this.meta = meta;
    }

    /**
     * @summary 获取task fulfilled结果
     * @returns {R | undefined}
     */
    public result = () => this.taskResult;

    /**
     * @summary 获取task rejected结果
     * @returns {AbortReason | undefined}
     */
    public error = () => this.taskError;

    /**
     * @summary 返回task是否被取消
     * @returns {boolean}
     */
    public isAborted = () => this.taskStatus === TaskStatusEnum.ABORTED;

    /**
     * @summary 当前task是否正在运行
     * @returns {boolean}
     */
    public isRunning = () => this.taskStatus === TaskStatusEnum.RUNNING;

    /**
     * @summary promise的形式返回task结果
     * @returns {Promise<R>}
     */
    public toPromise = () => {
        if (this.deferredEnd) {
            return this.deferredEnd.promise;
        }
        this.deferredEnd = deferred<R>();
        /** 状态都已经变化,那肯定是有结果值 */
        if (this.taskStatus === TaskStatusEnum.ABORTED || this.taskStatus === TaskStatusEnum.REJECTED) {
            this.deferredEnd.reject(this.taskError!);
        } else if (this.taskStatus === TaskStatusEnum.FUlFillED) {
            this.deferredEnd.resolve(this.taskResult!);
        }
        return this.deferredEnd.promise;
    };
};

export default TaskStatus;