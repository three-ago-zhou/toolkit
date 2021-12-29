import { setupServer } from 'msw/node'
import { rest } from 'msw'

export interface GetType {
    id?: number;
    name: string;
    arr: string[];
};

export const user: GetType = {
    id: 1,
    name: 'spike',
    arr: ['a', 'b', 'c'],
};

let retryCount = 0;

export const server = setupServer(
    rest.get('http://example.com/get-error', (_req, res, _ctx) => {
        return res.networkError('Failed to connect');
    }),
    rest.get('http://example.com/delay', (_req, res, ctx) => {
        return res(
            ctx.delay(1000),
            ctx.status(200),
            ctx.json(user),
            ctx.set({
                'Content-Type': 'application/json',
            }),
        );
    }),
    rest.get('http://example.com/user-application-json', (_req, res, ctx) => {
        return res(
            ctx.status(200),
            ctx.json(user),
            ctx.set({
                'Content-Type': 'application/json',
            }),
        );
    }),
    rest.get('http://example.com/user-text-plain', (_req, res, ctx) => {
        return res(
            ctx.status(200),
            ctx.json(user),
            ctx.set({
                'Content-Type': 'text/plain',
            }),
        );
    }),
    rest.get('http://example.com/user-helper/:userId', (req, res, ctx) => {
        const { userId } = req.params;
        return res(
            ctx.status(200),
            ctx.json(userId),
            ctx.set({
                'Content-Type': 'application/text'
            }),
        );
    }),
    rest.get('http://example.com/retry-get', (_req, res, ctx) => {
        retryCount += 1;
        if (retryCount < 5) {
            return res(
                ctx.status(200),
                ctx.json({}),
                ctx.set({
                    'Content-Type': 'application/json'
                }),
            );
        } else {
            retryCount = 0;
            return res(
                ctx.status(200),
                ctx.json({ status: 'ok' }),
                ctx.set({
                    'Content-Type': 'application/json'
                }),
            );
        }
    }),
    rest.post('http://example.com/user', (req, res, ctx) => {
        return res(
            ctx.status(200),
            ctx.json(req.body),
            ctx.set({
                'Content-Type': 'application/json'
            }),
        );
    }),
    rest.post('http://example.com/post-delay', (req, res, ctx) => {
        return res(
            ctx.delay(1000),
            ctx.status(200),
            ctx.json(req.body),
            ctx.set({
                'Content-Type': 'application/json'
            }),
        );
    }),
    rest.post('http://example.com/post-error', (_req, res, _ctx) => {
        return res.networkError('Failed to connect');
    }),
    rest.post('http://example.com/post-void', (_req, res) => {
        return res((res) => {
            res.statusText = 'ok';
            res.status = 201;
            return res;
        });
    }),
);
