import Core from '../core';
import Plugin from '../plugin';
import { TaskStatusEnum } from '../types';
import { server, user } from './mocks/server';

// interface
import type { GetType } from './mocks/server';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const core = new Core();
const plugin = new Plugin();
core.setConfig({
    prefixUrl: 'http://example.com/',
    plugin,
});
const request = core.request;

describe("core test", () => {
    it("core get user", async () => {
        const task = request<GetType>('user-application-json', {
            methods: 'GET',
            headers: {
                'content-type': 'application/json',
            },
        });
        const result = await task;
        const promiseResult = await task.task.toPromise();

        expect(result).toEqual(user);
        expect(promiseResult).toEqual(result);
        expect(task.task.result()).toEqual(user);
        expect(task.task.error()).toBeUndefined();
        expect(task.task.isRunning()).toBeFalsy();
        expect(task.task.isAborted()).toBeFalsy();
        expect(task.task.taskStatus).toBe(TaskStatusEnum.FUlFillED);
    });

    it("test plugin.before", async () => {
        const expectNumberArr: string[] = [];
        const task = request<GetType>(
            'user-application-json',
            {
                methods: 'GET',
                headers: {
                    'content-type': 'application/json',
                },
            },
            {
                before: (requestInit) => {
                    expectNumberArr.push(requestInit.methods!);
                    return Promise.resolve(requestInit);
                },
            }
        );
        expect(plugin.apply('before')).toHaveLength(0);
        // task内部plugin是不可见,所以用any
        expect((task.task as any).plugin.apply('before')).toHaveLength(1);

        const result = await task;

        expect(result).toEqual(user);
        expect(task.task.result()).toEqual(user);
        expect(task.task.error()).toBeUndefined();
        expect(task.task.isRunning()).toBeFalsy();
        expect(task.task.isAborted()).toBeFalsy();
        expect(task.task.taskStatus).toBe(TaskStatusEnum.FUlFillED);
        expect(['GET']).toEqual(
            expect.arrayContaining(expectNumberArr)
        );
        expect(plugin.apply('before')).toHaveLength(0);
        // task内部plugin是不可见,所以用any
        expect((task.task as any).plugin.apply('before')).toHaveLength(0);
    });

    it("test plugin.rejected reject to resolve 1", async () => {
        const task = request<GetType>(
            'get-error',
            {
                methods: 'GET',
            },
            {
                rejected: () => {
                    return Promise.resolve(new Response(JSON.stringify({ error: true })));
                },
            }
        );
        expect(plugin.apply('rejected')).toHaveLength(0);
        // task内部plugin是不可见,所以用any
        expect((task.task as any).plugin.apply('rejected')).toHaveLength(1);

        const result = await task;

        expect(result).toEqual(JSON.stringify({ error: true }));
        expect(task.task.isRunning()).toBeFalsy();
        expect(task.task.isAborted()).toBeFalsy();
        expect(task.task.error()).toBeUndefined();
        expect(task.task.taskStatus).toBe(TaskStatusEnum.REJECTED);
        expect(plugin.apply('rejected')).toHaveLength(0);
        // task内部plugin是不可见,所以用any
        expect((task.task as any).plugin.apply('rejected')).toHaveLength(0);
    });

    it("test plugin.rejected reject to resolve 2", async () => {
        const core = new Core();
        const plugin = new Plugin();
        plugin.init({
            rejected: [(response: Response) => {
                return Promise.reject(response);
            }],
        })
        core.setConfig({
            prefixUrl: 'http://example.com/',
            plugin,
        });
        const request = core.request;
        const task = request<GetType>(
            'get-error',
            {
                methods: 'GET',
            },
            {
                rejected: () => {
                    return Promise.resolve(new Response(JSON.stringify({ error: true })));
                },
            }
        );
        expect(plugin.apply('rejected')).toHaveLength(1);
        // task内部plugin是不可见,所以用any
        expect((task.task as any).plugin.apply('rejected')).toHaveLength(2);

        const result = await task;

        expect(result).toEqual(JSON.stringify({ error: true }));
        expect(task.task.isRunning()).toBeFalsy();
        expect(task.task.isAborted()).toBeFalsy();
        expect(task.task.error()).toBeUndefined();
        expect(task.task.taskStatus).toBe(TaskStatusEnum.REJECTED);
        expect(plugin.apply('rejected')).toHaveLength(1);
        // task内部plugin是不可见,所以用any
        expect((task.task as any).plugin.apply('rejected')).toHaveLength(1);
    });
});
