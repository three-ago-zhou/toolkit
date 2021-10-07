import request, { stringify, transformResponse } from '../request';
import { server, user } from './mocks/server';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("request test", () => {
    it("stringify array get string url", () => {
        const urlString = ['a', 'b', 'c'];
        const urlNumber = [1,2,3,4];
        const stringUrl = stringify(urlString);
        const numberUrl = stringify(urlNumber);

        expect(stringUrl).toBe('a,b,c');
        expect(numberUrl).toBe('1,2,3,4');
    });

    it("stringify object get string url", () => {
        const objectUrl = {
            a: 'a',
            b: 'b',
            c: undefined,
            d: [1,2,3],
        };
        const stringUrl = stringify(objectUrl);
        expect(stringUrl).toMatch(/&/);
        expect(stringUrl).toBe('a=a&b=b&d=1,2,3');
    });

    it("transformResponse content-type is application/json", async () => {
        const body = { name: 'spike' };
        const response = new Response(JSON.stringify(body), {
            status: 200,
            statusText: 'success',
            headers: { 'content-type': "application/json" },
        });
        const result = await transformResponse(response);
        expect(result).toHaveProperty(['name'], 'spike');
    });

    it("transformResponse content-type is text/plain", async () => {
        const body = { name: 'spike' };
        const response = new Response(JSON.stringify(body), {
            status: 200,
            statusText: 'success',
            headers: { 'content-type': "text/plain" },
        });
        const result = await transformResponse(response);
        expect(result).toEqual(JSON.stringify(body));
    });

    it.todo("transformResponse content-type is other")

    it("request get user, content-type is application/json", async () => {
        const headerRequest = new Request('http://example.com/user-application-json', {
            method: 'GET',
            headers: {
                'content-type': 'application/json',
            },
        });
        const result = await request(headerRequest).then(transformResponse);

        expect(result).toEqual(user);
    });

    it("request get user, content-type is text/plain", async () => {
        const headerRequest = new Request('http://example.com/user-text-plain', {
            method: 'GET',
            headers: {
                'content-type': 'text/plain',
            },
        });
        const result = await request(headerRequest).then(transformResponse);

        expect(result).toEqual(user);
    });

    it("request post user, content-type is application/json", async () => {
        const headerRequest = new Request('http://example.com/user', {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
            },
            body: JSON.stringify(user),
        });
        const result = await request(headerRequest).then(transformResponse);

        expect(result).toEqual(user);
    });

    it("request post, response is void, only get response.status", async () => {
        const headerRequest = new Request('http://example.com/post-void', {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
            },
        });
        const result = await request(headerRequest).then(transformResponse);
        expect(result).toEqual({
            status: 201,
            statusText: 'ok',
            url: 'http://example.com/post-void',
        });
    });
});
