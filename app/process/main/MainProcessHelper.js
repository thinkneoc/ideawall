//用于创建原生浏览器窗口的组件对象
const Electron = require('electron');
const App = Electron.app;
const BrowserWindow = Electron.BrowserWindow;
const path = require('path'); //原生库path模块
const url = require('url');
const os = require("os");
const fs = require("fs");

const logger = require('../../core/Logger'); //引入全局日志组件
const config = require('../../core/Config'); //引入全局配置组件

const AppVar = require('./AppVar');
let appVar = AppVar.getAppVar();

const wallWindow = require('./window/WallWindow');
const protectorWindow = require('./window/ProtectorWindow');
const controlWindow = require('./window/ControlWindow');
const previewWindow = require('./window/PreviewWindow');
const deviceInfoWindow = require('./window/DeviceInfoWindow');
const ReadmeWindow = require('./window/ReadmeWindow');
const AboutWindow = require('./window/AboutWindow');
const XBrowserWindow = require('./window/XBrowserWindow');
const JsonEditorWindow = require('./window/JsonEditorWindow');

//系统静态文件目录

/* ↓路由功能开始↓ */


// 为了保证一个对全局windows对象的引用，就必须在方法体外声明变量
// 否则当方法执行完成时就会被JavaScript的垃圾回收机制清理
let wallWins = [], protectorWins = [],
    controlWin, previewWin, browserWin, deviceInfoWin, ReadmeWin, AboutWin, JsonEditorWin;

/**
 * 返回全局protectorWindow对象
 */
function getProtectorWindow(paramJson) {
    var res = true;
    if (protectorWins.length > 0) {
        for (var x in protectorWins) {
            var window = protectorWins[x];
            try {
                window.show();
            } catch (e) {
                protectorWins[x] = protectorWindow.creat(x, paramJson);
                protectorWins[x].webContents.on('new-window', (event, url, frameName, disposition, options) => {
                    event.preventDefault();
                    console.log(url);
                    event.newGuest = getBrowserWindow(url).win;
                });
            }
        }
    } else {
        protectorWins = protectorWindow.creat(paramJson);
        for (var x in protectorWins) {
            protectorWins[x].webContents.on('new-window', (event, url, frameName, disposition, options) => {
                event.preventDefault();
                console.log(url);
                event.newGuest = getBrowserWindow(url).win;
            });
        }
        res = false;
    }
    return {
        result: res,
        win: protectorWins
    };
}

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
                wallWins[x].webContents.on('new-window', (event, url, frameName, disposition, options) => {
                    event.preventDefault();
                    console.log(url);
                    event.newGuest = getBrowserWindow(url).win;
                });
            }
        }
    } else {
        wallWins = wallWindow.creat(paramJson);
        for (var x in wallWins) {
            wallWins[x].webContents.on('new-window', (event, url, frameName, disposition, options) => {
                event.preventDefault();
                console.log(url);
                event.newGuest = getBrowserWindow(url).win;
            });
        }
        res = false;
    }
    return {
        result: res,
        win: wallWins
    };
}

function getControlWindow(isshow, paramJson) {
    var res = true;
    try {
        controlWin.webContents.send('ipc_window_control_cgi', isshow, paramJson);
        setTimeout(() => {
            controlWin.show();
        }, 300);
    } catch (e) {
        controlWin = controlWindow.creat(isshow, paramJson);
        controlWin.webContents.on('new-window', (event, url, frameName, disposition, options) => {
            event.preventDefault();
            console.log(url);
            event.newGuest = getBrowserWindow(url).win;
        });
        getWallWindow(); //如果是手动停止了, 那么这里需要判定一下桌面壁纸层是否启动.
        res = false;
    }
    return {
        result: res,
        win: controlWin
    };
}

function getBrowserWindow(link, paramJson) {
    var res = true;
    try {
        browserWin.webContents.send('ipc_window_browser_cgi', link, paramJson);
        setTimeout(() => {
            browserWin.show();
        }, 300);
    } catch (e) {
        browserWin = XBrowserWindow.creat(link, paramJson);
        browserWin.webContents.on('new-window', (event, url, frameName, disposition, options) => {
            event.preventDefault();
            console.log(url);
            event.newGuest = getBrowserWindow(url).win;
        });
        res = false;
    }
    return {
        result: res,
        win: browserWin
    };
}

function getPreviewWindow(deskId, paramJson) {
    var res = true;
    try {
        previewWin.webContents.send('ipc_window_preview_cgi', deskId, paramJson);
        setTimeout(() => {
            previewWin.show();
        }, 300);
    } catch (e) {
        previewWin = previewWindow.creat(deskId, paramJson);
        previewWin.webContents.on('new-window', (event, url, frameName, disposition, options) => {
            event.preventDefault();
            console.log(url);
            event.newGuest = getBrowserWindow(url).win;
        });
        res = false;
    }
    return {
        result: res,
        win: previewWin
    };
}

function getDeviceInfoWindow(displayId, paramJson) {
    var res = true;
    try {
        deviceInfoWin.webContents.send('ipc_window_deviceinfo_cgi', displayId, paramJson);
        setTimeout(() => {
            let xy = deviceInfoWindow.calcPosition();
            deviceInfoWin.setPosition(xy.x, xy.y);
            deviceInfoWin.show();
        }, 300);
    } catch (e) {
        deviceInfoWin = deviceInfoWindow.creat(displayId, paramJson);
        deviceInfoWin.webContents.on('new-window', (event, url, frameName, disposition, options) => {
            event.preventDefault();
            console.log(url);
            event.newGuest = getBrowserWindow(url).win;
        });
        res = false;
    }
    return {
        result: res,
        win: deviceInfoWin
    };
}

function getReadmeWindow(deskId, paramJson) {
    var res = true;
    try {
        ReadmeWin.webContents.send('ipc_window_readme_cgi', deskId, paramJson);
        setTimeout(() => {
            let xy = ReadmeWindow.calcPosition();
            ReadmeWin.setPosition(xy.x, xy.y);
            ReadmeWin.show();
        }, 300);
    } catch (e) {
        ReadmeWin = ReadmeWindow.creat(deskId, paramJson);
        ReadmeWin.webContents.on('new-window', (event, url, frameName, disposition, options) => {
            event.preventDefault();
            console.log(url);
            event.newGuest = getBrowserWindow(url).win;
        });
        res = false;
    }
    return {
        result: res,
        win: ReadmeWin
    };
}

function getAboutWindow(paramJson) {
    var res = true;
    try {
        AboutWin.webContents.send('ipc_window_about_cgi', paramJson);
        setTimeout(() => {
            AboutWin.show();
        }, 300);
    } catch (e) {
        AboutWin = AboutWindow.creat(paramJson);
        AboutWin.webContents.on('new-window', (event, url, frameName, disposition, options) => {
            event.preventDefault();
            console.log(url);
            event.newGuest = getBrowserWindow(url).win;
        });
        res = false;
    }
    return {
        result: res,
        win: AboutWin
    };
}

function getJsonEditorWindow(json) {
    var res = true;
    try {
        JsonEditorWin.webContents.send('ipc_window_jsoneditor_cgi', json);
        setTimeout(() => {
            let xy = JsonEditorWindow.calcPosition();
            JsonEditorWin.setPosition(xy.x, xy.y);
            JsonEditorWin.show();
        }, 300);
    } catch (e) {
        JsonEditorWin = JsonEditorWindow.creat(json);
        JsonEditorWin.webContents.on('new-window', (event, url, frameName, disposition, options) => {
            event.preventDefault();
            console.log(url);
            event.newGuest = getBrowserWindow(url).win;
        });
        res = false;
    }
    return {
        result: res,
        win: JsonEditorWin
    };
}

/**
 * 关闭所有的窗口
 */
function closeAllWindows() {
    logger.info("关闭所有窗口");
    controlWin !== null ? controlWin.setClosable(true) : '';
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
    browserWin = null;
    wallWins = [];
}

const ipcMain = require('electron').ipcMain; //ipcMain进程对象

function sendCommandToAllWindows(cmd, data) {
    try {
        var allWindows = BrowserWindow.getAllWindows();
        allWindows.forEach((win) => {
            win.webContents.send(cmd, data);
        });
    } catch (e) {
        //...
    }
}

//锁定控制面板/解除锁定
ipcMain.on('ipc_lock', function (event, swicth) {
    controlWin.setClosable(swicth);
    sendCommandToAllWindows('ipc_lock_req', swicth);
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
    } else if (winKey === 'control') {
        getControlWindow(data, paramJson);
    } else if (winKey === 'browser') {
        getBrowserWindow(data, paramJson);
    }
});

//Resolver层调用[resolver 层只能在主进程调用]
ipcMain.on('ipc_resolver', function (event, resolverKey, data) {
    if (resolverKey === 'mail') {
        const MailResolver = require('../../resolver/MailResolver');
        event.sender.send('ipc_resolver_ret', MailResolver.sendMail(data)); //传入一个对象
    } else if (resolverKey === 'archive') {
        const ArchiveResolver = require('../../resolver/ArchiveResolver')(data.output, (reb) => {
            event.sender.send('ipc_resolver_ret', reb);
        });
        ArchiveResolver.fromGlob(data.glob, data.name); //传入压缩正则和新名称.
    } else if (resolverKey === 'unzip') {
        const unzip = require('unzip');
        fs.createReadStream(data.zipPath).pipe(unzip.Extract({
            path: data.outPath
        }));
    }
});

//更新包检测
ipcMain.on('ipc_update_check', function (event) {
    const autoUpdater = require('./AutoUpdater');
    autoUpdater.updateHandle(appVar);
});

//隐藏 dock
ipcMain.on('ipc_preference_dock', function (event, nval) {
    if (nval) {
        App.dock.hide();
    } else {
        App.dock.show();
    }
});

module.exports = {
    getWallWindow,
    getProtectorWindow,
    getControlWindow,
    getPreviewWindow,
    getDeviceInfoWindow,
    getReadmeWindow,
    getAboutWindow,
    getBrowserWindow,
    getJsonEditorWindow,
    closeAllWindows,
};