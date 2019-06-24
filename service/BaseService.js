const logger = require('../core/Logger');//日志模块
const config = require('../core/Config');//配置模块

//基础服务类
function BaseService() {
    if (!(this instanceof BaseService)) {
        return new BaseService();
    }

    this.logger = logger;
    this.config = config;
}

module.exports = { BaseService }