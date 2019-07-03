const baseController = proxy.require('../controller/BaseController');

var vm = new Vue({
    el: '#app',
    data: function () {
        return {
            loading: true,
            link: proxy.link(decodeURIComponent(decodeURIComponent(T.p('link')))),
        };
    },
    methods: {
        
    },
    created: function () {
    },
    mounted() {
        var that = this;
        proxy.ipc.on('ipc_window_browser_cgi', function (event, link, paramJson) {
            console.debug('ipc_window_browser_cgi: ' + link);
            if (link + '' != that.link + '') {
                this.loading = true;
                that.link = link;
                $$.dealIframe('#iframe_browser', link);
            }
        });

        proxy.appVar._browserwindow.webContents.on('did-start-loading', () => {
            this.loading = true;
            this.$Loading.start();
        });
        proxy.appVar._browserwindow.webContents.on('did-stop-loading', () => {
            this.loading = false;
            this.$Loading.finish();
        });
    }
});


window.onload = function () {
    vm.loading = false;
};