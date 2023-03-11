// global.js - shared variables saved at local storage.
const consoleDebug = true;

let global = {};
global.isDeviceReady = false;
global.appPaused = false;
global.appResumed = true;

global.info = {};
global.info.appname = '3D Printer Status';
global.info.version = '%%VERSION%%';
global.info.build = '%%BUILDNUMBER%%';
global.info.build_date = '%%BUILDDATE%%';

global.settings = {};
global.settings.holdConnectionOn = 0;
global.settings.isDarkModeOn = 0;
global.settings.retryCnt = 0;
global.settings.screen = {};
global.settings.screen.debugWindowOnStart = 0;

global.info.notifications = {};
global.info.notifications.on = true;
global.info.notifications.progressID = 15;

global.printerData = {};
global.printerData.base = {};
global.printerData.base.printerIPadress = '192.168.0.1';
global.printerData.base.printerIPport = '8899';
global.printerData.base.socket = '';
global.printerData.base.printerCamLink = 'http://192.168.0.1:8080/?action=stream';
global.printerData.base.printerIPadressAlternative = 0;

global.printerData.info = {};
global.printerData.info.Name = 'defaultPrinterName';
global.printerData.info.SN = '00000000';
global.printerData.info.Firmware = '0.0.0';
global.printerData.info.Type = 'defaultMachineType';
global.printerData.info.MaxDimension = {};
global.printerData.info.Tool_Count = '0';

global.printerData.temps = {};
global.printerData.temps.ext_current = 0;
global.printerData.temps.ext_target = 0;
global.printerData.temps.bed_current = 0;
global.printerData.temps.bed_target = 0;

global.printerData.status = {};
global.printerData.status.Status = "defaultState";
global.printerData.status.MachineStatus = "defaultState";
global.printerData.status.MoveMode = "defaultMode";
global.printerData.status.Endstop = "X-max:0 Y-max:0 Z-max:0";

global.printerData.headPos = {};
global.printerData.headPos.X = 0;
global.printerData.headPos.Y = 0;
global.printerData.headPos.Z = 0;
global.printerData.headPos.A = 0;
global.printerData.headPos.B = 0;

global.printerData.job = {};
global.printerData.job.progress = "50";

var localStorage = window.localStorage;

// eventlistender for global var changes
let cacheGlobal = {};
const observable = (target, callback, _base = []) => {
    for (const key in target) {
        if (typeof target[key] === 'object')
            target[key] = observable(target[key], callback, [..._base, key])
    }
    return new Proxy(target, {
        set(target, key, value) {
            if (typeof value === 'object') value = observable(value, callback, [..._base, key])
            callback([..._base, key], target[key] = value)
            return value
        }
    })
}
let globalProxy = observable(global, (key, val) => {
    // console.log("got change in global - key:  " + key + " - val: " + val);
    observeGlobal();
})

// restore on startup - load all data from local storage to global var
restoreAllUserDataFromStorage();
// for all input elements create eventlistener to save inout to global vars
initInputEvents();


// *****

function restoreAllUserDataFromStorage() {

    let localStorageData = allStorage();
    for (const key in localStorageData) {
        if (localStorageData.hasOwnProperty(key)) {
            //   console.log(`${key}: ${localStorageData[key]}`);

            if (key.startsWith("global")) {
                // console.log("test key: " + key + " value: " + localStorageData[key]);
                let varObjAttr = (key).split('.');
                try {
                    global[varObjAttr[1]][varObjAttr[2]][varObjAttr[3]] = localStorageData[key];
                } catch (error) {
                    console.log("global.js - restore on startup - error: " + error.message);
                }
                // console.log("load to global from local storage - key: " + key + "=> value: " + localStorageData[key]);
            }
        }
    }
    console.log("global.js - loaded all content to global from local storage");

    function allStorage() {

        var archive = {}, // Notice change here
            keys = Object.keys(localStorage),
            i = keys.length;

        while (i--) {
            archive[keys[i]] = localStorage.getItem(keys[i]);
        }

        return archive;
    }
}

// --> refresh changed global vars to local storage and update view element
function observeGlobal() {
    const entries = Object.entries(global);
    // begin checking keys in cache
    entries.forEach(entry => {
        const [key, value] = entry;
        // if (observeGlobal.cache[key] !== value) {
        if (JSON.stringify(cacheGlobal[key]) != JSON.stringify(value)) {
            updateValuesFromGlobal();
            // update cache
            cacheGlobal[key] = JSON.parse(JSON.stringify(value));
            // update local storage if there are changes
            const entriesToStorage = flattenObject(cacheGlobal);
            for (var keyInentriesToStorage in entriesToStorage) {
                setValue("global." + keyInentriesToStorage, entriesToStorage[keyInentriesToStorage]);
            }
        }
    });
}

function updateValuesFromGlobal() {
    // get all relevant nodes from page
    const allElements = document.querySelectorAll('[id^="global."]');
    allElements.forEach(element => {
        const varObjAttr = (element.id).split('.');
        let valueFromGlobal = '';
        if(varObjAttr.length == 3) {
            valueFromGlobal = global[varObjAttr[1]][varObjAttr[2]];
        } else {
            valueFromGlobal = global[varObjAttr[1]][varObjAttr[2]][varObjAttr[3]];
        }
        let elemValueType = 'innerText';
        // for input type elements
        if (element.nodeName == "INPUT") {
            if (element.type == "checkbox") {
                if (valueFromGlobal == 1) {
                    element.checked = true;
                } else {
                    element.checked = false;
                }
                // update cam adress depending on standard or own webcam adress
                if (element.id == "global.printerData.base.printerIPadressAlternative") {
                    if (valueFromGlobal == 1) {
                        document.getElementById("global.printerData.base.printerCamLink").value = global.printerData.base.printerCamLink;
                        document.getElementById("printerCamLinkUsed").innerHTML = global.printerData.base.printerCamLink;
                        document.getElementById("printerIPadressAlternativeEntry").style.display = "";
                        document.getElementById("printerIPadressStandardEntry").style.display = "none";
                    } else {
                        // global.printerData.base.printerCamLink = "http://" + global.printerData.base.printerIPadress + ":8080/?action=stream";
                        document.getElementById("printerCamLinkUsed").innerHTML = "http://" + global.printerData.base.printerIPadress + ":8080/?action=stream";
                        document.getElementById("printerIPadressAlternativeEntry").style.display = "none";
                        document.getElementById("printerIPadressStandardEntry").style.display = "";
                    }
                }
                //switch visbility of screens/ topics
                if ((element.id).startsWith("global.settings.screen")) {
                    let elemIDtoSwitch = varObjAttr[3];
                    if (valueFromGlobal == 1) {
                        document.getElementById(elemIDtoSwitch).style.display = "";
                    } else {
                        document.getElementById(elemIDtoSwitch).style.display = "none";
                    }
                }
            } else {
                elemValueType = 'value';
            }
        } else {
            elemValueType = 'innerText';
        }
        if (element[elemValueType] != valueFromGlobal && element.type != "checkbox") {
            element[elemValueType] = valueFromGlobal;
        }
    });
    // other elements
    // update progress bar
    document.getElementById("printerProgressBar").style.width = global.printerData.job.progress + "%";
    // update video link
    document.getElementById("printerVideoLink").href = global.printerData.base.printerCamLink;
}

// initalize all input elements with eventlistener to save inout to global vars
function initInputEvents() {
    forEachElement(Array.from(document.querySelectorAll('.storageValue')), function (el) {
        const varObjAttr = (el.id).split('.');

        if (el.hasAttribute('type')) {
            if (el.type == "checkbox") {
                el.parentElement.addEventListener("touchend", function (e) {
                    console.log("global.js - event input got touch: " + el.id + " - " + el.checked)
                    if (el.checked) {
                        global[varObjAttr[1]][varObjAttr[2]][varObjAttr[3]] = 1;
                    } else {
                        global[varObjAttr[1]][varObjAttr[2]][varObjAttr[3]] = 0;
                    }
                });
                console.log("global.js - input add event input: " + el.id);
            } else {
                el.addEventListener("input", function (e) {

                    if (el.id.endsWith("IPadress")) {
                        if (ValidateIPaddress(el.value)) {
                            el.setCustomValidity("");
                            console.log("global.js - event input - set to global{}: " + el.id + ": " + el.value);
                            global[varObjAttr[1]][varObjAttr[2]][varObjAttr[3]] = el.value;
                        } else {
                            el.setCustomValidity("Invalid field.");
                            console.log("global.js - input ip not valid: " + el.id);
                        }
                    } else {
                        global[varObjAttr[1]][varObjAttr[2]][varObjAttr[3]] = el.value;
                        console.log("global.js - event input - set to global{}: " + el.id + ": " + el.value);
                    }
                });
                console.log("global.js - input add event input: " + el.id);
            }
        }
    });
}

// helper

setValue = function (id, value) {
    if (getValue(id) != value) {
        // console.log("global.js (setValue) - set local storage id: " + id + " - from: " + localStorage.getItem(id) + " to " + value);
        localStorage.setItem(id, value);
    }
}

getValue = function (id) {
    // console.log("global.js - getValue from storage id: " + id + " - value: " + localStorage.getItem(id))
    return localStorage.getItem(id)
}

function flattenObject(ob) {
    var toReturn = {};

    for (var i in ob) {
        if (!ob.hasOwnProperty(i)) continue;

        if ((typeof ob[i]) == 'object' && ob[i] !== null) {
            var flatObject = flattenObject(ob[i]);
            for (var x in flatObject) {
                if (!flatObject.hasOwnProperty(x)) continue;

                toReturn[i + '.' + x] = flatObject[x];
            }
        } else {
            toReturn[i] = ob[i];
        }
    }
    return toReturn;
}

function ValidateIPaddress(ipaddress) {
    if (/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ipaddress)) {
        return (true)
    }
    // alert("You have entered an invalid IP address!")
    return (false)
}

function forEachElement(els, func) {
    var ii, len = els.length;
    for (ii = 0; ii < len; ii += 1) {
        func(els[ii], ii);
    }
}
this.forEachElement = forEachElement;