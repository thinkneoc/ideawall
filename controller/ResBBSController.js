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
    methods: {},
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
    console.warn('接收到跨域窗口通信消息');
    console.debug(rs.data);
    vm.nowURL = rs.data.location;
});

