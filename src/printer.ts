/**
 * 日志打印类
 */

import dateFormat from "dateformat";
import { LoggerConfig } from "./config";
import { LEVEL } from "./enum";
import { anything2LevelString } from "./level-helper";

const notSupportColor = (env => !env.location || !!env.ActiveXObject)(globalThis as any);

const colorTable: any = {
  DEBUG: "#3CABDB",
  INFO: "#167FFC",
  WARN: "#595BD4",
  ERROR: "#FD3259"
};

const colorStyles: Record<string, Function> = {
  level(level: string): string {
    let bg = colorTable[level];

    if (typeof bg !== "string") {
      bg = "#3CABDB";
    }

    return `color: #FFF; background:${bg};`;
  },

  path(path: string): string {
    return "color: #6C6B47;";
  },

  time(now: string): string {
    return "color: #6C6B47;";
  },

  content(content: string): string {
    return "color: #0C0C0C;";
  }
};

const levelTextTable: any = {
  DEBUG: "DBG",
  INFO: "INF",
  WARN: "WRN",
  ERROR: "ERR"
};

function level2Text(levelStr: string): string {
  let text = levelTextTable[levelStr];

  if (typeof text !== "string") {
    text = "UNKNOWN";
  }

  return text;
}

type FLog = (message?: any, ...optionalParams: any[]) => void;

function getLogFunctionByLevel(levelStr: string): FLog {
  if (levelStr === "DEBUG") {
    return console.debug.bind(console);
  } else if (levelStr === "INFO") {
    return console.info.bind(console);
  } else if (levelStr === "WARN") {
    return console.warn.bind(console);
  } else if (levelStr === "ERROR") {
    return console.error.bind(console);
  } else {
    return console.log.bind(console);
  }
}

export interface IPrinter {
  /**
   * 打印日志.
   *
   * @param {LEVEL} level 日志级别
   * @param {string} path 打印路径
   * @param {Array} params 其他参数
   *
   * @memberof IPrinter
   * @instance
   */
  log(level: LEVEL, path: string, ...params: any[]): void;
}

export default class Printer implements IPrinter {
  readonly noColor: boolean;
  readonly noTime: boolean;
  readonly noPath: boolean;
  readonly noLevel: boolean;
  readonly cstyles_: Record<string, Function>;

  constructor(config: Partial<LoggerConfig> = {}) {
    const flags = config.log_flags ?? []

    this.noColor = notSupportColor || !flags.find(i => i === "color");
    this.noTime = !flags.find(i => i === "time");
    this.noPath = !flags.find(i => i === "path");
    this.noLevel = !flags.find(i => i === "level");

    this.cstyles_ = colorStyles;
  }

  log(level: LEVEL, path: string, ...params: any[]): void {
    if (!this.noColor) {
      this.colorfully(level, path, ...params);
    } else {
      this.monochromatically(level, path, ...params);
    }
  }

  private colorfully(level: LEVEL, path: string, ...params: any[]): void {
    const levelStr = anything2LevelString(level) || "" + level;
    const paddingLevelStr = level2Text(levelStr);

    const now = dateFormat(new Date(), "HH:mm:ss:l");
    const p0 = params[0];

    const prefix = [];
    const styleParams = [];

    if (!this.noLevel) {
      prefix.push(`%c ${paddingLevelStr}`);
      styleParams.push(this.cstyles_.level(levelStr));
    }

    if (!this.noPath) {
      prefix.push(`%c ${path}`);
      styleParams.push(this.cstyles_.path(path));
    }

    if (!this.noTime) {
      prefix.push(`%c ${now}`);
      styleParams.push(this.cstyles_.time(now));
    }

    const log = (...args: any[]) => {
      console.log(...args);
    };

    if (params.length !== 1) {
      log(`${prefix.join(" ")} ----`, ...styleParams);
      log(...params);

      return;
    }

    const content0 = `${prefix.join(" ")}%c - ${"" + p0}`;

    if (typeof p0 === "string") {
      log(content0, ...styleParams.concat([this.cstyles_.content(p0)]));
      return;
    }

    if (typeof p0 === "number") {
      log(content0, ...styleParams.concat([this.cstyles_.content("" + p0)]));
      return;
    }

    if (typeof p0 === "boolean") {
      log(
        content0,
        ...styleParams.concat([this.cstyles_.content(p0 ? "true" : "false")])
      );
      return;
    }

    log(`${prefix.join(" ")} ----`, ...styleParams);
    log(...params);
  }

  private monochromatically(level: LEVEL, path: string, ...params: any[]): void {
    const levelStr = anything2LevelString(level) || "" + level;
    const paddingLevelStr = level2Text(levelStr);

    const now = dateFormat(new Date(), "HH:mm:ss:l");
    const p0 = params[0];

    const prefix = [];

    if (!this.noLevel) {
      prefix.push(`[${paddingLevelStr}]`);
    }

    if (!this.noPath) {
      prefix.push(`[${path}]`);
    }

    if (!this.noTime) {
      prefix.push(`[${now}]`);
    }

    const log = getLogFunctionByLevel(levelStr);

    if (params.length === 1 && ["string", "number", "boolean"].includes(typeof p0)) {
      log(`${prefix.join(" ")} - ${p0}`);
    } else {
      log(`${prefix.join(" ")}`);
      log(...params);
    }
  }
}
