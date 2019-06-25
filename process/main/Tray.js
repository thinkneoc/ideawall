const Electron = require('electron');
const App = Electron.app; // 核心应用承载模块
const Tray = Electron.Tray; // 系统托盘模块
const Menu = Electron.Menu; // 菜单模块
const MenuItem = Electron.MenuItem; // 菜单项模块
const Shell = Electron.shell;

const path = require('path');//原生库path模块
const url = require('url');
const os = require("os");
const fs = require("fs");

const logger = require('../../core/Logger');//引入全局日志组件
const config = require('../../core/Config');//引入全局配置组件

const helper = require('./MainProcessHelper');
const share = require('../../third/Share')();

const relative = '../../';


/**
 * 设置系统托盘
 */
function init(appVar) {
    let shareConfig = {
        url: appVar._siteurl,
        source: 'ideawall - 创意者桌面',
        title: 'ideawall - 创意者桌面. 重新定义桌面, 极致就是艺术.', // 标题，默认读取 document.title 或者 <meta name="title" content="share.js" />
        description: '我给你推荐了一个超酷的动态桌面壁纸软件, 快来试试吧~~ ',
        image: 'http://m.cdn.ideanote.16inet.com/blue-min-pretty.png', // 图片, 默认取网页中第一个img标签
    };

    let appTray = new Tray(path.join(appVar._staticpath, 'logo/blue-min-pretty@3x.png'));
    appTray.setToolTip('ideawall - 创意者桌面');//设置鼠标指针在托盘图标上悬停时显示的文本
    // appTray.setContextMenu(buildTrayMenu(appVar, shareConfig));//设置内容菜单, 这个的菜单一旦生成, 无法更改. 所以, 改用点击弹出上下文菜单的方式.
    // appTray.setTitle('创意者桌面');//在 macOS 中，设置显示在状态栏中托盘图标旁边的标题 (支持ANSI色彩), 一般用于制作状态栏歌词
    appTray.setPressedImage(path.join(appVar._staticpath, 'logo/blue-min-pretty@3x.png'));//在 macOS 中，设置image作为托盘图标被按下时显示的图标
    appTray.on('click', () => {//mac/win/linux
        appTray.popUpContextMenu(buildTrayMenu(appVar, shareConfig));
    });
    // appTray.on('double-click', () => {//mac/win

    // });
    appTray.on('right-click', () => {//mac/win

    });
    appTray.on('drop-files', () => {//mac

    });
    appTray.on('drop-text', () => {//mac

    });

    return appTray;
}

function buildTrayMenu(appVar, shareConfig) {
    // 注册应用全局菜单
    var template = [];
    template.push({label: 'ideawall - 创意者桌面', type: 'normal', enabled: false});
    template.push({type: 'separator'});
    template.push({
        label: '控制面板',
        type: 'normal',
        accelerator: 'Shift+CmdOrCtrl+C',
        click: function () {
            helper.getControlWindow(true, {tab: 'mydesk'});
        },
    });
    template.push({type: 'separator'});

    try {
        var displays = Electron.screen.getAllDisplays();
        const deviceDeskModel = require('../../model/DeviceDeskModel')();
        for (let x in displays) {
            let title = '';
            if (x == 0) {
                title = "主屏幕";
            } else {
                if (displays.length > 2) {
                    title = '扩展屏幕 ' + x;
                } else {
                    title = "扩展屏幕";
                }
            }
            let db_display = deviceDeskModel.getDisplayById(displays[x].id);
            if (!db_display) {
                template.push({
                    label: title,
                    submenu: [{
                        label: '新增设备',
                        type: 'normal',
                        enabled: false
                    }]
                });
                continue;
            }
            var dbd_desk = deviceDeskModel.getDesk(displays[x].id);
            if (!dbd_desk) {
                template.push({
                    label: title,
                    submenu: [{
                        label: '未启用桌面',
                        type: 'normal',
                        enabled: false
                    }]
                });
            } else {
                let subMenu = [];
                var ispause = db_display.api_pause == 2 ? '播放' : '暂停';
                var ismuted = db_display.api_muted == 2 ? '打开声音' : '静音';
                var ishide = db_display.api_hide == 2 ? '恢复显示' : '隐藏';
                subMenu.push({
                    label: ispause,
                    type: 'normal',
                    accelerator: 'CmdOrCtrl+Option+P',
                    click: function () {
                        deviceDeskModel.setApi(displays[x].id, 'pause', !(db_display.api_pause == 2));
                        try {
                            appVar._controlwindow.webContents.send('ipc_device_wall_api', 'pause', displays[x].id, !(db_display.api_pause == 2), true);
                        } catch (e) {
                            //...尽职
                        }
                    },
                });
                subMenu.push({
                    label: ismuted,
                    type: 'normal',
                    accelerator: 'CmdOrCtrl+Option+M',
                    click: function () {
                        deviceDeskModel.setApi(displays[x].id, 'muted', !(db_display.api_muted == 2));
                        try {
                            appVar._controlwindow.webContents.send('ipc_device_wall_api', 'muted', displays[x].id, !(db_display.api_muted == 2), true);
                        } catch (e) {
                            //...尽职
                        }
                    },
                });
                subMenu.push({
                    label: ishide,
                    type: 'normal',
                    accelerator: 'CmdOrCtrl+Option+H',
                    click: function () {
                        deviceDeskModel.setApi(displays[x].id, 'hide', !(db_display.api_hide == 2));
                        try {
                            appVar._controlwindow.webContents.send('ipc_device_wall_api', 'hide', displays[x].id, !(db_display.api_hide == 2), true);
                        } catch (e) {
                            //...尽职
                        }
                    },
                });
                template.push({
                    label: title,
                    submenu: subMenu
                });
            }
        }
        template.push({type: 'separator'});
    } catch (e) {
        //... screen 模块需要在 app.onReady 之后才能调用.
        console.error(e);
    }
    template.push({
        label: '偏好设置',
        type: 'normal',
        accelerator: 'CmdOrCtrl+,',
        click: function () {
            helper.getControlWindow(true, {tab: 'preference'});
        },
    });
    template.push({
        label: '桌面商店',
        type: 'normal',
        click: function () {
            helper.getControlWindow(true, {tab: 'deskstore'});
        },
    });
    template.push({
        label: '访问 ideawall 官网',
        type: 'normal',
        click: function () {
            Shell.openExternal(appVar._siteurl);
        },
    });
    template.push({
        label: '反馈与支持',
        type: 'normal',
        accelerator: 'Shift+CmdOrCtrl+B',
        click: function () {
            helper.getControlWindow(true, {tab: 'feedback'});
        },
    });
    template.push({
        label: '分享',
        submenu: [{
            label: '分享给 QQ 好友',
            click: function () {
                Shell.openExternal(share.getLink('qq', shareConfig));
            }
        }, {
            label: '分享到 QQ 空间',
            click: function () {
                Shell.openExternal(share.getLink('qzone', shareConfig));
            }
        }, {
            label: '分享到 新浪微博',
            click: function () {
                Shell.openExternal(share.getLink('weibo', shareConfig));
            }
        }, {
            label: '分享到 豆瓣',
            click: function () {
                Shell.openExternal(share.getLink('douban', shareConfig));
            }
        }, {
            label: '分享到 Linkedin',
            click: function () {
                Shell.openExternal(share.getLink('linkedin', shareConfig));
            }
        }, {
            type: 'separator'
        }, {
            label: '分享到 Facebook',
            click: function () {
                Shell.openExternal(share.getLink('facebook', shareConfig));
            }
        }, {
            label: '分享到 Twitter',
            click: function () {
                Shell.openExternal(share.getLink('twitter', shareConfig));
            }
        }, {
            label: '分享到 Google',
            click: function () {
                Shell.openExternal(share.getLink('google', shareConfig));
            }
        }]
    });
    template.push({
        label: '关于 ideawall',
        type: 'normal',
        click: function () {
            helper.getAboutWindow();
        },
    });
    template.push({type: 'separator'});
    template.push({
        label: '退出 ideawall',
        type: 'normal',
        accelerator: 'CmdOrCtrl+Q',
        click: function () {
            //关闭所有的窗口就行, 等待事件处理...
            helper.closeAllWindows();
        },
    });
    return Menu.buildFromTemplate(template);
}

module.exports = {
    init
};