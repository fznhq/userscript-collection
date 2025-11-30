// ==UserScript==
// @name               Redirect YouTube Shorts
// @name:en            Redirect YouTube Shorts
// @name:id            Redirect YouTube Shorts
// @name:zh-CN         Redirect YouTube Shorts
// @name:zh-TW         Redirect YouTube Shorts
// @name:ja            Redirect YouTube Shorts
// @name:ko            Redirect YouTube Shorts
// @name:fr            Redirect YouTube Shorts
// @name:es            Redirect YouTube Shorts
// @name:de            Redirect YouTube Shorts
// @name:ru            Redirect YouTube Shorts
// @description        Seamlessly redirect YouTube Shorts to the regular video player without reloading the page
// @description:en     Seamlessly redirect YouTube Shorts to the regular video player without reloading the page
// @description:id     Alihkan YouTube Shorts secara otomatis ke pemutar video biasa tanpa perlu memuat ulang halaman
// @description:zh-CN  自动将 YouTube Shorts 无缝跳转到普通视频播放器，无需刷新页面
// @description:zh-TW  自動將 YouTube Shorts 無縫跳轉到一般影片播放器，無需重新整理頁面
// @description:ja     ページを再読み込みせずに YouTube Shorts を通常の動画プレーヤーで自動再生します
// @description:ko     페이지 새로고침 없이 YouTube 쇼츠를 일반 동영상 플레이어로 자동 전환합니다
// @description:fr     Redirige automatiquement les YouTube Shorts vers le lecteur classique, sans rechargement de la page
// @description:es     Redirige automáticamente YouTube Shorts al reproductor normal sin recargar la página
// @description:de     Leitet YouTube Shorts automatisch zum normalen Videoplayer um, ohne die Seite neu zu laden
// @description:ru     Автоматически перенаправляет YouTube Shorts в обычный видеоплеер без перезагрузки страницы
// @version            2.2.2
// @run-at             document-start
// @inject-into        page
// @match              https://www.youtube.com/*
// @exclude            https://*.youtube.com/live_chat*
// @exclude            https://*.youtube.com/embed*
// @exclude            https://*.youtube.com/tv*
// @icon               https://www.google.com/s2/favicons?sz=64&domain=youtube.com
// @updateURL          https://github.com/fznhq/userscript-collection/raw/main/Redirect_Youtube_Shorts.user.js
// @downloadURL        https://github.com/fznhq/userscript-collection/raw/main/Redirect_Youtube_Shorts.user.js
// @author             Fznhq
// @namespace          https://github.com/fznhq
// @homepageURL        https://github.com/fznhq/userscript-collection
// @homepage           https://github.com/fznhq/userscript-collection
// @compatible         firefox
// @compatible         chrome
// @compatible         safari
// @compatible         opera
// @compatible         edge
// @license            GNU GPLv3
// ==/UserScript==

(function () {
    if (location.pathname.startsWith("/shorts")) {
        return location.replace(location.href.replace("/shorts/", "/watch?v="));
    }

    /**
     * @param {object} obj
     * @param {string} target
     * @param {any} [value]
     * @param {boolean} [parent]
     * @returns {any}
     */
    function dig(obj, target, value, parent, _parent_obj) {
        if (!obj || typeof obj !== "object") return;

        if (target in obj) {
            if (value ? obj[target] === value : !dig(obj[target], target)) {
                const output = (parent && _parent_obj) || obj;
                if (!parent || output.reelWatchEndpoint) return output;
            }
        }

        for (const k in obj) {
            const result = dig(obj[k], target, value, parent, obj);
            if (result !== undefined) return result;
        }
    }

    /**
     * @param {HTMLAnchorElement} element
     * @param {string} id
     * @returns {object | undefined}
     */
    function findData(element, id) {
        while (element && element.tagName !== "YTD-APP") {
            const data = dig(element.data, "videoId", id, true);
            if (data) return data;
            element = element.parentElement;
        }
    }

    /**
     * @param {string} id
     */
    function redirectShorts(id) {
        for (const element of document.querySelectorAll(`a[href*="${id}"]`)) {
            const url = (element.href = `/watch?v=${id}`);
            const data = findData(element, id);

            if (data && data.reelWatchEndpoint.videoId) {
                const metadata = dig(data, "url");
                metadata.url = url;
                metadata.webPageType = "WEB_PAGE_TYPE_WATCH";
                data.watchEndpoint = { videoId: id };
                data.reelWatchEndpoint = {};
            }
        }
    }

    const idRegex = /shorts\/([^#&?]*)/;

    function handleShorts(/** @type {MouseEvent} */ ev) {
        const url = ev.target.closest?.("a[href^='/shorts/']");
        if (url) redirectShorts(url.href.match(idRegex)[1]);
    }

    window.addEventListener("click", handleShorts, true);
    window.addEventListener("mouseover", handleShorts, true);
})();
