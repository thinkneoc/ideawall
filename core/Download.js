const downloadRequest = require('request');
const path = require('path');
const fs = require("fs");
const logger = require('../core/Logger');

// ---- 流式下载类 ---- //
function StreamDownload() {
    // 声明下载过程回调函数
    this.downloadCallback = null;
}

// 下载进度
StreamDownload.prototype.showProgress = function (received, total, file, chunkLength) {
    const percentage = (received * 100) / total;
    // 用回调显示到界面上
    this.downloadCallback('progress', percentage, received, total, file, chunkLength);
};

/**
 * 下载控制
 *
 * @param patchUrl 目标地址
 * @param baseDir 本地存储地址[目录]
 * @param setFileName   下载文件名设置
 * @param file  文件对象, 用于传递记录
 * @param callback  下载过程回调
 * @param errorCallback 下载异常回调
 */
StreamDownload.prototype.downloadFile = function (patchUrl, baseDir, setFileName, file, callback, errorCallback) {
    try {
        logger.info('开始下载 ' + patchUrl);
        this.downloadCallback = callback; // 注册回调函数

        const downloadFile = setFileName; // 下载文件名称，也可以从外部传进来

        let receivedBytes = 0;
        let totalBytes = 0;

        const req = downloadRequest({
            method: 'GET',
            uri: patchUrl
        });

        const out = fs.createWriteStream(path.join(baseDir, downloadFile));
        req.pipe(out);


        req.on('response', (data) => {
            // 更新总文件字节大小
            totalBytes = parseInt(data.headers['content-length'], 10);
        });

        req.on('data', (chunk) => {
            // 更新下载的文件块字节大小
            receivedBytes += chunk.length;
            this.showProgress(receivedBytes, totalBytes, file, chunk.length);
        });

        var target = this;
        req.on('end', () => {
            logger.info('[' + file.name + '] 下载已完成，等待后切面处理.');
            target.downloadCallback('finished', 100, totalBytes, totalBytes, file, 0);
        });
    } catch (e) {
        console.error(e);
        errorCallback(e, file);
    }
};


module.exports = () => {
    return new StreamDownload();
};