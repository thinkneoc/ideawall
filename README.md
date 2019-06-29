# ideawall - mac 创意者桌面 Mac 独立版本. 极致就是艺术. 

1.有一个很大的问题,在 mac 上, 壁纸层的窗口无法获取鼠标事件(快捷键事件无影响). 
解决方案: 启动的同时, 额外创建一个窗体覆盖在整体之上, 设置为透明,
在这个窗体上, 控制需要传递的动作效果到壁纸层的域窗口. 

那么, 如果想要作为壁纸的网页可操作, 这种网页需要进行定制. => 目前看来, 暂无更好的办法.(除了去调用原生系统API之外.)
并且, 操作层的域窗口要求比较严格, 以防止影响原始桌面的图标控制, 以及其他相关操作. 
相对应的, 所带来的好处是, 可以完全操纵和自定义化桌面, 因为它们(壁纸层和操作层)始终是包裹在图标层的上下两侧的.


##### 2019.06.12 任务
- 我的桌面, 右侧表单配置 UI 设计. 做表单生成逻辑, 比较麻烦. ✔️
- 反馈与支持, 功能设计.  ✔️
- 偏好设置, 基础 UI 设计.  ✔️
- 桌面商店, 给出屏蔽的提示.  ✔️


##### 2019.06.13 任务
- 换个滚动条 => 简要处理了一下, 先救酱紫.  ✔️
- 桌面设置周期逻辑完善编写, 主要是本地数据库和表单的问题. 
    - 首先思考一下, 需要的必备的本地数据库.
    - 然后, 编写 Model 层, 不要 Dao 层, 直接在 Model 层进行 [充血模型]
    - 最后对接.
    - 注意: 后期条件允许的情况下, 整改为使用 sqlite 数据库.
- 用户桌面管理, 弄一张图放上面, 直接放 iframe, 性能低下. 写设置模块的时候一起弄. 
- 评论功能优化, 这个待定, 可能先不要.      ✔️
- 信息功能优化, 这个要.              ✔️
- 日志功能待定, 这个待定, 要的可能性不大.        ✔️

##### 2019.06.14 任务
- 桌面配置表单继续完成, 先把最关键的写好, 然后再去搞事.  ✔️
- 桌面信息表单继续完成 ✔️
- 设备桌面配置逻辑完成 ✔️

##### 2019.06.16 任务
- 桌面预览窗体编写      ✔️
- Wall桌面源开始对接基础配置系统   ✔️

##### 2019.06.17 任务
- 修复 Dialog 的问题. => 放到渲染进程里去.  ✔️
- 设备信息查看窗体编写        ✔️
- README信息查看窗体编写   ✔️

##### 2019.06.18 任务
- 桌面配置 - 高级配置 添加 json 编辑器   ✔️ 监听change 事件, 通过 ipc 指令回传发送即时更新即可.  ✔️
- 桌面配置 - 桌面源配置      ✔️
- 桌面配置 - 媒体配置 逻辑对接完善  ✔️
- Wall桌面源媒体资源的对接    ✔️
- Wall桌面源高级配置 - 桌面源参数 对接    ️✔️
- Wall桌面源高级配置 - 约定域参数 对接    ️✔️
- 关于播放静音等功能开关的持久化位置, 从桌面表切换到设备表上. 不然不好维护.  ✔️
- 约定域参数的构建需要重新设计            ✔️
- 视频桌面的切换空挡空白问题需要修复一下.    ✔️
- 设置更新的时候, 桌面的即时反馈问题. 
- 无边窗口拖拽问题.   ✔️ 编码控制监听刷新就好.

##### 2019.06.19 任务
- 换 sqlite, 再麻烦也要换. 不然数据层数据不稳定, 整个系统就不稳定.  ✔️

##### 2019.06.21 任务
- 数据层重构.  ✔️
- 历史遗留问题处理解决,  ✔️
- 截屏快照动作放到主进程进行, 与控制面板生命周期同步, 截屏数据放到 appvar 变量中, 
数据库合并 display 和 screen 类的字段属性. 一同存储. 暂时先不处理.                ✔️

##### 2019.06.22 任务
- 媒体配置即时生效.  ✔️
- 高级配置给个按钮, 应用后生效.  ✔️
- 偏好设置表单完成      ✔️
- 偏好设置逻辑完成      ✔️  
- 细节优化             ✔️
- 打包, 暂时不打 asar. 公开源代码也没事.  ✔️
- 发布之前的一些细节问题处理优化.
    - 如果初次修改了媒体组, 桌面的初始化标记也处理掉. ✔️
    - 初始化的时候, 控制面板任务未启动, 桌面层读取数据库后会有一些报错项.  ✔️
    - 托盘菜单的动作处理.   ✔️
    - 托盘分享.   ✔️
    - 关于 ideawall 窗口设计.   ️✔️
    - 反馈界面的分享. 暂时不要.     
    - 添加腾讯统计.        ✔️
    - 控制面板右上角添加一个 小 loading 层.      ✔️
    - 控制面板的 dialog 考虑添加 win 参数声明.  ✔️
    - 获取 IP 的逻辑重新设计, 现在的这个搜狐网络请求会影响体验效果.  ✔️
    - 媒体组本地文件添加有效性判定.    ✔️  还有瑕疵, 暂时先这样了~
    - 退出应用程序时候, 关闭托盘入口.     ✔️
    - 添加网络状态监测功能.       ✔️
    - 已存在的媒体文件不允许添加.        ✔️
    - 偏好设置界面添加重启按钮, 检查更新按钮.   ✔️
    - 偏好设置界面添加桌面动画设置项.          ✔️  离场动画在 wall 上, 入场动画在框架子集上. 
    - 偏好设置界面添加快照时间间隔设置项.    ✔️
    - 偏好设置界面添加启动是否打开控制面板设置项.    ✔️
    - 偏好设置界面添加全局音量调节设置项.[考虑]        ✔️
    - 偏好设置界面添加是否开启断网提示设置项.  暂时不要. ✔️
    - 偏好设置界面添加一个系统修复功能(删除数据库重建).    ✔️
    - 全局隐藏功能, 隐藏重启之后, 发现是显示的问题修复.    ✔️
    - 控制面板右上角的 同步loading层导致的 overflow-x 的问题需要解决一下.  ✔️
    - 窗口 title 的问题统一处理. ✔️
    - 控制面板头部拖拽能优化尽优化一下.     ✔️ 完美, 但损失了 mac 下的窗口边缘吸附效果.
    - 托盘菜单增加控制桌面暂停, 静音等动作.  ✔️
    - over. 把自动更新弄好就发布.

##### 2019.06.23 任务
- 打包, 准备发布.      ✔️
- 托盘菜单增加控制桌面暂停, 静音等动作结果同步向控制面板.   ✔️
- 桌面转场动画异常问题修复.   ✔️
- wall 增加 api 开关改变的提示信息层.       暂时不处理.
- 优化因网络异常导致的腾讯统计阻塞加载的问题.      ✔️
- 崩溃日志报告功能, 发送监测邮件.  只能建立服务器传送, 暂时不处理. 
- resolver 层在打包之后无法通过 node 指令调用的问题. 只能搞到主进程去处理执行.  ✔️
- 打包防篡改代码的问题.   => 考虑一下 nw.js  => 安全性可以, 但API 不够丰富, 不能提供满足该项目的特定解决方案. 重构工作量也是一个问题. => 放弃.
- 解决打asar包的问题.  ✔️
- 缩减安装包大小.      ✔️
- 关闭控制台.        ✔️
- 自动更新功能.       ✔️
- 分发.

- 加密思路:  后续版本补上.  nodejs 暂时没有任何手段能进行加密.
        1. 要到桌面商店下载获取和安装桌面, 这个的加密安全性处理, 是绝对没问题的.
        2. 要考虑的是, 破解者, 直接把桌面包放到本地了. 
        3. 对于这种情况, 系统启动之后, 对比一下远程和本地的数据, 然后控制即可. 很麻烦. 
        4. 但是, 本地代码无法保证安全性... 
        5. 将此类型的敏感代码放到 secure 中, 混淆处理. 

##### 2019.06.25 任务
- Windows端调测打包。  ✔️
- 解决配置通信问题. 下午.3  √
- 解决引导问题. 晚上.1.   ✔️
- 解决windows下设备快照遗留问题.  √
- 解决windows下托盘菜单的上下文触发偶现导致应用崩溃的问题. 下午.1 √
- 修复网络较差情况下, 腾讯统计造成的页面阻塞.  √
- 解决控制面板加载缓慢的问题 => 提前打开, 关闭实际隐藏, 停止快照即可. √
- 控制面板平台兼容细节调整. √
- 设备监控获取桌面映射配对的延迟问题处理。 √
- 解决windows下手动修复功能的异常问题。(数据库被锁定)。 √
- 买新域名, 备案, 修改代码中的域名信息.  下午.2  ✔️
- 打包发布1.0.1版本. 晚上.2 ✔️


##### 2019.06.27 - 2019.06.30 任务
- 资源社区搭建  搭建完毕.         ✔️
- 遗留问题: 
    - QQ 互联登录 / 微信互联登录      延后
    - electron 中无边窗口打开新窗也无边的问题处理.   ✔️
    - 社区中部分链接修改为主动新窗打开, 比如说: 联系 QQ, 分享, 管理中心, QQ 互联等. ⭕️ 打包发布后再去调.
    - 屏蔽社区访问推广, 屏蔽分享功能.    ⭕️ 打包发布后再去调.
    - 手动写一个 Dialog 模块. 因为 win 下的 dialog 太丑了.   ✔️
    - Windows 端细节和性能优化.     ⭕️
    - 双端同步编译打包发布 1.0.7 版本.
- 桌面商店(简化版)构建.
    - 客户端控制栏按钮增加用户头像, 点击调起登录/  延后
    - ucenter 的问题处理.  延后
    - 客户端的登录入口问题处理.  延后
    - 登录入口与资源社区协调处理.  延后
    - 桌面商店项目开发.         ⭕️
- 推广单页开发:
    -下载软件的单页面就好.        ⭕️
- 帮助按钮链接向社区固定帖子.    ✔️

##### 2019.07.01 - 2019.07.05 任务
- 桌面商店搭建



