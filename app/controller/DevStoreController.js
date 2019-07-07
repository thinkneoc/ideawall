const baseController = proxy.require('../controller/BaseController');
const http = proxy.require('../core/Http');
const logger = proxy.require('../core/Logger');
const uuid = proxy.require('../core/UUID')();
const download = proxy.require('../core/Download')();
const datetime = proxy.require('../core/Datetime')();
const fs = proxy.require('fs');
const lang = proxy.require('../core/Lang')();
const localDeskModel = proxy.require('../model/LocalDeskModel')(proxy.appVar);

var vm = new Vue({
    el: '#app',
    data: function () {
        return {
            loading: true,
            lock: proxy.lock,
            origin: proxy.appVar._storeurl,
            nowURL: proxy.appVar._storeurl,
        }
    },
    methods: {
        //发送通信消息
        postMessage(data) {//data 结构为 指令+数据
            try {
                $('iframe#iframe_store')[0].contentWindow.postMessage(data, this.origin);
            } catch (e) {
                //...
            }
        },
        //接收通信消息
        getMessage(rs) {
            var data = rs.data;
            this.nowURL = data.location;
            this.postMessage('呵呵哒~');
            if (data.command === 'deskstore.download' && data.data.url && data.data.file && data.data.xname && data.data.info) {
                if (localDeskModel.isExist()) {
                    proxy.alert('系统提示', '此桌面已存在! 安装失败!', false, 'error');
                } else {
                    //因为整个页面的控制权不在客户端, 所以, 进度和结果全部回推回去.
                    download.downloadFile(data.data.url, proxy.appVar._apath.dir.download, data.data.xname, data.data.file, (code, percentage, received, total, file, chunkLength) => {
                        this.postMessage({
                            cmd: 'downloading', data: {
                                code: code,
                                percentage: percentage,
                                received: received,
                                total: total,
                                file: file,
                                chunkLength: chunkLength,
                            }
                        });
                        //结束并且成功之后, 需要干几件事.
                        if (code === 'finished') {
                            //解压: 下次启动的时候自动删除 zip 文件
                            var path = proxy.appVar._apath.dir.download + '/' + data.data.xname;
                            if (!fs.existsSync(path) && lang.endsWith(path, '.zip')) {
                                proxy.alert('系统提示', '安装包不存在! 安装失败!', false, 'error');
                                this.postMessage({
                                    cmd: 'downloaded', data: {
                                        code: 'install',
                                        res: 'error',
                                        msg: '安装包不存在! 安装失败!',
                                    }
                                });
                            } else {
                                proxy.ipc.send('ipc_resolver', 'unzip', {
                                    zipPath: path,//zip 文件路径
                                    outPath: proxy.appVar._apath.dir.wall,//输出目录
                                });
                                var info = data.data.info;
                                info.init_sign = '1';
                                info.source_val = proxy.appVar._apath.dir.wall + '/' + info.source_val;//云端的源路径是相对路径, 没毛病
                                info.date_get = datetime.now();//日期, 在这里生成, 也没毛病.
                                //索引到数据库
                                if (!localDeskModel.addDesk(info)) {
                                    proxy.alert('系统提示', '此桌面已存在! 安装失败!', false, 'error');
                                    this.postMessage({
                                        cmd: 'downloaded', data: {
                                            code: 'install',
                                            res: 'error',
                                            msg: '此桌面已存在! 安装失败!',
                                        }
                                    });
                                } else {
                                    //重新加载桌面项数据
                                    proxy.ipc.send('ipc_repeat', 'ipc_render_control_mydesk_reload');
                                    this.postMessage({
                                        cmd: 'downloaded', data: {
                                            code: 'install',
                                            res: 'success',
                                        }
                                    });
                                }
                            }
                        }
                    }, (e, file) => {
                        this.postMessage({
                            code: 'error',
                            e: e,
                            file: file,
                        });
                    });
                }
            }
        }
    },
    created: function () {
    },
    mounted() {
        var that = this;
        var xiframe = $('iframe#iframe_store');
        proxy.ipc.on('ipc_lock_req', function (event, swicth) {
            proxy.lock = swicth;
            proxy.appVar._lock = swicth;
            proxy.refreshAppVar();
            that.lock = swicth;
        });
        proxy.ipc.on('ipc_render_control_deskstore_refresh', (event, cmd) => {
            that.loading = true;
            $$.dealIframe(xiframe, this.nowURL);
        });
        proxy.ipc.on('ipc_render_control_deskstore_home', (event, cmd) => {
            that.loading = true;
            $$.dealIframe(xiframe, proxy.appVar._storeurl);
        });
        proxy.ipc.on('ipc_render_control_deskstore_open', (event, cmd) => {
            proxy.ipc.send('ipc_window_open', 'browser', that.nowURL);
        });
        proxy.ipc.on('ipc_render_control_deskstore_changeurl', (event, url) => {
            that.loading = true;
            this.nowURL = url;
            $$.dealIframe(xiframe, url);
        });
        top.vm.netLoading('deskstore', () => {
            this.loading = true;
            this.$Loading.start();
        }, () => {
            this.loading = false;
            this.$Loading.finish();
        });
        xiframe.load(function () {
            that.loading = false;
            top.vm.loadingTab = false;
            //把本地的桌面项索引发送过去, 方便判定处理.
            that.postMessage({
                cmd: 'hello',
                version: proxy.appVar._version,
                data: localDeskModel.initial().selectAll(),
            });
        });
    }
});