const baseController = proxy.require('../controller/BaseController');
const http = proxy.require('../core/Http');
const localDeskModel = proxy.require('../model/LocalDeskModel')();
const mediaModel = proxy.require('../model/MediaModel')();

var amIndex;
var vm = new Vue({
    el: '#app',
    data: function () {
        return {
            wallpaperEmpty: false,
            deskId: T.p("deskId"),//桌面id
            link: T.p("link"),//link 地址
            desk: {},//配置的桌面信息
        };
    },
    methods: {
        showEmptyTip(bol, tip) {
            this.wallpaperEmpty = bol;
            if (tip) {
                this.wallaperEmptyTip = tip;
            }else{
                this.wallaperEmptyTip = '媒体组为空';
            }
        },
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
            that.desk.medias = mediaModel.getsByDeskId(desk_id);
            console.debug(that.desk);
            if (that.desk) {
                var title = $('title').text();
                (title.indexOf && title.indexOf('  -  ') === -1) ? $('title').text(that.desk.name + '  -  ' + title) : '';
                if (that.link) {
                    var link = that.link;
                    link = (that.desk.type === 'page' ? './wall/Page.html' : link);//超桌面指定一个默认中继器.
                    var src = wallFrame.data('src').replace('[SOURCE]', proxy.link(link, {preview: 'yes'}));
                    wallFrame.attr('src', src);
                    wallFrame.load(function () {
                        $(this).show();
                        proxy.ipc.send('ipc_repeat', 'ipc_wall_update', that.desk, desk_id);
                        that.showEmptyTip((that.desk.type !== 'page' && (!that.desk.medias || that.desk.medias.length <= 0)));
                    });
                } else {
                    var link = localDeskModel.getIndexPath(that.desk);
                    console.debug(link);
                    if (link) {
                        link = (that.desk.type === 'page' ? './wall/Page.html' : link);//超桌面指定一个默认中继器.
                        var src = wallFrame.data('src').replace('[SOURCE]', proxy.link(link, {preview: 'yes'}));
                        wallFrame.attr('src', src);
                        wallFrame.load(function () {
                            $(this).show();
                            proxy.ipc.send('ipc_repeat', 'ipc_wall_update', that.desk, desk_id);
                            that.showEmptyTip((that.desk.type !== 'page' && (!that.desk.medias || that.desk.medias.length <= 0)));
                        });
                    } else {
                        console.warn('当前配置桌面源非法');
                        proxy.alert('系统提示', '当前桌面源配置无效', false, 'error');
                    }
                }
            } else {
                console.warn('当前尚未配置桌面');
                proxy.alert('系统提示', '桌面数据索引失败!', function (res) {

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
        proxy.ipc.on('ipc_window_preview_cgi', function (event, deskId, paramJson) {
            console.debug('ipc_window_preview_cgi: ' + that.deskId + ' => ' + deskId);
            if (deskId + '' != that.deskId + '') {
                that.setWallpaper(deskId, paramJson);
            }
        });
    }
});