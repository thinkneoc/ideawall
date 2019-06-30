const logger = require('../core/Logger');
const uuid = require('../core/UUID')();
const datetime = require('../core/Datetime')();
const Model = require('../core/Model')();
const fs = require("fs");
const os = require("os");

let model = new (function () {
    //数据表信息
    this.tbinfo = {
        tprefix: 'iw_',//表前缀
        cprefix: 'p_',//列前缀
        name: 'preference',//名称.
        anno: '偏好设置数据表', //注释信息
        columns: {//列, 传入一个对象
            id: null,//唯一标识 id
            key: '',//设置键
            value: {},//设置值
            name: '',//设置名称
            description: '',//描述
            remark: '',//备注
            type: 'common',//类别
            formitem: '',//表单类型
            sort: 100,//排序
            reboot: 1,//是否需要重新启动生效
            sync: 1,//是否需要同步到设备桌面
            explicit: 2,//是否显式
        },
    };
});

let defaults = [
    {
        type: 'common',
        formitem: 'switch',
        key: 'autoOpenControl',
        name: '启动控制面板',
        description: '启动之后立即打开 ideawall 控制面板',
        sort: 15,
        reboot: 1,
        explicit: 2,
        value: {
            enable: false,
        },
    },
    {
        type: 'common',
        formitem: 'input_number',
        key: 'deviceSnapscreenTTL',
        name: '设备快照间隔',
        description: '单位: 毫秒, 为 0 代表仅启动时刻快照一次. 该配置将有效降低能耗.',
        sort: 20,
        reboot: 2,
        explicit: 2,
        value: {
            val: os.platform() === 'darwin' ? 3000 : 6000,//当前数值
            precision: 0,//小数位
            step: 3000,//步长
            stepStrictly: true,//严格模式, 是否只能输入 step 的倍数
            max: os.platform() === 'darwin' ? 30000 : 30000,//最大值
            min: 0,//最小值
            controlsPosition: '',//按钮位置
            descNewLine: true,//描述信息新起一行
        },
    },
    {
        type: 'common',
        formitem: 'slider',
        key: 'wholeAudioVolumn',
        name: '全局音频音量',
        description: '',
        sort: 30,
        reboot: 1,
        sync: 2,
        explicit: 2,
        value: {
            val: 1.0,//当前数值
            step: 0.1,//步长
            showStops: true,//展示间断点
            showInput: true,//是否带输入框
            showInputControls: true,//在显示输入框的情况下，是否显示输入框的控制按钮
            inputSize: 'mini',//输入框的尺寸
            showTooltip: true,//是否显示 tooltip
            marks: {//标记展示
                0: '0',
                0.5: '0.5',
                1.0: '1.0',
            },
            max: 1.0,//最大值
            min: 0,//最小值
            descNewLine: true,//描述信息新起一行
        },
    },
    {
        type: 'animation',
        formitem: '',
        key: 'deskAnimationOn',
        name: '桌面源入场动画',
        description: '',
        sort: 210,
        reboot: 1,
        sync: 1,
        explicit: 2,
        value: {
            val: 'random',//当前数值
            descNewLine: true,//描述信息新起一行
        },
    },
    {
        type: 'animation',
        formitem: '',
        key: 'deskAnimationOut',
        name: '桌面源离场动画',
        description: '',
        sort: 220,
        reboot: 1,
        sync: 1,
        explicit: 2,
        value: {
            val: 'random',//当前数值
            descNewLine: true,//描述信息新起一行
        },
    },
    {
        type: 'implicit',
        formitem: '',
        key: 'dontshowTipAfter_setDesk',
        name: '设置桌面后不再提醒快捷键提示消息',
        description: '',
        explicit: 1,
        value: {
            val: false,
        },
    },
    {
        type: 'implicit',
        formitem: '',
        key: 'dontshowTipAfter_changePref',
        name: '偏好设置变更后不再提醒重启提示消息',
        description: '',
        explicit: 1,
        value: {
            val: false,
        },
    }
];

/**
 * 偏好设置数据模型
 *
 * @constructor
 */
function PreferenceModel(appVar) {

    this.dao = undefined;

    this.init = function () {
        this.dao = require('../dao/PreferenceDao')(model);
    };

    /**
     * 手动初始化: 检测常规配置项是否存在, 不存在就创建, 否则就不管
     */
    this.initial = function () {
        for (var x in defaults) {
            var zxx = defaults[x];
            var pref = this.getByKey(zxx.key);
            if (!pref) {//如果不存在, 就加进去, 如果存在, 就不管.
                this.add(zxx);
            }
        }
    };

    this.clearDatabase = function () {
        return this.dao.clearDatabase();
    };

    this.getAll = function () {
        return this.dao.getAll();
    };

    this.getByKey = function (key) {
        return this.dao.getByKey(key);
    };

    this.getNeedSync = function () {
        return this.dao.getNeedSync();
    };

    this.updateById = function (obj) {
        return this.dao.updateById(obj);
    };

    this.updateByKey = function (obj) {
        return this.dao.updateByKey(obj);
    };

    this.add = function (obj) {
        return this.dao.add(Model.field(model, obj));
    };

    this.init();//自动初始化
}

module.exports = (appVar) => {
    return new PreferenceModel(appVar);
};
