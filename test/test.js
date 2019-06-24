const db = require('better-sqlite3')('data/iw.db');

db.prepare("insert into iw_devicedesk (dd_display_id, dd_display_rp, dd_display_info) VALUES (?,?,?)")
    .run('1346467', '1314646', '000');
const row = db.prepare('SELECT * FROM iw_devicedesk WHERE dd_display_id=?').get('1346467');
console.log(row);


// sqlite 可以存放json数据
// sqlite数据库中不支持布尔型。
// SQLite将数据值的存储划分为以下几种存储类型：
// NULL: 表示该值为NULL值。
// INTEGER: 无符号整型值。
// REAL: 浮点值。
// TEXT: 文本字符串，存储使用的编码方式为UTF-8、UTF-16BE、UTF-16LE。
// BLOB: 存储Blob数据，该类型数据和输入数据完全相同。