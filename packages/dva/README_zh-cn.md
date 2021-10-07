# @my-toolkit/dva
基于dva的fork版本,编写成了ts,并且以class的形式重新书写了整个依赖库.通过了原本dva的单元测试和e2e测试

[dva文档](https://github.com/dvajs/dva/blob/master/README_zh-CN.md)

# feature
effects添加了type: debounce 的方法

# experimental

这些方法可能会随时进行一些变动

使用
```
import {
    model,
    effect,
    reducer,
    subscription,
    BaseModel,
    getModel,
} from '@my-toolkit/dva/decoratorModel';
```

[decoratorModel文档](https://github.com/three-ago-zhou/toolkit/-/blob/master/packages/dva/src/decoratorModel/README_zh-cn.md);
