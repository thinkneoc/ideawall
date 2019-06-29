const logger = require('../core/Logger');
const uuid = require('../core/UUID')();
const datetime = require('../core/Datetime')();
const Model = require('../core/Model')();
const screen = require('../core/Screen')();
const os = require("os");

const deviceMessage = require('../message/DeviceMessage')();
const localDeskModel = require('../model/LocalDeskModel')();

let model = new (function () {
    //数据表信息
    this.tbinfo = {
        tprefix: 'iw_',//表前缀
        cprefix: 'dd_',//列前缀
        name: 'devicedesk',//表名
        anno: '设备桌面配置数据表', //注释信息
        columns: { //列属性, 传入一个对象
            id: null,//唯一标识 id, 自增整型数字
            ld_id: '',//配置的桌面 id, 为空代表没有配置.
            display_id: '',//设备 id
            display_rp: '',//设备分辨率
            display_info: '',//设备属性: 随时会变化
            screen_name: '',//屏幕标识
            screen_title: '',//屏幕标题
            date_add: datetime.now(),//记录日期
            api_pause: 1,//播放是否暂停
            api_muted: 1,//全局页面是否静音
            api_hide: 1,//全局视觉隐藏
        },
    };
});

/**
 * 本地-我的桌面数据模型
 *
 * 如果要用到 setsDesk 方法, 应该传入 appVar
 *
 * @constructor
 */
function DeviceDeskModel(appVar) {

    this.dao = undefined;

    this.init = function () {
        this.dao = require('../dao/DeviceDeskDao')(model);
    };

    /**
     * 数据初始化: 将读取到设备信息进行更新, 如果没有就新增
     * 警告: 建议在snapscreen()之后再执行此方法. 如果不需要考虑 screen 相关, 忽略即可.
     */
    this.initial = function (rp, callback, pref_deviceSnapscreenTTL, first, onlyone) {
        var that = this;
        if (pref_deviceSnapscreenTTL) {
            try {
                pref_deviceSnapscreenTTL = parseInt(JSON.parse(pref_deviceSnapscreenTTL.value).val);
                if (pref_deviceSnapscreenTTL === 0) {
                    onlyone = true;
                } else {
                    this.snapscreenTTL = pref_deviceSnapscreenTTL;
                }
            } catch (e) {
            }
        }
        this.snapscreen(rp, (result, rIds, first) => {
            if (first) {
                that.dao.initial(result);
            }
            if (typeof callback === 'function') {
                callback(result, rIds, first);
            }
        }, first, onlyone);
        return this;
    };

    this.getScreen = function () {
        return screen;
    };

    this.getDisplayById = function (display_id) {
        return this.dao.getByDisplayId(display_id);
    };

    this.isDisplay = function (desk_id) {
        return this.dao.anyDisplayHasDesk(desk_id);
    };

    this.getDisplays = function (desk_id) {
        return this.dao.getsByDeskId(desk_id);
    };

    this.getDeskDisplays = function () {
        return this.dao.getDisplaysHasDesk();
    };

    this.setsDesk = function (display_ids, desk_id) {
        this.dao.setsDesk(display_ids, desk_id);
        for (var x in display_ids) {
            var display_id = display_ids[x];
            //通知壁纸窗口更新数据.
            appVar._wallwindows[parseInt(display_id)].window.webContents.send('ipc_window_wall_init', (desk_id === 0));
        }
    };

    this.removeDesk = function (display_id) {
        this.setsDesk([display_id], 0);
    };

    this.removesDesk = function (desk_ids) {
        return this.dao.removesDesk(desk_ids);
    };

    this.isDesk = function (display_id, deskId) {
        if (!deskId) {
            var display = this.getDisplayById(display_id);
            if (display && display['ld_id']) {
                deskId = display['ld_id'];
            }
        }
        if (deskId && deskId != null && deskId != '' && deskId != 0) {
            return deskId;
        }
        return false;
    };

    this.getDesk = function (display_id) {
        var deskId = this.isDesk(display_id);
        if (deskId && deskId !== 0 && deskId != null) {
            return localDeskModel.getDesk(deskId);
        }
        return undefined;
    };

    this.getDesks = function () {
        var displays = this.dao.getDisplaysHasDesk();
        var desks = [];
        for (var x in displays) {
            var item = displays[x];
            var deskId = item['ld_id'];
            if (deskId && deskId !== 0 && deskId != null) {
                desks.push(localDeskModel.getDesk(deskId));
            }
        }
        return desks;
    };

    this.setApi = function (display_id, key, bol) {
        this.dao.setApi(display_id, key, bol);
        var displays = display_id ? [this.getDisplayById(display_id)] : false;
        deviceMessage.syncUpdate(displays);
    };

    this.isApi = function (display_id, key, bol) {
        return this.dao.isApi(display_id, key, bol);
    };

    /**
     * 定时设备快照
     *
     * @param rp 分辨率 {width: 200, height: 142}
     * @param callback 回调函数
     * @param first 是否首次快照, 传入则加速生成快照.
     * @param onlyone 是否仅执行一次快照
     */
    this.snapscreenIndexF = undefined;
    this.snapscreenIndex = undefined;
    this.snapscreens = [];
    this.snapscreenIds = [];
    this.snapscreenNum = 0;
    this.snapscreenTTL = os.platform() === 'darwin' ? 3000 : 6000;//默认定时
    this.snapscreenTTL_first = os.platform() === 'darwin' ? 2000 : 4000;//首次延时
    this.snapscreen = function (rp, callback, first, onlyone) {
        var that = this;
        this.snapscreenNum += 1;
        console.warn('[控制面板] 正在执行第 ' + this.snapscreenNum + ' 次快照  TTL: ' + this.snapscreenTTL + 'ms');
        var oIds = that.snapscreenIds.join(",");
        screen.snapscreen(rp, (result, rIds, screens) => {
            if (first) {//如果...
                that.snapscreens = result;
                that.snapscreenIds = rIds;
                if (typeof callback === 'function') {
                    callback(that.snapscreens, that.snapscreenIds, first);
                }
                that.snapscreenIndexF = setTimeout(() => {
                    // console.debug(result);
                    var nIds = rIds.join(",");
                    //策略: 在没有发生设备变更的时候, 直接换图片, 反之, 闪屏刷一下, 这个可以忍.
                    if (nIds == oIds) {//没变, 更新图片就好 [如果仅仅是顺序发生了变动, 也是闪屏刷新一下.]
                        for (var x in that.snapscreens) {
                            for (var y in result) {
                                if (that.snapscreens[x].id == result[y].id) {
                                    that.snapscreens[x].stream = result[y].stream;
                                }
                            }
                        }
                    } else {
                        if (!first) {
                            that.snapscreens = result;
                            that.snapscreenIds = rIds;
                        }
                    }
                    if (typeof callback === 'function') {
                        callback(that.snapscreens, that.snapscreenIds, first);
                    }
                    if (!onlyone) {
                        that.snapscreen(rp, callback);
                    }
                }, that.snapscreenTTL_first);
            } else {
                that.snapscreenIndex = setTimeout(() => {
                    // console.debug(result);
                    var nIds = rIds.join(",");
                    //策略: 在没有发生设备变更的时候, 直接换图片, 反之, 闪屏刷一下, 这个可以忍.
                    if (nIds == oIds) {//没变, 更新图片就好 [如果仅仅是顺序发生了变动, 也是闪屏刷新一下.]
                        for (var x in that.snapscreens) {
                            for (var y in result) {
                                if (that.snapscreens[x].id == result[y].id) {
                                    that.snapscreens[x].stream = result[y].stream;
                                }
                            }
                        }
                    } else {
                        if (!first) {
                            that.snapscreens = result;
                            that.snapscreenIds = rIds;
                        }
                    }
                    if (typeof callback === 'function') {
                        callback(that.snapscreens, that.snapscreenIds, first);
                    }
                    if (!onlyone) {
                        that.snapscreen(rp, callback);
                    }
                }, that.snapscreenTTL);
            }

        });
    };

    /**
     * 停止快照
     */
    this.closeSnapscreen = function () {
        console.warn('[控制面板] 设备快照动作销毁');
        this.snapscreenNum = 0;
        clearTimeout(this.snapscreenIndexF);
        clearTimeout(this.snapscreenIndex);
    };

    this.init();
}

module.exports = (appVar) => {
    return new DeviceDeskModel(appVar);
};
