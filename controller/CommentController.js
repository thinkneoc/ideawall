const baseController = proxy.require('../controller/BaseController');
const http = proxy.require('../core/Http');
const logger = proxy.require('../core/Logger');

var vm = new Vue({
    el: '#app',
    data: function () {
        return {
            loading: true,
        }
    },
    methods: {
        handleInfoTabClick(){

        }
    },
    created: function () {
    },
    mounted() {

    }
});

window.onload = function(){
    vm.loading = false;
};