// interface
import type { ReactElement, FunctionComponent, ElementType } from 'react';
import type { History, LocationState } from 'history';
import type {
    Middleware,
    Dispatch,
    // Reducer as ReduxReducer,
    AnyAction,
    StoreCreator,
    Store,
    Action,
    PreloadedState,
    StoreEnhancer,
} from 'redux';
import {
    take,
    takeMaybe,
    put,
    putResolve,
    all,
    race,
    call,
    apply,
    cps,
    fork,
    spawn,
    join,
    cancel,
    select,
    actionChannel,
    cancelled,
    flush,
    getContext,
    setContext,
    delay,
} from '@redux-saga/core/effects';
import type { SagaMiddleware } from 'redux-saga';
import type { PutEffect, SelectEffect } from 'redux-saga/effects';
import type { Container } from 'react-dom';
import type { Draft } from 'immer';
import type { ClassTarget } from './decoratorModel/types';

/**
 * @summary History类型.history库v5.x跟4.x不太一样,为了之后升级,所以在这里定义个BrowserHistory
 */
export interface BrowserHistory<S extends LocationState = LocationState> extends History<S> {}
/**
 * @summary 项目中的reducer应该有个约定俗成,action必须包含payload对象,来传送真正的数据才对
 */
export interface DvaAction<S = any> extends AnyAction {
    payload?: S extends object ? {
        [P in keyof S]?: S[P] 
    } : S;
}
/**
 * @summary reducer
 */
export type ReduxReducer<S = any, A extends Action = AnyAction> = (
    state: S,
    action: A
) => S
export type Reducer<S = any, A extends Action = DvaAction<S>> = ReduxReducer<S, A>;
/**
 * @summary reducers
 */
export type Reducers<S = any> = {
    [propName: string]: Reducer<S>
}
/**
 * @summary redux-saga的put类型,dva重载了这个方法
 */
type Put = typeof put;
/**
 * @summary redux-saga方法
 */
export interface EffectsCommandMap {
    take: typeof take;
    takeMaybe: typeof takeMaybe;
    put: Put,
    putResolve: typeof putResolve;
    all: typeof all;
    race: typeof race;
    call: typeof call;
    apply: typeof apply;
    cps: typeof cps;
    fork: typeof fork;
    spawn: typeof spawn;
    join: typeof join;
    cancel: typeof cancel;
    select: typeof select;
    actionChannel: typeof actionChannel;
    cancelled: typeof cancelled;
    flush: typeof flush;
    getContext: typeof getContext;
    setContext: typeof setContext;
    delay: typeof delay;
};
export type Selector<T> = (s: T) => any;
/**
 * @summary model.effects中接收的redux-saga方法.包括重载的put和select
 */
export interface ModelEffectsCommandMap extends Omit<EffectsCommandMap, 'put' | 'select'>{
    put: {
        (action: any): PutEffect<any>;
        resolve: (action: any) => PutEffect<any>;
    };
    select: <T = any>(fn: (state: T) => any) => SelectEffect;
}
export interface ISagaWithCatchEffect {}
/**
 * @summary reducer加强方法
 */
export type ReducerEnhancer<S = any> = (reducer: Reducer<S>) => Reducer<S>;
/**
 * @summary model.subscriptions对象内函数的param
 */
export interface SubscriptionAPI {
    history: BrowserHistory;
    /**
     * @todo Dispatch,为了兼容decorator
     */
    dispatch: (action: any) => any;
}
export type Subscription = (api: SubscriptionAPI, done: Function) => Function | void;
export interface SubscriptionsMapObject {
    [key: string]: Subscription;
}
/**
 * @summary model.reducers
 */
 export interface ModelReducer<S> {
    [propName: string]: Reducer<S>;
}
export type ReducersMapObjectWithEnhancer<S> = [ModelReducer<S>, ReducerEnhancer<S>];
/**
 * @summary immerReducer
 */
export type ImmerReducer<S = any, A extends Action = DvaAction<S>> = (
    state: Draft<S> | S,
    action: A
) => S | void | Draft<S>;
/**
 * @summary immerReducers
 */
export type ImmerReducers<S> = {
    [propName: string]: ImmerReducer<S>;
};
/**
 * @summary model.effects
 */
export type Effect = (action: any, effects: ModelEffectsCommandMap) => void;
export type EffectType = 'takeEvery' | 'takeLatest' | 'takeLeading' | 'watcher' | 'throttle' | 'debounce' | 'poll';
export type EffectWithType = [
    Effect,
    {
        type: EffectType;
        ms?: number;
        delay?: number;
    },
];
export interface EffectsMapObject {
    [key: string]: Effect | EffectWithType;
}
/**
 * @summary model
 */
export interface Model<S = any> {
    namespace?: string;
    state?: S;
    reducers?: ModelReducer<S> | ReducersMapObjectWithEnhancer<S>;
    effects?: EffectsMapObject;
    subscriptions?: SubscriptionsMapObject;
}
/**
 * @summary dva create options
 */
export interface ICreateHooksAndOpts extends Partial<Omit<Hooks, 'onAction'>> {
    history: BrowserHistory;
    initialState: any; // TODO: state type
    namespacePrefixWarning?: boolean;
    onAction: Hooks['onAction'] | Hooks['onAction'][];
}
/**
 * @summary dva.core createOpts
 */
export interface ICreateOpts {
    initialReducer: {
        router: Reducer;
        [propName: string]: Reducer;
    };
    setupMiddlewares: (middlewares: Middleware[]) => Middleware[];
    setupApp: (app: DvaCoreBase) => void;
}
/**
 * @summary dva.core 创建出来的store
 */
export interface InsideStore<S = any> extends Store<S> {
    runSaga?: SagaMiddleware['run'];
    asyncReducers?: Reducers<S>
}
/**
 * @summary dva.route
 */
export interface InsideAppRouter {
    (params: InsideAppRouterParams): ReactElement;
}
export interface InsideAppRouterParams {
    app: DvaInstance;
    history: NonNullable<DvaInstance['_history']>;
    [propName: string]: any;
}
/**
 * @summary history.listen
 */
export type InsideHistoryListenCallback = (
    location: BrowserHistory['location'],
    action: BrowserHistory['action'],
) => void;
/**
 * @summary dva.core
 */
export interface DvaCoreBase<S = any> {
    plugin: BasePlugin;
    _store?: InsideStore<S>;
    use: (plugin: Partial<Hooks>) => void;
    model: (m: Model) => void;
    unmodel: (namespace: string) => void;
    getSaga?: (
        effects: EffectsMapObject,
        model: Model,
        onError: InsideOnError,
        onEffect: OnEffect[],
        opts: Partial<ICreateHooksAndOpts>,
    ) => any;
    _models: Model[];
    run: boolean;
    hooksAndOpts: Partial<ICreateHooksAndOpts>;
    _history?: BrowserHistory;
}
/**
 * @summary dva实例
 */
export interface DvaInstance extends DvaCoreBase {
    start: (container?: string | Container) => void | ElementType;
    router: (router: InsideAppRouter) => void;
    _getProvider?: (router: InsideAppRouter) => (extraProps: any) => ReactElement;
}
/**
 * @summary dva.core 内部onError
 */
export interface InsideError extends Error {
    preventDefault?: () => void;
    _dontReject?: boolean;
}
export interface TExtension {
    key: string; 
    effectArgs: any[];
}
export interface InsideOnError {
    (e: InsideError | string, extension: TExtension): void;
}
export interface Unlisteners {
    [propName: string]: {
        funcs: (Function | void)[];
        nonFuncs: string[];
    }
}
/**
 * @summary 默认处理model.reducer的函数
 */
export interface HandleActions<S = any> {
    (
        handlers: Reducers<S>,
        defaultState: S,
    ): Reducer<S>;
}
/**
 * @summary model处理每个effect的钩子函数
 */
export interface OnEffect {
    (
        effect: (...args: any[]) => Generator,
        effects: EffectsCommandMap,
        model: Model,
        key: string,
    ): (...args: any[]) => Generator;
}
/**
 * 
 */
export interface ExtraEnhancers <S = any>{
    (storeCreator: StoreCreator): (reducer: Reducer<S>, preloadedState?: PreloadedState<S>, enhancer?: StoreEnhancer) => Store<S>
};
/**
 * @summary dva.core 的钩子函数
 */
export interface Hooks {
    onAction: Middleware;
    onError: (
        err: InsideError,
        dispatch?: Dispatch,
        extension?: TExtension,
    ) => void;
    onStateChange: (state: any) => void; // TODO: state type
    onHmr: (state: any) => void;
    onReducer: ReducerEnhancer<any>; // TODO: state type
    onEffect: OnEffect;
    extraReducers: Reducers;
    extraEnhancers: ExtraEnhancers[];
    _handleActions: HandleActions;
}
export type HooksType = {
    [K in keyof Hooks]: K extends 'extraEnhancers' ? Hooks[K] : (Hooks[K])[]
}
export type hooksKey = keyof Omit<Hooks, '_handleActions'>;
export interface InitHooks extends Omit<Hooks, 'onAction' | 'onError'>{
    onAction: Hooks['onAction'] | Hooks['onAction'][];
    onError: Hooks['onError'] | Hooks['onError'][];
}
/**
 * @summary ts4.4+版本,属性undefined必须显示表达
 * @example
 * {
 *   prop?: string // prop: undefined is error
 *   prop?: string | undefined // prop: undefined is success
 * }
 */
export type PluginInit<
    T extends InitHooks,
> = {
    [K in keyof T]?: T[K] | undefined;
}
/**
 * @summary dva.core.plugin
 */
export interface BasePlugin {
    _handleActions: HandleActions;

    init(plugin: PluginInit<InitHooks>): void;
    use(plugin: Partial<Omit<Hooks, 'extraEnhancers' | 'extraEnhancers' | 'onHmr'>>): void;
    apply<
        T extends 'onError' | 'onHmr'
    >(
        key: T,
        defaultHandler?: (...args: any[]) => void
    ): (...args: any[]) => void;
    get<
        K extends Exclude<hooksKey, 'extraReducers' | 'onReducer'>,
    >(key: K): HooksType[K];
    getHookExtraReducers<K extends Extract<hooksKey, 'extraReducers'>>(key: K): Reducers;
    getHookOnReducer<K extends Extract<hooksKey, 'onReducer'>>(key: K): (reducer: Reducer) => Reducer
}
/**
 * @summary 动态组件的接收参数
 */
export interface IDynamic {
    app: DvaCoreBase;
    models: () => Array<(Promise<{ default: Model | ClassTarget }>)>;
    component: () => (Promise<{ default: React.ComponentType<any> }> | React.ComponentType<any>);
    resolve?: () => Promise<React.ComponentType<any>>;
    LoadingComponent?: FunctionComponent;
}