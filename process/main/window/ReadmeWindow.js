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

let xwindow;

function creat(deskId, paramJson) {
    logger.info("[Process][MainProcessHelper][ReadmeWindow]初始化桌面预览窗口");
    let xy = calcPosition();
    // 创建浏览器窗口。
    xwindow = new Electron.BrowserWindow({
        parent: appVar._controlwindow,
        frame: true, //隐藏原生窗口边框
        useContentSize: true,
        zoomToPageWidth: false,//单击工具栏上的绿色信号灯按钮或单击 窗口>缩放 菜单项时的行为, 仅macOS中有效. 如果为 true, 窗口将放大到网页的本身宽度, false 将使其缩放到屏幕的宽度。 这也会影响直接调用 maximize() 时的行为。 默认值为 false.
        backgroundColor: '#80FFFFFF',
        show: false,//创建时候是否显示
        center: true,
        x: xy.x,
        y: xy.y,
        width: xy.size.width,
        height: xy.size.height,
        minWidth: xy.size.width,
        minHeight: xy.size.height,
        resizable: true,
        movable: true,
        minimizable: true,
        maximizable: true,
        opacity: 1.0,//设置窗口初始的不透明度, 介于 0.0 (完全透明) 和 1.0 (完全不透明) 之间。仅支持 Windows 和 macOS 。
        darkTheme: false,//强制窗口使用 dark 主题, 只在一些拥有 GTK+3 桌面环境上有效. 默认值为 false.
        acceptFirstMouse: true,//是否允许单击web view来激活窗口
        disableAutoHideCursor: true,//当 typing 时是否隐藏鼠标.默认 false
        focusable: true,//是否可聚焦
        transparent: false,//开启窗口透明
        hasShadow: true,//窗口是否有阴影。只在 OS X 上有效. 默认为 true。这个打开会造成部分盒子阴影, 体验较差.
        skipTaskbar: false, //是否跳过在任务栏中显示窗口. 默认值为false.
        enableLargerThanScreen: false,//是否允许改变窗口的大小时, 大于屏幕的尺寸. 默认值为false.
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
            textAreasAreResizable: false, //让 TextArea 元素可以调整大小. 默认值为 true.
            backgroundThrottling: false,//是否在页面成为背景时限制动画和计时器。 这也会影响到 Page Visibility API. 默认值为 true。
        }
    });


    // 旁加载应用的 index.html。
    xwindow.loadURL(url.format({
        pathname: path.join(__dirname, relative + "./view/components/Readme.html"),
        protocol: 'file:',
        slashes: true
    }) + "?windowKey=_readmewindow&windowId=" + xwindow.id + "&deskId=" + deskId + lang.json2UrlParams(paramJson));

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
        logger.info("[Process][MainProcessHelper][_ReadmeWindow_.on._closed_]桌面预览窗口关闭");

        //将全局xwindow置为null
        xwindow = null;
    });

    xwindow.once('ready-to-show', () => {
        xwindow.show();

        // //窗体透明度渐显
        // var opacityIndex = setInterval(()=>{
        //     if(xwindow.getOpacity() >= 1){
        //         clearInterval(opacityIndex);
        //     }
        //     xwindow.setOpacity(xwindow.getOpacity() + 0.2);
        // }, 100);
    });
    AppVar.setAppVar({
        _readmewindow: xwindow,
    });
    return xwindow;
}

/**
 * 计算窗口位置
 */
function calcPosition() {
    let cp = appVar._controlwindow.getPosition();
    let cs = appVar._controlwindow.getSize();
    let size = {width: 420, height: 570};
    let xy = {x: (cp[0] + cs[0] + 1), y: cp[1]};
    xy.x = (xy.x === 0 ? undefined : xy.x);
    xy.x = ((xy.x + size.width) > appVar._primarydisplay.size.width) ? undefined : xy.x;//可能超出视宽
    xy.y = (xy.y === 0 ? undefined : xy.y);
    xy.size = size;
    return xy;
}

module.exports = {
    creat,
    calcPosition
};