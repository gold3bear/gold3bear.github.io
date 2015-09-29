---
layout: post
title:  "ploymer学习之Topeka源码分析:index.html"
date:   2014-10-17 08:52:50
categories: polymer
---

#\<head\>标签
```
<head>
   ...
   
  <meta name="viewport" content="width=device-width, minimum-scale=1.0, initial-scale=1, user-scalable=yes">
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-touch-fullscreen" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style"
        content="black-translucent" >
  <meta name="format-detection" content="telephone=no">

  <link rel="shortcut icon" href="favicon.ico">
  <link rel="icon" sizes="196x196" href="icons/icon-196.png">
  <link rel="apple-touch-icon" sizes="152x152" href="icons/Ipad@2x.png">
  <link rel="apple-touch-icon" sizes="144x144" href="icons/Icon-72.png">
  <link rel="apple-touch-icon" sizes="120x120" href="icons/iPhone@2x.png">

  <meta name="application-name" content="Quiz App">
  
```
    

##ShadowDOM的Hack

```
  <script>
    if (!('import' in document.createElement('link'))) {
      var Platform = {flags: {shadow: true}};
    }
  </script>
  <script src="components/webcomponentsjs/webcomponents.js"></script>
  
```
Chrome 35之前，由于在`:host-context`还没有加入进来，使用的较旧的`:host`行为。在Chrome 35之前没有HTMLImports，我们通过Polyfill来实现ShadowDOM。
polymer 在webcomponentsjs/CustomeElements/register中重写了createElement方法,
代码中先试着创建一个link标签，通过in操作符查找对象是否含有`import`方法,如果没有则启用polyfill 在Safari中生效
>in操作符的使用
JavaScript中的in 操作符是对Object（对象）
[参看](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/in)

##导入样式
```
<link rel="stylesheet" href="theme.css" shim-shadowdom>
```

##导入组件
```
  <link rel="import" href="polyfills/fonts/roboto.html">
  <link rel="import" href="components/core-icons/core-icons.html">
  <link rel="import" href="components/core-icons/av-icons.html">
  <link rel="import" href="components/core-icons/social-icons.html">
  <link rel="import" href="components/topeka-elements/topeka-datasource.html">
  <link rel="import" href="components/topeka-elements/topeka-app.html">
  <link rel="import" href="components/topeka-elements/theme.html">

```

##ServiceWorker

```
  <script>
    if (navigator.serviceWorker) {
      // Register our ServiceWorker
      navigator.serviceWorker.register("sw.js");
    }
  </script>
```

ServiceWorker 是一种通过javascript将服务放在后台运行的API，我们可以做到发送消息，后台同步等等。

参考
>[Using ServiceWorker in Chrome today](http://jakearchibald.com/2014/using-serviceworker-today/)

需要在`chrome://flags`中开启：搜素` #enable-experimental-web-platform-features
`启用；
##template

```
  <template is="auto-binding">
    <topeka-datasource url="components/topeka-elements/categories.json" user="{{user}}" categories="{{categories}}" connected="{{connected}}"></topeka-datasource>
    <topeka-app fit user="{{user}}" categories="{{categories}}" connected="{{connected}}" touch-action="auto"></topeka-app>
  </template>
```
这里用到了html5的<template is="auto-binding">来判断做数据绑定：把topeka=
>[\<template is="auto-binding"\> is=awesome](https://blog.polymer-project.org/howto/2014/09/11/template-is-autobinding/)



