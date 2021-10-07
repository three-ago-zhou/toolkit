import DvaCore from '../index';

// interface
import type { Reducer } from '../../types';

describe("checkModel", () => {
    it("namespace should be defined", () => {
        const core = new DvaCore();
        expect(() => {
            core.model({});
        }).toThrowError(/\[app\.model\] namespace should be defined/);
    });
    it("namespace should be unique", () => {
        const core = new DvaCore();
        expect(() => {
            core.model({
                namespace: 'repeat',
            });
            core.model({
                namespace: 'repeat',
            });
        }).toThrowError(/\[app\.model\] namespace should be unique/)
    });
    it("reducers can be specified array", () => {
        const core = new DvaCore();
        expect(() => {
            core.model({
                namespace: '_array',
                reducers: [{}, (r: Reducer) => r]
            });
        }).not.toThrowError();
    });
    it("reducers can be object", () => {
        const core = new DvaCore();
        expect(() => {
            core.model({
                namespace: '_object',
                reducers: {}
            });
        }).not.toThrow();
    });
    it("subscriptions can be undefiend", () => {
        const core = new DvaCore();
        expect(() => {
            core.model({
                namespace: "_",
            });
        }).not.toThrow();
    });
    it("effects should be plain object", () => {
        const core = new DvaCore();
        expect(() => {
            core.model({
                namespace: '_',
                effects: {}
            });
        }).not.toThrow();
    });
});
