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
        proxy.appVar._controlwindow.webContents.on('did-start-loading', () => {
            if(top.vm.activeTab === 'resbbs') {
                try {
                    top.vm.loadingMaster = true;
                    this.$Loading.start();
                } catch (e) {
                    //...
                }
            }
        });
        proxy.appVar._controlwindow.webContents.on('did-stop-loading', () => {
            if(top.vm.activeTab === 'resbbs') {
                try {
                    top.vm.loadingMaster = false;
                    this.loading = false;
                    this.$Loading.finish();
                } catch (e) {
                    //...
                }
            }
        });

        $('iframe#iframe_bbs').load(function () {
            top.vm.loadingTab = false;
        })
    }
});

window.onload = function () {
    vm.loading = false;
};