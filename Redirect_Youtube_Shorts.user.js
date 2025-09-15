// ==UserScript==//
// @name            Redirect YouTube Shorts
// @name:en         Redirect YouTube Shorts
// @name:id         Redirect YouTube Shorts
// @name:zh-CN      Redirect YouTube Shorts
// @name:zh-TW      Redirect YouTube Shorts
// @name:ja         Redirect YouTube Shorts
// @name:ko         Redirect YouTube Shorts
// @name:fr         Redirect YouTube Shorts
// @name:es         Redirect YouTube Shorts
// @name:de         Redirect YouTube Shorts
// @name:ru         Redirect YouTube Shorts
// @description     Seamlessly redirect YouTube Shorts to the regular video player without reloading the page
// @description:en  Seamlessly redirect YouTube Shorts to the regular video player without reloading the page
// @description:id  Alihkan YouTube Shorts secara otomatis ke pemutar video biasa tanpa perlu memuat ulang halaman
// @description:zh-CN  自动将 YouTube Shorts 无缝跳转到普通视频播放器，无需刷新页面
// @description:zh-TW  自動將 YouTube Shorts 無縫跳轉到一般影片播放器，無需重新整理頁面
// @description:ja  ページを再読み込みせずに YouTube Shorts を通常の動画プレーヤーで自動再生します
// @description:ko  페이지 새로고침 없이 YouTube 쇼츠를 일반 동영상 플레이어로 자동 전환합니다
// @description:fr  Redirige automatiquement les YouTube Shorts vers le lecteur classique, sans rechargement de la page
// @description:es  Redirige automáticamente YouTube Shorts al reproductor normal sin recargar la página
// @description:de  Leitet YouTube Shorts automatisch zum normalen Videoplayer um, ohne die Seite neu zu laden
// @description:ru  Автоматически перенаправляет YouTube Shorts в обычный видеоплеер без перезагрузки страницы
// @version         2.0.9
// @run-at          document-start
// @inject-into     page
// @match           https://www.youtube.com/*
// @exclude         https://*.youtube.com/live_chat*
// @exclude         https://*.youtube.com/embed*
// @exclude         https://*.youtube.com/tv*
// @icon            https://www.google.com/s2/favicons?sz=64&domain=youtube.com
// @updateURL       https://github.com/fznhq/userscript-collection/raw/main/Redirect_Youtube_Shorts.user.js
// @downloadURL     https://github.com/fznhq/userscript-collection/raw/main/Redirect_Youtube_Shorts.user.js
// @author          Fznhq
// @namespace       https://github.com/fznhq
// @homepageURL     https://github.com/fznhq/userscript-collection
// @license         GNU GPLv3
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
        const elements = document.querySelectorAll(`a[href*="${id}"]`);

        for (const element of elements) {
            const command = findShortData(element);
            const url = (element.href = `/watch?v=${id}`);

            if (command && command.reelWatchEndpoint.videoId === id) {
                const metadata = dig(command, "url");
                metadata.url = url;
                metadata.webPageType = "WEB_PAGE_TYPE_WATCH";
                command.watchEndpoint = { videoId: id };
                command.reelWatchEndpoint = {};
            }
        }
    }

    const idRegex = /shorts\/([^#&?]*)/;

    function handleShorts(/** @type {MouseEvent} */ ev) {
        /** @type {HTMLElement} */
        const target = ev.target;

        if (target.closest) {
            const url = target.closest("a[href*='/shorts/']");
            if (url) redirectShorts(url.href.match(idRegex)[1]);
        }
    }

    window.addEventListener("click", handleShorts, true);
    window.addEventListener("mouseover", handleShorts, true);
})();
