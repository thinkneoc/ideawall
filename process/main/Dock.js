const Electron = require('electron');
const App = Electron.app; // 核心应用承载模块
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

function init(appVar) {
    if (process.platform === 'darwin') {
        const dockMenu = buildDockMenu(appVar);
        App.dock.setMenu(dockMenu);
    }
}

function buildDockMenu(appVar) {
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
            helper.exit();
        },
    });
    return Menu.buildFromTemplate(template);
}


module.exports = {
    init
};