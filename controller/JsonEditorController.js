const baseController = proxy.require('../controller/BaseController');
const http = proxy.require('../core/Http');
const deviceDeskModel = proxy.require('../model/DeviceDeskModel')();

var amIndex;
var vm = new Vue({
    el: '#app',
    data: function () {
        return {
            lock: proxy.lock,
            loadingData: true,
            json: undefined,//将要处理的 json 数据.
        };
    },
    methods: {
        renderJsonEditor(jsonObj) {
            var that = this;
            var container, options, json;
            $('#json-editor').html('');
            container = document.getElementById('json-editor');
            options = {
                mode: 'tree',
                modes: ['code', 'form', 'text', 'tree', 'view'], // allowed modes
                name: "#",
                // indentation: 4,
                // escapeUnicode: true,
                // onTextSelectionChange: function (start, end, text) {
                //     var rangeEl = document.getElementById('textRange');
                //     rangeEl.innerHTML = 'start: ' + JSON.stringify(start) + ', end: ' + JSON.stringify(end);
                //     var textEl = document.getElementById('selectedText');
                //     textEl.innerHTML = text;
                // },
                // onSelectionChange: function (start, end) {
                //     var nodesEl = document.getElementById('selectedNodes');
                //     nodesEl.innerHTML = '';
                //     if (start) {
                //         nodesEl.innerHTML = ('start: ' + JSON.stringify(start));
                //         if (end) {
                //             nodesEl.innerHTML += ('<br/>end: ' + JSON.stringify(end));
                //         }
                //     }
                // },
                onError: function (err) {
                    alert(err.toString());
                },
                // onEditable: function (node) {
                //     if (!node.path) {
                //         // In modes code and text, node is empty: no path, field, or value
                //         // returning false makes the text area read-only
                //         return false;
                //     }
                // },
                onModeChange: function (newMode, oldMode) {
                    console.log('Mode switched from', oldMode, 'to', newMode);
                },
                onChange: function () {
                    console.log('change');
                    that.sendInfo();
                },
                onEvent: function (node, event) {
                    if (event.type === 'click') {
                        var message = 'click on <' + node.field +
                            '> under path <' + node.path +
                            '> with pretty path: <' + prettyPrintPath(node.path) + '>';
                        if (node.value) message += ' with value <' + node.value + '>';
                        console.log(message);
                    }

                    function prettyPrintPath(path) {
                        var str = '';
                        for (var i = 0; i < path.length; i++) {
                            var element = path[i];
                            if (typeof element === 'number') {
                                str += '[' + element + ']'
                            } else {
                                if (str.length > 0) str += ',';
                                str += element;
                            }
                        }
                        return str;
                    }
                }
            };
            window.jsoneditor = new JSONEditor(container, options, jsonObj);
            console.log('json', json);
            console.log('string', JSON.stringify(json));
        },
        setInfo(json) {
            var that = this;
            that.json = json;
            // $('title').text(deviceDeskModel.genScreenTitleByName(that.screen.name) + ' - ' + $('title').text());
            that.renderJsonEditor(json);
            that.loadingData = false;
        },
        sendInfo() {
            proxy.appVar._controlwindow.webContents.send('ipc_window_jsoneditor_egi', getJSON());
        },
    },
    created: function () {
        var that = this;
        proxy.ipc.on('ipc_window_jsoneditor_cgi', function (event, json) {
            console.debug('ipc_window_jsoneditor_cgi: ' + json);
            var title = $('title').text();
            (title.indexOf && title.indexOf('  -  ') === -1) ? $('title').text(json.title + '  -  ' + title) : '';
            that.setInfo(json.data);
        });
    },
    mounted() {
        var that = this;
        proxy.ipc.on('ipc_lock_req', function (event, swicth) {
            proxy.lock = swicth;
            proxy.appVar._lock = swicth;
            proxy.refreshAppVar();
            that.lock = swicth;
        });
    }
});


// set json
function setJSON(json) {
    window.jsoneditor.set(json);
}

// get json
function getJSON() {
    var json = window.jsoneditor.get();
    console.debug(json);
    return JSON.stringify(json, null, 2);
}