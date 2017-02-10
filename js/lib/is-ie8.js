function isIE8(){
  var DEFAULT_VERSION = "8.0";
  var ua = navigator.userAgent.toLowerCase();
  var isIE = ua.indexOf("msie")>-1;
  var safariVersion;
  if(isIE){
    safariVersion =  ua.match(/msie ([\d.]+)/)[1];
    if(safariVersion <= DEFAULT_VERSION ){
      return true;
    }
  }
  return false;
};

module.exports = isIE8();