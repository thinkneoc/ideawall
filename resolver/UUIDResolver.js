const child_process = require('child_process');
const uuid = require('../core/UUID')();

//支持的进程参数列表
let processArguments = {
    'serial': false, //默认算法
    'v1': false, // v1 算法
};

/**
 * 获取执行进程参数
 */
function getArguments() {
    var processarg = process.argv.splice(2);
    processarg.forEach(function (val, index, array) {
        if (val.startsWith('--')) {
            processArguments[val.replace('--', '')] = true;
        }
    });
    console.log('process arguments：', processarg + '\n'); //输出数组
}

/**
 * 主入口
 */
function main(){
    getArguments();
    if(processArguments['v1']){
        console.log(uuid.v1());
    }else{
        console.log(uuid.id);
    }
}
main();