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

function formatSeconds(seconds) {
    let formattedTime = '';

    if (seconds >= 86400) {
        const days = Math.floor(seconds / 86400);
        formattedTime += `${days}天 `;
        seconds %= 86400;
    }

    if (seconds >= 3600) {
        const hours = Math.floor(seconds / 3600);
        formattedTime += `${hours}小时 `;
        seconds %= 3600;
    }

    if (seconds >= 60) {
        const minutes = Math.floor(seconds / 60);
        formattedTime += `${minutes}分钟 `;
        seconds %= 60;
    }

    if (seconds > 0) {
        formattedTime += `${seconds}秒`;
    }

    return formattedTime.trim(); // 去除末尾空格
}

function showMessageBox(message, title = '提示') {
    var messageBox = document.createElement("div");
    messageBox.classList.add("acrylic-box");
    messageBox.style.cssText = `
    position: fixed;
    top: 20%;
    left: 50%;
    transform: translate(-50%, -50%);

    /*background: #fff;*/
    padding: 20px;
    /*border: 1px solid #ccc;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);*/

    min-width: 200px;
    min-height: 100px;
    z-index: 9999;
    `;
    messageBox.insertAdjacentHTML('beforeend', `
    <b>${title}</b>
    <p style="whiteSpace: pre-line;" contenteditable="true">${message.replace(/\n/g, "\r\n")}</p>
    `);
    messageBox.insertAdjacentHTML('beforeend', `
    <button onclick="document.body.removeChild(this.parentNode);">Close</button>
    `);
    document.body.appendChild(messageBox);

    return messageBox;
}