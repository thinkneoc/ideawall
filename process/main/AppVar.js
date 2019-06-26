const Electron = require('electron');
const App = Electron.app; // 核心应用承载模块
const ipcMain = Electron.ipcMain;
const path = require('path');//原生库模块
const url = require('url');
const os = require("os");
const fs = require("fs");

const logger = require('../../core/Logger');//引入全局日志组件
const config = require('../../core/Config');//引入全局配置组件
const Fs = require('../../core/Fs');
const relative = '../../';

/* ↓全局变量配置区开始↓ */
let workspace = os.homedir() + "/.ideawall";
//全局参数, 大部分情况下是为了方便渲染进程调用.
let appVar = {
    _siteurl: 'http://iw.16inet.com/',
    _updateurl: 'http://update.iw.16inet.com/',
    _updateavaava: false,//是否有可用更新.
    _dirname: __dirname, //应用目录
    _config: config,
    _preloadscript: path.join(__dirname, relative + 'core/Proxy.js'),
    _viewpath: path.join(__dirname, relative + 'view'),//视图目录
    _staticpath: path.join(__dirname, relative + 'static'),//静态资源目录
    _lock: false,
    _dbath: workspace + "/data/iw.db",//本地数据库
    _apath: {
        dir: {
            home: workspace,
            snapscreen: workspace + "/snapscreen",
            desk: workspace + "/desk",
            data: workspace + "/data",
            user: workspace + "/user",
            cache: workspace + "/cache",
            log: workspace + "/log",
        },
        file: {
            cnf: workspace + "/ideawall." + (process.platform !== 'darwin' ? 'ini' : 'cnf'),
        }
    },
    _path: {
        home: App.getPath('home'),//用户的 home 文件夹（主目录）
        appData: App.getPath('appData'),//当前用户的应用数据文件夹，默认对应：%APPDATA% Windows 中; $XDG_CONFIG_HOME or ~/.config Linux 中; ~/Library/Application Support OS X 中
        userData: App.getPath('userData'),//储存你应用程序设置文件的文件夹，默认是 appData 文件夹附加应用的名称
        temp: App.getPath('temp'),//临时文件夹
        exe: App.getPath('exe'),//当前的可执行文件
        module: App.getPath('module'),//libchromiumcontent 库位置
        desktop: App.getPath('desktop'),//当前用户的桌面文件夹
        documents: App.getPath('documents'),//用户文档目录的路径
        downloads: App.getPath('downloads'),//用户下载目录的路径.
        music: App.getPath('music'),//用户音乐目录的路径.
        pictures: App.getPath('pictures'),//用户图片目录的路径.
        videos: App.getPath('videos'),//用户视频目录的路径.
    },
    _system: os.type(), //举例: Win下返回Windows_NT, Mac下返回Darwin, Linux下返回Linux. 更多返回值查看nodejs官方API文档.
    _platform: os.platform(), //可能的值: 'aix','darwin','freebsd','linux','openbsd','sunos','win32', 建议通过上面的判定系统类型. 得到的结果类似于process.platform
    _name: App.getName(),//应用名称
    _version: App.getVersion(),//版本号
    _locale: App.getLocale(),//语言
    _debug: (config.get("debug")), //debug模式
    _ready: {
        _render: false,//渲染进程预处理工作完毕
        _main: false,//主进程预处理工作完毕
    }, //预备完毕[全部初始化工作, 包括渲染进程的渲染工作.]
    _login: false, //是否需要重新登录
    _previewId: '',//当前正在预览的桌面 id
    _previewwindow: {},//预览窗体
    _controlwindow: {},//控制面板窗体
    _displayId: '',//当前正在查看信息的设备 id
    _deviceinfowindow: {},//设备信息窗体
    _readmewindow: {},//Readme窗体
    _aboutwindow: {},//About 窗体
    _jsoneditorwindow: {},//JsonEditor 窗体
    _wallwindows: {},//设备 id 与 桌面窗体 的一一对应集合.
    _primarydisplay: {},//主屏幕设备
    _displays: [],//这个是初始化会进行处理的设备集合.
    _autoLauncher: {},
};
global.appVar = appVar;
global.buffer = Buffer;

//修改主进程中appVar的值: 只能把改好的appVar传回来, 不能传键值对, 因为ipc通信会将对象自动转为json字符串, 所以无法分清对象和单一变量值.
ipcMain.on('change-appVar', function (event, newAppVar) {
    try {
        appVar = newAppVar;
        global.appVar = newAppVar;
        event.sender.send('change-appVar-response', true);
    } catch (e) {
        console.error(e);
        event.sender.send('change-appVar-response', false);
    }
});

ipcMain.on('ipc_clean', function (event) {
    try {
        clearAppWorkSpace();
    } catch (e) {
        console.error(e);
    }
});

/**
 * 返回全局内部配置变量
 * @returns {{_system: *, _name: any, _staticpath: string, _login: boolean, _path: {temp: *, userData: *, exe: *, desktop: *, music: *, documents: *, downloads: *, module: *, videos: *, appData: *, pictures: *, home: *}, _config: ({getConfigVal}|*), _platform: never, _desk: {width: string, height: string}, _ready: {_main: boolean, _render: boolean}, _debug: (boolean|*), _dirname: *, _version: *, _locale: *}}
 */
function getAppVar(index) {
    if (index) {
        return appVar[index];
    }
    return appVar;
}

/**
 * 更新 appVar 值, 仅限一级.
 * @param obj
 * @returns {{_system: *, _name: (String|Number|any), _deviceinfowindow: {}, _config: ({get}|*), _logpath: (*|string), _viewpath: (*|string), _debug: (boolean|string|string|*|undefined), _controlwindow: {}, _version: *, _jsoneditorwindow: {}, _apath: {file: {cnf: string}, dir: {snapscreen: string, cache: string, data: string, desk: string, user: string, home: string}}, _previewId: string, _staticpath: (*|string), _wallwindows: {}, _login: boolean, _path: {temp: (number|*), userData: (number|*), exe: (number|*), desktop: (number|*), music: (number|*), documents: (number|*), downloads: (number|*), module: (number|*), videos: (number|*), appData: (number|*), pictures: (number|*), home: (number|*)}, _autoLauncher: {}, _platform: (*|never), _previewwindow: {}, _displays: Array, _primarydisplay: {}, _ready: {_main: boolean, _render: boolean}, _readmewindow: {}, _dirname: *, _displayId: string, _locale: *}}
 */
function setAppVar(obj) {
    for (var x in obj) {
        if (appVar.hasOwnProperty(x)) {
            appVar[x] = obj[x];
        }
    }
    global.appVar = appVar;
}

/**
 * 计算并获取静态资源路径
 * @param fsuri
 * @returns {string}
 */
function getStaticResourcePath(fsuri) {
    return path.join(appVar._staticpath, fsuri);
}


//全局路由参数传递缓冲区
global.sharedObject = {
    args: {
        default: 'default_arg',
    }
};

//全局状态机共享区
let statusMap = new Map();
statusMap.set('default', 'default_value');
global.sharedStatus = {
    statusMap: statusMap//全局状态对象
};


/**
 * 系统声明的命名空间 目录和文件创建
 */
function checkAppWorkSpace(callback) {
    //工作区间目录初始化
    for (var x in appVar._apath.dir) {
        var zxx = appVar._apath.dir[x];
        if (!fs.existsSync(zxx)) {
            fs.mkdirSync(zxx);
        }
    }
    //工作区间基础文件初始化
    for (var y in appVar._apath.file) {
        var zyy = appVar._apath.file[y];
        if (typeof (zyy) != 'string') {//不是路径, 就是对象了~
            var source = zyy.source;
            var target = zyy.target;
            if (!fs.existsSync(target)) {
                var readStream = fs.createReadStream(source);
                var writeStream = fs.createWriteStream(target);
                readStream.pipe(writeStream);
            }
        } else {
            if (!fs.existsSync(zyy)) {
                fs.writeFileSync(zyy, '');
            }
        }
    }

    if (typeof callback === 'function') {
        callback();
    }
}

/**
 * 清空可以删除的文件.
 */
function clearAppWorkSpace() {
    //1.清除快照
    Fs.delDir(appVar._apath.dir.snapscreen);
    //2.清除缓存
    Fs.delDir(appVar._apath.dir.cache);
    //3.清除日志文件
    Fs.delDir(appVar._apath.dir.log);
}

/* ↑全局变量配置区结束↑ */

module.exports = {
    checkAppWorkSpace,
    clearAppWorkSpace,
    getAppVar,
    setAppVar,
    getStaticResourcePath
};