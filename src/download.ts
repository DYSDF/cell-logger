import dateFormat from "dateformat";
import { RESULT_MSG } from "./enum";
import { TDecLog } from "./storer";

const NEEDS_QUOTING = /^\s|\s$|,|"|\n/

const encode = (d: any) => {
  if (typeof d !== 'string') d = JSON.stringify(d)

  if (NEEDS_QUOTING.test(d)) {
    d = d.replace(/"/g, '""');
    d = "\"" + d + "\""
  }

  return d
}

export default (records: TDecLog[]) => {
  let csv_content = ''
  // 拼接headers
  csv_content += `${['date', 'level', 'path', 'log', 'args'].join(',')}\r\n`

  // 循环records
  records.forEach((record) => {
    const createAt = dateFormat(new Date(record.create_at), 'yyyy-mm-dd HH:MM:ss:l')
    const log = record.log
    if (log === RESULT_MSG.DB_NOT_DECODED) {
      csv_content += `${createAt},,,${RESULT_MSG.DB_NOT_DECODED}\r\n`
    } else if (typeof log !== 'object') {
      csv_content += `${createAt},,,${RESULT_MSG.DB_IS_EMPTY}\r\n`
    } else {
      csv_content += `${createAt}`
        + `,${log.level},${log.path}`
        + `,${log.data.map(encode).join(',')}\r\n`
    }
  })

  const csv_blob = new Blob(['\uFEFF' + csv_content], {
    type: 'text/csv;charset=utf-8',
  });

  const url = window.URL.createObjectURL(csv_blob)
  const downloadLink = document.createElement("a");
  downloadLink.href = url;
  downloadLink.download = "web_logs.csv"; // 导出的文件名
  downloadLink.click();
  window.URL.revokeObjectURL(url);
}
