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
    const dock = require('./process/main/Dock');
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
        dock.init(appVar);
        helper.getWallWindow();
        helper.getControlWindow(pref_autoOpenControl || appVar._guide);//如果是首次启动, 自动打开
        // //如果当前没有窗口被激活，则创建窗口
        // var res = helper.getWallWindow();
        // if (res.result || pref_autoOpenControl) { //如果壁纸窗口已经存在, 就打开控制面板窗口.
        //     helper.getControlWindow(true);
        // }
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
        //关闭video画中画
        app.commandLine.appendSwitch('enable-picture-in-picture', 'disabled');

        var pref_hidedock = preferenceModel.getByKey("hideDock");
        pref_hidedock.value = JSON.parse(pref_hidedock.value);
        if (pref_hidedock.value.enable) {
            app.dock.hide();
        }

        /**
         * 开机自启动鉴定[首次启动自动加入开机自启动]
         */
        autolaunch.init(appVar, preferenceModel);

        /**
         * 初始化壁纸层窗口
         */
        helper.getWallWindow();
        helper.getControlWindow(pref_autoOpenControl || appVar._guide); //防止启动的时候资源占用超负荷, 暂时不启用.

        /**
         * 初始化系统托盘
         */
        appTray = tray.init(appVar);

        dock.init(appVar);

        /**
         * 启动自动更新任务
         */
        try {
            autoUpdater.updateHandle(appVar);
        } catch (e) {
            //...
        }
    });

    //在应用程序开始关闭其窗口之前发出。调用event.preventDefault（）将阻止默认行为，这将终止应用程序。
    // 注意：如果应用程序quit是由autoupdater.quitandinstall（）启动的，那么在所有窗口上发出close事件并关闭它们之后，将发出before quit。
    app.on('before-quit', function () {
        logger.info("before-quit");
        AppVar.setAppVar({_destory: true});
    });

    // 当所有窗口关闭时关闭应用程序
    app.on('window-all-closed', function () {
        logger.info("window-all-closed");
        app.quit();
        if (process.platform !== 'darwin') { //如果是非 mac 系统, 直接退出

        } //如果是 mac 系统, 关闭所有窗口就好, 等待重新唤醒.
    });

    //当应用程序准备退出时执行动作
    //在 Windows 系统中，如果应用程序因系统关机/重启或用户注销而关闭，那么这个事件不会被触发。
    app.on('will-quit', () => {
        logger.info("will-quit");
        //...
    });

    //在应用程序退出时发出
    //在 Windows 系统中，如果应用程序因系统关机/重启或用户注销而关闭，那么这个事件不会被触发。
    app.on('quit', () => {
        logger.info("quit");
        app.releaseSingleInstanceLock();//释放所有的单例锁
        tray.fuck(); //干掉托盘
        appTray = null;
    });

    //当应用程序激活时，通常在macOS下, win下基本见不到.
    app.on('activate', function () {
        logger.info("activate");
        if (!appTray) {
            appTray = tray.init(appVar);
        }
        dock.init(appVar);
        helper.getWallWindow();
        helper.getControlWindow(true);
    });
}

/* ↑app对象生命周期维护结束↑ */