// 同步请求
let http_get = function (url) { let r = new XMLHttpRequest(); r.open('GET', url, false); r.send(); return r; }; 

function formatDate(date) {
    var parts = new Intl.DateTimeFormat('zh-Hans', {
        year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', 
        hour12: false, timeZone: 'Asia/Shanghai'
    }).formatToParts(date);
    return `${parts[0].value}-${parts[2].value}-${parts[4].value} ${parts[6].value}:${parts[8].value}:${parts[10].value}`;
}

function formatDate2(date) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // 月份从0开始，需要加1
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}