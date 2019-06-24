const Electron = require('electron');

const path = require('path');//原生库path模块
const url = require('url');
const os = require("os");
const fs = require("fs");

const logger = require('../../core/Logger');//引入全局日志组件
const config = require('../../core/Config');//引入全局配置组件

const relative = '../../';

/**
 * 系统能源监控 [在app.on(ready)之后将无法使用. ]
 */
function init(appVar) {
    powerMonitor = Electron.powerMonitor;
    //在系统挂起的时候触发.
    powerMonitor.on('suspend', function () {
        console.log('The system is going to sleep');
    });
    //在系统恢复继续工作的时候触发
    powerMonitor.on('resume', function () {
        console.log('The system is resumed');
    });
    //在系统使用交流电的时候触发
    powerMonitor.on('on-ac', function () {
        console.log('The system is on-ac');
    });
    //在系统使用电池电源的时候触发
    powerMonitor.on('on-battery', function () {
        console.log('The system is on-battery');
    });
}

module.exports = {
    init
};