// interface
import type { TaskMeta } from './types';

/**
 * @summary fetch错误码
 */
export const errorCode = {
    400: "客户端发出了一个无效请求",
    401: "用户没有权限(令牌、用户名、密码错误)",
    403: "用户得到授权,但是访问是被禁止的",
    404: "发出的请求针对的是不存在的记录,服务器没有进行操作",
    406: "请求的格式不可得",
    408: "请求超时,客户端没有在服务器预备等待的时间内完成一个请求的发送",
    410: "请求的资源被永久删除,且不会再得到的",
    422: "当创建一个对象时,发生一个验证错误",
    500: "服务器发生错误,请检查服务器",
    501: "此请求方法不被服务器支持且无法被处理",
    502: "网关错误",
    503: "服务不可用,服务器暂时过载或维护",
    504: "网关超时"
};

/**
 * @summary get error info
 * @param name 
 * @param type 
 * @param message 
 * @returns 
 */
export function getErrorInfo(
    name: string,
    type: string,
    message: string,
) {
    return {
        name,
        type,
        message,
    };
};

/**
 * @summary 删除数组方法中的某一项方法
 * @param array 
 * @param item 
 */
export function remove(
    array: Array<() => void>,
    item: () => void,
) {
    const index = array.indexOf(item);
    if (index > -1) {
        array.splice(index, 1);
    }
};

/**
 * @summary 获取task名称,以fetch url作为任务名
 * @param url 
 * @returns {TaskMeta}
 */
export function getMetaInfo(url?: string): TaskMeta {
    return {
      name: url || 'anonymous',
    };
};

/**
 * @summary 注意执行顺序是队列顺序(先进先出(FIFO)),因为每个task可能有自身的plugin方法,优先执行公共plugin,再执行自身的plugin.
 * 这是reject的compose,因为reject的返回值都是reject
 * @param funcs 
 * @returns function
 */
export function rejectCompose<
    F extends (r: any) => Promise<unknown>,
>(funcs: F[]) {
    if (funcs.length === 0) {
        // infer the argument type so it is usable in inference down the line
        return <P extends Parameters<F>>(r: P[0]) => Promise.reject(r);
    }
    if (funcs.length === 1) {
        return funcs[0]!;
    }
    return <P extends Parameters<F>>(r: P[0]) => {
        let _resolve: (r: P[0]) => void;
        let _reject: (reason?: any) => void;
        const p = new Promise<P[0]>((resolve, reject) => {
            _resolve = resolve;
            _reject = reject;
        })
        const itr = funcs[Symbol.iterator]();
        let nextValue = itr.next();
        let value: P[0] = r;
        function* g() {
            while(!nextValue.done) {
                /* eslint-disable no-loop-func */
                /* eslint-disable @typescript-eslint/no-use-before-define */
                value = yield nextValue.value(value).then((result) => {
                        /* eslint-disable no-loop-func */
                        _resolve(result);
                        next.return(result);
                        nextValue = {
                            done: true,
                            value: p, // 不会执行到这个value
                        };
                }).catch(next.next.bind(next));
                nextValue = itr.next();
            }
            if (nextValue.done) {
                _reject(value);
            }
        };
        /* eslint-disable @typescript-eslint/no-use-before-define */
        const next: Generator<P[0]> = g();
        next.next();
        return p;
    };
};


/**
 * @summary 注意执行顺序是队列顺序(先进先出(FIFO)),因为每个task可能有自身的plugin方法,优先执行公共plugin,再执行自身的plugin.
 * @param funcs 
 * @returns function
 */
export function compose<
    F extends (r: any) => Promise<unknown>,
>(funcs: F[]) {
    if (funcs.length === 0) {
      // infer the argument type so it is usable in inference down the line
      return <P extends Parameters<F>, R extends ReturnType<F>>(r: P[0]) => Promise.resolve(r) as R;
    }
    if (funcs.length === 1) {
      return <P extends Parameters<F>, R extends ReturnType<F>>(r: P[0]) => funcs[0]?.(r) as R;
    }
    return <P extends Parameters<F>, R extends ReturnType<F>>(r: P[0]) => {
        let _resolve: (r: P[0]) => void;
        let _reject: (reason?: any) => void;
        const p = new Promise<P[0]>((resolve, reject) => {
            _resolve = resolve;
            _reject = reject;
        })
        const itr = funcs[Symbol.iterator]();
        let nextValue = itr.next();
        let value: P[0] = r;
        function* g() {
            while(!nextValue.done) {
                /* eslint-disable no-loop-func */
                /* eslint-disable @typescript-eslint/no-use-before-define */
                value = yield nextValue.value(value).then(next.next.bind(next)).catch((e) => {
                    /* eslint-disable no-loop-func */
                    _reject(e);
                    next.return(e);
                    nextValue = {
                        done: true,
                        value: p, // 不会执行到这个value
                    };
                });
                nextValue = itr.next();
            }
            if (nextValue.done) {
                _resolve(value);
            }
        };
        /* eslint-disable @typescript-eslint/no-use-before-define */
        const next: Generator<P[0]> = g();
        next.next();
        return (p as R);
    };
};
