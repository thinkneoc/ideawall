/**
 * 基层算法封装库
 *
 * @author troy
 * @date 2019/01/21 08:50 PM
 */
function Lang() {

    this.init = function () {
    };

    /**
     * 判断是否是数组 最佳算法.
     * @param va
     * @returns {arg is Array<any>|boolean}
     */
    this.isArray = function (va) {
        if (typeof Array.isArray === "function") {
            return Array.isArray(va);
        } else {
            return Object.prototype.toString.call(va) === "[object Array]";
        }
    };

    /**
     * 判断是否字符串 最简单方法
     *
     * @param string
     * @returns {boolean}
     */
    this.isString = function (string) {
        return (typeof (string) == 'string');
    };

    /**
     * 判断字符串是否以指定字符串开头
     *
     * @param string
     * @param tstr
     */
    this.startsWith = function (string, tstr) {
        if (this.isString(string) && this.isString(tstr)) {
            return (string.indexOf && string.indexOf(tstr) === 0);
        }
    };

    /**
     * 判断字符串是否以指定字符串结尾
     *
     * @param string
     * @param tstr
     */
    this.endsWith = function (string, tstr) {
        if (this.isString(string) && this.isString(tstr)) {
            if (string.length >= tstr.length) {
                return (string.substr(0, tstr.length) === tstr);
            }
        }
    };

    /**
     * json 对象转 url 字符串, 仅限简单对象
     *
     * @param json
     */
    this.json2UrlParams = function (json) {
        var params = '';
        if (json) {
            for (var x in json) {
                params = params + '&' + x + '=' + json[x];
            }
        }
        return params;
    };

    this.init();//自动初始化.
}

module.exports = () => {
    return new Lang();
};

