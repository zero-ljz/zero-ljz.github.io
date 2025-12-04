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

        // 新增：防抖函数 (用于搜索)
        debounce(func, wait) {
            let timeout;
            return function(...args) {
                clearTimeout(timeout);
                timeout = setTimeout(() => func.apply(this, args), wait);
            };
        },

        /**
         * 智能定位 (核心复用逻辑)
         * @param {HTMLElement} trigger - 触发元素 (按钮/输入框)
         * @param {HTMLElement} popup - 弹出的悬浮层
         * @param {Object} options - 配置 { offset: 间距, placement: 默认位置 }
         */
        smartPosition(trigger, popup, options = {}) {
            const { offset = 8, placement = 'bottom-start' } = options;
            
            // 1. 获取尺寸信息
            const tr = trigger.getBoundingClientRect(); // 触发器位置
            const pr = popup.getBoundingClientRect();   // 弹窗尺寸 (注意：弹窗必须已挂载到DOM且非display:none)
            const winW = window.innerWidth;
            const winH = window.innerHeight;
            const scrollX = window.scrollX;
            const scrollY = window.scrollY;

            // 2. 初始计算 (默认 Bottom-Start: 下方，左对齐)
            let top = tr.bottom + scrollY + offset;
            let left = tr.left + scrollX;

            // 3. 【Y轴检测】底部不够放吗？
            // 如果 (触发器底部 + 弹窗高度 + 间距) > 视口高度
            if (tr.bottom + pr.height + offset > winH) {
                // 尝试翻转到上方 (Top-Start)
                // 新 top = 触发器顶部 - 弹窗高度 - 间距
                const topSpace = tr.top - pr.height - offset;
                // 只有当上方空间足够，或者上方空间比下方大时，才翻转
                if (topSpace > 0 || tr.top > (winH - tr.bottom)) {
                    top = tr.top + scrollY - pr.height - offset;
                    // 可选：添加一个类名以便改变箭头方向
                    popup.classList.add('placement-top'); 
                }
            }

            // 4. 【X轴检测】右侧溢出吗？
            // 如果 (当前左坐标 + 弹窗宽度) > 屏幕宽度
            if (left + pr.width > winW) {
                // 尝试右对齐 (Bottom-End)
                // left = 触发器右边界 - 弹窗宽度
                left = (tr.right + scrollX) - pr.width;
            }

            // 5. 【X轴二次检测】左侧溢出吗？(防强行右对齐后左边不够)
            if (left < 10) {
                left = 10; // 强制靠左安全距离
            }
            // 如果还宽出屏幕，限制最大宽度 (可选，配合 CSS max-width)
            if (left + pr.width > winW) {
                // 这里通常通过 CSS max-width: 95vw 处理，JS 只负责定位起点
            }

            // 6. 应用样式
            popup.style.top = `${top}px`;
            popup.style.left = `${left}px`;
            
            // 返回计算结果以便后续可能的调整
            return { top, left };
        }
    };


    /**
     * ==========================================
     * 组件：UISelect
     * 功能：单选、多选、搜索过滤、Tag展示
     * ==========================================
     */
    class UISelect {
        constructor(container, options = {}) {
            this.container = typeof container === 'string' ? document.querySelector(container) : container;
            if (!this.container) throw new Error('UISelect: Container not found');

            // 配置
            this.config = {
                data: options.data || [], // [{ label: 'A', value: '1' }]
                placeholder: options.placeholder || '请选择',
                multiple: options.multiple || false,
                searchable: options.searchable || false,
                onChange: options.onChange || null
            };

            this.state = {
                selected: [], // 存储 value
                isOpen: false,
                filterText: ''
            };

            this._init();
        }

        _init() {
            this.container.classList.add('ui-select');
            
            // 1. 构建 DOM 结构
            this.trigger = Utils.createElement('div', 'ui-select__trigger');
            this.trigger.tabIndex = 0; // 可聚焦
            
            // 输入框 (用于搜索或作为隐藏焦点锚点)
            this.input = Utils.createElement('input', 'ui-select__input');
            this.input.placeholder = this.config.placeholder;
            if (!this.config.searchable) this.input.readOnly = true;
            
            this.trigger.appendChild(this.input);
            
            // 下拉列表
            this.dropdown = Utils.createElement('div', 'ui-select__dropdown ui-panel');
            
            this.container.appendChild(this.trigger);
            document.body.appendChild(this.dropdown); 

            // 2. 绑定事件
            this._bindEvents();
            
            // 3. 初始渲染
            this._renderOptions();
        }

        _bindEvents() {
            // 切换下拉
            this.trigger.addEventListener('click', (e) => {
                // 如果点击的是 tag 关闭按钮，不触发展开
                if (e.target.classList.contains('ui-tag__close')) return;
                
                if (this.config.searchable && e.target === this.input) {
                    this._open();
                } else {
                    this._toggle();
                }
                if (this.state.isOpen) this.input.focus();
            });

            // 搜索输入
            if (this.config.searchable) {
                this.input.addEventListener('input', Utils.debounce((e) => {
                    this.state.filterText = e.target.value.trim().toLowerCase();
                    this._renderOptions();
                    this._open();
                }, 200));
            }

            // 点击外部关闭
            document.addEventListener('click', (e) => {
                // 判断点击是否在容器内，或者在下拉菜单内
                const isClickInContainer = this.container.contains(e.target);
                const isClickInDropdown = this.dropdown.contains(e.target);
                
                if (!isClickInContainer && !isClickInDropdown) {
                    this._close();
                }
            });

            // 选项点击
            this.dropdown.addEventListener('click', (e) => {
                const option = e.target.closest('.ui-select__option');
                if (option && !option.classList.contains('is-disabled')) {
                    const value = option.dataset.value;
                    const label = option.dataset.label;
                    this._handleSelect(value, label);
                }
            });

            // 监听窗口大小变化，更新位置
            window.addEventListener('resize', () => {
                if (this.state.isOpen) this._updatePosition();
            });
            
            // 监听滚动 (可选，如果页面滚动需要菜单跟着动，则开启)
            window.addEventListener('scroll', () => {
                if (this.state.isOpen) this._updatePosition();
            }, true);
        }

        // 新增：计算并设置下拉菜单的位置
        _updatePosition() {
            if (!this.state.isOpen) return;

            const rect = this.trigger.getBoundingClientRect();
            // 设置宽度与 Trigger 一致
            this.dropdown.style.width = `${rect.width}px`;
            // 定位
            Utils.smartPosition(this.trigger, this.dropdown, { offset: 6 });
        }

        _handleSelect(value, label) {
            if (this.config.multiple) {
                const index = this.state.selected.indexOf(value);
                if (index > -1) {
                    this.state.selected.splice(index, 1); // 取消选择
                } else {
                    this.state.selected.push(value); // 选择
                }
                this.input.value = ''; // 清空搜索
                this.state.filterText = '';
                // 多选不自动关闭，或者根据需求决定
            } else {
                this.state.selected = [value];
                this._close();
                this.input.value = label; // 单选回填文字
            }
            
            this._renderTags(); // 只有多选需要渲染 Tag，单选其实由 input 显示
            this._renderOptions(); // 刷新选中状态
            
            if (this.config.onChange) {
                this.config.onChange(this.state.selected);
            }
        }

        _renderOptions() {
            this.dropdown.innerHTML = '';
            const { data } = this.config;
            const { filterText, selected } = this.state;

            const filtered = data.filter(item => 
                item.label.toLowerCase().includes(filterText)
            );

            if (filtered.length === 0) {
                this.dropdown.innerHTML = '<div class="ui-select__empty">无匹配数据</div>';
                return;
            }

            filtered.forEach(item => {
                const isSelected = selected.includes(item.value);
                const cls = `ui-select__option ${isSelected ? 'is-selected' : ''}`;
                const el = Utils.createElement('div', cls, item.label);
                el.dataset.value = item.value;
                el.dataset.label = item.label;
                this.dropdown.appendChild(el);
            });
        }

        _renderTags() {
            // 清理旧 Tag (保留 Input)
            const oldTags = this.trigger.querySelectorAll('.ui-tag');
            oldTags.forEach(t => t.remove());

            if (this.config.multiple) {
                this.input.placeholder = this.state.selected.length ? '' : this.config.placeholder;
                
                this.state.selected.forEach(val => {
                    const item = this.config.data.find(d => d.value === val);
                    if (!item) return;
                    
                    const tag = Utils.createElement('span', 'ui-tag', `
                        ${item.label} <span class="ui-tag__close" data-val="${val}">&times;</span>
                    `);
                    
                    // 绑定删除事件
                    tag.querySelector('.ui-tag__close').onclick = (e) => {
                        e.stopPropagation();
                        this._handleSelect(val);
                    };
                    
                    this.trigger.insertBefore(tag, this.input);
                });
            } else {
                 // 单选逻辑已经在 handleSelect 处理 input.value
            }
        }

        _toggle() { this.state.isOpen ? this._close() : this._open(); }
        
        _open() {
            // 打开前先计算位置
            this._updatePosition();

            this.state.isOpen = true;
            this.dropdown.classList.add('is-open');
            this.container.classList.add('active');

            // 必须在显示(add class)后或之前挂载后立即计算
            this._updatePosition();
        }
        
        _close() {
            this.state.isOpen = false;
            this.dropdown.classList.remove('is-open');
            this.container.classList.remove('active');
            // 重置搜索
            if (this.config.searchable && this.config.multiple) {
                this.input.value = '';
                this.state.filterText = '';
                this._renderOptions();
            }
        }

        // Public API: 设置值
        setValue(values) {
            this.state.selected = Array.isArray(values) ? values : [values];
            if (!this.config.multiple && values.length > 0) {
                 const item = this.config.data.find(d => d.value == values[0]);
                 if(item) this.input.value = item.label;
            }
            this._renderTags();
            this._renderOptions();
        }
    }


    class UIKitClass {
        constructor() {
            this.toastContainer = null;
            this.activeMenu = null; // 追踪当前打开的菜单
            
            // 全局点击监听，用于关闭菜单
            document.addEventListener('click', (e) => {
                if (this.activeMenu && !this.activeMenu.contains(e.target)) {
                    this.closeMenu();
                }
            });
            
            // 监听滚动，关闭菜单 (可选，防止浮动错位)
            window.addEventListener('scroll', () => {
               if(this.activeMenu) this.closeMenu();
            }, true);
        }

        // ==========================================
        // 对话框核心 (Dialog Core) - 用于 Alert, Confirm, Prompt, Modal
        // ==========================================
        _createDialog(options) {
            return new Promise((resolve) => {
                const { title = '', content = '', type = 'alert', placeholder = '', width } = options;
                
                // 创建 DOM
                const mask = Utils.createElement('div', 'ui-mask ui-box');
                const dialog = Utils.createElement('div', 'ui-dialog ui-panel');
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

            const toast = Utils.createElement('div', `ui-toast ui-toast--${type} ui-panel`, message);
            this.toastContainer.appendChild(toast);

            setTimeout(() => {
                toast.style.animation = 'ui-fade-in 0.3s reverse forwards';
                setTimeout(() => Utils.removeElement(toast), 300);
            }, duration);
        }

        notify(title, message) {
            this.toast(`<strong>${title}</strong><br>${message}`, 'info', 5000);
        }



        /**
         * ==========================================
         * 工厂方法：创建 Select 组件
         * ==========================================
         */
        createSelect(selector, options) {
            return new UISelect(selector, options);
        }

        /**
         * ==========================================
         * 菜单系统：上下文菜单 (Context Menu)
         * ==========================================
         */
        // attachTarget: 需要右键的 DOM 元素
        // menuItems: [{ label, icon, onClick, danger, separator }]
        contextMenu(attachTarget, menuItems) {
            if (!attachTarget) return;

            attachTarget.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                this.showMenu(e.clientX, e.clientY, menuItems);
            });
        }

        /**
         * ==========================================
         * 菜单系统：下拉操作菜单 (Dropdown Action)
         * ==========================================
         */
        dropdownMenu(triggerBtn, menuItems) {
            if (!triggerBtn) return;
            
            triggerBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const rect = triggerBtn.getBoundingClientRect();
                // 默认显示在按钮左下角
                this.showMenu(rect.left, rect.bottom + 5, menuItems);
            });
        }

        /**
         * 核心：显示菜单
         */
        showMenu(x, y, items) {
            this.closeMenu(); // 先关闭已存在的

            const menu = Utils.createElement('div', 'ui-menu ui-panel');
            
            items.forEach(item => {
                if (item.separator) {
                    menu.appendChild(Utils.createElement('div', 'ui-menu__divider'));
                    return;
                }

                const li = Utils.createElement('div', `ui-menu__item ${item.danger ? 'is-danger' : ''}`);
                
                let iconHtml = `<span class="ui-menu__icon">${item.icon || ''}</span>`;
                li.innerHTML = `${iconHtml}<span>${item.label}</span>`;
                
                li.onclick = (e) => {
                    e.stopPropagation();
                    if (item.onClick) item.onClick();
                    this.closeMenu();
                };
                menu.appendChild(li);
            });

            document.body.appendChild(menu);
            this.activeMenu = menu;

            // 简单的防溢出计算
            const winWidth = window.innerWidth;
            const winHeight = window.innerHeight;
            
            // 先渲染才能获取宽高
            menu.classList.add('is-visible');
            const rect = menu.getBoundingClientRect();
            
            let finalX = x;
            let finalY = y;

            if (x + rect.width > winWidth) finalX = winWidth - rect.width - 10;
            if (y + rect.height > winHeight) finalY = y - rect.height; // 向上翻转

            menu.style.left = `${finalX}px`;
            menu.style.top = `${finalY}px`;
        }

        closeMenu() {
            if (this.activeMenu) {
                Utils.removeElement(this.activeMenu);
                this.activeMenu = null;
            }
        }


        /**
         * ==========================================
         * 组件：菜单栏 (Menu Bar)
         * 特性：支持点击展开，展开后支持鼠标滑过自动切换
         * ==========================================
         */
        createMenubar(container, menuData) {
            const el = typeof container === 'string' ? document.querySelector(container) : container;
            if (!el) return;

            el.classList.add('ui-menubar');
            el.innerHTML = ''; // 清空容器

            // 状态标记：当前菜单栏是否处于“激活”状态（即有一个菜单已打开）
            let activeItem = null; 

            // 辅助：清除所有项的高亮
            const clearActive = () => {
                const items = el.querySelectorAll('.ui-menubar__item');
                items.forEach(i => i.classList.remove('is-active'));
                activeItem = null;
            };

            // 辅助：打开指定项的菜单
            const openItemMenu = (domItem, subItems) => {
                // 1. UI 处理
                clearActive();
                domItem.classList.add('is-active');
                activeItem = domItem;

                // 2. 计算位置 (按钮左下角)
                const rect = domItem.getBoundingClientRect();
                
                // 3. 调用核心 showMenu，但需要劫持它的关闭逻辑
                // 因为 showMenu 默认点击外部会关闭，我们需要监听那个关闭动作来同步清除高亮
                this.showMenu(rect.left, rect.bottom, subItems);
            };

            // 构建 DOM
            menuData.forEach(group => {
                const itemEl = Utils.createElement('div', 'ui-menubar__item', group.label);

                // 事件 1: 点击
                itemEl.addEventListener('click', (e) => {
                    e.stopPropagation();
                    // 如果当前点的就是这个，且已经打开，则关闭
                    if (activeItem === itemEl) {
                        this.closeMenu();
                        clearActive();
                    } else {
                        openItemMenu(itemEl, group.children);
                    }
                });

                // 事件 2: 鼠标滑过 (仅在已激活状态下触发)
                itemEl.addEventListener('mouseenter', () => {
                    if (activeItem && activeItem !== itemEl) {
                        // 切换菜单
                        openItemMenu(itemEl, group.children);
                    }
                });

                el.appendChild(itemEl);
            });

            // 监听全局点击来重置状态
            // 注意：我们在 constructor 里已经有一个 document click 监听器了
            // 为了解耦，这里单独监听一下菜单关闭的时机可能比较复杂
            // 最简单的方法是：利用现有的 document click，检测是否点击了外部
            const globalClickHandler = (e) => {
                if (!el.contains(e.target)) {
                    clearActive();
                }
            };
            document.addEventListener('click', globalClickHandler);
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
            this.closeAllPopovers();

            const popover = Utils.createElement('div', 'ui-popover ui-box ui-panel');
            popover.innerHTML = contentHtml;
            document.body.appendChild(popover); // 必须先挂载，smartPosition 才能算出宽度

            // === 一行代码搞定定位 ===
            Utils.smartPosition(target, popover, { offset: 12 });

            // 点击外部关闭逻辑 (保持不变)
            setTimeout(() => {
                const closeHandler = (e) => {
                    if (!popover.contains(e.target) && !target.contains(e.target)) {
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
        // 抽屉 (Drawer)
        // ==========================================
        drawer({ title, content, placement = 'right', width }) {
            return new Promise((resolve) => {
                // 复用遮罩，但点击遮罩不仅关闭，还触发 resolve
                const mask = Utils.createElement('div', 'ui-mask');
                mask.style.background = 'rgba(0,0,0,0.3)'; // 抽屉通常遮罩淡一点
                mask.style.opacity = '0';
                mask.style.transition = 'opacity 0.3s';

                const drawer = Utils.createElement('div', `ui-drawer ui-drawer--${placement} ui-panel`);
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

        // ==========================================
        // 命令面板 (Command Palette)
        // ==========================================
        /**
         * 显示命令面板
         * @param {Array} commands - 命令列表
         * 结构示例: { id: 'save', title: '保存文件', icon: '💾', shortcut: 'Ctrl+S', action: () => {} }
         */
        showCommandPalette(commands = []) {
            return new Promise((resolve) => {
                // 防止重复打开
                if (document.querySelector('.ui-cmd-mask')) return;

                // 1. 创建 DOM
                const mask = Utils.createElement('div', 'ui-mask ui-cmd-mask');
                const box = Utils.createElement('div', 'ui-cmd-box ui-panel');
                
                const header = Utils.createElement('div', 'ui-cmd-header');
                header.innerHTML = `<span class="ui-cmd-icon">🔍</span>`;
                const input = Utils.createElement('input', 'ui-cmd-input');
                input.placeholder = '输入命令搜索...';
                header.appendChild(input);

                const listEl = Utils.createElement('div', 'ui-cmd-list');
                
                const footer = Utils.createElement('div', 'ui-cmd-footer');
                footer.innerHTML = `<span>↑↓ 选择</span><span>↵ 确认</span>`;

                box.appendChild(header);
                box.appendChild(listEl);
                box.appendChild(footer);
                mask.appendChild(box);
                document.body.appendChild(mask);
                
                input.focus();

                // 2. 状态管理
                let selectedIndex = 0;
                let filteredCommands = [...commands];

                // 3. 渲染列表函数
                const renderList = () => {
                    listEl.innerHTML = '';
                    if (filteredCommands.length === 0) {
                        listEl.innerHTML = '<div class="ui-cmd-empty">未找到相关命令</div>';
                        return;
                    }

                    filteredCommands.forEach((cmd, index) => {
                        const isSelected = index === selectedIndex;
                        const cls = `ui-cmd-item ${isSelected ? 'selected' : ''}`;
                        
                        const el = Utils.createElement('div', cls);
                        // 处理图标，如果没有图标给个默认占位
                        const iconHtml = `<span class="ui-cmd-item__icon">${cmd.icon || '•'}</span>`;
                        const shortcutHtml = cmd.shortcut ? `<span class="ui-cmd-item__shortcut">${cmd.shortcut}</span>` : '';
                        
                        el.innerHTML = `
                            <div class="ui-cmd-item__left">${iconHtml}<span>${cmd.title}</span></div>
                            ${shortcutHtml}
                        `;
                        
                        // 鼠标点击执行
                        el.onclick = () => execute(cmd);
                        // 鼠标悬停更新选中索引
                        el.onmouseenter = () => {
                            selectedIndex = index;
                            updateHighlight();
                        };
                        
                        listEl.appendChild(el);
                    });
                    
                    ensureVisible();
                };

                // 只更新高亮样式 (性能优化)
                const updateHighlight = () => {
                    const items = listEl.querySelectorAll('.ui-cmd-item');
                    items.forEach((item, idx) => {
                        if (idx === selectedIndex) item.classList.add('selected');
                        else item.classList.remove('selected');
                    });
                };

                // 确保选中项在视图内
                const ensureVisible = () => {
                    const selectedEl = listEl.children[selectedIndex];
                    if (selectedEl && selectedEl.scrollIntoView) {
                        selectedEl.scrollIntoView({ block: 'nearest' });
                    }
                };

                // 执行命令
                const execute = (cmd) => {
                    close();
                    if (cmd && cmd.action) cmd.action();
                    resolve(cmd);
                };

                const close = () => {
                    Utils.removeElement(mask);
                };

                // 4. 事件绑定
                
                // 输入过滤
                input.oninput = (e) => {
                    const val = e.target.value.toLowerCase();
                    filteredCommands = commands.filter(c => c.title.toLowerCase().includes(val));
                    selectedIndex = 0;
                    renderList();
                };

                // 键盘导航
                input.onkeydown = (e) => {
                    if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        selectedIndex = (selectedIndex + 1) % filteredCommands.length;
                        updateHighlight();
                        ensureVisible();
                    } else if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        selectedIndex = (selectedIndex - 1 + filteredCommands.length) % filteredCommands.length;
                        updateHighlight();
                        ensureVisible();
                    } else if (e.key === 'Enter') {
                        e.preventDefault();
                        execute(filteredCommands[selectedIndex]);
                    } else if (e.key === 'Escape') {
                        e.preventDefault();
                        close();
                    }
                };

                // 点击遮罩关闭
                mask.onclick = (e) => {
                    if (e.target === mask) close();
                };

                // 初始化渲染
                renderList();
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
                const sheet = Utils.createElement('div', 'ui-action-sheet ui-panel');
                
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
            const oldBottom = document.querySelector('.ui-tabbar-nav');
            Utils.removeElement(oldSide);
            Utils.removeElement(oldBottom);

            // 给 Body 添加布局类，处理 padding
            document.body.classList.add('ui-app-layout');

            // ============================
            // A. 创建侧边栏 (Sidebar) - 用于中大屏
            // ============================
            const sidebar = Utils.createElement('div', 'ui-sidebar-nav ui-panel');
            
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
            // B. 创建底部标签栏 (Tabbar) - 用于小屏
            // ============================
            const bottomBar = Utils.createElement('div', 'ui-tabbar-nav ui-panel');
            
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
                const el = Utils.createElement('div', `ui-tabbar-item ${item.id === activeId ? 'active' : ''}`);
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
                const moreBtn = Utils.createElement('div', `ui-tabbar-item ${isMoreActive ? 'active' : ''}`);
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



    }

    // 导出实例
    window.UIKit = new UIKitClass();

})(window);