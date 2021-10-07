import ReactDOM from 'react-dom';
import React from 'react';
import {
    Provider,
} from 'react-redux';
import { connectRouter, routerMiddleware } from 'connected-react-router';
import { createBrowserHistory } from 'history';

// tool
import invariant from 'invariant';
import { isFunction } from './core/utils';
import DvaCore from './core/index';

// interface
import type { ReactElement } from 'react';
import type { Middleware } from 'redux';
import type {
    ICreateHooksAndOpts,
    InsideAppRouter,
    InsideStore,
    InsideHistoryListenCallback,
    BrowserHistory,
    DvaCoreBase,
    DvaInstance,
} from './types';
import type { Container } from 'react-dom';

export * from './types';
export * from './decoratorModel';
export * from './hooks';

const _history = createBrowserHistory();

function isHTMLElement(node: Container) {
    return typeof node === 'object' && node !== null && node.nodeType && node.nodeName;
};

function isString(str?: string | Container): str is string {
    return typeof str === 'string';
};

/* eslint-disable no-use-before-define */
function getProvider(
    store: InsideStore,
    app: Dva,
    router: InsideAppRouter,
) {
    const DvaRoot = (extraProps: any) => (
        <Provider store={store}>{router({ app, history: app._history, ...extraProps })}</Provider>
    );
    return DvaRoot;
};

/* eslint-disable no-use-before-define */
function render(
    container: Container,
    store: InsideStore,
    app: Dva,
    router: InsideAppRouter,
) {
    ReactDOM.render(React.createElement(getProvider(store, app, router)), container);
};

function patchHistory(history: BrowserHistory) {
    const oldListen = history.listen;
    const listen = (callback: InsideHistoryListenCallback) => {
        // TODO: refact this with modified ConnectedRouter
        // Let ConnectedRouter to sync history to store first
        // connected-react-router's version is locked since the check function may be broken
        // min version of connected-react-router
        // e.g.
        // function (e, t) {
        //     var n = arguments.length > 2 && void 0 !== arguments[2] && arguments[2];
        //     r.inTimeTravelling ? r.inTimeTravelling = !1 : a(e, t, n)
        // }
        // ref: https://github.com/umijs/umi/issues/2693
        const cbStr = callback.toString();
        const isConnectedRouterHandler =
            (callback.name === 'handleLocationChange' && cbStr.indexOf('onLocationChanged') > -1) ||
            (cbStr.indexOf('.inTimeTravelling') > -1 &&
                cbStr.indexOf('.inTimeTravelling') > -1 &&
                cbStr.indexOf('arguments[2]') > -1);
        callback(history.location, history.action);
        return oldListen.call(history, (...args) => {
            if (isConnectedRouterHandler) {
                callback(...args);
            } else {
                // Delay all listeners besides ConnectedRouter
                setTimeout(() => {
                    callback(...args);
                });
            }
        });
    };
    return {
        ...history,
        listen,
    }
};

class Dva extends DvaCore {
    public _getProvider?: (router: InsideAppRouter) => (extraProps: any) => ReactElement;

    private _router?: InsideAppRouter;

    constructor(
        opts: Partial<ICreateHooksAndOpts> = {},
    ) {
        super(opts, {
            initialReducer: {
                router: connectRouter(opts.history || _history),
            },
            setupMiddlewares(middlewares: Middleware[]) {
                return [routerMiddleware(opts.history || _history), ...middlewares];
            },
            setupApp(app: DvaCoreBase) {
                /* eslint-disable no-param-reassign */
                app._history = patchHistory(opts.history || _history);
            },
        });
    }

    router = (router: InsideAppRouter) => {
        invariant(
            isFunction(router),
            `[app.router] router should be function, but got ${typeof router}`,
        );
        this._router = router;
    };
    
    /* eslint-disable consistent-return */
    override start = (container?: string | Container): void | React.ElementType => {
        let _container: Container | undefined = !isString(container) ? container : undefined;
        // 允许 container 是字符串，然后用 querySelector 找元素
        if (isString(container)) {
            _container = document.querySelector(container) ?? undefined;
            invariant(_container, `[app.start] container ${_container} not found`);
        }

        // 并且是 HTMLElement
        invariant(
            !_container || isHTMLElement(_container),
            `[app.start] container should be HTMLElement`,
        );

        // 路由必须提前注册
        invariant(this._router, `[app.start] router must be registered before app.start()`);

        // store必须存在
        if (!this._store) {
            super.start();
        }
        
        // export _getProvider for HMR
        // ref: https://github.com/dvajs/dva/issues/469
        this._getProvider = getProvider.bind(null, this._store!, this);

        // If has container, render; else, return react component
        if (_container) {
            render(_container, this._store!, this, this._router);
            this.plugin.apply('onHmr')(render.bind(null, _container, this._store!, this));
        } else {
            return getProvider(this._store!, this, this._router);
        }
    };
};

export default function dva(
    opts: Partial<ICreateHooksAndOpts> = {}
): DvaInstance {
    const app = new Dva(opts);
    return app;
};
