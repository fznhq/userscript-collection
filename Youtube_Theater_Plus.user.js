// ==UserScript==
// @name         YouTube Theater Plus
// @version      2.1.4
// @description  Make theater mode fill the entire page view with a hidden navbar and auto theater mode (Support new UI)
// @run-at       document-body
// @inject-into  content
// @match        https://www.youtube.com/*
// @exclude      https://*.youtube.com/live_chat*
// @exclude      https://*.youtube.com/embed*
// @exclude      https://*.youtube.com/tv*
// @exclude      https:/tv.youtube.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=youtube.com
// @grant        GM.getValue
// @grant        GM.setValue
// @updateURL    https://github.com/fznhq/userscript-collection/raw/main/Youtube_Fullpage_Theater.user.js
// @downloadURL  https://github.com/fznhq/userscript-collection/raw/main/Youtube_Fullpage_Theater.user.js
// @author       Fznhq
// @namespace    https://github.com/fznhq
// @homepageURL  https://github.com/fznhq/userscript-collection
// @license      GNU GPLv3
// ==/UserScript==

// Icons provided by https://iconmonstr.com/

(async function () {
    "use strict";

    const body = document.body;
    let theater = false;

    /**
     * Options must be changed via popup menu,
     * just press (v) to open the menu
     */
    const options = {
        auto_theater_mode: {
            icon: `{"svg":{"fill-rule":"evenodd","clip-rule":"evenodd"},"path":{"d":"M24 22H0V2h24zm-7-1V6H1v15zm1 0h5V3H1v2h17zm-6-6h-1v-3l-7 7-1-1 7-7H7v-1h5z"}}`,
            label: "Auto Open Theater;", // Remove ";" and change the label to customize your own label.
            value: false,
            onUpdate() {
                if (this.value && !theater) toggleTheater();
            },
        },
        hide_scrollbar: {
            icon: `{"path":{"d":"M14 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0m-3-4h2V6h4l-5-6-5 6h4zm2 8h-2v2H7l5 6 5-6h-4z"}}`,
            label: "Theater Hide Scrollbar;", // Remove ";" and change the label to customize your own label.
            value: true,
            onUpdate() {
                if (theater) {
                    setHtmlAttr(attr.no_scroll, this.value);
                    resizeWindow();
                }
            },
        },
        close_theater_with_esc: {
            icon: `{"svg":{"clip-rule":"evenodd","fill-rule":"evenodd","stroke-linejoin":"round","stroke-miterlimit":2},"path":{"d":"M21 4a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1zm-16.5.5h15v15h-15zm7.5 6.43 2.7-2.72a.75.75 0 0 1 1.07 1.06L13.05 12l2.73 2.73a.75.75 0 1 1-1.06 1.06l-2.73-2.73-2.73 2.73a.75.75 0 0 1-1.06-1.06L10.93 12 8.21 9.28A.75.75 0 0 1 9.27 8.2z","fill-rule":"nonzero"}}`,
            label: "Close Theater With Esc;", // Remove ";" and change the label to customize your own label.
            value: true,
        },
        hide_card: {
            icon: `{"path":{"d":"M22 6v16H6V6zm2-2H4v20h20zM0 0v20h2V2h18V0zm14 11.22c-3.15 0-5 2.6-5 2.6s2.02 2.95 5 2.95c3.23 0 5-2.95 5-2.95s-1.79-2.6-5-2.6m.05 4.72a1.94 1.94 0 1 1 0-3.88 1.94 1.94 0 0 1 0 3.88m1.1-1.94a1.1 1.1 0 1 1-2.2 0l.03-.21a.68.68 0 0 0 .87-.86l.2-.02c.6 0 1.1.49 1.1 1.09"}}`,
            label: "Hide Card Outside Theater Mode;", // Remove ";" and change the label to customize your own label.
            value: false,
            onUpdate() {
                if (!theater) setHtmlAttr(attr.hide_card, this.value);
            },
        },
        show_header_near: {
            icon: `{"path":{"d":"m5 4 10 9H9l-4 5zM3 0v24l7-9h11z"}}`,
            label: "Show Header When Mouse is Near;", // Remove ";" and change the label to customize your own label.
            value: false,
        },
    };

    function resizeWindow() {
        document.dispatchEvent(new Event("resize", { bubbles: true }));
    }

    /**
     * @param {string} name
     * @param {boolean} value
     * @returns {boolean}
     */
    function saveOption(name, value) {
        GM.setValue(name, value);
        return (options[name].value = value);
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

    for (const name in options) {
        const saved_option = await GM.getValue(name);
        const saved_label = await GM.getValue("label_" + name);
        const icon = JSON.parse(options[name].icon);
        let label = options[name].label;

        if (saved_option === undefined) {
            saveOption(name, options[name].value);
        } else {
            options[name].value = saved_option;
        }

        if (!label.endsWith(";")) {
            GM.setValue("label_" + name, label);
        } else if (saved_label !== undefined) {
            label = saved_label;
        }

        options[name].label = label.replace(/;$/, "");
        options[name].icon = createNS("svg", icon.svg, [
            createNS("path", icon.path),
        ]);
    }

    /**
     * @param {string} className
     * @param {Array} append
     * @returns {HTMLDivElement}
     */
    function createDiv(className, append = []) {
        const el = document.createElement("div");
        el.className = "ytp-menuitem" + (className ? "-" + className : "");
        return el.append(...append), el;
    }

    const popup = {
        show: false,
        menu: (() => {
            const menu = createDiv(" ytc-menu ytp-panel-menu");
            const container = createDiv(" ytc-popup-container", [menu]);

            for (const name in options) {
                const option = options[name];
                const item = createDiv("", [
                    createDiv("icon", [option.icon]),
                    createDiv("label", [option.label]),
                    createDiv("content", [createDiv("toggle-checkbox")]),
                ]);

                menu.append(item);
                item.setAttribute("aria-checked", option.value);
                item.addEventListener("click", () => {
                    const newValue = saveOption(name, !option.value);
                    item.setAttribute("aria-checked", newValue);
                    if (option.onUpdate) option.onUpdate();
                });
            }

            window.addEventListener("click", (ev) => {
                if (popup.show && !menu.contains(ev.target)) {
                    popup.show = !!container.remove();
                }
            });

            return container;
        })(),
    };

    window.addEventListener("keydown", (ev) => {
        const isPressV = ev.key.toLowerCase() == "v" || ev.code == "KeyV";

        if (
            (isPressV && !ev.ctrlKey && !isActiveEditable()) ||
            (ev.code == "Escape" && popup.show)
        ) {
            popup.show = popup.show
                ? !!popup.menu.remove()
                : !body.append(popup.menu);
        }
    });

    /**
     * @param {string} query
     * @param {boolean} cache
     * @returns {() => HTMLElement | null}
     */
    function $(query, cache = true) {
        let elem = null;
        return () => (cache && elem) || (elem = document.querySelector(query));
    }

    const style = document.head.appendChild(document.createElement("style"));
    style.textContent = /*css*/ `
        html[no-scroll],
        html[no-scroll] body {
            scrollbar-width: none !important;
        }

        html[no-scroll]::-webkit-scrollbar,
        html[no-scroll] body::-webkit-scrollbar,
        html[hide-card] ytd-player .ytp-paid-content-overlay,
        html[hide-card] ytd-player .iv-branding,
        html[hide-card] ytd-player .ytp-ce-element,
        html[hide-card] ytd-player .ytp-chrome-top,
        html[hide-card] ytd-player .ytp-suggested-action {
            display: none !important;
        }

        html[theater][masthead-hidden] #masthead-container {
            transform: translateY(-100%) !important;
        }

        html[theater][masthead-hidden] [fixed-panels] #chat {
            top: 0 !important;
        }

        html[theater] #page-manager {
            margin: 0 !important;
        }

        html[theater] #content #page-manager ytd-watch-flexy #full-bleed-container,
        html[theater] #content #page-manager ytd-watch-grid #player-full-bleed-container {
            height: 100vh;
            min-height: auto;
            max-height: none;
        }

        .ytc-popup-container {
            position: fixed;
            inset: 0;
            z-index: 9000;
            background: rgba(0, 0, 0, .5);
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .ytc-menu.ytp-panel-menu {
            background: #000;
            width: 400px;
            font-size: 120%;
            padding: 10px;
            fill: #eee;
        }
    `;

    const attrId = "-" + Date.now().toString(36);
    const attr = {
        video_id: "video-id",
        role: "role",
        theater: "theater",
        fullscreen: "fullscreen",
        hidden_header: "masthead-hidden",
        no_scroll: "no-scroll",
        hide_card: "hide-card",
    };

    for (const key in attr) {
        style.textContent = style.textContent.replaceAll(
            "[" + attr[key] + "]",
            "[" + attr[key] + attrId + "]"
        );
    }

    const element = {
        watch: $("ytd-watch-flexy, ytd-watch-grid"), // ytd-watch-grid == trash
        search: $("#masthead input"),
        chat: $("#chat #chatframe", false),
    };

    const keyToggleTheater = new KeyboardEvent("keydown", {
        key: "t",
        code: "KeyT",
        which: 84,
        keyCode: 84,
        bubbles: true,
        cancelable: true,
    });

    /**
     * @param {string} attr
     * @param {boolean} state
     */
    function setHtmlAttr(attr, state) {
        document.documentElement.toggleAttribute(attr + attrId, state);
    }

    /**
     * @param {MutationCallback} callback
     * @param {Node} target
     * @param {MutationObserverInit | undefined} options
     */
    function observer(callback, target, options) {
        const mutation = new MutationObserver(callback);
        mutation.observe(target, options || { subtree: true, childList: true });
    }

    /**
     * @returns {boolean}
     */
    function isTheater() {
        const watch = element.watch();
        return (
            watch.getAttribute(attr.role) == "main" &&
            watch.hasAttribute(attr.theater) &&
            !watch.hasAttribute(attr.fullscreen)
        );
    }

    /**
     * @returns {boolean}
     */
    function isActiveEditable() {
        /** @type {HTMLElement} */
        const active = document.activeElement;
        return (
            active.tagName == "TEXTAREA" ||
            active.tagName == "INPUT" ||
            active.isContentEditable
        );
    }

    /**
     * @param {boolean} state
     * @param {number} timeout
     * @returns {number | boolean}
     */
    function toggleHeader(state, timeout) {
        const toggle = () => {
            if (state || document.activeElement != element.search()) {
                const scroll =
                    !options.show_header_near.value && window.scrollY;
                setHtmlAttr(attr.hidden_header, !(state || scroll));
            }
        };
        return theater && setTimeout(toggle, timeout || 1);
    }

    let showHeaderTimerId = 0;

    /**
     * @param {MouseEvent} ev
     */
    function mouseShowHeader(ev) {
        if (options.show_header_near.value && theater) {
            const state = !popup.show && ev.clientY < 200;
            if (state) {
                clearTimeout(showHeaderTimerId);
                showHeaderTimerId = toggleHeader(false, 1500);
            }
            toggleHeader(state);
        }
    }

    function toggleTheater() {
        document.dispatchEvent(keyToggleTheater);
    }

    /**
     * @param {KeyboardEvent} ev
     */
    function onEscapePress(ev) {
        if (ev.code != "Escape" || !theater || popup.show) return;

        if (options.close_theater_with_esc.value) {
            toggleTheater();
        } else {
            const input = element.search();
            if (document.activeElement != input) input.focus();
            else input.blur();
        }
    }

    function registerEventListener() {
        element.search().addEventListener("focus", () => toggleHeader(true));
        element.search().addEventListener("blur", () => toggleHeader(false));
        window.addEventListener("scroll", () => {
            if (!options.show_header_near.value) toggleHeader();
        });
        window.addEventListener("mousemove", mouseShowHeader);
        window.addEventListener("keydown", onEscapePress, true);
    }

    /**
     * @param {MutationRecord[]} mutations
     */
    function autoOpenTheater(mutations) {
        const attrs = [attr.role, attr.video_id];
        const watch = element.watch();

        if (
            options.auto_theater_mode.value &&
            !watch.hasAttribute(attr.theater) &&
            !watch.hasAttribute(attr.fullscreen) &&
            mutations.some((m) => attrs.includes(m.attributeName))
        ) {
            setTimeout(toggleTheater, 1);
        }
    }

    function applyTheaterMode() {
        const state = isTheater();

        if (theater == state) return;
        theater = state;

        setHtmlAttr(attr.theater, state);
        setHtmlAttr(attr.hidden_header, state);
        setHtmlAttr(attr.no_scroll, state && options.hide_scrollbar.value);
        setHtmlAttr(attr.hide_card, state || options.hide_card.value);
    }

    observer((_, observe) => {
        const watch = element.watch();
        if (!watch) return;

        observer(
            (mutations) => {
                applyTheaterMode();
                autoOpenTheater(mutations);
            },
            watch,
            { attributes: true }
        );

        registerEventListener();
        observe.disconnect();
    }, body);
})();
