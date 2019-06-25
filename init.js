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
const packageMacos = path.join(__dirname, './package-macos.json');
const targetPackage = path.join(__dirname, './package.json');
let readStream;
getArguments();

if (process.platform !== 'darwin') {
    if (!fs.existsSync(targetPackage) || processArguments['f']) {
        readStream = fs.createReadStream(packageWin32);
    }
} else {
    if (!fs.existsSync(targetPackage)|| processArguments['f']) {
        readStream = fs.createReadStream(packageMacos);
    }
}

if (readStream) {
    var writeStream = fs.createWriteStream(targetPackage);
    readStream.pipe(writeStream);
}