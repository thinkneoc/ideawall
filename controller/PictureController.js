const baseController = proxy.require('../controller/BaseController');
const http = proxy.require('../core/Http');
const localDeskModel = proxy.require('../model/LocalDeskModel')();
const mediaModel = proxy.require('../model/MediaModel')();

var vm = new Vue({
    el: '#app',
    data: function () {
        return {
            loading: true,
            lock: proxy.lock,
            preview: T.p('preview'),
            display: {},
            desk: {
                medias: []
            },
            params: {//约定域参数
                initialIndex: '0',
                interval: 10000,
                direction: 'horizontal',
                sx: '+',
            },
            carousel: {//走马灯焦点图
                type: '',//类型: card/''
                autoplay: true,//自动切换
                loop: true,//循环
                trigger: '',//指示器触发方式: click/''
                indicatorPosition: 'none',//指示器: outside/none/''
                arrow: 'never',//切换箭头的显示时机: always/hover/never
                data: [],
            },
            animation: {
                in: '',
                out: '',
            },
            prefs: [],
            prefs_supports: {//支持的偏好配置项
                wholeAudioVolumn: {//全局音量
                    value: 1.0,
                    bindkey: 'val',
                },
                deskAnimationOn: {//入场
                    value: '',
                    bindkey: 'val',
                },
                deskAnimationOut: {//出场动画
                    value: '',
                    bindkey: 'val',
                },
            }
        }
    },
    methods: {
        calcData() {
            this.carousel.data = [];
            for (var x in this.desk.medias) {
                var zxx = this.desk.medias[x].filepath;
                if (mediaModel.isLocalMediaEffect(zxx)) {
                    this.carousel.data.push('<img class="picture_carousel" src="' + zxx + '" style="width:100%;height:100%;"/>');
                }
            }
            if (this.carousel.data.length <= 0) {
                top.vm.showEmptyTip(true);
            } else if (this.carousel.data.length <= 1) {//如果只有一张图片, 就不自动切换
                this.carousel.autoplay = false;
            } else if (this.params.sx === '-') {
                return this.carousel.data.reverse();
            }
            return this.carousel.data;
        },
        //约定域参数计算
        calcParams() {
            var that = this;
            if (that.desk.params) {
                that.desk.params = JSON.parse(that.desk.params);
                Object.assign(that.params, that.desk.params);
                console.debug(that.params);
            }
        },
        //偏好配置支撑
        supportPrefs() {
            //...
            if(this.prefs_supports.deskAnimationOn.value != this.animation.in && this.animation.in == ''){
                if (this.prefs_supports.deskAnimationOn.value == 'random') {
                    this.prefs_supports.deskAnimationOn.value = animation.getAnimateIn();
                }
                this.animation.in = this.prefs_supports.deskAnimationOn.value;
            }
            if(this.prefs_supports.deskAnimationOut.value != this.animation.in && this.animation.out == '') {
                if (this.prefs_supports.deskAnimationOut.value == 'random') {
                    this.prefs_supports.deskAnimationOut.value = animation.getAnimateOut();
                }
                this.animation.out = this.prefs_supports.deskAnimationOut.value;
            }
        },
        //处理全局偏好配置项
        dealWithPrefs(prefs) {
            this.prefs = prefs;
            for (var x in prefs) {//遍历每一项配置
                var zxx = prefs[x];
                var values = JSON.parse(zxx.value);
                var key = zxx.key;
                if (this.prefs_supports.hasOwnProperty(key)) {//本地接收处有该配置项
                    if (values.hasOwnProperty(this.prefs_supports[key].bindkey)) {//配置项中有需要绑定的 key.
                        this.prefs_supports[key].value = values[this.prefs_supports[key].bindkey];
                    }
                }
            }
            this.supportPrefs();
        },
    },
    created: function () {
        this.calcData();
    },
    mounted() {
        var that = this;
        //接收更新指令
        proxy.ipc.on('ipc_wall_update', function (event, data, dp, prefs) {
            console.debug('ipc_wall_update');
            console.debug(data);
            console.debug(dp);
            console.debug(prefs);
            var tmpDesk = that.desk;
            that.desk = data;
            that.display = dp;
            that.dealWithPrefs(prefs);
            if (dp && dp.api_pause == 2) {
                that.carousel.autoplay = false;
                console.debug('幻桌面接收到 ipc 暂停指令');
            } else {
                console.debug('幻桌面接收到 ipc 启动指令');
                if (that.desk.medias.length <= 1) {//如果只有一张图片, 就不自动切换
                    that.carousel.autoplay = false;
                } else {
                    that.carousel.autoplay = true;
                }
            }
            if (that.desk.medias.toString() != tmpDesk.medias.toString()) {
                that.calcData();
            }
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