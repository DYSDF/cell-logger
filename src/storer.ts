import Hookable from 'cell-hookable'
import JSEncrypt from 'jsencrypt';
import LogDB, { ILogDetail } from './db';
import { invokeInQueue } from './invoke-queue';
import { LEVEL, RESULT_MSG } from './enum';
import globalConf from "./config";

export type TDBLog = {
  level: number,
  path: string,
  data: Array<any>
}

export type TDecLog = Pick<ILogDetail, 'index'|'size'|'create_at'> & {
  log: TDBLog|string
}

export interface IStorer extends Hookable {
  store(level: LEVEL, path: string, ...params: any[]): Promise<any>,
  getByDate(date: Date): Promise<TDecLog[]>,
  getByRange(start: Date, end: Date): Promise<TDecLog[]>
}

const MAX_CRYPTO_LEN = 128 - 11

export default class Storer extends Hookable implements IStorer {
  private readonly DB: LogDB

  private readonly encrypt?: JSEncrypt
  private readonly decrypt?: JSEncrypt

  private retry_quota: number = 3

  constructor() {
    super(false)
    if (!LogDB.idbIsSupported()) throw new Error(RESULT_MSG.DB_NOT_SUPPORT)
    this.DB = new LogDB()

    if (globalConf.log_pubkey) {
      this.encrypt = new JSEncrypt()
      this.encrypt.setPublicKey(globalConf.log_pubkey)
    }
    if (globalConf.log_prikey) {
      this.decrypt = new JSEncrypt()
      this.decrypt.setPrivateKey(globalConf.log_prikey)
    }
  }

  private encode(data: TDBLog): string {
    const base64 = btoa(encodeURIComponent(JSON.stringify(data)))
    if (this.encrypt) {
      const parts = ['']
      let no_err = true
      for (let i = 0; i < base64.length; i += MAX_CRYPTO_LEN) {
        const enc = this.encrypt.encrypt(base64.substr(i, MAX_CRYPTO_LEN))
        if (!enc) {
          no_err = false
          break
        }
        parts.push(enc)
      }
      if (no_err) return parts.join('$')
    }
    return base64
  }

  private decode(enc: string): string | TDBLog {
    if (typeof enc !== 'string') return ''

    if (enc.startsWith('$')) {
      enc = enc.substr(1)
      if (!this.decrypt) return RESULT_MSG.DB_NOT_DECODED
      const parts = enc.split('$')
      let no_err = true
      for (let i = 0; i < parts.length; i++) {
        const dec = this.decrypt.decrypt(parts[i])
        if (!dec) {
          no_err = false
          break
        }
        parts[i] = dec
      }
      if (!no_err) return RESULT_MSG.DB_NOT_DECODED
      enc = parts.join('')
    }

    try {
      return JSON.parse(decodeURIComponent(atob(enc)))
    } catch (e) {
      return RESULT_MSG.DB_NOT_DECODED
    }
  }

  async store(level: LEVEL, path: string, ...params: any[]) {
    if (this.retry_quota <= 0) return
    try {
      const log: TDBLog = {
        level,
        path,
        data: params
      }
      await invokeInQueue(() => this.DB.add(this.encode(log)));
      await this.call('success', log)
    } catch(e) {
      this.retry_quota -= 1
      await this.call('failed', e)
    }
  }

  async getByDate(date: Date): Promise<TDecLog[]> {
    const records = await this.DB.getLogsByDate(date);
    return records.map(record => {
      return {
        ...record,
        log: this.decode(record.log)
      }
    });
  }

  async getByRange(start: Date, end: Date): Promise<TDecLog[]> {
    const records = await this.DB.getLogsByRange(start, end)
    return records.map(record => {
      return {
        ...record,
        log: this.decode(record.log)
      };
    })
  }
}
