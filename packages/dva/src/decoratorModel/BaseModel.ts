import warning from 'warning';

// tool
import model from './model';
import reducer from './reducer';

// interface
import type { ModelEffectsCommandMap } from '../types';

function noop(..._args: any[]) {
    warning(false, 'BaseModal的子类没有继承到effects');
};

function put(..._args: any[]) {
    noop(..._args);
};
put.resolve = noop;

/**
 * @summary 基础model类,限制在类内写state
 */
@model({})
export default class BaseModel<S extends Record<string, any> = Record<string, any>> {
    /**
     * don't set state
     * you can @model({ state: {} })
     */
    protected readonly state = {} as S;
    
    /**
     * don't set effects
     */
    protected readonly effects = {
        take: noop,
        takeMaybe: noop,
        put,
        putResolve: noop,
        all: noop,
        race: noop,
        call: noop,
        apply: noop,
        cps: noop,
        fork: noop,
        spawn: noop,
        join: noop,
        cancel: noop,
        select: noop,
        actionChannel: noop,
        cancelled: noop,
        flush: noop,
        getContext: noop,
        setContext: noop,
        delay: noop,
    } as ModelEffectsCommandMap;

    @reducer()
    setState(state: Partial<S>) {
        return {
            ...this.state,
            ...state,
        };
    };
}
