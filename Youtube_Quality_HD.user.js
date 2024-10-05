// ==UserScript==
// @name         Youtube Quality HD
// @version      1.3.0
// @description  Automatically select your desired video quality and select premium when posibble. (Support YouTube short)
// @run-at       document-body
// @match        https://www.youtube.com/*
// @exclude      https://*.youtube.com/live_chat*
// @exclude      https://*.youtube.com/tv*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=youtube.com
// @grant        GM.getValue
// @grant        GM.setValue
// @grant        unsafeWindow
// @updateURL    https://github.com/fznhq/userscript-collection/raw/main/Youtube_Quality_HD.user.js
// @downloadURL  https://github.com/fznhq/userscript-collection/raw/main/Youtube_Quality_HD.user.js
// @author       Fznhq
// @namespace    https://github.com/fznhq
// @homepageURL  https://github.com/fznhq/userscript-collection
// @license      GNU GPLv3
// ==/UserScript==

// Icons provided by https://uxwing.com/

(async function () {
    "use strict";

    /** @type {Window} */
    const win = unsafeWindow;
    const listQuality = [144, 240, 360, 480, 720, 1080, 1440, 2160, 2880, 4320];
    const defaultPreferredQuality = 1080;

    let manualOverride = false;
    let isUpdated = false;

    /** @namespace */
    const options = {
        preferred_quality: defaultPreferredQuality,
        preferred_premium: true,
        updated_id: "",
    };

    const icons = {
        premium: `{"svg":{"viewBox":"-12 -12 147 119"},"path":{"fill":"white","d":"M1 28 20 1a3 3 0 0 1 3-1h77a3 3 0 0 1 3 1l19 27a3 3 0 0 1 1 2 3 3 0 0 1-1 2L64 94a3 3 0 0 1-4 0L1 32a3 3 0 0 1-1-1 3 3 0 0 1 1-3m44 5 17 51 17-51Zm39 0L68 82l46-49ZM56 82 39 33H9zM28 5l13 20L56 5Zm39 0 15 20L95 5Zm33 2L87 27h28zM77 27 61 7 47 27Zm-41 0L22 7 8 27Z"}}`,
        quality: `{"svg":{"viewBox":"-12 -12 147 131"},"path":{"fill":"white","fill-rule":"evenodd","d":"M113 57a4 4 0 0 1 2 1l3 4a5 5 0 0 1 1 2 4 4 0 0 1 0 1 4 4 0 0 1 0 2 4 4 0 0 1-1 1l-3 2v1l1 1v2h3a4 4 0 0 1 3 1 4 4 0 0 1 1 2 4 4 0 0 1 0 1l-1 6a4 4 0 0 1-1 3 4 4 0 0 1-3 1h-3l-1 1-1 1v1l2 2a4 4 0 0 1 1 1 4 4 0 0 1-1 3 4 4 0 0 1-1 2l-4 3a4 4 0 0 1-1 1 4 4 0 0 1-2 0 5 5 0 0 1-1 0 4 4 0 0 1-2-1l-2-3a1 1 0 0 1 0 1h-3v3a4 4 0 0 1-1 2 4 4 0 0 1-1 1 4 4 0 0 1-1 1 4 4 0 0 1-2 0h-5a4 4 0 0 1-4-5v-3l-2-1-1-1-2 2a4 4 0 0 1-2 1 4 4 0 0 1-1 0 4 4 0 0 1-2 0 4 4 0 0 1-1-1l-4-4a5 5 0 0 1 0-2 4 4 0 0 1-1-2 4 4 0 0 1 2-3l2-2v-1l-1-2h-2a4 4 0 0 1-2-1 4 4 0 0 1-1-1 4 4 0 0 1-1-1 4 4 0 0 1 0-2v-5a4 4 0 0 1 1-2 5 5 0 0 1 1-1 4 4 0 0 1 1-1 4 4 0 0 1 2 0h3l1-1v-2l-1-2a4 4 0 0 1-1-1 4 4 0 0 1 0-2 4 4 0 0 1 0-2 4 4 0 0 1 1-1l4-3a5 5 0 0 1 2-1 4 4 0 0 1 1-1 4 4 0 0 1 2 1 4 4 0 0 1 1 1l2 2h2l1-1 1-2a4 4 0 0 1 0-2 4 4 0 0 1 1-1 4 4 0 0 1 2-1 4 4 0 0 1 1 0h6a5 5 0 0 1 1 1 4 4 0 0 1 2 1 4 4 0 0 1 0 1 4 4 0 0 1 1 2l-1 3h1l1 1 1 1 3-2a4 4 0 0 1 1-1 4 4 0 0 1 2 0 4 4 0 0 1 1 0M11 0h82a11 11 0 0 1 11 11v30h-1a11 11 0 0 0-2-1h-2V21H5v49h51a12 12 0 0 0 0 2v4h-1v11h4l1 1h1l-1 1a12 12 0 0 0 0 2v1H11A11 11 0 0 1 0 81V11A11 11 0 0 1 11 0m35 31 19 13a3 3 0 0 1 0 4L47 61a3 3 0 0 1-2 0 3 3 0 0 1-3-2V33l1-1a3 3 0 0 1 3-1m4 56V76H29v11ZM24 76H5v5a6 6 0 0 0 6 6h13zm52-60V5H55v11Zm5-11v11h18v-5a6 6 0 0 0-6-6ZM50 16V5H29v11Zm-26 0V5H11a6 6 0 0 0-6 6v5Zm70 56a6 6 0 1 1-6 7 6 6 0 0 1 6-7m-1-8a14 14 0 1 1-13 16 14 14 0 0 1 13-16"}}`,
    };

    /**
     * @param {string} name
     * @param {boolean} value
     * @returns {boolean}
     */
    function saveOption(name, value) {
        GM.setValue(name, value);
        return (options[name] = value);
    }

    for (const name in options) {
        const saved_option = await GM.getValue(name);

        if (saved_option === undefined) {
            saveOption(name, options[name]);
        } else {
            options[name] = saved_option;
        }
    }

    /**
     * @param {string} name
     * @param {object} attributes
     * @param {Array} append
     * @returns {SVGElement}
     */
    function createNS(name, attributes = {}, append = []) {
        const el = document.createElementNS("http://www.w3.org/2000/svg", name);
        for (const k in attributes) el.setAttributeNS(null, k, attributes[k]);
        return el.append(...append), el;
    }

    for (const name in icons) {
        const icon = JSON.parse(icons[name]);
        icons[name] = createNS("svg", icon.svg, [createNS("path", icon.path)]);
    }

    /**
     * @param {Document | HTMLElement} context
     * @param {string} query
     */
    function find(context, query) {
        return context.querySelector(query);
    }

    /**
     * @param {string} query
     * @param {boolean} cache
     * @returns {() => HTMLElement | null}
     */
    function $(query, cache = true) {
        let element = null;
        return () => (cache && element) || (element = find(document, query));
    }

    const allowedIds = ["#movie_player", "#shorts-player"];
    const cachePlayers = new Set();
    const cacheTextQuality = new Set();
    const element = {
        settings: $(".ytp-settings-menu"),
        panel_settings: $(".ytp-settings-menu .ytp-panel-menu"),
        quality_menu: $(".ytp-quality-menu", false),
        movie_player: $(allowedIds[0]),
        short_player: $(allowedIds[1]),
        popup_menu: $("ytd-popup-container ytd-menu-service-item-renderer"),
        // Reserve Element
        premium_menu: document.createElement("div"),
    };

    /**
     * @param {MutationCallback} callback
     * @param {Node} target
     * @param {MutationObserverInit | undefined} options
     * @returns {MutationObserver}
     */
    function observer(callback, target, options) {
        const mutation = new MutationObserver(callback);
        mutation.observe(target, options || { subtree: true, childList: true });
        return mutation;
    }

    /**
     * @param {string} label
     * @returns {number}
     */
    function parseQualityLabel(label) {
        return parseInt(label.slice(0, 4), 10);
    }

    /**
     * @typedef {object} QualityData
     * @property {any} formatId
     * @property {string} qualityLabel
     * @property {string} quality
     * @property {boolean} isPlayable
     */

    /**
     * @typedef {object} Player
     * @property {() => string} getPlaybackQualityLabel
     * @property {() => QualityData[]} getAvailableQualityData
     * @property {Function} setPlaybackQualityRange
     */

    /**
     * @param {QualityData[]} qualityData
     * @returns {number}
     */
    function getPreferredQuality(qualityData) {
        const currentMaxQuality = Math.max(
            ...qualityData.map((data) => parseQualityLabel(data.qualityLabel))
        );

        return !isFinite(currentMaxQuality) ||
            currentMaxQuality > options.preferred_quality
            ? options.preferred_quality
            : currentMaxQuality;
    }

    /**
     * @param {HTMLElement} player
     * @param {QualityData[]} qualityData
     * @param {number} preferred
     * @returns {QualityData}
     */
    function getQuality(player, qualityData, preferred) {
        const q = { premium: null, normal: null };
        const short = player.id.includes("short");
        let indexQuality = listQuality.indexOf(preferred);

        while (
            indexQuality-- &&
            !qualityData.some((data) => {
                return parseQualityLabel(data.qualityLabel) == preferred;
            })
        ) {
            preferred = listQuality[indexQuality];
        }

        qualityData.forEach((data) => {
            const label = data.qualityLabel.toLowerCase();
            if (parseQualityLabel(label) == preferred && data.isPlayable) {
                if (label.includes("premium")) q.premium = data;
                else q.normal = data;
            }
        });

        return (options.preferred_premium && !short && q.premium) || q.normal;
    }

    function setVideoQuality() {
        if (manualOverride) return;
        if (isUpdated) return (isUpdated = false);

        /** @type {Player} */
        const player = this;
        const label = player.getPlaybackQualityLabel();
        const quality = parseQualityLabel(label);
        const qualityData = player.getAvailableQualityData();
        const preferred = getPreferredQuality(qualityData);
        const selected = getQuality(player, qualityData, preferred);

        if (
            quality &&
            selected &&
            listQuality.includes(quality) &&
            (isUpdated = quality != preferred || selected.qualityLabel != label)
        ) {
            player.setPlaybackQualityRange(
                selected.quality,
                selected.quality,
                selected.formatId
            );
        }
    }

    function generateSimpleId() {
        const randStr = () => Math.random().toString(36).slice(2, 3);
        return [...Array(16)].map(randStr).join("");
    }

    function triggerSyncOptions() {
        isUpdated = false;
        const id = generateSimpleId();
        GM.setValue("updated_id", id).then(() => (options.updated_id = id));
    }

    /**
     *
     * @param {keyof options} optionName
     * @param {any} newValue
     * @param {HTMLElement} player
     * @returns {any}
     */
    function savePreferred(optionName, newValue, player) {
        saveOption(optionName, newValue);
        triggerSyncOptions();
        setVideoQuality.call(player);
        return newValue;
    }

    /**
     * @param {string} className
     * @param {Array} append
     * @returns {HTMLDivElement}
     */
    function itemElement(className = "", append = []) {
        const el = document.createElement("div");
        el.className = "ytp-menuitem" + (className ? "-" + className : "");
        return el.append(...append), el;
    }

    function createMenuItem(svgIcon, textLabel, checkbox = false) {
        const inner = checkbox ? [itemElement("toggle-checkbox")] : [];
        const content = itemElement("content", inner);
        const item = itemElement("", [
            itemElement("icon", [svgIcon]),
            itemElement("label", [textLabel]),
            content,
        ]);
        return { item, content };
    }

    /**
     * @param {HTMLElement} element
     * @param {boolean} state
     */
    function setChecked(element, state) {
        element.setAttribute("aria-checked", state);
    }

    function premiumMenu() {
        const menu = createMenuItem(icons.premium, "Preferred Premium", true);
        const name = "preferred_premium";

        setChecked(menu.item, options[name]);
        menu.item.addEventListener("click", function () {
            const player = element.movie_player();
            setChecked(this, savePreferred(name, !options[name], player));
        });

        return (element.premium_menu = menu.item);
    }

    /**
     * @param {string} value
     * @param {Text | undefined} text
     */
    function setTextQuality(value, text) {
        if (text) cacheTextQuality.add(text);

        cacheTextQuality.forEach((qualityText) => {
            qualityText.textContent = value + "p";
        });
    }

    /**
     * @param {HTMLElement} content
     * @param {HTMLElement} player
     */
    function qualityOption(content, player) {
        const name = "preferred_quality";
        const text = document.createTextNode("");

        Object.assign(content.style, {
            cursor: "pointer",
            fontWeight: 500,
            textAlignLast: "justify",
        });

        setTextQuality(options[name], text);

        content.append("< ", text, " >");
        content.addEventListener("click", function (ev) {
            const threshold = this.clientWidth / 2;
            const offset = this.getBoundingClientRect();
            const clickPos = ev.clientX - offset.left;
            let pos = listQuality.indexOf(options[name]);

            if (
                (clickPos < threshold && pos > 0 && pos--) ||
                (clickPos > threshold && pos < listQuality.length - 1 && ++pos)
            ) {
                manualOverride = false;
                setTextQuality(savePreferred(name, listQuality[pos], player));
            }
        });
    }

    function qualityMenu() {
        const menu = createMenuItem(icons.quality, "Preferred Quality");

        menu.item.style.cursor = "default";
        menu.content.style.fontSize = "130%";
        menu.content.style.wordSpacing = "2rem";

        qualityOption(menu.content, element.movie_player());
        return menu.item;
    }

    function shortQualityMenuStyle() {
        const replaceList = {
            "ytd-menu-service-item-renderer": ".ytp-menuitem-custom-element",
            "tp-yt-paper-item": ".item",
            "yt-icon": ".icon",
            "yt-formatted-string": ".message",
        };
        const tags = Object.keys(replaceList);
        const styleElement = document.createElement("style");

        function replaceTag(css) {
            css = css.replace(/\[system-icons\]|\[use-icons\]/gi, "");
            for (const k in replaceList) {
                css = css.replaceAll("." + k, "").replaceAll(k, replaceList[k]);
            }
            return css;
        }

        function replaceSelector(css) {
            let [selector, content] = css.split("{");
            selector = selector.split(",").map((query) => {
                query = query.trim();
                const menu = replaceList["ytd-menu-service-item-renderer"];
                if (!query.startsWith(menu)) query = menu + " " + query;
                return query;
            });
            return selector.join(",") + "{" + content;
        }

        function checkSelector(selector) {
            return (
                selector &&
                tags.some(
                    (tag) =>
                        !selector.includes(tag + "-") &&
                        !selector.includes("." + tag) &&
                        selector.includes(tag)
                )
            );
        }

        for (const styles of document.styleSheets) {
            try {
                for (const rule of styles.cssRules) {
                    if (checkSelector(rule.selectorText)) {
                        styleElement.textContent += replaceSelector(
                            replaceTag(rule.cssText)
                        );
                    }
                }
            } catch (e) {}
        }

        document.head.append(styleElement);
    }

    function shortQualityMenu() {
        const options = itemElement(" message");
        const menu = itemElement("custom-element", [
            itemElement(" item", [
                itemElement(" icon", [
                    itemElement(" yt-icon-shape yt-spec-icon-shape", [
                        icons.quality.cloneNode(true),
                    ]),
                ]),
                itemElement(" message", ["Preferred Quality"]),
                options,
            ]),
        ]);

        menu.style.userSelect = "none";
        menu.style.cursor = "default";
        options.style.paddingInline = "24px";
        options.style.margin = 0;
        options.style.minWidth = "100px";

        qualityOption(options, element.short_player());
        return menu;
    }

    /**
     * @param {MouseEvent} ev
     */
    function setOverride(ev) {
        const menu = element.quality_menu();
        const quality = parseQualityLabel(ev.target.textContent);
        if (menu && listQuality.includes(quality)) manualOverride = true;
    }

    /**
     * @param {HTMLElement} player
     */
    function addVideoListener(player) {
        if (cachePlayers.has(player)) return;
        cachePlayers.add(player);
        const video = find(player, "video");
        const fn = setVideoQuality.bind(player);
        video.addEventListener("play", () => setTimeout(fn, 200));
        video.addEventListener("resize", fn);
    }

    /**
     * @param {CustomEvent} ev
     */
    function playerUpdated(ev) {
        const target = ev.target;
        let player = null;
        if (allowedIds.some((id) => (player = find(target, id)))) {
            isUpdated = false;
            manualOverride = false;
            addVideoListener(player);
        }
    }

    async function syncOptions() {
        if ((await GM.getValue("updated_id")) != options.updated_id) {
            isUpdated = false;
            for (const name in options) options[name] = await GM.getValue(name);
            setChecked(element.premium_menu, options.preferred_premium);
            setTextQuality(options.preferred_quality);
            cachePlayers.forEach((player) => {
                const video = find(player, "video");
                if (!video.paused) setVideoQuality.call(player);
            });
        }
    }

    (function checkOptions() {
        setTimeout(() => syncOptions().then(checkOptions), 1e3);
    })();

    function initShortMenu() {
        const short = win.location.pathname.startsWith("/short");
        const menu = element.popup_menu();

        if (short && menu) {
            shortQualityMenuStyle();
            const item = menu.parentElement;
            item.append(shortQualityMenu());
            win.removeEventListener("click", initShortMenu);
        }
    }

    win.addEventListener("click", initShortMenu);

    observer((_, observe) => {
        const movie_player = element.movie_player();
        const short_player = element.short_player();

        if (short_player) addVideoListener(short_player);

        if (movie_player) {
            addVideoListener(movie_player);
            element.panel_settings().append(premiumMenu(), qualityMenu());
            element.settings().addEventListener("click", setOverride, true);
            document.addEventListener("yt-player-updated", playerUpdated);
            observe.disconnect();
        }
    }, document.body);
})();
