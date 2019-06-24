const global_default_val = "null";

/**
 * 使用localStorage保存简单数据持久化到本地
 * @param {string} key 保存的数据键
 * @param {string} value 保存的数据值
 * @return {boolean} [true]
 */
function set(key, value) {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
}

/**
 * 获取保存在localStorage中的数据
 * @param {string} key 获取数据的键
 * @param {string} dv 默认值
 * @return {string} 获取数据的值
 */
function get(key, dv) {
    try {
        return JSON.parse(window.localStorage.getItem(key));
    } catch (e) {
        return dv ? dv : global_default_val;
    }
}

/**
 * 根据key删除数据
 * @param {string} key 获取数据的键
 * @return {boolean} [true]
 */
function remove(key) {
    window.localStorage.removeItem(key);
    return true;
}

/**
 * 清空数据
 * @returns {boolean}
 */
function clear() {
    window.localStorage.clear();
    return true;
}


/**
 * ---扩展
 * @type {number}
 */


// 过期时间，默认7天
const delay = 7 * 24 * 60 * 60 * 1000;

/**
 * 设置过期时间
 * @param delay
 * @returns {exports}
 */
function setDelay(delay) {
    this.delay = delay;
    return this;
}

/**
 * 判断一个 localStorage 是否过期
 * @param key
 * @returns {boolean}
 */
function isExpire(key) {
    var isExpire = true,
        value = window.localStorage.getItem(key),
        now = new Date().getTime();

    if (value) {
        value = JSON.parse(value);
        // 当前时间是否大于过期时间
        isExpire = now > value._delay;
    } else {
        // 没有值也是过期
    }
    return isExpire;
}

/**
 * 设置 localStorage
 * @param key
 * @param value
 */
function setEx(key, value) {
    window.localStorage.removeItem(key);//在添加之前，先删除，防止在ios等设备下的QUOTA_EXCEEDED_ERR异常
    var isObject = value instanceof Object,
        _time = new Date().getTime(),
        _delay = this.delay;

    // 如果不是对象，新建一个对象把 value 存起来
    if (!isObject) {
        var b = value;
        value = {};
        value._value = b;
    }
    // 加入时间
    value._time = _time;
    // 过期时间
    value._delay = _time + _delay;
    // 是否一个对象
    value._isObject = isObject;
    window.localStorage.setItem(key, JSON.stringify(value));
    return this;
}

/**
 * 获取某个 localStorage 值
 * @param key
 * @returns {*}
 */
function getEx(key) {
    var isExpire = this.isExpire(key),
        value = null;
    if (!isExpire) {
        value = window.localStorage.getItem(key);
        value = JSON.parse(value);
        if (!value._isObject) {
            value = value._value;
        }
    }
    return value;
}

module.exports = {
    set,
    get,
    remove,
    clear,
    setDelay,
    isExpire,
    setEx,
    getEx
}