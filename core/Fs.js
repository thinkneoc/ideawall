const logger = require('./Logger');//日志模块
const config = require('./Config');//配置模块

const fs = require('fs');//Nodejs原生fs模块 用于文件系统读写操作
const child_process = require('child_process');//Nodejs原生child_process模块 用于进程管理

/**
 * 读取文件并执行回调
 * @param {string} filepath 文件路径
 * @param {function} callback 回调函数
 */
function readFileAndRunCallback(filepath, callback) {
    fs.readFile(filepath, (err, data) => {
        if (err) {
            logger.warn(err);
        }
        if (typeof callback === "function") {
            callback(data);
        }
    });
}

/**
 * 同步读取文件
 * @param {string} filepath 文件路径
 * @return {string} 文件内容
 */
function readFileSync(filepath) {
    return fs.readFileSync(filepath);
}

/**
 * 写入文件并执行回调函数
 * @param {string} filepath 文件路径
 * @param {string|buffer} filedata 写入的数据
 * @param {function} callback 回调函数
 */
function writeFileAndRunCallback(filepath, filedata, callback) {
    fs.writeFile(filepath, filedata, (err) => {
        if (err) {
            logger.warn(err);
        }
        if (typeof callback === "function") {
            callback();
        }
    });
}

/**
 * 同步写入文件
 * @param {string} filepath 文件路径
 * @param {string|buffer} filedata 写入的数据
 */
function writeFileSync(filepath, filedata) {
    fs.writeFileSync(filepath, filedata);
}

/**
 * 读取文件夹结构并执行回调函数
 * @param {string} dirpath 文件夹路径
 * @param {function} callback 回调函数
 */
function readDirAndRunCallback(dirpath, callback) {
    fs.readdir(dirpath, (err, files) => {
        if (typeof callback === "function") {
            callback(files);
        }
    });
}

/**
 * 创建空文件
 * @param {string} filepath 文件路径
 * @return {boolean} [true]
 */
function createEmptyFile(filepath) {
    child_process.execSync('type nul > ' + filepath);
    return true;
}

/**
 * 创建目录
 * @param {string} dirpath 创建的目录绝对地址
 * @return {boolean} [true]
 */
function createDir(dirpath) {
    child_process.execSync('md ' + dirpath);
    return true;
}

/**
 * 判断文件或者文件夹是否存在
 * @param {string} checkpath
 * @return {boolean} 
 */
function checkFileOrDirExist(checkpath) {
    return fs.existsSync(checkpath);
}

/**
 * 删除文件或文件夹
 * @param {string} deletepath 待删除的文件或文件夹路径
 */
function deleteFileOrDir(deletepath) {
    child_process.execSync('rd /s /q ' + deletepath);
}

module.exports = {
    readFileAndRunCallback,
    readFileSync,
    writeFileAndRunCallback,
    writeFileSync,
    readDirAndRunCallback,
    createEmptyFile,
    createDir,
    checkFileOrDirExist,
    deleteFileOrDir
};