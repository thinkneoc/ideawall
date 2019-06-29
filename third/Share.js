/**
 * @author troy
 * @date 2019/2/4 1:48 AM
 * @description 社会化分享
 * @param
 * @return
 */
var Share = function (appVar) {

    this.template = {
        qzone: "http://sns.qzone.qq.com/cgi-bin/qzshare/cgi_qzshare_onekey?url={{URL}}&title={{TITLE}}&desc={{DESCRIPTION}}&summary={{SUMMARY}}&site={{SOURCE}}&pics={{IMAGE}}",
        qq: 'http://connect.qq.com/widget/shareqq/index.html?url={{URL}}&title={{TITLE}}&source={{SOURCE}}&desc={{DESCRIPTION}}&pics={{IMAGE}}&summary="{{SUMMARY}}"',
        weibo: "https://service.weibo.com/share/share.php?url={{URL}}&title={{TITLE}}&pic={{IMAGE}}&appkey={{WEIBOKEY}}",
        wechat: "javascript:void(0)",
        douban: "http://shuo.douban.com/!service/share?href={{URL}}&name={{TITLE}}&text={{DESCRIPTION}}&image={{IMAGE}}&starid=0&aid=0&style=11",
        linkedin: "http://www.linkedin.com/shareArticle?mini=true&ro=true&title={{TITLE}}&url={{URL}}&summary={{SUMMARY}}&source={{SOURCE}}&armin=armin",
        facebook: "https://www.facebook.com/sharer/sharer.php?u={{URL}}",
        twitter: "https://twitter.com/intent/tweet?text={{TITLE}}&url={{URL}}&via={{ORIGIN}}",
        google: "https://plus.google.com/share?url={{URL}}"
    };

    this.$socialconfig = {
        url: appVar._siteurl,
        source: 'ideawall - 创意者桌面',
        title: 'ideawall - 创意者桌面. 重新定义桌面, 极致就是艺术.', // 标题，默认读取 document.title 或者 <meta name="title" content="share.js" />
        description: '我给你推荐了一个超酷的动态桌面壁纸软件, 快来试试吧~~ ',
        image: 'http://m.cdn.ideanote.16inet.com/blue-min-pretty.png', // 图片, 默认取网页中第一个img标签
        origin: '', // 分享 @ 相关 twitter 账号
        sites: ['weibo', 'qq', 'wechat', 'qzone'], // 启用的站点
        disabled: ['douban', 'google', 'linkedin', 'facebook', 'twitter'], // 禁用的站点
        wechatQrcodeTitle: '微信扫一扫：分享', // 微信二维码提示文字
        wechatQrcodeHelper: '<p>微信里点“发现”，扫一下</p><p>二维码便可将本文分享至朋友圈。</p>',
        wechatQrcodeSize: 100,

        summary: '',
        weibokey: '',
    };

    this.wechatQrCode = undefined;

    /**
     * 初始化控制器
     */
    this.init = function () {
    };

    /**
     * 仅获取链接
     */
    this.getLink = function (key, config) {
        if (this.template[key]) {
            var link = this.template[key];
            for (var x in this.$socialconfig) {
                var regx = '/{{' + x.toUpperCase() + '}}/g';
                if (config && config.hasOwnProperty(x)) {
                    link = link.replace(eval(regx), config[x]);
                } else {
                    link = link.replace(eval(regx), this.$socialconfig[x]);
                }
            }
            console.log('分享链接: ' + link);
            return link;
        }
        return false;
    };

    this.init();//自动初始化
};

module.exports = (appVar) => {
    return new Share(appVar);
};