import Abort from '../abort';
import { AbortEnum, TaskStatusEnum } from '../types';

// interface
import type { TaskBase } from '../types';
import type { GetType } from './mocks/server';

describe("abort test", () => {
    it("abort task undefined reason", () => {
        const abort = new Abort<GetType>();
        const task: TaskBase<GetType> = {
            taskStatus: TaskStatusEnum.BEFORE,
            isRunning: () => task.taskStatus === TaskStatusEnum.RUNNING,
            isAborted: () => task.taskStatus === TaskStatusEnum.ABORTED,
            result: () => undefined,
            error: () => task.taskError,
            toPromise: () => Promise.reject(task.taskError),
            taskError: undefined,
            meta: {
                name: 'test',
            },
            abortController: abort,
            request: new Promise((r) => {
                r({
                    id: 1,
                    name: 'spike',
                    arr: ['a', 'b', 'c']
                })
            }),
        };
        task.abortController.abortTask(task);

        expect(abort.abortedPromise).rejects.toEqual({
            name: 'PromiseAbortError',
            message: 'PromiseAborted',
            type: AbortEnum.ABORT,
        });
        expect(task.error()).toEqual({
            name: 'PromiseAbortError',
            message: 'PromiseAborted',
            type: TaskStatusEnum.ABORTED,
        });
        expect(task.taskStatus).toBe(TaskStatusEnum.ABORTED);
        expect(task.isAborted()).toBeTruthy();
        expect(task.isRunning()).toBeFalsy();
    });

    it("abort task set reason", () => {
        const abort = new Abort<GetType>();
        const task: TaskBase<GetType> = {
            taskStatus: TaskStatusEnum.BEFORE,
            isRunning: () => task.taskStatus === TaskStatusEnum.RUNNING,
            isAborted: () => task.taskStatus === TaskStatusEnum.ABORTED,
            result: () => undefined,
            error: () => task.taskError,
            toPromise: () => Promise.reject(task.taskError),
            taskError: undefined,
            meta: {
                name: 'test',
            },
            abortController: abort,
            request: new Promise((r) => {
                r({
                    id: 1,
                    name: 'spike',
                    arr: ['a', 'b', 'c']
                })
            }),
        };
        task.abortController.abortTask(task, 'manualAbort');

        expect(abort.abortedPromise).rejects.toEqual({
            name: 'PromiseAbortError',
            message: 'manualAbort',
            type: AbortEnum.ABORT,
        });
        expect(task.error()).toEqual({
            name: 'PromiseAbortError',
            message: 'manualAbort',
            type: TaskStatusEnum.ABORTED,
        });
        expect(task.taskStatus).toBe(TaskStatusEnum.ABORTED);
        expect(task.isAborted()).toBeTruthy();
        expect(task.isRunning()).toBeFalsy();
    });

    it("abort task running", async () => {
        const abort = new Abort<GetType>();
        const task: TaskBase<GetType> = {
            taskStatus: TaskStatusEnum.RUNNING,
            isRunning: () => task.taskStatus === TaskStatusEnum.RUNNING,
            isAborted: () => task.taskStatus === TaskStatusEnum.ABORTED,
            result: () => undefined,
            error: () => task.taskError,
            toPromise: () => Promise.reject(task.taskError),
            taskError: undefined,
            meta: {
                name: 'test',
            },
            abortController: abort,
            request: new Promise((r, j) => {
                abort.signal.onabort = function ({ isTrusted }) {
                    if (isTrusted) {
                        j(task.taskError);
                    } else {
                        r({
                            id: 1,
                            name: 'spike',
                            arr: ['a', 'b', 'c']
                        });
                    }
                }
            }),
        };
        task.abortController.abortTask(task, 'manualAbort');
        try {
            await task.request;
        } catch (e) {
            expect(e).toEqual({
                name: 'AbortError',
                message: 'manualAbort',
                type: TaskStatusEnum.ABORTED,
            });
        }

        expect(task.error()).toEqual({
            name: 'AbortError',
            message: 'manualAbort',
            type: TaskStatusEnum.ABORTED,
        });
        expect(task.taskStatus).toBe(TaskStatusEnum.ABORTED);
        expect(task.isAborted()).toBeTruthy();
        expect(task.isRunning()).toBeFalsy();
    });
});
