import modelExtend from 'dva-model-extend';

// tool
import {
    MODEL_MODEL_TYPE,
    MODEL_NAMESPACE_TYPE,
    MODEL_EFFECTS_TYPE,
    MODEL_REDUCERS_TYPE,
    MODEL_SUBSCRIPTIONS_TYPE,
    MODEL_STATE_TYPE,
} from './decoratorSymbols';
import metadata from './metadata';
import modelsContainer from './modelContainer';

// interface
import { DvaModelOptions, ClassTarget } from './types';

const modelProperty = [
    MODEL_EFFECTS_TYPE,
    MODEL_REDUCERS_TYPE,
    MODEL_SUBSCRIPTIONS_TYPE,
];

/**
 * 将model设置在当前的class.proptype上
 * @param param0 {DvaModelOptions}
 * @returns Decorator
 */
export default function model<S extends Record<string, any>>({
    namespace,
    state,
}: DvaModelOptions<S>): ClassDecorator {
    return (target: ClassTarget) => {
        let currentModel = {
            namespace,
            state: state ?? {},
            effects: {},
            reducers: {},
            subscriptions: {},
        };
        // 获取到当前类上的model属性
        /* eslint-disable no-param-reassign */
        modelProperty.reduce((model, currentSymbols) => {
            const currentValue = metadata.getOwn(currentSymbols, target.prototype) ?? {};
            if (currentValue) {
                switch(currentSymbols) {
                    case MODEL_EFFECTS_TYPE:
                        model.effects = currentValue;
                        break;
                    case MODEL_REDUCERS_TYPE:
                        model.reducers = currentValue;
                        break;
                    case MODEL_SUBSCRIPTIONS_TYPE:
                        model.subscriptions = currentValue;
                        break;
                    default:
                        return model;
                }
            }
            return model;
        }, currentModel);
        // 获取到父类的model属性值,进行合并
        const parentProto: any = Reflect.getPrototypeOf(target.prototype);
        if (parentProto && parentProto.constructor.name !== 'Object' && metadata.hasOwn(MODEL_MODEL_TYPE, parentProto)) {
            currentModel =  modelExtend(metadata.getOwn(MODEL_MODEL_TYPE, parentProto), currentModel);
        }
        metadata.define(
            MODEL_MODEL_TYPE,
            currentModel,
            target.prototype
        );
        metadata.define(
            MODEL_STATE_TYPE,
            currentModel.state,
            target.prototype
        );
        if (namespace) {
            metadata.define(MODEL_NAMESPACE_TYPE, namespace, target.prototype);
        }
        if (namespace) {
            const instance = Reflect.construct(target, []);
            modelsContainer.set(instance);
        }
    };
};
