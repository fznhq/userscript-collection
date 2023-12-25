// ==UserScript==
// @name         Youtube Fullpage Theater
// @version      0.7.5
// @description  Make theater mode fill the entire page view with hidden navbar
// @run-at       document-body
// @match        https://www.youtube.com/*
// @exclude      https://*.youtube.com/live_chat*
// @exclude      https://*.youtube.com/embed*
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

(async function () {
    "use strict";

    const config = {
        // Open theater, every time video changed
        auto_theater_mode: undefined,
        hide_scrollbar: undefined,
        // if value is false, it will
        // get replace by focus search on esc
        close_theater_with_esc: undefined,
    };

    /**
     * Don't change `fallback` below, change `config` above.
     * It's just a default value
     * when config not yet applied (undefined)
     */
    const fallbackConfig = {
        auto_theater_mode: false,
        hide_scrollbar: true,
        close_theater_with_esc: true,
    };

    for (const name in config) {
        if (GM.getValue && GM.setValue) {
            if (config[name] !== undefined) {
                GM.setValue(name, config[name]);
            } else {
                config[name] = await GM.getValue(name, fallbackConfig[name]);
            }
        } else if (config[name] === undefined) {
            config[name] = fallbackConfig[name];
        }
    }

    /**
     * @param {string} query
     * @returns {() => HTMLElement | null}
     */
    function $(query) {
        return () => document.querySelector(query);
    }

    /**
     * @param {string} css
     */
    function addStyle(css) {
        const style = document.createElement("style");
        style.textContent = css;
        document.head.appendChild(style);
    }

    if (config.hide_scrollbar) {
        addStyle(/*css*/ `
            html[theater],
            html[theater] body {
                scrollbar-width: none !important;
            }

            html[theater]::-webkit-scrollbar,
            html[theater] body::-webkit-scrollbar {
                display: none !important;
            }
        `);
    }

    addStyle(/*css*/ `
        html[theater] #movie_player .ytp-paid-content-overlay,
        html[theater] #movie_player .iv-branding,
        html[theater] #movie_player .ytp-ce-element,
        html[theater] #movie_player .ytp-chrome-top,
        html[theater] #movie_player .ytp-suggested-action {
            display: none !important;
        }

        html[theater][masthead-hidden] #masthead-container {
            transform: translateY(-100%) !important;
        }

        html[theater] #page-manager {
            margin: 0 !important;
        }

        html[theater] #full-bleed-container {
            height: 100vh !important;
            max-height: none !important;
        }
    `);

    /** @type {Window} */
    const win = unsafeWindow;
    const html = document.documentElement;
    const main = $("ytd-watch-flexy");
    const inputSearch = $("input#search");
    const attr = {
        video_id: "video-id",
        role: "role",
        theater: "theater",
        fullscreen: "fullscreen",
        hidden_header: "masthead-hidden",
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
        return (
            main().getAttribute(attr.role) == "main" &&
            !main().hasAttribute(attr.fullscreen) &&
            main().hasAttribute(attr.theater)
        );
    }

    function toggleHeader() {
        if (document.activeElement != inputSearch()) {
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
        if (event.key != "Escape") return;

        if (config.close_theater_with_esc) {
            toggleTheater();
        } else {
            const input = inputSearch();

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
        setTimeout(() => {
            if (
                !main().hasAttribute(attr.theater) &&
                !main().hasAttribute(attr.fullscreen)
            ) {
                toggleTheater();
            }
        }, 1);
    }

    function watchTheaterMode() {
        const state = isTheater();

        if (state && !html.hasAttribute(attr.theater)) {
            html.setAttribute(attr.theater, "");
            html.setAttribute(attr.hidden_header, "");

            win.addEventListener("scroll", toggleHeader);
            win.addEventListener("keydown", onEscapePress, true);
        } else if (!state && html.hasAttribute(attr.theater)) {
            html.removeAttribute(attr.theater);
            html.removeAttribute(attr.hidden_header);

            win.removeEventListener("scroll", toggleHeader);
            win.removeEventListener("keydown", onEscapePress, true);
        }
    }

    observer((_, observe) => {
        if (!main()) return;

        if (config.auto_theater_mode) {
            observer(openTheater, main(), {
                attributeFilter: [attr.video_id, attr.role],
            });
        }

        observer(watchTheaterMode, main(), { attributes: true });
        observe.disconnect();
    }, document.body);
})();
