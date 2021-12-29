import type { RequestInterface } from '../types';

export type DefaultTask = ((...args: any[]) => RequestInterface<any> );

export interface DelayReturn extends Promise<void> {
    [propName: symbol]: () => void;
};
