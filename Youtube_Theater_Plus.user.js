// ==UserScript==
// @name         YouTube Theater Plus
// @version      2.3.9
// @description  Enhances YouTube Theater with features like Fullpage Theater, Auto Open Theater, and more, including support for the new UI.
// @run-at       document-body
// @inject-into  content
// @match        https://www.youtube.com/*
// @exclude      https://*.youtube.com/live_chat*
// @exclude      https://*.youtube.com/embed*
// @exclude      https://*.youtube.com/tv*
// @exclude      https:/tv.youtube.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=youtube.com
// @grant        GM.getValue
// @grant        GM.setValue
// @updateURL    https://github.com/fznhq/userscript-collection/raw/main/Youtube_Fullpage_Theater.user.js
// @downloadURL  https://github.com/fznhq/userscript-collection/raw/main/Youtube_Fullpage_Theater.user.js
// @author       Fznhq
// @namespace    https://github.com/fznhq
// @homepageURL  https://github.com/fznhq/userscript-collection
// @license      GNU GPLv3
// ==/UserScript==

// Icons provided by https://iconmonstr.com/

(async function () {
    "use strict";

    const html = document.documentElement;
    const body = document.body;

    let theater = false;
    let fullpage = true;
    let headerOpen = false;

    /**
     * @typedef {object} Option
     * @property {string} icon
     * @property {string} label
     * @property {any} value
     * @property {Function} onUpdate
     * @property {Option} sub
     */

    /**
     * Options must be changed via popup menu,
     * just press (v) to open the menu
     */
    const subIcon = `{"svg":{"clip-rule":"evenodd","fill-rule":"evenodd","stroke-linejoin":"round","stroke-miterlimit":"2"},"path":{"d":"M10.211 7.155A.75.75 0 0 0 9 7.747v8.501a.75.75 0 0 0 1.212.591l5.498-4.258a.746.746 0 0 0-.001-1.183zm.289 7.563V9.272l3.522 2.719z","fill-rule":"nonzero"}}`;
    const options = {
        fullpage_theater: {
            icon: `{"path":{"d":"M22 4v12H2V4zm1-1H1v14h22zm-6 17H7v1h10z"}}`,
            label: "Fullpage Theater;", // Remove ";" to set your own label.
            value: true,
            onUpdate() {
                applyTheaterMode(true);
            },
            sub: {
                show_title: {
                    label: "In Player Title;", // Remove ";" to set your own label.
                    value: false,
                    onUpdate() {
                        setHtmlAttr(attr.show_title, fullpage && this.value);
                    },
                },
            },
        },
        auto_theater_mode: {
            icon: `{"svg":{"fill-rule":"evenodd","clip-rule":"evenodd"},"path":{"d":"M24 22H0V2h24zm-7-1V6H1v15zm1 0h5V3H1v2h17zm-6-6h-1v-3l-7 7-1-1 7-7H7v-1h5z"}}`,
            label: "Auto Open Theater;", // Remove ";" to set your own label.
            value: false,
            onUpdate() {
                if (this.value && !theater) toggleTheater();
            },
        },
        hide_scrollbar: {
            icon: `{"path":{"d":"M14 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0m-3-4h2V6h4l-5-6-5 6h4zm2 8h-2v2H7l5 6 5-6h-4z"}}`,
            label: "Theater Hide Scrollbar;", // Remove ";" to set your own label.
            value: true,
            onUpdate() {
                if (theater) {
                    setHtmlAttr(attr.no_scroll, this.value);
                    resizeWindow();
                }
            },
        },
        close_theater_with_esc: {
            icon: `{"svg":{"clip-rule":"evenodd","fill-rule":"evenodd","stroke-linejoin":"round","stroke-miterlimit":2},"path":{"d":"M21 3.998c0-.478-.379-1-1-1H5c-.62 0-1 .519-1 1v15c0 .621.52 1 1 1h15c.478 0 1-.379 1-1zm-16 0h15v15H5zm7.491 6.432 2.717-2.718a.75.75 0 0 1 1.061 1.062l-2.717 2.717 2.728 2.728a.75.75 0 1 1-1.061 1.062l-2.728-2.728-2.728 2.728a.751.751 0 0 1-1.061-1.062l2.728-2.728-2.722-2.722a.75.75 0 0 1 1.061-1.061z","fill-rule":"nonzero"}}`,
            label: "Close Theater With Esc;", // Remove ";" to set your own label.
            value: true,
        },
        hide_cards: {
            icon: `{"path":{"d":"M22 6v16H6V6zm1-1H5v18h18zM2 2v20h1V3h18V2zm12 9c-3 0-5 3-5 3s2 3 5 3 5-3 5-3-2-3-5-3m0 5a2 2 0 1 1 0-4 2 2 0 0 1 0 4m1-2a1 1 0 1 1-2 0 1 1 0 0 0 1-1l1 1"}}`,
            label: "Hide Cards;", // Remove ";" to set your own label.
            value: true,
            onUpdate() {
                setHtmlAttr(attr.hide_card, this.value);
            },
        },
        show_header_near: {
            icon: `{"path":{"d":"M5 4.27 15.476 13H8.934L5 18.117zm-1 0v17l5.5-7h9L4 1.77z"}}`,
            label: "Show Header When Mouse is Near;", // Remove ";" to set your own label.
            value: false,
            sub: {
                trigger_area: {
                    label: "Trigger Area;", // Remove ";" to set your own label.
                    value: 200,
                },
                delay: {
                    label: "Delay (in milliseconds);", // Remove ";" to set your own label.
                    value: 0,
                },
            },
        },
    };

    function resizeWindow() {
        document.dispatchEvent(new Event("resize", { bubbles: true }));
    }

    /**
     * @param {string} name
     * @param {object} attributes
     * @param {Array} append
     * @returns {SVGElement}
     */
    function createNS(name, attributes = {}, append = []) {
        const el = document.createElementNS("http://www.w3.org/2000/svg", name);
        for (const k in attributes) el.setAttributeNS(null, k, attributes[k]);
        return el.append(...append), el;
    }

    /**
     * @param {string} name
     * @param {any} value
     * @param {Option} option
     * @returns {any}
     */
    function saveOption(name, value, option) {
        GM.setValue(name, value);
        return (option.value = value);
    }

    /**
     * @param {string} name
     * @param {string} subName
     */
    function optionKey(name, subName) {
        return subName ? `${name}_sub_${subName}` : name;
    }

    /**
     * @param {string} name
     * @param {string} subName
     */
    async function loadOption(name, subName) {
        const key = optionKey(name, subName);
        const keyLabel = `label_${key}`;
        /** @type {Option} */
        const option = subName ? options[name].sub[subName] : options[name];
        const savedOption = await GM.getValue(key);

        if (savedOption === undefined) {
            saveOption(key, option.value, option);
        } else {
            option.value = savedOption;
        }

        const icon = JSON.parse(option.icon || subIcon);
        const savedLabel = await GM.getValue(keyLabel);
        let label = option.label;

        if (!label.endsWith(";")) {
            GM.setValue(keyLabel, label);
        } else if (savedLabel !== undefined) {
            label = savedLabel;
        }

        option.label = label.replace(/;$/, "");
        option.icon = createNS("svg", icon.svg, [createNS("path", icon.path)]);
    }

    for (const name in options) {
        await loadOption(name);
        for (const subName in options[name].sub) {
            await loadOption(name, subName);
        }
    }

    /**
     * @param {string} className
     * @param {Array} append
     * @returns {HTMLDivElement}
     */
    function createDiv(className, append = []) {
        const el = document.createElement("div");
        el.className = "ytp-menuitem" + (className ? "-" + className : "");
        return el.append(...append), el;
    }

    /**
     * @param {string} name
     * @param {Option} option
     * @returns {HTMLInputElement}
     */
    function itemInput(name, option) {
        const input = document.createElement("input");
        const val = () => Number(input.value.replace(/\D/g, ""));
        const setValue = (value) => (input.value = value);

        setValue(option.value);

        input.addEventListener("input", () => setValue(val()));
        input.addEventListener("change", () => saveOption(name, val(), option));

        return input;
    }

    /** @type {Map<HTMLElement, HTMLElement[]>} */
    const menuItems = new Map();

    /**
     * @param {HTMLElement} item
     * @param {boolean} checked
     */
    function toggleItemSub(item, checked) {
        for (const itemSub of menuItems.get(item)) {
            itemSub.style.display = checked ? "" : "none";
        }
    }

    /**
     * @param {string} name
     * @param {Option} option
     * @returns  {HTMLElement}
     */
    function createItem(name, option) {
        const checkbox = typeof option.value === "boolean";
        const isSub = name.includes("sub_");
        const icon = isSub ? [] : [option.icon];
        const label = isSub
            ? [createDiv("icon", [option.icon]), option.label]
            : [option.label];
        const content = checkbox
            ? [createDiv("toggle-checkbox")]
            : [itemInput(name, option)];
        const item = createDiv("", [
            createDiv("icon", icon),
            createDiv("label", label),
            createDiv("content", content),
        ]);

        if (checkbox) {
            item.setAttribute("aria-checked", option.value);
            item.addEventListener("click", () => {
                const checked = saveOption(name, !option.value, option);
                item.setAttribute("aria-checked", checked);
                if (!isSub) toggleItemSub(item, checked);
                if (option.onUpdate) option.onUpdate();
            });
        }

        return item;
    }

    const popup = {
        show: false,
        menu: (() => {
            const menu = createDiv(" ytc-menu ytp-panel-menu");
            const container = createDiv(" ytc-popup-container", [menu]);

            for (const name in options) {
                const option = options[name];
                const item = createItem(name, option);
                menuItems.set(menu.appendChild(item), []);

                for (const subName in option.sub) {
                    const subOption = option.sub[subName];
                    const sub = createItem(optionKey(name, subName), subOption);
                    menuItems.get(item).push(menu.appendChild(sub));
                }

                toggleItemSub(item, option.value);
            }

            window.addEventListener("click", (ev) => {
                if (popup.show && !menu.contains(ev.target)) {
                    popup.show = !!container.remove();
                }
            });

            return container;
        })(),
    };

    window.addEventListener("keydown", (ev) => {
        const isPressV = ev.key.toLowerCase() === "v" || ev.code === "KeyV";

        if (
            (isPressV && !ev.ctrlKey && !isActiveEditable()) ||
            (ev.code === "Escape" && popup.show)
        ) {
            document.activeElement.blur();
            popup.show = popup.show
                ? !!popup.menu.remove()
                : !body.append(popup.menu);
        }
    });

    /**
     * @param {string} query
     * @returns {() => HTMLElement | null}
     */
    function $(query) {
        let element = null;
        return () => element || (element = document.querySelector(query));
    }

    const style = document.head.appendChild(document.createElement("style"));
    style.textContent = /*css*/ `
        html[no-scroll],
        html[no-scroll] body {
            scrollbar-width: none !important;
        }

        html[no-scroll]::-webkit-scrollbar,
        html[no-scroll] body::-webkit-scrollbar,
        html[hide-card] ytd-player .ytp-paid-content-overlay,
        html[hide-card] ytd-player .iv-branding,
        html[hide-card] ytd-player .ytp-ce-element,
        html[hide-card] ytd-player .ytp-suggested-action {
            display: none !important;
        }

        html[chat-hidden] #panels-full-bleed-container {
            display: none;
        }

        html[theater][masthead-hidden] #masthead-container {
            transform: translateY(-100%) !important;
        }

        html[theater][masthead-hidden] [fixed-panels] #chat {
            top: 0 !important;
        }

        html[theater] #page-manager {
            margin: 0 !important;
        }

        html[theater] #content #page-manager ytd-watch-flexy #full-bleed-container,
        html[theater] #content #page-manager ytd-watch-grid #player-full-bleed-container {
            height: 100vh;
            min-height: auto;
            max-height: none;
        }

        html[theater][show-title] .ytp-chrome-top {
            height: auto !important;
        }

        html[theater][show-title] .ytp-title {
            display: flex !important;
        }

        html[theater][show-title] .ytp-gradient-top {
            display: block !important;
        }

        .ytc-popup-container {
            position: fixed;
            inset: 0;
            z-index: 9000;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .ytc-menu.ytp-panel-menu {
            background: #000;
            width: 400px;
            font-size: 120%;
            padding: 10px;
            fill: #eee;
        }

        .ytc-menu input {
            width: 36px;
            text-align: center;
        }

        .ytc-menu .ytp-menuitem-label .ytp-menuitem-icon {
            display: inline-block;
            padding: 0 10px 0 0;
            margin-left: -10px;
        }
    `;

    if (getComputedStyle(html).background.includes("255")) {
        style.textContent += /*css*/ `
            .ytc-menu,
            .ytc-menu [aria-checked=false] .ytp-menuitem-toggle-checkbox::after {
                background: #fff !important;
            }

            .ytc-menu .ytp-menuitem-icon {
                fill: #030303 !important;
            }

            .ytc-menu .ytp-menuitem-label {
                color: #0f0f0f !important;
            }

            .ytc-menu [aria-checked=false] .ytp-menuitem-toggle-checkbox {
                background: #999 !important;
            }
        `;
    }

    const prefix = "yttp-";
    const attrId = "-" + Date.now().toString(36).slice(-4);
    const attr = {
        video_id: "video-id",
        role: "role",
        theater: "theater",
        fullscreen: "fullscreen",
        hidden_header: "masthead-hidden",
        no_scroll: "no-scroll",
        hide_card: "hide-card",
        chat_hidden: "chat-hidden",
        show_title: "show-title",
        trigger: prefix + "trigger" + attrId, // Internal only
    };

    for (const key in attr) {
        style.textContent = style.textContent.replaceAll(
            "[" + attr[key] + "]",
            "[" + prefix + attr[key] + attrId + "]"
        );
    }

    const element = {
        watch: $("ytd-watch-flexy, ytd-watch-grid"), // ytd-watch-grid === trash
        search: $("form[action*=result] input"),
    };

    const keyToggleTheater = new KeyboardEvent("keydown", {
        key: "t",
        code: "KeyT",
        which: 84,
        keyCode: 84,
        bubbles: true,
        cancelable: true,
    });

    /**
     * @param {string} attr
     * @param {boolean} state
     */
    function setHtmlAttr(attr, state) {
        html.toggleAttribute(prefix + attr + attrId, state);
    }

    /**
     * @param {MutationCallback} callback
     * @param {Node} target
     * @param {MutationObserverInit | undefined} options
     */
    function observer(callback, target, options) {
        const mutation = new MutationObserver(callback);
        mutation.observe(target, options || { subtree: true, childList: true });
    }

    /**
     * @returns {boolean}
     */
    function isTheater() {
        const watch = element.watch();
        return (
            watch.getAttribute(attr.role) === "main" &&
            watch.hasAttribute(attr.theater) &&
            !watch.hasAttribute(attr.fullscreen)
        );
    }

    /**
     * @returns {boolean}
     */
    function isActiveEditable() {
        /** @type {HTMLElement} */
        const active = document.activeElement;
        return (
            active.tagName === "TEXTAREA" ||
            active.tagName === "INPUT" ||
            active.isContentEditable
        );
    }

    /**
     * @param {boolean} state
     * @param {number} timeout
     * @param {Function} callback
     * @returns {number | boolean}
     */
    function toggleHeader(state, timeout, callback) {
        const toggle = () => {
            if (state || document.activeElement !== element.search()) {
                const showNear = options.show_header_near.value;
                headerOpen = state || (!showNear && !!window.scrollY);
                setHtmlAttr(attr.hidden_header, !headerOpen);
                if (callback) callback();
            }
        };
        return fullpage && setTimeout(toggle, timeout || 1);
    }

    let mouseNearDelayId = 0;
    let mouseNearTimerId = 0;

    /**
     * @param {number} delay
     * @returns {number}
     */
    function mouseNearHide(delay = 0) {
        return toggleHeader(false, delay, () => {
            clearTimeout(mouseNearDelayId);
            mouseNearDelayId = 0;
        });
    }

    function mouseNearToggle(/** @type {MouseEvent} */ ev) {
        if (options.show_header_near.value && fullpage) {
            const subOptions = options.show_header_near.sub;
            const area = subOptions.trigger_area.value;
            const state = !popup.show && ev.clientY < area;
            const delay = headerOpen ? 0 : subOptions.delay.value;

            if (state && (!mouseNearDelayId || headerOpen)) {
                clearTimeout(mouseNearTimerId);
                mouseNearTimerId = mouseNearHide(delay + 1500);
                mouseNearDelayId = toggleHeader(true, delay);
            } else if (!state) mouseNearHide();
        }
    }

    function toggleTheater() {
        document.dispatchEvent(keyToggleTheater);
    }

    function onEscapePress(/** @type {KeyboardEvent} */ ev) {
        if (ev.code !== "Escape" || !theater || popup.show) return;

        const input = element.search();

        if (options.close_theater_with_esc.value) toggleTheater();
        else if (document.activeElement !== input) input.focus();
        else input.blur();
    }

    function registerEventListener() {
        window.addEventListener("mousemove", mouseNearToggle);
        window.addEventListener("keydown", onEscapePress, true);
        window.addEventListener("mouseout", (ev) => {
            if (ev.clientY <= 0) mouseNearHide();
        });
        window.addEventListener("scroll", () => {
            if (!options.show_header_near.value) toggleHeader();
        });
        element.search().addEventListener("focus", () => toggleHeader(true));
        element.search().addEventListener("blur", () => toggleHeader(false));
    }

    /**
     * @param {true | undefined} force
     */
    function applyTheaterMode(force) {
        const state = isTheater();

        if (theater === state && (!state || !force)) return;

        const opt_ft = options.fullpage_theater;
        theater = state;
        fullpage = theater && opt_ft.value;

        setHtmlAttr(attr.theater, fullpage);
        setHtmlAttr(attr.hidden_header, fullpage);
        setHtmlAttr(attr.show_title, fullpage && opt_ft.sub.show_title.value);
        setHtmlAttr(attr.no_scroll, theater && options.hide_scrollbar.value);
        setHtmlAttr(attr.hide_card, options.hide_cards.value);
        resizeWindow();
    }

    /**
     * @param {MutationRecord[]} mutations
     */
    function autoOpenTheater(mutations) {
        const attrs = [attr.role, attr.video_id, attr.trigger];
        const watch = element.watch();

        if (
            !theater &&
            options.auto_theater_mode.value &&
            watch.getAttribute(attr.video_id) &&
            !watch.hasAttribute(attr.fullscreen) &&
            mutations.some((m) => attrs.includes(m.attributeName))
        ) {
            setTimeout(toggleTheater, 1);
        }
    }

    /**
     * @returns {boolean | undefined}
     */
    function isChatFixed() {
        const chat = document.getElementById("chat");
        const frame = chat && chat.querySelector("iframe");

        if (!chat) return;
        if (
            frame &&
            chat.offsetHeight &&
            frame.offsetHeight &&
            element.watch().hasAttribute("fixed-panels")
        ) {
            const styleChat = getComputedStyle(chat);

            if (
                styleChat.position === "fixed" &&
                styleChat.visibility !== "hidden" &&
                Number(styleChat.opacity)
            ) {
                return true;
            }
        }

        return false;
    }

    let chatState = false;

    function observeChatChange() {
        const state = isChatFixed();

        if (state !== chatState) {
            chatState = state;
            setHtmlAttr(attr.chat_hidden, state === false);
            resizeWindow();
        }
    }

    observer(observeChatChange, document, {
        subtree: true,
        childList: true,
        attributes: true,
    });

    observer((_, observe) => {
        const watch = element.watch();

        if (watch) {
            observe.disconnect();
            observer(
                (mutations) => {
                    applyTheaterMode();
                    autoOpenTheater(mutations);
                },
                watch,
                { attributes: true }
            );
            watch.setAttribute(attr.trigger, "");
            registerEventListener();
        }
    }, body);
})();
