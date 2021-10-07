import { createStore as reduxCreateStore, applyMiddleware, compose } from 'redux';
import invariant from 'invariant';

// tool
import { returnSelf } from './utils';

// interface
import type { Middleware, PreloadedState, Reducer as ReduxReducer } from 'redux';
import type { BasePlugin, DvaAction, ICreateOpts, Reducer } from '../types';
import type { SagaMiddleware } from 'redux-saga';

export default function createStore<S = any>({
    reducers,
    initialState,
    plugin,
    sagaMiddleware,
    promiseMiddleware,
    createOpts: { setupMiddlewares = returnSelf },
}: {
    reducers: Reducer<S>,
    initialState: PreloadedState<S>,
    plugin: BasePlugin,
    createOpts: Partial<ICreateOpts>,
    sagaMiddleware: SagaMiddleware,
    promiseMiddleware: Middleware<Record<string, any>, S>
}) {
    // extra enhancers
    const extraEnhancers = plugin.get('extraEnhancers');
    invariant(
        Array.isArray(extraEnhancers),
        `[app.start] extraEnhancers should be array, but got ${typeof extraEnhancers}`,
    );

    const extraMiddlewares = plugin.get('onAction');
    const middlewares = setupMiddlewares([
        promiseMiddleware,
        sagaMiddleware,
        ...extraMiddlewares.flat(Infinity),
    ]);
    /* eslint-disable @typescript-eslint/ban-ts-comment */
    // @ts-ignore
    const composeEnhancers = process.env.NODE_ENV !== 'production' && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
        /* eslint-disable @typescript-eslint/ban-ts-comment */
        // @ts-ignore
        ? window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({ trace: true, maxAge: 30 })
        : compose;

    const enhancers = [applyMiddleware(...middlewares), ...extraEnhancers];

    return reduxCreateStore<
        S,
        DvaAction,
        Record<string, any>,
        any
    >(
        reducers as ReduxReducer<S>,
        initialState,
        composeEnhancers(...enhancers),
    );
}
