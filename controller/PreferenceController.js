const baseController = proxy.require('../controller/BaseController');
const http = proxy.require('../core/Http');
const logger = proxy.require('../core/Logger');
const preferenceModel = proxy.require('../model/PreferenceModel')(proxy.appVar);
const deviceMessage = proxy.require('../message/DeviceMessage')();

var vm = new Vue({
    el: '#app',
    data: function () {
        return {
            loading: true,
            btnLoading: {
                checkUpdate: {
                    bol: false,
                    text: '正在检查...',
                    htext: '检查更新',
                },
                reboot: {
                    bol: false,
                    text: '正在重启...'
                },
                repair: {
                    bol: false,
                    text: '正在修复...'
                },
            },
            menuInfoTab: 'common',
            animation: {
                in: 'random',
                out: 'random',
                stay: 'random',
                preview: '',
            },
            preferences: [],//设置列表
        }
    },
    methods: {
        handleInfoTabClick() {
        },
        //常规设置项
        doSetPreference(index, key, nval) {
            top.vm.showLoadingMaster();
            var preference;
            if (!index) {
                preference = this.preferences.filter((item) => {
                    return item.key + '' == key + '';
                })[0];
                preference.value.val = nval;
            } else {
                preference = this.preferences[index];
            }
            console.debug(preference);
            //数据库更新
            preferenceModel.updateById(JSON.parse(JSON.stringify(preference)));//阻止引用指针.
            /**
             * 即时生效
             */
            if (preference.key === 'autoLaunch') {//开机自启动
                this.setAutoLaunch(preference.value.enable);
            }
            if (preference.sync === 2) {//同步到设备桌面
                deviceMessage.syncUpdate();
            }
        },
        //设置开机自启动
        setAutoLaunch(enable) {
            if (enable) {
                proxy.appVar._autoLauncher.enable();
            } else {
                proxy.appVar._autoLauncher.disable();
            }
        },
        //重启
        reboot() {
            var that = this;
            this.btnLoading.reboot.bol = true;
            setTimeout(() => {
                proxy.remote.app.relaunch();
                proxy.remote.app.quit();
                that.btnLoading.reboot.bol = false;
            }, 2000);
        },
        //检查更新
        checkUpdate() {
            var that = this;
            if (!this.btnLoading.checkUpdate.bol) {
                this.btnLoading.checkUpdate.bol = true;
                setTimeout(() => {
                    proxy.ipc.send('ipc_update_check');
                    proxy.ipc.removeAllListeners('ipc_app_update_ret');
                    var lastCode = '';
                    proxy.ipc.on('ipc_app_update_ret', (event, obj) => {
                        if (obj.code != lastCode && obj.code != 'downloading') {//非下载进度事件, 防止接收两次的问题.
                            lastCode = obj.code;
                            console.debug('ipc_app_update_ret');
                            console.debug(obj);
                            if (obj.code === 'updateAva') {
                                that.btnLoading.checkUpdate.bol = false;
                                that.btnLoading.checkUpdate.htext = '检测到新更新包';
                                if (proxy.appVar._platform === 'darwin') {
                                    proxy.alert('ideawall 更新提醒', '检测到全新版本, 点击前往下载', (response) => {
                                        if (response === 0) proxy.openExternal(proxy.appVar._siteurl + 'update.html');
                                    }, 'info', ['前往下载', '稍后处理']);
                                }
                            } else if (obj.code === 'updateNotAva') {
                                that.btnLoading.checkUpdate.bol = false;
                                that.btnLoading.checkUpdate.htext = '暂无可用更新包';
                            } else if (obj.code === 'downloading') {
                                that.btnLoading.checkUpdate.text = '已下载 ' + obj.perc + '%';
                            } else if (obj.code === 'downloaded') {
                                that.btnLoading.checkUpdate.bol = false;
                                that.btnLoading.checkUpdate.htext = '已下载完成';
                            } else if (obj.code === 'error') {
                                if (proxy.appVar._platform !== 'darwin') {
                                    that.btnLoading.checkUpdate.bol = false;
                                    that.btnLoading.checkUpdate.htext = '暂无可用更新包';
                                }
                            }
                        }
                    });
                }, 2000);
            }
        },
        //修复
        repair() {
            var that = this;
            var message = "警告: 你正在执行系统修复任务";
            var detail = "此动作将清空本地持久化数据库, 且无法回滚. 请确认是否继续执行？";
            proxy.confirm(message, detail, (response) => {
                if (response === 0) {
                    that.btnLoading.repair.bol = true;
                    $('.zxx-pre-repair-tip').text('正在执行系统修复, 修复完成后 ideawall 将自动重启...');
                    setTimeout(() => {
                        proxy.fs.unlink(proxy.appVar._dbath, function (err) {
                            if (err) {
                                return console.error(err);
                            }
                            that.btnLoading.repair.bol = false;
                            $('.zxx-pre-repair-tip').text('已完成, 等待 ideawall 重启...');
                            that.reboot();
                            return true;
                        });
                    }, 4000);
                }
            });
        },
        //前往官网
        gotoOffical() {
            proxy.openExternal(proxy.appVar._siteurl);
        },
        //关于
        openAbout() {
            // proxy.openExternal(proxy.appVar._siteurl);
            proxy.ipc.send('ipc_window_open', 'about');
        },
        //预览动画
        previewAnimate(type) {
            if (type === 'out') {
                this.animation.preview = this.animation.out;
                if (this.animation.preview == 'random') {
                    this.animation.preview = animation.getAnimateOut();
                }

            } else {
                this.animation.preview = this.animation.in;
                if (this.animation.preview == 'random') {
                    this.animation.preview = animation.getAnimateIn();
                }
            }
        }
    },
    created: function () {
        this.preferences = preferenceModel.getAll();
        for (var x in this.preferences) {
            this.preferences[x].value = JSON.parse(this.preferences[x].value);
        }
        this.preferences = this.preferences.sort(function (a, b) {
            return a.sort - b.sort;
        });
    },
    mounted() {

    }
});

window.onload = function () {
    vm.loading = false;
};