// ui-kit.js
(function(window) {
    'use strict';

    // 辅助工具
    const Utils = {
        createElement(tag, className, html = '') {
            const el = document.createElement(tag);
            if (className) el.className = className;
            el.innerHTML = html;
            return el;
        },
        removeElement(el) {
            if (el && el.parentNode) el.parentNode.removeChild(el);
        },
        // 计算绝对位置，防止溢出屏幕
        computePosition(target, tooltip, placement = 'top') {
            const rect = target.getBoundingClientRect();
            // 简单实现 top-center, 实际项目中可增加更多方向逻辑
            let top = rect.top + window.scrollY - tooltip.offsetHeight - 8;
            let left = rect.left + window.scrollX + (rect.width / 2);
            
            tooltip.style.top = `${top}px`;
            tooltip.style.left = `${left}px`;
        }
    };

    class UIKitClass {
        constructor() {
            this.toastContainer = null;
        }

        // ==========================================
        // 对话框核心 (Dialog Core) - 用于 Alert, Confirm, Prompt, Modal
        // ==========================================
        _createDialog(options) {
            return new Promise((resolve) => {
                const { title = '', content = '', type = 'alert', placeholder = '', width } = options;
                
                // 创建 DOM
                const mask = Utils.createElement('div', 'ui-mask ui-box');
                const dialog = Utils.createElement('div', 'ui-dialog');
                if (width) dialog.style.width = width;

                // 头部
                if (title) {
                    const header = Utils.createElement('div', 'ui-dialog__header', `<span>${title}</span>`);
                    const closeBtn = Utils.createElement('button', 'ui-dialog__close', '&times;');
                    closeBtn.onclick = () => close(null);
                    header.appendChild(closeBtn);
                    dialog.appendChild(header);
                }

                // 内容
                const body = Utils.createElement('div', 'ui-dialog__body');
                if (typeof content === 'string') body.innerHTML = content;
                else body.appendChild(content); // 支持 DOM 元素

                // Input (如果是 Prompt)
                let inputEl = null;
                if (type === 'prompt') {
                    inputEl = Utils.createElement('input', 'ui-dialog__input');
                    inputEl.placeholder = placeholder;
                    // 绑定回车事件
                    inputEl.onkeyup = (e) => { if(e.key === 'Enter') confirm(); };
                    body.appendChild(inputEl);
                }
                dialog.appendChild(body);

                // 底部按钮
                const footer = Utils.createElement('div', 'ui-dialog__footer');
                
                // 取消按钮 (Alert 不需要)
                if (type !== 'alert') {
                    const cancelBtn = Utils.createElement('button', 'ui-btn ui-btn--default', '取消');
                    cancelBtn.onclick = () => close(false);
                    footer.appendChild(cancelBtn);
                }

                // 确认按钮
                const confirmBtn = Utils.createElement('button', 'ui-btn ui-btn--primary', '确定');
                confirmBtn.onclick = () => confirm();
                footer.appendChild(confirmBtn);

                dialog.appendChild(footer);
                mask.appendChild(dialog);
                document.body.appendChild(mask);

                // 自动聚焦
                if (inputEl) inputEl.focus();
                else confirmBtn.focus();

                // 关闭逻辑
                function close(result) {
                    mask.classList.add('ui-fade-out'); // 可以加退出动画
                    Utils.removeElement(mask);
                    resolve(result);
                }

                function confirm() {
                    if (type === 'prompt') {
                        resolve(inputEl.value);
                    } else {
                        resolve(true);
                    }
                    Utils.removeElement(mask);
                }
            });
        }

        // --- 公共 API ---

        // 提示框
        alert(content, title = '提示') {
            return this._createDialog({ type: 'alert', content, title });
        }

        // 确认框
        confirm(content, title = '确认') {
            return this._createDialog({ type: 'confirm', content, title });
        }

        // 输入提示框
        prompt(title = '请输入', placeholder = '') {
            return this._createDialog({ type: 'prompt', title, placeholder });
        }

        // 自定义模态框
        modal({ title, content, width }) {
            // content 可以是 HTML 字符串或 DOM 节点
            return this._createDialog({ type: 'modal', title, content, width });
        }


        // ==========================================
        // 通知消息 (Toast)
        // ==========================================
        toast(message, type = 'info', duration = 3000) {
            if (!this.toastContainer) {
                this.toastContainer = Utils.createElement('div', 'ui-toast-container');
                document.body.appendChild(this.toastContainer);
            }

            const toast = Utils.createElement('div', `ui-toast ui-toast--${type}`, message);
            this.toastContainer.appendChild(toast);

            setTimeout(() => {
                toast.style.animation = 'ui-fade-in 0.3s reverse forwards';
                setTimeout(() => Utils.removeElement(toast), 300);
            }, duration);
        }

        notify(title, message) {
            this.toast(`<strong>${title}</strong><br>${message}`, 'info', 5000);
        }


        // ==========================================
        // 加载提示 (Loading)
        // ==========================================
        showLoading(text = '加载中...') {
            if (this.loadingEl) return; // 防止重复

            this.loadingEl = Utils.createElement('div', 'ui-mask ui-box');
            this.loadingEl.style.flexDirection = 'column';
            this.loadingEl.style.zIndex = '9999';
            
            const spinner = Utils.createElement('div', 'ui-loading-spinner');
            const label = Utils.createElement('div', '', text);
            label.style.marginTop = '15px';
            label.style.color = '#fff';

            this.loadingEl.appendChild(spinner);
            this.loadingEl.appendChild(label);
            document.body.appendChild(this.loadingEl);
        }

        hideLoading() {
            if (this.loadingEl) {
                Utils.removeElement(this.loadingEl);
                this.loadingEl = null;
            }
        }

        
        // ==========================================
        // 气泡卡片 (Popover)
        // ==========================================
        popover(target, contentHtml) {
            // 移除现有的 popover
            this.closeAllPopovers();

            const popover = Utils.createElement('div', 'ui-popover ui-box');
            popover.style.padding = '15px';
            popover.innerHTML = contentHtml;
            document.body.appendChild(popover);

            // 简单定位 logic (Bottom Center)
            const rect = target.getBoundingClientRect();
            popover.style.top = `${rect.bottom + window.scrollY + 10}px`;
            popover.style.left = `${rect.left + window.scrollX}px`;

            // 点击外部关闭
            setTimeout(() => {
                const closeHandler = (e) => {
                    if (!popover.contains(e.target) && e.target !== target) {
                        Utils.removeElement(popover);
                        document.removeEventListener('click', closeHandler);
                    }
                };
                document.addEventListener('click', closeHandler);
            }, 0);
        }

        closeAllPopovers() {
            const existing = document.querySelectorAll('.ui-popover');
            existing.forEach(el => Utils.removeElement(el));
        }

        // ==========================================
        // 上下文菜单 (Context Menu)
        // ==========================================
        contextMenu(e, menuItems) {
            e.preventDefault();
            this.closeContextMenu(); // 关闭旧的

            const menu = Utils.createElement('div', 'ui-context-menu ui-box');
            
            menuItems.forEach(item => {
                const el = Utils.createElement('a', 'ui-context-menu__item', item.label);
                el.onclick = () => {
                    item.action();
                    this.closeContextMenu();
                };
                menu.appendChild(el);
            });

            document.body.appendChild(menu);
            
            // 边界检测
            let x = e.clientX;
            let y = e.clientY;
            // (可选优化) 防止菜单溢出屏幕右侧/底部
            const menuWidth = 160; // 估算宽度
            const menuHeight = menuItems.length * 40; // 估算高度
            
            if (x + menuWidth > window.innerWidth) x -= menuWidth;
            if (y + menuHeight > window.innerHeight) y -= menuHeight;

            menu.style.left = `${x}px`;
            menu.style.top = `${y}px`;
            menu.style.display = 'block';

            // 点击任意处关闭
            setTimeout(() => {
                const closeHandler = () => {
                    this.closeContextMenu();
                    document.removeEventListener('click', closeHandler);
                    document.removeEventListener('contextmenu', closeHandler); // 右键别处也关闭
                };
                document.addEventListener('click', closeHandler);
                document.addEventListener('contextmenu', closeHandler); 
            }, 0);
        }

        closeContextMenu() {
            const menu = document.querySelector('.ui-context-menu');
            Utils.removeElement(menu);
        }

        // 在 UIKitClass 内部添加
        drawer({ title, content, placement = 'right', width }) {
            return new Promise((resolve) => {
                // 复用遮罩，但点击遮罩不仅关闭，还触发 resolve
                const mask = Utils.createElement('div', 'ui-mask');
                mask.style.background = 'rgba(0,0,0,0.3)'; // 抽屉通常遮罩淡一点
                mask.style.opacity = '0';
                mask.style.transition = 'opacity 0.3s';

                const drawer = Utils.createElement('div', `ui-drawer ui-drawer--${placement}`);
                if (width) drawer.style.width = width;

                const headerHtml = `<div class="ui-drawer__header">
                    <span>${title || ''}</span>
                    <button class="ui-drawer__close">&times;</button>
                </div>`;
                drawer.innerHTML = headerHtml;

                const body = Utils.createElement('div', 'ui-drawer__body');
                if (typeof content === 'string') body.innerHTML = content;
                else body.appendChild(content);
                drawer.appendChild(body);

                mask.appendChild(drawer);
                document.body.appendChild(mask);

                // 触发动画 (需要 nextTick)
                setTimeout(() => {
                    mask.style.opacity = '1';
                    drawer.classList.add('ui-drawer--visible');
                }, 10);

                const close = () => {
                    mask.style.opacity = '0';
                    drawer.classList.remove('ui-drawer--visible');
                    setTimeout(() => {
                        Utils.removeElement(mask);
                        resolve(); // 抽屉关闭后的回调
                    }, 300);
                };

                // 绑定事件
                mask.addEventListener('click', (e) => {
                    if (e.target === mask) close();
                });
                drawer.querySelector('.ui-drawer__close').onclick = close;
            });
        }

        previewImage(src) {
            const mask = Utils.createElement('div', 'ui-mask');
            mask.style.background = 'rgba(0,0,0,0.9)'; // 深色背景
            mask.style.cursor = 'zoom-out';
            
            const img = document.createElement('img');
            img.src = src;
            img.style.maxHeight = '90%';
            img.style.maxWidth = '90%';
            img.style.borderRadius = '4px';
            img.style.boxShadow = '0 0 20px rgba(0,0,0,0.5)';
            img.style.transform = 'scale(0.8)';
            img.style.opacity = '0';
            img.style.transition = 'all 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28)';

            mask.appendChild(img);
            document.body.appendChild(mask);

            // 动画入场
            setTimeout(() => {
                img.style.transform = 'scale(1)';
                img.style.opacity = '1';
            }, 10);

            mask.onclick = () => {
                img.style.transform = 'scale(0.8)';
                img.style.opacity = '0';
                setTimeout(() => Utils.removeElement(mask), 300);
            };
        }


        // 初始化下拉框
        // container: DOM容器
        // options: [{ label: 'Option 1', value: '1' }]
        // defaultValue: 初始值
        // onChange: 回调函数
        renderSelect(container, { data = [], placeholder = '请选择', name = '', defaultValue = null, onChange }) {
            // 1. 清空容器
            container.innerHTML = '';
            container.classList.add('ui-select');

            // 2. 创建内部状态
            let selectedValue = defaultValue;
            const selectedLabel = () => {
                const item = data.find(i => i.value === selectedValue);
                return item ? item.label : placeholder;
            };

            // 3. 创建 DOM 结构
            // 隐藏 Input 用于 form 提交
            const hiddenInput = Utils.createElement('input');
            hiddenInput.type = 'hidden';
            hiddenInput.name = name;
            hiddenInput.value = selectedValue || '';

            // 触发器
            const trigger = Utils.createElement('div', 'ui-select__trigger', `<span>${selectedLabel()}</span>`);
            
            // 下拉列表
            const dropdown = Utils.createElement('div', 'ui-select__options');
            
            // 渲染列表项方法
            const renderItems = () => {
                dropdown.innerHTML = '';
                data.forEach(item => {
                    const cls = `ui-select__item ${item.value === selectedValue ? 'selected' : ''}`;
                    const el = Utils.createElement('div', cls, item.label);
                    el.onclick = (e) => {
                        e.stopPropagation(); // 防止冒泡导致立即关闭（虽然逻辑上也可以）
                        selectItem(item);
                    };
                    dropdown.appendChild(el);
                });
            };

            // 选中逻辑
            const selectItem = (item) => {
                selectedValue = item.value;
                hiddenInput.value = item.value;
                trigger.querySelector('span').innerText = item.label;
                container.classList.remove('active');
                renderItems(); //由于重绘了selected状态
                if (onChange) onChange(item.value, item);
            };

            renderItems();

            // 4. 组装
            container.appendChild(hiddenInput);
            container.appendChild(trigger);
            container.appendChild(dropdown);

            // 5. 事件绑定
            trigger.onclick = (e) => {
                e.stopPropagation();
                // 关闭其他打开的 select
                document.querySelectorAll('.ui-select.active').forEach(el => {
                    if (el !== container) el.classList.remove('active');
                });
                container.classList.toggle('active');
            };

            // 点击外部关闭
            const closeHandler = (e) => {
                if (!container.contains(e.target)) {
                    container.classList.remove('active');
                }
            };
            // 绑定到 document 上，注意防止内存泄漏（如果是 SPA 需要销毁机制）
            document.addEventListener('click', closeHandler);
            
            // 返回实例以便后续可能的销毁
            return {
                destroy: () => document.removeEventListener('click', closeHandler),
                getValue: () => selectedValue
            };
        }

        // 渲染分页
        // container: DOM元素
        // params: { current, total, pageSize }
        // onChange: (page) => {}
        renderPagination(container, { current = 1, total = 0, pageSize = 10 }, onChange) {
            const totalPages = Math.ceil(total / pageSize);
            container.innerHTML = '';
            container.className = 'ui-pagination';

            // 如果只有1页或没有数据，不显示或只显示1（视需求而定）
            if (totalPages <= 1) return;

            // 辅助函数：创建按钮
            const createBtn = (text, page, isActive = false, isDisabled = false, isDots = false) => {
                const el = Utils.createElement('li', 
                    `ui-page-item ${isActive ? 'active' : ''} ${isDisabled ? 'disabled' : ''} ${isDots ? 'ui-page-dots' : ''}`, 
                    text
                );
                if (!isDisabled && !isActive && !isDots) {
                    el.onclick = () => {
                        // 重新渲染自身（也可以由外部控制）
                        this.renderPagination(container, { current: page, total, pageSize }, onChange);
                        if (onChange) onChange(page);
                    };
                }
                return el;
            };

            // 1. 上一页
            container.appendChild(createBtn('<', current - 1, false, current === 1));

            // 2. 页码逻辑
            const maxVisible = 7; // 最多显示多少个按钮（包括省略号）
            
            if (totalPages <= maxVisible) {
                // 页码少，全部显示
                for (let i = 1; i <= totalPages; i++) {
                    container.appendChild(createBtn(i, i, current === i));
                }
            } else {
                // 页码多，需要省略号
                // 始终显示第一页
                container.appendChild(createBtn(1, 1, current === 1));

                // 处理前面的省略号
                if (current > 4) {
                    container.appendChild(createBtn('...', null, false, false, true));
                }

                // 中间区域 (显示当前页附近的页码)
                let start = Math.max(2, current - 1);
                let end = Math.min(totalPages - 1, current + 1);

                // 调整 start/end 保证中间始终有 3 个数字 (除非靠近边界)
                if (current < 4) { end = 4; }
                if (current > totalPages - 3) { start = totalPages - 3; }

                for (let i = start; i <= end; i++) {
                    container.appendChild(createBtn(i, i, current === i));
                }

                // 处理后面的省略号
                if (current < totalPages - 3) {
                    container.appendChild(createBtn('...', null, false, false, true));
                }

                // 始终显示最后一页
                container.appendChild(createBtn(totalPages, totalPages, current === totalPages));
            }

            // 3. 下一页
            container.appendChild(createBtn('>', current + 1, false, current === totalPages));
        }

        // 渲染面包屑
        // items: [{ label: '首页', href: '/' }, { label: '用户管理' }]
        renderBreadcrumb(container, items = []) {
            container.className = 'ui-breadcrumb';
            container.innerHTML = '';

            items.forEach(item => {
                const wrap = Utils.createElement('div', 'ui-breadcrumb__item');
                
                const link = Utils.createElement('a', 'ui-breadcrumb__link', item.label);
                if (item.href) link.href = item.href;
                
                const sep = Utils.createElement('span', 'ui-breadcrumb__separator', '/');

                wrap.appendChild(link);
                wrap.appendChild(sep);
                container.appendChild(wrap);
            });
        }


        // actions: [{ text: '拍照', color: 'blue', onClick: fn }, { text: '删除', type: 'danger' }]
        actionSheet(actions = []) {
            return new Promise((resolve) => {
                // 1. 创建遮罩 (复用之前的逻辑)
                const mask = Utils.createElement('div', 'ui-mask');
                mask.style.opacity = '0';
                mask.style.transition = 'opacity 0.3s';
                
                // 2. 创建面板
                const sheet = Utils.createElement('div', 'ui-action-sheet');
                
                // 渲染选项
                actions.forEach((item, index) => {
                    const className = `ui-action-sheet__item ${item.type === 'danger' ? 'ui-action-sheet__item--danger' : ''}`;
                    const btn = Utils.createElement('div', className, item.text);
                    btn.onclick = () => {
                        close();
                        if (item.onClick) item.onClick();
                        resolve(index);
                    };
                    sheet.appendChild(btn);
                });

                // 取消按钮
                const cancelBtn = Utils.createElement('div', 'ui-action-sheet__item ui-action-sheet__cancel', '取消');
                cancelBtn.onclick = () => { close(); resolve(-1); };
                sheet.appendChild(cancelBtn);

                document.body.appendChild(mask);
                document.body.appendChild(sheet);

                // 动画
                setTimeout(() => {
                    mask.style.opacity = '1';
                    sheet.classList.add('visible');
                }, 10);

                const close = () => {
                    mask.style.opacity = '0';
                    sheet.classList.remove('visible');
                    setTimeout(() => {
                        Utils.removeElement(mask);
                        Utils.removeElement(sheet);
                    }, 300);
                };
                
                mask.onclick = close;
            });
        }



        /**
         * 渲染响应式导航
         * @param {Array} items - [{ label: '首页', icon: '🏠', id: 'home', onClick: fn }]
         * @param {String} activeId - 当前选中的 id
         */
        renderResponsiveNav(items, activeId) {
            // 1. 清理旧的导航 (如果存在)
            const oldSide = document.querySelector('.ui-sidebar-nav');
            const oldBottom = document.querySelector('.ui-bottom-nav');
            Utils.removeElement(oldSide);
            Utils.removeElement(oldBottom);

            // 给 Body 添加布局类，处理 padding
            document.body.classList.add('ui-app-layout');

            // ============================
            // A. 创建侧边栏 (Sidebar) - 用于中大屏
            // ============================
            const sidebar = Utils.createElement('div', 'ui-sidebar-nav');
            
            // 可选：添加 Logo 区域
            const logo = Utils.createElement('div', '', '<h2 style="margin:0;padding:20px;text-align:center;color:#007bff">LOGO</h2>');
            // 在 Tablet 模式下可能需要隐藏 Logo 文字，这里简单处理，或者利用 CSS 控制
            sidebar.appendChild(logo);

            items.forEach(item => {
                const el = Utils.createElement('div', `ui-sidebar-item ${item.id === activeId ? 'active' : ''}`);
                el.innerHTML = `<span class="ui-nav-icon">${item.icon}</span><span class="ui-nav-text">${item.label}</span>`;
                el.onclick = () => {
                    this._handleNavClick(items, item.id);
                    if (item.onClick) item.onClick();
                };
                sidebar.appendChild(el);
            });
            document.body.appendChild(sidebar);

            // ============================
            // B. 创建底部栏 (Tabbar) - 用于小屏
            // ============================
            const bottomBar = Utils.createElement('div', 'ui-bottom-nav');
            
            // 逻辑：如果超过5个，显示前4个 + "更多"
            let displayItems = items;
            let moreItems = [];
            const maxTabs = 5;

            if (items.length > maxTabs) {
                displayItems = items.slice(0, 4);
                moreItems = items.slice(4);
            }

            // 渲染前 4 个
            displayItems.forEach(item => {
                const el = Utils.createElement('div', `ui-bottom-item ${item.id === activeId ? 'active' : ''}`);
                el.innerHTML = `<span class="ui-nav-icon">${item.icon}</span><span style="font-size:10px">${item.label}</span>`;
                el.onclick = () => {
                    this._handleNavClick(items, item.id);
                    if (item.onClick) item.onClick();
                };
                bottomBar.appendChild(el);
            });

            // 渲染 "更多" 按钮
            if (moreItems.length > 0) {
                const isMoreActive = moreItems.some(i => i.id === activeId);
                const moreBtn = Utils.createElement('div', `ui-bottom-item ${isMoreActive ? 'active' : ''}`);
                moreBtn.innerHTML = `<span class="ui-nav-icon">⋯</span><span style="font-size:10px">更多</span>`;
                
                moreBtn.onclick = () => {
                    // 弹出 Action Sheet
                    const sheetItems = moreItems.map(item => ({
                        text: `<span style="margin-right:10px">${item.icon}</span>${item.label}`,
                        // 高亮逻辑可根据需求定制
                        onClick: () => {
                            this._handleNavClick(items, item.id);
                            if (item.onClick) item.onClick();
                        }
                    }));

                    this.actionSheet(sheetItems);
                };
                bottomBar.appendChild(moreBtn);
            }

            document.body.appendChild(bottomBar);
        }

        // 内部方法：处理点击高亮更新
        _handleNavClick(items, activeId) {
            // 重新渲染以更新高亮状态 (简单粗暴但有效)
            // 实际项目中可能只需要 toggle class，但考虑到 "更多" 里面的状态，重绘最安全
            this.renderResponsiveNav(items, activeId);
        }




        // --- 文件上传 (File Upload) ---
        initUploads(selector = '.ui-upload', onUpload) {
            const uploads = document.querySelectorAll(selector);
            uploads.forEach(upload => {
                const input = upload.querySelector('input[type="file"]');
                const text = upload.querySelector('.ui-upload__text');
                
                // 点击触发
                upload.onclick = () => input.click();
                
                // Input Change
                input.onchange = (e) => handleFiles(e.target.files);

                // Drag & Drop
                upload.ondragover = (e) => { e.preventDefault(); upload.classList.add('drag-over'); };
                upload.ondragleave = (e) => { e.preventDefault(); upload.classList.remove('drag-over'); };
                upload.ondrop = (e) => {
                    e.preventDefault();
                    upload.classList.remove('drag-over');
                    handleFiles(e.dataTransfer.files);
                };

                function handleFiles(files) {
                    if (files.length > 0) {
                        // 简单的文件名显示逻辑，实际需配合回调
                        text.innerText = `已选择: ${files[0].name} (${(files[0].size/1024).toFixed(1)}KB)`;
                        if (onUpload) onUpload(files);
                    }
                }
            });
        }

        // --- 复制到剪贴板工具 ---
        copyToClipboard(text) {
            if (navigator.clipboard) {
                navigator.clipboard.writeText(text).then(() => {
                    this.toast('复制成功', 'success');
                });
            } else {
                // Fallback
                const textarea = document.createElement('textarea');
                textarea.value = text;
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
                this.toast('复制成功', 'success');
            }
        }
    }

    // 导出实例
    window.UIKit = new UIKitClass();

})(window);