// ==UserScript==
// @name         Redirect YouTube Shorts
// @version      2.0.5
// @description  Seamlessly redirect YouTube Shorts to the regular video player WITHOUT page reload
// @run-at       document-start
// @inject-into  page
// @match        https://www.youtube.com/*
// @exclude      https://*.youtube.com/live_chat*
// @exclude      https://*.youtube.com/embed*
// @exclude      https://*.youtube.com/tv*
// @exclude      https:/tv.youtube.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=youtube.com
// @updateURL    https://github.com/fznhq/userscript-collection/raw/main/Redirect_Youtube_Shorts.user.js
// @downloadURL  https://github.com/fznhq/userscript-collection/raw/main/Redirect_Youtube_Shorts.user.js
// @author       Fznhq
// @namespace    https://github.com/fznhq
// @homepageURL  https://github.com/fznhq/userscript-collection
// @license      GNU GPLv3
// ==/UserScript==

(function () {
    if (location.pathname.startsWith("/shorts")) {
        return location.replace(location.href.replace("/shorts/", "/watch?v="));
    }

    /**
     * @param {object} obj
     * @param {string} target
     * @returns {any}
     */
    function dig(obj, target) {
        if (obj && typeof obj === "object") {
            if (target in obj && !dig(obj[target], target)) return obj;
            for (const k in obj) {
                const result = dig(obj[k], target);
                if (result !== undefined) return result;
            }
        }
    }

    /**
     * @param {HTMLAnchorElement} element
     * @returns {object | undefined}
     */
    function findShortData(element) {
        while (element && element.tagName !== "YTD-APP") {
            const data = dig(element.data, "reelWatchEndpoint");
            if (data) return data;
            element = element.parentElement;
        }
    }

    /**
     * @param {string} id
     */
    function redirectShorts(id) {
        const elements = document.querySelectorAll(`a[href*="shorts/${id}"]`);

        for (const element of elements) {
            const command = findShortData(element);

            if (command && command.reelWatchEndpoint.videoId === id) {
                const metadata = dig(command, "url");
                metadata.url = `/watch?v=${id}`;
                metadata.webPageType = "WEB_PAGE_TYPE_WATCH";
                command.watchEndpoint = { videoId: id };
                command.reelWatchEndpoint = {};
            }
        }
    }

    const idRegex = /(?:shorts\/|watch\?v=)([^#\&\?]*)/;

    function handleShorts(/** @type {MouseEvent} */ ev) {
        /** @type {HTMLElement} */
        const target = ev.target;

        if (target.closest) {
            const query = "a[href*='/shorts/'], a[href*='/watch?v=']";
            const url = target.closest(query);
            if (url) redirectShorts(url.href.match(idRegex)[1]);
        }
    }

    window.addEventListener("click", handleShorts, true);
})();
