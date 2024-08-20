// ==UserScript==
// @name         Youtube Fullpage Theater
// @version      1.5.0
// @description  Make theater mode fill the entire page view with a hidden navbar and auto theater mode (Support new UI)
// @run-at       document-body
// @match        https://www.youtube.com/*
// @exclude      https://*.youtube.com/live_chat*
// @exclude      https://*.youtube.com/embed*
// @exclude      https://*.youtube.com/tv*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=youtube.com
// @grant        GM.getValue
// @grant        GM_getValue
// @grant        GM.setValue
// @grant        GM_setValue
// @grant        GM.addStyle
// @grant        GM_addStyle
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

    /**
     * Options must be changed via popup menu,
     * just press (v) to open the menu
     */
    const options = {
        auto_theater_mode: {
            icon: `<svg width="24" height="24" fill-rule="evenodd" clip-rule="evenodd"><path d="M24 22h-24v-20h24v20zm-1-19h-22v18h22v-18zm-4 7h-1v-3.241l-11.241 11.241h3.241v1h-5v-5h1v3.241l11.241-11.241h-3.241v-1h5v5z"/></svg>`,
            label: "Auto Open Theater",
            value: false, // fallback value
        },
        hide_scrollbar: {
            icon: `<svg width="24" height="24" viewBox="0 0 24 24"><path d="M14 12c0 1.104-.896 2-2 2s-2-.896-2-2 .896-2 2-2 2 .896 2 2zm-3-3.858c.321-.083.653-.142 1-.142s.679.059 1 .142v-2.142h4l-5-6-5 6h4v2.142zm2 7.716c-.321.083-.653.142-1 .142s-.679-.059-1-.142v2.142h-4l5 6 5-6h-4v-2.142z"/></svg>`,
            label: "Theater Hide Scrollbar",
            value: true, // fallback value
            onUpdate: () => {
                if (html.hasAttribute(attr.theater))
                    html.toggleAttribute(
                        attr.no_scroll,
                        options.hide_scrollbar.value
                    );
            },
        },
        close_theater_with_esc: {
            icon: `<svg clip-rule="evenodd" fill-rule="evenodd" stroke-linejoin="round" stroke-miterlimit="2" viewBox="0 0 24 24"><path d="m21 3.998c0-.478-.379-1-1-1h-16c-.62 0-1 .519-1 1v16c0 .621.52 1 1 1h16c.478 0 1-.379 1-1zm-16.5.5h15v15h-15zm7.491 6.432 2.717-2.718c.146-.146.338-.219.53-.219.404 0 .751.325.751.75 0 .193-.073.384-.22.531l-2.717 2.717 2.728 2.728c.147.147.22.339.22.531 0 .427-.349.75-.75.75-.192 0-.385-.073-.531-.219l-2.728-2.728-2.728 2.728c-.147.146-.339.219-.531.219-.401 0-.75-.323-.75-.75 0-.192.073-.384.22-.531l2.728-2.728-2.722-2.722c-.146-.147-.219-.338-.219-.531 0-.425.346-.749.75-.749.192 0 .384.073.53.219z" fill-rule="nonzero"/></svg>`,
            label: "Close Theater With Esc",
            value: true, // fallback value
        },
        hide_card: {
            icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><path d="M22 2v20H2V2h20zm2-2H0v24h24V0zm-6 10v8h-8v-8h8zm2-2H8v12h12V8zM4 4v12h2V6h10V4H4z"/></svg>`,
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
        options[name].value = value;
        (GM.setValue || GM_setValue)(name, value);
        return value;
    }

    for (const name in options) {
        let saved_option = await (GM.getValue || GM_getValue)(name);

        if (saved_option === undefined) {
            saveOption(name, options[name].value);
        } else {
            options[name].value = saved_option;
        }
    }

    const popup = {
        container: document.createElement("div"),
        menu: (() => {
            const menu = document.createElement("div");
            menu.className = "ytc-menu ytp-panel-menu";

            for (const name in options) {
                const item = document.createElement("div");
                item.className = "ytp-menuitem";
                item.ariaChecked = options[name].value;
                item.innerHTML = /*html*/ `
                        <div class="ytp-menuitem-icon">${options[name].icon}</div>
                        <div class="ytp-menuitem-label">${options[name].label}</div>
                        <div class="ytp-menuitem-content">
                            <div class="ytp-menuitem-toggle-checkbox"></div>
                        </div>
                `;
                item.addEventListener("click", () => {
                    item.ariaChecked = saveOption(name, !options[name].value);
                    if (options[name].onUpdate) options[name].onUpdate();
                });
                menu.append(item);
            }

            return menu;
        })(),
    };

    popup.container.className = "ytc-popup-container";
    popup.container.append(popup.menu);
    popup.container.addEventListener("click", (ev) => {
        if (!popup.menu.contains(ev.target)) {
            popup.container.remove();
        }
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

    (GM.addStyle || GM_addStyle)(/*css*/ `
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
        const elem = element.watch();
        return (
            elem.getAttribute(attr.role) == "main" &&
            !elem.hasAttribute(attr.fullscreen) &&
            elem.hasAttribute(attr.theater)
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
        if (document.activeElement != element.search()) {
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
        if (event.code != "Escape" || document.contains(popup.container)) {
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

    function setAttribute(theater, header, scroll, card) {
        html.toggleAttribute(attr.theater, theater);
        html.toggleAttribute(attr.hidden_header, header);
        html.toggleAttribute(attr.no_scroll, scroll);
        html.toggleAttribute(attr.hide_card, card);
    }

    function setListener(action) {
        element.search()[action]("blur", toggleHeader);
        win[action]("scroll", toggleHeader);
        win[action]("keydown", onEscapePress, true);
    }

    function watchTheaterMode() {
        const state = isTheater();

        if (state && !html.hasAttribute(attr.theater)) {
            setAttribute(true, true, options.hide_scrollbar.value, true);
            setListener("addEventListener");
        } else if (!state && html.hasAttribute(attr.theater)) {
            setAttribute(false, false, false, options.hide_card.value);
            setListener("removeEventListener");
        }
    }

    observer((_, observe) => {
        const elem = element.watch();
        if (!elem) return;

        observer(
            (mutations) => {
                watchTheaterMode();
                openTheater(mutations);
            },
            elem,
            { attributes: true }
        );

        observe.disconnect();
    }, body);
})();
