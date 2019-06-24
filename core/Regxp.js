/**
 * 常用正则
 * @constructor
 */
var Regxp = function () {

    this.password = /^[a-zA-Z]{1}([a-zA-Z0-9]|[._]){5,31}$/;

    this.email = new RegExp("^[a-z0-9]+([._\\-]*[a-z0-9])*@([a-z0-9]+[-a-z0-9]*[a-z0-9]+.){1,63}[a-z0-9]+$");

    this.mobile = /^[1][3,4,5,7,8][0-9]{9}$/;

    this.idcard = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/;

    this.hanzi = /.*[\u4e00-\u9fa5]+.*$/;//含有汉字

    this.tag = /(^(?!_)(?!.*?_$)[a-zA-Z0-9_\u4e00-\u9fa5]+$)/;//只含有汉字、数字、字母、下划线(不能以下划线开头和结尾)

    this.zhengshu = /^\+?[1-9]\d*$/;


    /**
     * 判断是否含有Emoji表情[utf8mb4]
     *
     * @param substring
     * @returns {boolean}
     */
    this.hasEmoji = function (substring) {
        for (var i = 0; i < substring.length; i++) {
            var hs = substring.charCodeAt(i);
            if (0xd800 <= hs && hs <= 0xdbff) {
                if (substring.length > 1) {
                    var ls = substring.charCodeAt(i + 1);
                    var uc = ((hs - 0xd800) * 0x400) + (ls - 0xdc00) + 0x10000;
                    if (0x1d000 <= uc && uc <= 0x1f77f) {
                        return true;
                    }
                }
            } else if (substring.length > 1) {
                var ls = substring.charCodeAt(i + 1);
                if (ls == 0x20e3) {
                    return true;
                }
            } else {
                if (0x2100 <= hs && hs <= 0x27ff) {
                    return true;
                } else if (0x2B05 <= hs && hs <= 0x2b07) {
                    return true;
                } else if (0x2934 <= hs && hs <= 0x2935) {
                    return true;
                } else if (0x3297 <= hs && hs <= 0x3299) {
                    return true;
                } else if (hs == 0xa9 || hs == 0xae || hs == 0x303d || hs == 0x3030
                    || hs == 0x2b55 || hs == 0x2b1c || hs == 0x2b1b
                    || hs == 0x2b50) {
                    return true;
                }
            }
        }
        return false;
    };

    /**
     * 统计包含汉字的字符个数
     * 汉字占2个字符，非汉字占1个字符
     *
     * @param chars
     * @returns {number}
     */
    this.checksum = function (chars) {
        var sum = 0;
        for (var i = 0; i < chars.length; i++) {
            var c = chars.charCodeAt(i);
            if ((c >= 0x0001 && c <= 0x007e) || (0xff60 <= c && c <= 0xff9f)) {
                sum++;
            } else {
                sum += 2;
            }
        }
        return sum;
    }

};

module.exports = () => {
    new RegxpUtil()
};