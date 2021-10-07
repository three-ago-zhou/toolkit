const nodeFetch = require('node-fetch');

global.Response = nodeFetch.Response;
global.Headers = nodeFetch.Headers;
global.Request = nodeFetch.Request;
global.fetch = nodeFetch;
