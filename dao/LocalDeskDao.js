const Model = require('../core/Model')();
const datetime = require('../core/Datetime')();
const Electron = require('electron');

const initscript = '' +
    'CREATE TABLE IF NOT EXISTS "iw_localdesk" (\n' +
    '  "ld_id" integer NOT NULL ON CONFLICT IGNORE PRIMARY KEY AUTOINCREMENT,\n' +
    '  "ld_author" text(30),\n' +
    '  "ld_name" text(50),\n' +
    '  "ld_ename" text(80),\n' +
    '  "ld_description" text(256),\n' +
    '  "ld_preview" text(500),\n' +
    '  "ld_date_get" text(30),\n' +
    '  "ld_type" text(20) DEFAULT page,\n' +
    '  "ld_init_sign" integer(1) DEFAULT 1,\n' +
    '  "ld_source_type" text(10) DEFAULT local,\n' +
    '  "ld_source_val" text(500),\n' +
    '  "ld_switch_media" integer(1) DEFAULT 2,\n' +
    '  "ld_switch_source" integer(1) DEFAULT 1,\n' +
    '  "ld_params" text(1000) DEFAULT \'\',\n' +
    '  "ld_readme_path" text(500),\n' +
    '  CONSTRAINT "ld_key_id" UNIQUE ("ld_id" COLLATE NOCASE ASC) ON CONFLICT IGNORE\n' +
    ');';

/**
 * 设备桌面 Dao 层.
 *
 * @param model
 * @constructor
 */
function LocalDeskDao(model) {

    this._self = undefined;

    this.init = function () {
        model.initscript = initscript;
        this._self = require('../core/Database')(model);
    };

    /**
     * 初始化工作, 用于监测默认数据是否存在, 不存在就插入进入
     * @param defaults
     * @returns {LocalDeskDao}
     */
    this.initial = function (defaults) {
        for (var x in defaults) {
            var zxx = defaults[x];
            if (!this._self.exist({
                ename: zxx.ename
            })) {//未存在
                this._self.insert(Model.field(model, zxx));
            }
        }
        return this;
    };

    /**
     * 获取所有桌面数据, 等待修正为分页获取.
     */
    this.getPage = function () {
        return this._self.selectAll();
    };

    /**
     * 根据 id 获取桌面数据
     *
     * @param id
     * @returns {*}
     */
    this.getDeskById = function (id) {
        return this._self.selectFirst({id: id});
    };

    /**
     * 根据 id 更新数据
     *
     * @param obj
     * @returns {*}
     */
    this.updateById = function (obj) {
        if (obj.params) {
            obj.params = JSON.stringify(obj.params);
        }
        return this._self.update({id: obj.id}, obj);
    };

    this.init();//自动初始化.
}

module.exports = (model) => {
    return new LocalDeskDao(model);
};