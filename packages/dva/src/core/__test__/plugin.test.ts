import Plugin from '../Plugin';
import handleActions from '../handleActions';

// interface
import type { DvaAction, InsideError } from '../../types';

describe('plugin', () => {
    const plugin = new Plugin();
    it("instance of Plugin", () => {
            expect(plugin).toBeInstanceOf(Plugin);
    });
    it("basic", () => {
        expect(plugin._handleActions).toEqual(handleActions);
        let hmrCount = 0;
        let errorMessage = '';
        function onError(err: InsideError) {
            errorMessage = err.message;
          }
        function testReducer<S = any>(state: S, action: DvaAction) {
            switch(action.type) {
                case 'test':
                    return {
                        ...state,
                        ...action.payload,
                    };
                default:
                    return state;
            }
        };
        plugin.use({
            onHmr: x => {
                hmrCount += 1 * x;
            },
            onAction: (_) => (_next) => (action: DvaAction) => action,
            extraReducers: {
                testReducer,
            },
            onReducer: r => {
                return (state, action: DvaAction) => {
                    const res = r(state, action);
                    return {
                        'onReducer': 'onReducer',
                        ...res,
                    };
                };
            },
        });
        plugin.apply('onHmr')(2);
        plugin.apply('onError', onError)({ message: 'hello error' });

        expect(hmrCount).toBe(2);
        expect(errorMessage).toBe('hello error');
        expect(
            plugin.getHookOnReducer('onReducer')(testReducer)(
                { hello: 'hello' },
                { type: 'test', payload: { world: 'world' } }
            )
        ).toEqual({
            "onReducer": "onReducer",
            hello: 'hello',
            world: 'world',
        });
        expect(plugin.getHookExtraReducers('extraReducers')).toEqual({
            testReducer,
        });
    });
});
