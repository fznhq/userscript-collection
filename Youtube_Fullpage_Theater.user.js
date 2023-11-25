// ==UserScript==
// @name         Youtube Fullpage Theater
// @version      0.2
// @description  Make theater mode fill the entire page view with hidden navbar
// @run-at       document-body
// @match        https://*.youtube.com/*
// @exclude      https://*.youtube.com/live_chat*
// @exclude      https://*.youtube.com/embed*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=youtube.com
// @grant        GM_addStyle
// @updateURL    https://github.com/fznhq/tampermonkey-collection/raw/main/Youtube_Fullpage_Theater.user.js
// @downloadURL  https://github.com/fznhq/tampermonkey-collection/raw/main/Youtube_Fullpage_Theater.user.js
// @author       Fznhq
// @namespace    https://github.com/fznhq
// @homepageURL  https://github.com/fznhq/tampermonkey-collection
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

    const styles = /*css*/ `
        html[full-bleed-player] {
            scrollbar-width: none;
        }

        html[full-bleed-player]::-webkit-scrollbar,
        html[full-bleed-player] .ytp-paid-content-overlay,
        html[full-bleed-player] .iv-branding,
        html[full-bleed-player] .ytp-ce-element,
        html[full-bleed-player] .ytp-cards-button {
            display: none;
        }

        html[full-bleed-player] #page-manager {
            margin-top: 0 !important;
        }

        html[full-bleed-player] #full-bleed-container {
            height: 100vh !important;
            max-height: none !important
        }
    `;

    GM_addStyle(styles);

    const html = document.documentElement;
    const app = () => $("ytd-app");
    const main = () => $("ytd-watch-flexy");
    const attr = {
        theater: "full-bleed-player",
        role: "role",
        id: "video-id",
        hidden_header: "masthead-hidden",
    };

    const keyToggleTheater = new KeyboardEvent("keydown", {
        key: "t",
        code: "KeyT",
        which: 84,
        keyCode: 84,
        bubbles: true,
    });

    /**
     * @param {MutationCallback} callback
     * @param {Node} target
     * @param {MutationObserverInit | undefined} options
     * @returns
     */
    function observer(callback, target, options) {
        const mutation = new MutationObserver(callback);
        if (target) mutation.observe(target, options || { subtree: true, childList: true });
        return mutation;
    }

    function isTheater() {
        return main().getAttribute(attr.role) == "main" && main().hasAttribute(attr.theater);
    }

    function onScrollPage() {
        app().toggleAttribute(attr.hidden_header, !window.scrollY);
    }

    /**
     * @param {KeyboardEvent} event
     */
    function onPressEscape(event) {
        if (event.key == "Escape") document.dispatchEvent(keyToggleTheater);
    }

    function watchTheaterMode() {
        const state = isTheater();

        if (state && !html.hasAttribute(attr.theater)) {
            html.setAttribute(attr.theater, "");
            app().setAttribute(attr.hidden_header, "");

            window.addEventListener("scroll", onScrollPage);
            window.addEventListener("keydown", onPressEscape);
        } else if (!state) {
            html.removeAttribute(attr.theater);
            app().removeAttribute(attr.hidden_header);

            window.removeEventListener("scroll", onScrollPage);
            window.removeEventListener("keydown", onPressEscape);
        }
    }

    function initMain() {
        observer(watchTheaterMode, main(), {
            attributeFilter: [attr.id, attr.role, attr.theater],
        });
    }

    observer((_, mobs) => {
        if (main()) {
            initMain();
            mobs.disconnect();
        }
    }, document.body);
})();
