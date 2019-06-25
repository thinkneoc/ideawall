const baseController = proxy.require('../controller/BaseController');
const http = proxy.require('../core/Http');
const logger = proxy.require('../core/Logger');
const uuid = proxy.require('../core/UUID')();
const screen = proxy.require('../core/Screen')();
const fileststem = proxy.require('../core/Fs');
let agent = proxy.require('../core/Agent');

var vm = new Vue({
    el: '#app',
    data() {
        return {
            submitSign: false,
            topic: 1,//1-happy, 2-sad.
            description: '',
            loading: true,
            fbEmail: {
                recipient: '1747128171@qq.com',
                subject: '创意者桌面 用户反馈',
                text: '',
                html: '',
                htmlFilePath: '',
            },
            allowCollectLog: true,
            allowCollectDeviceInfo: true,
            allowCollectDeviceSnapscreen: false,
            allowCollectArea: false,
        }
    },
    watch: {
        topic() {
            vm.submitSign = false;
        }
    },
    methods: {
        buildMailInfo: function (callback) {
            var that = this;
            var tmp = this.fbEmail;
            var ua = top.vm.ua;
            screen.snapscreen({
                width: 768,
                height: 436
            }, (result, rIds, screens) => {
                console.debug(result);
                try {
                    ua['本地语言'] = proxy.appVar._locale;
                    ua['客户端版本'] = proxy.appVar._version;
                    ua['客户端位置'] = proxy.appVar._path.exe;
                    ua['监视器组'] = proxy.appVar._displays;
                    ua['广域网ip'] = top.getPublicIpv4();
                    if (ua['广域网ip'] != null) {
                        agent.getAddress(ua['广域网ip'], (reb, ps, ps_detail) => {
                            if (reb) {
                                ua['地理位置'] = ps;
                                ua['地理细节'] = ps_detail;
                            }
                        });
                    }
                } catch (e) {
                    console.error(e);
                }

                setTimeout(() => {
                    ua['设备监控'] = [];
                    for (var x in result) {
                        var fpath = proxy.appVar._apath.dir.snapscreen + '/' + result[x].name + '.html';
                        fileststem.writeFileSync(fpath, '<img src="' + result[x].stream + '"/>');
                        ua['设备监控'].push({
                            id: result[x].display_id,
                            name: result[x].name,
                            filename: result[x].name + '.html',
                            path: fpath,
                            cid: uuid.serial()
                        });
                        console.debug(ua['设备监控'])
                    }
                    top.vm.ua = ua;
                    console.debug(ua);
                    setTimeout(() => {
                        var attachments = ua['设备监控'];
                        logger.archive(proxy.ipc, (reb, filename, filepath) => {
                            if (reb) {
                                attachments.push({
                                    filename: filename,
                                    path: filepath,
                                    cid: uuid.serial()
                                });
                                delete ua['设备监控'];
                                callback({
                                    recipient: tmp.recipient,
                                    subject: tmp.subject,
                                    text: false,
                                    html: '<p>用户体验:<br/>' + (this.topic === 1 ? '满意' : '不满意') + '</p><br/>' +
                                        '<p>反馈内容:<br/>' + this.description + '</p><br/>' +
                                        '<p>用户数据采集: <br/><pre>' + JSON.stringify(ua, false, 2) + '</pre></p>',
                                    htmlFilePath: false,
                                    attachments: attachments,
                                });
                            } else {
                                top.vm.showMessage('提交失败! 运行日志收集程序执行异常!');
                            }
                        }, 'today');
                    }, 200);
                }, 800);
            });
        },
        submitFB: function () {
            if (this.description === '') {
                proxy.alert('提交失败', '请填写反馈详情信息');
                return;
            }
            if (this.submitSign) {
                proxy.alert('提交失败', '您已提交反馈报告成功, 请勿重复提交!');
                return;
            }
            if (top.vm.netstatus === 'offline') {
                proxy.alert('无法提交', '您当前尚未连接到互联网!');
                return;
            }
            top.vm.showLoadingMaster();
            top.vm.showLoading('正在收集数据, 请稍后...', false);
            this.buildMailInfo((mailInfo) => {
                top.vm.showLoading('正在提交反馈, 请稍后...', false);
                console.debug(mailInfo);
                proxy.ipc.send('ipc_resolver', 'mail', mailInfo);
                proxy.ipc.removeAllListeners('ipc_resolver_ret');
                proxy.ipc.on('ipc_resolver_ret', function (event, reb) {
                    console.debug(reb);
                    top.vm.closeLoading();
                    if (reb) {
                        vm.submitSign = true;
                        proxy.alert('反馈成功', '我们已经收到您的反馈报告, 感谢您的信赖与支持!', function (res) {
                            resetFB();
                        }, 'info');
                    } else {
                        proxy.alert('提交失败', reb.toString());
                    }
                });
            });
        }
    },
    created: function () {
    },
    mounted() {
        screen.testSnapscreen();
    }
});

$(function () {
    $("textarea.zxx-input-prochange").bind("input propertychange", function (event) {
        countTextarea(this);
    });
});

function countTextarea(target) {
    var limitnum = $(target).next('span').attr('limit');
    var inputnum = $(target).val().length;
    if (inputnum > limitnum || limitnum <= 0) {
        $(target).val($(target).val().substring(0, limitnum));
    } else {
        $(target).next('span').text(Number(limitnum) - inputnum);
    }
    vm.submitSign = false;
    vm.description = $('#description').val();
}

function resetFB() {
    $('a#zxx-feedback-face-happy').click();
    vm.description = '';
    $('#description').val('');
    countTextarea($('#description'));
    vm.submitSign = false;
}

window.onload = function () {
    vm.loading = false;
};