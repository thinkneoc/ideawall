const Electron = require('electron');
const App = Electron.app;
const IpcMain = Electron.ipcMain; // IPC通信模块
const Dialog = Electron.dialog;
const Shell = Electron.shell;
const {autoUpdater} = require('electron-updater');
const notification = require('../../core/Notification');
const logger = require('../../core/Logger');//引入全局日志组件
const config = require('../../core/Config');//引入全局配置组件

let canUpdate = false;

/**
 * 检测更新，在你想要检查更新的时候执行
 */
function updateHandle(appVar, callback) {
    canUpdate = false;
    let message = {
        error: '检查更新出错',
        checking: '正在检查更新……',
        updateAva: '检测到新版本，正在下载……',
        downloading: '安装包已下载 ',
        downloaded: '新的更新已为您准备妥当, 重启 ideawall 以体验全新版本.',
        updateNotAva: '现在使用的就是最新版本，不用更新',
    };
    const feed = appVar._updateurl;
    const feedPage = appVar._updatepageurl;

    autoUpdater.setFeedURL(feed);

    //自动更新模块异常
    autoUpdater.on('error', function (ev, err) {
        if (process.platform !== 'darwin') {
            appVar._updateavaava = false;
        }
        logger.info('There was a problem updating the application');
        logger.error('Error in auto-updater.' + feed + err + '|' + ev);
        var obj = {
            code: 'error',
            tip: message.error,
        };
        sendUpdateMessage(obj, appVar, callback);

    });

    //正在检测更新
    autoUpdater.on('checking-for-update', function () {
        appVar._updateavaava = false;
        logger.info('Checking for update...');
        var obj = {
            code: 'checking',
            tip: message.checking,
        };
        sendUpdateMessage(obj, appVar, callback);
    });

    //检测到可用更新包
    autoUpdater.on('update-available', function (info) {
        appVar._updateavaava = true;
        logger.info('Update available.' + info);
        var obj = {
            code: 'updateAva',
            tip: message.updateAva,
        };
        sendUpdateMessage(obj, appVar, callback);

        //强制更新策略: 可以稍后处理, 但不允许打开控制面板, 打开就弹出提示框, 要求更新
        //苹果需要证书才能正常热更新, 所以, 如果是水果系统, 直接提示是否更新, 然后打开更新网页.
        if (process.platform === 'darwin') {
            //系统通知消息
            notification.notifyUpdater();

            //控制面板对话消息
            try {
                appVar._controlwindow.show();
                const dialogOpts = {
                    type: 'info',
                    buttons: ['前往下载'],
                    title: 'ideawall 更新提醒',
                    message: info,
                    detail: '新的更新已为您准备妥当, 下载 ideawall 以体验全新版本.'
                };

                Dialog.showMessageBox(appVar._controlwindow, dialogOpts, (response) => {
                    if (response === 0) Shell.openExternal(feedPage);
                });
            } catch (e) {
                //...
            }
        }
    });

    //未检测到可用更新包
    autoUpdater.on('update-not-available', function (info) {
        appVar._updateavaava = false;
        logger.info('Update not available.');
        var obj = {
            code: 'updateNotAva',
            tip: message.updateNotAva,
        };
        sendUpdateMessage(obj, appVar, callback);
    });

    //更新包下载进度事件 
    autoUpdater.on('download-progress', function (progress) {
        appVar._updateavaava = true;
        logger.info('Download progress...' + progress.percent);
        var obj = {
            code: 'downloading',
            tip: message.downloading + progress.percent,
            perc: progress.percent,
        };
        sendUpdateMessage(obj, appVar, callback);
    });

    //更新包下载完成事件
    autoUpdater.on('update-downloaded', function (event, releaseNotes, releaseName, releaseDate, updateUrl, quitAndUpdate) {
        logger.info('update downloaded...');
        appVar._updateavaava = false;
        canUpdate = true;
        var obj = {
            code: 'downloaded',
            tip: message.downloaded,
        };
        sendUpdateMessage(obj, appVar, callback);

        //ipc 通信指令监控
        IpcMain.removeAllListeners('ipc_app_update_nowdo');
        IpcMain.on('ipc_app_update_nowdo', (e, arg) => {
            //some code here to handle event     
            autoUpdater.quitAndInstall();//退出并安装重启
        });

        //系统通知消息
        notification.notifyUpdated(releaseName, () => {
            autoUpdater.quitAndInstall();
        });

        //控制面板对话消息
        try {
            appVar._controlwindow.show();
            const dialogOpts = {
                type: 'info',
                buttons: ['重启 ideawall', '稍后处理'],
                title: 'ideawall 更新提示',
                message: process.platform === 'win32' ? releaseNotes : releaseName,
                detail: '新的更新已为您准备妥当, 重启 ideawall 以体验全新版本.'
            };

            Dialog.showMessageBox(appVar._controlwindow, dialogOpts, (response) => {
                if (response === 0) autoUpdater.quitAndInstall();
            });
        } catch (e) {
            //...
        }
    });

    //执行自动更新检查
    autoUpdater.checkForUpdates();
}

function updateExec() {
    if (canUpdate) {
        autoUpdater.quitAndInstall();//退出并安装重启
        canUpdate = false;
    }
}

/**
 * 通过main进程发送事件给renderer进程，提示更新信息
 *
 * @param obj
 * @param appVar
 * @param callback
 */
function sendUpdateMessage(obj, appVar, callback) {
    if (typeof callback === 'function') {
        callback(obj);
    }
    try {
        appVar._controlwindow.webContents.send('ipc_app_update_ret', obj);
        if (obj.code === 'downloading') {
            appVar._controlwindow.setProgressBar(obj.perc / 100);
        }
    } catch (e) {
        //...
    }
}


module.exports = {
    updateHandle,
    updateExec
};

