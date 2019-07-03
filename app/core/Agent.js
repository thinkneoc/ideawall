const os = require("os");
const http = require("./Http");
/**
 * 判断操作系统类型
 * @type {{deviceType: string, OSname: string, browserName: string, browserVer: string, adaptType: number, _init: _AgentInfo._init, setDeviceAndOS: _AgentInfo.setDeviceAndOS, setBrowser: _AgentInfo.setBrowser, isMobile: _AgentInfo.isMobile, setAdaptType(): void}}
 * @private
 */
var Agent = {
    deviceType: "",  // pc or mobile
    OSname: "",         // windows, Android, linux and so on...
    OSversion: "",
    browserName: "",    //  chrome, safari, firefox, IE and so on...
    browserVer: "",   //  browser version， important if in IE environment.
    adaptType: 0,           // A type value, Adapt to the screen due to width
    userAgent: window.navigator.userAgent,
    Wip: "",
    Lip: "",
    Mac: "",
    Ps: {},
    PsDetail: "",
    coords: {
        longitude: '',
        latitude: ''
    },
    _init: function () {
        Agent.setDeviceAndOS();//明确是电脑客户端, 不需要判断手机系统类型
        Agent.setBrowser();//客户端上明确是Chrome, 不需要判断. 但是可能需要知道Chrome的版本号.
        Agent.getCoords();//获取定位经纬度
        getIPAndMac();
        return Agent;
    },
    setDeviceAndOS: function (judgeMobile) {//是否判断手机系统类型
        var name = "unknown";
        var version = "unknown";
        if (judgeMobile) {
            if (window.navigator.userAgent.indexOf("Android") !== -1) {
                name = "Android";
                version = "Android";
            } else if (window.navigator.userAgent.indexOf("iPhone") !== -1) {
                name = "IOS";
                version = "iPhone";
            } else if (window.navigator.userAgent.indexOf("SymbianOS") !== -1) {
                name = "SymbianOS";
                version = "SymbianOS";
            } else if (window.navigator.userAgent.indexOf("Windows Phone") !== -1) {
                name = "Windows";
                version = "Windows Phone";
            } else if (window.navigator.userAgent.indexOf("iPad") !== -1) {
                name = "IOS";
                version = "iPad";
            } else if (window.navigator.userAgent.indexOf("iPod") !== -1) {
                name = "IOS";
                version = "iPod";
            }
            if (name !== "unknown") {
                Agent.OSname = name;
                Agent.OSversion = name;
                Agent.deviceType = "mobile";
                return;
            }
        }
        if (window.navigator.userAgent.indexOf("Windows NT 10.0") !== -1) {
            name = "Windows";
            version = "Windows 10";
        } else if (window.navigator.userAgent.indexOf("Windows NT 6.3") !== -1) {
            name = "Windows";
            version = "Windows 8.1";
        } else if (window.navigator.userAgent.indexOf("Windows NT 6.2") !== -1) {
            name = "Windows";
            version = "Windows 8";
        } else if (window.navigator.userAgent.indexOf("Windows NT 6.1") !== -1) {
            name = "Windows";
            version = "Windows 7";
        } else if (window.navigator.userAgent.indexOf("Windows NT 6.0") !== -1) {
            name = "Windows";
            version = "Windows Vista";
        } else if (window.navigator.userAgent.indexOf("Windows NT 5.2") !== -1) {
            name = "Windows";
            version = "Windows 2003";
        } else if (window.navigator.userAgent.indexOf("Windows NT 5.1") !== -1) {
            name = "Windows";
            version = "Windows XP";
        } else if (window.navigator.userAgent.indexOf("Windows NT 5.0") !== -1) {
            name = "Windows";
            version = "Windows 2000";
        } else if (window.navigator.userAgent.indexOf("Mac") !== -1) {
            name = "Mac";
            version = "Mac OS";
        } else if (window.navigator.userAgent.indexOf("X11") !== -1) {
            name = "Unix";
            version = "UNIX";
        } else if (window.navigator.userAgent.indexOf("Linux") !== -1) {
            name = "Linux";
            version = "Linux";
        }
        Agent.OSname = name;
        Agent.OSversion = version;
        Agent.deviceType = "pc";
    },
    setBrowser: function () {
        var nAgt = navigator.userAgent;
        var browserName = navigator.appName;
        var fullVersion = '' + parseFloat(navigator.appVersion);
        var majorVersion = parseInt(navigator.appVersion, 10);
        var nameOffset, verOffset, ix;
        if ((verOffset = nAgt.indexOf("Opera")) !== -1) { // In Opera, the true version is after "Opera" or after "Version"
            browserName = "Opera";
            fullVersion = nAgt.substring(verOffset + 6);
            if ((verOffset = nAgt.indexOf("Version")) !== -1)
                fullVersion = nAgt.substring(verOffset + 8);
        } else if ((nAgt.indexOf("Trident")) !== -1) {   // ( ver >= ie7) In MSIE, the true version is after "MSIE" in userAgent
            if ((verOffset = nAgt.indexOf("MSIE")) !== -1) {
                fullVersion = nAgt.substring(verOffset + 5);
            } else {
                fullVersion = '11.0';
            }
            if (fullVersion === 5) {
                fullVersion = "11.0";
            }
            browserName = "IE";
        } else if ((verOffset = nAgt.indexOf("Chrome")) !== -1) {  // In Chrome, the true version is after "Chrome"
            browserName = "Chrome";
            fullVersion = nAgt.substring(verOffset + 7);
        } else if ((verOffset = nAgt.indexOf("Safari")) !== -1) {   // In Safari, the true version is after "Safari" or after "Version"
            browserName = "Safari";
            fullVersion = nAgt.substring(verOffset + 7);
            if ((verOffset = nAgt.indexOf("Version")) !== -1)
                fullVersion = nAgt.substring(verOffset + 8);
        } else if ((verOffset = nAgt.indexOf("Firefox")) !== -1) {    // In Firefox, the true version is after "Firefox"
            browserName = "Firefox";
            fullVersion = nAgt.substring(verOffset + 8);
        } else if ((nameOffset = nAgt.lastIndexOf(' ') + 1) < (verOffset = nAgt.lastIndexOf('/'))) {   // In most other browsers, "name/version" is at the end of userAgent
            browserName = nAgt.substring(nameOffset, verOffset);
            fullVersion = nAgt.substring(verOffset + 1);
            if (browserName.toLowerCase() === browserName.toUpperCase()) {
                browserName = navigator.appName;
            }
        }
        if ((ix = fullVersion.indexOf(";")) !== -1)        // trim the fullVersion string at semicolon/space if present
            fullVersion = fullVersion.substring(0, ix);
        if ((ix = fullVersion.indexOf(" ")) !== -1)
            fullVersion = fullVersion.substring(0, ix);
        majorVersion = parseInt('' + fullVersion, 10);
        if (isNaN(majorVersion)) {
            fullVersion = '' + parseFloat(navigator.appVersion);
            majorVersion = parseInt(navigator.appVersion, 10);
        }
        Agent.browserName = browserName;
        Agent.browserVer = fullVersion;
    },
    isMobile: function () {
        return (Agent.deviceType === "Mobile");
    },
    setAdaptType() {     // A type value, Adapt to the screen due to width. For convenient
        if (screen.width <= 374) {
            Agent.adaptType = 0;
        } else if (screen.width <= 413) {
            Agent.adaptType = 1;
        } else {
            Agent.adaptType = 2;
        }
    },
    getCoords: function (callback) {
        getPosition().then(result => {
            // 返回结果示例：
            // {latitude: 30.318030999999998, longitude: 120.05561639999999}
            // 一般小数点后只取六位，所以用以下代码搞定
            let queryData = {
                longtitude: String(result.longitude).match(/\d+\.\d{0,6}/)[0],
                latitude: String(result.latitude).match(/\d+\.\d{0,6}/)[0],
                channelType: '00'
            };
            Agent.coords = queryData;
            console.log(queryData);

            if (typeof callback === 'function') {
                callback(queryData);
            }
        }).catch(err => {
            console.warn(err);
        })
    }
};
Agent._init();

//获取经纬度定位: 目测被墙了. (PC 通过 ip 定位, 谷歌...)
function getPosition() {
    return new Promise((resolve, reject) => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function (position) {
                let latitude = position.coords.latitude
                let longitude = position.coords.longitude
                let data = {
                    latitude: latitude,
                    longitude: longitude
                };
                resolve(data)
            }, function () {
                reject(arguments)
            })
        } else {
            reject('你的浏览器不支持当前地理位置信息获取')
        }
    });
}

//获取本机ip和mac地址[需要上层依赖OS模块]
function getIPAndMac() {
    const interfaces = os.networkInterfaces(); // 在开发环境中获取局域网中的本机iP地址
    let IPAdress = '';
    for (var devName in interfaces) {
        var iface = interfaces[devName];
        for (var i = 0; i < iface.length; i++) {
            var alias = iface[i];
            if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
                IPAdress = alias.address;
                MacAdress = alias.mac;
                Agent.Lip = IPAdress;
                Agent.Mac = MacAdress;
            }
        }
    }
}

function getAddress(wip, callback) {
    wip = wip ? wip : Agent.Wip;
    if (wip && wip !== "") {
        http.get('http://ip.taobao.com/service/getIpInfo.php?ip=' + wip, function (reb, rawData, res, contentType) {
            if (reb) {
                rawData = JSON.parse(rawData);
                Agent.Ps = rawData.data.country + ' ' + rawData.data.area + ' ' + rawData.data.region + ' ' + ((rawData.data.city !== rawData.data.region) ? rawData.data.city + ' ' : '') + (rawData.data.county === 'XX' ? '' : rawData.data.county + ' ') + '[' + rawData.data.isp + ']';
                Agent.PsDetail = rawData.data;
            }
            if (typeof callback === 'function') {
                callback(reb, Agent.Ps, Agent.PsDetail);
            }
        });
    }
}


//协议数据
let at = {
    "设备监控": [],
    "客户端类型": '桌面客户端',//客户端类型: 1-桌面端, 2-移动端
    "客户端版本": '',//客户端版本
    "客户端位置": '',
    "本地语言": '',
    "操作系统类型": Agent.OSname,//操作系统类型
    "操作系统版本": Agent.OSversion,//操作系统版本
    "终端类型": Agent.deviceType,//终端类型
    "浏览器内核": Agent.browserName + ' ' + Agent.browserVer,//浏览器内核
    "userAgent细节": Agent.userAgent,//userAgent细节信息.
    "广域网ip": Agent.Wip,//广域网ip
    "局域网ip": Agent.Lip,//局域网ip
    "Mac地址": Agent.Mac,//Mac地址
    "地理坐标": {
        "经度": Agent.coords.longitude,
        "纬度": Agent.coords.latitude,
    },
    "地理位置": Agent.Ps,//地理位置
    "地理细节": Agent.PsDetail,//记录下淘宝接口获取的详细地理位置信息.
    "时间戳": (new Date().getTime()),//通信时间戳, 每次发起请求的时候进行构造. => 调用时候构造
    "监视器组": '',//监视器信息
    "网卡信息": os.networkInterfaces(),//网卡信息
    "操作系统其他信息": {//操作系统其他信息
        "操作系统类型": os.type(),//操作系统名
        "平台类型": os.platform(),//操作系统名
        "操作系统发行版本": os.release(),//操作系统发行版本
        "操作系统运行的时间，以秒为单位": os.uptime(),//操作系统运行的时间，以秒为单位。
        "系统内存总量，单位为字节": os.totalmem(),//系统内存总量，单位为字节。
        "操作系统空闲内存量，单位是字节": os.freemem(),//操作系统空闲内存量，单位是字节。
        "主机名": os.hostname(),//主机名
        "CPU 组": os.cpus(),//对象数组，包含所安装的每个 CPU/内核的信息
        "CPU 架构": os.arch(),//CPU 架构
        "CPU 字节序": os.endianness(),//CPU 字节序
    },
};

module.exports = {
    Agent,
    getIPAndMac,
    getAddress,
    at
};