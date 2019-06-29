const baseController = proxy.require('../controller/BaseController');
const http = proxy.require('../core/Http');
const logger = proxy.require('../core/Logger');

var vm = new Vue({
    el: '#app',
    data: function () {
        return {
            loading: true,
            lock: proxy.lock,
            nowURL: proxy.appVar._bbsurl,
        }
    },
    methods: {
        postMessage(data) {//data 结构为 指令+数据
            $('iframe#iframe_bbs')[0].contentWindow.postMessage(data, '*');
        }
    },
    created: function () {

    },
    mounted() {
        proxy.ipc.on('ipc_lock_req', (event, swicth) => {
            proxy.lock = swicth;
            proxy.appVar._lock = swicth;
            proxy.refreshAppVar();
            this.lock = swicth;
        });
        proxy.ipc.on('ipc_render_control_resbbs_refresh', (event, cmd) => {
            var xiframe = $('iframe#iframe_bbs');
            xiframe.attr('src', this.nowURL);
        });
        proxy.ipc.on('ipc_render_control_resbbs_home', (event, cmd) => {
            var xiframe = $('iframe#iframe_bbs');
            xiframe.attr('src', xiframe.attr('src'));
        });
        top.vm.netLoading('resbbs', () => {
            this.$Loading.start();
        }, () => {
            this.$Loading.finish();
        });
        $('iframe#iframe_bbs').load(function () {
            top.vm.loadingTab = false;
        })
    }
});

window.onload = function () {
    vm.loading = false;
};

window.addEventListener('message', function (rs) {
    console.warn('[父域] 接收到跨域窗口通信消息');
    console.debug(rs.data);
    vm.nowURL = rs.data.location;
    vm.postMessage('哈哈哈~ 我收到你了~~~ 😁');
});

