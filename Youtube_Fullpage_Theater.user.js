// ==UserScript==
// @name         Youtube Fullpage Theater
// @version      1.1.0
// @description  Make theater mode fill the entire page view with hidden navbar
// @run-at       document-body
// @match        https://www.youtube.com/*
// @exclude      https://*.youtube.com/live_chat*
// @exclude      https://*.youtube.com/embed*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=youtube.com
// @grant        GM.getValue
// @grant        GM.setValue
// @grant        GM.addStyle
// @updateURL    https://github.com/fznhq/userscript-collection/raw/main/Youtube_Fullpage_Theater.user.js
// @downloadURL  https://github.com/fznhq/userscript-collection/raw/main/Youtube_Fullpage_Theater.user.js
// @author       Fznhq
// @namespace    https://github.com/fznhq
// @homepageURL  https://github.com/fznhq/userscript-collection
// @license      GNU GPLv3
// ==/UserScript==

/**
 * All icon provided by https://iconmonstr.com/
 */

(async function () {
    "use strict";

    /** @type {Window} */
    const win = unsafeWindow;
    /** @type {HTMLHtmlElement} */
    const html = document.documentElement;
    /** @type {HTMLBodyElement} */
    const body = document.body;

    /**
     * Config can be changed via popup menu,
     * just press (v) to open the menu
     */

    const config = {
        auto_theater_mode: {
            icon: `<svg width="24" height="24" fill-rule="evenodd" clip-rule="evenodd"><path d="M24 22h-24v-20h24v20zm-1-19h-22v18h22v-18zm-4 7h-1v-3.241l-11.241 11.241h3.241v1h-5v-5h1v3.241l11.241-11.241h-3.241v-1h5v5z"/></svg>`,
            label: "Auto Open Theater",
            value: undefined, // <-- Only change this value
            fallback: false,
        },
        hide_scrollbar: {
            icon: `<svg width="24" height="24" viewBox="0 0 24 24"><path d="M14 12c0 1.104-.896 2-2 2s-2-.896-2-2 .896-2 2-2 2 .896 2 2zm-3-3.858c.321-.083.653-.142 1-.142s.679.059 1 .142v-2.142h4l-5-6-5 6h4v2.142zm2 7.716c-.321.083-.653.142-1 .142s-.679-.059-1-.142v2.142h-4l5 6 5-6h-4v-2.142z"/></svg>`,
            label: "Theater Hide Scrollbar",
            value: undefined, // <-- Only change this value
            fallback: true,
        },
        // if value is false, it will
        // get replace by focus search on esc
        close_theater_with_esc: {
            icon: `<svg clip-rule="evenodd" fill-rule="evenodd" stroke-linejoin="round" stroke-miterlimit="2" viewBox="0 0 24 24"><path d="m21 3.998c0-.478-.379-1-1-1h-16c-.62 0-1 .519-1 1v16c0 .621.52 1 1 1h16c.478 0 1-.379 1-1zm-16.5.5h15v15h-15zm7.491 6.432 2.717-2.718c.146-.146.338-.219.53-.219.404 0 .751.325.751.75 0 .193-.073.384-.22.531l-2.717 2.717 2.728 2.728c.147.147.22.339.22.531 0 .427-.349.75-.75.75-.192 0-.385-.073-.531-.219l-2.728-2.728-2.728 2.728c-.147.146-.339.219-.531.219-.401 0-.75-.323-.75-.75 0-.192.073-.384.22-.531l2.728-2.728-2.722-2.722c-.146-.147-.219-.338-.219-.531 0-.425.346-.749.75-.749.192 0 .384.073.53.219z" fill-rule="nonzero"/></svg>`,
            label: "Close Theater with Esc",
            value: undefined, // <-- Only change this value
            fallback: true,
        },
    };

    function saveConfig(name, value) {
        if (value !== undefined) config[name].value = value;
        GM.setValue(name, config[name].value);
    }

    for (const name in config) {
        if (GM.getValue && GM.setValue) {
            if (config[name].value !== undefined) {
                saveConfig(name);
            } else {
                config[name].value = await GM.getValue(
                    name,
                    config[name].fallback
                );
            }
        } else if (config[name].value === undefined) {
            config[name].value = config[name].fallback;
        }
    }

    const popup = {
        menu: document.createElement("div"),
        container: document.createElement("div"),
        item_list: (name) => {
            const item = document.createElement("div");
            item.className = "ytp-menuitem";
            item.ariaChecked = !!config[name].value;

            item.innerHTML = /*html*/ `
                <div class="ytp-menuitem-icon">${config[name].icon}</div>
                <div class="ytp-menuitem-label">${config[name].label}</div>
                <div class="ytp-menuitem-content">
                    <div class="ytp-menuitem-toggle-checkbox"></div>
                </div>
            `;

            item.addEventListener("click", () => {
                item.ariaChecked = !config[name].value;
                saveConfig(name, !config[name].value);
                document.dispatchEvent(
                    new CustomEvent("yft-config-updated", { detail: name })
                );
            });

            return item;
        },
    };

    popup.menu.className = "ytc-menu ytp-panel-menu";
    for (const item in config) popup.menu.append(popup.item_list(item));

    popup.container.className = "ytc-popup-container";
    popup.container.append(popup.menu);
    popup.container.addEventListener("click", (ev) => {
        !popup.menu.contains(ev.target) && popup.container.remove();
    });

    window.addEventListener("keydown", (ev) => {
        if (ev.key.toLowerCase() == "v" && !isActiveEditable()) {
            if (document.contains(popup.container)) {
                popup.container.remove();
            } else {
                body.append(popup.container);
            }
        } else if (ev.key == "Escape" && document.contains(popup.container)) {
            popup.container.remove();
        }
    });

    document.addEventListener(
        "yft-config-updated",
        (/** @type {CustomEvent} */ ev) => {
            const name = ev.detail;

            switch (name) {
                case "hide_scrollbar":
                    html.toggleAttribute(attr.no_scroll, config[name].value);
                    break;
            }
        }
    );

    /**
     * @param {string} query
     * @returns {() => HTMLElement | null}
     */
    function $(query) {
        return () => document.querySelector(query);
    }

    GM.addStyle(/*css*/ `
        html[theater][no-scroll],
        html[theater][no-scroll] body {
            scrollbar-width: none !important;
        }

        html[theater][no-scroll]::-webkit-scrollbar,
        html[theater][no-scroll] body::-webkit-scrollbar {
            display: none !important;
        }
        
        html[masthead-hidden] ytd-watch-flexy[fixed-panels] #chat {
            top: 0 !important;
        }

        html[theater] ytd-player .ytp-paid-content-overlay,
        html[theater] ytd-player .iv-branding,
        html[theater] ytd-player .ytp-ce-element,
        html[theater] ytd-player .ytp-chrome-top,
        html[theater] ytd-player .ytp-suggested-action {
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

        .ytc-menu.ytp-panel-menu svg {
            fill: #eee;
        }
    `);

    const element = {
        watch: $("ytd-watch-flexy, ytd-watch-grid"), // Add: trash UI support
        search: $("input#search"),
    };

    const attr = {
        video_id: "video-id",
        role: "role",
        theater: "theater",
        fullscreen: "fullscreen",
        hidden_header: "masthead-hidden",
        no_scroll: "no-scroll",
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
        if (event.key != "Escape" || document.contains(popup.container)) {
            return;
        }

        if (config.close_theater_with_esc.value) {
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

    function openTheater() {
        const elem = element.watch();

        if (
            config.auto_theater_mode.value &&
            !elem.hasAttribute(attr.theater) &&
            !elem.hasAttribute(attr.fullscreen)
        ) {
            setTimeout(toggleTheater, 1);
        }
    }

    function watchTheaterMode() {
        const state = isTheater();
        const input = element.search();

        if (state && !html.hasAttribute(attr.theater)) {
            html.setAttribute(attr.theater, "");
            html.setAttribute(attr.hidden_header, "");
            html.toggleAttribute(attr.no_scroll, config.hide_scrollbar.value);

            input.addEventListener("blur", toggleHeader);
            win.addEventListener("scroll", toggleHeader);
            win.addEventListener("keydown", onEscapePress, true);
        } else if (!state && html.hasAttribute(attr.theater)) {
            html.removeAttribute(attr.theater);
            html.removeAttribute(attr.hidden_header);
            html.removeAttribute(attr.no_scroll);

            input.removeEventListener("blur", toggleHeader);
            win.removeEventListener("scroll", toggleHeader);
            win.removeEventListener("keydown", onEscapePress, true);
        }
    }

    observer((_, observe) => {
        const elem = element.watch();

        if (!elem) return;

        observer(watchTheaterMode, elem, { attributes: true });
        observer(openTheater, elem, {
            attributeFilter: [attr.video_id, attr.role],
        });

        observe.disconnect();
    }, body);
})();
