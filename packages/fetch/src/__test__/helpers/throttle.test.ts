import Core from '../../core';
import Plugin from '../../plugin';
import { server } from '../mocks/server';
import throttle from '../../helpers/throttle';

// interface
import type { GetType } from '../mocks/server';

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
const task = (userId: number) => request<number>(`user-helper/${userId}`, {
    method: 'GET',
    headers: {
        'content-type': 'application/json',
    },
});
const throttleUser = throttle(500, task);

const postUser = (body: GetType) => request<GetType>(`user`, {
    method: 'POST',
    headers: {
        'content-type': 'application/json',
    },
    body: JSON.stringify(body),
});

const throttlePostUser = throttle(500, postUser);

describe("throttle helper", () => {
    it("throttle get", (done) => {
        throttleUser(1).then((d) => {
            expect(d).toBe('5');
        });
        throttleUser(2).then((d) => {
            expect(d).toBe('5');
        });
        throttleUser(3).then((d) => {
            expect(d).toBe('5');
        });
        throttleUser(4).then((d) => {
            expect(d).toBe('5');
        });
        throttleUser(5).then((d) => {
            expect(d).toBe('5');
        });
        setTimeout(() => {
            throttleUser(6).then((d) => {
                expect(d).toBe('6');
            }).finally(done);
        }, 600);
    });

    it("throttle post", (done) => {
        throttlePostUser({
            name: 'name1',
            arr: [],
        }).then((d) => {
            expect(d).toEqual({
                name: 'name3',
                arr: [],
            });
        });
        throttlePostUser({
            name: 'name2',
            arr: [],
        }).then((d) => {
            expect(d).toEqual({
                name: 'name3',
                arr: [],
            });
        });
        throttlePostUser({
            name: 'name3',
            arr: [],
        }).then((d) => {
            expect(d).toEqual({
                name: 'name3',
                arr: [],
            });
        });
        setTimeout(() => {
            throttlePostUser({
                name: 'name4',
                arr: [],
            }).then((d) => {
                expect(d).toEqual({
                    name: 'name4',
                    arr: [],
                });
            }).finally(done);
        }, 700);
    });
});