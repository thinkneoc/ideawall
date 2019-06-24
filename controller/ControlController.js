const baseController = proxy.require('../controller/BaseController');
const http = proxy.require('../core/Http');
const logger = proxy.require('../core/Logger');
const uuid = proxy.require('../core/UUID')();
let agent = proxy.require('../core/Agent');

var vm = new Vue({
    el: '#app',
    data: function () {
        return {
            loading: true,
            loadingMaster: false,
            loadingControl: true,
            activeTab: T.p('tab') ? T.p('tab') : 'mydesk',
            tabs: {
                'mydesk': {
                    name: 'mydesk',
                    title: '我的桌面',
                    icon: 'el-icon-monitor',
                    link: './control/MyDesk.html',
                    preload: true,
                },
                'deskstore': {
                    name: 'deskstore',
                    title: '桌面商店',
                    icon: 'el-icon-goods',
                    link: './control/DeskStore.html',
                    preload: false,
                },
                'preference': {
                    name: 'preference',
                    title: '偏好设置',
                    icon: 'el-icon-setting',
                    link: './control/Preference.html',
                    preload: true,
                },
                'feedback': {
                    name: 'feedback',
                    title: '反馈与支持',
                    icon: 'el-icon-chat-dot-square',
                    link: './control/Feedback.html',
                    preload: true,
                },
            },
            imodal: {//全局模态框, 用于呈现不适合新开窗体的内联页面层.
                open: false,//是否呈现
                gshow: false,//全局开关. 用于可视化控制.
                mshow: false,//模态框展示开关, 用于控制前置动画效果
                src: '',//目标页面地址.
                style: 'height: 420px;',//iframe的样式, 用于定制内联宽高等属性. 一般的, 宽度默认为100%, 高度无默认值.
                scroll: 'no',//iframe是否允许滚动. yes | no
                option: {
                    mask: true, //是否显示遮罩层，开启 draggable 时，强制不显示
                    width: '520px',//对话框宽度，对话框的宽度是响应式的，当屏幕尺寸小于 768px 时，宽度会变为自动auto。当其值不大于 100 时以百分比显示，大于 100 时为像素
                    styles: 'top:0;',//设置浮层样式，调整浮层位置等，该属性设置的是.ivu-modal的样式
                    className: undefined, //设置对话框容器.ivu-modal-wrap的类名，可辅助实现垂直居中等自定义效果
                    zIndex: 29999999,//层级
                },
            },
            imodal_backup: '',//模态框缺省参数备份.
            ua: agent.at,
            netstatus: (navigator.onLine ? 'online' : 'offline'),
        }
    },
    methods: {
        showLoading(text, dur) {
            dur = dur ? dur : 0;
            text = text ? text : '正在加载中...';
            if ($('#zxxLoadingSpanTip').length > 0) {
            } else {
                this.loading = this.showMessage('<span id="zxxLoadingSpanTip" style="vertical-align:bottom;">' + text + '</span>', 'loading', dur, false, false);//默认不自动关闭.
            }
        },
        closeLoading(dur) {
            dur = dur ? dur : 1000;
            if (this.loading) {
                setTimeout(this.loading, dur);//延迟1s关闭, 给予充足的渲染时间.
            }
        },
        showMessage(content, type, duration, closable, nodestory) {
            type !== 'loading' ? console.debug('showMessage: ' + content + ' : ' + duration + ' : ' + closable + ' : ' + type) : '';
            type = type ? type : 'info';//info, success, warning, error, loading, 默认info.
            nodestory = nodestory ? nodestory : true;
            closable = closable ? closable : true;//消息层默认支持手动关闭.
            duration = (duration || type === 'loading') ? duration : 3000;
            if (!nodestory) {
                this.$Message.destroy();//全局销毁
            }
            var option = {
                content: content,//内容.
                duration: duration,//x秒后自动关闭.
                closable: closable,//是否支持手动关闭.
            };
            if (type === 'success') {
                this.$Message.success(option);
            } else if (type === 'warning') {
                this.$Message.warning(option);
            } else if (type === 'error') {
                this.$Message.error(option);
            } else if (type === 'alert') {
                proxy.alert('系统提示', content, false, 'error', '确定');
            } else if (type === 'loading') {
                option.duration = 0;
                const loadingMsg = this.$Message.loading(option);
                if (duration !== 0) {
                    setTimeout(loadingMsg, (duration));
                } else {
                    return loadingMsg;
                }
            } else {
                this.$Message.info(option);
            }
        },
        destoryMessage(dur) {
            if (dur !== 0) {
                dur = (dur) ? dur : 3000;
                setTimeout(() => {
                    try {
                        this.$Message.destroy();
                    } catch (e) {
                        //策略异常, 不处理
                    }
                }, dur);
            } else {
                setTimeout(() => {
                    try {
                        this.$Message.destroy();
                    } catch (e) {
                        //策略异常, 不处理
                    }
                }, 1000);//主动延迟1秒, 防止一闪而过的极差体验效果.
            }
        },
        //调起全局模态框
        showModal(imodalConfigOrSrc) {//传入一个src(字符串), 或一个模态框配置信息(对象);
            this.showLoading(false, 3000);
            if (typeof imodalConfigOrSrc === Object) {
                //覆盖式配置
                for (var x in this.imodal) {
                    if (x === 'option') {
                        var option = this.imodal[x];
                        if (imodalConfigOrSrc.hasOwnProperty(x)) {
                            var optionConfig = imodalConfigOrSrc[x];
                            for (var y in option) {
                                if (optionConfig.hasOwnProperty(y)) {
                                    this.imodal[x][y] = optionConfig[y];
                                }
                            }
                        }
                    } else {
                        if (imodalConfigOrSrc.hasOwnProperty(x)) {
                            this.imodal[x] = imodalConfigOrSrc[x];
                        }
                    }
                }
            } else {
                this.imodal.src = imodalConfigOrSrc;
            }
            this.imodal.open = true;
            this.imodal.mshow = true;
        },
        //关闭全局模态框
        closeModal() {
            this.imodal.mshow = false;
            setTimeout(() => {
                //直接恢复缺省配置即可.
                vm.imodal = JSON.parse(vm.imodal_backup);
            }, 1500);
        },
        renderDragDiv(panelId, height) {
            panelId = panelId ? '#' + panelId : 'body';
            $(panelId).find('#dragWin-div.dragwin-dblclick').remove();
            height = height ? height : '60px';
            var ihtml = '<div id="dragWin-div" class="dragwin-dblclick window-drag" style="z-index:20990909;position:absolute;width:100%;top:0;left:0;pointer-events: none;height:' + height + ';"></div>';//
            $(panelId).prepend(ihtml);
        },
        handleClick(tab, event) {
            console.log(tab);
            this.activeTab = tab.name;
            if (tab.name === this.tabs.deskstore.name) {
                var ifa = $('#iframe_' + this.tabs.deskstore.name);
                if (ifa.attr('data-mutual') !== 'true') {
                    ifa.attr('src', ifa.attr('data-src'));//这个需要重新加载一次, 原因是, 用预加载的话, 存在某些异常问题.
                    ifa.attr('data-mutual', 'true');
                    proxy.alert('系统提示', '桌面商店开发中, 敬请期待...');
                }
            } else if (tab.name === this.tabs.feedback.name) {
                agent.Agent.getCoords((coords) => {
                    vm.ua['地理坐标'] = coords;
                    console.debug(vm.ua);
                });
            }
        },
        showLoadingMaster() {
            var that = this;
            this.loadingMaster = true;
            setTimeout(() => {
                that.loadingMaster = false;
            }, 2500);
        },
        //设置所有设备桌面隐藏
        setAllHide(e, res, dontresend) {
            this.showLoadingMaster();
            var elem = dontresend ? $(e) : $(e.currentTarget);
            var nowSwitch = elem.data('switch');
            if (res) {
                nowSwitch = res + '';
            }
            if (nowSwitch + '' === '1') {//隐藏状态
                elem.children('i').removeClass('ivu-icon-md-eye').addClass('ivu-icon-md-eye-off');
                elem.data('switch', 2).attr('title', '点击全部显示');
                !dontresend ? proxy.ipc.send('ipc_repeat', 'ipc_device_wall_hide_all', true) : '';
            } else {//显示状态
                elem.children('i').removeClass('ivu-icon-md-eye-off').addClass('ivu-icon-md-eye');
                elem.data('switch', 1).attr('title', '点击全部隐藏');
                !dontresend ? proxy.ipc.send('ipc_repeat', 'ipc_device_wall_hide_all', false) : '';
            }
        },
        //设置所有设备桌面静音
        setAllMuted(e, res, dontresend) {
            this.showLoadingMaster();
            var elem = dontresend ? $(e) : $(e.currentTarget);
            var nowSwitch = elem.data('switch');
            if (res) {
                nowSwitch = res + '';
            }
            if (nowSwitch + '' === '1') {
                elem.children('i').removeClass('ivu-icon-md-volume-up').addClass('ivu-icon-md-volume-off');
                elem.data('switch', 2).attr('title', '点击全部打开声音');
                !dontresend ? proxy.ipc.send('ipc_repeat', 'ipc_device_wall_muted_all', true) : '';
            } else {
                elem.children('i').removeClass('ivu-icon-md-volume-off').addClass('ivu-icon-md-volume-up');
                elem.data('switch', 1).attr('title', '点击全部静音');
                !dontresend ? proxy.ipc.send('ipc_repeat', 'ipc_device_wall_muted_all', false) : '';
            }
        },
        setAllPause(e, res, dontresend) {
            this.showLoadingMaster();
            var elem = dontresend ? $(e) : $(e.currentTarget);
            var nowSwitch = elem.data('switch');
            if (res) {
                nowSwitch = res + '';
            }
            if (nowSwitch + '' === '1') {
                elem.children('i').removeClass('ivu-icon-md-pause').addClass('ivu-icon-md-play');
                elem.data('switch', 2).attr('title', '点击全部播放');
                !dontresend ? proxy.ipc.send('ipc_repeat', 'ipc_device_wall_pause_all', true) : '';
            } else {
                elem.children('i').removeClass('ivu-icon-md-play').addClass('ivu-icon-md-pause');
                elem.data('switch', 1).attr('title', '点击全部暂停');
                !dontresend ? proxy.ipc.send('ipc_repeat', 'ipc_device_wall_pause_all', false) : '';
            }
        }
    },
    created: function () {
    },
    mounted() {
        var that = this;
        this.handleClick({name: this.activeTab});
        proxy.ipc.on('ipc_window_control_cgi', function (event, isshow, paramJson) {
            if (paramJson && paramJson != null && paramJson.tab) {
                var tab = decodeURI(decodeURI(paramJson.tab));
                if (tab && tab !== that.activeTab) {
                    that.handleClick({name: tab});
                }
            }
        });
    }
});


window.onload = function () {
    vm.loading = false;

    //更新提醒.
    if (proxy.appVar._platform === 'darwin' && proxy.appVar._updateavaava) {
        proxy.alert('ideawall 更新提醒', '检测到全新版本, 点击前往下载', (response) => {
            if (response === 0) proxy.openExternal(proxy.appVar._siteurl + 'update.html');
        }, 'info', ['前往下载']);
    }
};

$(function () {
    /**
     * 此处为妥协 window-drag 在无边窗口中效果不良的设计.
     * @type {appVar._controlwindow|{}}
     */
    var win = proxy.appVar._controlwindow;
    var filterElems = ['zxx-controls', 'el-tabs__nav', 'J_iframe'];
    let biasX = 0, biasY = 0;
    //按下鼠标, 开始监听鼠标移动事件, 做一下层下过滤.
    document.addEventListener('mousedown', function (e) {
        if (moveFilter(e)) {
            biasX = e.x, biasY = e.y;
            document.addEventListener('mousemove', moveEvent);
            $('iframe').addClass('exclude-events');
        }
    });
    //松开鼠标或鼠标离开文档, 移除鼠标移动监听事件
    document.addEventListener('mouseup', function () {
        biasX = 0, biasY = 0;
        document.removeEventListener('mousemove', moveEvent);
        $('iframe').removeClass('exclude-events');
    });
    document.addEventListener('mouseleave', function () {
        biasX = 0, biasY = 0;
        document.removeEventListener('mousemove', moveEvent);
        $('iframe').removeClass('exclude-events');
    });

    //监听系统拖拽部分的双击事件
    $(document).on('dblclick', (e) => {
        if (moveFilter(e)) {//如果该div上的其他元素点击, 则忽略双击事件.
            var win = proxy.appVar._controlwindow;
            var dblAction = 'max';//max|min. //从设置中读取, 双击事件是最大化还是最小化.
            if (dblAction === 'max') {
                if (win.isMaximized()) {//返回 boolean, 窗口是否最大化.
                    if (proxy.appVar._platform !== 'darwin') {
                        win.restore();//win平台下使用这个恢复. 待测试.
                    } else {
                        win.unmaximize();//将最小化的窗口恢复为之前的状态. [restore()方法是: 将最小化的窗口恢复为之前的状态.]
                    }
                } else {
                    win.maximize();//窗口最大化.
                }
            } else if (dblAction === 'min') {
                win.minimize();//在某些平台上, 最小化的窗口将显示在Dock中.
            }//如果没有设置, 不响应双击事件
        }
    });

    function moveEvent(e) {
        win.setPosition(e.screenX - biasX, e.screenY - biasY);
    }

    function moveFilter(e) {
        e = e || window.event;
        for (var x in filterElems) {
            if ($(e.target).hasClass(filterElems[x]) || $(e.target).parents().hasClass(filterElems[x])) {
                return false;
            }
        }
        return true;
    }
});

/**
 * 监测联网状态
 */
window.addEventListener('online', function () {
    // let option = {
    //     title: "有网了!",
    //     body: "机子帮你开好了, 快来上网啊~",
    //     icon: "../../assets/images/online.png",
    // };
    // // 创建上线通知
    // new window.Notification(option.title, option);
    console.warn('重新连上网络了');
    vm.netstatus = 'online';
    var title = $('.zxx-title').text();
    $('title,.zxx-title').text(title.replace(' [连接已断开]', ''));
});

window.addEventListener('offline', function () {
    // let option = {
    //     title: "断网了!",
    //     body: "尝尝10亿伏特!还敢上网不?(炮姐如是说!)",
    //     icon: "../../assets/images/offline.png",
    // };
    // // 创建上线通知
    // new window.Notification(option.title, option);
    console.warn('断网了');
    vm.netstatus = 'offline';
    var title = $('.zxx-title').text();
    console.debug(title.indexOf('[连接已断开]'));
    if (title.indexOf('[连接已断开]') === -1) {
        $('title,.zxx-title').text(title + ' [连接已断开]');
    }
});