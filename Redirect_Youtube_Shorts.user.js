// ==UserScript==
// @name         Redirect YouTube Shorts
// @version      2.0.2
// @description  Seamlessly redirect YouTube Shorts to the regular video player WITHOUT a page reload
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
    const shortIdRegex = /(?:shorts\/)([^#\&\?]*)/;

    /**
     * @param {string} url
     * @returns {string | null}
     */
    function parseId(url) {
        url = url.match(shortIdRegex);
        return url && url[1];
    }

    const shortId = parseId(location.href);
    if (shortId) return location.replace("/watch?v=" + shortId);

    /**
     * @param {object} obj
     * @param {string} target
     * @param {boolean} returnParent
     * @returns {any}
     */
    function dig(obj, target, returnParent = false) {
        if (obj && typeof obj === "object") {
            if (target in obj && !dig(obj[target], target)) {
                return returnParent ? obj : obj[target];
            }
            for (const k in obj) {
                const result = dig(obj[k], target, returnParent);
                if (result !== undefined) return result;
            }
        }
    }

    /**
     * @param {HTMLAnchorElement} element
     * @returns {object | undefined}
     */
    function findShortData(element) {
        while (element) {
            const data = dig(element.data, "reelWatchEndpoint", true);
            if (data) return data;
            element = element.parentElement;
        }
    }

    /**
     * @param {string} id
     */
    function redirectShort(id) {
        const short = document.querySelector(`#contents a[href*="${id}"]`);
        const command = findShortData(short);

        if (command && dig(command, "videoId") === id) {
            const metadata = dig(command, "webCommandMetadata");
            metadata.url = `/watch?v=${id}`;
            metadata.webPageType = "WEB_PAGE_TYPE_WATCH";
            command.watchEndpoint = { videoId: id };
            delete command.reelWatchEndpoint;
        }
    }

    function handleShorts(/** @type {MouseEvent} */ ev) {
        /** @type {HTMLElement} */
        const target = ev.target;

        if (target.closest) {
            const short = target.closest("a[href*=short]");
            if (short) redirectShort(parseId(short.href));
        }
    }

    window.addEventListener("click", handleShorts, true);
})();
