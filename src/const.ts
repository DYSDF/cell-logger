export const K_BYTE = 1024;
export const M_BYTE = 1024 * K_BYTE;

export const LOGGER_DB_VERSION = 1;
export const LOGGER_DB_NAME = 'logger_web_db';

export const LOGGER_DETAIL_TABLE_NAME = 'logger_detail_table';
export const LOGGER_PAGE_TABLE_NAME = 'logger_page_table';

export const DEFAULT_LOG_DURATION = 7 * 24 * 3600 * 1000; // keeps 7 days logs locally
export const DEFAULT_SINGLE_DAY_MAX_SIZE = 7 * M_BYTE; // 7M storage limit for one day
export const DEFAULT_SINGLE_PAGE_MAX_SIZE = 1 * M_BYTE; // 1M storage limit for one page
