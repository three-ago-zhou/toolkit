import Task from '../task';
import Plugin from '../plugin';
import { TaskStatusEnum } from '../types';
import { server, user } from './mocks/server';

// interface
import type { GetType } from './mocks/server';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("task test", () => {
    it("task get user", async () => {
        const plugin = new Plugin();
        const task = new Task({
            url: 'http://example.com/user-application-json',
            plugin,
            requestInit: {
                method: 'GET',
            },
        });
        const request = await task.request;

        expect(request).toEqual(user);
        expect(task.result()).toEqual(user);
        expect(task.isRunning()).toBeFalsy();
        expect(task.isAborted()).toBeFalsy();
        expect(task.error()).toBeUndefined();
    });

    it("task is abort", (done) => {
        const plugin = new Plugin();
        const task = new Task({
            url: 'http://example.com/delay',
            plugin,
            requestInit: {
                method: 'GET',
            },
        });
        task.request.catch((e) => {
            expect(e).toEqual({
                name: 'AbortError',
                message: 'The user aborted a request.',
                type: TaskStatusEnum.ABORTED,
            });
            expect(task.result()).toBeUndefined();
            expect(task.isRunning()).toBeFalsy();
            expect(task.isAborted()).toBeTruthy();
            expect(task.error()).toEqual({
                name: 'AbortError',
                message: 'The user aborted a request.',
                type: TaskStatusEnum.ABORTED,
            });
            done();
        });
        setTimeout(() => {
            task.abortController.abortTask(task);
        }, 500);
    });

    it("task is abort set reason", (done) => {
        const plugin = new Plugin();
        const task = new Task({
            url: 'http://example.com/delay',
            plugin,
            requestInit: {
                method: 'GET',
            },
        });
        task.request.catch((e) => {
            expect(e).toEqual({
                name: 'AbortError',
                message: 'manualAbort',
                type: TaskStatusEnum.ABORTED,
            });
            expect(task.result()).toBeUndefined();
            expect(task.isRunning()).toBeFalsy();
            expect(task.isAborted()).toBeTruthy();
            expect(task.error()).toEqual({
                name: 'AbortError',
                message: 'manualAbort',
                type: TaskStatusEnum.ABORTED,
            });
            done();
        });
        setTimeout(() => {
            task.abortController.abortTask(task, 'manualAbort');
        }, 500);
    });

    it("task is abort set reason", (done) => {
        const plugin = new Plugin();
        const task = new Task({
            url: 'http://example.com/delay',
            plugin,
            requestInit: {
                method: 'GET',
            },
        });
        task.request.catch((e) => {
            expect(e).toEqual({
                name: 'AbortError',
                message: 'manualAbort',
                type: TaskStatusEnum.ABORTED,
            });
            expect(task.result()).toBeUndefined();
            expect(task.isRunning()).toBeFalsy();
            expect(task.isAborted()).toBeTruthy();
            expect(task.error()).toEqual({
                name: 'AbortError',
                message: 'manualAbort',
                type: TaskStatusEnum.ABORTED,
            });
            done();
        });
        task.abortController.abortTask(task, 'manualAbort');
    });

    it("task post user", async () => {
        const plugin = new Plugin();
        const task = new Task({
            url: 'http://example.com/user',
            plugin,
            requestInit: {
                method: 'POST',
                headers: {
                    'content-type': 'application/json',
                },
                body: JSON.stringify(user),
            },
        });
        const request = await task.request;

        expect(request).toEqual(user);
        expect(task.result()).toEqual(user);
        expect(task.isRunning()).toBeFalsy();
        expect(task.isAborted()).toBeFalsy();
        expect(task.error()).toBeUndefined();
    });

    it("task post user delay", (done) => {
        const plugin = new Plugin();
        const task = new Task({
            url: 'http://example.com/post-delay',
            plugin,
            requestInit: {
                method: 'POST',
                headers: {
                    'content-type': 'application/json',
                },
                body: JSON.stringify(user),
            },
        });
        task.request.catch((e) => {
            expect(e).toEqual({
                name: 'AbortError',
                message: 'The user aborted a request.',
                type: TaskStatusEnum.ABORTED,
            });
            expect(task.result()).toBeUndefined();
            expect(task.isRunning()).toBeFalsy();
            expect(task.isAborted()).toBeTruthy();
            expect(task.error()).toEqual({
                name: 'AbortError',
                message: 'The user aborted a request.',
                type: TaskStatusEnum.ABORTED,
            });
            done();
        });

        setTimeout(() => {
            task.abortController.abortTask(task);
        }, 500);
    });

    it("task get error", (done) => {
        const plugin = new Plugin();
        const task = new Task({
            url: 'http://example.com/get-error',
            plugin,
            requestInit: {
                method: 'GET',
                headers: {
                    'content-type': 'application/json',
                },
            },
        });
        task.request.catch((err) => {
            expect(err).toMatchObject({
                name: 'RejectError',
                type: TaskStatusEnum.REJECTED,
            });
            expect(task.error()).toMatchObject({
                name: 'RejectError',
                type: TaskStatusEnum.REJECTED,
            });
            expect(task.isAborted()).toBeFalsy();
            expect(task.result()).toBeUndefined();
            expect(task.isRunning()).toBeFalsy();
            expect(task.taskStatus).toBe(TaskStatusEnum.REJECTED);
            done();
        });
    });

    it("task post error", (done) => {
        const plugin = new Plugin();
        const task = new Task({
            url: 'http://example.com/post-error',
            plugin,
            requestInit: {
                method: 'POST',
            },
        });
        task.request.catch((err) => {
            expect(err).toMatchObject({
                name: 'RejectError',
                type: TaskStatusEnum.REJECTED,
            });
            expect(task.error()).toMatchObject({
                name: 'RejectError',
                type: TaskStatusEnum.REJECTED,
            });
            expect(task.isAborted()).toBeFalsy();
            expect(task.result()).toBeUndefined();
            expect(task.isRunning()).toBeFalsy();
            expect(task.taskStatus).toBe(TaskStatusEnum.REJECTED);
            done();
        });
    });

    it("task result from toPromise", (done) => {
        const plugin = new Plugin();
        const task = new Task<GetType>({
            url: 'http://example.com/user-application-json',
            plugin,
            requestInit: {
                method: 'GET',
            },
        });

        task.toPromise().then((res) => {
            expect(res).toEqual(user);
            expect(task.result()).toEqual(res);
            expect(task.error()).toBeUndefined();
            expect(task.isRunning()).toBeFalsy();
            expect(task.isAborted()).toBeFalsy();
            done();
        });
    });

    it.skip("task error from toPromise", (done) => {
        const plugin = new Plugin();
        const task = new Task({
            url: 'http://example.com/get-error',
            plugin,
            requestInit: {
                method: 'GET',
                headers: {
                    'content-type': 'application/json',
                },
            },
        });
        task.toPromise().catch((err) => {
            expect(err).toMatchObject({
                name: 'RejectError',
                type: TaskStatusEnum.REJECTED,
            });
            expect(task.error()).toMatchObject({
                name: 'RejectError',
                type: TaskStatusEnum.REJECTED,
            });
            expect(task.isAborted()).toBeFalsy();
            expect(task.result()).toBeUndefined();
            expect(task.isRunning()).toBeFalsy();
            expect(task.taskStatus).toBe(TaskStatusEnum.REJECTED);
            done();
        });
    });

    it("task is success, plugin flush execute before,running,fulfill", (done) => {
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
        const task = new Task({
            url: 'http://example.com/user-application-json',
            plugin,
            requestInit: {
                method: 'GET',
            },
        });

        task.request.then((result) => {
            expect(result).toEqual(user);
            expect(task.result()).toEqual(user);
            expect(task.isRunning()).toBeFalsy();
            expect(task.isAborted()).toBeFalsy();
            expect(task.error()).toBeUndefined();
            expect(['before', 'running', 'fulfilled']).toEqual(
                expect.arrayContaining(expectArr)
            );
            done();
        });
    });

    it("task is error, plugin flush execute before,running,rejected", (done) => {
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
                return Promise.reject(res);
            }],
            abort: [(taskError) => {
                expectArr.push('abort');
                return Promise.resolve(taskError);
            }],
        });
        const task = new Task({
            url: 'http://example.com/post-error',
            plugin,
            requestInit: {
                method: 'POST',
            },
        });

        task.request.catch((err) => {
            expect(err).toMatchObject({
                name: 'RejectError',
                type: TaskStatusEnum.REJECTED,
            });
            expect(task.error()).toMatchObject({
                name: 'RejectError',
                type: TaskStatusEnum.REJECTED,
            });
            expect(task.isAborted()).toBeFalsy();
            expect(task.result()).toBeUndefined();
            expect(task.isRunning()).toBeFalsy();
            expect(task.taskStatus).toBe(TaskStatusEnum.REJECTED);
            expect(['before', 'running', 'rejected']).toEqual(
                expect.arrayContaining(expectArr)
            );
            done();
        });
    });

    // it("task is abort, plugin flush execute before,running,abort", (done) => {
    //     const plugin = new Plugin();
    //     const expectArr: string[] = [];
    //     plugin.init({
    //         before: [(init) => {
    //             expectArr.push('before');
    //             return Promise.resolve(init);
    //         }],
    //         running: [(request) => {
    //             expectArr.push('running');
    //             return Promise.resolve(request);
    //         }],
    //         fulfilled: [(response) => {
    //             expectArr.push('fulfilled');
    //             return Promise.resolve(response);
    //         }],
    //         rejected: [(res) => {
    //             expectArr.push('rejected');
    //             return Promise.reject(res);
    //         }],
    //         abort: [(taskError) => {
    //             expectArr.push('abort');
    //             return Promise.resolve(taskError);
    //         }],
    //     });
    //     const task = new Task({
    //         url: 'http://example.com/delay',
    //         plugin,
    //         requestInit: {
    //             method: 'GET',
    //         },
    //     });
    //     task.request.catch((e) => {
    //         expect(e).toEqual({
    //             name: 'AbortError',
    //             message: 'The user aborted a request.',
    //             type: TaskStatusEnum.ABORTED,
    //         });
    //         expect(task.result()).toBeUndefined();
    //         expect(task.isRunning()).toBeFalsy();
    //         expect(task.isAborted()).toBeTruthy();
    //         expect(task.error()).toEqual({
    //             name: 'AbortError',
    //             message: 'The user aborted a request.',
    //             type: TaskStatusEnum.ABORTED,
    //         });
    //         expect(['before', 'running', 'abort']).toEqual(
    //             expect.arrayContaining(expectArr)
    //         );
    //         done();
    //     });
    //     setTimeout(() => {
    //         task.abortController.abortTask(task);
    //     }, 500);
    // });
});
