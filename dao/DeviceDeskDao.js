const Model = require('../core/Model')();
const datetime = require('../core/Datetime')();

const initscript = '' +
    'CREATE TABLE IF NOT EXISTS "iw_devicedesk" (\n' +
    '  "dd_id" integer NOT NULL ON CONFLICT IGNORE PRIMARY KEY AUTOINCREMENT,\n' +
    '  "dd_ld_id" integer(11) DEFAULT 0,\n' +
    '  "dd_display_id" integer(100) NOT NULL ON CONFLICT IGNORE,\n' +
    '  "dd_display_rp" text(30),\n' +
    '  "dd_display_info" text(1000),\n' +
    '  "dd_api_pause" integer(1) DEFAULT 1,\n' +
    '  "dd_api_muted" integer(1) DEFAULT 1,\n' +
    '  "dd_api_hide" integer(1) DEFAULT 1,\n' +
    '  "dd_date_add" text(30),\n' +
    '  "dd_screen_name" text(30),\n' +
    '  "dd_screen_title" text(30),\n' +
    '  CONSTRAINT "dd_key_id" UNIQUE ("dd_id" COLLATE NOCASE ASC) ON CONFLICT IGNORE,\n' +
    '  CONSTRAINT "dd_key_display_id" UNIQUE ("dd_display_id" COLLATE NOCASE ASC) ON CONFLICT IGNORE\n' +
    ');';

/**
 * 设备桌面 Dao 层.
 *
 * @param model
 * @constructor
 */
function DeviceDeskDao(model) {

    this._self = undefined;

    this.init = function () {
        model.initscript = initscript;
        this._self = require('../core/Database')(model);
    };

    /**
     * 传入当前检测到的设备, 做初始化工作.
     *
     * @param screens 通过screen类检测到的信息, display 信息已经被封装在了其中.
     */
    this.initial = function (screens) {
        console.debug(screens);
        for (var x in screens) {
            this.insertOrUpdate(screens[x]);
        }
        return this;
    };

    /**
     * 插入或更新一个设备
     * @param screen
     */
    this.insertOrUpdate = function (screen) {
        var display = screen.display;
        if (!display) {//可能undefined, 在新接入新设备的时候, 表征概率很低, 并且, 名字和分辨率有概率需要重新计算.
            const Screen = require('../core/Screen')();
            screen.title = display.title ? display.title : Screen.calcScreenTitle(screen.name);
            screen.display_rp = display.display_rp ? display.display_rp : Screen.calcScreenRp(false, display);
            display = Screen.getDisplay(display.id + '');
        }
        return this._self.insertOrUpdate({
            display_id: display.id + '',
        }, {
            display_id: display.id + '',
            display_rp: screen.display_rp,
            display_info: JSON.stringify(display),
            screen_name: screen.name,
            screen_title: screen.title,
            date_add: datetime.now(),
        });
    };

    /**
     * 根据设备 id 获取设备信息
     *
     * @param display_id
     * @returns {*}
     */
    this.getByDisplayId = function (display_id) {
        return this._self.selectFirst({display_id: display_id + ''});
    };

    /**
     * 通过桌面 id 获取设备集合
     *
     * @param ld_id
     */
    this.getsByDeskId = function (ld_id) {
        return this._self.select({ld_id: ld_id + ''});
    };

    /**
     * 判断是否有桌面使用了目标桌面, 如果有就返回设备信息(第一个), 反之, 返回 false 即可.
     *
     * @param ld_id
     */
    this.anyDisplayHasDesk = function (ld_id) {
        return this._self.exist({ld_id: ld_id + ''});
    };

    /**
     * 判断主屏幕是否启用了 TA
     *
     * @param ld_id
     * @returns {*}
     */
    this.primaryDisplayHasDesk = function (ld_id) {
        return this._self.exist({ld_id: ld_id + '', screen_title: '主屏幕'});
    };

    /**
     * 获取所有配置了桌面的设备信息
     */
    this.getDisplaysHasDesk = function () {
        return this._self.execSelect("select * from "
            + Model.tbname(model)
            + " where "
            + Model.fieldname(model, 'ld_id')
            + " != null"
            + " and "
            + Model.fieldname(model, 'ld_id')
            + " != ''");
    };

    /**
     * 设置 API 开关, 约定 true 为 2, false 为 1.
     *
     * @param display_id
     * @param key
     * @param bol
     */
    this.setApi = function (display_id, key, bol) {
        var obj = {};
        obj[('api_' + key)] = (bol ? 2 : 1);
        var cod = {};
        if (display_id) {
            cod = {
                display_id: display_id + ''
            };
        }
        return this._self.update(cod, obj);
    };

    /**
     * 判断 API 开关
     *
     * @param display_id
     * @param key
     * @param bol
     */
    this.isApi = function (display_id, key, bol) {
        var obj = {};
        obj[('api_' + key)] = (bol ? 2 : 1);
        var cod = {};
        if (display_id) {
            cod = {
                display_id: display_id + ''
            };
        }
        return this._self.count(obj);
    };

    /**
     * 为目标设备(集合)设置桌面
     *
     * @param display_ids
     * @param ld_id
     */
    this.setsDesk = function (display_ids, ld_id) {
        return this._self.exec("update "
            + Model.tbname(model)
            + " set "
            + Model.fieldname(model, 'ld_id')
            + " = " + ld_id
            + " where "
            + Model.fieldname(model, 'display_id')
            + " in ("
            + display_ids.join(",")
            + ")");
    };

    /**
     * 为目标设备(集合)清除桌面
     *
     * @param ld_ids
     */
    this.removesDesk = function (ld_ids) {
        return this._self.exec("update "
            + Model.tbname(model)
            + " set "
            + Model.fieldname(model, 'ld_id')
            + " = 0" +
            +" where "
            + Model.fieldname(model, 'ld_id')
            + " in ("
            + ld_ids.join(",")
            + ")");
    };

    this.init();//自动初始化.
}

module.exports = (model) => {
    return new DeviceDeskDao(model);
};