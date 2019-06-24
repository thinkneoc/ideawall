const logger = require('./Logger');//日志模块
const lang = require('./Lang')();

function Model() {

    this.init = function () {

    };

    /**
     * 计算表名
     *
     * @param model
     * @returns {string}
     */
    this.tbname = function (model) {
        return (model.tbinfo.tprefix ? model.tbinfo.tprefix : '') + model.tbinfo.name;
    };

    /**
     * 计算列名
     *
     * @param model
     * @param fname
     * @returns {string}
     */
    this.fieldname = function (model, fname) {
        return (model.tbinfo.cprefix ? model.tbinfo.cprefix : '') + fname;
    };

    /**
     * 回推数据的时候用于清除列名前缀
     *
     * @param model
     * @param zxx
     * @returns {*}
     */
    this.rmFp = function (model, zxx) {
        var prefix = model.tbinfo.cprefix;
        if (prefix && prefix != '' && zxx) {
            for (let x in zxx) {
                if (x.indexOf(prefix) === 0) {
                    var newx = x.replace(prefix, '');
                    zxx[newx] = zxx[x];
                }
            }
        }
        return zxx;
    };

    /**
     * 回推数据的时候用于清除列名前缀 [批量]
     *
     * @param model
     * @param zxxs
     * @returns {*}
     */
    this.rmFps = function (model, zxxs) {
        if (lang.isArray(zxxs)) {
            var prefix = model.tbinfo.cprefix;
            if (prefix && prefix != '' && zxxs && zxxs.length > 0) {
                for (let x in zxxs) {
                    zxxs[x] = this.rmFp(model, zxxs[x]);
                }
            }
            return zxxs;
        } else {
            return this.rmFp(model, zxxs);
        }
    };

    /**
     * 字段合并和缺省处理
     * @param model
     * @param record
     */
    this.field = function (model, record) {
        return Object.assign({}, model.columns, record);//会改变第一项的内容, 为防止深拷贝, 第一参数给空对象. 其次, 注意: 只有根属性才会 merage.
        // let fields = model.fields;
        // for (let x in fields) {
        //     //延时+闭包, 是因为并发造成的数据异常.
        //     setTimeout(()=>{
        //         (function (x) {
        //             let zxx = fields[x];//zxx 是原始值, x 是键
        //             if (record.hasOwnProperty(x)) {
        //                 fields[x] = record[x];
        //             }
        //         })(x);
        //     }, 100);
        // }
        // return fields;
    };

    /**
     * 批量字段合并和缺省处理
     * @param model
     * @param records
     */
    this.fields = function (model, records) {
        for (let x in records) {
            records[x] = this.field(model, records[x]);
        }
        return records;
    };

    /**
     * 校验器
     * @param model
     * @param records
     */
    this.validate = function (model, records) {

    };

    this.init();
}

module.exports = () => {
    return new Model();
};