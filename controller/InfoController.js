const baseController = proxy.require('../controller/BaseController');
const http = proxy.require('../core/Http');
const logger = proxy.require('../core/Logger');
const localDeskModel = proxy.require('../model/LocalDeskModel')();
const datetime = proxy.require('../core/Datetime')();
const mediaModel = proxy.require('../model/MediaModel')();

var vm = new Vue({
    el: '#app',
    data: function () {
        return {
            loading: true,
            lock: proxy.lock,
            formKey: T.p('fk'),//用于标识表单的索引键, 这里是localwall的 id
            animationLevel: 3,
            ld_entity: {},
            ld_id: 0,//id
            ld: {//数据实体
                name: {
                    explain: '名称',
                    value: '无法识别',
                    active: true,
                    format: function (that) {
                        return '<div class="zxx-collapse-content">' + that.name + '</div>';
                    }
                },
                ename: {
                    explain: '索引',
                    value: '无法识别',
                },
                type: {
                    explain: '类别',
                    value: '无法识别',
                    format: function (that) {
                        return localDeskModel.getDeskTypeName(that.type).fullname;
                    }
                },
                medias: {
                    explain: '媒体组',
                    value: '无法识别',
                    format: function (medias) {
                        if (medias && medias.length > 0) {
                            var ihtml = '<div class="zxx-collapse-content">';
                            for (var x in medias) {
                                ihtml += medias[x].filepath + '<br/>';
                            }
                            ihtml += '</div>';
                            return ihtml;
                        }
                        return '未配置媒体组数据';
                    }
                },
                author: {
                    explain: '作者',
                    value: '无法识别',
                    format: function (that) {
                        return '<div class="zxx-collapse-content">' + that.author + '</div>';
                    }
                },
                description: {
                    explain: '描述',
                    value: '无法识别',
                    active: true,
                    format: function (that) {
                        return (that.description && (that.description + '').trim() != '') ? that.description : '未找到描述信息';
                    }
                },
                source_type: {
                    explain: '桌面源',
                    value: '无法识别',
                    format: function (that) {
                        if (that.ename.indexOf('default-') === 0) {
                            return '<div class="zxx-collapse-content">官方默认' + localDeskModel.getDeskTypeName(that.type).name + '桌面源</div>';
                        }
                        var sval = localDeskModel.getIndexPath({
                            source_type: that.source_type,
                            source_val: that.source_val
                        });
                        return '<div class="zxx-collapse-content">' + sval ? sval : '未找到桌面源信息' + '</div>';
                    }
                },
                date_get: {
                    explain: '获取时间',
                    value: '无法识别',
                    format: function (that) {
                        return that.date_get;
                    }
                },
                init_sign: {
                    explain: '状态',
                    value: '无法识别',
                    format: function (that) {
                        return that.init_sign == 1 ? '等待初始化<br/><span style="font-size:12px;">你可以通过桌面项左上角的蒲公英图标知晓当前桌面的配置初始化状态.</span>' : '正常';
                    }
                },
            },
            activeCollapse: [],//自动打开的面板列表, 自动构建, 通过active参数.
        };
    },
    methods: {
        dealWithLdData(data) {
            for (var x in data) {
                if (this.ld.hasOwnProperty(x)) {
                    if (data[x] && (data[x] + '').trim() != '') {
                        var val = data[x];
                        if (this.ld[x].hasOwnProperty('format')) {
                            val = this.ld[x].format(data);
                        }
                        this.ld[x].value = val;
                    }
                    if (this.ld[x].active) {
                        this.activeCollapse.push('zxx-collapse-' + x);//不用考虑重复的问题. 没必要.
                    }
                }
            }
            this.ld_entity = data;
            this.ld_id = data.id;
            this.ld.medias.value = this.ld.medias.format(mediaModel.getsByDeskId(this.ld_id));
        },
    },
    created: function () {
        console.debug('fk: ' + this.formKey);
        this.dealWithLdData(localDeskModel.getDesk(this.formKey));
    },
    mounted() {
        var that = this;
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