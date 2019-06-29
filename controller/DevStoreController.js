const baseController = proxy.require('../controller/BaseController');
const http = proxy.require('../core/Http');
const logger = proxy.require('../core/Logger');
const uuid = proxy.require('../core/UUID')();

var vm = new Vue({
    el: '#app',
    data: function () {
        return {
            loading: true,
            lock: proxy.lock,
            origin: proxy.appVar._storeurl,
            nowURL: proxy.appVar._storeurl,
        }
    },
    methods: {
        //发送通信消息
        postMessage(data) {//data 结构为 指令+数据
            $('iframe#iframe_store')[0].contentWindow.postMessage(data, this.origin);
        },
        //接收通信消息
        getMessage(rs) {
            var data = rs.data;
            this.nowURL = data.location;
            this.postMessage('呵呵哒~');
        }
    },
    created: function () {
    },
    mounted() {
        var that = this;
        var xiframe = $('iframe#iframe_store');
        proxy.ipc.on('ipc_lock_req', function (event, swicth) {
            proxy.lock = swicth;
            proxy.appVar._lock = swicth;
            proxy.refreshAppVar();
            that.lock = swicth;
        });
        proxy.ipc.on('ipc_render_control_deskstore_refresh', (event, cmd) => {
            xiframe.attr('src', this.nowURL);
        });
        proxy.ipc.on('ipc_render_control_deskstore_home', (event, cmd) => {
            xiframe.attr('src', proxy.appVar._storeurl);
        });
        proxy.ipc.on('ipc_render_control_deskstore_changeurl', (event, url) => {
            this.nowURL = url;
            xiframe.attr('src', url);
        });
        top.vm.netLoading('deskstore', () => {
            this.loading = true;
            this.$Loading.start();
        }, () => {
            this.loading = false;
            this.$Loading.finish();
        });
        xiframe.load(function () {
            that.loading = false;
            top.vm.loadingTab = false;
        });
    }
});