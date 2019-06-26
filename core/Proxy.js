/**
 * 解决处理nodejs模块和jquery的冲突问题 [只用处理一次就行了], 缺点就是ES6 的 require, exports 和 module 语法功能在渲染进程中不能再用了.
 * 但是可以通过 top 顶层进行代理使用 require 功能.
 * 而且, electron 大量模块无法在渲染进程使用, 所以, 影响不大. 也正好明显区分主进程和渲染进程.
 */
try {
    window.nodeRequire = require;
    delete window.require;
    delete window.exports;
    delete window.module;
} catch (e) {
    //什么都不干.出了错就是已经处理过一次了.
}

/**
 * 系统相关的API库. [仅限渲染进程调用]
 *
 * @author troy
 * @date 2018/12/19 23:49 PM
 */
function NodeJsProxy() {

    this.electron = undefined;
    this.ipc = undefined;
    this.remote = undefined;
    this.menu = undefined;
    this.menuItem = undefined;
    this.browserWindow = undefined;
    this.shell = undefined;
    this.fs = undefined;
    this.os = undefined;
    this.path = undefined;
    this.url = undefined;
    this.child_process = undefined;
    this.clipboard = undefined;

    this.appVar = undefined;

    this.uuid = undefined;
    this.debug = undefined;

    this.init = function () {
        this.electron = this.require('electron');
        this.ipc = this.electron.ipcRenderer;
        this.remote = this.electron.remote;
        this.menu = this.remote.Menu;
        this.menuItem = this.remote.MenuItem;
        this.browserWindow = this.remote.BrowserWindow;
        this.shell = this.electron.shell;
        this.fs = this.require('fs');
        this.os = this.require('os');
        this.path = this.require('path');
        this.url = this.require('url');
        this.child_process = this.require('child_process');
        this.clipboard = this.electron.clipboard;
        this.appVar = this.remote.getGlobal('appVar');
        this.uuid = this.require('./UUID')();

        this.debug = this.appVar._debug;
    };

    //自定义引用node模块
    this.require = function (mod) {
        return top[mod] ? top[mod] : top.nodeRequire(mod);
    };

    //获取主进程中的全局变量
    this.getAppVar = function (varname) {
        this.appVar = this.remote.getGlobal('appVar');//每次都重新去拿一下. 有些情况下, 这个值没有跟主进程保持同步, 原因未知.
        if (varname) {
            return this.appVar[varname];
        } else {
            return this.appVar;
        }
    };

    this.setAppVar = function (newAppVar) {
        ipc.send('change-appVar', newAppVar);
        ipc.once('change-appVar-response', function (event, issuccess) {
            if (!issuccess) {
                console.error('设定appVar异常');
                console.debug(newAppVar);
            }
        });
    };

    this.refreshAppVar = function (key, val) {
        if (key) {
            this.appVar[key] = val;
        }
        this.setAppVar(this.appVar);
    };

    this.reloadAppVar = function () {
        appVar = Remote.getGlobal('appVar');
        return appVar;
    };

    /**
     * 将 json 对象转换为 URL 参数串 [仅限一级]
     * @param json
     */
    this.json2Param = function (json) {
        var param = '';
        for (var key in json) {
            var val = json[key];
            param += '&' + key + '=' + val;
        }
        return param;
    };

    //为 link 添加时间戳, 以防止 Chrome 自动缓存
    this.link = function (src, json) {
        if (!src) return src;
        var link = src;
        if (src.indexOf && src.indexOf('?') > -1) {
            link = src + '&_t=' + (new Date().getTime());
        } else {
            link = src + '?_t=' + (new Date().getTime());
        }
        return link + this.json2Param(json);
    };

    /**
     * 调用子进程执行 cmd 指令.
     * @param cmd
     * @param callback
     */
    this.exec = function (cmd, callback) {
        //第一个参数是要执行的命令，第二个函数是配置选项，第三个参数是回调函数，第二个参数中一个比较常用的就是子进程的工作目录
        this.child_process(cmd, (err, stdout, stderr) => {
            if (err) {
                console.log(err);
                callback(false, stdout, stderr, err);
                return;
            } else {
                callback(true, stdout, stderr);
            }
            console.log(`stdout: ${stdout}`);
            console.log(`stderr: ${stderr}`);
        });
    };

    //构建弹出菜单[系统]
    this.popupMenu = function (menuItems) {
        setTimeout(() => {
            const menu = new this.menu();
            for (let x in menuItems) {
                menu.append(new this.menuItem(menuItems[x]));
            }
            menu.popup();
        }, 100);//因为 popup 系统菜单将会导致 js 主线程强制暂停, 所以, 这里拖鞋增加一个同步等待逻辑.
    };

    // 系统提示框
    this.alert = function (message, detail, callback, type, btns) {
        detail = detail ? detail : '';
        type = type ? type : 'info';
        console.warn('Dialog::Alert::' + type + ' => [' + message + '] ' + detail);
        var serial = this.uuid.serial(6, 2);
        var returnVal = this.ipc.send('dialog.showMessageBox', T.windowKey, 'dialog-error-tip-' + serial, type, btns ? btns : ['确定'], undefined, undefined, message, detail, undefined, 1, undefined);
        //监听回复
        this.ipc.on('dialog-error-tip-' + serial, function (event, response) {
            if (typeof callback === 'function') {
                callback(response);//0
            }
        });
    };

    // 系统确认选择框
    this.confirm = function (message, detail, callback, btns, type) {
        detail = detail ? detail : '';
        btns = btns ? btns : ['确认', '取消'];//0,1
        type = type ? type : 'warning';
        console.warn('Dialog::Confirm::' + type + ' => [' + message + '] ' + detail + ' ' + '(' + JSON.stringify(btns) + ')');
        var serial = this.uuid.serial(6, 2);
        var returnVal = this.ipc.send('dialog.showMessageBox', T.windowKey, 'dialog-confirm-' + serial, type, btns, undefined, undefined, message, detail, undefined, 1, undefined);
        //监听回复
        this.ipc.on('dialog-confirm-' + serial, function (event, response) {
            if (typeof callback === 'function') {
                callback(response);
            }
        });
    };

    // 文件保存确认框
    this.confirmFileSave = function (fileName, callback) {
        var message = "是否要保存对 " + fileName + " 的更改？";
        var detail = "如果不保存, 更改将丢失。";
        this.confirm(message, detail, callback, ['保存', '取消', '不保存']);//0,1,2
    };

    //创建并打开一个新的窗体
    this.openWindow = function (urlinDist, urlParams, options) {
        if (!urlinDist) {
            console.log('openWindow Fair!');
            return null;
        }
        urlParams = urlParams ? '&' + urlParams : '';//url参数.
        options.webPreferences = { //用于解决not allowed to load local resource的问题
            webSecurity: false,
            nodeIntegration: false, //全局禁用nodejs
            preload: this.path.join(this.appVar._dirname, '../renderer/assets/js/ideanote.js'), //提前加载, 通过这个文件调用nodejs和electron语法糖即可.
        };
        console.info(options)
        openWin = new this.browserWindow(options);

        // 旁加载应用的 index.html。
        openWin.loadURL(Url.format({
            pathname: this.path.join(this.appVar._dirname, '../renderer/dist/' + urlinDist),
            protocol: 'file:',
            slashes: true
        }) + "?isNewWin=true" + urlParams);

        // 窗体关闭事件
        openWin.on('closed', () => {
            // 取消引用 window 对象，如果你的应用支持多窗口的话，通常会把多个 window 对象存放在一个数组里面，与此同时，你应该删除相应的元素。
            openWin = null
        });

        openWin.webContents.openDevTools({detach: true});

        return openWin;
    };

    //通过shell指令打开链接或文件夹
    this.openExternal = function (urlOrPath, type, cmd) {//urlOrPath: url或文件路径, type: 动作类型[url/file], cmd: 扩展指令,一般用于type=file的场景. 用于扩展场景需求
        type = type ? type : 'url';
        if (type === 'url') {
            this.shell.openExternal(urlOrPath);//以系统默认设置打开外部协议.(例如,mailto: somebody@somewhere.io会打开用户默认的邮件客户端)
        } else if (type === 'file') {
            if (cmd === 'open') {
                this.shell.showItemInFolder(urlOrPath);//打开文件所在文件夹,一般情况下还会选中它.
            } else if (cmd === 'del') {
                this.shell.moveItemToTrash(urlOrPath);//[删除]移动指定路径文件到回收站,并返回此操作的状态值(boolean类型).
            } else {
                this.shell.openItem(urlOrPath);//以默认打开方式打开文件.
            }
        }
    };

    /**
     * 显示一个系统通知信息, 基于 HTML5 API
     * @param option
     * options：通知的设置选项（可选）。
     *     title [自定义]一定会被显示的通知标题
     *     dir：文字方向：auto（自动）；ltr：（从左到右）；rtl：（从右到左）
     *     lang：指定通知中所使用的语言
     *     body：通知的内容。
     *     tag：代表通知的一个识别标签，相同tag时只会打开同一个通知窗口。
     *     icon：要在通知中显示的图标的URL。
     *     image：要在通知中显示的图像的URL。
     *     data：想要和通知关联的任务类型的数据。
     *     requireInteraction：通知保持有效不自动关闭，默认为false。
     * @param callback
     */
    this.openNotication = function (option, callback) {
        option = {
            title: option.title,
            dir: option.dir,
            lang: option.lang,
            body: option.body,
            tag: option.tag,
            icon: option.icon ? option.icon : '../static/logo/blue-min-pretty.png',
            image: option.image,
            data: option.data,
            requireInteraction: option.requireInteraction,
        };
        // 创建通知并保存
        let hhwNotication = new window.Notification(option.title, option);

        // 当通知被点击时, 用默认浏览器打开链接
        hhwNotication.onclick = function () {
            ipc.send('window-restore', 'mainWin');//将主窗体恢复.
            if (typeof callback === 'function') {
                callback(option);
            }
        }
    };

    //播放通知声音
    this.playAudio = function () {
        this.shell.beep();//播放 beep 哔哔 声音.
    };

    //获取主进程中的全局变量
    this.getAppVar = function (varname) {
        if (varname) {
            return this.appVar[varname];
        } else {
            return this.appVar;
        }
    };

    //构建响应参数.
    this.builderResponse = function (code, msg, data) {
        if (code >= 400) {//大于等于400的错误, 自动错误信息框.
            this.alert(msg, JSON.stringify(data), function (response) {
                return {'code': code, 'msg': msg, 'data': data};
            });
        } else {
            msg = (!msg || msg === '') ? '操作成功!' : msg;
            return {'code': code, 'msg': msg, 'data': data};
        }
    };

    this.init();
}

var proxy = new NodeJsProxy();

//工具集合Tools
window.T = {};

// 获取请求参数
// 使用示例
// location.href = http://localhost:8080/index.html?id=123
// T.p('id') --> 123;
var url4Browser = function (name) {
    var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
    var r = window.location.search ? window.location.search.substr(1).match(reg) : null;
    if (r != null) return unescape(r[2]);
    return null;
};
T.p = url4Browser;
T.windowId = top.T.p('windowId');//windowId 肯定在最上层.  ==> windowId 获取的 window 不一定准确. 因为 windowId 实际是数组索引.
T.windowKey = top.T.p('windowKey');

//动态引入js文件.
var zxxinclude = function (path, where, charset) {
    var a = document.createElement("script");
    a.type = "text/javascript";
    a.charset = charset ? charset : 'UTF-8';
    a.src = path;
    where = where ? where : 'head';
    var signTag = document.getElementsByTagName(where)[0];
    signTag.appendChild(a);
};
T.i = zxxinclude;

//重写 console
if (!proxy.appVar._debug) {
    window.console = (function (origConsole) {
        if (!window.console)
            console = {};
        return {
            log: function () {
                origConsole && origConsole.log && origConsole.log(arguments[0]);
            },
            info: function () {
                origConsole.info(arguments[0]);
            },
            debug: function () {
                origConsole.debug(arguments[0]);
            },
            warn: function () {
                origConsole.warn(arguments[0]);
            },
            error: function () {
                origConsole.error(arguments[0]);
            },
            time: function () {
                origConsole.time(arguments[0]);
            },
            timeEnd: function () {
                origConsole.timeEnd(arguments[0]);
            }
        };
    }(window.console));
}