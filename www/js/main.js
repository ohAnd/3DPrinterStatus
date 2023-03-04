/*jslint browser: true */
/*global Aerophane */

var aero;

(function init() {
    "use strict";

    if (aero) {
        return;
    }

    aero = new Aerophane(global.info.appname, [
        { "name": "Home", "id": "home" }, //"../home/home.html" },
        { "name": "3D print templates", "id": "templates" }, //"../list/list.html" },
        // { "name": "Search", "href": "../search/search.html" },
        { "name": "Settings", "id": "settings" } //"../settings/settings.html" }
    ], function () {
        console.log("after new Aerophane and ready")
        global.isDeviceReady = true;

        onDeviceReady();
        cordova.plugins.notification.local.setDummyNotifications();
        configureBackgroundMode();

    });

    // have not te be wait for device ready
    // ...();
    createCommonFooter();
    writeVersionInfo();
    placeConnectButton();
}());

function onDeviceReady() {
    // Cordova is now initialized. Have fun!
    console.log('Running cordova-' + cordova.platformId + '@' + cordova.version);
    document.getElementById('deviceready').classList.add('ready');

    // document.addEventListener("pause", eventAppPausedCall, false);
    // function eventAppPausedCall() {
    //     global.appPaused = true;
    //     global.appResumed = false;
    //     addDebugEntryToLog("event - app paused (putted into background)");
    // }
    // document.addEventListener("resume", eventAppResumedCall, false);
    // function eventAppResumedCall() {
    //     global.appPaused = false;
    //     global.appResumed = true;
    //     addDebugEntryToLog("event - app resume (returned from background)");
    // }

    //cancel possible existing progress notification
    cordova.plugins.notification.local.clear(global.info.notifications.progressID, function () {
        addDebugEntryToLog("onDeviceReady - notification progress cleared");
    });
}

function configureBackgroundMode() {
    // cordova.plugins.backgroundMode.setDefaults({
    //     title: "app is running in background",
    //     text: "TEXT: app is running in background :TEXT",
    //     //icon: 'icon', // this will look for icon.png in platforms/android/res/drawable|mipmap
    //     //color: "" // hex format like 'F14F4D'
    //     // resume: Boolean,
    //     // hidden: Boolean,
    //     // bigText: Boolean
    // });
    cordova.plugins.backgroundMode.overrideBackButton();
    cordova.plugins.backgroundMode.enable();

    // // if "hw" back button is pressed - go to "home" - first page
    // document.addEventListener("backbutton", onBackKeyDown, false);
    // // const home = document.getElementById(navItems[0].id);
    // function onBackKeyDown(e) {
    //     // only when not home, go back to home, otherwise close the app
    //     if (home.style.display != "") {
    //         e.preventDefault();
    //         switchArticles(navItems, navItems[0].id);
    //     } else {
    //         // navigator.app.exitApp();
    //         // cordova.plugins.backgroundMode.moveToBackground();
    //     }
    // }

    cordova.plugins.backgroundMode.onfailure = function(errorCode){
        addEntryToLog("backgroundMode - failed : " + errorCode, consoleDebug);
    };
    

    // react on event
    let backgroundModeTimer = '';
    let backgroundSocket = '';
    cordova.plugins.backgroundMode.on('activate', function () {
        global.appPaused = true;
        global.appResumed = false;
        addEntryToLog(".backgroundMode.on('activate') - " + sessionState, consoleDebug);
        // backgroundModeTimer = setInterval(function () {
        //     if (baseConnection.active) {
        //         sessionState = "backgroundUpdateStarting";
        //         backgroundSocket = startConnection();
        //     }
        // }, 5000);
    });

    cordova.plugins.backgroundMode.on('deactivate', function () {
        global.appPaused = false;
        global.appResumed = true;
        addEntryToLog(".backgroundMode.on('deactivate') - " + sessionState, consoleDebug);
        clearInterval(backgroundModeTimer);
    });
}

function createCommonFooter() {
    const footerElem = document.querySelector("body > footer");
    // console.log(footerElem);
    footerElem.innerHTML = ""; // clear old stuff

    const para = document.createElement("p");
    para.innerHTML = "&copy; 2023 " + global.info.appname + " - ";

    const smallElem = document.createElement("i");
    // smallElem.innerHTML("%%BUILDNUMBER%%");
    smallElem.className = "build";
    // smallElem.innerHTML("%%BUILDNUMBER%%");

    para.appendChild(smallElem);

    // device connect state
    const newDiv = document.createElement("div");
    newDiv.id = "deviceready";
    newDiv.classList.add("blink");

    const newP1 = document.createElement("p");
    newP1.classList.add("event", "listening");
    newP1.innerHTML = "_x_"
    newDiv.appendChild(newP1);

    const newP2 = document.createElement("p");
    newP2.classList.add("event", "received");
    newP2.innerHTML = "_o_"
    newDiv.appendChild(newP2);

    para.appendChild(newDiv);

    footerElem.appendChild(para);
    return true;
}

function writeVersionInfo() {
    const versionElems = Array.from(document.getElementsByClassName("appversion"));
    versionElems.forEach(element => {
        element.innerHTML = global.info.version;
    });

    const buildElems = Array.from(document.getElementsByClassName("build"));
    buildElems.forEach(element => {
        element.innerHTML = global.info.build;
    });

    const builddateElems = Array.from(document.getElementsByClassName("builddate"));
    builddateElems.forEach(element => {
        element.innerHTML = global.info.build_date;
    });
}

function placeConnectButton() {

    // printer connect
    const newDiv2 = document.createElement("button");
    newDiv2.id = "connectStartStop";
    newDiv2.classList.add("blink");

    const newButtonConnection = document.createElement("p");
    newButtonConnection.id = "initiateConnection";
    newButtonConnection.innerText = "connect";
    newDiv2.appendChild(newButtonConnection);

    document.getElementsByTagName("header")[0].appendChild(newDiv2);
}

// value update with animation
forEachElement(Array.from(document.querySelectorAll('[id^="global.printerData."]')), function (el) {
    const varObjAttr = (el.id).split('.');

    observer = new MutationObserver(function (mutationsList, observer) {
        // console.log(mutationsList);
        const elem = mutationsList[0].target;
        elem.classList.add("animateValue");
        elem.style.color = "#eee";
        // console.log("event change in value for " + elem.id + " new innerHtml: " + elem.innerHTML);
        setTimeout(function () {
            // elem.classList.remove("animateValue");
            elem.style.color = "black";
            // console.log("timeout --- event change in value for " + elem.id + " new innerHtml: " + elem.innerHTML);
        }, 250);

        // elem.style.animation = "";
    });

    observer.observe(el, { characterData: false, childList: true, attributes: false });
    console.log("add event change for value: " + el.id);

});