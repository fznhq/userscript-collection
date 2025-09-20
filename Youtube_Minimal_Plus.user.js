// ==UserScript==
// @name         Minimal YouTube
// @namespace    http://tampermonkey.net/
// @version      2.4
// @description  A minimal YouTube experience with a customizable interface.
// @author       Your Name
// @match        https://*.youtube.com/*
// @grant        GM.getValue
// @grant        GM.setValue
// @grant        GM_addValueChangeListener
// @run-at       document-start
// ==/UserScript==

(function () {
    "use strict";

    const debug = true;

    const options = {
        minimalHomepage: {
            label: "Enable Minimal Homepage",
            value: true,
            onUpdate: applyStyles,
            icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"></path></svg>`
        },
        hideComments: {
            label: "Hide Comments",
            value: true,
            onUpdate: applyStyles,
            icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M21.99 4c0-1.1-.89-2-1.99-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4-.01-18zM18 14H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"></path></svg>`
        },
        hideSecondary: {
            label: "Hide Recommendations",
            value: true,
            onUpdate: applyStyles,
            icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M4 18h11v-2H4v2zm0-5h11v-2H4v2zm0-5h11V6H4v2zm14 1.5v9l6-4.5z"></path></svg>`
        },
        hideRelated: {
            label: "Hide Related Videos",
            value: true,
            onUpdate: applyStyles,
            icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"></path></svg>`
        },
        hideSidebar: {
            label: "Hide Sidebar",
            value: true,
            onUpdate: applyStyles,
            icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"></path></svg>`
        },
        hideTopBarButtons: {
            label: "Hide Top Bar Buttons",
            value: true,
            onUpdate: applyStyles,
            icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M21 6H3V5h18v1zm-2 4H5v1h14v-1zm2 4H3v1h18v-1z"></path></svg>`
        },
    };

    let popup;
    let homeContainer;
    let menuItems = {};

    async function loadOptions() {
        for (const key in options) {
            const savedValue = await GM.getValue(key, options[key].value);
            options[key].value = savedValue;
        }
    }

    function saveOption(key, value) {
        options[key].value = value;
        GM.setValue(key, value);
        if (options[key].onUpdate) {
            options[key].onUpdate();
        }
        showToast(`${options[key].label} ${value ? 'enabled' : 'disabled'}`);
    }

    const prefix = "ytmp-";
    const attrId = "-" + Date.now().toString(36).slice(-4);
    const attr = {
        minimalHomepage: "minimal-homepage",
        hideComments: "hide-comments",
        hideSecondary: "hide-secondary",
        hideRelated: "hide-related",
        hideSidebar: "hide-sidebar",
        hideTopBarButtons: "hide-top-bar-buttons",
    };

    function setHtmlAttr(attrName, state) {
        document.documentElement.toggleAttribute(prefix + attr[attrName] + attrId, state);
    }

    function applyStyles() {
        if (debug) console.log('Applying styles...');
        const html = document.documentElement;
        const isHomepage = window.location.pathname === "/";
        try {
            setHtmlAttr("minimalHomepage", options.minimalHomepage.value && isHomepage);
            setHtmlAttr("hideComments", options.hideComments.value);
            setHtmlAttr("hideSecondary", options.hideSecondary.value);
            setHtmlAttr("hideRelated", options.hideRelated.value);
            setHtmlAttr("hideSidebar", options.hideSidebar.value);
            setHtmlAttr("hideTopBarButtons", options.hideTopBarButtons.value);

            if (options.minimalHomepage.value && isHomepage) {
                if (!homeContainer) createHomeContainer();
                homeContainer.style.display = 'flex';
            } else if (homeContainer) {
                homeContainer.style.display = 'none';
            }
        } catch (e) {
            if (debug) console.error('Error applying styles:', e);
        }
    }

    function createMenuItem(key) {
        const option = options[key];
        const item = document.createElement("div");
        item.className = "ytp-menuitem";

        const icon = document.createElement("div");
        icon.className = "ytp-menuitem-icon";
        icon.innerHTML = option.icon;

        const label = document.createElement("div");
        label.className = "ytp-menuitem-label";
        label.textContent = option.label;

        const content = document.createElement("div");
        content.className = "ytp-menuitem-content";
        const toggleCheckbox = document.createElement("div");
        toggleCheckbox.className = "ytp-menuitem-toggle-checkbox";
        content.appendChild(toggleCheckbox);

        item.append(icon, label, content);

        item.setAttribute("aria-checked", option.value);
        item.addEventListener("click", () => {
            const newValue = !options[key].value;
            item.setAttribute("aria-checked", newValue);
            saveOption(key, newValue);
        });

        menuItems[key] = item;
        return item;
    }

    function createPopup() {
        popup = document.createElement("div");
        popup.className = "yt-minimal-popup-container";
        popup.style.display = "none";
        popup.setAttribute('role', 'dialog');
        popup.setAttribute('aria-modal', 'true');
        popup.setAttribute('tabindex', '-1');

        const menu = document.createElement("div");
        menu.className = "yt-minimal-menu ytp-panel-menu";
        popup.appendChild(menu);

        for (const key in options) {
            menu.appendChild(createMenuItem(key));
        }

        document.body.appendChild(popup);

        popup.addEventListener('click', (e) => {
            if (e.target === popup) togglePopup();
        });
        popup.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                togglePopup();
            }
        });
    }

    function togglePopup() {
        if (!popup) createPopup();
        const isHidden = popup.style.display === "none";
        popup.style.display = isHidden ? "flex" : "none";
        if (!isHidden) return;
        popup.focus();
    }

    function createHomeContainer() {
        const app = document.querySelector('ytd-app');
        if (!app) {
            if (debug) console.error('ytd-app not found');
            return;
        }
        homeContainer = document.createElement('div');
        homeContainer.className = 'home-container';
        homeContainer.style.display = 'none';

        homeContainer.innerHTML = `
          <div class="logo-full">
            <svg viewBox="0 0 90 20" preserveAspectRatio="xMidYMid meet" focusable="false" class="style-scope yt-icon" style="pointer-events: none; display: block; width: 100%; height: 100%;"><g class="style-scope yt-icon"><path d="M27.9727 3.12324C27.6435 1.89323 26.6768 0.926623 25.4468 0.597366C23.2197 2.24288e-07 14.285 0 14.285 0C14.285 0 5.35042 2.24288e-07 3.12323 0.597366C1.89323 0.926623 0.926623 1.89323 0.597366 3.12324C2.24288e-07 5.35042 0 10 0 10C0 10 2.24288e-07 14.6496 0.597366 16.8768C0.926623 18.1068 1.89323 19.0734 3.12323 19.4026C5.35042 20 14.285 20 14.285 20C14.285 20 23.2197 20 25.4468 19.4026C26.6768 19.0734 27.6435 18.1068 27.9727 16.8768C28.5701 14.6496 28.5701 10 28.5701 10C28.5701 10 28.5677 5.35042 27.9727 3.12324Z" fill="#FF0000" class="style-scope yt-icon"></path><path d="M11.4253 14.2854L18.8477 10.0004L11.4253 5.71533V14.2854Z" fill="white" class="style-scope yt-icon"></path></g><g class="style-scope yt-icon" fill="white"><path d="M34.6024 13.0036L31.3945 1.41846H34.1932L35.3174 6.6701C35.6043 7.96361 35.8136 9.06662 35.95 9.97913H36.0323C36.1264 9.32532 36.3381 8.22937 36.665 6.68892L37.8291 1.41846H40.6278L37.3799 13.0036V18.561H34.6001V13.0036H34.6024Z" class="style-scope yt-icon"></path><path d="M41.4697 18.1937C40.9053 17.8127 40.5031 17.22 40.2632 16.4157C40.0257 15.6114 39.9058 14.5437 39.9058 13.2078V11.3898C39.9058 10.0422 40.0422 8.95805 40.315 8.14196C40.5878 7.32588 41.0135 6.72851 41.592 6.35457C42.1706 5.98063 42.9302 5.79248 43.871 5.79248C44.7976 5.79248 45.5384 5.98298 46.0981 6.36398C46.6555 6.74497 47.0647 7.34234 47.3234 8.15137C47.5821 8.96275 47.7115 10.0422 47.7115 11.3898V13.2078C47.7115 14.5437 47.5845 15.6161 47.3329 16.4251C47.0812 17.2365 46.672 17.8292 46.1075 18.2031C45.5431 18.5771 44.7764 18.7652 43.8098 18.7652C42.8126 18.7675 42.0342 18.5747 41.4697 18.1937ZM44.6353 16.2323C44.7905 15.8231 44.8705 15.1575 44.8705 14.2309V10.3292C44.8705 9.43077 44.7929 8.77225 44.6353 8.35833C44.4777 7.94206 44.2026 7.7351 43.8074 7.7351C43.4265 7.7351 43.156 7.94206 43.0008 8.35833C42.8432 8.77461 42.7656 9.43077 42.7656 10.3292V14.2309C42.7656 15.1575 42.8408 15.8254 42.9914 16.2323C43.1419 16.6415 43.4123 16.8461 43.8074 16.8461C44.2026 16.8461 44.4777 16.6415 44.6353 16.2323Z"></path><path d="M56.8154 18.5634H54.6094L54.3648 17.03H54.3037C53.7039 18.1871 52.8055 18.7656 51.6061 18.7656C50.7759 18.7656 50.1621 18.4928 49.767 17.9496C49.3719 17.4039 49.1743 16.5526 49.1743 15.3955V6.03751H51.9942V15.2308C51.9942 15.7906 52.0553 16.188 52.1776 16.4256C52.2999 16.6631 52.5045 16.783 52.7914 16.783C53.036 16.783 53.2712 16.7078 53.497 16.5573C53.7228 16.4067 53.8874 16.2162 53.9979 15.9858V6.03516H56.8154V18.5634Z"></path><path d="M64.4755 3.68758H61.6768V18.5629H58.9181V3.68758H56.1194V1.42041H64.4755V3.68758Z"></path><path d="M71.2768 18.5634H69.0708L68.8262 17.03H68.7651C68.1654 18.1871 67.267 18.7656 66.0675 18.7656C65.2373 18.7656 64.6235 18.4928 64.2284 17.9496C63.8333 17.4039 63.6357 16.5526 63.6357 15.3955V6.03751H66.4556V15.2308C66.4556 15.7906 66.5167 16.188 66.639 16.4256C66.7613 16.6631 66.9659 16.783 67.2529 16.783C67.4974 16.783 67.7326 16.7078 67.9584 16.5573C68.1842 16.4067 68.3488 16.2162 68.4593 15.9858V6.03516H71.2768V18.5634Z"></path><path d="M80.609 8.0387C80.4373 7.24849 80.1621 6.67699 79.7812 6.32186C79.4002 5.96674 78.8757 5.79035 78.2078 5.79035C77.6904 5.79035 77.2059 5.93616 76.7567 6.23014C76.3075 6.52412 75.9594 6.90747 75.7148 7.38489H75.6937V0.785645H72.9773V18.5608H75.3056L75.5925 17.3755H75.6537C75.8724 17.7988 76.1993 18.1304 76.6344 18.3774C77.0695 18.622 77.554 18.7443 78.0855 18.7443C79.038 18.7443 79.7412 18.3045 80.1904 17.4272C80.6396 16.5476 80.8653 15.1765 80.8653 13.3092V11.3266C80.8653 9.92722 80.7783 8.82892 80.609 8.0387ZM78.0243 13.1492C78.0243 14.0617 77.9867 14.7767 77.9114 15.2941C77.8362 15.8115 77.7115 16.1808 77.5328 16.3971C77.3564 16.6158 77.1165 16.724 76.8178 16.724C76.585 16.724 76.371 16.6699 76.1734 16.5594C75.9759 16.4512 75.816 16.2866 75.6937 16.0702V8.96062C75.7877 8.6196 75.9524 8.34209 76.1852 8.12337C76.4157 7.90465 76.6697 7.79646 76.9401 7.79646C77.2271 7.79646 77.4481 7.90935 77.6034 8.13278C77.7609 8.35855 77.8691 8.73485 77.9303 9.26636C77.9914 9.79787 78.022 10.5528 78.022 11.5335V13.1492H78.0243Z"></path><path d="M84.8657 13.8712C84.8657 14.6755 84.8892 15.2776 84.9363 15.6798C84.9833 16.0819 85.0821 16.3736 85.2326 16.5594C85.3831 16.7428 85.6136 16.8345 85.9264 16.8345C86.3474 16.8345 86.639 16.6699 86.7942 16.343C86.9518 16.0161 87.0365 15.4705 87.0506 14.7085L89.4824 14.8519C89.4965 14.9601 89.5035 15.1106 89.5035 15.3011C89.5035 16.4582 89.186 17.3237 88.5534 17.8952C87.9208 18.4667 87.0247 18.7536 85.8676 18.7536C84.4777 18.7536 83.504 18.3185 82.9466 17.446C82.3869 16.5735 82.1094 15.2259 82.1094 13.4008V11.2136C82.1094 9.33452 82.3987 7.96105 82.9772 7.09558C83.5558 6.2301 84.5459 5.79736 85.9499 5.79736C86.9165 5.79736 87.6597 5.97375 88.1771 6.32888C88.6945 6.684 89.059 7.23433 89.2707 7.98457C89.4824 8.7348 89.5882 9.76961 89.5882 11.0913V13.2362H84.8657V13.8712ZM85.2232 7.96811C85.0797 8.14449 84.9857 8.43377 84.9363 8.83593C84.8892 9.2381 84.8657 9.84722 84.8657 10.6657V11.5641H86.9283V10.6657C86.9283 9.86133 86.9001 9.25221 86.846 8.83593C86.7919 8.41966 86.6931 8.12803 86.5496 7.95635C86.4062 7.78702 86.1851 7.7 85.8864 7.7C85.5854 7.70235 85.3643 7.79172 85.2232 7.96811Z"></path></g></svg>
          </div>
          <div class="search-group">
            <input class="search-input" placeholder="Search" autofocus />
            <button class="search-btn">
              <div class="search-icon-container">
                <svg viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" focusable="false" style="pointer-events: none; display: block; width: 100%; height: 100%;"><g class="style-scope yt-icon"><path d="M20.87,20.17l-5.59-5.59C16.35,13.35,17,11.75,17,10c0-3.87-3.13-7-7-7s-7,3.13-7,7s3.13,7,7,7c1.75,0,3.35-0.65,4.58-1.71 l5.59,5.59L20.87,20.17z M10,16c-3.31,0-6-2.69-6-6s2.69-6,6-6s6,2.69,6,6S13.31,16,10,16z" class="style-scope yt-icon"></path></g></svg>
              </div>
            </button>
          </div>
        `;
        app.appendChild(homeContainer);

        const input = homeContainer.querySelector(".search-input");
        const searchBtn = homeContainer.querySelector(".search-btn");

        const search = () => {
            const inputValue = input.value.trim();
            if (!inputValue) {
                showToast("Enter a search term");
                return;
            }
            window.location.href = `https://www.youtube.com/results?search_query=${encodeURIComponent(inputValue)}`;
        };

        input.addEventListener("keypress", (e) => {
            if (e.key === "Enter") search();
        });
        searchBtn.addEventListener("click", search);
    }

    function showToast(message) {
        const toast = document.createElement('div');
        toast.textContent = message;
        toast.className = 'yt-minimal-toast';
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2000);
    }

    function init() {
        loadOptions().then(() => {
            const style = document.createElement("style");
            let cssText = `
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
                html[${prefix}minimal-homepage${attrId}], html[${prefix}minimal-homepage${attrId}] body { height: 100vh; background-color: var(--yt-spec-base-background, #0f0f0f); }
                html[${prefix}minimal-homepage${attrId}] ytd-app > :not(.home-container) { display: none !important; }
                .home-container { display: none; flex-direction: column; gap: 24px; align-items: center; justify-content: center; height: 100%; position: absolute; top: 0; left: 0; width: 100%; background: var(--yt-spec-base-background, #0f0f0f); z-index: 1000; }
                .logo-full { width: 200px; margin-bottom: 20px; }
                .search-group { height: 40px; display: flex; position: relative; }
                .search-input { font-size: 16px; padding: 8px 16px; max-width: 500px; width: calc(100vw - 100px); border-radius: 40px 0 0 40px; border: 1px solid var(--yt-spec-10-percent-layer, #303030); background: var(--ytd-searchbox-background, #121212); color: var(--ytd-searchbox-text-color, white); }
                .search-input:focus { outline: none; border-color: var(--yt-spec-call-to-action, #1c62b9); }
                .search-btn { border: 1px solid var(--yt-spec-10-percent-layer, #303030); border-left: none; height: 40px; cursor: pointer; border-radius: 0 40px 40px 0; padding: 0 24px; background: var(--ytd-searchbox-legacy-button-color, #222222); }
                .search-icon-container { height: 24px; width: 24px; fill: var(--yt-spec-icon-active-other, #909090); }

                /* Hide element styles */
                html[${prefix}hide-comments${attrId}] #comments { display: none !important; }
                html[${prefix}hide-secondary${attrId}] #secondary { display: none !important; }
                html[${prefix}hide-related${attrId}] #related { display: none !important; }
                html[${prefix}hide-sidebar${attrId}] #guide, html[${prefix}hide-sidebar${attrId}] tp-yt-app-drawer, html[${prefix}hide-sidebar${attrId}] ytd-mini-guide-renderer { display: none !important; }
                html[${prefix}hide-top-bar-buttons${attrId}] #guide-button, html[${prefix}hide-top-bar-buttons${attrId}] #voice-search-button, html[${prefix}hide-top-bar-buttons${attrId}] .ytd-masthead #end #buttons { display: none !important; }
                /* FIX: Reclaim sidebar space */
                html[${prefix}hide-sidebar${attrId}] ytd-page-manager.ytd-app { margin-left: 0 !important; }

                /* FIX: Overlapping Playlist */
                html[${prefix}hide-sidebar${attrId}] ytd-browse[role=main] ytd-playlist-header-renderer:not([hidden]),
                html[${prefix}hide-sidebar${attrId}] ytd-browse[role=main] yt-page-header-renderer:not([hidden]) { left: 0 !important; }

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
            style.textContent = cssText;
            document.head.appendChild(style);

            window.addEventListener("keydown", (e) => {
                if (e.key.toLowerCase() === "b" && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
                    e.preventDefault();
                    e.stopPropagation();
                    togglePopup();
                }
            }, true);

            window.addEventListener('yt-navigate-finish', applyStyles);
            window.addEventListener('popstate', applyStyles);
            window.addEventListener('hashchange', applyStyles);

            for (const key in options) {
                GM_addValueChangeListener(key, (name, old_value, new_value, remote) => {
                    if (remote) {
                        options[key].value = new_value;
                        applyStyles();
                        if (menuItems[key]) {
                            menuItems[key].setAttribute('aria-checked', new_value);
                        }
                    }
                });
            }

            applyStyles();
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
