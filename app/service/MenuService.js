const logger = require('../common/Logger');//日志模块
var template = require('art-template');

setMenu();

function setMenu() {
    var menu_template = 
        '<li>' +
        '   <a href="#" onclick="baseController.openNewWindow(\'Demo\')">' +
        '       <i class="fa fa-th"></i>' +
        '       <span>Demo</span>' +
        '   </a>' +
        '</li>' +
        '<li class="treeview">' +
        '   <a href="#">' +
        '       <i class="fa fa-bar-chart-o"></i>' +
        '       <span class="pull-right-container">' +
        '           <i class="fa fa-angle-left pull-right"></i>' +
        '           一级菜单' +
        '       </span>' +
        '   </a>' +
        '   <ul class="treeview-menu">' +
        '       <li>' +
        '           <a href="#" ' +
        '               <i class="fa fa-circle-o"></i>' +
        '               二级菜单1' +
        '           </a>' +
        '       </li>' +
        '       <li>' +
        '           <a href="#" ' +
        '               <i class="fa fa-circle-o"></i>' +
        '               二级菜单2' +
        '           </a>' +
        '       </li>' +
        '   </ul>' +
        '</li>';

    var render = template.compile(menu_template);
    var html = render();
    document.getElementsByClassName('sidebar-menu')[0].innerHTML = html;
    logger.info("[Service][MenuService-setMenu]渲染菜单");
}



