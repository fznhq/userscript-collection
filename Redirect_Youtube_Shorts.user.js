// ==UserScript==
// @name         Redirect YouTube Shorts
// @version      2.0.0
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
     * @returns {any}
     */
    function dig(obj, target) {
        if (obj && typeof obj == "object") {
            if (target in obj) return obj[target];
            for (const k in obj) {
                const result = dig(obj[k], target);
                if (result !== undefined) return result;
            }
        }
    }

    /**
     * @param {HTMLAnchorElement} element
     * @param {string} key
     * @returns {object}
     */
    function findData(element, key) {
        let data;

        while (element && !(data = dig(element.data, key))) {
            element = element.parentElement;
        }

        return data || {};
    }
    /**
     * @param {string} id
     */
    function redirectShort(id) {
        const element = document.querySelector(`#contents a[href*="${id}"]`);
        const onTap = findData(element, "onTap");
        const metadata = dig(onTap, "webCommandMetadata");

        if (onTap.innertubeCommand && metadata) {
            metadata.url = `/watch?v=${id}`;
            metadata.webPageType = "WEB_PAGE_TYPE_WATCH";
            delete onTap.innertubeCommand.reelWatchEndpoint;
            onTap.innertubeCommand.watchEndpoint = { videoId: id };
        }
    }

    function handleShortClick(/** @type {MouseEvent} */ ev) {
        /** @type {HTMLElement} */
        const target = ev.target;

        if (target.closest) {
            const short = target.closest("a[href*=short]");
            if (short) redirectShort(parseId(short.href));
        }
    }

    window.addEventListener("click", handleShortClick, true);
})();
