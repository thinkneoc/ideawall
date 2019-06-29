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
        cprefix: 'ld_',//列前缀
        name: 'localdesk',//名称.
        anno: '本地桌面数据表', //注释信息
        columns: {//列, 传入一个对象
            id: null,//唯一标识 id
            author: '',//作者
            name: '',//名称
            ename: '',//英文名称
            description: '',//描述信息
            preview: '',//预览图
            date_get: datetime.now(),//获取时间
            type: '',//桌面类型: picture|video|page
            init_sign: 1,//初始化配置标识
            source_type: '',//源类型: local/remote
            source_val: '',//源值: remote URL / local File Path
            // audios: [],//音频地址集合
            switch_media: 2,//是否支持配置媒体组, 该配置仅对超桌有效
            switch_source: 1,//是否支持更改桌面源, 该配置仅对超桌有效
            // containerConfig: {},//容器配置, emmm... 就是 iframe 的参数, 可以配置比如 scolling 等参数
            params: '',//参数
            readme_path: '',//Readme Path 配定
        },
    };
});

/**
 * 本地-我的桌面数据模型
 * 如果要用到 initial 方法, 应该传入 appVar
 *
 * @constructor
 */
function LocalDeskModel(appVar) {

    this.dao = undefined;

    this.init = function () {
        this.dao = require('../dao/LocalDeskDao')(model);
    };

    this.initial = function () {
        var defaults = [
            {
                author: '周曦',
                name: '默认幻桌',
                ename: 'default-picture-desktop',
                description: 'ideawall 缺省幻灯片桌面',
                preview: '',
                type: 'picture',
                source_type: 'local',
                source_val: appVar._viewpath + '/components/wall/Picture.html',
                params: '',
                switch_media: 2,
                switch_source: 1,
                init_sign: 1,
                readme_path: '',
                date_get: datetime.now(),
            },
            {
                author: '周曦',
                name: '默认视桌',
                ename: 'default-video-desktop',
                description: 'ideawall 缺省动态视频桌面',
                preview: '',
                type: 'video',
                source_type: 'local',
                source_val: appVar._viewpath + '/components/wall/Video.html',
                params: '',
                switch_media: 2,
                switch_source: 1,
                init_sign: 1,
                readme_path: '',
                date_get: datetime.now(),
            },
            {
                author: '周曦',
                name: '默认超桌',
                ename: 'default-page-desktop',
                description: 'ideawall 缺省超桌面',
                preview: '',
                type: 'page',
                source_type: 'remote',
                source_val: 'cn.bing.com',
                params: '',
                switch_media: 1,
                switch_source: 2,
                init_sign: 1,
                readme_path: '',
                date_get: datetime.now(),
            }
        ];
        this.dao.initial(defaults);
        return this;
    };

    this.getDeskTypeName = function (typeCode) {
        if (typeCode === 'picture') {
            return {name: '幻桌', fullname: '幻灯桌面', style: ''};
        } else if (typeCode === 'video') {
            return {name: '视桌', fullname: '视频桌面', style: 'success'};
        } else if (typeCode === 'page') {
            return {name: '超桌', fullname: '超桌面', style: 'danger'};
        } else {
            return {name: 'X桌', fullname: '未知类型', style: 'info'};
        }
    };

    /**
     * 计算主入口文件路径
     *
     * @param obj
     */
    this.getIndexPath = function (obj) {
        var sourceType = obj.source_type;
        var indexPath = obj.source_val;
        if (indexPath && (indexPath + '').trim() !== '' && sourceType && (sourceType + '').trim() !== '') {
            if (sourceType === 'local') {//本地: 检查一下是否存在 [本地优先级: md > html]
                if (fs.existsSync(indexPath)) {
                    return indexPath;
                }
            } else {//远程: 没有协议的加上协议 [远程优先级: html > md, 在 README 预览窗口内进行处理, 如果 html 加载不到就去加载 md. ]
                return (indexPath.indexOf('http') !== 0) ? ('http://' + indexPath) : indexPath;//兼容 http://和 https://, 暂时不考虑 ftp:// 协议.
            }
        }
        return false;
    };

    /**
     * 获取 readme 文件的路径位置
     * 注意: README 文件必须在源入口文件的同级目录位置, 名字必须为 README, 暂时仅支持 html.
     *
     * @param obj 按理来讲, 传入 source 就可以了.
     */
    this.getReadmePath = function (obj) {
        var sourceType = obj.source_type;
        var indexPath = obj.source_val;
        var xReadmePath = obj.readme_path;
        var readmePath = '';
        if (xReadmePath && xReadmePath != null && (xReadmePath + '').trim() != '') {//如果手动配置了
            readmePath = xReadmePath;
            if (sourceType === 'local') {
                if (fs.existsSync(readmePath)) {
                    return readmePath;
                }
            } else {
                return readmePath;
            }
        } else if (indexPath && (indexPath + '').trim() !== '' && sourceType && (sourceType + '').trim() !== '') {//如果没有手动配置, 检测一下...
            if (sourceType === 'local') {//本地: 检查一下是否存在
                readmePath = indexPath.substring(0, indexPath.lastIndexOf('/')) + '/README';
                readmePath = readmePath + '.html';
                console.debug(readmePath);
                if (fs.existsSync(readmePath)) {
                    return readmePath;
                }
            } else {//远程: 没有协议的加上协议  => 远程源的 readme 仅支持通过配置手动指定.
                // indexPath = (indexPath.indexOf('http') !== 0) ? ('http://' + indexPath) : indexPath;
                // var prefix = indexPath.substring(0, indexPath.lastIndexOf('/'));
                // if (prefix && (prefix + '').trim() != '') {
                //     prefix = (prefix + '').trim() + '/';
                //     if (prefix === 'http://' || prefix === 'https://') {
                //         readmePath = indexPath + '/README';
                //     } else {
                //         readmePath = indexPath.substring(0, indexPath.lastIndexOf('/')) + '/README';
                //     }
                //     readmePath = readmePath + '.html';
                //     console.debug(readmePath);
                //     return (readmePath.indexOf('http') !== 0) ? ('http://' + readmePath) : readmePath;//兼容 http://和 https://, 暂时不考虑 ftp:// 协议.
                // }
            }
        }
        return false;
    };

    /**
     * 桌面源是否有效
     *
     * @param obj
     */
    this.isSourceEffect = function (obj) {
        var sourceType = obj.source_type;
        var indexPath = obj.source_val;
        if (indexPath && (indexPath + '').trim() !== '' && sourceType && (sourceType + '').trim() !== '') {
            if (sourceType === 'local') {//本地: 检查一下是否存在
                if (fs.existsSync(indexPath)) {
                    return indexPath;
                }
            } else {//远程: 没有协议的加上协议
                return (indexPath.indexOf('http') !== 0) ? ('http://' + indexPath) : indexPath;//兼容 http://和 https://, 暂时不考虑 ftp:// 协议.
            }
        }
        return false;
    };

    this.isExist = function (desk) {
        return this.dao.isExist(desk);
    };

    this.addDesk = function (desk) {
        return this.dao.addDesk(desk);
    };

    this.getDesk = function (desk_id) {
        return this.dao.getDeskById(desk_id + '');
    };

    this.selectAll = function () {
        return this.dao.getPage();
    };

    /**
     * 根据 id 更新数据
     *
     * @param obj
     * @param dontsync 不要发送同步指令.
     */
    this.updateById = function (obj, dontsync) {
        obj.init_sign = 2;
        this.dao.updateById(obj);
        !dontsync ? this.syncUpdate() : '';
    };

    this.deleteById = function (id) {
        return this.dao.deleteById(id);
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
    return new LocalDeskModel(appVar);
};
