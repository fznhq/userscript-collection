// ==UserScript==
// @name         Redirect YouTube Shorts
// @version      0.0.6
// @description  Seamlessly redirect YouTube Shorts to regular video player
// @run-at       document-start
// @inject-into  content
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
    const mainFunction = function () {
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

        /** @type {Function | undefined} */
        let taskCleanup = undefined;

        function runCleanup() {
            if (taskCleanup) taskCleanup = taskCleanup();
        }

        /**
         * @param {string} linkQuery
         * @param {string} key
         * @returns {{link: HTMLElement, data: object} | undefined}
         */
        function findData(linkQuery, key) {
            const elements = document.querySelectorAll(linkQuery);

            for (let element of elements) {
                let data;

                while (
                    element.id != "contents" &&
                    !(element.data && element.data.contents) &&
                    !(data = dig(element.data, key))
                ) {
                    element = element.parentElement;
                }

                if (data) return { a: element.querySelector("a"), data };
            }
        }

        /**
         * @param {string} id
         * @returns {boolean}
         */
        function redirectShort(id) {
            const onTap = findData(`#contents a[href*="${id}"]`, "onTap");
            const navEnpoint = findData(
                "#contents a[class*=thumbnail][href*=watch]",
                "navigationEndpoint"
            );

            if (!onTap || !navEnpoint) return false;

            const trackingParams = dig(onTap.data, "clickTrackingParams");
            const metadataEndpoint = dig(navEnpoint.data, "webCommandMetadata");
            const wathcEndpoint = dig(navEnpoint.data, "watchEndpoint");
            const prevTracking = navEnpoint.data.clickTrackingParams;
            const prevUrl = metadataEndpoint.url;
            const prevId = wathcEndpoint.videoId;

            function setData(params, url, id) {
                navEnpoint.data.clickTrackingParams = params;
                metadataEndpoint.url = url;
                wathcEndpoint.videoId = id;
            }

            setData(trackingParams, `/watch?v=${id}`, id);
            navEnpoint.a.click();

            taskCleanup = () => {
                setTimeout(() => setData(prevTracking, prevUrl, prevId), 500);
            };

            return true;
        }

        function handleShortClick(/** @type {MouseEvent} */ ev) {
            /** @type {HTMLElement} */
            const target = ev.target;

            if (target.closest) {
                const short = target.closest("a[href*=short]");

                if (short && redirectShort(parseId(short.href))) {
                    ev.stopPropagation();
                    ev.preventDefault();
                }
            }
        }

        window.addEventListener("click", handleShortClick, true);
        document.addEventListener("yt-navigate-finish", runCleanup);
    }.toString();

    new MutationObserver((_, observe) => {
        if (!document.head) return;

        observe.disconnect();

        const policyName = "redirect-short-" + Date.now();
        const policyOptions = { createScript: (script) => script };
        const policy = window.trustedTypes
            ? window.trustedTypes.createPolicy(policyName, policyOptions)
            : policyOptions;
        const script = document.createElement("script");
        script.textContent = policy.createScript(`(${mainFunction})();`);
        document.head.append(script);
    }).observe(document, { subtree: true, childList: true });
})();
