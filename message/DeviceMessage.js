const logger = require('../core/Logger');
const uuid = require('../core/UUID')();
const datetime = require('../core/Datetime')();
const model = require('../core/Model')();

//注意: 由于 remote 模块仅限渲染进程调用, 所以, 当前库亦仅限渲染进程调用.
const Electron = require('electron');
const Remote = Electron.remote;
let appVar;
try {
    appVar = Remote.getGlobal('appVar')
} catch (e) {
    appVar = global.appVar;
}

/**
 * 本地-我的桌面数据模型
 *
 * @constructor
 */
function DeviceMessage() {

    /**
     * 同步更新指令
     * @param displays
     */
    this.syncUpdate = function (displays) {
        // setTimeout(()=>{//稍微延迟一下, 防止数据未达.
        if (!displays) {
            for (var x in appVar._wallwindows) {
                var win = appVar._wallwindows[x];
                win.window.webContents.send('ipc_wall_update_forward');
            }
        } else {
            for (var x in displays) {
                var dp = displays[x];
                if (!dp) {
                    return this.syncUpdate();//有可能数组中的元素为 undefined
                }
                appVar._wallwindows[dp.display_id].window.webContents.send('ipc_wall_update_forward');
            }
        }
        // }, 500);
    };

}

module.exports = () => {
    return new DeviceMessage();
};