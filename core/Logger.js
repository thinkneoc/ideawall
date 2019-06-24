var log4js = require('log4js');//使用log4js作为全局日志模块
var datetime = require('./Datetime')();
const path = require('path');
const os = require("os");
let appvar;
try {
    const {remote} = require('electron');
    appVar = remote.getGlobal('appVar')
} catch (e) {
    appVar = global.appVar;
}

var logPath = os.homedir() + "/.ideawall" + "/log";

//log4js配置项
log4js.configure({
    appenders: {
        everything: {
            type: 'dateFile',
            filename: logPath + '/ideawall',
            pattern: '.yyyy-MM-dd.log',
            alwaysIncludePattern: true,
            maxLogSize: 1024,
            backups: 30, // 日志备份数量，大于该数则自动删除
            category: 'logInfo', // 记录器名
            keepFileExt: true
        }
    },
    categories: {
        default: {
            appenders: ['everything'],
            level: 'all'
        }
    }
});
//获取logger对象
var logger = log4js.getLogger();

/**
 * trace级别
 * @kind AnyProcess [任意进程调用]
 * @param {any} data 日志数据
 */
function trace(data) {
    logger.level = 'trace';
    logger.trace(data);
    appVar._debug ? console.log(data) : '';
}

/**
 * debug级别
 * @kind AnyProcess [任意进程调用]
 * @param {any} data 日志数据
 */
function debug(data) {
    logger.level = 'debug';
    logger.debug(data);
    // console.log(data);//debug 级别不在控制台打印
}

/**
 * info级别
 * @kind AnyProcess [任意进程调用]
 * @param {any} data 日志数据
 */
function info(data) {
    logger.level = 'info';
    logger.info(data);
    appVar._debug ? console.log(data) : '';
}

/**
 * warn级别
 * @kind AnyProcess [任意进程调用]
 * @param {any} data 日志数据
 */
function warn(data) {
    logger.level = 'warn';
    logger.warn(data);
    appVar._debug ? console.warn(data) : '';
}

/**
 * log级别
 * @kind AnyProcess [任意进程调用]
 * @param {any} data 日志数据
 */
function log(data) {
    logger.level = 'log';
    logger.log(data);
    appVar._debug ? console.log(data) : '';
}

/**
 * error级别
 * @kind AnyProcess [任意进程调用]
 * @param {any} data 日志数据
 */
function error(data) {
    logger.level = 'error';
    logger.error(data);
    appVar._debug ? console.error(data) : '';
}

/**
 * fatal级别
 * @kind AnyProcess [任意进程调用]
 * @param {any} data 日志数据
 */
function fatal(data) {
    logger.level = 'fatal';
    logger.fatal(data);
    appVar._debug ? console.log(data) : '';
}

/**
 * 压缩打包日志文件, 限定渲染进程调用.
 */
function archive(ipc, callback, dateLimit) {
    var logZipFileName = 'ideawall.' + new Date().getTime() + '.log.zip';
    var glob = logPath + '/*.log';
    if (dateLimit === 'today') {
        glob = logPath + '/ideawall.' + datetime.nowDate() + '.*.log';
        logZipFileName = 'ideawall.' + datetime.nowDate() + '.log.zip';
    } else if (dateLimit === 'month') {
        glob = logPath + '/ideawall.' + datetime.format(false, 'YYYY-MM') + '*.log';
        logZipFileName = 'ideawall.' + datetime.format(false, 'YYYY-MM') + '.log.zip';
    } else if (dateLimit === 'year') {
        glob = logPath + '/ideawall.' + datetime.format(false, 'YYYY') + '*.log';
        logZipFileName = 'ideawall.' + datetime.format(false, 'YYYY') + '.log.zip';
    }
    var logZipPath = logPath + '/' + logZipFileName;
    ipc.send('ipc_resolver', 'archive', {
        output: logZipPath,
        glob: glob,
        name: 'log',
    });
    ipc.removeAllListeners('ipc_resolver_ret');
    ipc.on('ipc_resolver_ret', function (event, reb) {
        if (typeof callback === 'function') {
            callback(reb, logZipFileName, logZipPath);
        }
    });
}

//对外暴露方法
module.exports = {
    trace, debug, info, warn, log, error, fatal, archive
};