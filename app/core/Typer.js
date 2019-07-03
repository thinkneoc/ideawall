var Typer = function (panelId, dmsg) {

    this.config = {
        msg: function (msg) {
            return msg;
        },
        len: function () {
            return this.msg.length;
        },
        seq: 0,
        speed: 150, //打字时间(ms)
        type: function () {
            var _this = this;
            document.getElementById(panelId).innerHTML = _this.msg.substring(0, _this.seq);
            if (_this.seq == _this.len()) {
                _this.seq = 0;
                clearTimeout(t);
            } else {
                _this.seq++;
                var t = setTimeout(function () {
                    _this.type()
                }, this.speed);
            }
        }
    };

    this.write = function (text) {
        this.config.msg = (text && text !== '' && text !== null) ? text : dmsg;
        this.config.type();
    }
};


module.exports = (panelId, dmsg) => {
    new Typer(panelId, dmsg)
};