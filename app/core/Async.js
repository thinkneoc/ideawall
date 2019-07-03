/**
 * 异步支撑库[主进程和渲染进程通用, 需要在ideanote.js引用之后调用]
 *
 * @author troy
 * @date 2019/01/21 08:50 PM
 */
const async = require('async');

/**
 * @constructor
 */
function Async() {

    let target = this;//对象寄存器

    //数据库初始化, 自动执行.
    this.init = function () {
    };

    //自动串行并行
    this.auto = function (funs, callback) {
        async.auto(funs, function (err, results) {
            if (typeof callback === 'function') {
                callback(err, results);
            }
        });
    };

    //Aop切面[经典].
    //规则:
    //1. prev没传(传flase), 不妨碍action和after的串行执行.
    //2. action没传, 不妨碍prev和after的串行执行.
    //3. 全都传了, 串行执行.
    //4. prev方法一定要返回一个boolean值, 来确定放行还是拦截. [为方便逻辑性, 如果没有设定返回值(undefined), 就默认为true]
    this.aop = function (prev, action, after, topic) {
        topic = topic ? topic : '';
        target.auto({
            prev: function (callback) {
                if (typeof prev === 'function') {
                    var r = prev();
                    r = (r === undefined ? true : r);
                    callback(null, r);
                    return;
                }
                callback(null, true);
            },
            action: [
                'prev',
                function (res, callback) {
                    if (res.prev) {
                        if (typeof action === 'function') {
                            callback(null, action());
                            return;
                        }
                        callback(null, true);
                    } else {
                        console.warn(topic + 'AOP动作日志: prev方法拦截了action的执行!');
                        callback(null, false);
                    }
                }
            ],
            after: [
                'prev', 'action',
                function (res, callback) {
                    res.action = true;//after不受action动作拦截.
                    if (res.prev && res.action) {
                        if (typeof after === 'function') {
                            callback(null, after());
                            return;
                        }
                        callback(null, true);
                    } else {
                        console.warn(topic + 'AOP动作日志: prev方法拦截了after的执行!');
                        callback(null, false);
                    }
                }
            ]
        }, function (err, results) {
            if (err) {
                console.error(topic + 'AOP切面动作异常! ');
                console.error(err);
            }
            return results;
        });
    };


    this.init();//自动初始化.
}

module.exports = () => {
    return new Async();
};

//调用示例
// async.auto({
//     fun1: function () {
//         //...
//     },
//     fun2: function () {
//         //...
//     },
//     fun3: [//引用了fun1和fun2的返回值, 那么fun1和fun2是并行的, 他们与fun3是串行的.
//         'fun1', 'fun2',
//         function () {
//             //...
//         }
//     ]
// }, function () {
//
// });

