const Electron = require('electron');
const Shell = Electron.shell;
const Notification = Electron.Notification;
const logger = require('./Logger');//日志模块
const config = require('./Config');//配置模块

/**
 * 显示一个系统原生通知信息
 *
 * 为了在 macOS 上使用额外的通知按钮, 您的应用程序必须符合以下标准。
 * @param option
 * @param callback
 */
function notifiy(option, callback) {
    option = {
        title: option.title,//String 通知的标题, 将在通知窗口的顶部显示.
        subtitle: option.subtitle,//String (可选) 通知的副标题, 显示在标题下面。 macOS
        body: option.body,//String 通知的正文文本, 将显示在标题或副标题下面.
        silent: option.silent,//Boolean(可选) 在显示通知时是否发出系统提示音。
        icon: option.icon ? option.icon : '../static/logo/blue-min-pretty.png',//(String | NativeImage ) (可选) 用于在该通知上显示的图标。
        hasReply: option.hasReply,//Boolean (可选) 是否在通知中添加一个答复选项. macOS
        replyPlaceholder: option.replyPlaceholder,//String(可选) 答复输入框中的占位符。 macOS
        actions: option.actions,//NotificationAction[] (可选) macOS - 要添加到通知中的操作 请阅读 NotificationAction文档来了解可用的操作和限制。
        sound: option.sound, //String(可选) 显示通知时播放的声音文件的名称。 macOS
        closeButtonText: option.closeButtonText,// String(可选) macOS - 自定义的警告框关闭按钮文字。如果该字符串为空，那么将使用本地化的默认文本。
    };
    // 创建通知并保存
    let hhwNotication = new Notification(option);
    hhwNotication.show();

    hhwNotication.on('show', (event) => {
        callback('show', event, option);
    });

    hhwNotication.on('click', (event) => {
        callback('click', event, option);
    });

    hhwNotication.on('close', (event) => {
        callback('close', event, option);
    });

    hhwNotication.on('reply', (event, reply) => {
        callback('reply', event, option, reply);
    });

    hhwNotication.on('action', (event, index) => {
        callback('action', event, option, index);
    });
}

//系统更新通知消息
function notifyUpdater() {
    notifiy({
        title: 'ideawall 更新提醒',
        subtitle: '',
        body: '检测到新版本, 点击前往下载',
        silent: false,
        actions: [
            {
                type: 'button',
                text: '前往下载',
            },
            {
                type: 'button',
                text: '稍后提醒',
            }
        ]
    }, (cmd, e, p) => {
        if (cmd === 'click' || (cmd === 'action' && p === 0)) {
            Shell.openExternal(appVar._updatepageurl);
        }
    });
}

//系统更新完成通知重启消息
function notifyUpdated(subtitle, callback) {
    notifiy({
        title: 'ideawall 更新提醒',
        subtitle: subtitle,
        body: '新的更新已为您准备妥当, 点击重启 ideawall 以体验全新版本.',
        silent: false,
        actions: [
            {
                type: 'button',
                text: '重启 ideawall',
            },
            {
                type: 'button',
                text: '稍后处理',
            }
        ]
    }, (cmd, e, p) => {
        if (cmd === 'click' || (cmd === 'action' && p === 0)) {
            callback();
        }
    });
}

module.exports = {
    notifiy,
    notifyUpdater,
    notifyUpdated,
};
