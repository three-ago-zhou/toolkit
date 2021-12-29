import Core from '../../core';
import Plugin from '../../plugin';
import { server } from '../mocks/server';
import retry from '../../helpers/retry';

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
const task = () => request<{ status: string } | undefined>('retry-get', {
    method: 'GET',
    headers: {
        'content-type': 'application/json',
    },
});
const retryGet = retry(3, 300, task, (response) => {
    if (Object.keys(response as Record<string, any>).length === 0) {
        return true;
    }
    return false;
});

describe("retry helper", () => {
    it("retry get", (done) => {
        retryGet().then((d) => {
            expect(d).toEqual({
                status: 'ok',
            });
        }).finally(done);
    });
});