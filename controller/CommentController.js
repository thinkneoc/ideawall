const baseController = proxy.require('../controller/BaseController');
const http = proxy.require('../core/Http');
const logger = proxy.require('../core/Logger');

var vm = new Vue({
    el: '#app',
    data: function () {
        return {
            loading: true,
            formKey: T.p('fk'),
            origin: proxy.appVar._commenturl,
        }
    },
    methods: {
        //发送通信消息
        postMessage(data) {//data 结构为 指令+数据
            $('iframe#iframe_comment')[0].contentWindow.postMessage(data, this.origin);
        },
        //接收通信消息
        getMessage(rs) {
            var data = rs.data;
            this.postMessage('呵呵哒~');
        }
    },
    created: function () {
    },
    mounted() {
        var that = this;
        var xiframe = $('iframe#iframe_comment');
        top.vm.netLoading('mydesk', () => {
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