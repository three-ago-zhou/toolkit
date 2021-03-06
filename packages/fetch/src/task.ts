import {
    getMetaInfo,
    compose,
    rejectCompose,
    getErrorInfo,
} from './utils';
import Abort from './abort';
import request, { transformResponse } from './request';
import { TaskStatusEnum, AbortEnum } from './types';
import TaskStatus from './taskStatus';

// interface
import type {
    TaskParams,
    TaskBase,
    PluginBase,
    BeforeType,
    AbortBase,
    BeforeTypeParams,
} from './types';

/**
 * @class
 * @classdesc task
 */
class Task<R = unknown> extends TaskStatus<R> implements TaskBase<R> {
    /**
     * @summary {AbortController}
     */
    public abortController: AbortBase<R>;

    /**
     * @summary fetch请求
     */
    public request: Promise<R>;

    /**
     * @summary plugin插件
     */
    private plugin: PluginBase;

    /**
     * @summary 公共的fetch请求属性
     */
    private requestInit: RequestInit;

    constructor({
        url,
        plugin,
        requestInit,
        extraFetchOption,
    }: TaskParams) {
        super({
            meta: getMetaInfo(url),
        });
        this.taskStatus = TaskStatusEnum.BEFORE;
        this.abortController = new Abort<R>();
        this.plugin = plugin;
        /**
         * 初始化fetch请求的第二个参数
         * 将signal放入其中
         */
        this.requestInit = {
            signal: this.abortController.signal,
            ...requestInit,
        };
        this.request = this.createRequest(
            url,
            extraFetchOption,
        );
    }

    /**
     * @todo 这层应该单独抽离出来
     * @summary 创建一个fetch
     */
    private createRequest = (
        url: string,
        extraFetchOption?: BeforeTypeParams,
    ): Promise<R> => {
        /**
         * 创建fetch请求前,先执行一次plugin.before的内部方法
         */
        const before = compose<BeforeType>(this.plugin.apply('before'));
        this.taskStatus = TaskStatusEnum.RUNNING;
        if (extraFetchOption?.body) {
            this.requestInit.body = extraFetchOption?.body;
        }
        const fetchPromise = before({
            ...this.requestInit, 
            ...extraFetchOption,
            url,
        }).catch((err) => {
            let error = getErrorInfo(
                'BeforeAbortError',
                AbortEnum.BEFORE_ABORT,
                typeof err === 'string' ? err : 'BeforeAbortError',
            );
            if (typeof err === 'object') {
                error = Object.assign(error, err);
            }
            return Promise.reject(error);
        }).then((result) => {
            this.requestInit = result;
            const requestInstance = new Request(url, this.requestInit);
            compose(this.plugin.apply('running'))(requestInstance);
            /** 这里是请求发起 */
            return request(requestInstance).then((response) => {
                if (response.ok) {
                    // 为了防止plugin.fulfilled钩子函数内有延迟,推迟task状态改变,所以在response第一时间改变task状态
                    this.taskStatus = TaskStatusEnum.FUlFillED;
                    /**
                     * 状态码在200-299范围内
                     */
                    return compose(this.plugin.apply('fulfilled'))(response).then((res) => {
                        if (res instanceof Response) {
                            return transformResponse<R>(res);
                        }
                        return res;
                    });
                }
                // response.ok = false
                // 为了防止plugin.fulfilled钩子函数内有延迟,推迟task状态改变,所以在response第一时间改变task状态
                this.taskStatus = TaskStatusEnum.REJECTED;
                return Promise.reject(response);
            }).catch((response: Response) => {
                // abort也会触发catch,所以多一层判断,隔离abort情况下触发rejected
                if ((response as any).type === 'aborted') {
                    this.taskStatus = TaskStatusEnum.ABORTED;
                    return Promise.reject(response);
                }
                // request error
                this.taskStatus = TaskStatusEnum.REJECTED;
                /**
                 * fetch的response.catch,走rejected
                 */
                return rejectCompose(this.plugin.apply('rejected'))(response).then((res) => {
                    if (res instanceof Response) {
                        return transformResponse(res) as Promise<R>;
                    }
                    return res;
                });
            });
        });
        return Promise.race([
            fetchPromise,
            this.abortController.abortedPromise,
        ]).then((result) => {
            this.taskResult = result;
            if (this.deferredEnd) {
                this.deferredEnd.resolve(this.taskResult);
            }
            return result;
        }).catch((err) => {
            let error = {};
            if (
                err.type
                && (
                    err.type === AbortEnum.ABORT
                    || err.type === AbortEnum.BEFORE_ABORT
                    || err.type === 'aborted'
                )
            ) {
                error = {
                    ...err,
                    ...getErrorInfo(
                        'AbortError',
                        TaskStatusEnum.ABORTED,
                        this.taskError?.message ?? err.message,
                    ),
                };
                this.taskStatus = TaskStatusEnum.ABORTED;
                compose(this.plugin.apply('abort'))(error);
            } else {
                error = getErrorInfo('RejectError', TaskStatusEnum.REJECTED, typeof err === 'string' ? err : 'RejectError');
                if (typeof err === 'object') {
                    error = Object.assign(error, {
                        ...err,
                        type: TaskStatusEnum.REJECTED, // 防止被覆盖
                    });
                }
            }
            this.taskError = error;
            if (this.deferredEnd) {
                this.deferredEnd.reject(this.taskError);
            }
            return Promise.reject(this.taskError);
        }).finally(() => {
            this.plugin.unUse();
        });
    }
};

export default Task;