// ==UserScript==
// @name         YouTube HD Plus
// @version      2.1.8
// @description  Automatically select your desired video quality and select premium when posibble. (Support YouTube Desktop, Music & Mobile)
// @run-at       document-body
// @inject-into  content
// @match        https://www.youtube.com/*
// @match        https://www.youtube-nocookie.com/*
// @match        https://m.youtube.com/*
// @match        https://music.youtube.com/*
// @exclude      https://*.youtube.com/live_chat*
// @exclude      https://*.youtube.com/tv*
// @exclude      https:/tv.youtube.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=youtube.com
// @grant        GM.getValue
// @grant        GM.setValue
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

    const body = document.body;
    const head = document.head;

    const $host = location.hostname;
    const isMobile = $host.includes("m.youtube");
    const isMusic = $host.includes("music.youtube");

    const listQuality = [144, 240, 360, 480, 720, 1080, 1440, 2160, 2880, 4320];
    const defaultQuality = 1080;

    let firstSetQuality = true;
    let manualOverride = false;
    let isUpdated = false;
    let settingsClicked = false;

    /** @namespace */
    const options = {
        preferred_quality: defaultQuality,
        preferred_premium: true,
        updated_id: "",
    };

    const icons = {
        premium: `{"svg":{"viewBox":"-12 -12 147 119"},"path":{"d":"M1 28 20 1a3 3 0 0 1 3-1h77a3 3 0 0 1 3 1l19 27a3 3 0 0 1 1 2 3 3 0 0 1-1 2L64 94a3 3 0 0 1-4 0L1 32a3 3 0 0 1-1-1 3 3 0 0 1 1-3m44 5 17 51 17-51Zm39 0L68 82l46-49ZM56 82 39 33H9zM28 5l13 20L56 5Zm39 0 15 20L95 5Zm33 2L87 27h28zM77 27 61 7 47 27Zm-41 0L22 7 8 27Z"}}`,
        quality: `{"svg":{"viewBox":"-12 -12 147 131"},"path":{"fill-rule":"evenodd","d":"M113 57a4 4 0 0 1 2 1l3 4a5 5 0 0 1 1 2 4 4 0 0 1 0 1 4 4 0 0 1 0 2 4 4 0 0 1-1 1l-3 2v1l1 1v2h3a4 4 0 0 1 3 1 4 4 0 0 1 1 2 4 4 0 0 1 0 1l-1 6a4 4 0 0 1-1 3 4 4 0 0 1-3 1h-3l-1 1-1 1v1l2 2a4 4 0 0 1 1 1 4 4 0 0 1-1 3 4 4 0 0 1-1 2l-4 3a4 4 0 0 1-1 1 4 4 0 0 1-2 0 5 5 0 0 1-1 0 4 4 0 0 1-2-1l-2-3a1 1 0 0 1 0 1h-3v3a4 4 0 0 1-1 2 4 4 0 0 1-1 1 4 4 0 0 1-1 1 4 4 0 0 1-2 0h-5a4 4 0 0 1-4-5v-3l-2-1-1-1-2 2a4 4 0 0 1-2 1 4 4 0 0 1-1 0 4 4 0 0 1-2 0 4 4 0 0 1-1-1l-4-4a5 5 0 0 1 0-2 4 4 0 0 1-1-2 4 4 0 0 1 2-3l2-2v-1l-1-2h-2a4 4 0 0 1-2-1 4 4 0 0 1-1-1 4 4 0 0 1-1-1 4 4 0 0 1 0-2v-5a4 4 0 0 1 1-2 5 5 0 0 1 1-1 4 4 0 0 1 1-1 4 4 0 0 1 2 0h3l1-1v-2l-1-2a4 4 0 0 1-1-1 4 4 0 0 1 0-2 4 4 0 0 1 0-2 4 4 0 0 1 1-1l4-3a5 5 0 0 1 2-1 4 4 0 0 1 1-1 4 4 0 0 1 2 1 4 4 0 0 1 1 1l2 2h2l1-1 1-2a4 4 0 0 1 0-2 4 4 0 0 1 1-1 4 4 0 0 1 2-1 4 4 0 0 1 1 0h6a5 5 0 0 1 1 1 4 4 0 0 1 2 1 4 4 0 0 1 0 1 4 4 0 0 1 1 2l-1 3h1l1 1 1 1 3-2a4 4 0 0 1 1-1 4 4 0 0 1 2 0 4 4 0 0 1 1 0M11 0h82a11 11 0 0 1 11 11v30h-1a11 11 0 0 0-2-1h-2V21H5v49h51a12 12 0 0 0 0 2v4h-1v11h4l1 1h1l-1 1a12 12 0 0 0 0 2v1H11A11 11 0 0 1 0 81V11A11 11 0 0 1 11 0m35 31 19 13a3 3 0 0 1 0 4L47 61a3 3 0 0 1-2 0 3 3 0 0 1-3-2V33l1-1a3 3 0 0 1 3-1m4 56V76H29v11ZM24 76H5v5a6 6 0 0 0 6 6h13zm52-60V5H55v11Zm5-11v11h18v-5a6 6 0 0 0-6-6ZM50 16V5H29v11Zm-26 0V5H11a6 6 0 0 0-6 6v5Zm70 56a6 6 0 1 1-6 7 6 6 0 0 1 6-7m-1-8a14 14 0 1 1-13 16 14 14 0 0 1 13-16"}}`,
        check_mark: `{"svg":{"viewBox":"-32 -32 186.9 153.8"},"path":{"d":"M1.2 55.5a3.7 3.7 0 0 1 5-5.5l34.1 30.9 76.1-79.7a3.8 3.8 0 0 1 5.4 5.1L43.2 88.7a3.7 3.7 0 0 1-5.2.2L1.2 55.5z"}}`,
        arrow: `{"svg":{"class":"transform-icon-svg","viewBox":"-80 -80 227 283","fill":"#aaa"},"path":{"d":"M2 111a7 7 0 1 0 10 10l53-55-5-5 5 5c3-3 3-7 0-10L12 2A7 7 0 1 0 2 12l48 49z"}}`,
    };

    /**
     * @param {string} name
     * @param {any} value
     */
    function saveOption(name, value) {
        GM.setValue(name, (options[name] = value));
    }

    async function loadOptions() {
        for (const name in options) {
            const saved_option = await GM.getValue(name);
            if (saved_option === undefined) saveOption(name, options[name]);
            else options[name] = saved_option;
        }
    }

    await loadOptions();

    /**
     * @param {string} prefix
     * @returns {string}
     */
    function generateId(prefix = "id") {
        return prefix + (Date.now() + Math.random() * 10e20).toString(36);
    }

    const bridgeName = generateId("bridge");
    const bridgeMain = function () {
        function handleAPI(ev) {
            const [uniqueId, id, fn, ...args] = ev.detail.split("|");
            const player = document.getElementById(id);
            const detail = player[fn] ? player[fn](...args) : "";
            document.dispatchEvent(new CustomEvent(uniqueId, { detail }));
        }

        function spoofData(ev) {
            const item = ev.target.closest("[bridgeName]");
            if (item) item.data = {};
        }

        document.addEventListener("bridgeName", handleAPI);
        window.addEventListener("touchstart", spoofData, true);
        window.addEventListener("mousedown", spoofData, true);
    }.toString();

    const policyOptions = { createScript: (script) => script };
    const bridgePolicy = window.trustedTypes
        ? window.trustedTypes.createPolicy(bridgeName, policyOptions)
        : policyOptions;
    const script = head.appendChild(document.createElement("script"));
    script.textContent = bridgePolicy.createScript(
        `(${bridgeMain.replace(/bridgeName/g, bridgeName)})();`
    );

    /**
     * @param {string} id
     * @param {'getPlaybackQualityLabel' | 'getAvailableQualityData' | 'setPlaybackQualityRange' | 'playVideo' | 'loadVideoById'} name
     * @param  {string[]} args
     * @returns {Promise<string>}
     */
    function API(id, name, ...args) {
        const uniqueId = generateId(name);
        const detail = [uniqueId, id, name, ...args].join("|");
        return new Promise((resolve) => {
            document.addEventListener(uniqueId, function callback(ev) {
                resolve(ev.detail);
                document.removeEventListener(uniqueId, callback);
            });
            document.dispatchEvent(new CustomEvent(bridgeName, { detail }));
        });
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
        icon.svg = { ...icon.svg, width: "100%", height: "100%" };
        icons[name] = createNS("svg", icon.svg, [createNS("path", icon.path)]);
    }

    /**
     * @param {Document | HTMLElement} context
     * @param {string} query
     * @param {boolean} all
     * @returns {HTMLElement | NodeListOf<HTMLElement> | null}
     */
    function find(context, query, all = false) {
        return context[all ? "querySelectorAll" : "querySelector"](query);
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

    const cachePlayers = {};
    const cacheTextQuality = new Set();
    const element = {
        settings: $(".ytp-settings-menu"),
        panel_settings: $(".ytp-settings-menu .ytp-panel-menu"),
        movie_player: $("#movie_player", !isMobile),
        short_player: $("#shorts-player"),
        popup_menu: $("ytd-popup-container ytd-menu-service-item-renderer"),
        m_bottom_container: $("bottom-sheet-container:not(:empty)", false),
        music_menu_item: $("ytmusic-menu-service-item-renderer[class*=popup]"),
        link: $("link[rel=canonical]"),
        layout: $("ytmusic-app-layout, #layout"),
        offline: $("[class*=offline][style*='v=']", false),
        // Reserve Element
        premium: document.createElement("div"),
        option_text: document.createTextNode(""),
    };

    const style = head.appendChild(document.createElement("style"));
    style.textContent = /*css*/ `
        [dir=rtl] svg.transform-icon-svg {
            transform: scale(-1, 1);
        }

        body:not([ythdp_is-mobile-page]) ytmusic-menu-popup-renderer {
            min-width: 268.5px !important;
        }
        
        #items.ytmusic-menu-popup-renderer {
            width: 250px !important;
        }
    `;

    /**
     * @param {MutationCallback} callback
     * @param {Node} target
     * @param {MutationObserverInit | undefined} options
     */
    function observer(callback, target = body, options) {
        const mutation = new MutationObserver(callback);
        mutation.observe(target, options || { subtree: true, childList: true });
    }

    /**
     * @param {string} label
     * @returns {number}
     */
    function parseQualityLabel(label) {
        return parseInt(label.replace(/^(\D+)/, "").slice(0, 4), 10);
    }

    /**
     * @typedef {object} QualityData
     * @property {any} formatId
     * @property {string} qualityLabel
     * @property {string} quality
     * @property {boolean} isPlayable
     */

    /**
     * @param {QualityData[]} qualityData
     * @returns {number}
     */
    function getPreferredQuality(qualityData) {
        return Math.max(
            ...qualityData
                .map((data) => parseQualityLabel(data.qualityLabel))
                .filter((quality) => quality <= options.preferred_quality)
        );
    }

    /**
     * @param {string} id
     * @param {QualityData[]} qualityData
     * @returns {QualityData | null | undefined}
     */
    function getQuality(id, qualityData) {
        const quality = { premium: null, normal: null };
        const preferred = getPreferredQuality(qualityData);
        const isPremium = options.preferred_premium && !id.includes("short");

        if (!isFinite(preferred)) return;

        qualityData.forEach((data) => {
            const label = data.qualityLabel;
            if (parseQualityLabel(label) == preferred && data.isPlayable) {
                if (/premium/i.test(label)) quality.premium = data;
                else quality.normal = data;
            }
        });

        return (isPremium && quality.premium) || quality.normal;
    }

    /**
     * @param {boolean} clearIsUpdated
     */
    async function setVideoQuality(clearIsUpdated) {
        if (manualOverride) return;
        if (clearIsUpdated) isUpdated = false;
        if (isUpdated) return (isUpdated = false);

        const id = this.id;
        const label = await API(id, "getPlaybackQualityLabel");
        const quality = parseQualityLabel(label);

        if (quality) {
            const qualityData = await API(id, "getAvailableQualityData");
            const selected = getQuality(id, qualityData || []);

            if (
                selected &&
                (isUpdated = firstSetQuality || selected.qualityLabel != label)
            ) {
                firstSetQuality = !API(
                    id,
                    "setPlaybackQualityRange",
                    selected.quality,
                    selected.quality,
                    selected.formatId
                );
            }
        }
    }

    /**
     * @param {keyof options} optionName
     * @param {any} newValue
     * @param {HTMLElement} player
     * @param {Boolean} override
     */
    function savePreferred(optionName, newValue, player, override) {
        if (override) manualOverride = false;
        saveOption(optionName, newValue);
        saveOption("updated_id", generateId());
        togglePremium(), setTextQuality();
        setVideoQuality.call(player, true);
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

    function togglePremium() {
        element.premium.setAttribute("aria-checked", options.preferred_premium);
    }

    /**
     * @param {Text | undefined} nodeText
     */
    function setTextQuality(nodeText) {
        if (nodeText) cacheTextQuality.add(nodeText);

        cacheTextQuality.forEach((qualityText) => {
            qualityText.textContent = options.preferred_quality + "p";
        });
    }

    /**
     * @param {HTMLElement} element
     * @returns {DOMRect}
     */
    function getRect(element) {
        return element.getBoundingClientRect();
    }

    /**
     * @param {Element[]} elements
     */
    function removeAttributes(elements) {
        elements.forEach((element) => {
            element.textContent = "";
            Array.from(element.attributes).forEach((attr) => {
                if (attr.name != "class") element.removeAttribute(attr.name);
            });
        });
    }

    /**
     * @param {NodeListOf<Element>} element
     * @returns {HTMLElement}
     */
    function firstOnly(element) {
        for (let i = 1; i < element.length; i++) element[i].remove();
        return element[0];
    }

    /**
     * @param {Object} param
     * @param {HTMLElement} param.menuItem
     * @param {SVGSVGElement | undefined} param.icon
     * @param {string} param.label
     * @param {Boolean} param.selected
     */
    function parseItem({
        menuItem,
        icon = icons.quality,
        label = "Preferred Quality",
        selected = true,
    }) {
        const item = body.appendChild(menuItem.cloneNode(true));
        const iIcon = firstOnly(find(item, "c3-icon, yt-icon", true));
        const iText = firstOnly(
            find(item, "[role=text], yt-formatted-string", true)
        );
        const optionLabel = iText.cloneNode();
        const optionIcon = iIcon.cloneNode();
        const wrapperIcon = (icon) => {
            return itemElement(" yt-icon-shape yt-spec-icon-shape", [icon]);
        };

        item.setAttribute(bridgeName, "");
        iText.after(optionLabel, optionIcon);
        removeAttributes([iIcon, iText, optionIcon, optionLabel]);

        if (selected) {
            optionIcon.append(wrapperIcon(icons.arrow));
            optionLabel.style.marginInline = "auto 0";
            optionLabel.style.color = "#aaa";
            optionLabel.append(element.option_text);
            setTextQuality(element.option_text);
        } else optionIcon.remove();

        if (icon) iIcon.append(wrapperIcon(icon.cloneNode(true)));
        iText.textContent = label;
        return item.remove(), item;
    }

    /**
     * @param {HTMLElement} menuItem
     * @returns {{preferred: HTMLElement, items: HTMLElement[]}}
     */
    function listQualityToItem(menuItem) {
        const name = "preferred_quality";
        const preferredIndex = listQuality.indexOf(options[name]);
        const items = listQuality.map((quality, i) => {
            const icon = preferredIndex == i && icons.check_mark;
            const label = quality + "p";
            const item = parseItem({ menuItem, icon, label, selected: false });
            item.addEventListener("click", () => {
                body.click();
                body.dispatchEvent(new Event("tap"));
                savePreferred(name, quality, element.movie_player(), true);
            });
            return item;
        });
        return { preferred: items[preferredIndex], items: items.reverse() };
    }

    /**
     * @param {HTMLElement} player
     */
    function addVideoListener(player) {
        const cache = cachePlayers[player.id];
        const video = find(player, "video");
        if (!cache || cache[1] !== video) {
            cachePlayers[player.id] = [player, video];
            const fn = setVideoQuality.bind(player, false);
            video.addEventListener("play", () => setTimeout(fn, 10));
            video.addEventListener("resize", fn);
        }
    }

    /**
     * @param {'watch' | 'short'} type
     * @returns {boolean}
     */
    function isVideoPage(type) {
        const path = location.pathname;
        const types = type ? [type] : ["watch", "short", "clip"];
        return types.some((type) => path.startsWith("/" + type));
    }

    function resetState() {
        firstSetQuality = true;
        isUpdated = false;
        manualOverride = false;
    }

    async function syncOptions() {
        if ((await GM.getValue("updated_id")) != options.updated_id) {
            await loadOptions(), togglePremium(), setTextQuality();
            for (const id in cachePlayers) {
                const [player, video] = cachePlayers[id];
                if (!video.paused) setVideoQuality.call(player, true);
            }
        }
    }

    (function checkOptions() {
        setTimeout(() => syncOptions().then(checkOptions), 1e3);
    })();

    (function music() {
        if (!isMusic) return;

        /**
         * @param {HTMLElement} menuItem
         */
        function musicPopupObserver(menuItem) {
            const dropdown = menuItem.closest("tp-yt-iron-dropdown");
            const menu = menuItem.closest("#items");
            const item = parseItem({ menuItem });
            const addItem = () => settingsClicked && menu.append(item);
            item.addEventListener("click", () => {
                menu.textContent = "";
                menu.append(...listQualityToItem(item).items);
                document.dispatchEvent(new Event("resize", { bubbles: true }));
            });

            addItem();
            observer(addItem, dropdown, { attributeFilter: ["aria-hidden"] });
            find(item, "yt-formatted-string + yt-icon").style.marginInline = 0;
        }

        function musicSetSettingsClicked(/** @type {MouseEvent} */ ev) {
            settingsClicked = !!ev.target.closest(
                "#main-panel [class*=menu], .middle-controls-buttons [class*=menu]"
            );
        }

        function setIsMobile() {
            const layout = element.layout();
            const checkAttr = (attr) => /is-mobile|is-mweb/.test(attr.nodeName);
            const isMobile = Array.from(layout.attributes).some(checkAttr);
            body.toggleAttribute("ythdp_is-mobile-page", isMobile);
        }

        window.addEventListener("tap", musicSetSettingsClicked, true);
        window.addEventListener("click", musicSetSettingsClicked, true);

        observer((_, observe) => {
            const player = element.movie_player();
            const menuItem = element.music_menu_item();

            if (player && !cachePlayers[player.id]) addVideoListener(player);
            if (menuItem) {
                observe.disconnect();
                setIsMobile();
                musicPopupObserver(menuItem);
            }
        });
    })();

    (function mobile() {
        if (!isMobile) return;

        /** @type {HTMLElement} */
        let listCustomMenuItem = null;
        const customMenuHashId = "#custom-q-bottom-menu";
        const queryItem = "[role=menuitem], ytm-menu-service-item-renderer";

        /**
         * @param {HTMLElement} container
         */
        function customMenu(container) {
            location.replace(customMenuHashId);
            listCustomMenuItem = container.cloneNode(true);
            listCustomMenuItem.addEventListener("click", () => history.back());

            const item = find(listCustomMenuItem, queryItem);
            const menu = item.parentElement;
            const header = find(listCustomMenuItem, "#header-wrapper");
            const content = find(listCustomMenuItem, "#content-wrapper");
            const listQualityItems = listQualityToItem(item);

            menu.textContent = "";
            menu.append(...listQualityItems.items);
            header.remove();
            content.style.maxHeight = "250px";
            body.style.overflow = "hidden";
            container.parentElement.parentElement.append(listCustomMenuItem);

            const contentTop = getRect(content).top;
            const preferredQualityRect = getRect(listQualityItems.preferred);
            const realTop = preferredQualityRect.top - contentTop;
            content.scrollTo(0, realTop - preferredQualityRect.height * 2);
        }

        function mobileQualityMenu() {
            const container = element.m_bottom_container();

            if (container) {
                settingsClicked = false;

                const menuItem = find(container, queryItem);
                const item = parseItem({ menuItem });
                item.addEventListener("click", () => customMenu(container));
                menuItem.parentElement.append(item);
            }
        }

        function mobileSetSettingsClicked(/** @type {MouseEvent} */ ev) {
            if (isVideoPage() && !element.m_bottom_container()) {
                settingsClicked = !!ev.target.closest(
                    "player-top-controls .player-settings-icon, shorts-video ytm-bottom-sheet-renderer"
                );
            }
        }

        let menuStep = 0;

        function mobileSetOverride(/** @type {MouseEvent} */ ev) {
            if (manualOverride || listCustomMenuItem) return;
            if (!element.m_bottom_container()) menuStep = 0;
            if (menuStep++ == 2) {
                manualOverride = !!ev.target.closest("[role=menuitem]");
            }
        }

        function mobilePlayerUpdated(/** @type {CustomEvent} */ ev) {
            if (isVideoPage() && ev.detail.type == "newdata") resetState();
        }

        let oldHash = "";

        function mobileHandlePressBack() {
            if (listCustomMenuItem && oldHash == customMenuHashId) {
                listCustomMenuItem = listCustomMenuItem.remove();
                body.style.overflow = "";
            }
            oldHash = location.hash;
        }

        const videoIdRegex = /(?:shorts\/|watch\?v=|clip\/)([^#\&\?]*)/;

        /**
         * @param {HTMLElement | Location} context
         * @returns {null | string}
         */
        function parseLink(context) {
            const link = context.href.match(videoIdRegex);
            return link && link[1];
        }

        /**
         * @returns {boolean | null | string}
         */
        function getVideoId() {
            const playerId = parseLink(element.link());
            const currentId = parseLink(location);
            return playerId == currentId && currentId;
        }

        window.addEventListener("click", mobileSetSettingsClicked, true);
        window.addEventListener("click", mobileSetOverride, true);
        window.addEventListener("popstate", mobileHandlePressBack);
        document.addEventListener("video-data-change", mobilePlayerUpdated);

        observer(() => {
            const player = element.movie_player();

            if (player && isVideoPage() && player.closest("[playable=true]")) {
                addVideoListener(player);

                if (player.className.includes("unstarted-mode")) {
                    const id = getVideoId();
                    const elemId = player.id;
                    if (id) {
                        if (element.offline()) API(elemId, "loadVideoById", id);
                        API(elemId, "playVideo");
                    }
                }
            }

            if (settingsClicked) mobileQualityMenu();
        });
    })();

    (function desktop() {
        if (isMusic || isMobile) return;

        /**
         * @param {SVGSVGElement} svgIcon
         * @param {string} textLabel
         * @param {Boolean} checkbox
         * @returns {{item: HTMLDivElement, content: HTMLDivElement}}
         */
        function createMenuItem(svgIcon, textLabel, checkbox) {
            const inner = checkbox ? [itemElement("toggle-checkbox")] : [];
            const content = itemElement("content", inner);
            const icon = itemElement("icon", [svgIcon.cloneNode(true)]);
            const label = itemElement("label", [textLabel]);
            const item = itemElement("", [icon, label, content]);
            return (icon.style.fill = "currentColor"), { item, content };
        }

        function premiumMenu() {
            const name = "preferred_premium";
            const menu = (element.premium = createMenuItem(
                icons.premium,
                "Preferred Premium",
                true
            ).item);

            menu.addEventListener("click", () => {
                savePreferred(name, !options[name], element.movie_player());
            });

            return togglePremium(), menu;
        }

        /**
         * @param {HTMLElement} content
         * @param {HTMLElement} player
         */
        function qualityOption(content, player) {
            const name = "preferred_quality";
            const text = document.createTextNode("");

            content.style.cursor = "pointer";
            content.style.wordSpacing = "2rem";
            content.append("< ", text, " >");
            content.addEventListener("click", (ev) => {
                const threshold = content.clientWidth / 2;
                const clickPos = ev.clientX - getRect(content).left;
                const length = listQuality.length - 1;
                let pos = listQuality.indexOf(options[name]);

                if (
                    (clickPos < threshold && pos > 0 && pos--) ||
                    (clickPos > threshold && pos < length && ++pos)
                ) {
                    savePreferred(name, listQuality[pos], player, true);
                }
            });

            setTextQuality(text);
        }

        function qualityMenu() {
            const menu = createMenuItem(icons.quality, "Preferred Quality");

            menu.item.style.cursor = "default";
            menu.content.style.fontSize = "130%";

            qualityOption(menu.content, element.movie_player());
            return menu.item;
        }

        /**
         * @param {HTMLElement} menuItem
         * @returns {HTMLElement}
         */
        function shortQualityMenu(menuItem) {
            const item = parseItem({ menuItem, selected: false });
            const container = find(item, "yt-formatted-string:last-of-type");
            const option = document.createElement("div");

            item.style.userSelect = "none";
            item.style.cursor = "default";
            container.append(option);
            container.style.minWidth = "130px";
            option.style.margin = container.style.margin = "0 auto";
            option.style.width = "fit-content";
            option.style.paddingInline = "12px";

            qualityOption(option, element.short_player());
            return item;
        }

        function setOverride(/** @type {MouseEvent} */ ev) {
            manualOverride =
                !manualOverride &&
                !!ev.target.closest(".ytp-settings-menu [role=menuitemradio]");
        }

        function playerUpdated(/** @type {CustomEvent} */ ev) {
            if (!isVideoPage()) return;

            const player = [
                element.movie_player(),
                element.short_player(),
            ].find((player) => ev.target.contains(player));

            if (player) {
                resetState();
                addVideoListener(player);
            }
        }

        let shortMenuItem = itemElement("dummy");

        function initShortMenu() {
            const menu = isVideoPage("short") && element.popup_menu();
            if (menu && !menu.closest("[aria-hidden=true]")) {
                shortMenuItem.remove();
                shortMenuItem = shortQualityMenu(menu);
                menu.parentElement.append(shortMenuItem);
            }
        }

        window.addEventListener("click", initShortMenu);

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
        });
    })();
})();
