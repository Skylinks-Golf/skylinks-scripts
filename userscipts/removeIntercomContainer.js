// ==UserScript==
// @name         Remove Intercom Container
// @namespace    http://tampermonkey.net/
// @version      2025-10-14
// @description  remove the annoying interom element from Lightspeed Retail
// @author       ideans
// @match        https://us.merchantos.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=merchantos.com
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const CONTAINER_ID = "intercom-lightweight-app";
    const LAUNCHER_CSS_CLASS = "intercom-launcher";

    setTimeout( removeIntercomContainer, 6000 );

    function removeIntercomContainer() {
        console.log(" <---------------- SKYLINKS TEST ----------------->");

        let container;

        try {
            console.log("[skylinks] Attemping to obtain intercom container element...");
            container = document.getElementById(CONTAINER_ID);
            console.log("[sklylinks] ...element found.", container);
        } catch(error) {
            console.error(error);
        }

        console.log("[skylinks] Unmounting element...");

        if (container.style.display !== "none") {
            container.style.display = "none";
            console.log("[skylinks] element unmounted.")
        } else {
            console.log("[skylinks] element already unmounted.")
        }

        console.log("[skylinks] Annoying Lightspeed intercom element removed. Enjoy being unobtructed :)")

        removeIntercomLauncher();
    }

    function removeIntercomLauncher() {
        let elements = document.getElementsByClassName(LAUNCHER_CSS_CLASS);

        elements.foreach(el => el.style.display = "none");
    }

})();