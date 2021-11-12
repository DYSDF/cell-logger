import Path from "./path";
import Filter, { IFilter } from "./filter";
import Printer, { IPrinter } from "./printer";
import Storer, { IStorer, TDecLog } from './storer'
import globalConf, { LoggerConfig } from "./config";
import { LEVEL, RESULT_MSG } from './enum'
import { anything2Level } from './level-helper'
import download from './download'

export type TLoggerInitConfig = {
  log_level?: number | string;
  log_paths?: Array<string>;
  log_flags?: Array<string>;
  log_store?: boolean,
  log_pubkey?: string
}

export type TLoggerConfig = Partial<Pick<
  LoggerConfig,
  'log_flags' | 'log_level' | 'log_paths' | 'log_pubkey' | 'log_store'
>>

/**
 * 日志类.
 *
 * @export
 * @class Logger
 */
export default class Logger {
  private readonly identity: Path;
  private readonly filter: IFilter;
  private readonly printer: IPrinter;
  private readonly need_store: boolean

  protected static _storer: IStorer
  static get storer(): IStorer {
    if (!Logger._storer) Logger._storer = new Storer()
    return Logger._storer
  }

  constructor(identity: string, conf?: TLoggerConfig) {
    if (!(this instanceof Logger)) throw new Error('Logger must be called by new')

    this.identity = new Path(identity || 'global');

    const config = Object.assign({}, globalConf, conf)

    this.need_store = config.log_store

    this.filter = new Filter(config);
    this.printer = new Printer(config);

    this.log = this.log.bind(this);
    this.debug = this.debug.bind(this);
    this.info = this.info.bind(this);
    this.warn = this.warn.bind(this);
    this.error = this.error.bind(this);

    Logger.storer.hook('failed', (err) => {
      this.printer.log.call(this.printer, LEVEL.ERROR, 'logger storer', RESULT_MSG.DB_WRITE_FAILED, err);
    })
  }

  static init(conf: TLoggerInitConfig) {
    Object.assign(globalConf, conf)
  }

  /**
   * 输出原始log日志
   * @param {Date} start 起始时间
   * @param {Date} end 结束时间
   * @returns {Promise}
   */
  static output(start: Date, end?: Date): Promise<TDecLog[]> {
    if (!end) return Logger.storer.getByDate(start)
    return Logger.storer.getByRange(start, end)
  }

  /**
   * 下载原始log日志
   * @param {Date} start 起始时间
   * @param {Date} end 结束时间
   */
  static async download(start: Date, end?: Date): Promise<any> {
    const records = await Logger.output(start, end)
    download(records)
  }

  log(level: any, ...params: any[]) {
    return this._printByLevel(anything2Level(level), ...params)
  }

  debug(...params: any[]) {
    return this._printByLevel(LEVEL.DEBUG, ...params);
  }

  info(...params: any[]) {
    return this._printByLevel(LEVEL.INFO, ...params);
  }

  warn(...params: any[]) {
    return this._printByLevel(LEVEL.WARN, ...params);
  }

  error(...params: any[]) {
    return this._printByLevel(LEVEL.ERROR, ...params);
  }

  mute(...params: any[]) {
    return this._printByLevel(LEVEL.MUTE, ...params)
  }

  private _printByLevel(level: LEVEL, ...params: any[]) {
    if (this.need_store) Logger.storer.store(level, this.identity.toString(), ...params)
    if (!this.filter.exec(level, this.identity)) return
    this.printer.log.call(this.printer, level, this.identity.toString(), ...params);
  }
}
