const baseController = proxy.require('../controller/BaseController');
const http = proxy.require('../core/Http');
const logger = proxy.require('../core/Logger');
const localDeskModel = proxy.require('../model/LocalDeskModel')(proxy.appVar);
const deviceDeskModel = proxy.require('../model/DeviceDeskModel')(proxy.appVar);
const mediaModel = proxy.require('../model/MediaModel')(proxy.appVar);
const preferenceModel = proxy.require('../model/PreferenceModel')(proxy.appVar);

var amIndex;
var vm = new Vue({
    el: '#app',
    data: function () {
        return {
            wallpaperLoading: false,
            wallpaperTipHandler: false,
            wallpaperTipShow: false,
            wallaperTip: '媒体组为空',
            netstatus: (navigator.onLine ? 'online' : 'offline'),
            displayId: T.p("displayId"), //当前窗体所在设备id
            display: {},
            syncPref: [], //需要进行同步的偏好配置
            desk: {}, //配置的桌面信息
            animate: {
                in: '',
                out: '',
            }
        };
    },
    methods: {
        protectorClick(displayId) {
            if (displayId) {
                var wallFrame = $('.iframe_wall');
                wallFrame.removeClass().addClass('iframe_wall');
                var thisProtectorWin = proxy.appVar._protectorwindows[parseInt(this.displayId)];
                if (thisProtectorWin) {
                    wallFrame.addClass('animated ' + this.animate.out).fadeOut(500, function () {
                        wallFrame.removeAttr('src');
                        thisProtectorWin.window.close();
                    });
                }
            } else {
                for (var x in proxy.appVar._protectorwindows) {
                    var win = proxy.appVar._protectorwindows[x].window;
                    win.webContents.send('ipc_protector_close');
                }
            }
        },
        showTip(bol, tip) {
            this.wallpaperTipShow = bol;
            if (bol) {
                if (tip) {
                    this.wallaperTip = tip;
                } else {
                    this.wallaperTip = '媒体组为空';
                }
            }
        },
        getAnimate(syncPref) {
            var flag = 0;
            for (var x in syncPref) {
                var zxx = syncPref[x];
                if (zxx.key == 'deskAnimationOn') { //入场动画, 入场动画其实不归这里管, 但还是一并处理一下.
                    flag += 1;
                    var val = JSON.parse(zxx.value).val;
                    if (val === 'random') {
                        val = animation.getAnimateIn();
                    }
                    this.animate.in = val;
                } else if (zxx.key == 'deskAnimationOut') { //离场动画
                    flag += 1;
                    var val = JSON.parse(zxx.value).val;
                    if (val === 'random') {
                        val = animation.getAnimateOut();
                    }
                    this.animate.out = val;
                }
                if (flag >= 2) {
                    break;
                }
            }
        },
        setWallpaper(cancel) {
            var that = this;
            that.wallpaperTipHandler = false;
            that.showTip(false);
            console.debug(cancel);
            //1.数据预备
            var display = deviceDeskModel.getDisplayById(that.displayId);
            var desk = deviceDeskModel.getDesk(that.displayId);
            var syncPref = preferenceModel.getNeedSync();
            console.debug(display);
            console.debug(desk);

            //1.5.拿到配置的出场动画和入场动画
            this.getAnimate(syncPref);

            var wallFrame = $('.iframe_wall');
            wallFrame.removeClass().addClass('iframe_wall');
            $('html').attr('display-id', that.displayId)
            if (cancel || !desk || desk == undefined || !display) { //没有配置桌面
                wallFrame.addClass('animated ' + that.animate.out).fadeOut(500, function () {
                    wallFrame.removeAttr('src');
                });
                console.warn('当前尚未配置桌面');
                that.desk = desk;
                return;
            }
            $('html').attr('desk_id', desk.id).attr('display-name', display.title);
            desk.medias = mediaModel.getsByDeskId(desk.id);

            //2.设备参数开关配定
            that.setHide(display);
            that.setMuted(display);
            that.display = display;

            //2.5.获取同步的偏好配置
            that.syncPref = syncPref;
            console.debug(that.syncPref);

            //3.桌面配置过滤
            if (that.desk && desk.id + '' == that.desk.id + '') { //桌面没变
                if (desk.source_type == that.desk.source_type && desk.source_val == that.desk.source_val) { //桌面源没变
                    //如果源没有发生变动, 就不主动刷新. => 可能是媒体发生了改变
                    proxy.ipc.send('ipc_repeat', 'ipc_wall_update', desk, display, syncPref);
                    that.wallpaperTipHandler = true;
                    that.desk = desk;
                    return;
                }
            }
            that.desk = desk;

            if (desk) {
                //4.重载控制
                $('.wallpaper-loading').show();
                var link = localDeskModel.getIndexPath(desk);
                console.debug(link);
                if (link && link != null) {
                    that.wallpaperLoading = true;
                    that.wallpaperTipShow = false;
                    link = (desk.type === 'page' ? './wall/Page.html' : link); //超桌面指定一个默认中继器.
                    var src = proxy.link(link);
                    if (desk) {
                        clearTimeout(amIndex);
                        wallFrame.addClass('animated ' + that.animate.out).fadeOut(500, function () {
                            wallFrame.attr('src', src);
                            wallFrame.load(function () {
                                amIndex = setTimeout(() => {
                                    $(this).removeClass().addClass('iframe_wall').show();
                                    that.wallpaperLoading = false;
                                    proxy.ipc.send('ipc_repeat', 'ipc_wall_update', desk, display, syncPref);
                                    that.wallpaperTipHandler = true;
                                }, 100);
                            });
                        });
                    } else {
                        wallFrame.attr('src', src);
                        wallFrame.load(function () {
                            $(this).show();
                            that.wallpaperLoading = false;
                            proxy.ipc.send('ipc_repeat', 'ipc_wall_update', desk, display, syncPref);
                            that.wallpaperTipHandler = true;
                        });
                    }
                } else {
                    proxy.alert('系统提示', '当前桌面源配置无效', false, 'error', false, desk);
                }
            }
        },
        setHide(display) {
            if (display) {
                var wallFrame = $('iframe#iframe_desktop');
                if (display.api_hide == 2) {
                    //这里需要处理一下离场动画效果
                    wallFrame.addClass('animated ' + this.animate.out).stop(true).fadeOut(500, function () {
                        wallFrame.hide();
                        wallFrame.css('visibility', 'hidden'); //why? 因为 show 和 hide 会被接下来的动作逻辑给干掉...
                    });
                } else {
                    if (wallFrame.is(':hidden')) {
                        wallFrame.show(); //记住重新 show 是会激活入场动画的.
                        wallFrame.css('visibility', 'visible');
                    }
                }
            }
        },
        setMuted(display) {
            if (display) {
                // try {//若没有音频, 会报错.
                proxy.appVar._wallwindows[parseInt(display.display_id)].window.webContents.setAudioMuted((display.api_muted === 2));
                // }catch(e){
                //     //...
                // }
            }
        }
    },
    created: function () {
    },
    mounted() {
        var that = this;
        //监听初始化数据信息
        that.wallpaperLoading = false;
        that.setWallpaper();
        proxy.ipc.on('ipc_window_wall_init', function (event, cancel) {
            console.debug('ipc_window_wall_init');
            that.setWallpaper(cancel);
        });
        //接收更新指令
        proxy.ipc.on('ipc_wall_update_forward', function (event) {
            console.debug('ipc_wall_update_forward');
            that.setWallpaper(false);
        });
        proxy.ipc.on('ipc_wall_showtip', function (event, bol, txt) {
            that.showTip(bol, txt);
        });
        //接收到关闭屏保指令
        proxy.ipc.on('ipc_protector_close', function (event) {
            that.protectorClick(that.displayId);
        });
        proxy.appVar._protectorwindows[parseInt(that.displayId)].window.on('focus', () => {
            that.protectorClick(that.displayId);
        });
    }
});