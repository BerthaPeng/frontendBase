/**
 * Selector 控件
 *
 *
 * HTML 部分
 * 
 * <div class="selector">
 *     <span class="value placeholder">请选择</span>
 *     <ol>
 *         <li data-id="1">option</li>
 *         <li data-id="2">option</li>
 *         <li data-id="3">option</li>
 *     </ol>
 * </div>
 * 
 * 
 * JS 初始化
 *
 * var $dom = $('.selector');
 * var s = new Selector($dom, opt);
 * 
 * 初始化参数
 * 
 * $dom           jqueryDOM
 * opt            Object    其它参数配置，选填
 * opt.list       Array/Object    菜单对象，如果html里有li标签，则可忽略此项
 * opt.value      String    初始选中的菜单选项的选中值
 * opt.onChange   Function  选中后要执行的回调
 *
 * 原型方法
 *
 * @Function    @Type   @Return
 * getValue     null    String   获取当前选中的选项ID，如果未选中任何选项，则返回 undefined
 * setValue     String  Boolean  设置当前选中的ID，
 * setList      Object  Boolean  设置可选菜单，参数为key，value形式的对象
 * open         null    null     打开菜单
 * close        null    null     关闭菜单
 * destroy      null    null     注销菜单（销毁相关dom的监听事件什么的）
 *
**/
var IS_IE8 = require('../lib/is-ie8');

var Selector = function(dom, option) {
  var self = this;
  option = option || {};

  this.opend        = false;
  this.value        = -1;
  this.defaultText  = option.defaultText || dom.find('.value').text();
  this.targetDOM    = undefined;
  this.optionList   = {};
  this.onChange     = function() {};
  this.clicked      = false;
  this.hasInit      = false;

  this.clickWindowHandler = function() {
    if (!self.clicked) {
      self.opend && self.close();
    }

    self.clicked = false;
  }

  if (dom) {
    this.targetDOM = dom;
  } else {
    throw new URIError('缺少目标dom');
  }

  if ('list' in option) {
    this.setList(option.list);
  } else {
    this.targetDOM.find('li').each(function(index, li) {
      self.optionList[$(li).data('id')] = $(li).html();
    });
  }

  if ('value' in option) {
    this.value = String(option.value);
    if(option.value){
      this.targetDOM.find('.value').html(
        this.optionList[this.value]
      ).removeClass('placeholder');
    }
  }else{
    this.targetDOM.find('.value').addClass('placeholder');
  }

  if (option.disabled) {
    this.targetDOM.addClass('disabled');
  }

  if ('onChange' in option) {
    this.onChange = option.onChange;
  }

  this.targetDOM.click(function(e) {
    if(!self.targetDOM.hasClass('disabled')){
      self.clicked = true;

      !self.opend ? self.open() : self.close();
    }
  });

  $('body').on('click', this.clickWindowHandler);

  this.targetDOM.find('ol').on('click', 'li', function(event) {
    var value = $(this).data('id');
    var text = $(this).text();

    self.close();
    event.stopPropagation();

    if (self.value != value) {
      self.setValue(value);
      self.onChange(value);
    }
    self.setText(text);
  });

  this.hasInit = true;
};

Selector.prototype = {

  getValue: function(){
    return this.value != -1 ? this.value : undefined;
  },

  getText: function(){
    return this.getValue() ? this.targetDOM.find('.value').text() : '';
  },

  setValue: function(id) {
    if (String(id) in this.optionList) {
      this.value = String(id);
      this.targetDOM.find('.value').html(
        this.optionList[this.value] || this.defaultText
      ).removeClass('placeholder');

      return true;
    }

    return false;
  },

  setText: function(t){
    return this.targetDOM.find('.value').text(t);
  },

  setList: function(list) {
    if(Object.prototype.toString.call(list) == '[object Array]'){
      this.optionList = {};
      for(var a=0; a<list.length; a++){
        this.optionList[list[a]] = list[a];
      }
    }else{
      this.optionList = list;
    }
    var keys = Object.keys(this.optionList || {});
    // this.close();
    this.value = -1; //重置
    this.targetDOM.find('.value').text(this.defaultText).addClass('placeholder');
    this.targetDOM.find('ol').html('');
    this.targetDOM.find('.has-next').remove();
    keys.forEach(function(k){
      this.targetDOM.find('ol').append('<li data-id="' + k + '">' + (this.optionList[k] || '-') + '</li>')
    }.bind(this));

    //添加遮罩层（在selector隐藏的时候存在问题）
    // var ol_height = this.targetDOM.find('ol').height();
    // var value_height = this.targetDOM.find('.value').height();
    // var h = ol_height + value_height;
    //15px 为遮罩层div的高度

    // this.targetDOM.append('<div class="has-next" style="top:' + h + 'px;"></div>');
    
    return true;
  },

  open: function() {
    this.opend = true;
    this.clicked = true;
    try{
      this.targetDOM.find('ol').transition('fade down');
      this.targetDOM.addClass('open');
    }catch(e){
      this.targetDOM.addClass('open');
    }
  },

  close: function() {
    this.opend = false;
    try{
      //防止初始化问题
      if(this.hasInit){
        this.targetDOM.find('ol').transition('fade down');
        this.targetDOM.removeClass('open');
      }
    }catch(e){
      this.targetDOM.removeClass('open');
    }
  },

  reset: function() {
    this.value = -1;
    this.targetDOM.find('.value').addClass('placeholder');
  },

  destroy: function() {
    //具体数据清空，按各自情况对待
    this.targetDOM.unbind('click');
    $('body').off('click', this.clickWindowHandler);
    this.targetDOM.find('ol').off('click');
    self.setText(self.defaultText).find('.value').addClass('placeholder');
  }
};

module.exports = Selector;