/**
 * 本地数据库[主进程通用, 暂时使用nedb(简单粗暴)
 *
 * @author troy
 * @date 2019/01/17 10:52 PM
 */
const datastore = require('lowdb');
const datastoreFs = require('lowdb/adapters/FileSync');
const path = require('path');
const crypto = require('./Crypto');
const uuid = require('./UUID')();
const datetime = require('../core/Datetime')();
const config = require('../core/Config');//引入全局配置组件
const logger = require('../core/Logger');
const lang = require('../core/Lang')();

//注意: 由于 remote 模块仅限渲染进程调用, 所以, 当前库亦仅限渲染进程调用.
const Electron = require('electron');
const Remote = Electron.remote;
let appVar = Remote.getGlobal('appVar');

/**
 * @param model 数据模型
 * 注意: 修改加密配置应当首先清除所有数据.
 * @constructor
 */
function Database(model) {

    this.table = {};//数据表底层对象
    this.adapter = {};//适配器
    this.dir = appVar._apath.dir.data;//数据存放位置
    this.suffix = '.data';//文件后缀
    this.filepath = '';
    this.cryptokey = '#~Zhouxinimei3621.,(*^&*^%#%+-=/<?><{}|][%!@#)';//密盐
    this.initstate = {
        data: [],//表数据[约定除时间戳外其他全是字符类型]
        info: {},//表信息
        census: { // 数据统计[约定全是数字类型]
            data: 0, //实体数据统计
            read: 0, //访问统计: 读.
            write: 0, //访问统计: 写.
        },
    };

    //数据库初始化, 自动执行.
    this.init = function () {
        var that = this;
        //缺省填充
        var info = model.tbinfo;
        info.id = info.id ? info.id : uuid.v1();
        info.create_date = info.create_date ? info.create_date : (new Date().getTime());
        info.last_access_date = info.last_access_date ? info.last_access_date : (new Date().getTime());
        info.encrypt = info.encrypt ? info.encrypt : config.get('database').encrypt;
        this.initstate.info = info;
        if (!this.initstate.info.name || (this.initstate.info.name + '').trim() === '') {
            console.error('非法操作! 数据表名不能为空!');
            return;
        }
        this.filepath = this.dir + '/' + this.initstate.info.name + this.suffix;
        this.adapter = new datastoreFs(this.filepath, {
            serialize: (tbdata) => {
                if (tbdata.info.encrypt) {
                    tbdata.data = crypto.encrypt.aes(tbdata.data, that.cryptokey);
                }
                return JSON.stringify(tbdata, null, 4);
            }, //写之前的操作 => 反序列化并解密数据
            deserialize: (tbdata) => {
                tbdata = JSON.parse(tbdata);
                if (tbdata.info.encrypt) {
                    tbdata.data = crypto.decrypt.aes(tbdata.data, that.cryptokey);
                }
                return tbdata;
            }, //读之后的操作 => 加密数据并序列化
            defaultValue: that.initstate, //文件不存在时, 新建文件后设置的默认值.
        });
        this.table = datastore(this.adapter);//返回一个具有特定属性和功能的 lodash
        this.delog('连接数据表', this.initstate.info);
        // this.delog('state', this.initstate);
        // this.delog('数据', this.data(false, false).value());
    };

    /**
     * 日志
     */
    this.delog = function (topic, data) {
        var that = this;
        var end = '';
        try {
            end = ' => \r\n' + JSON.stringify(data, false, 2);
        } catch (e) {
            if (data) {
                end = ' => ' + data;
            }
        }
        logger.debug('[Core][Database]' + topic + ' ' + this.initstate.info.name + ' (' + this.initstate.info.anno + ', ' + this.filepath + ')' + end);
    };

    //提交动作. 在这里做异常检测, 做额外数据更新和统计工作.[仅对CRUD动作负责]
    this.excute = function (fun, what) {//需要知道是读还是写.(默认为读)
        var that = this;
        try {
            var result = fun();
            // var info = this.getInfo();
            // var census = this.getCensus();
            // //1.更新表信息
            // info.last_access_date = (new Date().getTime());
            // this.info(info);
            // //2.更新统计信息
            // census.data = this.size('data');
            // if (what === 'write') {
            //     census.write = census.write + 1;
            // } else {
            //     census.read = census.read + 1;
            // }
            // this.census(census);
            return result;
        } catch (e) {
            this.delog('提交到数据表发生异常', e);
            return e;
        }
    };

    //获取或更新整个文件域内容
    this.state = function (newState) {
        var that = this;
        if (newState) {
            return this.table.setState(newState);
        } else {
            return this.table.getState();
        }
    };

    //获取或更新数据表中的数据部分
    this.data = function (newobj, deepclone) {//是否禁用深拷贝, 避免导致原数据被更改.[默认启用], 传入true, 则禁用深拷贝功能
        var that = this;
        if (newobj) {
            return this.set('data', newobj, true);
        } else {
            if (deepclone) {
                return this.table.get('data').cloneDeep();
            } else {
                return this.table.get('data');
            }
        }
    };

    this.getData = function (deepclone) {
        var that = this;
        var res = this.data(false, deepclone).value();
        that.delog('GET DATA 数据表', res);
        return res;
    };

    //获取或更新数据表中的表信息部分
    this.info = function (newobj, deepclone) {
        var that = this;
        if (newobj) {
            return this.set('info', newobj, true);
        } else {
            if (deepclone) {
                return this.table.get('info').cloneDeep();
            } else {
                return this.table.get('info');
            }
        }
    };

    this.getInfo = function () {
        var that = this;
        var res = this.info().value();
        that.delog('GEN INFO 数据表', res);
        return res;
    };

    //获取或更新数据表中的统计信息部分
    this.census = function (newobj, deepclone) {
        var that = this;
        if (newobj) {
            return this.set('census', newobj, true);
        } else {
            if (deepclone) {
                return this.table.get('census').cloneDeep();
            } else {
                return this.table.get('census');
            }
        }
    };

    this.getCensus = function () {
        var that = this;
        var res = this.census().value();
        that.delog('GEN CENSUS 数据表', res);
        return res;
    };

    //获取数据表中的指定部分大小. 可以是数组, 也可以是对象
    this.size = function (what) {
        var that = this;
        that.delog('SIZE 数据表', {what: what});
        return this.table.get(what).size().value();
    };

    /**
     * CRUD操作 => for JSON Object
     */
    //[对象]判断是否存在: 传入键, 举栗: 'username'
    this.has = function (which, nocensus) {
        var that = this;
        if (nocensus) {
            that.delog('EXIST 数据表', {which: which});
            return this.table.has(which).value();
        } else {
            return this.excute(() => {
                that.delog('EXIST 数据表', {which: which});
                return this.table.has(which).value()
            });
        }
    };

    //[对象]新增或更新: 传入键值对, 举栗: which='username', value='troy' 或 which='data', value={}
    this.set = function (which, value, nocensus) {
        var that = this;
        if (nocensus) {
            that.delog('SET 数据表', {which: which, value: value});
            return this.table.set(which, value).write();
        } else {
            return this.excute(() => {
                that.delog('SET 数据表', {which: which, value: value});
                return this.table.set(which, value).write();
            }, 'write');
        }
    };

    /**
     * CRUD操作 => for JSON Array
     */
    //[数组]新增: 传入要新增的对象数据, 举栗: {username: 'troy', password: '123456'}
    //支持通过传入 codkeys 数组, 来过滤数据, 若已存在, 就跳过
    this.insert = function (newvalue, codkeys) {
        var that = this;
        if (!newvalue) return;
        return this.excute(() => {
            that.delog('INSERT 数据表', newvalue);
            if (codkeys) {
                var codition = {};
                for (var c in codkeys) {
                    var cc = codkeys[c];
                    if (newvalue.hasOwnProperty(cc)) {
                        codition[cc] = newvalue[cc];
                    }
                }
                if (that.table.get('data').find(codition).value()) {
                    return;//已存在, 跳过
                }
            }
            return that.table.get('data').push(newvalue).write();
        }, 'write');
    };

    //[数组]批量新增: 传入要新增的对象数组
    //支持通过传入 codkeys 数组, 来过滤数据, 若已存在, 就跳过
    //注意: 若传入数据中符合条件的重复项, 不处理, 请提前进行预处理. 这里是为了性能考虑.
    this.batchInsert = function (newvalues, codkeys) {
        var that = this;
        if (!newvalues || newvalues.length <= 0) return;
        console.debug(newvalues);
        return this.excute(() => {
            that.delog('BATCH INSERT 数据表', newvalues);
            var data = that.table.get('data');
            for (var x in newvalues) {
                if (codkeys) {
                    var codition = {};
                    for (var c in codkeys) {
                        var cc = codkeys[c];
                        if (newvalues[x].hasOwnProperty(cc)) {
                            codition[cc] = newvalues[x][cc];
                        }
                    }
                    if (that.table.get('data').find(codition).value()) {
                        break;//已存在, 跳过
                    }
                }
                data = data.push(newvalues[x]);
            }
            return data.write();
        }, 'write');
    };

    //[数组]更新: 传入条件和新值, 举栗: codition={title: 'data'}, newvalue = {title: 'newdata'}
    this.update = function (codition, newvalue) {
        var that = this;
        if (!newvalue) return;
        return this.excute(() => {
            that.delog('UPDATE 数据表', {
                codition: codition,
                newvalue: newvalue
            });
            return that.table.get('data').find(codition).assign(newvalue).write();
        }, 'write');
    };

    //[数组]批量更新: 传入要新增的对象数组, 结构如下:
    //[{codition: {title: 'data'}, data: {...}}, ...]
    this.batchUpdate = function (newvalues) {
        var that = this;
        if (!newvalues || newvalues.length <= 0) return;
        return this.excute(() => {
            that.delog('BATCH UPDATE 数据表', newvalues);
            var data = that.table.get('data');
            for (var x in newvalues) {
                data = data.find(newvalues.codition).assign(newvalues.data);
            }
            return data.write();
        }, 'write');
    };

    this.insertOrUpdate = function (codition, newvalue) {
        var that = this;
        if (!newvalue) return;
        return this.excute(() => {
            var targetRecord = that.table.get('data').find(codition).value();
            if (targetRecord) {
                that.delog('UPDATE 数据表', newvalue);
                that.table.get('data').find(codition).assign(newvalue).write();
                return true;
            } else {
                that.delog('INSERT 数据表', {
                    codition: codition,
                    newvalue: newvalue
                });
                that.table.get('data').push(newvalue).write();
                return false;
            }
        }, 'write');
    };

    //[数组]删除: 传入条件. 举栗: {title: 'data'}
    this.delete = function (codition) {
        var that = this;
        if (!codition) return;
        return this.excute(() => {
            that.delog('DELETE 数据表', codition);
            return that.table.get('data').remove(codition).write()
        }, 'write');
    };

    //[数组]获取一列的所有值: 传入列名, 举栗: 'title'
    this.maps = function (column) {
        var that = this;
        if (!column) return;
        return this.excute(() => {
            that.delog('MAP 数据表', column);
            return that.table.get('data').map(column).value()
        });
    };

    //[数组]检索前n条数据: 传入查询条件(对象), 排序列名(字符), 数据条数(数字), 举栗: codition={title: 'test'}, sortCol='id', num=5 查询条件不能为空, 默认根据id排序获取1条记录.
    this.find = function (codition, sortCol, num) {
        var that = this;
        return this.excute(() => {
            var dataPojo = that.table.get('data');
            if (codition) {
                dataPojo = dataPojo.filter(codition);
            }
            if (sortCol) {
                if (sortCol.indexOf(',') > -1) {
                    var tmpSortCols = sortCol.split(',');
                    for (var x in tmpSortCols) {
                        dataPojo = dataPojo.sortBy(tmpSortCols[x]);
                    }
                } else {
                    dataPojo = dataPojo.sortBy(sortCol);
                }
            }
            if (num) {
                dataPojo = dataPojo.take(num);
            }
            that.delog('FIND 数据表', {codition: codition, sortCol: sortCol, num: num});
            return dataPojo.value();
            // return that.table.get('data').filter(codition).sortBy(sortCol).take(num).value()
        });
    };

    //[数组]检索1条数据: 传入data数组的索引位置(前提是你知道索引位置). 举栗: 0
    this.findIndex = function (index) {
        var that = this;
        if (!index) return;
        return this.excute(() => {
            that.delog('FINDINDEX 数据表', {index: index});
            return that.table.get('data[' + index + ']').value()
        });
    };

    /**
     * Count统计数据
     *
     * @param codition
     * @returns {*|void}
     */
    this.count = function (codition) {
        var that = this;
        return this.excute(() => {
            var dataPojo = that.table.get('data');
            if (codition) {
                dataPojo = dataPojo.filter(codition);
            }
            that.delog('COUNT 数据表', codition);
            return dataPojo.size();
        });
    };

    /**
     * 按条件判定指定数据是否存在
     * @param codition
     * @returns {*}
     */
    this.exist = function (codition) {
        var that = this;
        return that.table.get('data').find(codition).value();
    };

    this.init();//自动初始化.
}


//主进程调用: const db = require('../core/database')('testdb');
module.exports = (model) => {
    return new Database(model);
};
