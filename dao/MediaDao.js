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
     * 通过桌面 id 获取媒体组数据
     * @param ld_id
     */
    this.getsByDeskId = function (ld_id) {
        return this._self.select({ld_id: ld_id + ''});
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
     * @param filename
     * @param filepath
     */
    this.deleteByDeskId = function (ld_id, filename, filepath) {
        return this._self.delete({ld_id: ld_id + '', filename: filename, filepath: filepath});
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