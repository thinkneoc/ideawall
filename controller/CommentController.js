const baseController = proxy.require('../controller/BaseController');
const http = proxy.require('../core/Http');
const logger = proxy.require('../core/Logger');

var vm = new Vue({
    el: '#app',
    data: function () {
        return {
            loading: true,
            formKey: T.p('fk'),
        }
    },
    methods: {
        handleInfoTabClick(){

        }
    },
    created: function () {
    },
    mounted() {
        var that = this;
        var xiframe = $('iframe#iframe_comment');
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

window.onload = function(){
    vm.loading = false;
};