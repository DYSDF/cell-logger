/**
 * 日志级别,
 *
 * @enum {number}
 */
export enum LEVEL {
  MUTE = -1,
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

export enum RESULT_MSG {
  DB_NOT_SUPPORT = 'indexedDB is not supported',
  DB_WRITE_FAILED = 'indexedDB write failed',
  DB_NOT_DECODED = 'indexedDB data cannot be decoded',
  DB_IS_EMPTY = 'indexedDB data is empty',
  EXECED_TRY_TIMES = 'execed try times',
  EXECED_LOG_SIZE_LIMIT = 'execed log size day limit',
}
