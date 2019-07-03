const Crypto = require('crypto');//加密解密模块
const UUID = require('./UUID');//UUID 模块

/**
 * 加密算法
 */
var Encrypt = function () {

    //MD5加密算法: 不可逆.
    this.md5 = function (secret) {
        var md5 = Crypto.createHash('md5');//定义加密方式:md5不可逆,此处的md5可以换成任意hash加密的方法名称；
        md5.update(new Buffer(secret).toString("binary"), 'utf8');//buffer 处理转为二进制, 否则与其他语言处理结果不一致.
        var crypto = md5.digest('hex');  //二进制编码, 可选: hex, latin1, base64.
        // console.debug('crypto-encrypt-md5: ' + secret + ' -> ' + crypto);
        return crypto;
    };

    //sha256加密算法: 不可逆.
    this.sha256 = function (secret) {
        var sha256 = Crypto.createHmac('sha256');
        sha256.update(secret);
        var crypto = sha256.digest('hex');
        console.debug('crypto-encrypt-sha256: ' + secret + ' -> ' + crypto);
        return crypto;
    };

    //对称加密算法: 可逆
    this.cipher = function (secret, cryptokey) {
        cryptokey = cryptokey ? cryptokey : UUID.v1();//密钥
        var cipher = Crypto.createCipher('aes192', cryptokey);
        var crypto = cipher.update(secret, 'utf8', 'hex');//编码方式从utf-8转为hex;
        crypto += cipher.final('hex');//编码方式从转为hex;
        console.debug('crypto-encrypt-cipher: secret -> ' + secret + ', cryptokey -> ' + cryptokey + ', crypto -> ' + crypto);
        if (cryptokey) {
            return crypto;
        } else {
            return {'cryptokey': cryptokey, 'crypto': crypto};
        }
    };

    /**
     * aes加密
     * @param data 待加密内容
     * @param secretKey
     * @returns {string}
     */
    this.aes = function (data, secretKey) {
        if (!data) {
            return "";
        }
        var cipher = Crypto.createCipher('aes-128-ecb', secretKey);
        return cipher.update(data, 'utf8', 'hex') + cipher.final('hex');
    };
};
var encrypt = new Encrypt();

/**
 * 解密算法
 */
var Decrypt = function () {

    //对称解密算法
    this.cipher = function (crypto, cryptokey) {
        var decipher = Crypto.createDecipher('aes192', cryptokey);
        var decrypto = decipher.update(secret, 'hex', 'utf8');//编码方式从hex转为utf-8;
        decrypto += decipher.final('utf8');//编码方式从utf-8;
        console.debug('crypto-cipher-cipher: secret -> ' + secret + ', cryptokey -> ' + cryptokey + ', decrypto -> ' + decrypto);
        return decrypto;
    };

    /**
     * aes解密
     * @param data 待解密内容
     * @param secretKey
     * @returns {string}
     */
    this.aes = function (data, secretKey) {
        if (!data) {
            return "";
        }
        var cipher = Crypto.createDecipher('aes-128-ecb', secretKey);
        return cipher.update(data, 'hex', 'utf8') + cipher.final('utf8')
    };
};
var decrypt = new Decrypt();

/**
 * 校验器
 */
var Verify = function () {

    //md5校验
    this.md5 = function (secret, crypto) {
        var crypto4secret = encrypt.md5(secret);
        return (crypto4secret === crypto);
    };

    //sha256校验
    this.sha256 = function (secret, crypto) {
        var crypto4secret = encrypt.sha256(secret);
        return (crypto4secret === crypto);
    };

    //对称加密校验
    this.cipher = function (secret, crypto, cryptokey) {
        var decrypto4secret = decrypt.cipher(crypto, cryptokey);
        return (decrypto4secret === secret);
    };

    //aes加密校验
    this.aes = function (secret, crypto, cryptokey) {
        var decrypt4secret = encrypt.aes(secret, cryptokey);
        return (decrypt4secret === crypto);
    };
};
var verify = new Verify();

module.exports = {
    encrypt,
    decrypt,
    verify
};