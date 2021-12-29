import Plugin from './plugin';
import Task from './task';

// interface
import type {
    Config,
    Hook,
    BeforeTypeParams,
    PluginBase,
} from './types';

class Core {
    /**
     * @summary hooks
     */
    private plugin: PluginBase;

    /**
     * @summary 单个fetch的独立hook
     */
    public use: PluginBase['use'];

    /**
     * @summary url的前缀
     */
    private prefixUrl: Config['prefixUrl'];
    
    /**
     * @summary fetch的第二个参数
     */
    private requestInit: Config['requestInit'];

    constructor() {
        this.plugin = new Plugin();
        this.use = this.plugin.use;
    }

    /**
     * @summary 设置所有fetch的共用属性
     * @param config {Config}
     */
    public setConfig = (config: Config) => {
        this.plugin = config.plugin ?? this.plugin;
        this.plugin.init(config.hooks);
        this.prefixUrl = config.prefixUrl;
        this.requestInit = config.requestInit;
    };

    /**
     * @description 构造一个fetch请求,返回Promise以及这个fetch的task详情
     * @param url
     * @param plugin {hook}
     * @param extraFetchOption
     */
    public request = <R = unknown>(
        url: string,
        extraFetchOption: BeforeTypeParams,
        plugin?: Partial<Hook>,
    ) => {
        let _url = url;
        // 获取公共的hook
        const allHook = this.plugin.getAllHook();
        // 创建个task自身的plugin
        const taskSelfPlugin = new Plugin();
        // 将公共hook注册进自身hook
        taskSelfPlugin.init(allHook);
        if (plugin) {
            taskSelfPlugin.use(plugin);
        }
        // 将url进行拼接
        if (this.prefixUrl) {
            if (typeof this.prefixUrl === 'string') {
                _url = `${this.prefixUrl}${_url}`;
            }
            if (typeof this.prefixUrl === 'function') {
                _url = this.prefixUrl(_url);
            }
        }
        const task = new Task<R>({
            url: _url,
            plugin: taskSelfPlugin,
            requestInit: this.requestInit,
            extraFetchOption,
        });
        const promise: Promise<R> = new Promise<R>((r, j) => {
            task.request.then(r).catch(j);
        });
        return Object.assign(promise, {
            task,
            abort: (reason?: string) => {
                task.abortController.abortTask(task, reason);
            },
        });
    };
};

export default Core;