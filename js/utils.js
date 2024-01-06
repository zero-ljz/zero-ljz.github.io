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
    var messageBox = document.getElementById("message-box");
    if (!messageBox) {
        messageBox = document.createElement("div");
        messageBox.id = "message-box";
    }
    messageBox.innerHTML = "";
    messageBox.classList.add("acrylic-box");
    messageBox.classList.add("rounded-6");
    messageBox.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);

    padding: 20px;
    min-width: 200px;
    min-height: 100px;
    max-width: 80vw;
    max-height: 80vh;
    overflow: auto;
    z-index: 9999;
    `;
    messageBox.insertAdjacentHTML('beforeend', `
    <b style="margin-right: 30px; /* 防止和关闭按钮重叠 */">${title}</b>
    <p style="padding: 5px; max-width:100%; white-space: pre-wrap; overflow-wrap: break-word;" contenteditable="true">${message.replace(/\n/g, "\r\n")}</p>
    `);
    messageBox.insertAdjacentHTML('beforeend', `
    <button onclick="document.body.removeChild(this.parentNode);" style="cursor: pointer; position: absolute; margin-left: 10px; top: 10px; right: 10px;">╳</button>
    `);
    document.body.appendChild(messageBox);

    return messageBox;
}

function createTable(rows, cols=[]) {
    let table = document.createElement('table');
    table.setAttribute('class', 'table table-striped');
    table.setAttribute('style', 'min-width: 919px;');

    let thead = document.createElement('thead');
    let tr = document.createElement('tr');
    if (cols.length > 0) {
        // 遍历cols数组来创建表头
        for (let i = 0; i < cols.length; i++) {
            let th = document.createElement('th');
            th.textContent = cols[i];
            tr.appendChild(th);
        }
    } else {
        // 遍历第一行的对象的key来创建表头
        for (let key in rows[0]) {
            let th = document.createElement('th');
            th.textContent = key;
            tr.appendChild(th);
        }
    }

    thead.appendChild(tr);
    table.appendChild(thead);

    let tbody = document.createElement('tbody');
    // 遍历对象数组的每一项来创建表格行
    for (let i = 0; i < rows.length; i++) {
        tr = document.createElement('tr');
        for (let key in rows[i]) {
            let td = document.createElement('td');
            td.textContent = rows[i][key];
            tr.appendChild(td);
        }
        tbody.appendChild(tr);
    }

    table.appendChild(tbody);
    return table;
}

// let table_element = createTable([{"id": 1, "name": "hello"}, {"id": 2, "name": "world"}])
// document.body.appendChild(table_element)