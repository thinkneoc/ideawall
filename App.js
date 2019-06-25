/*主进程*/
const {
    app
} = require('electron');


/**
 * 单例锁控制
 *
 * 通过 app.hasSingleInstanceLock() 判断应用实例当前是否持有单例锁
 * 可以通过 app.requestSingleInstanceLock() 请求锁，并且通过 app.releaseSingleInstanceLock() 释放锁。
 */
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    app.exit(0); //比 app.quit 更快.
} else {
    const logger = require('./core/Logger');
    const helper = require('./process/main/MainProcessHelper');
    const dialog = require('./process/main/Dialog');
    const tray = require('./process/main/Tray');
    const AppVar = require('./process/main/AppVar');
    AppVar.checkAppWorkSpace(); //工作命名空间构建
    let appVar = AppVar.getAppVar(),
        appTray, windows; //全局变量, 防止自动垃圾回收.
    const preferenceModel = require('./model/PreferenceModel')(appVar);
    preferenceModel.initial();

    /**
     * 获取预阶段配置项
     */
    var pref_autoOpenControl = preferenceModel.getByKey("autoOpenControl");
    pref_autoOpenControl = JSON.parse(pref_autoOpenControl.value).enable;

    app.on('second-instance', (event, commandLine, workingDirectory) => {
        // 当运行第二个实例时, 相当于重新激活一次.
        if (!appTray) {
            appTray = tray.init(appVar);
        }
        //如果当前没有窗口被激活，则创建窗口
        var res = helper.getWallWindow();
        if (res.result || pref_autoOpenControl) { //如果壁纸窗口已经存在, 就打开控制面板窗口.
            helper.getControlWindow(true);
        }
    });


    // 这个方法将会在electron初始化完成后被调用
    // 某些API只能在初始化之后(此状态之后)被调用
    app.on('ready', () => {
        const autolaunch = require('./process/main/AutoLaunch');
        const autoUpdater = require('./process/main/AutoUpdater');

        /**
         * 以下 Chrome 指令用以解决:
         * Chrome 内核 66+ 版本的新策略: 仅在静音且可视情况下, 才允许音视频自动播放, 否则, 需等待一个交互交互.
         */
        app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');


        /**
         * 开机自启动鉴定[首次启动自动加入开机自启动]
         */
        autolaunch.init(appVar, preferenceModel);

        /**
         * 初始化壁纸层窗口
         */
        helper.getWallWindow();

        if (pref_autoOpenControl) {
            helper.getControlWindow(true); //防止启动的时候资源占用超负荷, 暂时不启用.
        }

        /**
         * 初始化系统托盘
         */
        appTray = tray.init(appVar);

        /**
         * 启动自动更新任务
         */
        try {
            autoUpdater.updateHandle(appVar);
        } catch (e) {
            //...
        }
    });

    // app.on('ready', ()=>{
    //     const wallpaper = require('wallpaper');
    //
    //     (async () => {
    //         var dd = helper.getStaticResourcePath("Tasermiut-格陵兰之角.mp4");
    //         await wallpaper.set(dd);
    //
    //         await wallpaper.get();
    //         //=> '/Users/sindresorhus/unicorn.jpg'
    //     })();
    // })


    // 当所有窗口关闭时关闭应用程序
    app.on('window-all-closed', function () {
        if (process.platform !== 'darwin') { //如果是非 mac 系统, 直接退出
            logger.info("系统即将关闭");
            app.quit();
        } else { //如果是 mac 系统, 关闭所有窗口就好, 等待重新唤醒.

        }

        appTray.destroy(); //干掉托盘
        appTray = null;
    });

    //当应用程序准备退出时执行动作
    app.on('will-quit', () => {
        logger.info("程序即将退出");
    });

    //当应用程序激活时，通常在macOS下
    app.on('activate', function () {
        if (!appTray) {
            appTray = tray.init(appVar);
        }
        //如果当前没有窗口被激活，则创建窗口
        var res = helper.getWallWindow();
        if (res.result || pref_autoOpenControl) { //如果壁纸窗口已经存在, 就打开控制面板窗口.
            helper.getControlWindow(true);
        }
    });
}

/* ↑app对象生命周期维护结束↑ */