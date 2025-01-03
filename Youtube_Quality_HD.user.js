// ==UserScript==
// @name         Youtube Quality HD
// @version      1.9.6
// @description  Automatically select your desired video quality and select premium when posibble. (Support YouTube Desktop, Music & Mobile)
// @run-at       document-body
// @inject-into  content
// @match        https://www.youtube.com/*
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

    let manualOverride = false;
    let isUpdated = false;
    let settingsClicked = false;
    let maybeChangeQuality = false;

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
     * @param {number} length
     * @returns {string}
     */
    function generateId(length = 12) {
        let out = "id";
        while (--length > 1) out += Math.floor(Math.random() * 36).toString(36);
        return out;
    }

    const bridgeName = "main-bridge-" + generateId();
    const bridgeMain = function () {
        function handleBridge(ev) {
            const data = ev.detail.split("|");
            const [uniqueId, type] = data.splice(0, 2);
            const handlers = {
                api() {
                    const [id, fnName, ...args] = data;
                    const player = document.getElementById(id);
                    return player ? player[fnName](...args) : "";
                },
                create() {
                    const [tagName, id] = data;
                    const element = document.createElement(tagName);
                    return document.body.append(element), (element.id = id);
                },
            };
            const detail = handlers[type]();
            document.dispatchEvent(new CustomEvent(uniqueId, { detail }));
        }

        function spoofData(ev) {
            const item = ev.target.closest("[data-custom-item-bridge]");
            if (item) item.data = {};
        }

        document.addEventListener("bridgeName", handleBridge);
        window.addEventListener("touchstart", spoofData, true);
        window.addEventListener("mousedown", spoofData, true);
    }.toString();

    const policyOptions = { createScript: (script) => script };
    const bridgePolicy = window.trustedTypes
        ? window.trustedTypes.createPolicy(bridgeName, policyOptions)
        : policyOptions;
    const script = head.appendChild(document.createElement("script"));
    script.textContent = bridgePolicy.createScript(
        `(${bridgeMain.replace("bridgeName", bridgeName)})();`
    );

    /**
     * @returns {Promise<any>}
     */
    function sendToMain() {
        const uniqueId = generateId(64);
        const detail = [uniqueId, ...arguments].join("|");
        return new Promise((resolve) => {
            function callback(ev) {
                resolve(ev.detail);
                document.removeEventListener(uniqueId, callback);
            }
            document.addEventListener(uniqueId, callback);
            document.dispatchEvent(new CustomEvent(bridgeName, { detail }));
        });
    }

    /**
     * @param {string} id
     * @param {'getPlaybackQualityLabel' | 'getAvailableQualityData' | 'setPlaybackQualityRange' | 'playVideo'} name
     * @param  {string[]} args
     * @returns {Promise<string>}
     */
    function API(id, name, ...args) {
        return sendToMain("api", id, name, ...args);
    }

    /**
     * @param {string} tagName
     * @returns {Promise<HTMLElement>}
     */
    async function createInMain(tagName) {
        const id = await sendToMain("create", tagName, generateId());
        const element = find(document, tagName + "#" + id);
        return element.removeAttribute("id"), element.remove(), element;
    }

    /**
     * @param {string} name
     * @param {object} attributes
     * @param {Array} append
     * @returns {SVGElement}
     */
    function createSVG(name, attributes = {}, append = []) {
        const el = document.createElementNS("http://www.w3.org/2000/svg", name);
        for (const k in attributes) el.setAttributeNS(null, k, attributes[k]);
        return el.append(...append), el;
    }

    for (const name in icons) {
        const icon = JSON.parse(icons[name]);
        icon.svg = { ...icon.svg, width: "100%", height: "100%" };
        icons[name] = createSVG("svg", icon.svg, [
            createSVG("path", icon.path),
        ]);
    }

    /**
     * @param {Document | HTMLElement} context
     * @param {string} query
     * @param {boolean} all
     * @returns {HTMLElement | NodeListOf<HTMLElement> | null}
     */
    function find(context, query, all = false) {
        const property = "querySelector" + (all ? "All" : "");
        return context[property](query);
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
    const query = {
        movie_player: "#movie_player",
        short_player: "#shorts-player",
        m_menu_item: "[role='menuitem'], ytm-menu-service-item-renderer",
        m_settings_btn: `player-top-controls .player-settings-icon, shorts-video ytm-bottom-sheet-renderer`,
    };
    const allowedPlayerIds = [query.movie_player, query.short_player];
    const element = {
        settings: $(".ytp-settings-menu"),
        panel_settings: $(".ytp-settings-menu .ytp-panel-menu"),
        quality_menu: $(".ytp-quality-menu", false),
        movie_player: $(query.movie_player, !isMobile),
        short_player: $(query.short_player),
        popup_menu: $("ytd-popup-container ytd-menu-service-item-renderer"),
        m_bottom_container: $("bottom-sheet-container:not(:empty)", false),
        m_settings: $(query.m_settings_btn, false),
        music_popup: $("ytmusic-menu-popup-renderer"),
        // Reserve Element
        premium: document.createElement("div"),
        option_text: document.createTextNode(""),
    };

    const style = head.appendChild(document.createElement("style"));
    style.textContent = /*css*/ `
        [dir='rtl'] svg.transform-icon-svg {
            transform: scale(-1, 1);
        }

        ytmusic-menu-popup-renderer {
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
     * @returns {QualityData | undefined}
     */
    function getQuality(id, qualityData) {
        const q = { premium: undefined, normal: undefined };
        const short = id.includes("short");
        const preferred = getPreferredQuality(qualityData);

        if (!isFinite(preferred)) return;

        qualityData.forEach((data) => {
            const label = data.qualityLabel.toLowerCase();
            if (parseQualityLabel(label) == preferred && data.isPlayable) {
                if (label.includes("premium")) q.premium = data;
                else q.normal = data;
            }
        });

        return (options.preferred_premium && !short && q.premium) || q.normal;
    }

    async function setVideoQuality() {
        if (manualOverride) return;
        if (isUpdated) return (isUpdated = false);

        const id = this.id;
        const label = await API(id, "getPlaybackQualityLabel");
        const quality = parseQualityLabel(label);

        if (quality) {
            const qualityData = await API(id, "getAvailableQualityData");
            const selected = getQuality(id, qualityData || []);

            if (selected && (isUpdated = selected.qualityLabel != label)) {
                API(
                    id,
                    "setPlaybackQualityRange",
                    selected.quality,
                    selected.quality,
                    selected.formatId
                );
            }
        }
    }

    function triggerSyncOptions() {
        const id = generateId();
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
        setVideoQuality.call(player, (isUpdated = false));
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

    /**
     * @param {SVGSVGElement} svgIcon
     * @param {string} textLabel
     * @param {boolean} checkbox
     * @returns {{item: HTMLDivElement, content: HTMLDivElement}}
     */
    function createMenuItem(svgIcon, textLabel, checkbox = false) {
        const inner = checkbox ? [itemElement("toggle-checkbox")] : [];
        const content = itemElement("content", inner);
        const icon = itemElement("icon", [svgIcon.cloneNode(true)]);
        const label = itemElement("label", [textLabel]);
        const item = itemElement("", [icon, label, content]);
        return (icon.style.fill = "currentColor"), { item, content };
    }

    function setPremiumToggle() {
        element.premium.setAttribute("aria-checked", options.preferred_premium);
    }

    function premiumMenu() {
        const menu = createMenuItem(icons.premium, "Preferred Premium", true);
        const name = "preferred_premium";

        element.premium = menu.item;
        setPremiumToggle();
        menu.item.addEventListener("click", () => {
            savePreferred(name, !options[name], element.movie_player());
            setPremiumToggle();
        });

        return menu.item;
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
     * @param {HTMLElement} content
     * @param {HTMLElement} player
     */
    function qualityOption(content, player) {
        const name = "preferred_quality";
        const text = document.createTextNode("");

        setTextQuality(text);

        content.style.cursor = "pointer";
        content.style.fontWeight = 500;
        content.style.wordSpacing = "2rem";
        content.append("< ", text, " >");
        content.addEventListener("click", function (ev) {
            const threshold = this.clientWidth / 2;
            const clickPos = ev.clientX - getRect(this).left;
            let pos = listQuality.indexOf(options[name]);

            if (
                (clickPos < threshold && pos > 0 && pos--) ||
                (clickPos > threshold && pos < listQuality.length - 1 && ++pos)
            ) {
                manualOverride = false;
                savePreferred(name, listQuality[pos], player);
                setTextQuality();
            }
        });
    }

    function qualityMenu() {
        const menu = createMenuItem(icons.quality, "Preferred Quality");

        menu.item.style.cursor = "default";
        menu.content.style.fontSize = "130%";

        qualityOption(menu.content, element.movie_player());
        return menu.item;
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
     * @param {HTMLElement} element
     * @param {SVGSVGElement | undefined} icon
     * @param {string} label
     * @param {Text | string} selectedLabel
     */
    function parseItem(element, icon, label, selectedLabel) {
        const item = body.appendChild(element.cloneNode(true));
        const iIcon = firstOnly(find(item, "c3-icon, yt-icon", true));
        const iText = firstOnly(
            find(item, "[role='text'], yt-formatted-string", true)
        );
        const optionLabel = iText.cloneNode();
        const optionIcon = iIcon.cloneNode();
        const wrapperIcon = (icon) => {
            return itemElement(" yt-icon-shape yt-spec-icon-shape", [icon]);
        };

        item.setAttribute("data-custom-item-bridge", "");
        iText.after(optionLabel, optionIcon);
        removeAttributes([iIcon, iText, optionIcon, optionLabel]);

        if (selectedLabel) {
            optionIcon.append(wrapperIcon(icons.arrow));
            optionLabel.style.marginInline = "auto 0";
            optionLabel.style.color = "#aaa";
            optionLabel.append(selectedLabel);
        } else optionIcon.remove();

        if (icon) iIcon.append(wrapperIcon(icon.cloneNode(true)));
        iText.textContent = label;
        return item;
    }

    /**
     * @param {HTMLElement} itemElement
     * @returns {HTMLElement}
     */
    function shortQualityMenu(itemElement) {
        const item = parseItem(itemElement, icons.quality, "Preferred Quality");
        const container = find(item, "yt-formatted-string:last-of-type");
        const option = document.createElement("div");

        item.setAttribute("use-icons", "");
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

    /**
     * @param {MouseEvent} ev
     */
    function setOverride(ev) {
        if (manualOverride) return;
        const menu = element.quality_menu();
        const quality = parseQualityLabel(ev.target.textContent);
        if (menu && listQuality.includes(quality)) manualOverride = true;
    }

    /**
     * @param {HTMLElement} player
     */
    function addVideoListener(player) {
        const cache = cachePlayers[player.id];
        const video = find(player, "video");
        if (!cache || cache[1] !== video) {
            cachePlayers[player.id] = [player, video];
            const fn = setVideoQuality.bind(player);
            video.addEventListener("play", () => setTimeout(fn, 200));
            video.addEventListener("resize", fn);
        }
    }

    /**
     * @param {'watch' | 'short'} type
     * @returns {boolean}
     */
    function isVideoPage(type) {
        const types = type ? [type] : ["watch", "short"];
        return types.some((type) => location.pathname.startsWith("/" + type));
    }

    function resetState() {
        isUpdated = false;
        manualOverride = false;
    }

    /**
     * @param {CustomEvent} ev
     */
    function playerUpdated(ev) {
        let player = null;
        if (
            isVideoPage() &&
            allowedPlayerIds.some((id) => (player = find(ev.target, id)))
        ) {
            resetState();
            addVideoListener(player);
        }
    }

    async function syncOptions() {
        if ((await GM.getValue("updated_id")) != options.updated_id) {
            isUpdated = false;
            for (const name in options) options[name] = await GM.getValue(name);
            setPremiumToggle();
            setTextQuality();
            for (const id in cachePlayers) {
                const [player, video] = cachePlayers[id];
                if (!video.paused) setVideoQuality.call(player);
            }
        }
    }

    (function checkOptions() {
        setTimeout(() => syncOptions().then(checkOptions), 1e3);
    })();

    /**
     * @param {HTMLElement} menuItem
     * @param {string} noteText
     * @returns {{preferred: HTMLElement, items: HTMLElement[]}}
     */
    function listQualityToItem(menuItem, noteText = "") {
        const name = "preferred_quality";
        const preferredIndex = listQuality.indexOf(options[name]);
        const items = listQuality.map((quality, i) => {
            const note = quality == defaultQuality ? noteText : "";
            const icon = preferredIndex == i && icons.check_mark;
            const item = parseItem(menuItem, icon, `${quality}p ${note}`);
            item.addEventListener("click", () => {
                body.click((manualOverride = false));
                body.dispatchEvent(new Event("tap"));
                savePreferred(name, quality, element.movie_player());
            });
            return item;
        });
        return { preferred: items[preferredIndex], items: items.reverse() };
    }

    /**
     * @param {HTMLElement} itemElement
     * @param {HTMLElement} popup
     */
    function musicPopupObserver(itemElement, popup) {
        const dropdown = popup.closest("tp-yt-iron-dropdown");
        const menu = find(popup, "#items");
        const item = parseItem(
            itemElement,
            icons.quality,
            "Preferred Quality",
            element.option_text
        );
        const optionIcon = find(item, "yt-formatted-string + yt-icon");
        optionIcon.style.marginInline = 0;
        item.className = "ytmusic-menu-popup-renderer";
        item.addEventListener("click", () => {
            menu.textContent = "";
            menu.append(...listQualityToItem(item).items);
            document.dispatchEvent(new Event("resize", { bubbles: true }));
        });

        function addMenuItem() {
            if (dropdown.getAttribute("aria-hidden") !== "true") {
                menu.append(item);
                setTextQuality(element.option_text);
            }
        }

        observer(addMenuItem, dropdown, { attributeFilter: ["aria-hidden"] });
        dropdown.setAttribute("aria-hidden", false);
    }

    if (isMusic) {
        return observer((_, observe) => {
            const player = element.movie_player();
            const popup = element.music_popup();

            if (player && !cachePlayers[player.id]) addVideoListener(player);
            if (popup) {
                observe.disconnect();
                createInMain("ytmusic-menu-service-item-renderer").then(
                    (element) => musicPopupObserver(element, popup)
                );
            }
        });
    }

    /** @type {HTMLElement} */
    let listCustomMenuItem = null;
    const customMenuHashId = "custom-bottom-menu";

    /**
     * @param {HTMLElement} container
     */
    function listCustomMenu(container) {
        location.replace("#" + customMenuHashId);
        listCustomMenuItem = container.cloneNode(true);

        const item = find(listCustomMenuItem, query.m_menu_item);
        const menu = item.parentElement;
        const header = find(listCustomMenuItem, "#header-wrapper");
        const content = find(listCustomMenuItem, "#content-wrapper");
        const listQualityItems = listQualityToItem(item, "(Recommended)");

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
        listCustomMenuItem.addEventListener("click", () => history.back());
    }

    function mobileQualityMenu() {
        const container = element.m_bottom_container();

        if (container) {
            settingsClicked = false;
            maybeChangeQuality = false;

            const item = find(container, query.m_menu_item);
            const menu = item.parentElement;
            const menuItem = parseItem(
                item,
                icons.quality,
                "Preferred Quality",
                element.option_text
            );

            setTextQuality(element.option_text);
            menu.append(menuItem);
            menu.addEventListener("click", () => (maybeChangeQuality = true));
            menuItem.addEventListener("click", () => listCustomMenu(container));
        }
    }

    /**
     * @param {MouseEvent} ev
     */
    function mobileSetSettingsClicked(ev) {
        if (isVideoPage()) {
            const settings = element.m_settings();
            settingsClicked = settings && settings.contains(ev.target);
        }
    }

    /**
     * @param {MouseEvent} ev
     */
    function mobileSetOverride(ev) {
        if (listCustomMenuItem) return (maybeChangeQuality = false);
        if (manualOverride || !maybeChangeQuality) return;
        const container = element.m_bottom_container();
        if (container && find(container, query.m_menu_item)) {
            const quality = parseQualityLabel(ev.target.textContent);
            if (listQuality.includes(quality)) manualOverride = true;
            maybeChangeQuality = false;
        }
    }

    /**
     * @param {CustomEvent} ev
     */
    function mobilePlayerUpdated(ev) {
        if (isVideoPage() && ev.detail.type == "newdata") resetState();
    }

    /**
     * @param {HashChangeEvent} ev
     */
    function mobileHandlePressBack(ev) {
        if (listCustomMenuItem && ev.oldURL.includes(customMenuHashId)) {
            listCustomMenuItem = listCustomMenuItem.remove();
            body.style.overflow = "";
        }
    }

    if (isMobile) {
        window.addEventListener("click", mobileSetSettingsClicked, true);
        window.addEventListener("click", mobileSetOverride, true);
        window.addEventListener("hashchange", mobileHandlePressBack);
        document.addEventListener("video-data-change", mobilePlayerUpdated);

        return observer(() => {
            const player = element.movie_player();

            if (player) {
                addVideoListener(player);
                const unstarted = player.className.includes("unstarted-mode");
                if (unstarted && isVideoPage()) API(player.id, "playVideo");
            }

            if (settingsClicked) mobileQualityMenu();
        });
    }

    let shortMenuItem = itemElement("dummy");

    function initShortMenu() {
        const menu = isVideoPage("short") && element.popup_menu();
        if (menu && !menu.closest("[aria-hidden='true']")) {
            shortMenuItem.remove();
            createInMain("ytd-menu-service-item-renderer").then((element) => {
                shortMenuItem = shortQualityMenu(element);
                menu.parentElement.append(shortMenuItem);
            });
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
