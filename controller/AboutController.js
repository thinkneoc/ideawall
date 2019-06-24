const baseController = proxy.require('../controller/BaseController');

var vm = new Vue({
    el: '#app',
    data: function () {
        return {
            loading: true,
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
    }
});


window.onload = function () {
    vm.loading = false;
};