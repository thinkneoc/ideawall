/**
 * UUID库[主进程和渲染进程通用, 需要在ideanote.js引用之后调用].
 *
 * @author troy
 * @date 2019/01/21 05:29 PM
 */
const uuidv1 = require('uuid/v1');//基于时间戳, 生成并返回RFC4122 v1（基于时间戳的）UUID.
const uuidv3 = require('uuid/v3');//基于命名空间, 生成并返回RFC4122 v3 UUID.
const uuidv4 = require('uuid/v4');//基于随机数, 生成并返回RFC4122 v4 UUID.

function UUID() {

    this.id = '';//默认算法生成的默认id

    //初始化时候即生成默认id.
    this.init = function () {
        this.id = this.serial();
    };

    //常规序列生成算法
    this.serial = function (numCount, wordCount, myDefinedSN) {
        numCount = numCount ? numCount : 6;
        wordCount = wordCount ? wordCount : 2;
        myDefinedSN = myDefinedSN ? ("-" + myDefinedSN) : "";
        var timestamp = new Date().getTime();//需要13位毫秒级时间戳
        var $nums = '0123456789';
        var numsRandom = '';
        for (i = 0; i < numCount; i++) { //需要6位随机数字
            numsRandom += $nums.charAt(Math.floor(Math.random() * $nums.length));
        }
        var $chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
        var charsRandom = '';
        for (i = 0; i < wordCount; i++) { //需要2位随机字母
            charsRandom += $chars.charAt(Math.floor(Math.random() * $chars.length));
        }
        return charsRandom + timestamp + numsRandom + myDefinedSN;//13位时间戳(毫秒级) + 8位随机数(2位字母置于开头, 6位数字置于结尾)
    };

    this.v1 = function () {
        return uuidv1();
    };

    this.v3 = function (name, namespace) {
        return uuidv3(name, namespace);
    };

    this.v4 = function () {
        return uuidv4();
    };


    this.init();//自动初始化.
}

module.exports = () => {
    return new UUID();
};

