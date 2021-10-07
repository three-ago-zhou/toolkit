/**
 * @summary get请求中条件参数的分隔符
 */
export const delimiter = '&';

/**
 * @summary 转换response的数据类型
 * @param response {Response}
 * @returns {Promise}
 */
export function transformResponse<
    R = unknown
>(response: Response): Promise<R> {
    try {
        const contentType = response.headers.get('content-type');
        if (contentType) {
            if (contentType.indexOf('application/json') > -1) {
                return response.json();
            }
            if (contentType.indexOf('text/plain') > -1) {
                return response.text().catch(Promise.reject) as any;
            }
            /**
             * @todo formData
             */
            // else if (contentType.indexOf('multipart/form-data') > -1) {
            //     console.log('contentType', contentType);
            //     return response.formData().then((formData) => {
            //         console.log('formData', formData);
            //         return Object.fromEntries((formData as any).entries()) as R;
            //     });
            // }
        } else {
            // post/put,maybe return void response
            return Promise.resolve({
                status: response.status,
                statusText: response.statusText,
                url: response.url,
            }) as any;
        }
        // 默认json返回
        return response.json();
    } catch (e) {
        return Promise.reject(e);
    }
};

/**
 * @summary 封装了fetch请求
 * @param request Request
 * @returns {fetch}
 */
function request(request: Request) {
    return fetch(request);
};

/**
 * @summary 解析成get请求中url后面拼接的字段
 * @param query 
 * @returns {string}
 */
export function stringify(
    query: string | Array<string | number> | Record<string, any>,
): string {
    if (Array.isArray(query)) {
        return query.join(',');
    }
    if (typeof query === 'object') {
        return Object.keys(query)
            .map(key => {
                let value = query[key];
                if (typeof value === 'undefined') {
                    return undefined;
                }
                if (Array.isArray(value)) {
                    if (value.length === 0) {
                        return undefined;
                    }
                    value = value.map(item => encodeURIComponent(item));
                } else {
                    value = encodeURIComponent(value as string);
                }
                return `${encodeURIComponent(key)}=${value}`;
            })
            .filter(Boolean)
            .join(delimiter);
    }
    return query;
};

export default request;