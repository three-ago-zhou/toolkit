import Core from '../../core';
import Plugin from '../../plugin';
import { server } from '../mocks/server';
import debounce from '../../helpers/debounce';

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
const debounceUser = debounce(500, task);

const postUser = (body: GetType) => request<GetType>(`user`, {
    method: 'POST',
    headers: {
        'content-type': 'application/json',
    },
    body: JSON.stringify(body),
});

const debouncePostUser = debounce(500, postUser);

describe("debounce helper", () => {
    it("debounce get", (done) => {
        debounceUser(1).then((d) => {
            expect(d).toBe('5');
        });
        debounceUser(2).then((d) => {
            expect(d).toBe('5');
        });
        debounceUser(3).then((d) => {
            expect(d).toBe('5');
        });
        debounceUser(4).then((d) => {
            expect(d).toBe('5');
        });
        debounceUser(5).then((d) => {
            expect(d).toBe('5');
        });
        setTimeout(() => {
            debounceUser(6).then((d) => {
                expect(d).toBe('6');
            }).finally(done);
        }, 1200);
    });

    it("debounce post", (done) => {
        debouncePostUser({
            name: 'name1',
            arr: [],
        }).then((d) => {
            expect(d).toEqual({
                name: 'name3',
                arr: [],
            });
        });
        debouncePostUser({
            name: 'name2',
            arr: [],
        }).then((d) => {
            expect(d).toEqual({
                name: 'name3',
                arr: [],
            });
        });
        debouncePostUser({
            name: 'name3',
            arr: [],
        }).then((d) => {
            expect(d).toEqual({
                name: 'name3',
                arr: [],
            });
        });
        setTimeout(() => {
            debouncePostUser({
                name: 'name4',
                arr: [],
            }).then((d) => {
                expect(d).toEqual({
                    name: 'name4',
                    arr: [],
                });
            }).finally(done);
        }, 1200);
    });
});