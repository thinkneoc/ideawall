const baseController = proxy.require('../controller/BaseController');
const http = proxy.require('../core/Http');
const logger = proxy.require('../core/Logger');
const localDeskModel = proxy.require('../model/LocalDeskModel')();
const deviceDeskModel = proxy.require('../model/DeviceDeskModel')();

var vm = new Vue({
    el: '#app',
    data: function () {
        return {
            loading: true,
            lock: proxy.lock,
            loadingReadme: true,
            loadingApply: false,
            showApply: false,
            iSettingOnDevicce: false,
            formKey: T.p('fk'),//用于标识表单的索引键, 这里是localwall的 id
            ld_backUp: {
                source_type: '',
                source_val: '',
                params: '',
            },
            ld: {//数据实体
                source_type: '',
                source_val: '',
                params: '',
            },
            readmePath: '',//README.md 文件路径.
            isSourceEffect: true,//桌面源是否有效.
            redrawSign: false,
        };
    },
    computed: {
        ldSourceType() {
            return this.ld.source_type;
        },
        ldSourceVal() {
            return this.ld.source_val;
        }
    },
    watch: {
        ldSourceType() {
            this.updateSource();
        },
        ldSourceVal() {
            this.updateSource();
        }
    },
    methods: {
        dealWithLdData(data) {
            this.ld = data;
            this.ld_backUp = JSON.parse(JSON.stringify(data));//阻止引用
        },
        //检测配置说明文件是否存在
        checkReadmeFile() {
            var that = this;
            setTimeout(() => {
                that.readmePath = localDeskModel.getReadmePath(this.ld);
                that.loadingReadme = false;
            }, 2000);
        },
        //检测本地源是否合法
        checkSourceEffect() {
            return this.isSourceEffect = localDeskModel.isSourceEffect(this.ld);
        },
        //打开 Readme 文件
        showReadme() {
            if (this.readmePath) {
                proxy.ipc.send('ipc_window_open', 'readme', this.ld.id, {link: encodeURI(encodeURI(this.readmePath))});
            } else {
                proxy.alert('系统提示', '当前桌面尚未提供配置说明文件!', false, 'error');
            }
        },
        showFeedback() {
            if (this.ld_backUp.feedback && (this.ld_backUp.feedback + '').trim() !== '' && this.ld_backUp.feedback.indexOf('http') === 0) {
                $$.gotoBbs(this.ld_backUp.feedback);
            } else {
                proxy.alert('系统提示', '目标地址非法!');
            }
        },
        //接入Json编辑器
        gotoJSONEditor(key) {
            var that = this;
            var params = this.ld[key];
            if (params && typeof (params) == 'string') {
                params = JSON.parse(params);
            }
            console.debug(params);
            proxy.ipc.send('ipc_window_open', 'jsoneditor', {title: that.ld.name, data: params});
            proxy.ipc.removeAllListeners('ipc_window_jsoneditor_egi');
            proxy.ipc.on('ipc_window_jsoneditor_egi', function (event, data) {
                console.debug('接收到 JSON 编辑器回传信息 === ');
                console.debug(data);
                $('#ldParams').val($$.converterJSONString(data));
                that.ld.params = JSON.parse(data);
                that.updateSource();
            });
        },
        //选择本地桌面源
        selectSource() {
            var that = this;
            if (that.ld.switch_source) {
                $$.selectFile(false, false, 'text/html', (files) => {
                    console.log(files);
                    try {
                        that.ld.source_type = 'local';
                        that.ld.source_val = files[0].path;
                    } catch (e) {
                    }
                });
            }
        },
        //更新桌面源
        updateSource() {
            if (this.checkSourceEffect()) {//改动必须有效
                if (this.ld_backUp.params == this.ld.params && this.ld.source_type == this.ld_backUp.source_type && this.ld.source_val == this.ld_backUp.source_val) {//无改动
                    this.showApply = false;
                } else {//有改动
                    //检查一下是否有被设备配置使用
                    var device = deviceDeskModel.isDisplay(this.ld.id);
                    if (device) {
                        this.iSettingOnDevicce = true;
                        this.showApply = true;
                    } else {
                        this.iSettingOnDevicce = false;
                    }
                    //直接更新, 不发送通信指令
                    localDeskModel.updateById({
                        id: this.ld.id,
                        source_type: this.ld.source_type,
                        source_val: this.ld.source_val,
                        params: JSON.parse(JSON.stringify(this.ld.params)),//阻止引用指针
                    }, true);
                    this.ld_backUp = JSON.parse(JSON.stringify(this.ld));//阻止引用
                    if(!this.redrawSign){
                        proxy.ipc.send('ipc_repeat', 'ipc_render_control_mydesk_hideInitSign', this.ld.id);
                        this.redrawSign = true;
                    }
                }
            } else {
                this.showApply = false;
            }
        },
        //应用改动
        apply() {
            top.vm.showLoadingMaster();
            var that = this;
            this.showApply = true;
            this.loadingApply = true;
            localDeskModel.syncUpdate();//发送同步指令
            setTimeout(() => {
                that.loadingApply = false;
                that.showApply = false;
            }, 500);
        },
    },
    created: function () {
        console.debug('fk: ' + this.formKey);
        this.dealWithLdData(localDeskModel.getDesk(this.formKey));
        this.checkReadmeFile();
        this.checkSourceEffect();
    },
    mounted() {
        var that = this;
        $('#ldParams').val(this.ld.params);
        proxy.ipc.on('ipc_lock_req', function (event, swicth) {
            proxy.lock = swicth;
            proxy.appVar._lock = swicth;
            proxy.refreshAppVar();
            that.lock = swicth;
        });
    }
});

window.onload = function () {
    vm.loading = false;
};