import {
    getActionNamespace,
    isClassModel,
    getModel,
} from '../utils';
import model from '../model';
import { NAMESPACE_SEP } from '../../core/constants';

describe("decoratorModel utils", () => {
    it("should be get prefix namespace", () => {
        expect(getActionNamespace(`namespace${NAMESPACE_SEP}test`)).toBe('namespace');
        expect(getActionNamespace(`namespace2${NAMESPACE_SEP}`)).toBe('namespace2');
        expect(getActionNamespace(`${NAMESPACE_SEP}test`)).toBeUndefined();
        expect(getActionNamespace(`test`)).toBeUndefined();
        expect(getActionNamespace(`${NAMESPACE_SEP}`)).toBeUndefined();
    });

    it("should be get true if Class", () => {
        expect(isClassModel(function A() {})).toBeTruthy();
        expect(isClassModel({})).toBeFalsy();
    });

    it("should be get model", () => {
        @model({
            namespace: 'test',
        })
        class Model {};

        expect(getModel(Model)).toHaveProperty('namespace', 'test');
        expect(getModel(Model)).toMatchObject({
            namespace: 'test',
            state: {},
            effects: {},
            reducers: {},
            subscriptions: {},
        });
    });

    test.skip("should be get undefined, if namespace is undefined", () => {
        @model({})
        class ModelTwo {};

        expect(getModel(ModelTwo)).toBeUndefined();
    });
});