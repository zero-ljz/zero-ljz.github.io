// 同步请求
let http_get = function (url) { let r = new XMLHttpRequest(); r.open('GET', url, false); r.send(); return r; }; 