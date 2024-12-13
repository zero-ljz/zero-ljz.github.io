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

showMessageBox = (message, title = "提示") => {
    var box = document.getElementById("message-box");
    if (!box) {
        box = document.createElement("div");
        box.id = "message-box";
    }
    box.style.cssText = `
      all: revert; 
      position: fixed;
      top: 20%;
      left: 50%;
      transform: translate(-50%, -20%);
      padding: 0px 0px 0;

    background-color: rgba(255, 255, 255, 0.6);
  color: #333;
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
        border: 1px solid #b7b8b9;
      box-shadow: 5px 5px 15px rgba(0, 0, 0, 0.5);

      border-radius: 0.5rem;
      z-index: 9999;
      min-width: 33%;
    `;
    box.innerHTML = `
      <div style="all: revert; display: flex; flex-direction: row; justify-content: space-between; padding: 5px;">
        <b style="all: revert;">${title}</b><button onclick="document.body.removeChild(this.parentNode.parentNode);" style="all: revert; cursor: pointer;">╳</button>
      </div>
      <div style="all: revert; max-width: 80vw; max-height: 80vh; overflow-y: auto; white-space: pre-wrap; padding: 5px; margin: 5px" contenteditable="true">${message.replace(/\n/g, "\r\n")}</div>
    `;
    document.body.appendChild(box);
    return box;
  };



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