/**
 * 用于跨平台初始化一张 package.json
 */
const path = require('path');
const fs = require('fs');

//支持的进程参数列表
let processArguments = {
    'f': false, //强制覆盖
};

//获取执行进程参数
function getArguments() {
    var processarg = process.argv.splice(2);
    processarg.forEach(function (val, index, array) {
        if (val.startsWith('--')) {
            processArguments[val.replace('--', '')] = true;
        }
    });
    console.log('process arguments：', processarg + '\n'); //输出数组
}

const packageWin32 = path.join(__dirname, './package-win32.json');
const packageWin32App = path.join(__dirname, './package-win32-app.json');
const packageMacos = path.join(__dirname, './package-macos.json');
const packageMacosApp = path.join(__dirname, './package-macos-app.json');
const targetPackage = path.join(__dirname, './package.json');
const targetPackageApp = path.join(__dirname, './app/package.json');

let readStream, readStreamApp;
getArguments();

if (process.platform !== 'darwin') {
    if (!fs.existsSync(targetPackage) || !fs.existsSync(targetPackageApp) || processArguments['f']) {
        readStream = fs.createReadStream(packageWin32);
        readStreamApp = fs.createReadStream(packageWin32App);
    }
} else {
    if (!fs.existsSync(targetPackage) || !fs.existsSync(targetPackageApp) || processArguments['f']) {
        readStream = fs.createReadStream(packageMacos);
        readStreamApp = fs.createReadStream(packageMacosApp);
    }
}

if (readStream) {
    var writeStream = fs.createWriteStream(targetPackage);
    readStream.pipe(writeStream);
}

if (readStreamApp) {
    var writeStreamApp = fs.createWriteStream(targetPackageApp);
    readStreamApp.pipe(writeStreamApp);
}