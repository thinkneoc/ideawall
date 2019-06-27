const baseController = proxy.require('../controller/BaseController');
const http = proxy.require('../core/Http');
const logger = proxy.require('../core/Logger');

var vm = new Vue({
    el: '#app',
    data: function () {
        return {
            loading: true,
            lock: proxy.lock,
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