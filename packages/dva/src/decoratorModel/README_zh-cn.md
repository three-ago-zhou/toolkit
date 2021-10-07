## decoratorModel的作用是能够实例化model调用effect/reducer

使用Decorator的方式将class内的reducer/effect更好的调用。ts可以分析出调用的方法所需的参数类型。

## Example
```
import {
    model,
    reducer,
    effect,
    subscription,
    getModel,
    BaseModel,
} from '@my-toolkit/dva';

// interface
import type { SubscriptionAPI } from '@my-toolkit/dva';
import type { Instance } from '@my-toolkit/dva/decoratorModel/types';

interface User {
    users: string[],
};

@model<User>({
    namespace: 'user',
    state: {
        users: [],
    },
})
class UserClass extends BaseModel<User> {
    @effect()
    putUser({ user }) {
        yield this.effects.put({ type: 'add', payload: { user, } });
    };

    @reducer()
    add({ user }: { user: string }) {
        return {
            users: [...this.state.users, user],
        }
    };

    @subscription
    setup({ dispatch }: SubscriptionAPI) {
        dispatch({
            type: 'putUser',
            payload: {
                user: 'spike',
            },
        });
    };
};

// components
const UserPage = () => {
    const dispatch = useDispatch();
    const modelInstance = React.useRef<Instance | null>(new UserClass());

    React.useEffect(() => {
        dispatch(modelInstance.current.add({
            user: 'hello',
        }));
        return () => {
            modelInstance.current = null;
        };
    }, []);

    return (
        <div />
    );
};

```
