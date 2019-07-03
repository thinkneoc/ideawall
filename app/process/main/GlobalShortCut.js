const Electron = require('electron');
const GlobalShortcut = Electron.globalShortcut; // 全局快捷键模块

const path = require('path');//原生库path模块
const url = require('url');
const os = require("os");
const fs = require("fs");

const logger = require('../../core/Logger');//引入全局日志组件
const config = require('../../core/Config');//引入全局配置组件

const relative = '../../';

/**
 * 添加全局快捷键
 * 在 Linux 和 Windows 上, Command 键没有任何效果, 所以使用 CommandOrControl表述, macOS 是 Command ，在 Linux 和 Windows 上是Control。
 * 使用 Alt 代替Option. Option 键只在 macOS 系统上存在, 而 Alt 键在任何系统上都有效.
 * Super键是指 Windows 和 Linux 系统上的 Windows 键，但在 macOS 里为 Cmd 键.
 *
 * 可用的快捷键:
 *      Command (缩写为Cmd)
 *      Control (缩写为Ctrl)
 *      CommandOrControl (缩写为 CmdOrCtrl)
 *      Alt
 *      Option
 *      AltGr
 *      Shift
 *      Super
 *
 * 可用的普通按键:
 *      0 to 9
 *      A to Z
 *      F1 to F24
 *      类似~, !, @, #, $的标点符号
 *      Plus
 *      Space
 *      Tab
 *      Backspace
 *      Delete
 *      Insert
 *      Return (等同于 Enter)
 *      Up, Down, Left and Right
 *      Home 和 End
 *      PageUp 和 PageDown
 *      Escape (缩写为 Esc)
 *      VolumeUp, VolumeDown 和 VolumeMute
 *      MediaNextTrack、MediaPreviousTrack、MediaStop 和 MediaPlayPause
 *      PrintScreen
 */
function init(appVar) {
    // 注册打开控制台的快捷键
    GlobalShortcut.register('CmdOrCtrl+Option+I', function () {
        if (appVar._debug) {
            let win = Electron.BrowserWindow.getFocusedWindow();
            if (win) {
                if (win.webContents.isDevToolsOpened()) {
                    win.webContents.closeDevTools();
                } else {
                    win.webContents.openDevTools({detach: true});
                }
            }
        }
    });
    // 注册Ctrl+r的全局事件快捷键: 用于debug模式下, 刷新二级页面.
    GlobalShortcut.register('CmdOrCtrl+R', function () {
        if (appVar._debug) {
            let win = Electron.BrowserWindow.getFocusedWindow();
            if (win && appVar._ready._render) {
                let appRenderInit = require('../renderer/app');//执行应用渲染引擎.
                async.aop(false, function () {
                    appRenderInit();
                    return true;
                }, function () {
                    win.webContents.executeJavaScript('\
                        mainProcess_listener_shortcut_ctrl7r();\
                    ', true, function (result) {
                        console.log("mainProcess_listener_shortcut_ctrl7r通信结果: " + result);
                        return true;
                    });
                }, '[主进程] ');
            }
        }
    });
    // 注册Ctrl+Shift+r的全局事件快捷键: 用于debug模式下, 刷新顶级页面.
    GlobalShortcut.register('CmdOrCtrl+Shift+R', function () {
        if (appVar._debug) {
            let win = Electron.BrowserWindow.getFocusedWindow();
            if (win && appVar._ready._render) {
                let appRenderInit = require('../renderer/app');//执行应用渲染引擎.
                async.aop(false, function () {
                    appRenderInit();
                    return true;
                }, function () {
                    win.webContents.executeJavaScript('\
                        mainProcess_listener_shortcut_ctrlshift7r();\
                    ', true, function (result) {
                        console.log("mainProcess_listener_shortcut_ctrlshift7r通信结果: " + result);
                        return true;
                    });
                }, '[主进程] ');
            }
        }
    });
    // 注册Ctrl+s的全局事件快捷键
    GlobalShortcut.register('CmdOrCtrl+S', function () {
        let win = Electron.BrowserWindow.getFocusedWindow();
        if (win && appVar._ready._render) {
            win.webContents.executeJavaScript('\
                mainProcess_listener_shortcut_ctrl7s();\
            ', true, function (result) {
                console.log("mainProcess_listener_shortcut_ctrl7s通信结果: " + result);
            });
        }
    });

    // 注册Tab的全局事件快捷键
    GlobalShortcut.register('Tab', function () {
        let win = Electron.BrowserWindow.getFocusedWindow();
        if (win && appVar._ready._render) {
            win.webContents.executeJavaScript('\
                mainProcess_listener_shortcut_tab();\
            ', true, function (result) {
                console.log("mainProcess_listener_shortcut_tab通信结果: " + result);
            });
        }
    });
}

module.exports = {
    init
};