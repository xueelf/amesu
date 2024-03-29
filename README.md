<div align="center">
    <img src="https://vip2.loli.io/2022/11/04/AWEchfODdwszL8N.png" alt="Amesu" width="200" />
    <h3>Amesu</h3>
</div>

---

![package](https://img.shields.io/npm/v/amesu?label=amesu&style=flat-square&logo=npm&labelColor=FAFAFA)
![engine](https://img.shields.io/node/v/amesu?style=flat-square&logo=Node.js&labelColor=FAFAFA)
![downloads](https://img.shields.io/npm/dt/amesu?style=flat-square&logo=tinder&logoColor=FF8C00&labelColor=FAFAFA&color=616DF8)

本项目是一个在 Node.js 环境下运行的 QQ 机器人第三方 SDK。

## Introduction

> 由于腾讯是近期上线的群聊 API，官方文档的内容与实际表现**有部分差异**，请勿将其用于生产环境。

项目的名字来源于 Cygames 开发和发行的游戏『公主连结 Re:Dive』中的登场角色「アメス」，其罗马音 **「a me su」** 用作了本项目的名字。

## Install

```shell
npm i amesu
```

## Usage

```javascript
const { Client } = require('amesu');

const client = new Client({
  appid: '1145141919',
  token: '38bc73e16208135fb111c0c573a44eaa',
  secret: '6208135fb111c0c5',
  events: ['GROUP_MESSAGES', 'PUBLIC_GUILD_MESSAGES'],
});

// 监听频道消息
client.on('at.message.create', async event => {
  // 快捷回复
  await event.reply({
    content: 'hello world',
  });
});

// 监听群聊消息
client.on('group.at.message.create', async event => {
  // API 调用
  await client.api.sendGroupMessage(event.group_openid, {
    msg_id: event.id,
    msg_type: 0,
    content: 'hello world',
  });
});

// 机器人上线
client.online();
```

事件回调中的 `reply()` 函数是 `client.api` 的语法糖，会根据**消息事件**的类型指向对应消息发送的 api 函数，并自动传入 from_id 与 msg_id。

## Event

目前 socket 返回的事件全部为大写，并用下划线做分割。但是在 Node.js 的 `EventEmitter` 中，事件名一般使用小写字母。

这是因为事件名通常表示一种行为或状态，而不是一个特定的类或构造函数。根据 JavaScript 的命名约定，使用小写字母来表示这些行为或状态更为常见和推荐。

所以 Amesu 针对事件名做了以下处理：

- 事件名全部转换为小写
- 使用小数点替换下划线
- 会话事件添加 `session` 前缀

例如 `MESSAGE_CREATE` -> `message.create`，`READY` -> `session.ready`。

你可以仅监听事件的部分前缀，例如：

```javascript
const { Client } = require('amesu');

const client = new Client();

client
  .on('guild.member', event => {
    console.log(event);
  })
  .online();
```

这样 `guild.member.add`、`guild.member.update`、`guild.member.remove`，三个事件将会被全部监听，这使得消息订阅更具有灵活性。

## Config

```typescript
/** 客户端配置项 */
interface ClientConfig {
  /** 机器人 ID */
  appid: string;
  /** 机器人令牌 */
  token: string;
  /** 机器人密钥 */
  secret: string;
  /** 订阅事件 */
  events: IntentEvent[];
  /** 是否开启沙盒，默认 `false` */
  sandbox: boolean;
  /** 掉线重连数，默认 `3` */
  max_retry?: number;
  /** 日志等级，默认 `'INFO'`，仅输出收到的指令信息 */
  log_level?: LogLevel;
}

/** 日志等级，具体使用可查阅 log4js 文档 */
type LogLevel = 'OFF' | 'FATAL' | 'ERROR' | 'WARN' | 'INFO' | 'DEBUG' | 'TRACE' | 'ALL';
```

## API

### Client.api

封装了官方文档所提供的 api 接口，可直接调用。（并不是所有 api 都能返回期望的结果）

### Client.request

基于 fetch 封装，可发送自定义网络请求。

### Client.online()

机器人上线。

### Client.offline()

机器人下线。

### Client.useEventInterceptor(interceptor)

添加事件拦截器。

### Request.useRequestInterceptor(interceptor)

添加请求拦截器。

### Request.useResponseInterceptor(interceptor)

添加响应拦截器。

### Request.basis(config)

发送网络请求。（基础封装）

### Request.get(url[, params][, config])

发送 GET 请求。

### Request.delete(url[, params][, config])

发送 DELETE 请求。

### Request.post(url[, params][, config])

发送 POST 请求。

### Request.put(url[, params][, config])

发送 PUT 请求。

### Request.patch(url[, params][, config])

发送 PATCH 请求。

## 插件开发

Amesu 仅仅是一个用于帮助建立 socket 通信的 SDK，而不是一个机器人解决方案，这两者不应该耦合，所以并未原生提供插件支持。

如果你想要开发插件，建立属于自己的生态，可以直接将她作为依赖进行二次开发。她十分的轻便，没有复杂的依赖项。拥有完整类型提示的同时，仅有 120 kb 的大小，而官方 SDK 却占据了 430 kb+。

若不想手搓，可以使用 [kokkoro](https://github.com/kokkorojs/kokkoro) 框架进行机器人开发。如果不想集成框架体系，那么你也可以直接安装 `@kokkoro/core` 依赖去自定义插件。

```shell
npm i @kokkoro/core
```

插件代码示例：

```javascript
import { useCommand, useEvent } from '@kokkoro/core';

/**
 * @type {import('@kokkoro/core').Metadata}
 */
export const metadata = {
  name: 'example',
  description: '插件示例',
};

export default function Example() {
  useEvent(
    ctx => {
      ctx.logger.mark('link start');
    },
    ['session.ready'],
  );

  useCommand('/测试', () => 'hello world');
  useCommand('/复读 <message>', ctx => ctx.query.message);
}
```

更多示例可查看 core 的 [README](https://github.com/kokkorojs/kokkoro/blob/master/packages/core/README.md) 自述。

## FAQ

### 为什么要做这个项目？

因为官方 [频道 SDK](https://github.com/tencent-connect/bot-node-sdk) 已经有 2 年没更新了，不支持群聊而且使用体验非常糟糕。

### 为什么 config 一定要指定 events？

如果你是公域机器人，那么在使用官方 SDK 不传入 events 情况下，就会不断重连并在控制台疯狂输出。

原因是部分事件仅限私域机器人使用，如果公域机器人订阅了就会抛异常，私域机器人订阅了公域事件却不会有任何问题...

官方 SDK 的逻辑是没有传 events 就默认监听全部事件（其实也并不是全部，文档里有遗漏），这是不合理的。现在也没有任何手段知道机器人是公域还是私域，以及是否拥有群聊权限等问题，因此只能手动在 config 传入。

### 为什么部分 API 没有返回结果？

腾讯是近期才开放群聊 API 内测的，提供的文档也很不完善，目前存在字段、返回结果不一致，v1、v2 接口混用（鉴权方式不一样）等问题，所以调用某些接口可能会无法达到预期。

### 为什么 request 不使用 axios 封装？

axios 太大了，基于 fetch 的封装 build 后大小仅 3 kb 不到，基本满足大部分的使用场景。如果你想要使用 axios 或者其它网络请求库，可以自行安装依赖。

### 这个 SDK 能做什么？

频道与群聊的消息收发已测试完毕，API 返回结果与 interface 不符的问题还待腾讯后续完善文档和接口统一。

当前 Amesu 已经有了完整的鉴权流程（会话保活、掉线重连、凭证刷新），并做了日志和网络请求的封装，后面没什么问题就不会再有大改了。如果有 API 缺失，在 `api` 文件内参考格式直接添加 url 就可以正常使用，也欢迎来提 pr。
