/**
 * @summary AbortReason.type类型
 */
export enum AbortEnum {
    /**
     * @summary 调用了abort
     */
    ABORT = 'ABORT',
    /**
     * @summary plugin.before中中断
     */
    BEFORE_ABORT = 'BEFORE_ABORT',
};

/**
 * @summary task状态
 */
 export enum TaskStatusEnum {
    /**
     * @summary 未运行状态
     */
    BEFORE = 'BEFORE',
    /**
     * @summary 运行状态
     */
    RUNNING = 'RUNNING',
    /**
     * @summary 成功状态
     */
    FUlFillED = 'FUlFillED',
    /**
     * @summary 失败状态
     */
    REJECTED = 'REJECTED',
    /**
     * @summary 取消状态
     */
    ABORTED = 'ABORTED',
};

/**
 * @summary plugin.before中接受的参数
 */
export interface BeforeTypeParams extends NonNullable<Config['requestInit']>, ExtraFetchOptions {
    /**
     * @deprecated 不再使用
     */
    url?: string;
    /**
     * @summary request.body.传入body对象,会在内部做转换
     */
    body?: any;
}
/**
 * @summary task执行前的方法,队列顺序(先进先出FIFO)
 * @param 接收requestInit
 * @returns 返回Promise.reject的情况就是不运行task,返回requestInit就是before没有被阻断
 */
export type BeforeType = (init: BeforeTypeParams) => Promise<RequestInit | never>;
/**
 * @summary task执行中的方法,并不会阻塞task
 * @returns Promise<RequestInit>
 */
export type RunningType = (request: BeforeTypeParams) => Promise<BeforeTypeParams>;
/**
 * @summary task成功的方法,队列顺序(先进先出FIFO)
 * @param 接收发出请求的request,以及响应的Response
 */
export type FulfilledType = (response: Response) => Promise<Response>;
/**
 * @summary task失败的方法,队列顺序(先进先出FIFO)
 * @param 接收发出请求的request,以及响应的Response
 */
export type RejectedType = (response: Response) => Promise<Response | never>;
/**
 * @summary task取消的方法,并不会阻塞task
 * @param 接收AbortReason
 */
export type AbortType = (reason: TaskErrorReason) => Promise<TaskErrorReason>;

/**
 * @summary plugin hook,所有的plugin只要是返回promise.reject,就会阻断相同类型plugin后面的执行
 */
export interface Hook {
    before: BeforeType;
    running: RunningType;
    fulfilled: FulfilledType;
    rejected: RejectedType;
    abort: AbortType;
};

export type HookKeys = keyof Hook;

/**
 * @summary plugin hooks
 */
export type Hooks = {
    [K in HookKeys]: Array<Hook[K]>
};

/**
 * @summary 每个task都能够有自己单独的plugin,当task执行结束后,要从plugin中销毁这些
 */
export type UnHooks = Record<HookKeys, (BeforeType | RunningType | FulfilledType | RejectedType | AbortType)[]>;

/**
 * @summary fetch请求的配置
 */
export interface Config {
    /**
     * @summary hooks
     */
    hooks?: Partial<Hooks>;
    /**
     * @summary url前缀
     */
    prefixUrl?: string | ((url: string) => string);
    /**
     * @summary RequestInit
     */
    requestInit?: Exclude<RequestInit, 'method' | 'body'>;
    /**
     * @summary plugin
     */
    plugin?: PluginBase;
};

/**
 * @summary 等待结果的promise变量
 */
export interface DeferredType<R = unknown> {
    promise: Promise<R>;
    resolve: (v: R) => void;
    reject: (v: TaskErrorReason) => void;
};
/**
 * @summary Task类型
 */
export interface TaskBase<R = unknown> extends TaskStatusBase<R> {
    /**
     * @summary abort task
     */
    abortController: AbortBase<R>;
    /**
     * @summary fetch请求
     */
    request: Promise<R>
};

/**
 * @class
 * @classdesc task的状态
 */
 export interface TaskStatusBase<R = unknown> {
    /**
     * @summary 等待结果的promise变量
     */
    deferredEnd?: DeferredType<R>;
    /**
     * @summary task提供的一些额外信息
     * @todo 可以额外拓展一些性能方面的信息
     */
    readonly meta: TaskMeta;
    /**
     * @summary task状态,请勿手动去更改它
     */
    taskStatus: TaskStatusEnum;
    /**
     * @summary task错误值
     */
    taskError: TaskErrorReason | undefined;
    /**
     * @summary 当前task是否正在运行
     * @returns {boolean}
    */
    isRunning: () => boolean;
    /**
     * @summary 获取task fulfilled结果
     */
    result: () => R | undefined;
    /**
     * @summary 获取task rejected结果
     */
    error: () => TaskErrorReason | undefined;
    /**
     * @summary 返回task是否被取消
     */
    isAborted: () => boolean;
    /**
     * @summary promise的形式返回task结果
     */
    toPromise: () => Promise<R>;
};

/**
 * @summary 插件类
 */
export interface PluginBase {
    /**
     * @summary 初始化所有task的公共钩子函数
     * @param plugin {Hooks}
     */
    init: (plugin?: Partial<Hooks>) => void;
    /**
     * @summary 单个task所需要使用的钩子函数
     * @param plugin {Hook}
     */
    use: (plugin: Partial<Hook>) => void;
    /**
     * @summary 使用某个hooks
     * @param key {HookKeys}
     */
    apply: <K extends HookKeys>(key: K) => Hooks[K];
    /**
     * @summary task结束后,调用这个方法,删除这个task下挂载的hook
     */
    unUse: () => void;
    /**
     * @summary 获取内部所有的hook
     * @returns { Hooks }
     */
    getAllHook: () => Hooks;
};

/**
 * @summary 构造task需要的参数
 */
export interface TaskParams {
    /**
     * @summary fetch请求url
     */
    url: string;
    /**
     * @summary plugin
     */
    plugin: PluginBase;
    /**
     * @summary new Request的构造参数
     */
    requestInit: Config['requestInit'];
    /**
     * @summary 额外的method方法
     */
    extraFetchOption?: BeforeTypeParams
};

/**
 * @summary task提供的一些额外信息
 * @todo 可以额外拓展一些性能方面的信息
 */
export interface TaskMeta {
    name: string;
};

/**
 * @summary 额外的fetch请求的参数
 */
export interface ExtraFetchOptions {
    /**
     * @summary methods
     */
    methods?: RequestInit['method'];
    /**
     * @deprecated 不再使用,交与plugin维护
     */
    noToken?: boolean; // 不携带token
    /**
     * @deprecated 不再使用,交与plugin维护
     */
    noCheckToken?: boolean; // 不验证token
    /**
     * @deprecated 不再使用,交与plugin维护
     */
    hasNotification?: boolean; // 遇到错误是否默认展示提示框
};

/**
 * @summary abort取消时的信息
 */
export interface AbortReason {
    /**
     * @summary abort的key
     */
    name?: string;
    /**
     * @summary abort具体原因
     */
    message?: string;
    /**
     * @summary abort标识
     */
    type?: AbortEnum;
};

/**
 * @summary task错误消息
 */
export interface TaskErrorReason {
    /**
     * @summary abort的key
     */
     name?: string;
     /**
      * @summary abort具体原因
      */
     message?: string | undefined;
     /**
      * @summary abort标识
      */
     type?: TaskStatusEnum.ABORTED | TaskStatusEnum.REJECTED;
}

/**
 * @summary 取消fetch请求
 */
export interface AbortBase<R = unknown> extends AbortController {
    abortedPromise: Promise<never>;
    abortTask: (
        task: TaskBase<R>,
        reason?: string,
    ) => void;
};

/**
 * @summary helper工具函数返回的对象上挂载的事件
 */
export interface HelperProperty<R = unknown> {
    /**
     * @summary 在任务未真正执行时,task为undefined
     */
    task?: TaskBase<R> | undefined;
    /**
     * @summary 取消task任务
     */
    abort: (reason?: string) => void;
}

/**
 * @summary helper工具函数的返回
 */
export interface RequestInterface<R = unknown> extends Promise<R>, HelperProperty<R> {};
