// ==UserScript==
// @name          Minimal YouTube
// @version       1.0.0
// @description   A minimal YouTube experience with a customizable interface.
// @run-at        document-start
// @match         https://www.youtube.com/*
// @exclude       https://*.youtube.com/live_chat*
// @exclude       https://*.youtube.com/embed*
// @exclude       https://*.youtube.com/tv*
// @grant         GM.getValue
// @grant         GM.setValue
// @updateURL     https://github.com/fznhq/userscript-collection/raw/main/Youtube_Minimal_Plus.user.js
// @downloadURL   https://github.com/fznhq/userscript-collection/raw/main/Youtube_Minimal_Plus.user.js
// @author        Vishwamz (https://github.com/Vishwamz)
// @collaborator  Fznhq
// @namespace     https://github.com/fznhq
// @homepageURL   https://github.com/fznhq/userscript-collection
// @homepage      https://github.com/fznhq/userscript-collection
// @license       GNU GPLv3
// ==/UserScript==

(function () {
    "use strict";

    const options = {
        minimal_homepage: {
            label: "Minimal Homepage",
            value: true,
            icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"></path></svg>`,
        },
        hide_comments: {
            label: "Hide Comments",
            value: true,
            icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M21.99 4c0-1.1-.89-2-1.99-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4-.01-18zM18 14H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"></path></svg>`,
        },
        hide_secondary: {
            label: "Hide Recommendations",
            value: true,
            icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M4 18h11v-2H4v2zm0-5h11v-2H4v2zm0-5h11V6H4v2zm14 1.5v9l6-4.5z"></path></svg>`,
        },
        hide_related: {
            label: "Hide Related Videos",
            value: true,
            icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"></path></svg>`,
        },
        hide_sidebar: {
            label: "Hide Sidebar",
            value: true,
            icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"></path></svg>`,
        },
        hide_top_bar_buttons: {
            label: "Hide Top Bar Buttons",
            value: true,
            icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M21 6H3V5h18v1zm-2 4H5v1h14v-1zm2 4H3v1h18v-1z"></path></svg>`,
        },
    };

    const policyOptions = { createHTML: (html) => html.trim() };
    const policy = window.trustedTypes
        ? window.trustedTypes.createPolicy("ytmp-policy", policyOptions)
        : policyOptions;

    function create(html) {
        const container = document.createElement("div");
        container.innerHTML = policy.createHTML(html.replace(/>\s+</g, "><"));
        return container.firstElementChild;
    }

    const menuItems = {};
    const popup = createPopup();
    const homeContainer = createHomeContainer();

    async function loadOptions() {
        for (const key in options) {
            options[key].value = await GM.getValue(key, options[key].value);
        }
    }

    function saveOption(key, value) {
        options[key].value = value;
        GM.setValue(key, value);
    }

    const prefix = "ytmp-";
    const attrId = "-" + Date.now().toString(36).slice(-4);
    const attr = {
        is_homepage: "is-homepage",
        minimal_homepage: "minimal-homepage",
        hide_comments: "hide-comments",
        hide_secondary: "hide-secondary",
        hide_related: "hide-related",
        hide_sidebar: "hide-sidebar",
        hide_top_bar_buttons: "hide-top-bar-buttons",
    };

    function setHtmlAttr(attrName, state) {
        document.documentElement.toggleAttribute(
            prefix + attrName + attrId,
            state
        );
    }

    function applyStyles() {
        setHtmlAttr(attr.is_homepage, window.location.pathname === "/");
        setHtmlAttr(attr.minimal_homepage, options.minimal_homepage.value);
        setHtmlAttr(attr.hide_comments, options.hide_comments.value);
        setHtmlAttr(attr.hide_secondary, options.hide_secondary.value);
        setHtmlAttr(attr.hide_related, options.hide_related.value);
        setHtmlAttr(attr.hide_sidebar, options.hide_sidebar.value);
        setHtmlAttr(
            attr.hide_top_bar_buttons,
            options.hide_top_bar_buttons.value
        );
    }

    function createMenuItem(key) {
        const option = options[key];
        const item = create(/*html*/ `
            <div class="ytp-menuitem" aria-checked="${option.value}">
                <div class="ytp-menuitem-icon">${option.icon}</div>
                <div class="ytp-menuitem-label">${option.label}</div>
                <div class="ytp-menuitem-content">
                    <div class="ytp-menuitem-toggle-checkbox"></div>
                </div>
            </div>
        `);
        item.addEventListener("click", () => {
            const value = !option.value;
            item.setAttribute("aria-checked", value);
            saveOption(key, value);
            applyStyles();
            showToast(`${option.label} ${value ? "enabled" : "disabled"}`);
        });
        return item;
    }

    function createPopup() {
        const container = create(/*html*/ `
            <div class="yt-minimal-popup-container" style="display: flex;" role="dialog" aria-modal="true" tabindex="-1">
                <div class="yt-minimal-menu ytp-panel-menu"></div>
            </div>
        `);
        const menu = container.querySelector(".yt-minimal-menu");

        for (const key in options) {
            menuItems[key] = menu.appendChild(createMenuItem(key));
        }

        container.addEventListener("click", (e) => {
            if (e.target.contains(container)) togglePopup();
        });

        window.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && document.body.contains(container)) {
                e.preventDefault();
                togglePopup();
            }
        });

        return container;
    }

    function togglePopup() {
        const body = document.body;
        if (body.contains(popup)) popup.remove();
        else body.append(popup);
    }

    function createHomeContainer() {
        const container = create(/*html*/ `
            <div class="home-container">
                <div class="logo-full">
                    <svg viewBox="0 0 90 20" class="style-scope yt-icon" style="pointer-events:none;display:block;width:100%;height:100%"><g class="style-scope yt-icon"><path d="M27.973 3.123A3.58 3.58 0 0 0 25.447.597C23.22 0 14.285 0 14.285 0S5.35 0 3.123.597A3.58 3.58 0 0 0 .597 3.123C0 5.35 0 10 0 10s0 4.65.597 6.877a3.58 3.58 0 0 0 2.526 2.526C5.35 20 14.285 20 14.285 20s8.935 0 11.162-.597a3.58 3.58 0 0 0 2.526-2.526C28.57 14.65 28.57 10 28.57 10s-.002-4.65-.597-6.877" fill="red" class="style-scope yt-icon"/><path d="M11.425 14.285 18.848 10l-7.423-4.285z" fill="#fff" class="style-scope yt-icon"/></g><g class="style-scope yt-icon" fill="#fff"><path d="M34.602 13.004 31.395 1.418h2.798l1.124 5.252q.43 1.94.633 3.31h.082q.142-.981.633-3.291l1.164-5.27h2.799L37.38 13.003v5.557H34.6v-5.557z" class="style-scope yt-icon"/><path d="M41.47 18.194q-.847-.572-1.207-1.778-.356-1.206-.357-3.208V11.39q0-2.023.409-3.248.41-1.225 1.277-1.787.868-.562 2.279-.563 1.389 0 2.227.572t1.225 1.787q.39 1.218.389 3.239v1.818q-.001 2.004-.38 3.217-.376 1.217-1.224 1.778t-2.298.562q-1.495.002-2.34-.571m3.165-1.962q.235-.612.236-2.001v-3.902q0-1.349-.236-1.97-.235-.625-.828-.624-.572 0-.806.623-.236.625-.235 1.971v3.902q0 1.39.225 2.001.224.614.816.614.593 0 .828-.614m12.18 2.331H54.61l-.244-1.533h-.061q-.899 1.736-2.698 1.736-1.246 0-1.839-.816-.593-.819-.593-2.554V6.038h2.82v9.193q0 .839.184 1.195t.613.357q.367 0 .706-.226.337-.225.5-.571v-9.95h2.818z"/><path d="M64.476 3.688h-2.8v14.875h-2.758V3.688H56.12V1.42h8.356z"/><path d="M71.277 18.563H69.07l-.245-1.533h-.06q-.9 1.736-2.699 1.736-1.245 0-1.839-.816-.592-.819-.592-2.554V6.038h2.82v9.193q0 .839.183 1.195t.614.357q.367 0 .705-.226c.226-.15.39-.34.501-.571v-9.95h2.818zm9.332-10.524q-.257-1.185-.828-1.717-.57-.532-1.573-.532-.777 0-1.451.44-.675.44-1.042 1.155h-.021v-6.6h-2.717v17.776h2.329l.287-1.186h.06c.22.424.546.755.981 1.002q.654.367 1.451.367 1.43 0 2.105-1.317.675-1.318.675-4.118v-1.982q-.001-2.102-.256-3.288m-2.585 5.11q0 1.37-.113 2.145-.112.778-.378 1.103a.87.87 0 0 1-.715.327q-.349 0-.645-.165a1.23 1.23 0 0 1-.48-.489V8.96q.143-.51.492-.837c.23-.218.485-.327.755-.327a.76.76 0 0 1 .663.337q.236.338.327 1.133.092.797.092 2.268v1.615zm6.842.722q0 1.206.07 1.809.07.602.297.88.224.274.693.274.633 0 .868-.491.237-.492.257-1.634l2.431.143q.021.163.022.45-.001 1.735-.95 2.593-.95.858-2.686.859-2.085 0-2.921-1.308-.839-1.309-.838-4.045v-2.187q0-2.82.868-4.118t2.973-1.299q1.45 0 2.227.532.776.531 1.094 1.656.317 1.125.317 3.106v2.145h-4.722zm.357-5.903q-.213.265-.287.868-.07.602-.07 1.83v.898h2.062v-.898q0-1.207-.082-1.83-.081-.623-.296-.88-.216-.255-.664-.256-.45.003-.663.268"/></g></svg>
                </div>
                <div class="search-group">
                    <form style="display: flex;">
                        <input class="search-input" placeholder="Search" autofocus />
                        <button class="search-btn" type="submit">
                            <div class="search-icon-container">
                                <svg viewBox="0 0 24 24" style="pointer-events:none;display:block;width:100%;height:100%"><g class="style-scope yt-icon"><path d="m20.87 20.17-5.59-5.59A6.96 6.96 0 0 0 17 10c0-3.87-3.13-7-7-7s-7 3.13-7 7a6.995 6.995 0 0 0 11.58 5.29l5.59 5.59zM10 16c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6" class="style-scope yt-icon"/></g></svg>
                            </div>
                        </button>
                    </form>
                </div>
            </div>
        `);

        const input = container.querySelector("input");
        const form = container.querySelector("form");
        const submit = create(`<input type="submit" style="display: none;" />`);

        function search(e) {
            e.preventDefault();
            const value = input.value.trim();
            if (!value) return showToast("Enter a search term");

            const searchForm = document.querySelector("form[action*=result]");
            const searchInput = searchForm.querySelector("input");
            searchInput.value = value;
            searchForm.appendChild(submit).click();
        }

        form.addEventListener("submit", search);
        return container;
    }

    const toast = create(`<div class="yt-minimal-toast"></div>`);

    function showToast(message) {
        toast.textContent = message;
        document.body.append(toast);
        setTimeout(() => toast.remove(), 2000);
    }

    function isActiveEditable() {
        const active = document.activeElement;
        return (
            active.tagName === "TEXTAREA" ||
            active.tagName === "INPUT" ||
            active.isContentEditable
        );
    }

    function initCSS() {
        const css = document.head.appendChild(document.createElement("style"));
        css.textContent = /* css */ `
            /* Popup Styles */
            .yt-minimal-popup-container { display: flex; justify-content: center; align-items: center; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.6); z-index: 9999; }
            .yt-minimal-menu.ytp-panel-menu { background: var(--yt-spec-base-background, #181818); width: 400px; padding: 10px; fill: var(--yt-spec-text-primary, #eee); font-family: "Roboto", "Arial", sans-serif; border-radius: 12px; }
            .ytp-menuitem { display: flex; align-items: center; padding: 12px; cursor: pointer; }
            .ytp-menuitem:hover { background-color: var(--yt-spec-10-percent-layer, #383838); }
            .ytp-menuitem-icon { width: 24px; height: 24px; margin-right: 16px; }
            .ytp-menuitem-label { color: var(--yt-spec-text-primary, #eee); font-size: 14px; flex-grow: 1; }
            .ytp-menuitem-content { margin-left: auto; }
            .ytp-menuitem-toggle-checkbox { background-color: var(--yt-spec-text-disabled, rgb(144, 144, 144)); border-radius: 12px; height: 16px; width: 32px; position: relative; }
            .ytp-menuitem-toggle-checkbox::after { background-color: var(--yt-spec-base-background, #181818); border-radius: 50%; content: ""; height: 24px; width: 24px; position: absolute; top: -4px; left: -2px; transition: left 0.1s cubic-bezier(0.4, 0, 1, 1); }
            .ytp-menuitem[aria-checked=true] .ytp-menuitem-toggle-checkbox { background-color: var(--yt-spec-call-to-action, #6ea8ff); }
            .ytp-menuitem[aria-checked=true] .ytp-menuitem-toggle-checkbox::after { left: 10px; }

            /* Minimal YouTube Styles */
            html[is-homepage][minimal-homepage], html[is-homepage][minimal-homepage] body { overflow: hidden !important; height: 100vh; background-color: var(--yt-spec-base-background, #0f0f0f); }
            html[is-homepage][minimal-homepage] ytd-app > :not(.home-container):not(yt-page-navigation-progress) { display: none !important; }
            html[is-homepage][minimal-homepage] .home-container { display: flex !important; }
            .home-container { display: none; flex-direction: column; gap: 24px; align-items: center; justify-content: center; height: 100%; position: absolute; top: 0; left: 0; width: 100%; background: var(--yt-spec-base-background, #0f0f0f); z-index: 1000; }
            .logo-full { width: 200px; margin-bottom: 20px; }
            .search-group { height: 40px; display: flex; position: relative; }
            .search-input { font-size: 16px; padding: 8px 16px; max-width: 500px; width: calc(100vw - 100px); border-radius: 40px 0 0 40px; border: 1px solid var(--yt-spec-10-percent-layer, #303030); background: var(--ytd-searchbox-background, #121212); color: var(--ytd-searchbox-text-color, white); }
            .search-input:focus { outline: none; border-color: var(--yt-spec-call-to-action, #1c62b9); }
            .search-btn { border: 1px solid var(--yt-spec-10-percent-layer, #303030); border-left: none; height: 40px; cursor: pointer; border-radius: 0 40px 40px 0; padding: 0 24px; background: var(--ytd-searchbox-legacy-button-color, #222222); }
            .search-icon-container { height: 24px; width: 24px; fill: var(--yt-spec-icon-active-other, #909090); }

            /* Hide element styles */
            html[hide-comments] #comments { display: none !important; }
            html[hide-secondary] #secondary { display: none !important; }
            html[hide-related] #related { display: none !important; }
            html[hide-sidebar] #guide, html[hide-sidebar] tp-yt-app-drawer, html[hide-sidebar] ytd-mini-guide-renderer { display: none !important; }
            html[hide-top-bar-buttons] #guide-button, html[hide-top-bar-buttons] #voice-search-button, html[hide-top-bar-buttons] .ytd-masthead #end #buttons { display: none !important; }
            /* FIX: Reclaim sidebar space */
            html[hide-sidebar] ytd-page-manager.ytd-app { margin-left: 0 !important; }

            /* FIX: Overlapping Playlist */
            html[hide-sidebar] ytd-browse[role=main] ytd-playlist-header-renderer:not([hidden]),
            html[hide-sidebar] ytd-browse[role=main] yt-page-header-renderer:not([hidden]) { left: 0 !important; }

            /* Toast */
            .yt-minimal-toast { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); background: var(--yt-spec-base-background, #181818); color: var(--yt-spec-text-primary, #eee); padding: 10px 20px; border-radius: 4px; z-index: 10000; opacity: 0.9; transition: opacity 0.3s; }

            /* Responsive */
            @media (max-width: 600px) {
                .logo-full { width: 150px; }
                .search-input { width: 100%; max-width: none; border-radius: 40px 40px 0 0; }
                .search-btn { border-radius: 0 0 40px 40px; border-top: none; width: 100%; padding: 8px; }
                .search-group { flex-direction: column; height: auto; }
            }
        `;

        for (const key in attr) {
            css.textContent = css.textContent.replaceAll(
                "[" + attr[key] + "]",
                "[" + prefix + attr[key] + attrId + "]"
            );
        }
    }

    async function init() {
        initCSS();
        await loadOptions();
        applyStyles();

        function keyTogglePopup(e) {
            if (
                !e.ctrlKey &&
                e.key.toLowerCase() === "b" &&
                !isActiveEditable()
            ) {
                togglePopup();
            }
        }

        async function syncOptions() {
            await loadOptions();
            applyStyles();
            for (const key in options) {
                menuItems[key].setAttribute("aria-checked", options[key].value);
            }
        }

        window.addEventListener("keydown", keyTogglePopup, true);
        window.addEventListener("yt-navigate-finish", applyStyles);
        window.addEventListener("popstate", applyStyles);
        window.addEventListener("focus", syncOptions);
    }

    new MutationObserver((_, observe) => {
        const app = document.querySelector("ytd-app");

        if (app) {
            observe.disconnect();
            document.body.append(homeContainer);
            init();
        }
    }).observe(document, { subtree: true, childList: true });
})();
