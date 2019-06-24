const logger = require('../core/Logger');
const uuid = require('../core/UUID')();
const datetime = require('../core/Datetime')();
const Model = require('../core/Model')();
const fs = require("fs");

const deviceMessage = require('../message/DeviceMessage')();

let model = new (function () {
    //数据表信息
    this.tbinfo = {
        tprefix: 'iw_',//表前缀
        cprefix: 'm_',//列前缀
        name: 'media',//名称.
        anno: '桌面媒体数据表', //注释信息
        columns: {//列, 传入一个对象
            id: null,//唯一标识 id
            filename: '',//文件名
            filepath: '',//文件路径
            date_add: datetime.now(),//添加时间
            ld_id: null,//目标桌面
        },
    };
});

/**
 * 本地-我的桌面数据模型
 *
 * @constructor
 */
function MediaModel(appVar) {

    this.dao = undefined;

    this.parent = undefined;

    this.init = function () {
        this.dao = require('../dao/MediaDao')(model);
        this.parent = require('../model/LocalDeskModel')(model);
    };

    this.isLocalMediaEffect = function (mediaPath) {
        if (mediaPath && (mediaPath + '').trim() !== '' && (mediaPath + '').trim().indexOf('http') !== 0) {//非网络媒体
            if (fs.existsSync(mediaPath)) {
                return mediaPath;
            }
        }
        return false;
    };

    this.getsByDeskId = function (deskId) {
        return this.dao.getsByDeskId(deskId);
    };

    this.updatesByDeskId = function (deskId, medias) {
        this.dao.updatesByDeskId(deskId, medias);
        this.parent.updateById({id: deskId}, true);//更新掉初始化标记, 并且不发送通信指令.
        this.syncUpdate();
    };

    this.deleteByDeskId = function (deskId, filename, filepath) {
        this.dao.deleteByDeskId(deskId, filename, filepath);
        this.syncUpdate();
    };

    this.clearByDeskId = function (deskId) {
        this.dao.clearByDeskId(deskId);
        this.syncUpdate();
    };

    /**
     * 同步更新信号发送
     */
    this.syncUpdate = function () {
        deviceMessage.syncUpdate();
    };

    this.init();
}

module.exports = (appVar) => {
    return new MediaModel(appVar);
};
