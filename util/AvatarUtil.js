/**
 * @author troy
 * @date 2019/2/4 1:48 AM
 * @description 头像图片自动生成工具层
 * @param
 * @return
 */
var AvatarUtil = function () {

    /**
     * 初始化控制器
     */
    this.init = function () {
    };

    /**
     * 将一个字符转为16进制颜色值
     *
     * @param name
     * @returns {string}
     */
    this.transText2Color = function (name) {
        if (name.charAt(0) === '用' || name.charAt(0) === '创') {//特殊的用一个好看的默认颜色.
            return '#2d8cf0';
        }
        var str = '';
        for (var i = 0; i < name.length; i++) {
            str += parseInt(name[i].charCodeAt(0), 10).toString(16);
        }
        return '#' + str.slice(1, 4);
    };

    /**
     * 按用户名生成用户头像[如果头像为空的话.]
     *
     * @param username 必须
     * @param avatar 必须
     * @param secRe 对外无意义, 不传
     * @param setColor 自定义背景颜色
     * @returns {*}
     */
    this.generate = function (username, avatar, setColor, secRe) {
        if (avatar === '__OFFLINE_LOCAL__') {//离线用户专属头像
            return this.generate("U", false, false, true, '#EEE');
        }
        if (!avatar || avatar === '' || avatar === 'null' || avatar === null) {
            try {
                var name = username.charAt(0);
                var fontSize = 60;
                var fontWeight = 'bold';
                var canvas = document.createElement('canvas');
                canvas.width = 120;
                canvas.height = 120;
                var context = canvas.getContext('2d');
                context.fillStyle = setColor ? setColor : this.transText2Color(username);//背景颜色: 根据用户名第一个字生成16进制背景色.
                context.fillRect(0, 0, canvas.width, canvas.height);
                context.fillStyle = '#FFF';//文字颜色: 白色.
                context.font = fontWeight + ' ' + fontSize + 'px sans-serif';
                context.textAlign = 'center';
                context.textBaseline = "middle";
                context.fillText(name, fontSize, fontSize);
                avatar = canvas.toDataURL("image/png");
            } catch (e) {
                if (!secRe) {
                    //这里可能会发生异常, 比如username为空等. => 再生成一次(创意者), 如果还出错, 就直接返回原头像
                    return this.generate("", avatar, '#EEE', true);
                } else {
                    return avatar;
                }
            }
        }
        return avatar;
    };

    /**
     * 生成背景图片 (尚未做健壮性优化)
     * 若不传 text, 则必需指定 setColor. 否则, setColor 将会覆盖生成的颜色.
     *
     * @param text
     * @param width
     * @param height
     * @param color
     * @param setColor
     * @param areaObj 文字定位
     * @param useGradient 文字颜色是否使用渐变
     * @returns {string}
     */
    this.generateBg = function (text, width, height, color, setColor, areaObj, useGradient) {
        var name, ax, ay;
        if (text) {
            name = text.charAt(0);
        } else {
            if (!setColor) {
                setColor = '#FFF';
            }
        }
        ax = 100;
        ay = (height / 2);
        if (areaObj) {
            ax = areaObj.x ? areaObj.x : ax;
            ay = areaObj.y ? areaObj.y : ay;
        }
        var bgcolor = setColor ? setColor : this.transText2Color(name);
        var fontSize = 25;
        var fontWeight = 'bold';
        var canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        var context = canvas.getContext('2d');
        context.fillStyle = bgcolor;//背景颜色: 根据用户名第一个字生成16进制背景色.
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = color ? color : '#FFF';//文字颜色: 白色.
        context.font = fontWeight + ' ' + fontSize + 'px sans-serif';
        context.textAlign = 'center';
        context.textBaseline = "middle";
        context.fillText(text, ax, ay);
        return canvas.toDataURL("image/png");
    };

    /**
     * 为文字创建线性渐变色
     *
     * @param canvascContext
     * @param garr
     */
    this.createGradient = function (canvascContext, garr) {
        if (!arr || arr.length <= 0) {
            return;
        }
        // 创建渐变
        var gradient = canvascContext.createLinearGradient(0, 0, c.width, 0);
        // gradient.addColorStop("0", "magenta");
        // gradient.addColorStop("0.5", "blue");
        // gradient.addColorStop("1.0", "red");
        for (var x in garr) {
            gradient.addColorStop(garr[x].offset, garr[x].color);
        }
        canvascContext.fillStyle = gradient;
    };


    this.init();//自动初始化
};

var avatarUtil = new AvatarUtil();