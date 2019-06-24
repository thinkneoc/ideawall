const logger = require('../core/Logger');//日志模块
var remote = require('electron').remote;//electron的remote模块，用于调用主进程中的对象

/**
 * 设置状态
 * @param {string} name 状态名
 * @param {any} value 状态值
 */
function setStatus(name, value) {
    logger.info("[Service][StatusService-setStatus]设置状态 " + name + " " + value);
    let statusMap = remote.getGlobal('sharedStatus').statusMap;//通过remote获取全局sharedStatus对象中的statusMap作为本地的map类型变量
    statusMap.set(name, value);//map的set方法
    remote.getGlobal('sharedStatus').statusMap = statusMap;//通过remote写回全局sharedStatus对象
}

/**
 * 获取状态
 * @param {string} name 状态名
 * @return {any|string} 有则返回map中的对象，无则返回空串
 */
function getStatus(name) {
    logger.info("[Service][StatusService-getStatus]获取状态 " + name);
    let statusMap = remote.getGlobal('sharedStatus').statusMap;//通过remote获取全局sharedStatus对象中的statusMap作为本地的map类型变量
    if (statusMap.has(name)) {//判断是否有此类型
        logger.info("获取状态 " + name + " 值 " + statusMap.get(name));
        return statusMap.get(name);//有则返回
    } else {
        return "";//无则返回空字符串
    }
}

module.exports = {
    setStatus,
    getStatus
}