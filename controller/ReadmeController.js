const baseController = proxy.require('../controller/BaseController');
const http = proxy.require('../core/Http');
const localDeskModel = proxy.require('../model/LocalDeskModel')();

var amIndex;
var vm = new Vue({
    el: '#app',
    data: function () {
        return {
            deskId: T.p("deskId"),//桌面id
            link: T.p("link"),//link 地址
            desk: {},//配置的桌面信息
        };
    },
    methods: {
        setWallpaper(desk_id, paramJson) {
            var that = this;
            that.link = decodeURI(decodeURI(paramJson.link));
            console.debug(desk_id);
            that.deskId = desk_id;
            var wallFrame = $('.iframe_wall');
            wallFrame.removeAttr('src').hide();
            console.debug(paramJson);
            $('.wallpaper-loading').show();
            that.desk = localDeskModel.getDesk(desk_id);
            console.debug(that.desk);
            if (that.desk) {
                var title = $('title').text();
                (title.indexOf && title.indexOf('  -  ') === -1) ? $('title').text(that.desk.name + '  -  ' + title) : '';
                if (that.link) {
                    var src = wallFrame.data('src').replace('[SOURCE]', proxy.link(that.link));
                    wallFrame.attr('src', src);
                    wallFrame.load(function () {
                        $('.zxx-loading').hide();
                        $(this).show();
                    });
                } else {
                    var link = localDeskModel.getReadmePath(that.desk);
                    console.debug(link);
                    if (link) {
                        var src = wallFrame.data('src').replace('[SOURCE]', proxy.link(link));
                        wallFrame.attr('src', src);
                        wallFrame.load(function () {
                            $('.zxx-loading').hide();
                            $(this).show();
                        });
                    } else {
                        console.warn('当前配置桌面源非法');
                        proxy.alert('系统提示', '当前桌面源配置无效', false, 'error');
                    }
                }
            } else {
                console.warn('当前桌面尚未提供配置说明文件');
                proxy.alert('系统提示', '当前桌面尚未提供配置说明文件!', function (res) {

                }, 'error');
            }
        }
    },
    created: function () {
    },
    mounted() {
        var that = this;
        //监听初始化数据信息
        that.setWallpaper(this.deskId, {link: this.link});
        proxy.ipc.on('ipc_window_readme_cgi', function (event, deskId, paramJson) {
            console.debug('ipc_window_readme_cgi: ' + that.deskId + ' => ' + deskId);
            if (deskId + '' != that.deskId + '') {
                that.setWallpaper(deskId, paramJson);
            }
        });
    }
});