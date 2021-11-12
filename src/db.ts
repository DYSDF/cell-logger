import {
  CustomDB,
  idbIsSupported,
  deleteDB
} from 'idb-managed';
import dateFormat from 'dateformat';
import {
  LOGGER_DB_VERSION,
  LOGGER_DB_NAME,
  LOGGER_DETAIL_TABLE_NAME,
  LOGGER_PAGE_TABLE_NAME,
  DEFAULT_LOG_DURATION,
  DEFAULT_SINGLE_DAY_MAX_SIZE,
  DEFAULT_SINGLE_PAGE_MAX_SIZE
} from './const'
import {
  sizeOf,
  getStartOfDay
} from './utils';
import {
  RESULT_MSG
} from './enum'

export interface ILogDetail {
  index: string;
  size: number;
  log: string;
  create_at: number;
}
export interface ILogDaily {
  index: string;
  total_size: number;
  page_sizes: number[]; // Array of pageSize of each page.
}

const createPageIndex = (date: Date) => dateFormat(date, 'yyyy-mm-dd')

const createDetailIndex = (logDay: string, index: number): string => {
  return `${logDay}_${index}`;
}

export default class LoggerDB {
  public static idbIsSupported = idbIsSupported;
  public static deleteDB = deleteDB;
  private db: CustomDB;

  constructor(dbName?: string) {
    this.db = new CustomDB({
      dbName: dbName || LOGGER_DB_NAME,
      dbVersion: LOGGER_DB_VERSION,
      tables: {
        [LOGGER_DETAIL_TABLE_NAME]: {
          indexList: [{
            indexName: 'index',
            unique: false
          }, {
            indexName: 'create_at',
            unique: false
          }]
        },
        [LOGGER_PAGE_TABLE_NAME]: {
          primaryKey: 'index'
        }
      }
    });
  }

  /**
   * 记录log到数据库
   * @param logString
   */
  async add(logString: string): Promise<void> {
    const logSize = sizeOf(logString);
    const now = new Date();
    const today: string = createPageIndex(now);
    const todayPage: ILogDaily = await this.getDayPage(now) || {
      index: today,
      total_size: 0,
      page_sizes: [0]
    };

    // 超过当日容量限制则报错
    if (todayPage.total_size + logSize > DEFAULT_SINGLE_DAY_MAX_SIZE) {
      throw new Error(RESULT_MSG.EXECED_LOG_SIZE_LIMIT);
    }

    if (!todayPage.page_sizes) {
      todayPage.page_sizes = [0]
    }

    const pageSizes = todayPage.page_sizes;
    let pageIndex = pageSizes.length - 1;
    const pageSize = pageSizes[pageIndex];
    const needNewPage = pageSize > 0 && pageSize + logSize > DEFAULT_SINGLE_PAGE_MAX_SIZE;
    if (needNewPage) {
      pageSizes.push(logSize)
      pageIndex += 1
    } else {
      pageSizes[pageIndex] += logSize
    }

    const logDetail: ILogDetail = {
      index: createDetailIndex(today, pageIndex),
      create_at: now.getTime(),
      size: logSize,
      log: logString
    };

    const logPage: ILogDaily = {
      index: today,
      total_size: todayPage.total_size + logSize,
      page_sizes: pageSizes
    };

    const durationBeforeExpired = DEFAULT_LOG_DURATION - (+new Date() - getStartOfDay(new Date()));
    await this.db.addItems([{
      tableName: LOGGER_PAGE_TABLE_NAME,
      item: logPage,
      itemDuration: durationBeforeExpired
    }, {
      tableName: LOGGER_DETAIL_TABLE_NAME,
      item: logDetail,
      itemDuration: durationBeforeExpired
    }]);
  }

  /**
   * 获取某天log分页数据
   * @param {Date} date
   * @returns {Promise}
   */
  async getDayPage(date: Date): Promise<ILogDaily | null> {
    return await this.db.getItem(
      LOGGER_PAGE_TABLE_NAME,
      createPageIndex(date)
    ) as ILogDaily ?? null;
  }

  async getDayPages(startDate: Date, endDate: Date): Promise<ILogDaily[]> {
    const startAt = createPageIndex(startDate)
    const endAt = createPageIndex(endDate)
    if (startAt === endAt) {
      const result = await this.db.getItem(
        LOGGER_PAGE_TABLE_NAME,
        startAt
      ) as ILogDaily | null;
      return result ? [result] : [];
    } else {
      return await this.db.getItemsInRange({
        tableName: LOGGER_PAGE_TABLE_NAME,
        indexRange: {
          indexName: 'index',
          lowerIndex: startAt,
          upperIndex: endAt,
          lowerExclusive: false,
          upperExclusive: false
        }
      }) as ILogDaily[];
    }
  }

  async getLogsByDate(date: Date): Promise<ILogDetail[]> {
    return await this.db.getItemsInRange({
      tableName: LOGGER_DETAIL_TABLE_NAME,
      indexRange: {
        indexName: 'index',
        lowerIndex: createDetailIndex(createPageIndex(date), 0),
        lowerExclusive: false
      }
    }) as ILogDetail[];
  }

  async getLogsByRange(startDate: Date, endDate: Date): Promise<ILogDetail[]> {
    const startAt = createPageIndex(startDate)
    if (startAt === createPageIndex(endDate)) {
      return this.getLogsByDate(startDate)
    } else {
      endDate.setDate(endDate.getDate() + 1)
      const endAt = createPageIndex(endDate)
      return await this.db.getItemsInRange({
        tableName: LOGGER_DETAIL_TABLE_NAME,
        indexRange: {
          indexName: 'index',
          lowerIndex: createDetailIndex(startAt, 0),
          lowerExclusive: false,
          upperIndex: createDetailIndex(endAt, 0),
          upperExclusive: true
        }
      }) as ILogDetail[];
    }
  }
}
