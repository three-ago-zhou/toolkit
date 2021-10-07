import handleActions from './handleActions';

// interface
import type {
    ModelReducer,
    ReducerEnhancer,
    HandleActions,
    hooksKey,
    BasePlugin,
    HooksType,
    Hooks,
    InitHooks,
    Reducer,
    PluginInit,
} from '../types';

const hooks: hooksKey[] = [
    'onError',
    'onStateChange',
    'onAction',
    'onHmr',
    'onReducer',
    'onEffect',
    'extraReducers',
    'extraEnhancers',
];

function getExtraReducers(
    hook: ModelReducer<any>[],
): ModelReducer<any> {
    let ret = {};
    for (const reducerObj of hook) {
        ret = { ...ret, ...reducerObj };
    }
    return ret;
}

function getOnReducer(
    hook: ReducerEnhancer<any>[]
) {
    return function(reducer: Reducer) {
        for (const reducerEnhancer of hook) {
            /* eslint-disable no-param-reassign */
            reducer = reducerEnhancer(reducer);
        }
        return reducer;
    };
}

export default class Plugin implements BasePlugin {
    private hooks: HooksType;

    public _handleActions: HandleActions;
    
    constructor() {
        this._handleActions = handleActions;
        this.hooks = hooks.reduce<HooksType>((memo, key) => {
            memo[key] = [];
            return memo;
        }, {} as HooksType);
    }

    init(
        plugin: PluginInit<InitHooks>,
    ) {
        const { hooks } = this;
        for (const key in plugin) {
            /* eslint-disable @typescript-eslint/ban-ts-comment */
            // @ts-ignore
            if (Object.prototype.hasOwnProperty.call(plugin, key) && plugin[key]) {
                if (key === '_handleActions') {
                    this._handleActions = plugin[key] ?? handleActions;
                } else if (key === 'extraEnhancers') {
                    hooks[key] = plugin[key] ?? [];
                } else {
                    /* eslint-disable @typescript-eslint/ban-ts-comment */
                    // @ts-ignore
                    hooks[key].push(plugin[key]);
                }
            }
        }
    }

    use(
        plugin: Partial<Omit<Hooks, 'extraEnhancers'>>,
    ) {
        const { hooks } = this;
        for (const key in plugin) {
            if (Object.prototype.hasOwnProperty.call(plugin, key)) {
                if (key === '_handleActions') {
                    this._handleActions = plugin[key] ?? handleActions;
                } else {
                    /* eslint-disable @typescript-eslint/ban-ts-comment */
                    // @ts-ignore
                    hooks[key].push(plugin[key]);
                }
            }
        }
    }

    apply<
        T extends 'onError' | 'onHmr',
    >(
        key: T,
        defaultHandler?: (...args: any[]) => void
    ) {
        const { hooks } = this;
        const fns = hooks[key];
        return (...args: any[]) => {
            if (fns.length) {
                for (const fn of fns) {
                    /* eslint-disable @typescript-eslint/ban-ts-comment */
                    // @ts-ignore
                    fn(...args);
                }
            } else if (defaultHandler) {
                defaultHandler(...args);
            }
        };
    }

    /**
     * TODO: type
     */
    get<
        K extends Exclude<hooksKey, 'extraReducers' | 'onReducer'>,
    >(key: K): HooksType[K] {
        const { hooks } = this;
        return hooks[key];
    }

    getHookExtraReducers<K extends Extract<hooksKey, 'extraReducers'>>(key: K) {
        const { hooks } = this;
        return getExtraReducers(hooks[key]);
    }

    getHookOnReducer<K extends Extract<hooksKey, 'onReducer'>>(key: K) {
        const { hooks } = this;
        return getOnReducer(hooks[key]);
    }
}
