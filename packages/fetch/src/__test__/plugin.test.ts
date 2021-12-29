import Plugin from '../plugin';
import { compose } from '../utils';

describe("creams-fetch plugin test", () => {
    it("plugin before", async () => {
        const plugin = new Plugin();
        const request = {};
        const beforeOne = (requestInit: RequestInit) => {
            const _requestInit = {
                ...requestInit,
            };
            _requestInit.headers = {
                ..._requestInit.headers,
                Accept: 'application/json',
                Authorization: 'Bearer',
            };
            return Promise.resolve(_requestInit);
        };
        const beforeTwo = (requestInit: RequestInit) => {
            return Promise.resolve(requestInit);
        };
        plugin.init({
            before: [beforeOne, beforeTwo],
        });
        const beforeFun = plugin.apply('before');
        const composeBefore = compose(beforeFun);
        const result = await composeBefore(request);

        const header = {};
        const addProp = jest.fn(beforeOne);
        const mockFn = await addProp(header);

        expect(mockFn).toHaveProperty(['headers', 'Authorization'], 'Bearer');
        expect(result).toHaveProperty(['headers', 'Authorization'], 'Bearer');
        expect(result).toHaveProperty(['headers', 'Accept'], 'application/json');
        expect(beforeFun.length).toBe(2);
    });

    it("plugin use and unUse", async () => {
        const plugin = new Plugin();
        const request = {};
        const beforeOne = (requestInit: RequestInit) => {

            expect(Object.keys(requestInit).length).toBe(0);

            const _requestInit = {
                ...requestInit,
            }
            _requestInit.headers = {
                ..._requestInit.headers,
                Accept: 'application/json',
                Authorization: 'Bearer',
            };
            return Promise.resolve(_requestInit);
        };
        plugin.init({
            before: [beforeOne],
        });
        function useBefore(requestInit: RequestInit) {
            const _requestInit = {
                ...requestInit,
            };
            delete (_requestInit.headers as any).Accept;
            return Promise.resolve(requestInit);
        };
        plugin.use({
            before: useBefore,
        });
        const beforeFun = plugin.apply('before');
        const composeBefore = compose(beforeFun);
        const result = await composeBefore(request);

        expect(result).toHaveProperty(['headers', 'Authorization'], 'Bearer');
        expect(result).not.toHaveProperty(['headers', 'Accept']);
        expect(beforeFun.length).toBe(2);

        plugin.unUse();

        expect(plugin.apply('before').length).toBe(1);
    });

    it("plugin apply empty", () => {
        const plugin = new Plugin();
        const request = {
            headers: {
                Accept: 'application/json',
            },
        };
        const beforeFun = plugin.apply('before');
        const composeBefore = compose(beforeFun);

        expect(beforeFun.length).toBe(0);
        expect(composeBefore(request)).resolves.toHaveProperty(['headers', 'Accept'], 'application/json');
    });

    it("every plugin flush", () => {
        const plugin = new Plugin();
        const expectArr: string[] = [];
        plugin.init({
            before: [(init) => {
                expectArr.push('before');
                return Promise.resolve(init);
            }],
            running: [(request) => {
                expectArr.push('running');
                return Promise.resolve(request);
            }],
            fulfilled: [(response) => {
                expectArr.push('fulfilled');
                return Promise.resolve(response);
            }],
            rejected: [(res) => {
                expectArr.push('rejected');
                return Promise.resolve(res);
            }],
            abort: [(taskError) => {
                expectArr.push('abort');
                return Promise.resolve(taskError);
            }],
        });
        compose(plugin.apply('before'))(new Request('test'));
        compose(plugin.apply('running'))(new Request('test'));
        compose(plugin.apply('fulfilled'))(
            new Response(
                JSON.stringify({ hello: 'hello' }),
                { headers: { 'content-type': 'application/json' } }
            )
        );
        compose(plugin.apply('rejected'))(
            new Response(
                JSON.stringify({ hello: 'hello' }),
                { headers: { 'content-type': 'application/json' }, status: 400 }
            )
        );
        compose(plugin.apply('abort'))({});

        expect(['before', 'running', 'fulfilled', 'rejected', 'abort']).toEqual(
            expect.arrayContaining(expectArr)
        )
    });
});