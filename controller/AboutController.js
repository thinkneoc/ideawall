const baseController = proxy.require('../controller/BaseController');

var vm = new Vue({
    el: '#app',
    data: function () {
        return {
            loading: true,
            lock: proxy.lock,
        };
    },
    methods: {
        linkSite(){
            proxy.openExternal(proxy.appVar._siteurl);
        }
    },
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
    }
});


window.onload = function () {
    vm.loading = false;
};