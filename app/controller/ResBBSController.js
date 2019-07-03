const baseController = proxy.require('../controller/BaseController');
const http = proxy.require('../core/Http');
const logger = proxy.require('../core/Logger');
const uuid = proxy.require('../core/UUID')();

var vm = new Vue({
    el: '#app',
    data: function () {
        return {
            loading: true,
            origin: proxy.appVar._bbsurl,
            nowURL: proxy.appVar._bbsurl,
        }
    },
    methods: {
        //发送通信消息
        postMessage(data) {//data 结构为 指令+数据
            $('iframe#iframe_bbs')[0].contentWindow.postMessage(data, this.origin);
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
        var xiframe = $('iframe#iframe_bbs');
        proxy.ipc.on('ipc_render_control_resbbs_refresh', (event, cmd) => {
            that.loading = true;
            xiframe.attr('src', this.nowURL);
        });
        proxy.ipc.on('ipc_render_control_resbbs_home', (event, cmd) => {
            that.loading = true;
            xiframe.attr('src', proxy.appVar._bbsurl);
        });
        proxy.ipc.on('ipc_render_control_resbbs_open', (event, cmd) => {
            proxy.ipc.send('ipc_window_open', 'browser', that.nowURL);
        });
        proxy.ipc.on('ipc_render_control_resbbs_changeurl', (event, url) => {
            that.loading = true;
            this.nowURL = url;
            xiframe.attr('src', url);
        });
        top.vm.netLoading('resbbs', () => {
            this.$Loading.start();
        }, () => {
            this.$Loading.finish();
        });
        xiframe.load(function () {
            that.loading = false;
            top.vm.loadingTab = false;
            that.postMessage({
                cmd: 'hello',
                version: proxy.appVar._version,
            });
        });
    }
});

