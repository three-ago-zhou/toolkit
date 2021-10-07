# toolkit

- components
- utils
- fetch
- ....等等

等这些就应该集中到这个toolkit中,统一管理

# 注意

当进行git提交的时候,默认会跑一遍lint和test,校验成功后才会commit成功。
commit请按照规范书写

- [开始](#getting-started)
- [教程文档](#getting-induction)
- [packages](#getting-packages)
- [发布](#getting-publish)

# Getting started

安装toolkit依赖(可能npm源设置了souban私有库,会导致一些依赖无法下载,请暂时将源设置为淘宝源就可)

```
npm i
```

安装packages中的依赖库(在做这操作的时候,记得讲npm源设回souban私有库)

```
npm run bootstrap
```

运行依赖库

```
npm run build
```

测试依赖库

```
npm run test
```

代码格式验证(允许warning)

```
npm run lint
```

# Getting Induction

* [husky文档](https://typicode.github.io/husky/#/)
* [jest文档](https://jestjs.io/docs/expect)
* [testingLibrary文档(e2e)](https://testing-library.com/docs/)
* [lerna文档](https://github.com/lerna/lerna)

# Getting Packages

* [dva](https://github.com/three-ago-zhou/toolkit/-/blob/master/packages/dva/README_zh-cn.md)
* [fetch](https://github.com/three-ago-zhou/toolkit/-/blob/master/packages/fetch/README.md)

# Getting Publish

暂时先以手动命令进行发布

多个依赖库发生变动的形式

```
lerna publish -m "feat(dva,layout): publish dva and layout"
```

单个依赖库发生变动的形式

```
lerna publish -m "feat(dva): publish dva"
```