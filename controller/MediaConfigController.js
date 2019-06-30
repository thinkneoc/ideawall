const baseController = proxy.require('../controller/BaseController');
const http = proxy.require('../core/Http');
const logger = proxy.require('../core/Logger');
const datetime = proxy.require('../core/Datetime')();
const localDeskModel = proxy.require('../model/LocalDeskModel')();
const mediaModel = proxy.require('../model/MediaModel')();
const lang = proxy.require('../core/Lang')();

var vm = new Vue({
    el: '#app',
    data: function () {
        return {
            loading: true,
            lock: proxy.lock,
            formKey: T.p('fk'), //用于标识表单的索引键, 这里是localwall的 id
            orignLd: {},
            ld: { //数据实体
                medias: [],
            },
            carousel: { //走马灯焦点图
                width: 306,
                height: 170,
                type: '', //类型: card/''
                autoplay: true, //自动切换
                loop: true, //循环
                trigger: '', //指示器触发方式: click/''
                indicatorPosition: '', //指示器: outside/none/''
                arrow: 'hover', //切换箭头的显示时机: always/hover/never
                initialIndex: '0', //初始索引
                interval: 3000, //自动切换的时间间隔，单位为毫秒
                data: [],
            },
            mediaUpload: {
                accepts: { //接受上传的文件类型（thumbnail-mode 模式下此参数无效）
                    'picture': 'image/*',
                    'video': '.mp4,.mov,.mkv,.3gp,.rmvb,.mpg,.mpeg,.asf,.wmv,.webm,.ogg',
                    'page': '',
                },
                limit: undefined, //文件上传个数限制
                listType: 'text', //文件列表的类型: text/picture/picture-card
                data: [], //文件列表
            },
            redrawSign: false,
        };
    },
    methods: {
        //构建走马灯
        buildCarousel(data, isqz) {
            if (!data) {
                proxy.alert('警告', '非法参数!', false, 'warning');
                return;
            }
            this.carousel.data = [];
            var indicatorPosition = '',
                arrow = 'hover';
            if (data.medias.length <= 0 || isqz) {
                data = this.buildPreview(data);
                console.debug(data);
                this.carousel.data.push('<img  class="pictiure_carousel" src="' + data.preview + '" style="width:100%;height:100%;"/>');
                indicatorPosition = 'none';
                arrow = 'never';
            } else {
                for (var x in data.medias) {
                    var type = data.type;
                    if (type === 'picture') {
                        if (mediaModel.isLocalMediaEffect(data.medias[x].filepath)) {
                            this.carousel.data.push('<img  class="pictiure_carousel" src="' + data.medias[x].filepath + '" style="width:100%;height:100%;"/>');
                        }
                    } else if (type === 'video') {
                        if (mediaModel.isLocalMediaEffect(data.medias[x].filepath)) {
                            this.carousel.data.push('<video class="video_carousel" src="' + data.medias[x].filepath + '" style="width:100%;height:100%;" controls="controls" muted="muted" />');
                        }
                    } else if (type === 'page') {
                        this.carousel.data.push('<img  class="pictiure_carousel" src="' + avatarUtil.generateBg('暂无预览', this.carousel.width, this.carousel.height, false, 'rgb(74,74,74)', {
                            x: 150
                        }) + '" style="width:100%;height:100%;"/>');
                        // this.carousel.data.push('<iframe class="iframe_carousel"  src="' + data.medias[x].filepath + '" name="iframe_carousel" style="pointer-events: none;width: 100%;height: 100%;" frameborder="0" scrolling="no"></iframe>');
                    }
                }
                var len = data.medias.length;
                if (len > 4 || len <= 1) {
                    indicatorPosition = 'none';
                }
                if (len <= 1) {
                    arrow = 'never';
                }
            }
            this.carousel.indicatorPosition = indicatorPosition;
            this.carousel.arrow = arrow;
            if (this.carousel.data.length <= 0) {
                this.buildCarousel(data, true);
            }
            this.orignLd = data;
        },
        genPreview(name, color, setColor) {
            console.debug(name);
            return avatarUtil.generateBg(name, this.carousel.width, this.carousel.height, false, false, {
                x: 150
            });
        },
        buildPreview(data) {
            var dtn = localDeskModel.getDeskTypeName(data.type);
            data.typeExplain = dtn;
            if (!data.preview || data.preview + '' == '') {
                data.preview = this.genPreview(dtn.fullname);
            }
            return data;
        },
        dealWithLdData(data) {
            data = data ? data : this.ld;
            data.medias = mediaModel.getsByDeskId(data.id);
            this.buildCarousel(data);
            this.ld = this.orignLd;
        },
        //更新媒体组数据
        updateMedias(fileList) {
            top.vm.showLoadingMaster();
            var tList = [];
            var invalidNum = 0;
            var repeatNum = 0;
            var rejectNum = 0;
            for (var x in fileList) {
                var zxx = fileList[x];
                if (zxx.name === null || zxx.name.length <= 0 || zxx.name.indexOf('.') === -1 || zxx.raw.path === null) {
                    invalidNum++;
                    continue;
                }
                var bol = false;
                var ftype = zxx.raw.type;
                if (this.ld.type === 'picture') {
                    if (ftype.indexOf('image/') === 0) {
                        bol = true;
                    }
                } else if (this.ld.type === 'video') {
                    var suffix = zxx.name.substring(zxx.name.lastIndexOf(".") + 1, zxx.name.length);
                    if (this.mediaUpload.accepts['video'].indexOf(suffix) > -1) {
                        bol = true;
                    }
                }
                if (!bol) {
                    rejectNum++;
                    continue;
                }
                if (!mediaModel.isExist(this.ld.id, zxx.name, zxx.raw.path)) {
                    tList.push({
                        filename: zxx.name,
                        filepath: zxx.raw.path,
                        date_add: datetime.now(),
                        ld_id: this.ld.id,
                    });
                    continue;
                }
                repeatNum++;
            }
            if (repeatNum > 0) {
                if (repeatNum > 1) {
                    proxy.alert('系统提示', '已存在的目标文件: ' + repeatNum + ' 项 (已自动过滤)');
                } else {
                    proxy.alert('系统提示', '已存在的目标文件: ' + fileList[0].name);
                }
            } else if (invalidNum > 0) {
                if (invalidNum > 1) {
                    proxy.alert('系统提示', '非法文件类型: ' + invalidNum + ' 项 (已自动过滤)');
                } else {
                    proxy.alert('系统提示', '非法文件类型: ' + fileList[0].name);
                }
            } else if (rejectNum > 0) {
                if (rejectNum > 1) {
                    proxy.alert('系统提示', '拒绝被接受的媒体文件类型: ' + rejectNum + ' 项 (已自动过滤)');
                } else {
                    proxy.alert('系统提示', '拒绝被接受的媒体文件类型: ' + fileList[0].name);
                }
            }
            if (tList.length > 0) {
                mediaModel.addsByDeskId(this.ld.id, tList);
                this.dealWithLdData();
                if(!this.redrawSign){
                    proxy.ipc.send('ipc_repeat', 'ipc_render_control_mydesk_hideInitSign', this.ld.id);
                    this.redrawSign = true;
                }
                return true;
            }
        },
        //删除媒体
        delMedia(willDelMediaId) {
            top.vm.showLoadingMaster();
            mediaModel.deleteByDeskId(this.ld.id, willDelMediaId);
            this.dealWithLdData();
        },
        //清空媒体组数据
        clearMedias() {
            top.vm.showLoadingMaster();
            mediaModel.clearByDeskId(this.ld.id);
            this.dealWithLdData();
        },
        //等待手动触发上传动作, 暂时不需要.
        submitUpload() {
            this.$refs.upload.submit();
        },
        //文件超出个数限制时的钩子
        handleExceed(files, fileList) {
            console.log(file, fileList);
        },
        //文件状态改变时的钩子，添加文件、上传成功和上传失败时都会被调用
        handleChange(file, fileList) {
            console.log(file, fileList);
            return this.updateMedias([file]);
        },
        //文件列表移除文件时的钩子
        handleRemove(file, fileList) {
            top.vm.showLoadingMaster();
            console.log(file, fileList);
            this.delMedia(false, file.raw.path);
        },
        //点击文件列表中已上传的文件时的钩子
        handlePreview(file) {
            console.log(file);
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