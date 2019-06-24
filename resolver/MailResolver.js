/**
 * @Description 邮件发送
 * 调用方法:sendMail('1747128171@qq.com','这是测试邮件', 'Hi 少年,这是一封测试邮件');
 */

let nodemailer = require('nodemailer');
// let smtpTransport = require('nodemailer-smtp-transport');

const fs = require('fs');
const path = require('path');
const child_process = require('child_process');


var config = {
    email: {
        service: 'qq',
        fromname: '"ideawall 创意者桌面" <noreply@16inet.com>',
        user: 'noreply@16inet.com',
        pass: 'eabqosixlvujbjag',
    }
};

function createTransporter(user) {
    return nodemailer.createTransport({
        service: config.email.service,
        // secure: true, // 使用 SSL
        // port: 25, // SMTP 端口
        // secureConnection: true, // 使用了 SSL
        auth: {
            user: config.email.user,
            pass: config.email.pass
        },
        // sendmail: true,
        // newline: 'windows',
        logger: true,
    });
}

/**
 * @param {Object} re 邮件信息
 * recipient 收件人
 * subject 发送的主题
 * text 发送的text内容
 * html 发送的html内容
 * htmlFilePath 发送的html文件路径(相对于根目录)  三者优先级, 从上往下, 越来越大. => html 有值 -> 无视 text; htmlFilePath 有值 -> 无视 text 和 html.
 * attachments 附件集合 => 格式:
 * attachments: [
 *  {
 *      filename: 'text.txt',//文件名
 *      content: 'Hello World!',//文件内容, 你
 *      contentType: 'text/plain',//文件 MediaType 类型
 *
 *      path: __dirname + '/assets/nyan.gif',//通过 path 指定文件, 不再需要 content 和 contentType.
 *
 *      content: Buffer.from(
 *                'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQAQMAAAAlPW0iAAAABlBMVEUAAAD/' +
 *               '//+l2Z/dAAAAM0lEQVR4nGP4/5/h/1+G/58ZDrAz3D/McH8yw83NDDeNGe4U' +
 *                'g9C9zwz3gVLMDA/A6P9/AFGGFyjOXZtQAAAAAElFTkSuQmCC',
 *               'base64'
 *            ),//通过输入流来指定, 不再需要 contentType和 path.
 *
 *      cid: 'note@example.com',//一般为邮箱, 官方描述为: 尽可能唯一的标识. 作用未知. 通过 content 和 contentType 声明的附件可忽略该参数, 其余情况, 建议加上.
 *  },
 *  ...
 * ]
 * @param {String} callback 发送的html文件路径(相对于根目录)
 */
function sendMail(re) {
    return new Promise((resolve, reject) => {
        const transporter = createTransporter();
        var mailOptions = {
            from: config.email.fromname,
            to: re.recipient,
            subject: re.subject,
            text: re.text
        };
        if (re.html) {
            mailOptions.html = re.html;
            if (re.htmlFilePath) {
                mailOptions.html = fs.createReadStream(path.resolve(__dirname, re.htmlFilePath));
            }
        }
        if (re.attachments && re.attachments.length > 0) {
            mailOptions.attachments = re.attachments;
        }
        transporter.sendMail(mailOptions, function (err, info) {
            if (err) {
                console.log(err);
                reject(err)
            } else {
                console.log('发送成功');
                resolve();
            }
        })
    })
}

module.exports = {
    sendMail
};

