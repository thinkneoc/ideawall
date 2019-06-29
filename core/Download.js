const downloadRequest = esLibrary.require('request');

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

// 下载过程
StreamDownload.prototype.downloadFile = function (patchUrl, baseDir, setFileName, file, callback, errorCallback) {
    try {
        console.debug('开始下载 ' + patchUrl);
        this.downloadCallback = callback; // 注册回调函数

        const downloadFile = setFileName; // 下载文件名称，也可以从外部传进来

        let receivedBytes = 0;
        let totalBytes = 0;

        const req = downloadRequest({
            method: 'GET',
            uri: patchUrl
        });

        const out = Fs.createWriteStream(Path.join(baseDir, downloadFile));
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
            console.log('[' + file.name + '] 下载已完成，等待后切面处理.');
            // TODO: 检查文件，部署文件，删除文件
            target.downloadCallback('finished', 100, totalBytes, totalBytes, file, 0);
        });
    } catch (e) {
        console.error(e);
        errorCallback(e, file);
    }
};

const streamDownload = new StreamDownload();

// 调用下载
// StreamDownload.downloadFile("http://mywebsite/update.7z", "./file", downloadFileCallback)