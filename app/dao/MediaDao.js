const Model = require('../core/Model')();
const datetime = require('../core/Datetime')();

const initscript = '' +
    'CREATE TABLE IF NOT EXISTS "iw_media" (\n' +
    '  "m_id" integer NOT NULL ON CONFLICT IGNORE PRIMARY KEY AUTOINCREMENT,\n' +
    '  "m_filename" text(200),\n' +
    '  "m_filepath" text(5000),\n' +
    '  "m_date_add" text(30),\n' +
    '  "m_ld_id" integer(11) NOT NULL ON CONFLICT IGNORE,\n' +
    '  CONSTRAINT "m_key_id" UNIQUE ("m_id" COLLATE NOCASE ASC) ON CONFLICT IGNORE\n' +
    ');';

/**
 * 桌面媒体组 Dao 层.
 *
 * @param model
 * @constructor
 */
function MediaDao(model) {

    this._self = undefined;

    this.init = function () {
        model.initscript = initscript;
        this._self = require('../core/Database')(model);
    };

    /**
     * 指定桌面的某媒体是否存在
     */
    this.isExist = function(deskId, filename, filepath){
        return this._self.exist({
            ld_id: deskId+'',
            filename: filename,
            filepath: filepath,
        })
    };

    /**
     * 新增媒体资源
     */
    this.addsByDeskId = function(deskId, medias){
        return this._self.batchInsert(medias);
    };

    /**
     * 通过桌面 id 获取媒体组数据
     * @param ld_id
     */
    this.getsByDeskId = function (ld_id) {
        return this._self.execSelect("select * from "
        + Model.tbname(model)
        + " where "
        + Model.fieldname(model, 'ld_id')
        + " == " + ld_id + ''
        + " order by " + Model.fieldname(model, 'date_add') 
        + " desc");
    };

    /**
     * 更新桌面媒体组
     *
     * @param ld_id
     * @param medias
     */
    this.updatesByDeskId = function (ld_id, medias) {
        //1.先直接删掉
        this._self.delete({ld_id: ld_id + ''});
        //2.直接批量添加
        return this._self.batchInsert(medias);
    };

    /**
     * 删除单个媒体数据
     * @param ld_id
     * @param filepath
     */
    this.deleteByDeskId = function (ld_id, mediaId) {
        return this._self.delete({ld_id: ld_id + '', id: mediaId+''});
    };

    /**
     * 清空媒体数据
     *
     * @param ld_id
     */
    this.clearByDeskId = function (ld_id) {
        return this._self.delete({ld_id: ld_id + ''});
    };


    this.init();//自动初始化.
}

module.exports = (model) => {
    return new MediaDao(model);
};