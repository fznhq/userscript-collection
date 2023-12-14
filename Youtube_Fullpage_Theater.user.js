// ==UserScript==
// @name         Youtube Fullpage Theater
// @version      0.6
// @description  Make theater mode fill the entire page view with hidden navbar
// @run-at       document-body
// @match        https://www.youtube.com/*
// @exclude      https://*.youtube.com/live_chat*
// @exclude      https://*.youtube.com/embed*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=youtube.com
// @grant        none
// @updateURL    https://github.com/fznhq/userscript-collection/raw/main/Youtube_Fullpage_Theater.user.js
// @downloadURL  https://github.com/fznhq/userscript-collection/raw/main/Youtube_Fullpage_Theater.user.js
// @author       Fznhq
// @namespace    https://github.com/fznhq
// @homepageURL  https://github.com/fznhq/userscript-collection
// @license      GNU GPLv3
// ==/UserScript==

(function () {
    "use strict";

    /**
     * @param {string} query
     * @returns {HTMLElement | null}
     */
    function $(query) {
        return document.querySelector(query);
    }

    /**
     * @param {string} css
     */
    function addStyle(css) {
        const style = document.createElement("style");
        style.textContent = css;
        document.head.appendChild(style);
    }

    addStyle(/*css*/ `
        html[theater],
        html[theater] body {
            scrollbar-width: none;
        }

        html[theater]::-webkit-scrollbar,
        html[theater] body::-webkit-scrollbar,
        html[theater] #movie_player .ytp-paid-content-overlay,
        html[theater] #movie_player .iv-branding
        html[theater] #movie_player .ytp-ce-element,
        html[theater] #movie_player .ytp-chrome-top,
        html[theater] #movie_player .ytp-suggested-action {
            display: none !important;
        }

        html[theater][masthead-hidden] #masthead-container {
            transform: translateY(-100%) !important;
        }

        html[theater] #page-manager {
            margin-top: 0 !important;
        }

        html[theater] #full-bleed-container {
            height: 100vh !important;
            max-height: none !important
        }
    `);

    const html = document.documentElement;
    const main = () => $("ytd-watch-flexy");
    const attr = {
        theater: "theater",
        role: "role",
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
        view: window,
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
        const element = main();
        return (
            element.getAttribute(attr.role) == "main" &&
            !element.hasAttribute(attr.fullscreen) &&
            element.hasAttribute(attr.theater)
        );
    }

    function toggleHeader() {
        html.toggleAttribute(attr.hidden_header, !window.scrollY);
    }

    /**
     * @param {KeyboardEvent} event
     */
    function closeTheater(event) {
        if (event.key == "Escape") document.dispatchEvent(keyToggleTheater);
    }

    function watchTheaterMode() {
        const state = isTheater();

        if (state && !html.hasAttribute(attr.theater)) {
            html.setAttribute(attr.theater, "");
            html.setAttribute(attr.hidden_header, "");

            window.addEventListener("scroll", toggleHeader);
            window.addEventListener("keydown", closeTheater);
        } else if (!state && html.hasAttribute(attr.theater)) {
            html.removeAttribute(attr.theater);
            html.removeAttribute(attr.hidden_header);

            window.removeEventListener("scroll", toggleHeader);
            window.removeEventListener("keydown", closeTheater);
        }
    }

    function initMain() {
        observer(watchTheaterMode, main(), { attributes: true });
    }

    observer((_, mobs) => {
        if (main()) {
            initMain();
            mobs.disconnect();
        }
    }, document.body);
})();
