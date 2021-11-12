# 前端日志工具（Web Logger）

前端logger工具，支持log级别控制，支持log原始内容存储，支持存储RSA加密，支持存储内容输出。

`indexedDB`存储方面参考了美团`Logan`，文字格式化参考了网友方案，特此说明。

## 安装

``` shell
npm install cell-logger
```

## 使用

### 基本用法

``` js
import Logger from 'cell-logger'

const logger = new Logger('module_path')
```

### 配置项

配置项基于`cell-env`，可通过环境变量设置，也可以通过全局配置或实例配置覆盖，优先级依次为：instance_config > global_config > env_config

``` js
import Logger from 'cell-logger'

// 全局配置
Logger.init({
  "log_level": number, // 日志打印级别，大于设置级别的不做打印
  "log_paths": Array<string>, // 日志打印模块路径过滤，支持通配符*/**
  "log_flags": Array<string>, // 日志打印标记配置，支持'color', 'level', 'path', 'time'
  "log_store": boolean, // 日志打印是否支持存储
  "log_pubkey": string // 日志内容使用rsa加密
})

// 实例配置
const logger = new Logger('module_path', {
  "log_level": number, // 日志打印级别，大于设置级别的不做打印
  "log_paths": Array<string>, // 日志打印模块路径过滤，支持通配符*/**
  "log_flags": Array<string>, // 日志打印标记配置，支持'color', 'level', 'path', 'time'
  "log_store": boolean, // 日志打印是否支持存储
})
```

### 日志打印

``` js
import Logger from 'cell-logger'

const logger = new Logger('module_path')

logger.log(level, path, content): void // log接口
logger.debug(path, content): void // 打印debug快捷接口
logger.info(path, content): void // 打印info快捷接口
logger.warn(path, content): void // 打印warn快捷接口
logger.error(path, content): void // 打印error快捷接口
logger.mute(path, content): void // 默认不打印，只做存储
```

### 原始日志输出/下载

```js
import Logger from 'cell-logger'

/**
 * 根据日期范围输出/下载原始log记录
 * 如果日志内容已加密，需要配置环境变量log_prikey来实现解密，否则输出"this is encrypted log."
*/
Logger.output(start_date: Date, end_date?: Date): Promise<ILogRecord[]>
Logger.download(start_date: Date, end_date?: Date)
```

### 关于DB存储

DB存储引擎使用indexedDB，虽然理论上indexedDB存储容量没有上限，但是考虑实际情况，默认对log存储做了以下限制：

  - log只能存储7天，超出7天的log自动删除

  - 单天log存储容量上限为7M，超过7M的log不再存储

所以logger在浏览器上最多存储49M的log内容，使用时要注意控制log内容。
