import { combineReducers } from 'redux';
import createSagaMiddleware from 'redux-saga';

// tool
import invariant from 'invariant';
import warning from 'warning';
import checkModel from './checkModel';
import prefixNamespace from './prefixNamespace';
import Plugin from './Plugin';
import createStore from './createStore';
import getSaga from './getSaga';
import getReducer from './getReducer';
import createPromiseMiddleware from './createPromiseMiddleware';
import { run as runSubscription, unlisten as unlistenSubscription } from './subscription';
import { noop } from './utils';
import modelContainer from '../decoratorModel/modelContainer';

// interface
import type {
    ReducersMapObject,
} from 'redux';
import type {
    ICreateHooksAndOpts,
    ICreateOpts,
    DvaCoreBase,
    Model,
    InsideOnError,
    Unlisteners,
    InsideError,
    BasePlugin,
    InsideStore,
    Hooks,
    EffectsMapObject,
    OnEffect,
    BrowserHistory,
    Reducer,
} from '../types';

// Internal model to update global state when do unmodel
const dvaModel = {
    namespace: '@@dva',
    state: 0,
    reducers: {
        UPDATE(state: number) {
            return state + 1;
        },
    },
};

/**
 * Register model before app is started.
 *
 * @param m {Object} model to register
*/
function prefixedModel(this: DvaCoreBase, m: Model){
    /* eslint-disable @typescript-eslint/ban-ts-comment */
    // @ts-ignore
    if (process.env.NODE_ENV !== 'production') {
        checkModel(m, this._models);
    }
    const prefixedModel = prefixNamespace({ ...m });
    if (prefixedModel) {
        this._models.push(prefixedModel);
    }
    return prefixedModel;
};

/**
 * Inject model after app is started.
 *
 * @param createReducer
 * @param onError
 * @param unlisteners
 * @param m
 */
function injectModel<S = any>(
    this: DvaCoreBase,
    createReducer: () => Reducer<S>,
    onError: InsideOnError,
    unlisteners: Unlisteners,
    m: Model<S>,
) {
    if (!this.run || !this._store || !this._store.asyncReducers || !this._store.runSaga) {
        warning(false, '请先调用app.start');
        return;
    }
    if (!m.namespace || m.namespace.length === 0) {
        warning(false, `${m.toString()}没有携带namespace`);
        return;
    }
    const _m = prefixedModel.call(this, m);
    if (_m === undefined) {
        return;
    }
    this._store.asyncReducers[_m.namespace!] = getReducer<S>(_m.reducers, _m.state, this.plugin._handleActions);
    this._store.replaceReducer(createReducer());
    if (_m.effects) {
        this._store.runSaga(this.getSaga!(_m.effects, _m, onError, this.plugin.get('onEffect'), this.hooksAndOpts));
    }
    if (_m.subscriptions && _m.namespace) {
        /* eslint-disable no-param-reassign */
        unlisteners[_m.namespace] = runSubscription(_m.subscriptions, _m, this, onError);
    }
};

/**
 * Unregister model.
 *
 * @param createReducer
 * @param reducers
 * @param unlisteners
 * @param namespace
 *
 * Unexpected key warn problem:
 * https://github.com/reactjs/redux/issues/1636
 */
function unmodel<S = any>(
    this: DvaCoreBase,
    createReducer: () => Reducer<S>,
    reducers: ReducersMapObject<S>,
    unlisteners: Unlisteners,
    namespace: string,
) {
    if (!this.run || !this._store || !this._store.asyncReducers) {
        warning(this.run, '请先调用app.start');
        return;
    }
    // Delete reducers
    const deleteAsyncReducers = Reflect.deleteProperty(this._store.asyncReducers, namespace);
    warning(deleteAsyncReducers, `unmodel方法删除asyncReducers[${namespace}]失败`);
    const deleteReducers = Reflect.deleteProperty(reducers, namespace);
    warning(deleteReducers, `unmodel方法删除reducers[${namespace}]失败`);

    this._store.replaceReducer(createReducer());
    this._store.dispatch({ type: '@@dva/UPDATE' });
    // Cancel effects
    this._store.dispatch({ type: `${namespace}/@@CANCEL_EFFECTS` });

    // Unlisten subscrioptions
    unlistenSubscription(unlisteners, namespace);

    // Delete model from app._models
    this._models = this._models.filter(model => model.namespace !== namespace);

    // delete modelContainer ClassModel
    if (modelContainer.has(namespace)) {
        modelContainer.delete(namespace);
    }
};

/**
 * Replace a model if it exsits, if not, add it to app
 * Attention:
 * - Only available after dva.start gets called
 * - Will not check origin m is strict equal to the new one
 * Useful for HMR
 * @param createReducer
 * @param reducers
 * @param unlisteners
 * @param onError
 * @param m
 */
function replaceModel<S = any>(
    this: DvaCoreBase,
    _createReducer: () => Reducer<S>,
    reducers: ReducersMapObject<S>,
    unlisteners: Unlisteners,
    _onError: InsideOnError,
    m: Model<S>
) {
    if (!this.run || !this._store || !this._store.asyncReducers || !this.model) {
        warning(!this.run, '请先调用app.start');
        return;
    }
    const { namespace } = m;
    if (!namespace) {
        warning(false, `${m.toString()}没有携带namespace`);
        return;
    }
    const oldModelIdx = this._models.findIndex(model => model.namespace === namespace);
    if (oldModelIdx > -1) {
        // Cancel effects
        this._store.dispatch({ type: `${namespace}/@@CANCEL_EFFECTS` });
        
        // Delete reducers
        const deleteAsyncReducers = Reflect.deleteProperty(this._store.asyncReducers, namespace);
        warning(deleteAsyncReducers, `unmodel方法删除asyncReducers[${namespace}]失败`);
        const deleteReducers = Reflect.deleteProperty(reducers, namespace);
        warning(deleteReducers, `unmodel方法删除reducers[${namespace}]失败`);

        // Unlisten subscrioptions
        unlistenSubscription(unlisteners, namespace);

        // Delete model from app._models
        this._models.splice(oldModelIdx, 1);
    }
    // add new version model to store
    this.model(m);
    this._store.dispatch({ type: '@@dva/UPDATE' });
}

export default class DvaCore<S = any> implements DvaCoreBase<S> {
    public plugin: BasePlugin;

    public _models: Model[];

    public _store?: InsideStore<S>;

    public use: (plugin: Partial<Hooks>) => void;

    public model: (m: Model) => void;

    public unmodel: (namespace: string) => void;

    public replaceModel?: (m: Model) => void;

    public getSaga?: (
        effects: EffectsMapObject,
        model: Model,
        onError: InsideOnError,
        onEffect: OnEffect[],
        opts: Partial<ICreateHooksAndOpts>,
    ) => any;

    public run: boolean;

    public readonly hooksAndOpts: Partial<ICreateHooksAndOpts>;

    public _history?: BrowserHistory;

    private createOpts: Partial<ICreateOpts>;

    constructor(
        hooksAndOpts: Partial<ICreateHooksAndOpts> = {},
        createOpts: Partial<ICreateOpts> = {},
    ) {
        this.createOpts = createOpts;
        this.hooksAndOpts = hooksAndOpts;

        this.plugin = new Plugin();
        this.plugin.init({
            onAction: hooksAndOpts.onAction,
            onError: hooksAndOpts.onError,
            onEffect: hooksAndOpts.onEffect,
            onHmr: hooksAndOpts.onHmr,
            onReducer: hooksAndOpts.onReducer,
            onStateChange: hooksAndOpts.onStateChange,
            _handleActions: hooksAndOpts._handleActions,
            extraEnhancers: hooksAndOpts.extraEnhancers,
            extraReducers: hooksAndOpts.extraReducers,
        });
        this._models = [{ ...dvaModel }];
        /**
         * 默认提供一个model的注入方法,在未start前,会提供一个报错,在start后,会被injectModel替代
         * @param _m 
         */
        this.model = prefixedModel.bind(this);
        /**
         * 默认提供一个model的注入方法,在未start前,会提供一个报错,在start后,会被injectModel替代
         * @param _m 
         */
        this.unmodel = (_n: string) => {
            warning(!this.run, '请先调用app.start');
        };
        this.use = this.plugin.use.bind(this.plugin);
        this.run = false;
        /**
         * 子类中可以通过super调用到
         * 用箭头函数会报错,所以用bind固定this
         */
        this.start = this.start.bind(this);
    }

    /**
     * Start the app.
     *
     * @returns void
    */
    start() {
        const {
            initialReducer,
            setupApp = noop,
        } = this.createOpts;
        /* eslint-disable no-param-reassign */
        // Global error handler
        const onError: InsideOnError = (err, extension) => {
            if (!this.run) {
                warning(false, '请先调用app.start');
                return;
            }
            if (err) {
                if (typeof err === 'string') {
                    err = new Error(err)
                };
                err.preventDefault = () => {
                    (err as InsideError)._dontReject = true;
                };
                if (this._store?.dispatch) {
                    this.plugin.apply('onError', (err: InsideError) => {
                        throw new Error((err.stack ?? err) as string);
                    })(err, this._store.dispatch, extension);
                }
            }
        };

        const sagaMiddleware = createSagaMiddleware();
        const promiseMiddleware = createPromiseMiddleware(this);
        this.getSaga = getSaga.bind(null);

        const sagas: any[] = [];
        const reducers = { ...initialReducer };
        this._models.forEach((m) => {
            if (m.namespace) {
                reducers[m.namespace] = getReducer(m.reducers, m.state, this.plugin._handleActions);
            } else {
                warning(m.namespace, `${m.toString()}没有携带namespace`);
            }
            if (m.effects) {
                sagas.push(this.getSaga!(m.effects, m, onError, this.plugin.get('onEffect'), this.hooksAndOpts));
            }
        })
        const reducerEnhancer = this.plugin.getHookOnReducer('onReducer');
        const extraReducers = this.plugin.getHookExtraReducers('extraReducers');
        invariant(
            Object.keys(extraReducers).every(key => !(key in reducers)),
            `[app.start] extraReducers is conflict with other reducers, reducers list: ${Object.keys(
                reducers,
            ).join(', ')}`,
        );

        /**
         * Create global reducer for redux.
         *
         * @returns {Object}
         */
        const createReducer = () => reducerEnhancer(
            combineReducers({
                ...reducers,
                ...extraReducers,
                ...(this._store ? this._store.asyncReducers : {}),
            }),
        );

        // Create store
        this._store = createStore<S>({
            reducers: createReducer(),
            initialState: this.hooksAndOpts.initialState ?? {},
            plugin: this.plugin,
            createOpts: this.createOpts,
            sagaMiddleware,
            promiseMiddleware,
        });

        // Extend store
        this._store.runSaga = sagaMiddleware.run;
        this._store.asyncReducers = {};

        // Execute listeners when state is changed
        const listeners = this.plugin.get('onStateChange');
        listeners.forEach((listener) => {
            this._store?.subscribe(() => {
                listener(this._store!.getState());
            });
        });

        // Run sagas
        sagas.forEach(sagaMiddleware.run);

        // Setup app
        setupApp(this);

        // subscriptions
        const unlisteners: Unlisteners = {};

        // Setup app.model and app.unmodel
        this.model = injectModel.bind(this, createReducer, onError, unlisteners);
        this.unmodel = unmodel.bind(this, createReducer, reducers, unlisteners);
        this.replaceModel = replaceModel.bind(this, createReducer, reducers, unlisteners, onError);
        this.run = true;

        // Run subscriptions
        this._models.forEach((model) => {
            if (model.subscriptions) {
                if (model.namespace) {
                    unlisteners[model.namespace] = runSubscription(model.subscriptions, model, this, onError);
                } else {
                    warning(false, `${model.toString()}没有携带namespace`);
                }
            }
        });
    }
};
