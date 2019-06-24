const path = require('path');
const fs = require('fs');
const crypto = require('./Crypto');
const config_file_path = __dirname + "/../config/appconfig.json";
const global_default_val = undefined;
const json_config = fs.readFileSync(config_file_path);

/**
 * 读取配置项并返回配置数据
 * 新增支持配置默认值, 若不传入配置项键, 则直接返回整体值.
 *
 * @kind AnyProcess [任意进程调用]
 * @param {string} configname 配置项名称
 * @param {string} defaultval 默认值传递
 */
function get(configname, defaultval) {
    try {
        let config_obj_ = JSON.parse(json_config);
        if (configname) {
            if (!config_obj_[configname]) {
                return defaultval ? defaultval : global_default_val;
            }
            return config_obj_[configname];
        } else {
            return config_obj_;
        }
    } catch (e) {
        return defaultval ? defaultval : global_default_val;
    }
}

module.exports = {
    get,
};