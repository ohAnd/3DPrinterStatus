/*jslint browser: true */
/*global Aerophane */

var aero;

(function init() {
    "use strict";

    if (aero) {
        return;
    }

    aero = new Aerophane(global.info.appname, [
        { "name": "Home", "id": "home" },
        { "name": "3D print infos", "id": "templates" },
        { "name": "Settings", "id": "settings" }
    ], function () {
        console.log("after new Aerophane and ready")
        global.isDeviceReady = true;

        cordova.plugins.notification.local.setDummyNotifications();
        onDeviceReady();
        configureBackgroundMode();

    });

    // have not te be wait for device ready
    // ...();
    createCommonFooter();
    writeVersionInfo();
    placeConnectButton();
    registerEventsForElemValueChagnedForAnimation();
}());

function onDeviceReady() {
    // Cordova is now initialized. Have fun!
    console.log('Running cordova-' + cordova.platformId + '@' + cordova.version);
    document.getElementById('deviceready').classList.add('ready');

    console.log(cordova.plugins.notification.local.launchDetails);

    let testTimer = '';

    document.addEventListener("pause", eventAppPausedCall, false);
    function eventAppPausedCall() {
        global.appPaused = true;
        global.appResumed = false;
        addDebugEntryToLog("event - app paused (putted into background)");

        cordova.plugins.notification.local.schedule({
            id: 42,
            text: "background update started",
            foreground: false,
            sound: false
        });
        cordova.plugins.notification.local.on('trigger', function (notification) {
            addDebugEntryToLog("update notification trigger: " + notification.id);
        });
        addDebugEntryToLog("starting testTimer: " + testTimer);
        testTimer = setInterval(function () {
            addDebugEntryToLog("testTimer triggered: " + testTimer);
            cordova.plugins.notification.local.update({
                id: 42,
                text: "background update triggered",
                foreground: false,
                sound: false
            });
        }, 60000);
    }


    cordova.plugins.notification.local.on('trigger', (notification) => { // do something with notification
        addDebugEntryToLog("update notification trigger: " + notification.id);
    });

    document.addEventListener("resume", eventAppResumedCall, false);
    function eventAppResumedCall() {
        global.appPaused = false;
        global.appResumed = true;
        addDebugEntryToLog("event - app resume (returned from background)");

        clearInterval(testTimer);

        cordova.plugins.notification.local.clear(42, function () {
            addDebugEntryToLog("update notification cleared");
        });
    }

    // cancel possible existing progress notification
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
    // cordova.plugins.backgroundMode.overrideBackButton();
    // cordova.plugins.backgroundMode.enable();

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

    // cordova.plugins.backgroundMode.onfailure = function(errorCode){
    //     addEntryToLog("backgroundMode - failed : " + errorCode, consoleDebug);
    // };


    // react on event
    // let backgroundModeTimer = '';
    // let backgroundSocket = '';
    // cordova.plugins.backgroundMode.on('activate', function () {
    //     global.appPaused = true;
    //     global.appResumed = false;
    //     addEntryToLog(".backgroundMode.on('activate') - " + session.state, consoleDebug);
    //     // backgroundModeTimer = setInterval(function () {
    //     //     if (baseConnection.active) {
    //     //         session.state = "backgroundUpdateStarting";
    //     //         backgroundSocket = startConnection();
    //     //     }
    //     // }, 5000);
    // });

    // cordova.plugins.backgroundMode.on('deactivate', function () {
    //     global.appPaused = false;
    //     global.appResumed = true;
    //     addEntryToLog(".backgroundMode.on('deactivate') - " + session.state, consoleDebug);
    //     clearInterval(backgroundModeTimer);
    // });
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

function registerEventsForElemValueChagnedForAnimation() {
    forEachElement(Array.from(document.querySelectorAll('[id^="global.printerData."]')), function (el) {

        observer = new MutationObserver(function (mutationsList, observer) {
            // console.log(mutationsList);
            const elem = mutationsList[0].target;
            elem.classList.add("animateValue");
            elem.style.color = "#eee";
            // console.log("event change in value for " + elem.id + " new innerHtml: " + elem.innerHTML);
            setTimeout(function () {
                elem.style.color = "black";
                // console.log("timeout --- event change in value for " + elem.id + " new innerHtml: " + elem.innerHTML);
            }, 250);
        });

        observer.observe(el, { characterData: false, childList: true, attributes: false });
        console.log("main.js - add eventListener for value change in element id: " + el.id);
    });
}