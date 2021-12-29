import {
    compose,
    remove,
    getMetaInfo,
    rejectCompose,
} from '../utils';

describe("creams-fetch utils test", () => {
    it("compose test empty array", () => {
        const empty: ((p: any) => any)[] = [];
        const result = {
            hello: 'hello',
        };
        const composeFunc = compose(empty);

        expect(composeFunc(result)).resolves.toBe(result);
    });

    it("compose sequential execution function", async () => {
        const expectArr: number[] = [];
        const array = [
            (p: number) => {
                expectArr.push(p);
                return Promise.resolve(p + 1);
            },
            (p: number) => {
                expectArr.push(p);
                return Promise.resolve(p + 1);
            },
            (p: number) => {
                expectArr.push(p);
                return Promise.resolve(p + 1);
            },
        ];
        const count = 0;
        const composeFunc = compose(array);
        await composeFunc(count);

        expect(expectArr).toEqual(expect.arrayContaining([0, 1, 2]));
    });

    it("compose break reject function", async () => {
        const expectArr: number[] = [];
        const array = [
            (p: number) => {
                expectArr.push(p);
                return Promise.resolve(p + 1);
            },
            (p: number) => {
                expectArr.push(p);
                return Promise.reject(p + 1);
            },
            (p: number) => {
                expectArr.push(p);
                return Promise.resolve(p + 1);
            },
        ];
        const count = 0;
        const composeFunc = compose(array);
        try {
            await composeFunc(count);
        } catch(e) {
            expect(e).toBe(2);
        }

        expect(expectArr).toHaveLength(2);
        expect(expectArr).toEqual(expect.arrayContaining([0, 1]));
    });

    it("compose break only reject function", async () => {
        const expectArr: number[] = [];
        const array = [
            (p: number) => {
                expectArr.push(p);
                return Promise.reject(p + 1);
            },
        ];
        const count = 0;
        const composeFunc = compose(array);
        try {
            await composeFunc(count);
        } catch(e) {
            expect(e).toBe(1);
        }

        expect(expectArr).toHaveLength(1);
        expect(expectArr).toEqual(expect.arrayContaining([0])); 
    });

    it("rejectCompose test empty array", () => {
        const empty: ((p: any) => any)[] = [];
        const result = {
            hello: 'hello',
        };
        const composeFunc = rejectCompose(empty);

        expect(composeFunc(result)).rejects.toBe(result);
    });

    it("rejectCompose sequential execution function", (done) => {
        const expectArr: number[] = [];
        const array = [
            (p: number) => {
                expectArr.push(p);
                return Promise.reject(p + 1);
            },
            (p: number) => {
                expectArr.push(p);
                return Promise.reject(p + 1);
            },
            (p: number) => {
                expectArr.push(p);
                return Promise.reject(p + 1);
            },
        ];
        const count = 0;
        const composeFunc = rejectCompose(array);
        composeFunc(count).catch((n) => {

            expect(n).toBe(3);
            expect(expectArr).toEqual(expect.arrayContaining([0, 1, 2]));

            done();
        });
    });

    it("rejectCompose break resolve function", (done) => {
        const expectArr: number[] = [];
        const array = [
            (p: number) => {
                expectArr.push(p);
                return Promise.reject(p + 1);
            },
            (p: number) => {
                expectArr.push(p);
                return Promise.resolve(p + 1);
            },
            (p: number) => {
                expectArr.push(p);
                return Promise.reject(p + 1);
            },
        ];
        const count = 0;
        const composeFunc = rejectCompose(array);
        composeFunc(count).then((n) => {

            expect(n).toBe(2);
            expect(expectArr).toHaveLength(2);
            expect(expectArr).toEqual(expect.arrayContaining([0, 1]));

            done();
        });
    });

    it("rejectCompose break only resolve function", async () => {
        const expectArr: number[] = [];
        const array = [
            (p: number) => {
                expectArr.push(p);
                return Promise.resolve(p + 1);
            },
        ];
        const count = 0;
        const composeFunc = rejectCompose(array);
        const n = await composeFunc(count);
        
        expect(n).toBe(1);
        expect(expectArr).toHaveLength(1);
        expect(expectArr).toEqual(expect.arrayContaining([0])); 
    });

    it("remove exist array unit item", () => {
        const a = () => {};
        const array = [a];
        remove(array, a);

        expect(array).toHaveLength(0);
    });

    it("negation remove array", () => {
        const a = () => {};
        const array = [a];
        const b = () => {};
        remove(array, b);

        expect(array).toHaveLength(1);
        expect(array).toHaveProperty([0], a);
    });

    it("get metaInfo container name", () => {
        expect(getMetaInfo('hello')).toHaveProperty('name', 'hello');
    });

    it("get metaInfo container name is anonymous", () => {
        expect(getMetaInfo()).toHaveProperty('name', 'anonymous');
    });
});
