const LEVEL_LIST = ['ERROR', 'WARN', 'INFO', 'DEBUG']

/**
 * 字符串/数字转为日志级别数字.
 * 传入数字会直接返回
 * 传入字符串会先尝试格式化成数字，然后返回
 * 如果无法格式化成数字，则尝试在枚举里选择对应字符串并返回下标
 * 如果上述都无法满足, 则一律转为0.
 *
 * @param {any} value
 * @returns {number} 日志级别数字
 *
 * @private
 */
export function anything2Level(value: any): number {
  if (typeof value === "number") return Math.floor(value);

  if (typeof value === "string") {
    const parsedValue = parseInt(value);
    if (!isNaN(parsedValue)) return parsedValue;

    const level = LEVEL_LIST.indexOf(value.toUpperCase());
    if (level !== -1) return level
  }

  return 0;
}

/**
 * level转为字符串.
 *
 * @param {any} level 日志级别
 * @returns {string} 日志级别字符串
 *
 * @private
 */
export function anything2LevelString(level: any): string {
  const nLevel = anything2Level(level);
  return LEVEL_LIST[nLevel] || `LEVEL(${level})`
}
