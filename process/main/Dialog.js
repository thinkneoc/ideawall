const Electron = require('electron');
const BrowserWindow = Electron.BrowserWindow;
const ipc = Electron.ipcMain;
const Dialog = Electron.dialog;

const logger = require('../../core/Logger');//引入全局日志组件
const config = require('../../core/Config');//引入全局配置组件

/**
 * 根据 windowId 获取 window 对象.
 * @param windowKey
 * @returns {*}
 */
function getWindow(windowKey) {
    return global.appVar[windowKey]
}


/**
 * 展示 message box, 它会阻塞进程，直到 message box 关闭为止.返回点击按钮的索引值.
 */
ipc.on('dialog.showMessageBox', function (event, winKey, responseIpcCmd, type, buttons, defaultId, title, message, detail, icon, cancelId, noLink) {
    logger.info('[Core][Dialog][dialog.showMessageBox] ' + winKey + ' - ' + responseIpcCmd + ' - ' + type);
    logger.info('[Core][Dialog][dialog.showMessageBox] ' + message + ' - ' + detail);
    Dialog.showMessageBox(getWindow(winKey), {
        type: type,//String - 可以是 "none", "info", "error", "question" 或 "warning". 在 Windows, "question" 与 "info" 展示图标相同, 除非你使用 "icon" 参数.
        buttons: buttons,// Array - buttons 内容，数组.
        defaultId: defaultId,//Integer - 在message box 对话框打开的时候，设置默认button选中，值为在 buttons 数组中的button索引.
        title: title ? title : 'ideawall',//String - message box 的标题，一些平台不显示.
        message: message,//String - message box 内容.
        detail: detail,//String - 额外信息.
        icon: icon,//NativeImage
        cancelId: cancelId,//Integer - 当用户关闭对话框的时候，不是通过点击对话框的button，就返回值.默认值为对应 "cancel" 或 "no" 标签button 的索引值, 或者如果没有这种button，就返回0. 在 OS X 和 Windows 上， "Cancel" button 的索引值将一直是 cancelId, 不管之前是不是特别指出的.
        noLink: noLink//Boolean - 在 Windows ，Electron 将尝试识别哪个button 是普通 button (如 "Cancel" 或 "Yes"), 然后再对话框中以链接命令(command links)方式展现其它的 button . 这能让对话框展示得很炫酷.如果你不喜欢这种效果，你可以设置 noLink 为 true.
    }, function (response) {
        if (responseIpcCmd && responseIpcCmd != '') {
            event.sender.send(responseIpcCmd, response);
        }
        event.returnValue = response;
    });
});

/**
 * 展示一个传统的包含错误信息的对话框.
 * 在 app 模块触发 ready 事件之前，这个 api 可以被安全调用，通常它被用来在启动的早期阶段报告错误. 在 Linux 上，如果在 app 模块触发 ready 事件之前调用，message 将会被触发显示stderr，并且没有实际GUI 框显示.
 *
 * 注意: 渲染进程内的错误,不建议调用此通信事件. 错误提示推荐调用showMessageBox实现.
 */
ipc.on('dialog.showErrorBox', function (event, title, content) {
    Dialog.showErrorBox(title, content);
});

/**
 * 成功使用这个方法的话，就返回一个可供用户选择的文件路径数组，失败返回 undefined.
 */
ipc.on('dialog.showOpenDialog', function (event, responseIpcCmd, title, defaultPath, filters, properties) {
    let win = BrowserWindow.getFocusedWindow();
    if (win) {
        Dialog.showOpenDialog(win, {
            title: title,//String - 可以是 "none", "info", "error", "question" 或 "warning". 在 Windows, "question" 与 "info" 展示图标相同, 除非你使用 "icon" 参数.
            defaultPath: defaultPath,// Array - buttons 内容，数组.
            //filters - Array, 当需要限定用户的行为的时候，指定一个文件数组给用户展示或选择. 例如:
            // filters: [
            //     { name: 'Images', extensions: ['jpg', 'png', 'gif'] },
            //     { name: 'Movies', extensions: ['mkv', 'avi', 'mp4'] },
            //     { name: 'Custom File Type', extensions: ['as'] },
            //     { name: 'All Files', extensions: ['*'] }
            // ]
            // extensions 数组应当只包含扩展名，不应该包含通配符或'.'号 (例如 'png' 正确，但是 '.png' 和 '*.png' 不正确). 展示全部文件的话, 使用 '*' 通配符 (不支持其他通配符).
            filters: filters,
            //properties - Array, 包含了对话框的特性值, 可以包含 openFile, openDirectory, multiSelections and createDirectory
            //在 Windows 和 Linux ，一个打开的 dialog 不能既是文件选择框又是目录选择框, 所以如果在这些平台上设置 properties 的值为 ['openFile', 'openDirectory'] , 将展示一个目录选择框.
            properties: properties
        }, function (filenames) {
            if (responseIpcCmd && responseIpcCmd != '') {
                event.sender.send(responseIpcCmd, filenames);
            }
        });
    } else {
        logger.info('showOpenDialog: 找不到被激活的窗体');
    }
});

/**
 * 成功使用这个方法的话，就返回一个可供用户选择的文件路径数组，失败返回 undefined. filters 指定展示一个文件类型数组,
 */
ipc.on('dialog.showSaveDialog', function (event, responseIpcCmd, title, defaultPath, filters) {
    Dialog.showSaveDialog(title, defaultPath, filters, function (filenames) {
        if (responseIpcCmd && responseIpcCmd != '') {
            event.sender.send(responseIpcCmd, filenames);
        }
    });
});