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
            videos: [],
            params: {
                index: 0,
                sx: '+',
            },
            desk: {
                medias: []
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
                    change: function(_this, _pref, ov, nv){
                        if (_this.videos[_this.params.index]) {
                            _this.videos[_this.params.index].volume = nv;
                        }
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
        init() {
            var that = this;
            if (that.desk.medias && that.desk.medias.length > 0) {
                that.videos = [];
                $('.player-video').remove();
                for (var x in that.desk.medias) {
                    if (mediaModel.isLocalMediaEffect(that.desk.medias[x].filepath)) {
                        var video = document.createElement('video');
                        video.id = 'player-video-' + x;
                        video.className = 'player-video';
                        video.style = 'z-index:' + (999999999 - x) + ';';
                        video.preload = true;
                        video.volume = that.prefs_supports.wholeAudioVolumn.value;//默认为最大声音.
                        video.src = that.desk.medias[x].filepath;         //每次读数组最后一个元素
                        video.addEventListener('ended', vm.playEndedHandler, false);
                        video.loop = (that.desk.medias.length === 1);//禁止循环，否则无法触发ended事件
                        that.preview ? (video.controls = true) : '';
                        that.videos.push(video);
                        document.getElementById('app').appendChild(video);
                    }
                }
                if (that.videos.length <= 0) {
                    top.vm.showEmptyTip(true);
                } else {
                    $('#player-video-' + that.params.index).show();
                    that.videos[that.params.index].play();
                }
            } else {
                that.videos = [];
                $('.player-video').remove();
            }
        },
        playEndedHandler(callback) {
            var that = this;
            if (that.desk.medias.length > 1 && that.videos) {
                $('#player-video-' + that.params.index).fadeOut(500, function () {
                    $(this).css('z-index', $(this).css('z-index') - that.desk.medias.length);
                });
                if (that.params.sx === '-') {
                    that.params.index = that.params.index - 1;
                } else {
                    that.params.index = that.params.index + 1;
                }
                if (that.params.index > (that.desk.medias.length - 1)) {
                    that.params.index = 0;
                } else if (that.params.index < 0) {
                    that.params.index = that.desk.medias.length - 1;
                }
                $('#player-video-' + that.params.index).show();
                var video = that.videos[that.params.index];
                video.volume = that.prefs_supports.wholeAudioVolumn.value;//实时更新一下音量.
                video.play();
            }
        },
        //约定域参数计算
        calcParams() {
            var that = this;
            if (that.desk.params) {
                that.desk.params = JSON.parse(that.desk.params);
                Object.assign(that.params, that.desk.params);
            }
        },
        play() {
            var that = this;
            if (that.videos[that.params.index]) {
                that.videos[that.params.index].play();
            }
        },
        pause() {
            var that = this;
            if (that.videos[that.params.index]) {
                that.videos[that.params.index].pause();
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
                        this.prefs_supports[key].change(this,  this.prefs_supports[key],  this.prefs_supports[key].value, values[this.prefs_supports[key].bindkey]);
                    }
                }
            }
        },
    },
    created: function () {
        this.init();
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
            if (that.desk.medias.toString() != tmpDesk.medias.toString()) {
                that.init();
            }
            that.calcParams();
            if (dp && dp.api_pause == 2) {
                console.debug('视桌面接收到 ipc 暂停指令');
                that.pause();
            } else {
                console.debug('视桌面接收到 ipc 启动指令');
                that.play();
            }
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