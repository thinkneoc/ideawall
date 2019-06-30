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
    template.push({
        label: '控制面板',
        type: 'normal',
        accelerator: 'Shift+CmdOrCtrl+C',
        click: function () {
            helper.getControlWindow(true, {tab: 'mydesk'});
        },
    });
    template.push({type: 'separator'});
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
        label: '资源社区',
        type: 'normal',
        click: function () {
            helper.getControlWindow(true, {tab: 'resbbs'});
        },
    });
    return Menu.buildFromTemplate(template);
}


module.exports = {
    init
};