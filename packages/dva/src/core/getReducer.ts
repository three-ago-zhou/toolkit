// tool
import defaultHandleActions from './handleActions';

// interface
import type {
    ReducersMapObjectWithEnhancer,
    ModelReducer,
    HandleActions,
} from '../types';

export default function getReducer<S = any>(
    reducers?: ModelReducer<S> | ReducersMapObjectWithEnhancer<S>,
    state?: S,
    handleActions?: HandleActions,
) {
    // Support reducer enhancer
    // e.g. reducers: [realReducers, enhancer]
    const _handleActions = handleActions ?? defaultHandleActions;
    if (Array.isArray(reducers)) {
        return reducers[1]((_handleActions)(reducers[0], state));
    }
    return (_handleActions)(reducers || {}, state);
}
