import { remove } from './utils';

// interface
import type {
    Hooks,
    HookKeys,
    UnHooks,
    Hook,
    PluginBase,
} from './types';

const hooks: HookKeys[] = [
    'before',
    'running',
    'fulfilled',
    'rejected',
    'abort',
];

/**
 * @summary 提供task请求的状态监控(before, running, done, fulfilled, rejected)
 * @summary 提供task请求的pipeline用于处理response
 */
class Plugin implements PluginBase {
    /**
     * @summary task钩子方法
     */
    private hooks: Hooks;

    /**
     * @summary 需要在task结束后删除的勾子函数
     */
    private unHook: UnHooks;

    constructor() {
        this.hooks = hooks.reduce<Hooks>((memo, key) => {
            /* eslint-disable no-param-reassign */
            memo[key] = [];
            return memo;
        }, {} as Hooks);
        this.unHook = hooks.reduce((memo, key) => {
            /* eslint-disable no-param-reassign */
            memo[key] = [];
            return memo;
        }, {} as UnHooks);
    }

    /**
     * @summary 初始化所有task的公共钩子函数
     * @param plugin {Hooks}
     */
    public init = (
        plugin?: Partial<Hooks>
    ) => {
        const { hooks } = this;
        for(const key in plugin) {
            if (Object.prototype.hasOwnProperty.call(plugin, key)) {
                /* eslint-disable @typescript-eslint/ban-ts-comment */
                // @ts-ignore
                hooks[key].push(...plugin[key]);
            }
        }
    };

    /**
     * @summary 单个task所需要使用的钩子函数
     * @param plugin {Hook}
     */
    public use = (
        plugin: Partial<Hook>
    ) => {
        const { hooks, unHook } = this;
        for(const key in plugin) {
            if (
                Object.prototype.hasOwnProperty.call(plugin, key)
            ) {
                /* eslint-disable @typescript-eslint/ban-ts-comment */
                // @ts-ignore
                hooks[key].push(plugin[key]);
                /**
                 * @todo hook是否需要返回一个unhook的函数,供内部做一些事?类似于unListen,unEffect??
                 */
                /* eslint-disable @typescript-eslint/ban-ts-comment */
                // @ts-ignore
                unHook[key].push(plugin[key]);
            }
        }
    };

    /**
     * @summary 使用某个hooks
     * @param key {HookKeys}
     */
    public apply = <
        K extends HookKeys,
    >(
        key: K,
    ) => this.hooks[key];

    /**
     * @summary task结束后,调用这个方法,删除这个task下挂载的hook
     */
    public unUse = () => {
        const { unHook, hooks } = this;
        for (const key in unHook) {
            if (Object.prototype.hasOwnProperty.call(unHook, key)) {
                /* eslint-disable @typescript-eslint/ban-ts-comment */
                // @ts-ignore
                if (unHook[key].length > 0) {
                    /* eslint-disable @typescript-eslint/ban-ts-comment */
                    // @ts-ignore
                    unHook[key].forEach((fn) => {
                        /* eslint-disable @typescript-eslint/ban-ts-comment */
                        // @ts-ignore
                        remove(hooks[key], fn);
                    });
                }
            }
        }
    };

    /**
     * @summary 获取内部所有的hook
     * @returns { Hooks }
     */
    public getAllHook = () => this.hooks;
};

export default Plugin;
