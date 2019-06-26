//用于创建原生浏览器窗口的组件对象
const Electron = require('electron');
const App = Electron.app;
const BrowserWindow = Electron.BrowserWindow;
const path = require('path');//原生库path模块
const url = require('url');
const os = require("os");
const fs = require("fs");

const logger = require('../../core/Logger');//引入全局日志组件
const config = require('../../core/Config');//引入全局配置组件

const AppVar = require('./AppVar');
let appVar = AppVar.getAppVar();

const wallWindow = require('./window/WallWindow');
const controlWindow = require('./window/ControlWindow');
const previewWindow = require('./window/PreviewWindow');
const deviceInfoWindow = require('./window/DeviceInfoWindow');
const ReadmeWindow = require('./window/ReadmeWindow');
const AboutWindow = require('./window/AboutWindow');
const JsonEditorWindow = require('./window/JsonEditorWindow');

//系统静态文件目录

/* ↓路由功能开始↓ */


// 为了保证一个对全局windows对象的引用，就必须在方法体外声明变量
// 否则当方法执行完成时就会被JavaScript的垃圾回收机制清理
let wallWins = [], controlWin, previewWin, deviceInfoWin, ReadmeWin, AboutWin, JsonEditorWin;

/**
 * 返回全局wallWindow对象
 */
function getWallWindow(paramJson) {
    var res = true;
    if (wallWins.length > 0) {
        for (var x in wallWins) {
            var window = wallWins[x];
            try {
                window.show();
            } catch (e) {
                wallWins[x] = wallWindow.creat(x, paramJson);
            }
        }
    } else {
        wallWins = wallWindow.creat(paramJson);
        res = false;
    }
    return {result: res, win: wallWins};
}

function getControlWindow(isshow, paramJson) {
    var res = true;
    try {
        controlWin.webContents.send('ipc_window_control_cgi', isshow, paramJson);
        setTimeout(() => {
            if (controlWin.isVisible()) {
                controlWin.moveTop();
            } else {
                controlWin.show();
            }
        }, 300);
    } catch (e) {
        controlWin = controlWindow.creat(isshow, paramJson);
        getWallWindow();//如果是手动停止了, 那么这里需要判定一下桌面壁纸层是否启动.
        res = false;
    }
    return {result: res, win: controlWin};
}

function getPreviewWindow(deskId, paramJson) {
    var res = true;
    try {
        previewWin.webContents.send('ipc_window_preview_cgi', deskId, paramJson);
        setTimeout(() => {
            if (previewWin.isVisible()) {
                previewWin.moveTop();
            } else {
                previewWin.show();
            }
        }, 300);
    } catch (e) {
        previewWin = previewWindow.creat(deskId, paramJson);
        res = false;
    }
    return {result: res, win: previewWin};
}

function getDeviceInfoWindow(displayId, paramJson) {
    var res = true;
    try {
        deviceInfoWin.webContents.send('ipc_window_deviceinfo_cgi', displayId, paramJson);
        setTimeout(() => {
            let xy = deviceInfoWindow.calcPosition();
            deviceInfoWin.setPosition(xy.x, xy.y);
            if (deviceInfoWin.isVisible()) {
                deviceInfoWin.moveTop();
            } else {
                deviceInfoWin.show();
            }
        }, 300);
    } catch (e) {
        deviceInfoWin = deviceInfoWindow.creat(displayId, paramJson);
        res = false;
    }
    return {result: res, win: deviceInfoWin};
}

function getReadmeWindow(deskId, paramJson) {
    var res = true;
    try {
        ReadmeWin.webContents.send('ipc_window_readme_cgi', deskId, paramJson);
        setTimeout(() => {
            let xy = ReadmeWindow.calcPosition();
            ReadmeWin.setPosition(xy.x, xy.y);
            if (ReadmeWin.isVisible()) {
                ReadmeWin.moveTop();
            } else {
                ReadmeWin.show();
            }
        }, 300);
    } catch (e) {
        ReadmeWin = ReadmeWindow.creat(deskId, paramJson);
        res = false;
    }
    return {result: res, win: ReadmeWin};
}

function getAboutWindow(paramJson) {
    var res = true;
    try {
        AboutWin.webContents.send('ipc_window_about_cgi', paramJson);
        setTimeout(() => {
            if (AboutWin.isVisible()) {
                AboutWin.moveTop();
            } else {
                AboutWin.show();
            }
        }, 300);
    } catch (e) {
        AboutWin = AboutWindow.creat(paramJson);
        res = false;
    }
    return {result: res, win: AboutWin};
}

function getJsonEditorWindow(json) {
    var res = true;
    try {
        JsonEditorWin.webContents.send('ipc_window_jsoneditor_cgi', json);
        setTimeout(() => {
            let xy = JsonEditorWindow.calcPosition();
            JsonEditorWin.setPosition(xy.x, xy.y);
            if (JsonEditorWin.isVisible()) {
                JsonEditorWin.moveTop();
            } else {
                JsonEditorWin.show();
            }
        }, 300);
    } catch (e) {
        JsonEditorWin = JsonEditorWindow.creat(json);
        res = false;
    }
    return {result: res, win: JsonEditorWin};
}

/**
 * 关闭所有的窗口
 */
function closeAllWindows() {
    var allWindows = BrowserWindow.getAllWindows();
    allWindows.forEach((win) => {
        win.close();
    });
    JsonEditorWin = null;
    ReadmeWin = null;
    AboutWin = null;
    deviceInfoWin = null;
    previewWin = null;
    controlWin = null;
    wallWins = [];
}


const ipcMain = require('electron').ipcMain;//ipcMain进程对象

global.buffer = Buffer;
//修改主进程中appVar的值: 只能把改好的appVar传回来, 不能传键值对, 因为ipc通信会将对象自动转为json字符串, 所以无法分清对象和单一变量值.
ipc.on('change-appVar', function (event, newAppVar) {
    try {
        appVar = newAppVar;
        global.appVar = newAppVar;
        event.sender.send('change-appVar-response', true);
    } catch (e) {
        console.error(e);
        event.sender.send('change-appVar-response', false);
    }
});

//window 之内 转发指令, 限定最多 带 3 个参数
ipcMain.on('ipc_repeat', function (event, rIpcCmd, data, data2, data3) {
    event.sender.send(rIpcCmd, data, data2, data3);
});

//打开窗口 指令
ipcMain.on('ipc_window_open', function (event, winKey, data, paramJson) {
    if (winKey === 'preview') {
        getPreviewWindow(data, paramJson);
    } else if (winKey === 'deviceinfo') {
        getDeviceInfoWindow(data, paramJson);
    } else if (winKey === 'readme') {
        getReadmeWindow(data, paramJson);
    } else if (winKey === 'jsoneditor') {
        getJsonEditorWindow(data);
    } else if (winKey === 'about') {
        getAboutWindow(paramJson);
    }
});

//Resolver层调用[resolver 层只能在主进程调用]
ipcMain.on('ipc_resolver', function (event, resolverKey, data) {
    if (resolverKey === 'mail') {
        const MailResolver = require('../../resolver/MailResolver');
        event.sender.send('ipc_resolver_ret', MailResolver.sendMail(data));//传入一个对象
    } else if (resolverKey === 'archive') {
        const ArchiveResolver = require('../../resolver/ArchiveResolver')(data.output, (reb) => {
            event.sender.send('ipc_resolver_ret', reb);
        });
        ArchiveResolver.fromGlob(data.glob, data.name);//传入压缩正则和新名称.
    }
});

//更新包检测
ipcMain.on('ipc_update_check', function (event) {
    const autoUpdater = require('./AutoUpdater');
    autoUpdater.updateHandle(appVar);
});

module.exports = {
    getWallWindow,
    getControlWindow,
    getPreviewWindow,
    getDeviceInfoWindow,
    getReadmeWindow,
    getAboutWindow,
    getJsonEditorWindow,
    closeAllWindows,
};