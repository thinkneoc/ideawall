const logger = require('../../core/Logger');//日志模块

const ipcRenderer = require('electron').ipcRenderer;


/**
 * 发送消息给主进程
 * @kind RendererProcessOnly [仅渲染进程]
 * @param {string} signal 发送给主进程的信号
 * @param {any} sendargs 发送给主进程的数据
 */
function sendToMainProcess(signal, sendargs) {
    logger.info("[Process][RendererProcessHelper][sendToMainProcess]给主进程发送信号 " + signal + " 参数 " + sendargs);
    ipcRenderer.send(signal, sendargs);//使用ipcRenderer方法给主进程发送消息
}

/**
 * 根据信号量注册对应的回调函数
 * @kind RendererProcessOnly [仅渲染进程]
 * @param {string} signal 渲染进程接收的信号
 * @param {function} callback 收到信号量要执行的回调函数
 */
function registeCallback(signal, callback) {
    logger.info("[Process][RendererProcessHelper][registeCallback]注册信号量 " + signal + " 的回调函数");
    if (typeof callback === "function") {
        ipcRenderer.on(signal, (sys, args) => {
            callback(args,sys);
        });
        return true;
    } else {
        logger.warn("[Process][RendererProcessHelper][registeCallback]不是函数类型" + callback);
        return false;
    }
}


module.exports = {
    sendToMainProcess,
    registeCallback
}