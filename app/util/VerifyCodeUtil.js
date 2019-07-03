var verifyCodenums = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0",
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
    'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'
];
var verifyCodestr = '';
var verVals = [];

// 绘制验证码
function drawCode(verifyCodestr, eleid) {
    var canvas = document.getElementById(eleid + '-canvas'); //获取HTML端画布
    var context = canvas.getContext("2d"); //获取画布2D上下文
    context.fillStyle = "cornflowerblue"; //画布填充色
    context.fillRect(0, 0, canvas.width, canvas.height); //清空画布
    context.fillStyle = "white"; //设置字体颜色
    context.font = "25px Arial"; //设置字体
    var rand = new Array();
    var x = new Array();
    var y = new Array();
    for (var i = 0; i < 4; i++) {
        rand.push(rand[i]);
        rand[i] = verifyCodenums[Math.floor(Math.random() * verifyCodenums.length)];
        x[i] = i * 20 + 10;
        y[i] = Math.random() * 20 + 20;
        context.fillText(rand[i], x[i], y[i]);
    }
    verifyCodestr = rand.join('').toUpperCase();
    //画3条随机线
    for (var i = 0; i < 3; i++) {
        drawline(canvas, context);
    }

    // 画30个随机点
    for (var i = 0; i < 30; i++) {
        drawDot(canvas, context);
    }
    convertCanvasToImage(canvas, eleid);
    return verifyCodestr;
}

// 随机线
function drawline(canvas, context) {
    context.moveTo(Math.floor(Math.random() * canvas.width), Math.floor(Math.random() * canvas.height)); //随机线的起点x坐标是画布x坐标0位置，y坐标是画布高度的随机数
    context.lineTo(Math.floor(Math.random() * canvas.width), Math.floor(Math.random() * canvas.height)); //随机线的终点x坐标是画布宽度，y坐标是画布高度的随机数
    context.lineWidth = 0.5; //随机线宽
    context.strokeStyle = 'rgba(50,50,50,0.3)'; //随机线描边属性
    context.stroke(); //描边，即起点描到终点
}

// 随机点(所谓画点其实就是画1px像素的线，方法不再赘述)
function drawDot(canvas, context) {
    var px = Math.floor(Math.random() * canvas.width);
    var py = Math.floor(Math.random() * canvas.height);
    context.moveTo(px, py);
    context.lineTo(px + 1, py + 1);
    context.lineWidth = 0.2;
    context.stroke();

}

// 绘制图片
function convertCanvasToImage(canvas, eleid) {
    $('#' + eleid + '-canvas').hide();
    var image = $('#' + eleid).children('img');
    image.attr('src', canvas.toDataURL("image/png"));
    return image;
}

// 点击div刷新
function resetVerifyCode(eleid) {
    var width = $('#' + eleid).width();
    var height = $('#' + eleid).height();
    $('#' + eleid).children('canvas').remove();
    $('#' + eleid).children('img').before('<canvas width="' + width + '" height="' + height + '" id="' + eleid + '-canvas"></canvas>')
    var verVal = drawCode('', eleid);
    getVerifyCode(eleid, verVal);
}

//查询验证码
function getVerifyCode(id, newcode) {
    for (var x in verVals) {
        if (verVals[x].id === id) {
            if (newcode) {
                verVals[x].code = newcode;
            } else {
                return verVals[x].code;
            }
        }
    }
}

//渲染验证码控件
function renderVerifyCode(seletor) {
    var drawDiv = $(seletor);
    drawDiv.each(function () {
        $(this).html('<canvas width="100" height="32" id="' + $(this).attr('id') + '-canvas"></canvas>\n' +
            '                    <img />');
        var code = drawCode('', $(this).attr('id'));
        var id = $(this).attr('id');
        verVals.push({'id': id, 'code': code});
    });

    drawDiv.on('click', function () {
        resetVerifyCode($(this).attr('id'));
    })
}

$(function () {
    renderVerifyCode('.zxx_verifycode_draw');//默认控件类名
});