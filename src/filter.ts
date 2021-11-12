/**
 * 日志过滤器.
 */

import { LoggerConfig } from "./config";
import { anything2Level } from "./level-helper";
import Path from "./path";
import { LEVEL } from './enum';

export interface IFilter {
  exec(level: LEVEL, path: Path): boolean;
}

export default class Filter implements IFilter {
  private _level: LEVEL;
  private _paths: Array<Path>;

  constructor(config: Partial<LoggerConfig> = {}) {
    this._level = anything2Level(config.log_level);
    this._paths = (config.log_paths ?? []).map((p: string) => new Path(p));
  }

  exec(level: LEVEL, curPath: Path): boolean {
    if (level === LEVEL.MUTE) return false
    return level <= this._level && this._paths.some(p => p.match(curPath))
  }
}
