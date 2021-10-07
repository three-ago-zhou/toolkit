# fetch

Promise based http client for the browser

## Table of Contents

- [Features](#features)
- [Installing](#installing)
- [Example](#example)
- [Task API](#task-api)


## Features

- use AbortController to cancel requests
- Automatic transforms for JSON data(support content-type: (application/json, text/plain))
- Intercept request and response
- Supports the Promise API

## Installing

Using npm:

```bash
npm install @my-toolkit/fetch
```

## Example

```js
// request.js
import FetchCore, { errorCode } from '@my-toolkit/fetch';
import { transformResponse } from '@my-toolkit/fetch/lib/request';
import type {
    RejectedType,
    BeforeType,
    BeforeTypeParams,
    RunningType,
    FulfilledType,
    AbortType,
    TaskErrorReason,
} from '@my-toolkit/fetch';

const fetch = new FetchCore();
const prefixUrl = 'http://example.com/';

function beforePlugin(requestInit: BeforeTypeParams) {
    return Promise.resolve({
        ...requestInit,
        headers: {
            Authorization: `Bearer ${window.localStorage.getItem('token')}`,
        },
    });
};

function runningPlugin(requestInit: BeforeTypeParams) {
    console.log(`running task url is: ${requestInit.url}`);
    return Promise.resolve(requestInit);
};

function fulfillPlugin(response: Response) {
    console.log(`task success`);
    return Promise.resolve(response);
};

function rejectedPlugin(response: Response) {
    const message = response.statusText || errorCode[response.status];
    if (message) {
        transformResponse(response).then((data: any) => {
            console.error(data)
        });
    }
    /** 
     * notice: 使用promise.reject才能一层一层的传递plugin.
     * 使用Promise.resolve会改变这个task的结果为fulfilled,但是不会触发fulfillPlugin.
     * 并且会跳出后面的rejectedPlugin
     */
    return Promise.reject(response);
};

function abortPlugin(abortReason: TaskErrorReason) {
    console.log(`task is abort, abort reason is: ${abortReason.message}`);
    return Promise.resolve(abortReason);
};

const before: BeforeType[] = [beforePlugin];
const rejected: RejectedType[] = [rejectedPlugin];
const running: RunningType[] = [runningPlugin];
const fulfilled: FulfilledType[] = [fulfillPlugin];
const abort: AbortType[] = [abortPlugin];

fetch.setConfig({
    hooks: {
        before,
        running,
        fulfilled,
        rejected,
    },
    prefixUrl,
});

export const request = fetch.request;
```

```js
import { request } from 'request';

const task = request('user-application-json', {
    methods: 'GET',
    headers: {
        'content-type': 'application/json',
    },
});

task.then((result) => {
    console.log(result);
});

// or ts

export interface GetType {
    id: number;
    name: string;
    arr: string[];
};

const task = request<GetType>('user-application-json', {
    methods: 'GET',
    headers: {
        'content-type': 'application/json',
    },
});

task.then((result) => {
    // result type is GetType;
    console.log(result);
});

// or abort

const task = request('http://example.com/delay'{
    method: 'GET',
});

task.catch((e) => {
    console.log(e.message === 'manualAbort');
});

setTimeout(() => {
    task.abort('manualAbort');
}, 500);
```
[more](https://github.com/three-ago-zhou/toolkit/-/blob/master/packages/fetch/src/__test__/);

## task API

#### task.error
```js

const fetch = request('xxxx', {
    methods: 'GET',
});

const { task } = fetch;

// get fetch error result(container abort info and reject info);
// abort info: {
//      name: 'AbortError',
//      type: TaskStatusEnum.ABORTED,
//      message: string(or your set abort message),
// }
// reject info: {
//      name: 'RejectError',
//      message: string (or 'RejectError'),
//      type: TaskStatusEnum.REJECTED,
//      ...errorResponse
// }
task.error();

// get fetch success result
task.result();

// Whether the trigger abort
task.isAborted();

// Whether running
task.isRunning();

// get task url
task.meta

// get AbortController instance
task.abortController

// notice: don't use plugin
// 不要使用它做任何事,暴露出它,只是为了一些兼容,后期会掩藏
task.plugin;

// notice: don't use taskStatus
// 不要使用它做任何事,暴露出它,只是为了一些兼容,后期会掩藏
task.taskStatus

// notice: don't use taskError
// 不要使用它做任何事,暴露出它,只是为了一些兼容,后期会掩藏,请使用task.error()替代
task.taskError

```