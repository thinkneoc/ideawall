const baseController = proxy.require('../controller/BaseController');
const http = proxy.require('../core/Http');
const logger = proxy.require('../core/Logger');
const datetime = proxy.require('../core/Datetime')();
const localDeskModel = proxy.require('../model/LocalDeskModel')();
const mediaModel = proxy.require('../model/MediaModel')();

var vm = new Vue({
    el: '#app',
    data: function () {
        return {
            loading: true,
            formKey: T.p('fk'),//用于标识表单的索引键, 这里是localwall的 id
            orignLd: {},
            ld: {},//数据实体
            carousel: {//走马灯焦点图
                width: 306,
                height: 170,
                type: '',//类型: card/''
                autoplay: true,//自动切换
                loop: true,//循环
                trigger: '',//指示器触发方式: click/''
                indicatorPosition: '',//指示器: outside/none/''
                arrow: 'hover',//切换箭头的显示时机: always/hover/never
                initialIndex: '0',//初始索引
                interval: 3000,//自动切换的时间间隔，单位为毫秒
                data: [],
            },
            mediaUpload: {
                accepts: {//接受上传的文件类型（thumbnail-mode 模式下此参数无效）
                    'picture': 'image/*',
                    'video': '.mp4,.mov,.mkv,.3gp,.rmvb,.mpg,.mpeg,.asf,.wmv,.webm,.ogg',
                    'page': '',
                },
                limit: undefined,//文件上传个数限制
                listType: 'text',//文件列表的类型: text/picture/picture-card
                data: [],//文件列表
            },
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
            var indicatorPosition = '', arrow = 'hover';
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
                        this.carousel.data.push('<img  class="pictiure_carousel" src="' + avatarUtil.generateBg('暂无预览', this.carousel.width, this.carousel.height, false, 'rgb(74,74,74)', {x: 150}) + '" style="width:100%;height:100%;"/>');
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
            return avatarUtil.generateBg(name, this.carousel.width, this.carousel.height, false, false, {x: 150});
        },
        buildPreview(data) {
            var dtn = localDeskModel.getDeskTypeName(data.type);
            data.typeExplain = dtn;
            if (!data.preview || data.preview + '' == '') {
                data.preview = this.genPreview(dtn.fullname);
            }
            return data;
        },
        buildFileList() {
            this.mediaUpload.data = [];
            for (var x in this.ld.medias) {
                var zxx = this.ld.medias[x].filepath;
                var filename = zxx.substring(zxx.lastIndexOf('/') + 1, zxx.length);//截取文件名
                if (mediaModel.isLocalMediaEffect(zxx)) {
                    this.mediaUpload.data.push({
                        name: filename,
                        url: zxx,
                    });
                } else {
                    this.mediaUpload.data.push({
                        name: filename,
                        url: zxx,
                        status: 'error',
                    });
                }
            }
        },
        dealWithLdData(data) {
            data = data ? data : this.ld;
            data.medias = mediaModel.getsByDeskId(data.id);
            this.buildCarousel(data);
            this.ld = this.orignLd;
        },
        //更新媒体组数据
        updateMedias(willDelUrl) {
            var medias = [];
            for (var x = 0; x < this.mediaUpload.data.length; x++) {
                var zxx = this.mediaUpload.data[x];
                if (willDelUrl && zxx.url === willDelUrl) {
                    this.mediaUpload.data.splice(x, 1);
                    x--;
                    continue;
                }
                if (mediaModel.isLocalMediaEffect(zxx.url)) {
                    medias.push({
                        filename: zxx.name,
                        filepath: zxx.url,
                        ld_id: this.ld.id,
                        date_add: datetime.now(),
                    });
                }
            }
            mediaModel.updatesByDeskId(this.ld.id, medias);
            this.dealWithLdData();
            return true;
        },
        //清空媒体组数据
        clearMedias() {
            top.vm.showLoadingMaster();
            this.mediaUpload.data = [];
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
            var isRepeat = this.mediaUpload.data.filter((item) => {
                return (item.url === file.raw.path && item.name === file.name);
            });
            if (isRepeat && isRepeat.length > 0) {
                //...重复了
            } else {
                if (file.name === null || file.raw.path === null) {
                    //... 非法文件
                } else {
                    top.vm.showLoadingMaster();
                    this.mediaUpload.data.push({
                        name: file.name,
                        url: file.raw.path,
                        status: 'success',
                        uid: file.name,
                    });
                    return this.updateMedias();
                }
            }
            return false;
        },
        //文件列表移除文件时的钩子
        handleRemove(file, fileList) {
            top.vm.showLoadingMaster();
            console.log(file, fileList);
            mediaModel.deleteByDeskId(this.ld.id, file.name, file.url);
            this.dealWithLdData();
        },
        //点击文件列表中已上传的文件时的钩子
        handlePreview(file) {
            console.log(file);
        },
    },
    created: function () {
        console.debug('fk: ' + this.formKey);
        this.dealWithLdData(localDeskModel.getDesk(this.formKey));
        this.buildFileList();
    },
    mounted() {

    }
});

window.onload = function () {
    vm.loading = false;
};