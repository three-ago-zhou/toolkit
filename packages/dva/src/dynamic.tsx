import React from 'react';

// tool
import warning from 'warning';
import { isClassModel, getModel } from './decoratorModel/utils';

// interface
import type { FunctionComponent } from 'react';
import type {
    IDynamic,
    Model,
    DvaCoreBase,
} from './types';
import type { ClassTarget } from './decoratorModel/types';

interface DynamicComponentState {
    AsyncComponent: React.ComponentType<any>;
}

const cached: Map<string, boolean> = new Map();

let defaultLoadingComponent: FunctionComponent = () => <div>loading...</div>;

/* eslint-disable consistent-return */
function registerModel(
    app: DvaCoreBase,
    model: (Model | ClassTarget),
): string | void {
    if (!app.run) {
        warning(false, '请先调用app.start');
        return;
    }
    let _model: Model | null = null;
    if (isClassModel(model)) {
        const classModel = getModel(model);
        if (classModel) {
            _model = classModel
        }
    } else {
        _model = model;
    }
    if (_model && _model.namespace) {
        if (!cached.has(_model.namespace)) {
            app.model(_model);
            cached.set(_model.namespace, true);
        }
        return _model.namespace;
    }
    warning(false, `${model.toString()}没有携带namespace`);
}

function defaultResolve(config: IDynamic) {
    const { app, models, component } = config;
    return new Promise<React.ComponentType>((resolve) => {
        const _models = models();
        const _component = component();
        Promise.all<any>([..._models, _component]).then((ret) => {
            if (!_models || !_models.length) {
                resolve(ret[0].default ?? ret[0]);
                return;
            }
            const len = _models.length;
            ret.slice(0, len).forEach(m => {
                const _m = m.default || m;
                registerModel(app, _m);
            });
            resolve(ret[len].default ?? ret[len]);
        });
    });
};

function asyncComponent(
    config: IDynamic
) {
    const { resolve } = config;
    const LoadingComponent = config.LoadingComponent || defaultLoadingComponent;
    return class DynamicComponent extends React.PureComponent<any, DynamicComponentState> {
        constructor(...args: any[]) {
            /* eslint-disable @typescript-eslint/ban-ts-comment */
            // @ts-ignore
            super(...args);
            this.state = {
                AsyncComponent: LoadingComponent,
            };
        }

        override componentDidMount() {
            if (resolve) {
                resolve().then((c) => {
                    if (c) {
                        this.setState({
                            AsyncComponent: c,
                        });
                    }
                });
            }
        }

        override render() {
            const { AsyncComponent } = this.state;
            return (
                <React.Fragment>
                    <AsyncComponent />
                </React.Fragment>
            );
        }
    };
}

export default function dynamic(
    config: IDynamic
) {
    return asyncComponent({
        resolve: config.resolve ?? defaultResolve.bind(null, config),
        ...config,
    });
}

/**
 * 设置动态加载组件时的loading方法
 * @param LoadingComponent 动态加载组件时的loading组件
 * @returns {void}
 */
dynamic.setDefaultLoadingComponent = (
    LoadingComponent: FunctionComponent
) => {
    defaultLoadingComponent = LoadingComponent;
};