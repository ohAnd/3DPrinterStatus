/*jslint browser: true */
/*global aero */

(function init() {
    "use strict";
    aero.dialogSelect(document.querySelectorAll("select.aeroSelect"));
    aero.fastForm();
}());

aero.touchclick(document.getElementById("testTCPConnection"), function () {
    "use strict";
    aero.showDialog(document.querySelector("div.dialog"));
});

let baseConnection = {};
baseConnection.active = false;
baseConnection.intervalDataRefeshTimer = ''
baseConnection.intervalStateRefeshTimer = '';

let testConnection = {};
testConnection.active = false;
testConnection.timestampLogging = 0;

// base connection
aero.touchclick(document.getElementById("connectStartStop"), function () {
    "use strict";
    startStopPrinterSession();
});

function startStopPrinterSession() {
    if (!baseConnection.active || global.info.settings.retryCnt != 0) {
        baseConnection.active = true;
        printerSocket = sessionStart();
        document.getElementById("initiateConnection").innerText = "disconnect";
        addEntryToLog("settings.js (event button connectStartStop) - started base connection", consoleDebug);
        startCheckSession();
    } else {
        baseConnection.active = false;
        sessionStop(printerSocket);
        document.getElementById("initiateConnection").innerText = "connect";
        addEntryToLog("settings.js (event button connectStartStop) - stopped base connection", consoleDebug);
    }
}

// debug

document.getElementById("appStarted").innerText = getTimestamp(true);

// show sessionState
let cacheSessionState = '';
let cachesessionCheckCounter = '';
let debugCheckSessionTimer = null;

function startCheckSession() {
    addDebugEntryToLog("startCheckSession - with setInterval - timerid: " + debugCheckSessionTimer);
    if (debugCheckSessionTimer == null) { // only if timer cleared fully, then 
        debugCheckSessionTimer = setInterval(function () {
            if (cacheSessionState != sessionState) {
                addDebugEntryToLog("session changed - " + cacheSessionState + " -> " + sessionState);
                cacheSessionState = sessionState;
                document.getElementById("sessionState").innerText = sessionState;
                if (sessionState == "established") {
                    document.getElementById("initiateConnection").parentElement.style.background = "#009445"; //green
                    global.info.settings.retryCnt = 0; // retry cnt 0, because session is successfully established
                } else if (sessionState == "releasing") {
                    document.getElementById("initiateConnection").parentElement.style.background = "#10a4eb"; //lightblue
                } else if (sessionState == "finished") {
                    document.getElementById("initiateConnection").parentElement.style.background = "#00cf5c"; //light green
                    startRetries(5, sessionState);
                } else if (sessionState == "blocked") {
                    document.getElementById("initiateConnection").parentElement.style.background = "#542d2d"; //brown
                    startRetries(20, sessionState);
                } else if (sessionState.startsWith("backgroundUpdate")) {
                    document.getElementById("initiateConnection").parentElement.style.background = "#d8e300"; // yellow
                } else {
                    document.getElementById("initiateConnection").parentElement.style.background = "#e80b0b"; //red
                }
                // set state of baseConnection
                document.getElementById("baseConnection").innerText = baseConnection.active;
            }
            notificationProgress(global.printerData.job.progress);

            if (cachesessionCheckCounter != sessionCheckCounter) {
                cachesessionCheckCounter = sessionCheckCounter;
                if (sessionCheckCounter % 30 == 0 && !global.appPaused) {
                    addDebugEntryToLog("sessionTimer FOREground -> " + sessionCheckCounter, true, true);
                } else if (global.appPaused) {
                    addDebugEntryToLog("sessionTimer BACKground -> " + sessionCheckCounter, true, true);
                }
            }
            if (!baseConnection.active) {
                clearInterval(debugCheckSessionTimer);
                debugCheckSessionTimer = null;
                addDebugEntryToLog("sessionTimer Stopped", true, true);
            }
        }, 100);
    }
}

function startRetries(retries, state = '') {
    if (baseConnection.active) { // retrigger session with increment of retry counter if user not closed the session
        global.info.settings.retryCnt = global.info.settings.retryCnt + 1;
        if (global.info.settings.retryCnt > retries) {
            global.info.settings.retryCnt = 0;
        } else {
            addDebugEntryToLog("session changed -> " + state + " - starting retry no. " + global.info.settings.retryCnt, true, true, 'warn');
        }
        // if retryCnt > 0 start new connection, else stop session
        startStopPrinterSession();
    }
}

// local notification
let cacheProgress = '';
function notificationProgress(progressValue) {
    // set or update progress notification if change occured AND connection active
    if (baseConnection.active && global.printerData.status.MachineStatus == "BUILDING_FROM_SD") {
        // if notification not set -> start progress notification
        cordova.plugins.notification.local.isPresent(global.info.notifications.progressID, function (present) {
            if (present == false) {
                try {
                    cordova.plugins.notification.local.schedule({
                        id: global.info.notifications.progressID,
                        title: '3D printing in progress ',
                        text: ' ' + progressValue + ' %',
                        smallIcon: 'res://info',
                        icon: 'res://img/3d-printing-icon.png',
                        progressBar: { value: progressValue },
                        foreground: true,
                        sound: null
                    });
                } catch (error) {
                    console.log("settings.js - Exception 'cordova module not found': catching notification for browser debugging: " + error.message);
                }
            } else {

                if (cacheProgress != global.printerData.job.progress) {
                    try {
                        cordova.plugins.notification.local.update({
                            id: global.info.notifications.progressID,
                            title: '3D printing in progress ',
                            text: ' ' + progressValue + ' %',
                            smallIcon: 'res://info',
                            icon: 'res://img/3d-printing-icon.png',
                            progressBar: { value: progressValue },
                            sound: null,
                            foreground: false
                        });
                    } catch (error) {
                        console.log("settings.js - Exception 'cordova module not found': catching notification for browser debugging: " + error.message);
                    }
                }
                // once notification every 10 % and at the end
                if (cacheProgress != global.printerData.job.progress) {
                    if (((progressValue % 10) == 0 && progressValue != 0) || progressValue >= 99) {
                        let titleVar = '3D printing running';
                        let textVar = 'current progress: ' + progressValue + " %";
                        if (progressValue >= 99) {

                            titleVar = '3D printing done';
                            textVar = 'your printing job was finalized (' + progressValue + ' %)';
                        }
                        try {
                            cordova.plugins.notification.local.schedule({
                                title: titleVar,
                                text: textVar,
                                smallIcon: 'res://info',
                                icon: 'res://img/3d-printing-icon.png',
                                foreground: true
                            });

                        } catch (error) {
                            console.log("settings.js - Exception 'cordova module not found': catching notification for browser debugging: " + error.message);
                        }
                    }
                }
                cacheProgress = global.printerData.job.progress;
            }
        });
    }
}


// test connection
function getTimestamp(clock = false) {
    const timestamp = Date.now();
    let timestampLogNow = timestamp - testConnection.timestampLogging;
    const timestampSec = Math.floor(timestampLogNow / 1000);
    let timestampMSec = timestampLogNow - (timestampSec * 1000)
    timestampMSec = ("000" + timestampMSec).substring(("000" + timestampMSec).length - 3);
    timestampLogNow = (("00" + timestampSec).slice(-3)) + "." + timestampMSec;

    if (clock) {
        let currentDateTime = new Date()
        let hours = ("00" + currentDateTime.getHours()).slice(-2);
        let minutes = ("00" + currentDateTime.getMinutes()).slice(-2);
        let seconds = ("00" + currentDateTime.getSeconds()).slice(-2);
        let milliseconds = ("000" + currentDateTime.getMilliseconds()).slice(-3);

        timestampLogNow = hours + ":" + minutes + ":" + seconds + "." + milliseconds;
    }

    return timestampLogNow;
}
function addEntryToLog(newEntry, consoleLog = false, appDebugLog = true, type = '') {
    const logMessage = getTimestamp(true) + ": " + newEntry;
    if (appDebugLog) {
        document.getElementById("testTCPConnectionLog").innerHTML += logMessage + "<br/>";
    }
    if (consoleLog) {
        if (type == "info") {
            console.info(logMessage);
        } else if (type == "warn") {
            console.warn(logMessage);
        } else if (type == "error") {
            console.error(logMessage);
        } else { // verbose else { // verbose
            console.log(logMessage);
        }
    }
    return true;
}
function addDebugEntryToLog(newEntry, consoleLog = true, appDebugLog = true, type = '') {
    const logMessage = getTimestamp(true) + ": " + newEntry;
    if (appDebugLog) {
        document.getElementById("debugLog").innerHTML += logMessage + "<br/>";
        var scroll = document.getElementById("debugLog");
        scroll.scrollTop = scroll.scrollHeight;
    }
    if (consoleLog) {
        if (type == "info") {
            console.info(logMessage);
        } else if (type == "warn") {
            console.warn(logMessage);
        } else if (type == "error") {
            console.error(logMessage);
        } else { // verbose else { // verbose
            console.log(logMessage);
        }
    }
    return true;
}
function startConnectStateRepetion() {
    addEntryToLog("settings.js (startConnectStateRepetion) - start timer with 1000ms", consoleDebug);
    baseConnection.intervalStateRefeshTimer = setInterval(function () {
        let connState = getSocketState(printerSocket);
        addEntryToLog("settings.js (startConnectStateRepetion) - connect state: " + connState, consoleDebug);
    }, 1000);
}
function stopConnectStateRepetion(timerObj) {
    clearInterval(timerObj);
    addEntryToLog("stopConnectStateRepetion", consoleDebug)
}
aero.touchclick(document.getElementById("testTCPConnectionStart"), function () {
    "use strict";
    if (!testConnection.active) {
        if (!baseConnection.active) {
            document.getElementById("testTCPConnectionStart").disabled = true;
            document.getElementById("testTCPConnectionStop").disabled = false;
            document.getElementById("testTCPConnectionGetInfo").disabled = false;
            document.getElementById("testTCPConnectionGetStatus").disabled = false;
            document.getElementById("testTCPConnectionGetTemp").disabled = false;
            document.getElementById("testTCPConnectionGetProgress").disabled = false;

            document.getElementById("testTCPConnectionLog").innerText = ""; // empyt log
            testConnection.timestampLogging = Date.now();
            addEntryToLog("settings.js (event testTCPConnectionStart) - start connection", consoleDebug);

            startConnectStateRepetion();

            printerSocket = startConnection();

            // try {
            //     cordova.plugins.notification.local.schedule({
            //         title: 'test connection initiated',
            //         text: 'please check the log in the settings detail view',
            //         smallIcon: 'res://info',
            //         icon: 'res://img/3d-printing-icon.png',
            //         foreground: true
            //     });
            // } catch (error) {
            //     console.log("settings.js - Exception 'cordova module not found': catching notification for browser debugging: " + error.message);
            // }

            testConnection.active = true;
        } else {
            addEntryToLog("could not start test connection - base connection is still active", consoleDebug);
        }
    }
});
aero.touchclick(document.getElementById("testTCPConnectionStop"), function () {
    if (testConnection.active) {
        document.getElementById("testTCPConnectionStart").disabled = false;
        document.getElementById("testTCPConnectionStop").disabled = true;
        document.getElementById("testTCPConnectionGetInfo").disabled = true;
        document.getElementById("testTCPConnectionGetStatus").disabled = true;
        document.getElementById("testTCPConnectionGetTemp").disabled = true;
        document.getElementById("testTCPConnectionGetProgress").disabled = true;

        addEntryToLog("settings.js (event testTCPConnectionStop) - stop connection", consoleDebug);

        stopConnectStateRepetion(baseConnection.intervalStateRefeshTimer);

        printerControlEnd(printerSocket);
        //@todo: timeout handling if no cntrol relase given
        // shutdownConnection(printerSocket);

        testConnection.active = false;
    }
});
aero.touchclick(document.getElementById("testTCPConnectionGetStatus"), function () {
    if (testConnection.active) {
        addEntryToLog("request info message");
        printerGetStatus(printerSocket);

        // let teststr = "CMD M119 Received.\r\n" +
        //     "Endstop: X-max:1 Y-max:1 Z-max:1\r\n" +
        //     "MachineStatus: READY\r\n" +
        //     "MoveMode: READY\r\n" +
        //     "Status: S:1 L:0 J:0 F:0\r\n" +
        //     "ok\r\n" +
        //     "\r\n";
        // let responseString = teststr.replace(/(\r\n|\r|\n)/g, ";");
        // console.log("protocol.js - str replace: " + responseString);

        // global.printerData.status = decodeStatus(responseString);
        // console.log(global.printerData.status);
    }
});
aero.touchclick(document.getElementById("testTCPConnectionGetInfo"), function () {
    if (testConnection.active) {
        addEntryToLog("request status message");
        printerGetInfo(printerSocket);


        // let teststr = "CMD M115 Received.\r\n" +
        //     "Machine Type: FlashForge Adventurer III\r\n" +
        //     "Machine Name: MeinLieblingsdrucker\r\n" +
        //     "Firmware: v2.2.18889\r\n" +
        //     "SN: SNFFAD263858\r\n" +
        //     "X: 150 Y: 150 Z: 150\r\n" +
        //     "Tool Count: 1\r\n" +
        //     "Mac Address: 88:A9:A7:91:AC:12\r\n" +
        //     "\r\n" +
        //     "ok\r\n";

        // let responseString = teststr.replace(/(\r\n|\r|\n)/g, ";");
        // console.log("protocol.js - str replace: " + responseString);

        // global.printerData.info = decodeInfo(responseString);
        // console.log(global.printerData.info);

    }
});
aero.touchclick(document.getElementById("testTCPConnectionGetTemp"), function () {
    if (testConnection.active) {
        addEntryToLog("request temp message");
        printerGetTemp(printerSocket);


        // let teststr = "CMD M105 Received.\r\nT0:27 /0 B:20/0\r\nok\r\n";

        // let responseString = teststr.replace(/(\r\n|\r|\n)/g, ";");
        // console.log("protocol.js - str replace: " + responseString);

        // global.printerData.temps = decodeTemp(responseString);
        // console.log(global.printerData.info);

    }
});
aero.touchclick(document.getElementById("testTCPConnectionGetProgress"), function () {
    if (testConnection.active) {
        addEntryToLog("request progress message");
        printerGetProgress(printerSocket);


        // let teststr = "CMD M27 Received.\r\nSD printing byte 27/100\r\nok\r\n";

        // let responseString = teststr.replace(/(\r\n|\r|\n)/g, ";");
        // console.log("protocol.js - str replace: " + responseString);

        // global.printerData.job = decodeProgress(responseString);
        // console.log(global.printerData.info);

    }
});
