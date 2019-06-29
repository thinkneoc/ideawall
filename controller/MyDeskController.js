const baseController = proxy.require('../controller/BaseController');
const http = proxy.require('../core/Http');
const logger = proxy.require('../core/Logger');
const uuid = proxy.require('../core/UUID')();
const localDeskModel = proxy.require('../model/LocalDeskModel')(proxy.appVar);
const deviceDeskModel = proxy.require('../model/DeviceDeskModel')(proxy.appVar);
const mediaModel = proxy.require('../model/MediaModel')(proxy.appVar);
const preferenceModel = proxy.require('../model/PreferenceModel')(proxy.appVar);

var vm = new Vue({
    el: '#app',
    data: function () {
        return {
            loading: true,
            lock: proxy.lock,
            loadingControl: true,
            loadingDevices: true,
            loadingDesks: true,
            loadingDesk: {
                config: true,
                highconfig: true,
                info: true,
            },
            cardStyle: {
                width: 200,
                height: 142,
            },
            tags: [//我的桌面类型标签集合
                {id: 'all', type: '', label: '全部', icon: ''},
                {id: 'picture', type: 'info', label: '幻灯桌面', icon: ''},
                {id: 'video', type: 'info', label: '视频桌面', icon: ''},
                {id: 'page', type: 'info', label: '超桌面', icon: ''},
            ],
            deskInfoTab: 'config',
            tag: {},
            lds: [],//我的桌面集合
            ld: {},//当前正在配置的桌面
            displays: [//我的设备截屏流集合
            ],
            displayIds: [],//我的设备Id 集合
        }
    },
    methods: {
        handleDesktopCommand(command) {
            // this.$message('click on item ' + command);
            this.tag = this.tags.filter((item) => {
                return item.id === command;
            })[0];
            console.debug(this.tag);
        },
        handleInfoTabClick(tab, event) {
            console.log(tab, event);
        },
        genPreview(name, color, setColor) {
            console.debug(name);
            return avatarUtil.generateBg(name, this.cardStyle.width, (this.cardStyle.height - 30));
        },
        dealWithLdsData(lds) {
            for (var x in lds) {
                var dtn = localDeskModel.getDeskTypeName(lds[x].type);
                lds[x].typeExplain = dtn;
                if (!lds[x].preview || lds[x].preview + '' == '') {
                    lds[x].preview = this.genPreview(dtn.fullname);
                }
                lds[x].setsdisplays = deviceDeskModel.getDisplays(lds[x].id);
                lds[x].medias = mediaModel.getsByDeskId(lds[x].id);
                if (this.ld.id && this.ld.id + '' == lds[x].id + '') {
                    this.ld = lds[x];
                }
            }
            this.lds = lds;
        },
        //初始化打开一个桌面配置
        initConfigDesk() {
            var firstDeskDisplay = deviceDeskModel.getDeskDisplays(true);
            console.debug(firstDeskDisplay);
            if (firstDeskDisplay && firstDeskDisplay.length > 0) {
                this.configDesk(firstDeskDisplay[0].ld_id);
            } else {
                $('#my-desktop').find('.zxx-desk-con:first').find('.zxx-desk-panel').click();
            }

        },
        //打开目标桌面配置页
        configDesk(id, index) {
            var that = this;
            console.debug(id);
            if (!id || (id + '').trim() === '' || id === 'undefined' || id === 'false') {
                return;
            }
            if (this.ld.id + '' == id + '') {
                return;
            }
            var ldData = this.lds[index];
            if (!ldData || !index || id != ldData.id) {
                ldData = this.lds.filter((item) => {
                    return item.id + '' == id + '';
                })[0];
            }
            this.ld = ldData;
            //关闭 JSONEditor
            try {
                proxy.appVar._jsoneditorwindow.close();
            } catch (e) {
            }
            $('.iframe_wall_config').each(function () {
                var src = $(this).attr('data-src');
                var key = $(this).attr('data-key');
                that.loadingDesk[key] = true;
                src = src.replace('[ID]', id);
                $(this).attr('src', src);
                $(this).load(function () {
                    that.loadingDesk[key] = false;
                })
            });
        },
        //更新 desk 和 display 状态数据
        updateDeskAndDisplay(desk_id, display_id) {
            if (desk_id) {
                for (var x in this.lds) {
                    var item = this.lds[x];
                    // if (item.id + '' == desk_id + '') {
                    item.setsdisplays = deviceDeskModel.getDisplays(item.id);
                    this.lds[x] = item;
                    // break;
                    // }
                }
            }
            //更新所有设备
            for (var y in this.displays) {
                var itm = this.displays[y];
                if (display_id && display_id + '' != itm.display_id + '') {
                    break;
                }
                itm.is_set_desk = deviceDeskModel.isDesk(itm.display_id, itm.ld_id);
                this.displays[y] = itm;
            }
        },
        //设置设备桌面静音
        setMuted(e, displayId, res, dontset) {
            console.debug('setMuted');
            var that = this;
            if (!e) {
                $('.zxx-device-wall-setmuted').each(function () {
                    that.setMuted($(this), false, res);
                });
            } else {
                console.debug('132134')
                if ($(e).length > 0) {
                    console.debug('setMuted: ' + displayId + ' => ' + res);
                    var nowSwitch = $(e).attr('data-switch');
                    if (res) {
                        nowSwitch = res + '';
                    }
                    if (nowSwitch + '' == '1') {
                        $(e).children('i').removeClass('ivu-icon-md-volume-up').addClass('ivu-icon-md-volume-off');
                        $(e).attr('data-switch', 2).attr('title', '点击关闭静音');
                        !dontset ? deviceDeskModel.setApi(displayId, 'muted', true) : '';
                    } else {
                        $(e).children('i').removeClass('ivu-icon-md-volume-off').addClass('ivu-icon-md-volume-up');
                        $(e).attr('data-switch', 1).attr('title', '点击静音');
                        !dontset ? deviceDeskModel.setApi(displayId, 'muted', false) : '';
                    }
                    if (displayId) {
                        var all = 0, true_num = 0;
                        $('#my-device').find('.zxx-device-wall-setmuted').each(function () {
                            all += 1;
                            if ($(this).attr('data-switch') + '' == '2') {
                                true_num += 1;
                            }
                        });
                        if (all <= true_num) {
                            top.vm.setAllMuted('#zxx-set-allmuted', 1, true);
                        } else {
                            top.vm.setAllMuted('#zxx-set-allmuted', 2, true);
                        }
                    }
                }
            }
        },
        //设置设备桌面播放暂停
        setPause(e, displayId, res, dontset) {
            console.debug('setPause');
            var that = this;
            if (!e) {
                $('.zxx-device-wall-setpause').each(function () {
                    that.setPause($(this), false, res);
                });
            } else {
                if ($(e).length > 0) {
                    console.debug('setPause: ' + displayId + ' => ' + res);
                    var nowSwitch = $(e).attr('data-switch');
                    if (res) {
                        nowSwitch = res + '';
                    }
                    console.debug('啦啦啦' + nowSwitch);
                    if (nowSwitch + '' == '1') {
                        $(e).children('i').removeClass('ivu-icon-md-pause').addClass('ivu-icon-md-play');
                        $(e).attr('data-switch', 2).attr('title', '点击播放');
                        !dontset ? deviceDeskModel.setApi(displayId, 'pause', true) : '';
                    } else {
                        $(e).children('i').removeClass('ivu-icon-md-play').addClass('ivu-icon-md-pause');
                        $(e).attr('data-switch', 1).attr('title', '点击暂停');
                        !dontset ? deviceDeskModel.setApi(displayId, 'pause', false) : '';
                    }
                    if (displayId) {
                        var all = 0, true_num = 0;
                        $('#my-device').find('.zxx-device-wall-setpause').each(function () {
                            all += 1;
                            if ($(this).attr('data-switch') + '' == '2') {
                                true_num += 1;
                            }
                        });
                        if (all <= true_num) {
                            top.vm.setAllPause('#zxx-set-allpause', 1, true);
                        } else {
                            top.vm.setAllPause('#zxx-set-allpause', 2, true);
                        }
                    }
                }
            }
        },
        snapscreen(onlyone) {
            var that = this;
            var pref_deviceSnapscreenTTL = preferenceModel.getByKey("deviceSnapscreenTTL");
            deviceDeskModel.initial(this.cardStyle, (result, rIds, first) => {
                that.displays = result;
                that.displayIds = rIds;
                // console.debug(that.displays);
                if (first) {//首次快照到达
                    for (var x in that.displays) {
                        var display_id = that.displays[x].display_id;
                        var db_display = deviceDeskModel.getDisplayById(display_id);
                        // console.debug(db_display);
                        that.setMuted('.zxx-device[data-id="' + display_id + '"] .zxx-device-wall-setmuted', display_id, (db_display.api_muted === 2 ? 1 : 2), true);
                        that.setPause('.zxx-device[data-id="' + display_id + '"] .zxx-device-wall-setpause', display_id, (db_display.api_pause === 2 ? 1 : 2), true);
                        (db_display.api_hide === 2) ? top.vm.setAllHide('#zxx-set-alleye', 1, true) : '';//只要有一个隐藏了, 就显示隐藏状态.
                        that.displays[x].is_set_desk = deviceDeskModel.isDesk(db_display.display_id, db_display.ld_id);
                        that.displays[x].displays_has_screen = deviceDeskModel.getScreen().displaysHasScreen(db_display.display_id);
                        that.$set(that.displays, x, that.displays[x]);
                        //这些数据只能在下一次监视器快照数据进来的时候刷新, 所以这里要进行手动强制刷新
                    }
                    setTimeout(() => {
                        that.loadingDevices = false;
                        that.loadingControl = false;
                        top.vm.loadingControl = false;
                    }, 3000);
                }
            }, pref_deviceSnapscreenTTL, true, onlyone);
        }
    },
    created: function () {
        var that = this;
        this.tag = this.tags[0];
        this.dealWithLdsData(localDeskModel.initial().selectAll());
        this.snapscreen(true);
        proxy.appVar._controlwindow.on('show', (e) => {
            that.loadingDevices = true;
            that.snapscreen();
        });
        proxy.appVar._controlwindow.on('hide', (e) => {
            $('.zxx-device').remove();
            that.loadingDevices = true;
            deviceDeskModel.closeSnapscreen();
        });
        proxy.ipc.on('ipc_render_snapscreen_stop', function (event) {
            deviceDeskModel.closeSnapscreen();
        });
    },
    mounted() {
        var that = this;
        that.loadingDesks = false;
        proxy.ipc.on('ipc_device_wall_hide_all', function (event, bol) {
            deviceDeskModel.setApi(false, 'hide', bol);
        });
        proxy.ipc.on('ipc_device_wall_muted_all', function (event, bol) {
            that.setMuted(false, false, (bol ? 1 : 2));
        });
        proxy.ipc.on('ipc_device_wall_pause_all', function (event, bol) {
            that.setPause(false, false, (bol ? 1 : 2));
        });
        //接收托盘事件
        proxy.ipc.on('ipc_device_wall_api', function (event, apiCmd, displayId, bol, dontset) {
            var elem = false;
            if (displayId) {
                elem = '#zxx-set-' + apiCmd + '-' + displayId;
            }
            if (apiCmd === 'pause') {
                that.setPause(elem, displayId, (bol ? 1 : 2), dontset);
            } else if (apiCmd === 'muted') {
                that.setMuted(elem, displayId, (bol ? 1 : 2), dontset);
            } else if (apiCmd === 'hide') {
                top.vm.setAllHide('zxx-set-alleye', (bol ? 1 : 2), dontset);
            }
        });
        proxy.ipc.on('ipc_lock_req', function (event, swicth) {
            proxy.lock = swicth;
            proxy.appVar._lock = swicth;
            proxy.refreshAppVar();
            that.lock = swicth;
        });
    }
});

$(function () {
    $('body').on('mouseover', '.zxx-desk-overlay-top', function (event) {
        var e = event || window.event;
        var that = $(e.target).parents('.zxx-desk-panel');
        if ($(that).length > 0) {
            $(that).find('.zxx-desk-overlay').show();
            $(that).find('.zxx-desk-tooltip-edit').hide();
            $(that).find('iframe.zxx-desk-showpanel-sport').remove();
        }
    }).on('mouseout', '.zxx-desk-overlay-top', function (event) {
        var e = event || window.event;
        var that = $(e.target).parents('.zxx-desk-panel');
        $(that).find('.zxx-desk-overlay').hide();
        $(that).find('.zxx-desk-tooltip-edit').show();
    });
});

window.onload = function () {
    vm.initConfigDesk();//因为模板中使用了 vm 变量, 所以, 在 mounted 或 created 中调用会报错.
    vm.loading = false;
    top.vm.loadingTab = false;
};

/**
 * 右键菜单
 * @type {Function}
 */
var autoContextMenu = {

    /**
     * 构建设备数据元素右键菜单
     *
     * @param elem
     */
    buildDisplayContextMenu: function (elem) {
        var display_id = $(elem).data('id');
        var desk_id = deviceDeskModel.isDesk(display_id);
        var isDesk = desk_id ? true : false;//enabled传数值过去, 不会自动解析为 Boolean.
        console.debug(isDesk);
        var db_display = deviceDeskModel.getDisplayById(display_id);
        var isPause = db_display.api_pause;
        var isMuted = db_display.api_muted;
        var menuItems = [];
        menuItems.push({
            label: '预览桌面',
            enabled: isDesk,
            click: function () {
                var desk = localDeskModel.getDesk(desk_id);
                if (!desk) {
                    proxy.alert('系统提示', '桌面数据索引失败!', false, 'error');
                    return;
                }
                var link = localDeskModel.getIndexPath(desk);
                if (!link) {
                    proxy.alert('系统提示', '当前桌面源配置无效', false, 'error');
                    return;
                }
                proxy.ipc.send('ipc_window_open', 'preview', desk_id, {link: encodeURI(encodeURI(link))});
            }
        });
        menuItems.push({
            label: isPause === 1 ? '暂停' : '播放',
            enabled: isDesk,
            click: function () {
                vm.setPause('.zxx-device[data-id="' + display_id + '"] .zxx-device-wall-setpause', display_id, isPause);
            },
        });
        menuItems.push({
            label: isMuted === 1 ? '静音' : '打开声音',
            enabled: isDesk,
            click: function () {
                vm.setMuted('.zxx-device[data-id="' + display_id + '"] .zxx-device-wall-setmuted', display_id, isMuted);
            },
        });
        menuItems.push({
            label: '取消启用',
            enabled: isDesk,
            click: function () {
                deviceDeskModel.removeDesk(display_id);
                vm.updateDeskAndDisplay(desk_id, display_id);
            },
        });
        menuItems.push({
            label: '查看设备信息',
            click: function () {
                var desk = localDeskModel.getDesk(desk_id);
                var typeName = desk ? localDeskModel.getDeskTypeName(desk.type).fullname : '未启用';
                proxy.ipc.send('ipc_window_open', 'deviceinfo', display_id, {deskTypeName: encodeURI(encodeURI(typeName))});
            },
        });
        return menuItems;
    },

    /**
     * 构建桌面数据元素右键菜单
     *
     * @returns {Array}
     */
    buildDeskContextMenu: function (elem) {
        var desk_id = $(elem).data('id');
        var gotoDesktopKey = (proxy.appVar._platform === 'darwin' ? 'F11' : '<i class="ivu-icon ivu-icon-logo-windows" style="margin-top: -2px;"></i> + D');
        var stasdPref = preferenceModel.getByKey('dontshowTipAfter_setDesk');
        stasdPref.val = JSON.parse(stasdPref.value).val;
        var menuItems = [];
        menuItems.push({
            label: '预览',
            click: function () {
                var desk = localDeskModel.getDesk(desk_id);
                if (!desk) {
                    proxy.alert('系统提示', '桌面数据索引失败!', false, 'error');
                    return;
                }
                var link = localDeskModel.getIndexPath(desk);
                if (!link) {
                    proxy.alert('系统提示', '当前桌面源配置无效', false, 'error');
                    return;
                }
                proxy.ipc.send('ipc_window_open', 'preview', desk_id, {link: encodeURI(encodeURI(link))});
            }
        });
        var displaySubMenuItems = [];
        var thisDisplays = deviceDeskModel.getDisplays(desk_id);
        var thisDisplayIds = thisDisplays.map((item) => {
            return item.display_id + '';
        });
        if (thisDisplays.length !== vm.displays.length && vm.displays.length > 1) {
            displaySubMenuItems.push({
                label: '为 所有屏幕 启用',
                click: function () {
                    top.vm.showLoadingMaster();
                    deviceDeskModel.setsDesk([vm.displays.map(x => {
                        return x.display_id
                    })], desk_id);
                    vm.updateDeskAndDisplay(desk_id);
                    if (!stasdPref.val) {
                        proxy.alert('设置成功! ', '' + proxy.osname + '系统使用 "' + gotoDesktopKey + '" 快捷键以快速显示桌面查看效果~  (再按一次可以恢复窗口哦~)', (res) => {
                            if (res === 1) {
                                console.debug(res);
                                stasdPref.value.val = true;
                                preferenceModel.updateById(stasdPref);
                            }
                        }, false, ['知道了', '不再提醒']);
                    }
                }
            });
        }
        for (let x in vm.displays) {
            let zxx = vm.displays[x];//这里必须用 let. 不然会一直是最后一个.
            if (thisDisplayIds.indexOf(zxx.display_id + '') === -1) {
                displaySubMenuItems.push({
                    label: '为 ' + zxx.title + ' 启用',
                    click: function () {
                        top.vm.showLoadingMaster();
                        deviceDeskModel.setsDesk([zxx.display_id], desk_id);
                        vm.updateDeskAndDisplay(desk_id, zxx.display_id);
                        if (!stasdPref.val) {
                            proxy.alert('设置成功! ', '' + proxy.osname + '系统使用 "' + gotoDesktopKey + '" 快捷键以快速显示桌面查看效果~  (再按一次可以恢复窗口哦~)', (res) => {
                                if (res === 1) {
                                    console.debug(res);
                                    stasdPref.value.val = true;
                                    preferenceModel.updateById(stasdPref);
                                }
                            }, false, ['知道了', '不再提醒']);
                        }
                    }
                });
            }
        }
        if (thisDisplays.length > 0 && thisDisplays.length !== vm.displays.length) {
            displaySubMenuItems.push({type: 'separator'});
        }
        if (thisDisplays.length === vm.displays.length && vm.displays.length > 1) {
            displaySubMenuItems.push({
                label: '所有屏幕 已启用',
                enabled: false,
            });
        }
        for (let y in thisDisplays) {
            let zyy = thisDisplays[y];
            if (thisDisplayIds.indexOf(zyy.display_id + '') > -1) {
                displaySubMenuItems.push({
                    label: '' + zyy.screen_title + ' 已启用',
                    enabled: false,
                });
            }
        }

        menuItems.push({
            label: '设置启用',
            submenu: displaySubMenuItems,
        });
        menuItems.push({
            label: '删除',
            enabled: false,
            click: function () {

            }
        });
        return menuItems;
    },
};