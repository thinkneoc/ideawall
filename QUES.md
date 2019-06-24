# Electron-Builder 打包异常记录

因为要 electron-builder 执行会进行 rebuild, 所以, sqlite3 在没有指定 abi以及国内镜像地址 等参数的情况下,
绝逼会出错, 首当其冲的就是网路异常: 
```
Response timeout for 60000ms, GET https://registry.npmjs.com/rebuild
```

正确姿势如下: 
 - 添加指令: "rebuild": "cnpm rebuild -f --runtime=electron --target=5.0.4 --disturl=https://npm.taobao.org/mirrors/atom-shell --abi=72"
 - 添加指令: "postinstall": "npm run rebuild && electron-builder install-app-deps"
 其作用是: 在 install 的时候, 将 eb 需要的依赖全部下载下来. 其中提前 rebuild 是为了防止打包后导致的sqlite3异常.
 - 镜像源修改和 eb 需要的头文件直接下载: 
    - 1.修改 yarn 源: yarn config set registry https://registry.npm.taobao.org
    - 2.保险起见: 复制一下代码到.npmrc 文件, mac 在用户根目录下的隐藏文件, win 在C盘 User 文件夹中, 也是隐藏文件.
        ```
        registry=https://registry.npm.taobao.org/
        electron_mirror=https://npm.taobao.org/mirrors/electron/
        sass_binary_site=https://npm.taobao.org/mirrors/node-sass/
        phantomjs_cdnurl=https://npm.taobao.org/mirrors/phantomjs/
        ```
    - 3.指定镜像下载 nodejs 头文件: node-gyp install --dist-url https://npm.taobao.org/mirrors/node
    - 4.指定镜像下载 electron 头文件: node-gyp install --target=5.0.4 --dist-url=https://npm.taobao.org/mirrors/atom-shell/ --abi=72
<!--                                    node-gyp install  --target=5.0.5 --dist-url=https://atom.io/download/electron/-->

ELECTRON_MIRROR=http://npm.taobao.org/mirrors/electron/ npm install -g electron
electron-rebuild -d=http://npm.taobao.org/mirrors/atom-shell
electron-rebuild -d=http://npm.taobao.org/mirrors/atom-shell -f -w $module_with_c++_code
  
 - 开始, 正面上: 
    - 1.cnpm install  会一起自动执行postinstall指令. 
    - 2.npm run dist  eb 的打包指令, 具体按 eb 的正常套路来就 ok.
    - 3.☕️ 等待完成即可, 速度会快很多. 结果默认在 dist 目录下.
    
以上骚操作, 在 MacOS 下, 完美起飞. Win 下待测.



# 集成 Webpack
- 添加依赖
    ```
    "devDependencies": {
        "css-loader": "^0.28.1",
        "electron": "^1.6.7",
        "electron-packager": "^8.7.0",
        "extract-text-webpack-plugin": "^2.1.0",
        "is-electron-renderer": "^2.0.1",
        "style-loader": "^0.17.0",
        "webpack": "^2.5.1",
        "webpack-dev-server": "^2.4.5",
        "webpack-target-electron-renderer": "^0.4.0"
      }
    ```
- 安装一下东西: 
    - $ npm install --save-dev webpack 
    - $ npm install --save-dev webpack-dev-server
    - $ npm install --save-dev webpack-target-electron-renderer
    - $ npm install --save-dev is-electron-renderer
    - $ npm install --save-dev css-loader
    - $ npm install --save-dev style-loader
    - $ npm install --save-dev extract-text-webpack-plugin
 - 执行和打包指令添加前置指令: 'webpack && '
 - 新建 webpack.config.js
     ```
     'use strict';
    
    const path = require('path');
    const webpack = require('webpack');
    
    module.exports ={
      target: 'electron-renderer',
      entry: [
        './src/index',
      ],
      output: {
        path: path.join(__dirname, 'build'),
        publicPath: path.join(__dirname, 'src'),
        filename: 'bundle.js',
      },
      module: {
        rules: []
      },
    };
     ```
 - 新建 webpack 入口文件: ./src/index.js
    ```
    console.log('running in electron: ', require('is-electron-renderer'));
    ```
    
# 提权
 - sudo chmod -R 777 dist
 