const baseController = proxy.require('../controller/BaseController');
const http = proxy.require('../core/Http');
const deviceDeskModel = proxy.require('../model/DeviceDeskModel')();

var amIndex;
var vm = new Vue({
    el: '#app',
    data: function () {
        return {
            loadingData: true,
            displayId: T.p("displayId"),//设备id
            deskTypeName: T.p('deskTypeName'),//设备配置桌面的类型名称.
            display: {
                id: '',//唯一标识 id
                desk_id: '',//配置的桌面 id, 为空代表没有配置.
                display_id: '',//设备 id
                display_rp: '',//设备分辨率
                display_info: {//设备属性: 随时会变化

                },
            },//设备信息
            screens: {},
            screen: {//快照信息

            },
            snapSize: {//快照大小
                width: 300,
                height: 170,
            },
        };
    },
    methods: {
        setInfo(displayId, paramJson) {
            var that = this;
            that.loadingData = true;
            try {
                that.deskTypeName = decodeURI(decodeURI(paramJson.deskTypeName));
            } catch (e) {
            }
            console.debug(displayId);
            that.displayId = displayId;
            that.display = deviceDeskModel.getDisplayById(displayId);
            if (that.display) {
                that.display.display_info = JSON.parse(that.display.display_info);
                console.debug(that.display);
                var title = $('title').text();
                (title.indexOf && title.indexOf('  -  ') === -1) ? $('title').text(that.display.screen_title + '  -  ' + title) : '';
                that.screen = that.screens.filter((item) => {
                    return (that.display.display_id + '' === item.display_id + '');
                })[0];
                that.loadingData = false;
            } else {
                console.warn('目标设备不存在或已经被移除.');
                proxy.alert('系统提示', '目标设备不存在或已经被移除!', false, 'error');
            }

        }
    },
    created: function () {
        var that = this;
        deviceDeskModel.snapscreen(that.snapSize, (result, rIds, first) => {
            that.screens = result;
            console.debug(that.screens);
            setTimeout(() => {
                that.setInfo(this.displayId, {deskTypeName: this.deskTypeName});
                proxy.ipc.on('ipc_window_deviceinfo_cgi', function (event, displayId, paramJson) {
                    console.debug('ipc_window_deviceinfo_cgi: ' + that.displayId + ' => ' + displayId);
                    if (displayId + '' != that.displayId + '') {
                        that.setInfo(displayId, paramJson);
                    }
                });
            }, 500);
            //监听初始化数据信息
        }, true, true);
    },
    mounted() {
        var that = this;
    }
});