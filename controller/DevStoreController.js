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
        var that = this;
        proxy.ipc.on('ipc_lock_req', function (event, swicth) {
            proxy.lock = swicth;
            proxy.appVar._lock = swicth;
            proxy.refreshAppVar();
            that.lock = swicth;
        });
        top.vm.netLoading('deskstore', () => {
            this.loading = true;
            this.$Loading.start();
        }, () => {
            this.loading = false;
            this.$Loading.finish();
        });
    }
});

window.onload = function () {
    vm.loading = false;
    top.vm.loadingTab = false;
};