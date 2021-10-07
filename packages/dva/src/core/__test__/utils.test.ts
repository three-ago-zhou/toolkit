import { isObject } from '../utils';

describe("utils", () => {
    describe("isObject", () => {
        it("should return false", () => {
            expect(isObject(true)).toBeFalsy();
        });
        it("should return true", () => {
            expect(isObject({})).toBeTruthy();
        });
        it("instance should return true", () => {
            class A {}
            expect(isObject(new A())).toBeTruthy();
        });
    });
});