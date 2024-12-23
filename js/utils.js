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

showInputBox = (message) => {
    return new Promise((resolve) => {
        let inputBox = document.createElement("div");
        inputBox.id = "input-box";
        inputBox.style.cssText = `all:revert;position:fixed;top:20%;left:50%;transform:translate(-50%,-20%);padding:10px;background-color:rgba(255,255,255,0.9);color:#333;border:1px solid #b7b8b9;box-shadow:5px 5px 15px rgba(0,0,0,0.5);border-radius:0.5rem;z-index:9999;min-width:300px;`;
        inputBox.innerHTML = `
            <div style="all: revert; display: flex; flex-direction: column;">
                <label style="margin-bottom: 10px; font-weight: bold;" for="user-input">${message}</label>
                <textarea id="user-input" type="text" style="padding:5px; margin-bottom: 10px; border: 1px solid #ccc; border-radius: 4px;"></textarea>
                <div style="text-align: right;">
                    <button id="cancel-btn" style="margin-right: 5px; padding:5px 10px; cursor: pointer;">取消</button>
                    <button id="ok-btn" style="padding:5px 10px; cursor: pointer;">确定</button>
                </div>
            </div>`;
        document.body.appendChild(inputBox);

        const inputField = document.getElementById("user-input");
        inputField.focus();

        document.getElementById("ok-btn").onclick = () => {
            let userInput = inputField.value;
            document.body.removeChild(inputBox);
            resolve(userInput);
        };
        document.getElementById("cancel-btn").onclick = () => {
            document.body.removeChild(inputBox);
            resolve(null);
        };
    });
}


createDialog = (title = '提示', content = null) => {
    return new Promise((resolve, reject) => {
        // 创建对话框容器
        const dialog = document.createElement('div');
        dialog.style.cssText = `
            position: fixed;
            top: 50%; left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            border-radius: 8px;
            width: 300px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
            overflow: hidden;
            font-family: Arial, sans-serif;
            z-index: 1000;
        `;

        // 标题
        const dialogTitle = document.createElement('div');
        dialogTitle.style.cssText = `
            background: #f5f5f5;
            padding: 10px 15px;
            font-size: 16px;
            font-weight: bold;
            border-bottom: 1px solid #ddd;
        `;
        dialogTitle.textContent = title;
	
        // 内容区域
        const dialogContent = document.createElement('div');
        dialogContent.style.cssText = `
            padding: 20px;
            font-size: 14px;
            color: #333;
        `;

        if (content instanceof HTMLElement) {
            dialogContent.appendChild(content); // 如果是 HTML 元素，直接添加
        } else {
            dialogContent.textContent = content; // 如果是字符串，设置文本内容
        }

        // 按钮区域
        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `
            display: flex;
            justify-content: flex-end;
            padding: 10px 15px;
            border-top: 1px solid #ddd;
            gap: 10px;
        `;

        // 取消按钮
        const cancelButton = document.createElement('button');
        cancelButton.textContent = '取消';
        cancelButton.style.cssText = `
            background: #f5f5f5;
            border: none;
            padding: 5px 10px;
            cursor: pointer;
            border-radius: 4px;
        `;
        cancelButton.onclick = () => {
            document.body.removeChild(dialog);
            reject('cancel');
        };

        // 确认按钮
        const confirmButton = document.createElement('button');
        confirmButton.textContent = '确认';
        confirmButton.style.cssText = `
            background: #007bff;
            color: white;
            border: none;
            padding: 5px 10px;
            cursor: pointer;
            border-radius: 4px;
        `;
        confirmButton.onclick = () => {
            // 获取表单内的输入值
            const formElements = dialogContent.querySelectorAll('input, textarea, select');
            const formData = {};
            formElements.forEach((element) => {
                formData[element.name] = element.value;
            });

            document.body.removeChild(dialog);
            resolve(formData); // 返回表单数据
        };

        // 组装按钮区域
        buttonContainer.appendChild(cancelButton);
        buttonContainer.appendChild(confirmButton);

        // 组装对话框
        dialog.appendChild(dialogTitle);
        dialog.appendChild(dialogContent);
        dialog.appendChild(buttonContainer);

        // 显示对话框
        document.body.appendChild(dialog);
    });
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