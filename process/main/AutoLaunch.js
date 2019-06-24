const Electron = require('electron');
const App = Electron.app;

const logger = require('../../core/Logger');//引入全局日志组件
const config = require('../../core/Config');//引入全局配置组件

const AutoLaunch = require('auto-launch');
let minecraftAutoLauncher = new AutoLaunch({
    name: App.getName(),
    path: App.getPath('exe'),
    isHidden: false,
    mac: {
        useLaunchAgent: true,//使用启动代理模式
    }
});

/**
 * 参数说明:
 * name: [String] 应用的名称。
 * path: [String] 应用的绝对路径。NW.js和Electron应用程序可选）
 * isHidden: [Boolean] 如果true，我们指示操作系统在登录时启动时以隐藏模式启动您的应用程序。默认为false。
 * mac: 仅适用于Mac的选项。
 *      -useLaunchAgent  [Boolean] 默认情况下，我们使用AppleScript添加登录项。如果是这样true，我们使用启动代理自动启动您的应用。默认为false。
 *
 * 方法解析:
 * .enable() 将您的应用设置为在启动时自动启动。返回一个Promise。
 * .disable() 禁用您的应用在启动时自动启动。返回一个Promise。
 * .isEnabled() 返回一个解析为布尔值的Promise; true如果您的应用设置为启动时启动。
 *
 * 运行过程:
 * Linux   一个桌面项创建; 即在.desktop中创建文件~/.config/autostart/。
 *          注意：如果启用了自动启动，然后删除了您的应用，则此桌面条目文件将留在用户的计算机上。
 * MacOS   -AppleScript（默认） 我们执行AppleScript命令以指示System Events为您的应用添加或删除登录项。没有涉及的文件。
 *                             要查看您的登录项，您可以转到系统偏好设置，用户和组，然后转到登录项。最终用户也可以在此添加或禁用项目（包括您的应用），但大多数典型用户都不知道它。
 *                             注意：这不是Mac App Store友好的; 如果您在自己的应用中使用它，它将被Mac App Store拒绝。我们对此只有99％的肯定，因为我们还没有真正尝试过。
 *         -启动代理            这是一个基于文件的方法，如Linux的桌面输入方法。我们.plist在用户Library/LaunchAgents目录中添加一个文件，为您的应用创建启动代理。
 *                             优点
 *                                  启动代理程序适用于没有UI的守护程序/某些内容，这可能适用于您的应用程序。
 *                                  我们认为此方法似乎更快，如启用或禁用自动启动（应用程序启动所需的时间没有差异）。虽然，这不是一个真正的问题。
 *                                  您可能不相信AppleScript。
 *                             缺点
 *                                  您的应用不会出现在用户的登录项中。因此，用户只能在应用程序中切换自动启动，如果您为他们提供了当然的设置（您应该这样做！）。
 *                                  这不是一个大问题，因为大多数用户都不知道登录项目首选项，但如果您的应用程序出现在那里，它将是理想的。
 *                                  如果用户要删除您的应用程序，该文件将留在用户的计算机上。
 *                                  如果您发现AppleScript方法不适合您并且此方法有效，请通过创建问题告诉我们。
 *                                  注意：这不是Mac App Store友好的; 如果您在应用程序中使用它，它将被Mac App Store拒绝，因为它到达应用程序沙箱之外。
 *Windows   我们在下面添加一个注册表项\HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Run。
 *          注意：如果用户要删除您的应用程序，这将留在注册表中，但这不是什么大问题。您可以配置卸载程序以取消设置。
 */
function checkLaunch(enable) {//如果是首次启动, 传入一个 true, 设置自启动.
    //Promise, 判定是否开机自启动
    minecraftAutoLauncher.isEnabled()
        .then(function (isEnabled) {
            if (isEnabled) {//如果已经生效, 但是设置取消, 就取消
                logger.warn("[Process][AutoLaunch] 开机自启动已生效");
                if (!enable) {
                    switchLaunch();
                }
            } else {//如果没有生效, 设置, 就强制设置.
                if (enable) {
                    switchLaunch(true);//默认自动开关设定
                }
            }
        })
        .catch(function (err) {
            // handle error
            logger.warn("[Process][AutoLaunch] 开机自启动任务失败 => " + err);
        });
}

/**
 * 开机自启动开关
 *
 * @param enable
 */
function switchLaunch(enable) {
    if (enable) {
        minecraftAutoLauncher.enable();
        logger.error("[Process][AutoLaunch] 设置开机自启动");
    } else {
        minecraftAutoLauncher.disable();
        logger.error("[Process][AutoLaunch] 取消开机自启动");
    }
}

/**
 * 初始化
 */
function init(appVar, preferenceModel) {
    appVar._autoLauncher = minecraftAutoLauncher;
    var pref_autoLaunch = preferenceModel.getByKey("autoLaunch");
    if (!pref_autoLaunch) {
        checkLaunch(true);
        preferenceModel.add({
            type: 'common',
            formitem: 'switch',
            key: 'autoLaunch',
            name: '自启动',
            description: '开机自动运行 ideawall',
            sort: 10,
            reboot: 1,
            value: {
                enable: true,
            },
        });
    } else {
        pref_autoLaunch.value = JSON.parse(pref_autoLaunch.value);
        if (pref_autoLaunch.value.enable) {
            checkLaunch(true);
        } else {
            checkLaunch(false);
        }
    }
}


module.exports = {
    init,
    checkLaunch,
    switchLaunch,
};