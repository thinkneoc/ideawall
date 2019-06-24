/**
 * @author troy
 * @date 2019/2/4 1:48 AM
 * @description 日期相关工具层
 * @param
 * @return
 */
var Datetime = function () {

    this.FORMAT_DATE_TIME_ZH = "YYYY年MM月DD日 hh时mm分ss秒";
    this.FORMAT_DATE_TIME_Z = "YYYY年MM月DD日 hh:mm:ss";
    this.FORMAT_DATE_TIME = "YYYY-MM-DD hh:mm:ss";
    this.FORMAT_DATE_TIME2 = "YYYY/MM/DD hh:mm:ss";
    this.FORMAT_DATE_ZH = "YYYY年MM月DD日";
    this.FORMAT_DATE = "YYYY-MM-DD";
    this.FORMAT_DATE2 = "YYYY/MM/DD";
    this.FORMAT_TIME_ZH = "hh时mm分ss秒";
    this.FORMAT_TIME = "hh:mm:ss";

    /**
     * 初始化控制器
     */
    this.init = function () {
    };

    /**
     * 获得当前的时间字符串
     *
     * @param format
     * @returns {string}
     */
    this.now = function (format) {
        return this.format(false, format);
    };

    this.nowDate = function (format) {
        format = format ? format : this.FORMAT_DATE;
        return this.format(false, format);
    };

    this.nowTime = function (format) {
        format = format ? format : this.FORMAT_TIME;
        return this.format(false, format);
    };

    /**
     * 传入秒数, 计算成 clock [24 小时以内]
     * @param sec
     */
    this.calcSeconds = function (sec) {
        if (sec >= 60 * 60) {//超过 1 小时
            var hou = sec / (60 * 60);
            var lete = sec % (60 * 60);//计算小时后剩余的秒数
            var min = lete / 60;
            sec = lete % 60;
            hou = Math.floor(hou);
            min = Math.floor(min);
            sec = Math.floor(sec);
            return (hou <= 9 ? '0' + hou : hou) + ':' + (min <= 9 ? '0' + min : min) + ':' + (sec <= 9 ? '0' + sec : sec);
        } else if (sec >= 60) {//超过1 分钟
            var min = sec / 60;
            sec = sec % 60;
            min = Math.floor(min);
            sec = Math.floor(sec);
            return (min <= 9 ? '0' + min : min) + ':' + (sec <= 9 ? '0' + sec : sec);
        } else {
            sec = Math.floor(sec);
            return '00:' + (sec <= 9 ? '0' + sec : sec);
        }
    };

    /**
     * 格式化日期时间戳
     *
     * @param timestamp
     * @param format
     * @returns {string}
     */
    this.format = function (timestamp, format) {
        format = format ? format : this.FORMAT_DATE_TIME;
        var date;
        if (timestamp) {
            date = new Date(timestamp);
        } else {//timestamp有可能为undefined
            date = new Date();
        }
        var str = format;
        var Week = ['Sun', 'Man', 'Tue', 'Web', 'Thu', 'Fri', 'Sat'];

        str = str.replace(/yyyy|YYYY/, date.getFullYear());
        str = str.replace(/yy|YY/, (date.getYear() % 100) > 9 ? (date.getYear() % 100).toString() : '0' + (date.getYear() % 100));
        var month = date.getMonth() + 1;
        str = str.replace(/MM/, month > 9 ? month.toString() : '0' + month);
        str = str.replace(/M/g, month);

        str = str.replace(/w|W/g, Week[date.getDay()]);

        str = str.replace(/dd|DD/, date.getDate() > 9 ? date.getDate().toString() : '0' + date.getDate());
        str = str.replace(/d|D/g, date.getDate());

        str = str.replace(/hh|HH/, date.getHours() > 9 ? date.getHours().toString() : '0' + date.getHours());
        str = str.replace(/h|H/g, date.getHours());
        str = str.replace(/mm/, date.getMinutes() > 9 ? date.getMinutes().toString() : '0' + date.getMinutes());
        str = str.replace(/m/g, date.getMinutes());

        str = str.replace(/ss|SS/, date.getSeconds() > 9 ? date.getSeconds().toString() : '0' + date.getSeconds());
        str = str.replace(/s|S/g, date.getSeconds());
        if (str.indexOf("NaN") !== -1) {
            return "";
        }
        return str;
    };

    /**
     * 比较时间大小
     *
     * @param date1
     * @param date2
     * @returns {boolean}
     */
    this.compareDate = function (date1, date2) {
        var date_one = new Date(Date.parse(date1.replace(/-/g, "/")));
        var date_two = new Date(Date.parse(date2.replace(/-/g, "/")));
        return (date_one > date_two);
    };

    /**
     * 计算时间差值
     *
     * @param date1
     * @param date2
     */
    this.calcDate = function (date1, date2) {//注: 传入的事标准时间戳串
        var date_one = new Date(Date.parse(date1.replace(/-/g, "/")));
        var date_two = new Date(Date.parse(date2.replace(/-/g, "/")));
        var date3 = Math.abs(date_two.getTime() - date_one.getTime());  //时间差的毫秒数[绝对值]
        //计算出相差年数
        var leave_3 = date3 % (24 * 3600 * 1000 * 365);
        var years = Math.floor(date3 / (24 * 3600 * 1000 * 365));
        //计算出相差月数
        var leave_2 = leave_3 % (24 * 3600 * 1000 * 365);    //计算年数后剩余的毫秒数
        var months = Math.floor(leave_2 / (24 * 3600 * 1000 * 30));
        //计算出相差天数
        var leave_1 = leave_2 % (24 * 3600 * 1000 * 30);    //计算月数后剩余的毫秒数
        var days = Math.floor(leave_1 / (24 * 3600 * 1000));
        //计算出小时数
        var leave1 = leave_1 % (24 * 3600 * 1000);    //计算天数后剩余的毫秒数
        var hours = Math.floor(leave1 / (3600 * 1000));
        //计算相差分钟数
        var leave2 = leave1 % (3600 * 1000);        //计算小时数后剩余的毫秒数
        var minutes = Math.floor(leave2 / (60 * 1000));
        //计算相差秒数
        var leave3 = leave2 % (60 * 1000);      //计算分钟数后剩余的毫秒数
        var seconds = Math.round(leave3 / 1000);
        //计算相差毫秒数
        var leave4 = leave3 % (1000);      //计算分钟数后剩余的毫秒数
        var minseconds = Math.round(leave4);
        return {
            bigger: (date_two.getTime() > date_one.getTime()) ? 2 : 1,
            years: years,
            months: months,
            days: days,
            hours: hours,
            minutes: minutes,
            seconds: seconds,
            minseconds: minseconds,
            rseconds: date3,
            ifest: (years > 0 ? years + '年' : '') + (months > 0 ? months + '个月' : '') + (days > 0 ? days + '天' : '') + (hours > 0 ? hours + '小时' : '') + (minutes > 0 ? minutes + '分钟' : '') + (seconds > 0 ? seconds + '秒' : '') + (minseconds > 0 ? minseconds + '毫秒' : ''),
        };
    };

    /**
     * 计算天数差值[取整]
     *
     * @param date1
     * @param date2
     * @returns {number}
     */
    this.calcDays = function (date1, date2) {//注: 传入的事标准时间戳串
        var date_one = new Date(Date.parse(date1.replace(/-/g, "/")));
        var date_two = new Date(Date.parse(date2.replace(/-/g, "/")));
        var date3 = Math.abs(date_two.getTime() - date_one.getTime());  //时间差的毫秒数[绝对值]
        //计算出相差天数
        return {
            bigger: (date_two.getTime() > date_one.getTime()) ? 2 : 1,
            result: Math.floor(date3 / (24 * 3600 * 1000)),
        }
    };

    /**
     * 计算年数差值[取整]
     *
     * @param date1
     * @param date2
     * @returns {number}
     */
    this.calcYears = function (date1, date2) {//注: 传入的事标准时间戳串
        var date_one = new Date(Date.parse(date1.replace(/-/g, "/")));
        var date_two = new Date(Date.parse(date2.replace(/-/g, "/")));
        var date3 = Math.abs(date_two.getTime() - date_one.getTime());  //时间差的毫秒数[绝对值]
        //计算出相差天数
        return {
            bigger: (date_two.getTime() > date_one.getTime()) ? 2 : 1,
            result: Math.floor(date3 / (24 * 3600 * 1000 * 365)),
        }
    };

    /**
     * 计算一个时间与现在的距离
     *
     * @param date
     */
    this.distanceDate = function (date) {//注: 传入的事标准时间戳串
        var distance = this.calcDate(date, this.now());
        if (distance.years && distance.years > 0) {
            return distance.years + '年前';
        } else if (distance.months && distance.months > 0) {
            if (distance.months > 5) {
                return '半年前';
            } else {
                return distance.months + '个月前';
            }
        } else if (distance.days && distance.days > 0) {
            if (distance.days > 14) {
                return '半月前';
            } else {
                if (distance.days === 1) {
                    return '昨天';
                } else if (distance.days === 2) {
                    return '前天';
                } else {
                    return distance.days + '天前';
                }
            }
        } else if (distance.hours && distance.hours > 0) {
            if (distance.hours > 11) {
                return '今天';
            } else {
                return distance.hours + '小时前';
            }
        } else if (distance.minutes && distance.minutes > 0) {
            if (distance.minutes > 29) {
                return '半小时前';
            } else {
                return distance.minutes + '分钟前';
            }
        } else if (distance.seconds && distance.seconds > 0) {
            if (distance.seconds > 29) {
                return '半分钟前';
            } else {
                return distance.seconds + '秒前';
            }
        } else {
            return "最近";//最近1s(<1s)内
        }
    };

    /**
     * 计算指定时间与现在的天数距离
     *
     * @param date
     * @param getDistance
     */
    this.distanceDay = function (date, getDistance) {//注: 传入的事标准时间戳串
        var distance = this.calcDays(date, this.now());
        if (distance.result >= 0 && distance.result <= 2) {//今天, 昨天, 前天, 明天, 后天
            if (distance.result === 0) {
                return '今天';
            } else if (distance.result === 1) {
                if (distance.bigger === 2) {
                    return '昨天';
                } else {
                    return '明天';
                }
            } else if (distance.result === 2) {
                if (distance.bigger === 2) {
                    return '前天';
                } else {
                    return '后天';
                }
            }
        } else {//其他: 要差值或者时间的号数
            if (getDistance) {
                return distance.result;
            } else {
                date = new Date(Date.parse(date.replace(/-/g, "/")));
                return (date.getDate() > 9 ? date.getDate().toString() : '0' + date.getDate())
            }
        }

    };


    this.init();//自动初始化
};

module.exports = ()=>{
    return new Datetime();
};
