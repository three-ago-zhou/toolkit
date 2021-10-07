/**
 * 组件依赖提升到外部中,这个测试文件暂时跑不起来
 */
// import React from 'react';
// import dva from '../index';

// // interface
// import type { DvaAction, Model, ExtraEnhancers } from '../types';
// import type { Dispatch } from 'redux';

// const countModel: Model<number> = {
//     namespace: 'count',
//     state: 0,
//     reducers: {
//         add(state, { payload }) {
//             return state + (payload ?? 1);
//         },
//         minus(state, { payload }) {
//             return state - (payload ?? 1);
//         },
//     },
// };

describe("index", () => {
    test.skip("normal", () => {
        expect(() => 1).toBe(1);
    });
//     test.skip("normal", () => {
//         const app = dva();
//         app.model(countModel);
//         app.router(() => <div />);
//         app.start('#root');
//     });

//     test.skip("start without container", () => {
//         const app = dva();
//         app.model(countModel);
//         app.router(() => <div />);
//         app.start();
//     });

//     test.skip("throw error if no routes defined", () => {
//         const app = dva();

//         expect(() => {
//             app.start();
//         }).toThrowError(/router must be registered before app.start/);
//     });

//     test.skip("opts.initialState", () => {
//         const app = dva({
//             initialState: { count: 1 },
//         });
//         app.model(countModel);
//         app.router(() => <div />);
//         app.start();

//         expect(app._store?.getState().count).toBe(1);
//     });

//     test.skip("opts.onAction", () => {
//         let count = 0;
//         const countMiddleware = () => () => () => {
//             count += 1;
//         };
//         const app = dva({
//             onAction: countMiddleware,
//         });
//         app.router(() => <div />);
//         app.start();
//         app._store?.dispatch({ type: 'test' });

//         expect(count).toBe(1);
//     });

//     test.skip("opts.onAction with array", () => {
//         let count = 0;
//         const countMiddleware = () => (next: Dispatch) => (action: DvaAction) => {
//             count += 1;
//             next(action);
//         };
//         const count2Middleware = () => (next: Dispatch) => (action: DvaAction) => {
//             count += 2;
//             next(action);
//         };
    
//         const app = dva({
//           onAction: [countMiddleware, count2Middleware],
//         });
//         app.router(() => <div />);
//         app.start();
//         app._store?.dispatch({ type: 'test' });

//         expect(count).toBe(3);
//     });

//     test.skip("opts.extraEnhancers", () => {
//         let count = 0;
//         const countEnhancer: ExtraEnhancers = (
//             storeCreator
//         ) => (
//             reducer,
//             preloadedState,
//             enhancer,
//         ) => {
//             const store = storeCreator(reducer, preloadedState, enhancer);
//             const oldDispatch = store.dispatch;
//             (store.dispatch as any) = (action: DvaAction<any>) => {
//                 count += 1;
//                 oldDispatch(action);
//             };
//             return store;
//         };
//         const app = dva({
//             extraEnhancers: [countEnhancer],
//         });
//         app.router(() => <div />);
//         app.start();
//         app._store?.dispatch({ type: 'test' });

//         expect(count).toBe(1);
//     });

//     test.skip("opts.onStateChange", () => {
//         let savedState = {
//             count: 0,
//         };
//         const app = dva({
//             onStateChange(state) {
//                 savedState = state;
//             },
//         });
//         app.model({
//             namespace: 'count',
//             state: 0,
//             reducers: {
//                 add(state) {
//                     return state + 1;
//                 },
//             },
//         });
//         app.router(() => <div />);
//         app.start();
//         app._store?.dispatch({ type: 'count/add' });

//         expect(savedState.count).toBe(1);
//     });
});
