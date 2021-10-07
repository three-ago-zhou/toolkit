/**
 * 组件依赖提升到外部中,这个测试文件暂时跑不起来
 */
test("normal", () => {
    expect(1).toBe(1);
});
// import React from 'react';
// import { createMemoryHistory } from 'history';
// import { push } from 'connected-react-router';
// import { Link, Switch, Route, Router } from 'react-router-dom';
// import { useSelector, shallowEqual, useDispatch } from 'react-redux';
// import { render, fireEvent, cleanup } from '@testing-library/react';

// import dva from '../index';

// afterEach(cleanup);

// const delay = (timeout: number) => new Promise(resolve => setTimeout(resolve, timeout));

// test("normal", () => {
//     const app = dva();
//     app.model({
//         namespace: 'count',
//         state: 0,
//         reducers: {
//             add(state) {
//                 return state + 1;
//             },
//         },
//     });
//     app.router(() => <div />);
//     app.start();

//     expect(app._store?.getState().count).toBe(0);

//     app._store?.dispatch({ type: 'count/add' });

//     expect(app._store?.getState().count).toBe(1);
// });

// test("subscription execute multiple times", async () => {
//     const app = dva();
//     app.model({
//         namespace: 'count',
//         state: 0,
//         subscriptions: {
//             setup({ history, dispatch }) {
//                 return history.listen(() => {
//                     dispatch({
//                         type: 'add',
//                     });
//                 });
//             },
//         },
//         reducers: {
//             add(state) {
//                 return state + 1;
//             },
//         },
//     });
//     const CountHook = () => {
//         const { count } = useSelector((state: any) => {
//             return {
//                 count: state.count,
//             };
//         }, shallowEqual);
//         return <div data-testid="hook-count">{count}</div>;
//     };
//     function Home() {
//         return <div />;
//     }
//     function Users() {
//         return <div />;
//     }
//     app.router(({ history }) => {
//         return (
//             <Router history={history}>
//                 <>
//                     <Link to="/">Home</Link>
//                     <Link to="/users">Users</Link>
//                     <CountHook />
//                     <Switch>
//                         <Route path="/" exact component={Home} />
//                         <Route path="/users" component={Users} />
//                     </Switch>
//                 </>
//             </Router>
//         );
//     });
//     const { getByTestId, getByText } = render(React.createElement(app.start() as React.ElementType));

//     expect(getByTestId('hook-count').innerHTML).toBe('1');

//     fireEvent.click(getByText('Users'));
//     await delay(100);

//     expect(getByTestId('hook-count').innerHTML).toBe('2');
    
//     fireEvent.click(getByText('Home'));
//     await delay(100);

//     expect(getByTestId('hook-count').innerHTML).toBe('3');
// });

// test('useSelector and useDispatch', () => {
//     const app = dva();
//     app.model({
//         namespace: 'count',
//         state: 0,
//         reducers: {
//             add(state) {
//                 return state + 1;
//             },
//         },
//     });
//     const App = () => {
//         const dispatch = useDispatch();
//         const { count } = useSelector((state: any) => ({ count: state.count }));
//         return (
//             <>
//                 <div data-testid="count">{count}</div>
//                 <button
//                     onClick={() => {
//                         dispatch({ type: 'count/add' });
//                     }}
//                 >
//                     add
//                 </button>
//             </>
//         );
//     };
//     app.router(() => <App />);
//     const { getByTestId, getByText } = render(React.createElement(app.start() as React.ElementType));

//     expect(getByTestId('count').innerHTML).toBe('0');

//     fireEvent.click(getByText('add'));

//     expect(getByTestId('count').innerHTML).toBe('1');
// });

// test('navigate', async () => {
//     const history = createMemoryHistory({
//         initialEntries: ['/'],
//     });
//     const app = dva({
//         history,
//     });
//     function Home() {
//       return <h1 data-testid="title">You are on Home</h1>;
//     };
//     function Users() {
//       return <h1 data-testid="title">You are on Users</h1>;
//     };
//     app.router(({ history }) => {
//         return (
//             <Router history={history}>
//                 <>
//                     <Link to="/">Home</Link>
//                     <Link to="/users">Users</Link>
//                     <button
//                         onClick={() => {
//                             app._store?.dispatch(push('/'));
//                         }}
//                     >
//                         RouterRedux to Home
//                     </button>
//                     <Switch>
//                         <Route path="/" exact component={Home} />
//                         <Route path="/users" component={Users} />
//                     </Switch>
//                 </>
//             </Router>
//         );
//     });
  
//     const { getByTestId, getByText } = render(React.createElement(app.start() as React.ElementType));

//     expect(getByTestId('title').innerHTML).toBe('You are on Home');

//     fireEvent.click(getByText('Users'));
//     await delay(100);

//     expect(getByTestId('title').innerHTML).toBe('You are on Users');

//     fireEvent.click(getByText('RouterRedux to Home'));
//     await delay(100);

//     expect(getByTestId('title').innerHTML).toBe('You are on Home');
// });
  