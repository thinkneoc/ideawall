const Model = require('../core/Model')();
const datetime = require('../core/Datetime')();

const c_tbs = ['iw_devicedesk', 'iw_media', 'iw_localdesk', 'iw_preference'];

const initscript = '' +
    'CREATE TABLE IF NOT EXISTS "iw_preference" (\n' +
    '  "p_id" integer NOT NULL ON CONFLICT IGNORE PRIMARY KEY AUTOINCREMENT,\n' +
    '  "p_key" text(30),\n' +
    '  "p_name" text(50),\n' +
    '  "p_description" text(500),\n' +
    '  "p_remark" text(500),\n' +
    '  "p_value" text(2000),\n' +
    '  "p_type" text(30) DEFAULT common,\n' +
    '  "p_formitem" text(30),\n' +
    '  "p_sort" integer(6) DEFAULT 100,\n' +
    '  "p_reboot" integer(1) DEFAULT 1,\n' +
    '  "p_sync" integer(1) DEFAULT 1,\n' +
    '  "p_explicit" integer(1) DEFAULT 2,\n' +
    '  "p_os" text(10),\n' +
    '  CONSTRAINT "p_key_id" UNIQUE ("p_id" COLLATE NOCASE ASC) ON CONFLICT IGNORE\n' +
    ');';

/**
 * 偏好设置 Dao 层.
 *
 * @param model
 * @constructor
 */
function PreferenceDao(model) {

    this._self = undefined;

    this.init = function () {
        model.initscript = initscript;
        this._self = require('../core/Database')(model);
    };

    /**
     * 清空所有的数据库
     * @param tablename
     */
    this.clearDatabase = function (tablename) {
        if (tablename) {
            this._self.dropTable(tablename);
        } else {
            for (var x in c_tbs) {
                this._self.dropTable(c_tbs[x]);
            }
        }
    };

    /**
     * 通过键获取设置项
     *
     * @param key
     */
    this.getByKey = function (key) {
        return this._self.selectFirst({key: key});
    };

    /**
     * 获取需要同步向设备的配置项, 返回数组
     * @returns {*}
     */
    this.getNeedSync = function () {
        return this._self.select({sync: 2});
    };

    /**
     * 获取所有的设置项
     * @returns {*}
     */
    this.getAll = function () {
        return this._self.selectAll();
    };

    /**
     * 根据 id 更新设置项
     *
     * @param obj
     * @returns {*}
     */
    this.updateById = function (obj) {
        console.debug(obj.value);
        if (obj.value && typeof (obj.value) != 'string') {
            obj.value = JSON.stringify(obj.value);
        }
        return this._self.update({id: obj.id}, obj);
    };

    /**
     * 根据 key 更新设置项
     *
     * @param obj
     * @returns {*}
     */
    this.updateBykey = function (obj) {
        console.debug(obj.value);
        if (obj.value && typeof (obj.value) != 'string') {
            obj.value = JSON.stringify(obj.value);
        }
        return this._self.update({key: obj.key}, obj);
    };

    /**
     * 添加一个配置项
     *
     * @param obj
     * @returns {*}
     */
    this.add = function (obj) {
        if (obj.value && typeof (obj.value) != 'string') {
            obj.value = JSON.stringify(obj.value);
        }
        return this._self.insert(obj);
    };


    this.init();//自动初始化.
}

module.exports = (model) => {
    return new PreferenceDao(model);
};