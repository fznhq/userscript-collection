// ==UserScript==
// @name         Dark Theme Stackoverflow
// @description  Apply stackoverflow dark theme without login
// @version      0.1
// @run-at       document-start
// @match        https://*.stackoverflow.com/*
// @icon         https://stackoverflow.com/favicon.ico
// @updateURL    https://github.com/fznhq/tampermonkey-collection/raw/main/Dark_Theme_Stackoverflow.user.js
// @downloadURL  https://github.com/fznhq/tampermonkey-collection/raw/main/Dark_Theme_Stackoverflow.user.js
// @author       Fznhq
// @namespace    https://github.com/fznhq
// @homepageURL  https://github.com/fznhq/tampermonkey-collection
// ==/UserScript==

(function () {
    "use strict";

    new MutationObserver((_, observer) => {
        if (document.body) {
            document.body.classList.add("theme-dark");
            observer.disconnect();
        }
    }).observe(document.documentElement, { subtree: true, childList: true });
})();
