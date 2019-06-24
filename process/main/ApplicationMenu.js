const Electron = require('electron');
const Menu = Electron.Menu; // 菜单模块
const MenuItem = Electron.MenuItem; // 菜单项模块

const path = require('path');//原生库path模块
const url = require('url');
const os = require("os");
const fs = require("fs");

const logger = require('../../core/Logger');//引入全局日志组件
const config = require('../../core/Config');//引入全局配置组件

const relative = '../../';

/**
 * 添加全局菜单
 */
function init(appVar) {
    // 注册应用全局菜单
    var template = [{
        label: '编辑',
        submenu: [{
            label: '撤销',
            accelerator: 'CmdOrCtrl+Z',
            role: 'undo'
        }, {
            label: '重做',
            accelerator: 'Shift+CmdOrCtrl+Z',
            role: 'redo'
        }, {
            type: 'separator'
        }, {
            label: '复制',
            accelerator: 'CmdOrCtrl+C',
            role: 'copy'
        }, {
            label: '粘贴',
            accelerator: 'CmdOrCtrl+V',
            role: 'paste'
        }]
    }, {
        label: '帮助',
        role: 'help',
        submenu: [{
            label: '学习更多',
            click: function () {
                Electron.shell.openExternal('http://electron.atom.io')
            }
        }]
    }];
    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

module.exports = {
    init
};