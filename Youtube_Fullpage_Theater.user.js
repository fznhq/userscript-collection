// ==UserScript==
// @name         Youtube Fullpage Theater
// @version      1.8.6
// @description  Make theater mode fill the entire page view with a hidden navbar and auto theater mode (Support new UI)
// @run-at       document-body
// @match        https://www.youtube.com/*
// @exclude      https://*.youtube.com/live_chat*
// @exclude      https://*.youtube.com/embed*
// @exclude      https://*.youtube.com/tv*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=youtube.com
// @grant        GM.getValue
// @grant        GM.setValue
// @grant        unsafeWindow
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

    /** @type {Window} */
    const win = unsafeWindow;
    /** @type {HTMLHtmlElement} */
    const html = document.documentElement;
    /** @type {HTMLBodyElement} */
    const body = document.body;

    let theater = false;

    /**
     * @param {object} attributes
     * @returns {SVGSVGElement}
     */
    function makeIcon(attributes) {
        const create = (tagName) =>
            document.createElementNS("http://www.w3.org/2000/svg", tagName);
        let icon = create("svg");

        for (const name in attributes) {
            const element = create(name);

            for (const key in attributes[name]) {
                element.setAttribute(key, attributes[name][key]);
            }

            if (name == "svg") icon = element;
            else icon.append(element);
        }

        return icon;
    }

    /**
     * Options must be changed via popup menu,
     * just press (v) to open the menu
     */
    const options = {
        auto_theater_mode: {
            icon: makeIcon({
                svg: { "fill-rule": "evenodd", "clip-rule": "evenodd" },
                path: {
                    d: "M24 22h-24v-20h24v20zm-1-19h-22v18h22v-18zm-4 7h-1v-3.241l-11.241 11.241h3.241v1h-5v-5h1v3.241l11.241-11.241h-3.241v-1h5v5z",
                },
            }),
            label: "Auto Open Theater",
            value: false, //fallback
            onUpdate() {
                if (this.value && !theater) toggleTheater();
            },
        },
        hide_scrollbar: {
            icon: makeIcon({
                path: {
                    d: "M14 12c0 1.104-.896 2-2 2s-2-.896-2-2 .896-2 2-2 2 .896 2 2zm-3-3.858c.321-.083.653-.142 1-.142s.679.059 1 .142v-2.142h4l-5-6-5 6h4v2.142zm2 7.716c-.321.083-.653.142-1 .142s-.679-.059-1-.142v2.142h-4l5 6 5-6h-4v-2.142z",
                },
            }),
            label: "Theater Hide Scrollbar",
            value: true, //fallback
            onUpdate() {
                if (theater) {
                    html.toggleAttribute(attr.no_scroll, this.value);
                    win.dispatchEvent(new Event("resize"));
                }
            },
        },
        close_theater_with_esc: {
            icon: makeIcon({
                svg: {
                    "clip-rule": "evenodd",
                    "fill-rule": "evenodd",
                    "stroke-linejoin": "round",
                    "stroke-miterlimit": 2,
                },
                path: {
                    d: "m21 3.998c0-.478-.379-1-1-1h-16c-.62 0-1 .519-1 1v16c0 .621.52 1 1 1h16c.478 0 1-.379 1-1zm-16.5.5h15v15h-15zm7.491 6.432 2.717-2.718c.146-.146.338-.219.53-.219.404 0 .751.325.751.75 0 .193-.073.384-.22.531l-2.717 2.717 2.728 2.728c.147.147.22.339.22.531 0 .427-.349.75-.75.75-.192 0-.385-.073-.531-.219l-2.728-2.728-2.728 2.728c-.147.146-.339.219-.531.219-.401 0-.75-.323-.75-.75 0-.192.073-.384.22-.531l2.728-2.728-2.722-2.722c-.146-.147-.219-.338-.219-.531 0-.425.346-.749.75-.749.192 0 .384.073.53.219z",
                    "fill-rule": "nonzero",
                },
            }),
            label: "Close Theater With Esc",
            value: true, //fallback
        },
        hide_card: {
            icon: makeIcon({
                path: {
                    d: "M22 6v16H6V6h16zm2-2H4v20h20V4zM0 0v20h2V2h18V0H0zm14.007 11.225C10.853 11.225 9 13.822 9 13.822s2.015 2.953 5.007 2.953c3.222 0 4.993-2.953 4.993-2.953s-1.788-2.597-4.993-2.597zm.042 4.717a1.942 1.942 0 1 1 .002-3.884 1.942 1.942 0 0 1-.002 3.884zM15.141 14a1.092 1.092 0 1 1-2.184 0l.02-.211a.68.68 0 0 0 .875-.863l.197-.019c.603 0 1.092.489 1.092 1.093z",
                },
            }),
            label: "Hide Card Outside Theater Mode",
            value: false, //fallback
            onUpdate() {
                if (!theater) html.toggleAttribute(attr.hide_card, this.value);
            },
        },
        show_header_near: {
            icon: makeIcon({
                path: {
                    d: "M5 4.27 15.476 13H8.934L5 18.117V4.27zM3 0v24l6.919-9H21L3 0z",
                },
            }),
            label: "Show Header When Mouse is Near",
            value: false, //fallback
        },
    };

    /**
     * @param {string} name
     * @param {boolean} value
     * @returns {boolean}
     */
    function saveOption(name, value) {
        GM.setValue(name, value);
        return (options[name].value = value);
    }

    for (const name in options) {
        const saved_option = await GM.getValue(name);

        if (saved_option === undefined) {
            saveOption(name, options[name].value);
        } else {
            options[name].value = saved_option;
        }
    }

    /**
     * @param {string} className
     * @param {Array} append
     * @returns {HTMLDivElement}
     */
    function createDiv(className, append = []) {
        const element = document.createElement("div");
        element.className = className;
        if (append.length) element.append(...append);
        return element;
    }

    const popup = {
        show: false,
        menu: (() => {
            const menu = createDiv("ytc-menu ytp-panel-menu");
            const container = createDiv("ytc-popup-container", [menu]);

            for (const name in options) {
                const option = options[name];
                const item = createDiv("ytp-menuitem", [
                    createDiv("ytp-menuitem-icon", [option.icon]),
                    createDiv("ytp-menuitem-label", [option.label]),
                    createDiv("ytp-menuitem-content", [
                        createDiv("ytp-menuitem-toggle-checkbox"),
                    ]),
                ]);

                menu.append(item);
                item.setAttribute("aria-checked", option.value);
                item.addEventListener("click", () => {
                    const newValue = saveOption(name, !option.value);
                    item.setAttribute("aria-checked", newValue);
                    if (option.onUpdate) option.onUpdate();
                });
            }

            win.addEventListener("click", (ev) => {
                if (popup.show && !menu.contains(ev.target)) {
                    popup.show = !!container.remove();
                }
            });

            return container;
        })(),
    };

    win.addEventListener("keydown", (ev) => {
        const isV = ev.key.toLowerCase() == "v" || ev.code == "KeyV";

        if (
            (isV && !ev.ctrlKey && !isActiveEditable()) ||
            (ev.code == "Escape" && popup.show)
        ) {
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
        let cache;
        return () => cache || (cache = document.querySelector(query));
    }

    /**
     * @param {string} css
     */
    function addStyle(css) {
        const style = document.createElement("style");
        style.textContent = css;
        document.head.append(style);
    }

    let style = /*css*/ `
        html[no-scroll],
        html[no-scroll] body {
            scrollbar-width: none !important;
        }

        html[no-scroll]::-webkit-scrollbar,
        html[no-scroll] body::-webkit-scrollbar {
            display: none !important;
        }
        
        html[masthead-hidden] ytd-watch-flexy[fixed-panels] #chat {
            top: 0 !important;
        }

        html[hide-card] ytd-player .ytp-paid-content-overlay,
        html[hide-card] ytd-player .iv-branding,
        html[hide-card] ytd-player .ytp-ce-element,
        html[hide-card] ytd-player .ytp-chrome-top,
        html[hide-card] ytd-player .ytp-suggested-action {
            display: none !important;
        }

        html[theater][masthead-hidden] #masthead-container {
            transform: translateY(-100%) !important;
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

        .ytc-popup-container {
            position: fixed;
            inset: 0;
            z-index: 9000;
            background: rgba(0, 0, 0, .5);
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .ytc-menu.ytp-panel-menu {
            background: #000;
            width: 400px;
            font-size: 120%;
            padding: 10px;
        }

        .ytc-menu svg {
            fill: #eee;
        }
    `;

    const customAttr = {
        hidden_header: "masthead-hidden",
        no_scroll: "no-scroll",
        hide_card: "hide-card",
    };

    for (const key in customAttr) {
        const oldAttr = new RegExp("\\[" + customAttr[key], "g");
        const uniqueKey = Math.random().toString(36).slice(2);
        customAttr[key] = customAttr[key] + `-${uniqueKey}`;
        style = style.replace(oldAttr, "[" + customAttr[key]);
    }

    addStyle(style);

    const attr = {
        video_id: "video-id",
        role: "role",
        theater: "theater",
        fullscreen: "fullscreen",
        ...customAttr,
    };

    const element = {
        watch: $("ytd-watch-flexy, ytd-watch-grid"), // ytd-watch-grid == trash
        search: $("input#search"),
    };

    const keyToggleTheater = new KeyboardEvent("keydown", {
        key: "t",
        code: "KeyT",
        which: 84,
        keyCode: 84,
        bubbles: true,
        cancelable: true,
        view: win,
    });

    /**
     * @param {MutationCallback} callback
     * @param {Node} target
     * @param {MutationObserverInit | undefined} options
     * @returns {MutationObserver}
     */
    function observer(callback, target, options) {
        const mutation = new MutationObserver(callback);
        mutation.observe(target, options || { subtree: true, childList: true });
        return mutation;
    }

    /**
     * @returns {boolean}
     */
    function isTheater() {
        const watch = element.watch();
        return (
            watch.getAttribute(attr.role) == "main" &&
            watch.hasAttribute(attr.theater) &&
            !watch.hasAttribute(attr.fullscreen)
        );
    }

    /**
     * @returns {boolean}
     */
    function isActiveEditable() {
        const active = document.activeElement;
        return (
            active.tagName == "TEXTAREA" ||
            active.tagName == "INPUT" ||
            active.contentEditable == "true"
        );
    }

    /**
     * @param {boolean} state
     * @param {boolean} skipActive
     */
    function toggleHeader(state, skipActive) {
        if (
            theater &&
            (skipActive || document.activeElement != element.search())
        ) {
            const scroll = !options.show_header_near.value && win.scrollY;
            html.toggleAttribute(attr.hidden_header, !(state || scroll));
        }
    }

    let showHeaderTimer = 0;

    /**
     * @param {MouseEvent} ev
     */
    function mouseShowHeader(ev) {
        if (options.show_header_near.value && theater) {
            const state = ev.clientY < 200;
            if (state) {
                clearTimeout(showHeaderTimer);
                showHeaderTimer = setTimeout(() => toggleHeader(false), 1500);
            }
            toggleHeader(!popup.show && state);
        }
    }

    function toggleTheater() {
        document.dispatchEvent(keyToggleTheater);
    }

    /**
     * @param {KeyboardEvent} ev
     */
    function onEscapePress(ev) {
        if (ev.code != "Escape" || !theater || popup.show) return;

        if (options.close_theater_with_esc.value) {
            toggleTheater();
        } else {
            const input = element.search();
            if (document.activeElement != input) input.focus();
            else input.blur();
        }
    }

    /**
     * @param {MutationRecord[]} mutations
     */
    function autoOpenTheater(mutations) {
        const attrs = [attr.role, attr.video_id];
        const watch = element.watch();

        if (
            options.auto_theater_mode.value &&
            !watch.hasAttribute(attr.theater) &&
            !watch.hasAttribute(attr.fullscreen) &&
            mutations.some((m) => attrs.includes(m.attributeName))
        ) {
            setTimeout(toggleTheater, 1);
        }
    }

    function registerEventListener() {
        element.search().addEventListener("focus", () => {
            setTimeout(() => toggleHeader(true, true), 1);
        });
        element.search().addEventListener("blur", () => {
            setTimeout(() => toggleHeader(false), 1);
        });
        win.addEventListener("scroll", () => {
            if (!options.show_header_near.value) toggleHeader();
        });
        win.addEventListener("mousemove", mouseShowHeader);
        win.addEventListener("keydown", onEscapePress, true);
    }

    function applyTheaterMode() {
        const state = isTheater();

        if (theater == state) return;
        theater = state;

        html.toggleAttribute(attr.theater, state);
        html.toggleAttribute(attr.hidden_header, state);
        html.toggleAttribute(
            attr.no_scroll,
            state && options.hide_scrollbar.value
        );
        html.toggleAttribute(attr.hide_card, state || options.hide_card.value);
    }

    observer((_, observe) => {
        const watch = element.watch();
        if (!watch) return;

        observer(
            (mutations) => {
                applyTheaterMode();
                autoOpenTheater(mutations);
            },
            watch,
            { attributes: true }
        );

        registerEventListener();
        observe.disconnect();
    }, body);
})();
