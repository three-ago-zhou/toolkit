import invariant from 'invariant';
import warning from 'warning';

// tool
import { NAMESPACE_SEP } from './constants';
import prefixType from './prefixType';

// interface
import type { Dispatch } from 'redux';
import type { Model } from '../types';

export default function prefixedDispatch(
    dispatch: Dispatch<any>,
    model: Model
) {
    return (action: any) => {
        const { type } = action;
        invariant(type, 'dispatch: action should be a plain Object with type');
        warning(
            type.indexOf(`${model.namespace}${NAMESPACE_SEP}`) !== 0,
            `dispatch: ${type} should not be prefixed with namespace ${model.namespace}`,
        );
        return dispatch<any>({ ...action, type: prefixType(type, model) });
    };
}
