var logger = require('./Logger');//日志模块
logger.info("HttpService-Initialize");
const Http = require('http');
var unirest = require('unirest');//轻量级http请求库


/**
 * 发送http-post请求并执行回调函数
 * @param {string} url 目标url
 * @param {object} params 参数对象列表 eg：{"name":"T1","par2":"par2val"}
 * @param {function} callback 回调函数
 */
function post(url, params, callback) {
    logger.info("[Core][Http-post]发送http请求" + url);
    logger.info(params);
    var req = unirest.post(url);
    req.header('Content-Type', 'application/json')
        .header('Accept', 'application/json')
        .send(params)
        .end(function (data) {
            if (data.code == 200) {
                logger.info("[Core][Http-post]正常返回");
                callback(true, data.body);
            } else {
                logger.warn(data);
                callback(false, data);
            }
        });
}

function get(url, callback) {
    logger.info("[Core][Http-get]发送get请求" + url);
    Http.get(url, (res) => {
        const {statusCode} = res;
        const contentType = res.headers['content-type'];
        let error;
        if (statusCode !== 200) {
            error = new Error('请求失败\n' +
                `状态码: ${statusCode}`);
            logger.error(error);
            // 消费响应的数据以释放内存。
            res.resume();
            callback(false, error);
            return;
        }
        //处理数据
        res.setEncoding('utf8');
        let rawData = '';
        res.on('data', (chunk) => {
            logger.debug(chunk);
            rawData += chunk;
        });
        res.on('end', () => {
            try {
                callback(true, rawData, res, url, contentType);
            } catch (e) {
                logger.error(e);
                callback(false, e);
            }
        });
    }).on('error', (e) => {
        logger.error(e);
        callback(false, e);
    });
}

module.exports = {post, get};