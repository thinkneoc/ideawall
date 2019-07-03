const Electron = require('electron');
const DesktopCapturer = Electron.desktopCapturer;
const Screen = Electron.screen;
const Remote = Electron.remote;
const logger = require('../core/Logger');
const lang = require('../core/Lang')();
let appVar;
try {
    appVar = Remote.getGlobal('appVar')
} catch (e) {
    appVar = global.appVar;
}

/**
 * @author troy
 * @date 2019/2/4 1:48 AM
 * @description 截屏工具类
 * @param
 * @return
 */
var _Screen = function () {

    this.screenIds = [];
    this.screens = []; //内存备份.

    /**
     * 初始化控制器
     */
    this.init = function () {
    };

    /**
     * 判断快照的屏幕是否在初始化的监视器设备中, 用于监测是否需要重启生效.
     *
     * @param display_id
     * @returns {boolean}
     */
    this.displaysHasScreen = function (display_id) {
        var rr = this.screens.filter((item) => {
            return item.display_id + '' == display_id + '';
        });
        // console.debug(rr);
        if (rr && rr.length > 0) {
            return true;
        } else {
            return false;
        }
    };

    /**
     * 尝试通过设备 id 获取最近的一次快照信息
     *
     * @param display_id
     * @patam si 自带...
     * @param ss 自带老母亲
     */
    this.getScreenByDisplayId = function (display_id, si, ss) {
        var ids = si ? si : this.screenIds;
        var arr = ss ? ss : this.screens;
        if (ids.indexOf(display_id) > -1) {
            var result = arr.filter((item) => {
                return item.display_id + '' == display_id + '';
            });
            if (result && result.length === 1) {
                return result[0];
            }
        }
        return false;
    };

    /**
     * 根据设备 id 获取 display 信息
     *
     * @param display_id
     * @param displays
     */
    this.getDisplay = function (display_id, displays) {
        var display = appVar._displays.filter((item) => {
            return item.id + '' == display_id + '';
        })[0];
        if (!display && !displays) {
            displays = Screen.getAllDisplays();//没找到, 就重新匹配一次, 不用管其他地方的有没有改变, 管不了.
            this.getDisplay(display_id, displays);//递归一次
        }
        return display;
    };

    /**
     * 生成屏幕标题
     *
     * @param name 屏幕标题
     * @param id 设备 id
     * @returns {string}
     */
    this.calcScreenTitle = function (name, id) {
        if (!name) {
            name = this.screens.filter((item) => {
                return item.display_id + '' == id + '';
            })[0];
        }
        var lname = name.toLowerCase();
        if (lname === "entire screen" || lname === "screen 1") {
            return "主屏幕";
        } else {
            if (this.screens.length > 2) {
                return lname.replace('Screen', '扩展屏幕');
            } else {
                return "扩展屏幕";
            }
        }
    };

    /**
     * 粗略计算设备标题
     *
     * @param index
     * @param len
     * @returns {string}
     */
    this.calcScreenTitleByIndex = function (index, len) {
        if (index === 0) {
            return "主屏幕";
        } else {
            if (len > 2) {
                return '扩展屏幕 ' + index;
            } else {
                return "扩展屏幕";
            }
        }
    };

    /**
     * 计算屏幕分辨率
     */
    this.calcScreenRp = function (display_id, display) {
        if (!display) {
            display = this.getDisplay(display_id);
        }
        var width = 0,
            height = 0;
        if (display) {
            width = display.size.width;
            height = display.size.height;
        }
        return (width === 0 || height === 0) ? '' : (width + ' x ' + height);
    };

    /**
     * 测试一下截屏快照功能是否正常工作
     */
    this.testSnapscreen = function () {
        console.debug(this.snapscreen(false, (result, rIds, displays) => {
            logger.info(result);
            logger.info(rIds);
            logger.info(displays);
        }));
        // this.snapscreen_win();
    };

    /**
     * 包装映射一下display数据结构, 对win下的截屏策略
     * 具体思路: 利用bound和rp值来比对. 比较低效, 索性绝大部分用户没有那么多监视器设备.
     *
     * @param displays
     */
    this.calcPackDisplay_win = function (displays) {
        var _primarydisplay = appVar._primarydisplay;
        var _alldisplays = appVar._displays;
        var res = {};//为方便获取和加强并发, 采用id:obj键值对的解构.
        var sx = 2;
        for (var x in displays) {
            var zxx = displays[x];
            var newzxx = {};
            //主屏幕鉴定
            if (compareDisplay(zxx, _primarydisplay)) {
                newzxx = _primarydisplay;
                newzxx.name = 'Entire Screen';//Entire Screen | Screen 1
                res[zxx.id] = newzxx;
                continue;
            }
            for (var y in _alldisplays) {
                var zyy = _alldisplays[y];
                if (compareDisplay(zxx, zyy) && zyy.id !== _primarydisplay.id) {
                    newzxx = zyy;
                    newzxx.name = 'Screen ' + sx;
                    sx++;
                    res[zxx.id] = newzxx;
                    break;
                }
            }
        }
        return res;

        /**
         * 比较两个监视器对象是否符合
         * @param dp1   snapscreen-desktop的Display对象
         * @param dp2   Electron的Display对象
         * @returns {boolean}
         */
        function compareDisplay(dp1, dp2) {
            return (dp1.width === dp2.bounds.width && dp1.height === dp2.bounds.height && dp1.top === dp2.bounds.y && dp1.left === dp2.bounds.x);
        }
    };

    /**
     * window截屏 - 全屏截屏, 图片
     * snapscreen在windows下直接导致app崩溃, 原因未知[猜测是electron-wallpaper影响了它]. 这里采取一个折中方案.
     */
    this.snapscreen_win = function (thumbSize, callback) {
        var target = this;
        const screenshot = require('screenshot-desktop');
        let result = [];
        let rIds = [];
        console.debug(appVar._primarydisplay);
        console.debug(appVar._wallwindows);
        screenshot.listDisplays().then((displays) => {
            // displays: [{ id, name }, { id, name }]
            let rdisplays = target.calcPackDisplay_win(displays);
            console.debug(displays);
            console.debug(rdisplays);
            for (let x in displays) {
                let zxx = displays[x];
                let zyy = rdisplays[zxx.id];
                console.debug(zxx);
                console.debug(zyy);
                screenshot({
                    screen: zxx.id,
                }).then((img) => {
                    var dataurl = 'data:image/jpg;base64,' + img.toString('base64');
                    let display = target.getDisplay(zyy.id);
                    var obj = {
                        id: zyy.id,
                        display_id: zyy.id,
                        display: display,
                        name: zyy.name,
                        title: target.calcScreenTitle(zyy.name),
                        display_rp: target.calcScreenRp(false, display),
                        thumbnail: null,
                        stream: dataurl,
                    };
                    if (zyy.id == appVar._primarydisplay.id) {
                        result.unshift(obj);//主屏幕放在前面
                    } else {
                        result.push(obj);
                    }
                    rIds.push(zyy.id);
                }).catch((err) => {
                    // ...
                    logger.error(err);
                });
            }
            target.screenIds = rIds;
            target.screens = result;
            console.debug(result);
            if (typeof callback === 'function') {
                callback(result, rIds, appVar._displays);
            }
        })
    };

    /**
     * 截屏 - 图片(缩略图)
     *
     * @param thumbSize
     * @param callback
     */
    this.snapscreen = function (thumbSize, callback) { // savePath: 保存路径(含文件名), openOnComplete: 完成后是否打开
        if (appVar._platform !== 'darwin') {
            return this.snapscreen_win(thumbSize, callback);
            // return DesktopCapturer.getSources();
        }

        var target = this;
        const screenSize = Screen.getPrimaryDisplay().workAreaSize; //获取主显示器尺寸;
        const maxDimension = Math.max(screenSize.width, screenSize.height); //尺寸大小预处理
        thumbSize = thumbSize ? thumbSize : {
            width: maxDimension * window.devicePixelRatio,
            height: maxDimension * window.devicePixelRatio
        }; //设定截图大小

        /**
         * desktopCapturer.getSources(...)
         * options:
         * @type string[] - 一个 String 数组，列出了可以捕获的桌面资源类型, 可用类型为 screen 和 window. (如果type数组长度大于1, 得到的sources也为数组,而不是对象[需要循环遍历].)
         * @thumbnailSize: {width: number, height: number} - 建议缩略可被缩放的 size, 默认为 {width: 150, height: 150}.
         * callback:
         *      回调动作
         */
        let result = [];
        let rIds = [];
        let options = {
            types: ['screen'],
            thumbnailSize: thumbSize
        }; //仅捕获屏幕, 如果还需要捕获窗口, 添加 window 到 types 数组.
        DesktopCapturer.getSources(options, function (error, sources) { //开始捕获屏幕
            if (error) return console.error(error);
            /**
             * sources: 对象数组, 每个 Source 表示了一个捕获的屏幕或单独窗口.
             * @id String - 在 navigator.webkitGetUserMedia 中使用的捕获窗口或屏幕的 id . 格式为 window:XX 祸screen:XX，XX 是一个随机数.
             * @name String - 捕获窗口或屏幕的描述名 . 如果资源为屏幕，名字为 Entire Screen 或 Screen <index>; 如果资源为窗口, 名字为窗口的标题.
             * @thumbnail NativeImage - 缩略图.
             */
            sources.forEach(function (source) {
                var display = target.getDisplay(source.display_id);
                result.push({
                    id: source.display_id,
                    display_id: source.display_id,
                    display: display,
                    name: source.name,
                    title: target.calcScreenTitle(source.name),
                    display_rp: target.calcScreenRp(false, display),
                    thumbnail: source.thumbnail,
                    stream: source.thumbnail.toDataURL(),
                });
                rIds.push(source.display_id);
            });
        });
        target.screenIds = rIds;
        target.screens = result;
        if (typeof callback === 'function') {
            callback(result, rIds, Screen.getAllDisplays());
        }
    };

    /**
     * 截屏 - 视频流和音频流 [异常..]
     *
     * @param callback
     */
    this.capturerscreen = function (callback) { // videoTagId[可选,默认在文档中自动拿一个匹配到的video元素]: 用于播放视频流的video标签id ,type[可选,默认为desktop]: desktop(无音频流)|screen(有音频流)
        console.debug('capturerscreen');
        var target = this;
        DesktopCapturer.getSources({
            types: ['screen']
        }, function (error, sources) {
            if (error) return console.error(error);
            /**
             * 注意: navigator是Chrome内核提供的API, 并不是由nodejs或electron提供的.
             * 当调用 navigator.webkitGetUserMedia 时创建一个约束对象，如果使用 desktopCapturer 的资源，必须设置 chromeMediaSource 为 "desktop" ，并且 audio 为 false.
             * 如果你想捕获整个桌面的 audio 和 video，你可以设置 chromeMediaSource 为 "screen" ，和 audio 为 true. 当使用这个方法的时候，不可以指定一个 chromeMediaSourceId.
             */
            let result = [];
            let options = {
                audio: false,
                video: {
                    mandatory: {
                        chromeMediaSource: 'desktop',
                        chromeMediaSourceId: sources.id,
                        minWidth: 1280,
                        maxWidth: 1280,
                        minHeight: 720,
                        maxHeight: 720
                    }
                }
            };
            options = {
                audio: true,
                video: {
                    mandatory: {
                        chromeMediaSource: 'screen',
                        minWidth: 1280,
                        maxWidth: 1280,
                        minHeight: 720,
                        maxHeight: 720
                    }
                }
            };
            sources.forEach(function (source) {
                //有问题, 原因未知.
                navigator.webkitGetUserMedia(options, function (stream) {
                    source.stream = URL.createObjectURL(stream);
                    result.push(source);
                }, function (e) {
                    console.error('[navigator.webkitGetUserMedia] getUserMediaError! ');
                    console.error(e);
                });
            });
            if (typeof callback === 'function') {
                callback(result);
            }
        });
    };


    this.init(); //自动初始化
};

module.exports = () => {
    return new _Screen();
};