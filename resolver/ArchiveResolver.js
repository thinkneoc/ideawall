const fs = require('fs');
const archiver = require('archiver');
const child_process = require('child_process');

let archiveStore = archiver('zip', {
    zlib: {level: 9} // 设置压缩级别
});

/**
 * 压缩器
 * @param outputPath 例如: __dirname + '/example.zip'
 * @param callback
 * @constructor
 */
var ArchiveResolver = function (outputPath, callback) {
    // 创建接收输出流的文件.
    this.output = fs.createWriteStream(outputPath);

    this.init = function () {

        this.output.on('close', function () {
            console.log('[Core][ArchiveResolver]压缩已完成，输出文件描述符已关闭。output: ' + outputPath);
            console.log('[Core][ArchiveResolver]' + archiveStore.pointer() + ' total bytes');
            callback('close');
        });

        this.output.on('end', function () {
            console.log('[Core][ArchiveResolver]压缩结束.');
            callback('close');
        });

        // archiveStore.on('progress', function (progress) {
        //     console.log('[Core][ArchiveResolver]压缩进度: ' + progress + '/' + archiveStore.pointer() + '  output: ' + outputPath);
        // });

        archiveStore.on('warning', function (err) {
            if (err.code === 'ENOENT') {
                // log warning
                console.log('[Core][ArchiveResolver]压缩警告 \r\n' + err);
                callback('warning');
            } else {
                console.log('[Core][ArchiveResolver]压缩失败 \r\n' + err);
                callback('error');
                // throw error
                throw err;
            }
        });

        archiveStore.on('error', function (err) {
            console.log('[Core][ArchiveResolver]压缩失败 \r\n' + err);
            callback('error');
            throw err;
        });

        // 管道将存档数据传送到文件
        archiveStore.pipe(this.output);
    };

    /**
     * 从流附加文件
     * @param filePath
     * @param newname
     */
    this.fromStream = function (filePath, newname) {
        archiveStore.append(fs.createReadStream(filePath), {name: newname});
        // 完成存档（即我们完成了附加文件，但流还必须完成）
        // “close”、“end”或“finish”可以在调用此方法后立即激发，因此请预先注册到它们
        archiveStore.finalize();
    };

    /**
     * 从字符串附加文件
     * @param str
     * @param newname
     */
    this.fromString = function (str, newname) {
        archiveStore.append(str, {name: newname});
        archiveStore.finalize();
    };

    /**
     * 从缓冲区附加文件
     * @param bufferFrom
     * @param newname
     */
    this.fromBuffer = function (bufferFrom, newname) {
        var buffer3 = Buffer.from(bufferFrom);
        archiveStore.append(buffer3, {name: newname});
        archiveStore.finalize();
    };

    /**
     * 附加单个文件, 注意与流附加的区别. 性能上, 流附加更佳.
     * @param filePath
     * @param newname
     */
    this.fromFile = function (filePath, newname) {
        archiveStore.file(filePath, {name: newname});
        archiveStore.finalize();
    };

    /**
     * 附加子目录中的文件，并将其命名为存档中的“新子目录”
     * @param dirPath
     * @param newname 若不传 newname, 附加子目录中的文件，将其内容放在存档的根目录中
     */
    this.fromDir = function (dirPath, newname) {
        archiveStore.directory(dirPath, newname);
        archiveStore.finalize();
    };

    /**
     * 全局正则过滤模式
     * @param glob 例如: 'subdir/*.txt'
     * @param newname
     */
    this.fromGlob = function (glob, newname) {
        archiveStore.glob(glob, newname);
        archiveStore.finalize();

    };

    this.init();
};

module.exports = (outputPath, callback) => {
    return new ArchiveResolver(outputPath, callback);
};
