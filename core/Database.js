/**
 * 本地数据库[主进程/渲染进程 通用, 暂时使用nedb(简单粗暴)
 *
 * @author troy
 * @date 2019/01/17 10:52 PM
 */
const path = require('path');
const fs = require("fs");
const os = require("os");
const db = require('better-sqlite3')(os.homedir() + "/.ideawall/" + "data/iw.db");
// const db = require('better-sqlite3')("data/iw.db");
const crypto = require('./Crypto');
const uuid = require('./UUID')();
const datetime = require('../core/Datetime')();
const config = require('../core/Config');//引入全局配置组件
const logger = require('../core/Logger');
const lang = require('../core/Lang')();
const Model = require('../core/Model')();

/**
 // sqlite 可以存放json数据
 // sqlite数据库中不支持布尔型。
 // SQLite将数据值的存储划分为以下几种存储类型：
 // NULL: 表示该值为NULL值。
 // INTEGER: 无符号整型值。
 // REAL: 浮点值。
 // TEXT: 文本字符串，存储使用的编码方式为UTF-8、UTF-16BE、UTF-16LE。
 // BLOB: 存储Blob数据，该类型数据和输入数据完全相同。

 * @param model 数据模型
 * @constructor
 */
function Database(model) {


    //数据库初始化, 自动执行.
    this.init = function () {
        var stmt = db.prepare(model.initscript);
        return stmt.run()
    };

    /**
     * 执行初始化脚本, 初始化数据库. 如果已经有就不会再处理.
     * 建议在程序启动之后检测执行一次. 不需要传入 model.
     */
    this.initial = function (sqlpath) {
        fs.readFile(sqlpath, (err, data) => {
            if (err) {
                logger.warn(err);
            }
            var stmt = db.prepare(data);
            return stmt.run(params)
        });
    };

    /**
     * SQL脚本自构建算法, 构建并执行
     * 对于 codition 和 setter, 如果不执行的话, 这里只需要用到键.
     * 其中:
     * insert: 不需要 codition, 必选 setter.
     * select: 可选 codition, 可选 setter
     * update: 必选 codition, 可选 setter
     * delete: 必选 codition, 不需要 setter
     *
     * 此处不管, orderby, limit, like, glob, groupby, DISTINCT 等子句, 因为只有 select 需要, 手动去处理即可. 并且, 业务特征比较强的话, 建议手写 SQL, 而不是靠生辰.
     */
    this.buildExec = function (codition, setter, sqltype, dontexec) {
        //1.数据准备
        var tableName = Model.tbname(model);
        var columns = model.tbinfo.columns;
        var st = sqltype.toLowerCase();
        logger.debug('[Core][Database]' + model.tbinfo.anno + '[' + model.tbinfo.name + '] --' + st);
        logger.debug('[Core][Database]' + '参数集: ' + JSON.stringify({codition: codition, setter: setter}, false, 2));

        //2.codition 构建
        var codScript = '';
        if (codition) {//codition 一定是对象
            for (let x in codition) {
                if (!columns.hasOwnProperty(x)) {//必须存在定义.
                    continue;
                }
                var column = Model.fieldname(model, x);
                codScript += ' and ' + column + '=@' + x + ' ';
                codition[column] = codition[x];
            }
        }

        //3.setter 构建
        var setterScript = '';
        var setterExactScript = '';
        if (setter) {//setter 在 batch* 的场景下, 是数组!
            if (lang.isArray(setter) && setter.length > 0) {
                setter = setter[0];
            }
            for (let y in setter) {
                if (!columns.hasOwnProperty(y)) {//必须存在定义.
                    continue;
                }
                var column = Model.fieldname(model, y);
                if (st === 'insert') {//insert 语句构建
                    setterScript += column + ',';
                    setterExactScript += '@' + y + ',';
                } else if (st === 'update') {
                    setterScript += column + '=@' + y + ',';
                } else if (['selectone', 'select'].indexOf(st) > -1) {
                    setterScript += column + ',';
                }
                setter[column] = setter[y];
            }
        }
        setterScript = setterScript.length > 0 ? setterScript.substring(0, setterScript.length - 1) : setterScript;//去掉最后的逗号.
        setterExactScript = setterExactScript.length > 0 ? setterExactScript.substring(0, setterExactScript.length - 1) : setterExactScript;

        //4.按类型包装
        var resultScript = '';
        var stmt, result, params = Object.assign({}, codition, setter);
        // console.debug(params);
        if (st === 'insert') {//insert 语句构建
            resultScript = "insert into " + tableName + " (" + setterScript + ") VALUES (" + setterExactScript + ")";
            logger.debug('[Core][Database]' + '[源脚本] ' + resultScript);
            stmt = db.prepare(resultScript);
            (!dontexec) ? (result = stmt.run(params)) : '';
        } else if (st === 'update') {
            resultScript = "update " + tableName + " set " + setterScript + " where 1=1 " + codScript;
            logger.debug('[Core][Database]' + '[源脚本] ' + resultScript);
            stmt = db.prepare(resultScript);
            (!dontexec) ? (result = stmt.run(params)) : '';
        } else if (st === 'delete') {
            resultScript = "delete from " + tableName + " where 1=1 " + codScript;
            logger.debug('[Core][Database]' + '[源脚本] ' + resultScript);
            stmt = db.prepare(resultScript);
            (!dontexec) ? (result = stmt.run(params)) : '';
        } else if (st === 'selectone') {
            resultScript = "select " + (setterScript !== '' ? setterScript : "*") + " from " + tableName + " where 1=1 " + codScript;
            logger.debug('[Core][Database]' + '[源脚本] ' + resultScript);
            stmt = db.prepare(resultScript);
            (!dontexec) ? (result = stmt.get(params)) : '';//get, 返回匹配到的第一行
        } else if (st === 'select') {
            resultScript = "select " + (setterScript !== '' ? setterScript : "*") + " from " + tableName + " where 1=1 " + codScript;
            logger.debug('[Core][Database]' + '[源脚本] ' + resultScript);
            stmt = db.prepare(resultScript);
            (!dontexec) ? (result = stmt.all(params)) : '';//all, 返回匹配到的数组
        }

        //5.日志打印
        (!dontexec) ? logger.debug('[Core][Database]' + ((!dontexec) ? '[已执行] ' + '结果集: ' + JSON.stringify(result, false, 2) : '[暂未执行] ')) : '';
        result = Model.rmFps(model, result);
        // ((!dontexec) ? logger.debug('[Core][Database]' + '[已执行] ' + '切面集: ' + JSON.stringify(result, false, 2)) : '[暂未执行] ');

        //6.执行>? 返回构建结果
        return {
            script: resultScript,
            stmt: stmt,//select 通过 get 执行并调用, 其他通过 run 直接执行.
            result: result,
        };
    };

    //构建分页语句
    this.buildPageScript = function (pageNum, pageSize) {
        pageNum = pageNum ? pageNum : 1;
        pageSize = pageSize ? pageSize : 10;
        return ' LIMIT ' + parseInt(pageSize) + ' OFFSET ' + ((pageNum - 1) * 10) + ' ';
    };

    /**
     * 插入, 返回成功条数.
     * @param setter 对象
     */
    this.insert = function (setter) {
        return this.buildExec(false, setter, 'insert').result;
    };

    /**
     * 批量插入, 返回成功条数.
     * @param setters 数组
     */
    this.batchInsert = function (setters) {
        var stmt = this.buildExec(false, setters, 'insert', true).stmt;
        const insertMany = db.transaction((objs) => {
            var num = 0;
            for (const obj of objs) {
                num += stmt.run(obj);
            }
            return num;
        });
        return insertMany(setters);
    };

    /**
     * 更新, 返回成功条数.
     * @param codition
     * @param setter 对象
     */
    this.update = function (codition, setter) {
        return this.buildExec(codition, setter, 'update').result;
    };

    /**
     * 批量更新, 返回成功条数.
     *
     * @param codition
     * @param setters 数组
     */
    this.batchUpdate = function (codition, setters) {
        var stmt = this.buildExec(codition, setters, 'update', true).stmt;
        const updateMany = db.transaction((objs) => {
            var num = 0;
            for (const obj of objs) {
                num += stmt.run(obj);
            }
            return num;
        });
        return updateMany(setters);
    };

    /**
     * 条件判定插入/更新, 返回成功条数.
     *
     * @param codition
     * @param setter
     */
    this.insertOrUpdate = function (codition, setter) {
        var row = this.selectFirst(codition);
        if (row) {//update
            return this.update(codition, setter);
        } else {//insert
            return this.insert(setter);
        }
    };

    /**
     * 删除, 返回成功条数.
     * @param codition
     */
    this.delete = function (codition) {
        return this.buildExec(codition, false, 'delete').result;
    };

    /**
     * 批量删除, 返回成功条数.
     *
     * @param codition
     */
    this.batchDelete = function (codition) {
        var stmt = this.buildExec(codition, false, 'delete', true).stmt;
        const deleteMany = db.transaction((objs) => {
            var num = 0;
            for (const obj of objs) {
                num += stmt.run(obj);
            }
            return num;
        });
        return deleteMany();
    };

    /**
     * 判定数据是否存在, 返回 [查到的数据(对象)] / false或 undefined.
     *
     * @param codition
     */
    this.exist = function (codition) {
        // return (this.count(codition) > 0);//性能不是很好, 注意 sqlite 中查询性能: get > all > iterate(迭代器).
        return (this.selectFirst(codition));
    };

    /**
     * 统计数据, 返回数据条数.
     *
     * @param codition
     * @returns {number|*}
     */
    this.count = function (codition) {
        var row = this.select(codition);
        if (row && row.length > 0) {
            return row.length;
        }
        return 0;
    };

    /**
     * 查询, 返回数组
     *
     * codition 必须, setter 不传就是 *
     *
     * @param codition
     * @param setter
     */
    this.select = function (codition, setter) {
        return this.buildExec(codition, setter, 'select').result;
    };

    /**
     * 查询匹配的第一行, 返回对象
     *
     * codition 必须, setter 不传就是 *
     *
     * @param codition
     * @param setter
     */
    this.selectFirst = function (codition, setter) {
        return this.buildExec(codition, setter, 'selectone').result;
    };

    /**
     * 查询所有, 返回数组.
     */
    this.selectAll = function () {
        return this.buildExec(false, false, 'select').result;
    };

    /**
     * 查询数据[数组], 并连接某一列为一个新的值数组.
     * 如果要查询所有的, codition 和 setter 不传即可.
     *
     * @param codition
     * @param setter
     * @param mapKey 映射键, 通常是列名
     * @returns {*}
     */
    this.selectMap = function (codition, setter, mapKey) {
        mapKey = Model.fieldname(model, mapKey);
        var result = this.select(codition, setter);
        return result.map((item) => {
            return item[mapKey];
        });
    };

    /**
     * 执行指定查询SQL脚本, 返回数组.(一般是结果集)
     *
     * @param sqlscript
     * @param sqlparam
     * @returns {*|void}
     */
    this.execSelect = function (sqlscript, sqlparam) {
        logger.debug('[Core][Database]' + model.tbinfo.anno + '[' + model.tbinfo.name + '] --execSelect');
        logger.debug('[Core][Database]' + '参数集: ' + JSON.stringify(sqlparam, false, 2));
        logger.debug('[Core][Database]' + '[源脚本] ' + sqlscript);
        var stmt = db.prepare(sqlscript);
        var result;
        if (sqlparam) {
            result = stmt.all(sqlparam);
        } else {
            result = stmt.all();
        }
        logger.debug('[Core][Database]' + '[已执行] ' + '结果集: ' + JSON.stringify(result, false, 2));
        return Model.rmFps(model, result);
    };

    /**
     * 执行指定SQL脚本 返回对象.(一般是受影响数据条数)
     *
     * @param sqlscript
     * @param sqlparam
     * @returns {*|void}
     */
    this.exec = function (sqlscript, sqlparam) {
        logger.debug('[Core][Database]' + model.tbinfo.anno + '[' + model.tbinfo.name + '] --exec');
        logger.debug('[Core][Database]' + '参数集: ' + JSON.stringify(sqlparam, false, 2));
        logger.debug('[Core][Database]' + '[源脚本] ' + sqlscript);
        var stmt = db.prepare(sqlscript);
        var result;
        if (sqlparam) {
            result = stmt.run(sqlparam);
        } else {
            result = stmt.run();
        }
        logger.debug('[Core][Database]' + '[已执行] ' + '结果集: ' + JSON.stringify(result, false, 2));
        return result;
    };

    this.init();//自动初始化.
}


//主进程调用: const db = require('../core/database')(model);
module.exports = (model) => {
    return new Database(model);
};
