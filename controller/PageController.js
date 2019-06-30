const baseController = proxy.require('../controller/BaseController');
const http = proxy.require('../core/Http');
const localDeskModel = proxy.require('../model/LocalDeskModel')();

var vm = new Vue({
    el: '#app',
    data: function () {
        return {
            loading: true,
            lock: proxy.lock,
            preview: T.p('preview'),
            desk: {},
            source_type: '', //超桌源
            source_val: '',
            params: { //约定域参数

            },
            animation: {
                in: '',
                out: '',
            },
            prefs: [],
            prefs_supports: { //支持的偏好配置项
                wholeAudioVolumn: { //全局音量
                    value: 1.0,
                    bindkey: 'val',
                    change: function (_this, _pref, ov, nv) {
                        _pref.value = nv;
                    }
                },
                deskAnimationOn: { //入场
                    value: '',
                    bindkey: 'val',
                    change: function (_this, _pref, ov, nv) {
                        if (ov == nv) return false;
                        _pref.value = nv;
                        _this.animation.in = (nv == 'random') ? animation.getAnimateIn() : _pref.value;
                    }
                },
                deskAnimationOut: { //出场动画
                    value: '',
                    bindkey: 'val',
                    change: function (_this, _pref, ov, nv) {
                        if (ov == nv) return false;
                        _pref.value = nv;
                        _this.animation.ou = (nv == 'random') ? animation.getAnimateOut() : _pref.value;
                    }
                },
            }
        }
    },
    methods: {
        calcData() {
            if (this.desk.source_type && this.desk.source_val) {
                this.source_type = this.desk.source_type;
                this.source_val = proxy.link(localDeskModel.getIndexPath(this.desk));
            }
        },
        //约定域参数计算
        calcParams() {
            var that = this;
            if (that.desk.params) { //暂时不需要.
                that.desk.params = JSON.parse(that.desk.params);
                Object.assign(that.params, that.desk.params);
            }
        },
        //处理全局偏好配置项
        dealWithPrefs(prefs) {
            this.prefs = prefs;
            for (var x in prefs) { //遍历每一项配置
                var zxx = prefs[x];
                var values = JSON.parse(zxx.value);
                var key = zxx.key;
                if (this.prefs_supports.hasOwnProperty(key)) { //本地接收处有该配置项
                    if (values.hasOwnProperty(this.prefs_supports[key].bindkey)) { //配置项中有需要绑定的 key.
                        this.prefs_supports[key].change(this, this.prefs_supports[key], this.prefs_supports[key].value, values[this.prefs_supports[key].bindkey]);
                    }
                }
            }
        },
    },
    created: function () {
        this.calcData(true);
    },
    mounted() {
        var that = this;
        //接收更新指令
        proxy.ipc.on('ipc_wall_update', function (event, data, dp, prefs) {
            console.debug('ipc_wall_update');
            console.debug(data);
            console.debug(dp);
            console.debug(prefs);
            that.desk = data;
            that.display = dp;
            that.dealWithPrefs(prefs);
            if (dp && dp.api_pause == 2) {
                console.debug('超桌面接收到 ipc 暂停指令');
            } else {
                console.debug('超桌面接收到 ipc 启动指令');
            }
            proxy.ipc.send('ipc_repeat', 'ipc_wall_showtip', false);
            that.calcData();
            that.calcParams();
        });
        proxy.ipc.on('ipc_lock_req', function (event, swicth) {
            proxy.lock = swicth;
            proxy.appVar._lock = swicth;
            proxy.refreshAppVar();
            that.lock = swicth;
        });
    }
});

window.onload = function () {
    vm.loading = false;
};

$(function () {

});
