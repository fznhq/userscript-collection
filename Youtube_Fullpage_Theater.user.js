// ==UserScript==
// @name         Youtube Fullpage Theater
// @version      1.6.2
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

    function makeIcon(attributes) {
        const create = (name) =>
            document.createElementNS("http://www.w3.org/2000/svg", name);
        let element = create("svg");

        for (const name in attributes) {
            const temp = create(name);
            const current = attributes[name];

            for (const attr in current) {
                temp.setAttributeNS(null, attr, current[attr]);
            }

            if (name == "svg") element = temp;
            else element.append(temp);
        }

        return element;
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
            value: false, // fallback value
        },
        hide_scrollbar: {
            icon: makeIcon({
                path: {
                    d: "M14 12c0 1.104-.896 2-2 2s-2-.896-2-2 .896-2 2-2 2 .896 2 2zm-3-3.858c.321-.083.653-.142 1-.142s.679.059 1 .142v-2.142h4l-5-6-5 6h4v2.142zm2 7.716c-.321.083-.653.142-1 .142s-.679-.059-1-.142v2.142h-4l5 6 5-6h-4v-2.142z",
                },
            }),
            label: "Theater Hide Scrollbar",
            value: true, // fallback value
            onUpdate: () => {
                if (html.hasAttribute(attr.theater)) {
                    html.toggleAttribute(
                        attr.no_scroll,
                        options.hide_scrollbar.value
                    );
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
            value: true, // fallback value
        },
        hide_card: {
            icon: makeIcon({
                path: {
                    d: "M22 6v16H6V6h16zm2-2H4v20h20V4zM0 0v20h2V2h18V0H0zm14.007 11.225C10.853 11.225 9 13.822 9 13.822s2.015 2.953 5.007 2.953c3.222 0 4.993-2.953 4.993-2.953s-1.788-2.597-4.993-2.597zm.042 4.717a1.942 1.942 0 1 1 .002-3.884 1.942 1.942 0 0 1-.002 3.884zM15.141 14a1.092 1.092 0 1 1-2.184 0l.02-.211a.68.68 0 0 0 .875-.863l.197-.019c.603 0 1.092.489 1.092 1.093z",
                },
            }),
            label: "Hide Card Outside Theater Mode",
            value: false, // fallback value
            onUpdate: () => {
                if (!html.hasAttribute(attr.theater))
                    html.toggleAttribute(
                        attr.hide_card,
                        options.hide_card.value
                    );
            },
        },
    };

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

    function createDIV(className) {
        const element = document.createElement("div");
        element.className = className || "";
        return element;
    }

    const popup = {
        container: createDIV("ytc-popup-container"),
        menu: (() => {
            const menu = createDIV("ytc-menu ytp-panel-menu");

            for (const name in options) {
                const option = options[name],
                    menuItem = createDIV("ytp-menuitem"),
                    icon = createDIV("ytp-menuitem-icon"),
                    label = createDIV("ytp-menuitem-label"),
                    content = createDIV("ytp-menuitem-content"),
                    checkbox = createDIV("ytp-menuitem-toggle-checkbox");

                menuItem.ariaChecked = option.value;
                icon.append(option.icon);
                label.textContent = option.label;
                content.append(checkbox);
                menuItem.append(icon, label, content);
                menuItem.addEventListener("click", () => {
                    menuItem.ariaChecked = saveOption(name, !option.value);
                    if (option.onUpdate) option.onUpdate();
                });
                menu.append(menuItem);
            }

            return menu;
        })(),
    };

    popup.container.append(popup.menu);
    popup.container.addEventListener("click", (ev) => {
        if (!popup.menu.contains(ev.target)) popup.container.remove();
    });

    window.addEventListener("keydown", (ev) => {
        const isVClick =
            ev.key.toLowerCase() == "v" ||
            ev.code == "KeyV" ||
            ev.keyCode == 86;

        if (!ev.ctrlKey && isVClick && !isActiveEditable()) {
            if (document.contains(popup.container)) {
                popup.container.remove();
            } else {
                body.append(popup.container);
            }
        } else if (ev.code == "Escape" && document.contains(popup.container)) {
            popup.container.remove();
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

    addStyle(/*css*/ `
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

        html[theater] #full-bleed-container,
        html[theater] #player-full-bleed-container {
            height: 100vh !important;
            max-height: none !important;
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
    `);

    const element = {
        watch: $("ytd-watch-flexy, ytd-watch-grid"), // ytd-watch-grid == trash
        search: $("input#search"),
    };

    const attr = {
        video_id: "video-id",
        role: "role",
        theater: "theater",
        fullscreen: "fullscreen",
        hidden_header: "masthead-hidden",
        no_scroll: "no-scroll",
        hide_card: "hide-card",
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
     * @returns
     */
    function observer(callback, target, options) {
        const mutation = new MutationObserver(callback);
        mutation.observe(target, options || { subtree: true, childList: true });
        return mutation;
    }

    function isTheater() {
        const watch = element.watch();
        return (
            watch.getAttribute(attr.role) == "main" &&
            !watch.hasAttribute(attr.fullscreen) &&
            watch.hasAttribute(attr.theater)
        );
    }

    function isActiveEditable() {
        /** @type {HTMLElement} */
        const active = document.activeElement;
        return (
            active.tagName == "TEXTAREA" ||
            active.tagName == "INPUT" ||
            active.contentEditable == "true"
        );
    }

    function toggleHeader() {
        if (isTheater() && document.activeElement != element.search()) {
            html.toggleAttribute(attr.hidden_header, !win.scrollY);
        }
    }

    function toggleTheater() {
        document.dispatchEvent(keyToggleTheater);
    }

    /**
     * @param {KeyboardEvent} event
     */
    function onEscapePress(event) {
        if (
            event.code != "Escape" ||
            !isTheater() ||
            document.contains(popup.container)
        ) {
            return;
        }

        if (options.close_theater_with_esc.value) {
            toggleTheater();
        } else {
            const input = element.search();

            if (document.activeElement != input) {
                html.removeAttribute(attr.hidden_header);
                setTimeout(() => input.focus(), 1);
            } else if (!win.scrollY) {
                html.setAttribute(attr.hidden_header, "");
                input.blur();
            }
        }
    }

    /**
     * @param {MutationRecord[]} mutations
     */
    function openTheater(mutations) {
        const attrs = [attr.role, attr.video_id];
        const elem = element.watch();

        if (
            options.auto_theater_mode.value &&
            mutations.some((m) => attrs.includes(m.attributeName)) &&
            !elem.hasAttribute(attr.theater) &&
            !elem.hasAttribute(attr.fullscreen)
        ) {
            setTimeout(toggleTheater, 1);
        }
    }

    function registerEventListener() {
        element.search().addEventListener("blur", toggleHeader);
        win.addEventListener("scroll", toggleHeader);
        win.addEventListener("keydown", onEscapePress, true);
    }

    function applyTheaterMode() {
        const state = isTheater();

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

        registerEventListener();

        observer(
            (mutations) => {
                applyTheaterMode();
                openTheater(mutations);
            },
            watch,
            { attributes: true }
        );

        observe.disconnect();
    }, body);
})();
