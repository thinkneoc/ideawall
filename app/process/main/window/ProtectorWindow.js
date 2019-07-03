const Electron = require('electron');

const path = require('path');//原生库path模块
const url = require('url');
const os = require("os");
const fs = require("fs");

const logger = require('../../../core/Logger');//引入全局日志组件
const config = require('../../../core/Config');//引入全局配置组件
const lang = require('../../../core/Lang')();
const AppVar = require('../../../process/main/AppVar');
let appVar = AppVar.getAppVar();

const relative = '../../../';

/**
 * 为 windows 创建壁纸层
 * @param {设备} display
 */
function createOne_win(display) {
    let xwindow = createOne_macos(display);
    const electronWallpaper = require('electron-wallpaper');
    electronWallpaper.attachWindow(xwindow);
    return xwindow;
}

/**
 * 为 macos 创建壁纸层
 * @param {设备} display
 */
function createOne_macos(display) {
    let {width, height} = display.size;//获得当前显示器最大高度. 注意这里不应该是workAreaSize(工作区范围尺寸), 而应该是整体尺寸
    let {x, y} = display.bounds;//偏移, 如果 x,y 均为 0, 则表示当前激活的主屏幕.
    return new Electron.BrowserWindow({
        frame: false, //隐藏原生窗口边框
        useContentSize: true,
        // titleBarStyle: 'hiddenInset',
        // vibrancy: 'appearance-based',//窗口是否使用 vibrancy 动态效果, 仅 macOS 中有效. 可以为 appearance-based, light, dark, titlebar, selection, menu, popover, sidebar, medium-light 或 ultra-dark. 请注意，结合一个 vibrancy 值使用 frame: false ，需要确保titleBarStyle为一个非默认值。
        // backgroundColor: '#80FFFFFF',
        zoomToPageWidth: false,//单击工具栏上的绿色信号灯按钮或单击 窗口>缩放 菜单项时的行为, 仅macOS中有效. 如果为 true, 窗口将放大到网页的本身宽度, false 将使其缩放到屏幕的宽度。 这也会影响直接调用 maximize() 时的行为。 默认值为 false.
        show: false,//创建时候是否显示
        center: true,
        x: x,
        y: y,
        width: width,
        height: height,
        minWidth: width,
        minHeight: height,
        maxWidth: width,
        maxHeight: height,
        resizable: false,
        movable: false,
        minimizable: false,
        maximizable: false,
        title: '',
        opacity: 1.0,//设置窗口初始的不透明度, 介于 0.0 (完全透明) 和 1.0 (完全不透明) 之间。仅支持 Windows 和 macOS 。
        darkTheme: false,//强制窗口使用 dark 主题, 只在一些拥有 GTK+3 桌面环境上有效. 默认值为 false.
        acceptFirstMouse: true,//是否允许单击web view来激活窗口
        disableAutoHideCursor: true,//当 typing 时是否隐藏鼠标.默认 false
        focusable: true,//是否可聚焦
        transparent: true,//开启窗口透明
        hasShadow: true,//窗口是否有阴影。只在 OS X 上有效. 默认为 true。这个打开会造成部分盒子阴影, 体验较差.
        alwaysOnTop: true,//窗口置顶
        thickFrame: false,//对 Windows 上的无框窗口使用WS_THICKFRAME 样式，会增加标准窗口框架。 设置为 false 时将移除窗口的阴影和动画. 默认值为 true。
        fullscreen: true,
        simpleFullscreen: true,// 在 macOS 上使用 pre-Lion 全屏. 默认为false, 具体效果就是高度覆盖dock栏. 必须开启fullscreen才有效.
        skipTaskbar: true, //是否跳过在任务栏中显示窗口. 默认值为false.
        enableLargerThanScreen: true,//是否允许改变窗口的大小时, 大于屏幕的尺寸. 默认值为false.
        autoHideMenuBar: true,//除非点击 Alt，否则隐藏菜单栏.默认为 false。
        webPreferences: { //用于解决not allowed to load local resource的问题
            devTools: appVar._debug,
            webSecurity: false,//当设置为 false, 它将禁用同源策略 (通常用来测试网站), 如果此选项不是由开发者设置的，还会把 allowRunningInsecureContent设置为 true. 默认值为 true。
            nodeIntegration: false, //全局禁用nodejs
            nodeIntegrationInWorker: true,//启用多线程
            preload: appVar._preloadscript, //提前加载, 通过这个文件调用nodejs和electron语法糖即可.
            scrollBounce: true, //在 macOS 启用弹力动画 (橡皮筋) 效果. 默认值为 false
            enableRemoteModule: true,//是否启用 Remote 模块。 默认值为 true。
            zoomFactor: 1.0, //页面的默认缩放系数, 3.0 表示 300%. 默认值为 1.0.
            textAreasAreResizable: true, //让 TextArea 元素可以调整大小. 默认值为 true.
            backgroundThrottling: false,//是否在页面成为背景时限制动画和计时器。 这也会影响到 Page Visibility API. 默认值为 true。
            // offscreen: true,//是否绘制和渲染可视区域外的窗口. 默认值为 false
        }
    });
}

function createOne(display, paramJson) {
    // 创建浏览器窗口。
    let xwindow;
    if (appVar._platform === 'darwin') {
        xwindow = createOne_macos(display);
    } else {
        xwindow = createOne_win(display);
    }

    // 旁加载应用的 index.html。
    xwindow.loadURL(url.format({
        pathname: path.join(__dirname, relative + "./view/components/Protector.html"),//把设备 id传过去, 方便处理.
        protocol: 'file:',
        slashes: true
    }) + "?windowKey=_protectorwindow&windowId=" + xwindow.id + "&displayId=" + display.id + lang.json2UrlParams(paramJson));

    // 引入主入口界面
    if (appVar._debug) {
        // 打开开发者工具
        xwindow.webContents.openDevTools({detach: true});//TODO 改为调试模式配置项
    } else {
        xwindow.webContents.closeDevTools();
        xwindow.webContents.on('devtools-opened', () => {
            xwindow.webContents.closeDevTools();
        });
        xwindow.webContents.on('devtools-focused', () => {
            xwindow.webContents.closeDevTools();
        });
    }

    // 当窗口关闭时触发
    xwindow.on('closed', function () {
        logger.info("[Process][MainProcessHelper][_ProtectorWindow_.on._closed_]屏保窗口: " + display.id + " 关闭");

        //将全局xwindow置为null
        xwindow = null;
    });

    xwindow.once('ready-to-show', () => {
        xwindow.showInactive();//显示, 但不聚焦.


        // //窗体透明度渐显
        // var opacityIndex = setInterval(()=>{
        //     if(xwindow.getOpacity() >= 1){
        //         clearInterval(opacityIndex);
        //     }
        //     xwindow.setOpacity(xwindow.getOpacity() + 0.2);
        // }, 100);
    });
    return xwindow;
}

function creat(displayId, paramJson) {
    logger.info("[Process][MainProcessHelper][ProtectorWindow]初始化屏保窗口组");
    //拿一下主屏幕宽高, 可能要用到
    AppVar.setAppVar({
        _primarydisplay: Electron.screen.getPrimaryDisplay(),
        _displays: Electron.screen.getAllDisplays(),
    });

    let protectorwindows = [], _protectorwindows = {};
    let displays = Electron.screen.getAllDisplays();//拿到所有的监视器, 启动之后新加的另外处理
    for (let i in displays) {
        let display = displays[i];
        if (displayId && displayId + '' !== display.id + '') {
            break;
        }
        var xwindow = createOne(display, paramJson);
        protectorwindows.push(xwindow);
        _protectorwindows[display.id] = {display: display, window: xwindow};
    }
    AppVar.setAppVar({
        _protectorwindows: _protectorwindows,
    });
    return protectorwindows;
}

module.exports = {
    creat
};