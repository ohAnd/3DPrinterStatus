// https://github.com/acgy/flashforge-finder-php-api/blob/main/src/Printer.php
// var net = require('net');

const request_control_message = '~M601 S1\r\n'    // CMD M601 Received.\r\nControl Success.\r\nok\r\n
const request_control_release = '~M602 S1\r\n'    // CMD M602 Received.\r\nControl Release.\r\nok\r\n

const request_stepMotor_On = '~M17\r\n'        // CMD M17 Received.\r\nok\r\n
const request_stepMotor_Off = '~M18\r\n'        // CMD M18 Received.\r\nok\r\n

const request_stop_print = '~M26\r\n'        // 
const request_progress = '~M27\r\n'        // CMD M27 Received.\r\nSD printing byte 0/100\r\nok\r\n

const request_set_temp_extr = '~M104 S40 T0\r\n' // '~M104 S40 T0 [40 °C extruder / ] -> CMD M104 Received.\r\nok\r\n
const request_temp = '~M105\r\n'       // CMD M105 Received.\r\nT0:27 /0 B:20/0\r\nok\r\n

const request_stop_stepprt = '~M112\r\n'       // CMD M112 Received.\r\nok\r\n

const request_head_position = '~M114\r\n'       // CMD M114 Received.\r\nX:79.9981 Y:50.0002 Z:77.9001 A:0 B:0\r\nok\r\n
const request_info_message = '~M115\r\n'       // CMD M115 Received.\r\nMachine Type: FlashForge Adventurer III\r\nMachine Name: ******\r\nFirmware: v2.2.1\r\nSN: SN**********\r\nX: 150 Y: 150 Z: 150\r\nTool Count: 1\r\nMac Address: **:**:**:**:**:**\n\r\nok\r\n
const request_status = '~M119\r\n'       // CMD M119 Received.\r\nEndstop: X-max:1 Y-max:0 Z-max:0\r\nMachineStatus: READY\r\nMoveMode: READY\r\nStatus: S:1 L:0 J:0 F:0\r\nok\r\n

const request_set_temp_bed = '~M140 S28\r\n'    // ~M140 S28\r\n [28°C bed temp] -> CMD M140 Received.\r\nok\r\n

const request_LedOn = '~M146 r255 g255 b255 F0\r\n' // ~M146 r255 g255 b255 F0\r\n => CMD M146 Received.\r\nok\r\n
const request_LedOff = '~M146 r0 g0 b0\r\n' // CMD M146 Received.\r\nok\r\n

const request_cal = '~M650\r\n'       // 'cal' => '~M650\r\n', // CMD M650 Received.\r\nX: 1.0 Y: 0.5\r\nok\r\n

const request_G91 = '~G91\r\n'        // CMD G91 Received.\r\nok\r\n



var BUFFER_SIZE = 1024


const session = {};
session.state = 'booted';
session.checkTimer = null;
session.lastError = 'none';

// global socket
let printerSocket = '';


// subscribe event for change of session state
// TODO


// protocol handling

function reactOnCmdsFromPrinter(responseCommand, responseString) {
    switch (responseCommand) {
        case "CMD M115": //request_info_message
            addEntryToLog("protocol.js - reactOnCmdsFromPrinter - got: request_info_message: " + responseString, consoleDebug);
            global.printerData.info = decodeInfo(responseString);
            break;
        case "CMD M119": //request_status
            addEntryToLog("protocol.js - reactOnCmdsFromPrinter - got: request_status_message: " + responseString, consoleDebug);
            global.printerData.status = decodeStatus(responseString);
            if (global.appPaused) {
                addEntryToLog("protocol.js - reactOnCmdsFromPrinter BackGround - got: request_status_message: " + responseString, consoleDebug);
                session.state = "backgroundUpdateGetProgress";
                printerGetProgress(backgroundSocket);
            }
            break;
        case "CMD M105": //request_temp
            addEntryToLog("protocol.js - reactOnCmdsFromPrinter - got: request_temp_message: " + responseString, consoleDebug);
            global.printerData.temps = decodeTemp(responseString);
            break;
        case "CMD M27 ": //request_progress
            addEntryToLog("protocol.js - reactOnCmdsFromPrinter - got: request_progress: " + responseString, consoleDebug);
            global.printerData.job = decodeProgress(responseString);
            if (global.appPaused) {
                addEntryToLog("protocol.js - reactOnCmdsFromPrinter - got: request_progress: " + responseString, consoleDebug);
                session.state = "backgroundUpdateControlEnd";
                printerControlEnd(backgroundSocket);
            }
            break;
        case "CMD M114": // request_head_position
            addEntryToLog("protocol.js - reactOnCmdsFromPrinter - got: request_head_position: " + responseString, consoleDebug);
            global.printerData.headPos = decodeHeadPositions(responseString);
            break;
        default:
            addEntryToLog("protocol.js - reactOnCmdsFromPrinter - got: notRecognized: " + responseString, consoleDebug, 'warn');
            break;
    }
    return true;
}

function sessionStart() {
    session.state = "initiated";
    let socket = startConnection();
    sessionCheck(socket);
    return socket;
}

let lastState = '';
let sessionCheckCounter = 0;
function sessionCheck(printerSocket) {
    if (session.checkTimer == null) {
        session.checkTimer = setInterval(function () {
            let socketState = getSocketState(printerSocket);
            // checkAndSwitchInBackgroundMode(printerSocket);
            // 1st layer
            if (socketState == "OPENED") {
                // 2nd layer
                if (session.state == 'established') {
                    if ((sessionCheckCounter % 2) == 0) {
                        printerGetTemp(printerSocket);
                        printerHeadPositions(printerSocket);
                    }
                    if ((sessionCheckCounter % 3) == 0) {
                        printerGetProgress(printerSocket);
                        addEntryToLog("sessionCheck printerGetProgress - cnt: " + sessionCheckCounter, true, true, 'warn');
                    }
                    if ((sessionCheckCounter % 11) == 0) {
                        printerGetStatus(printerSocket);
                        addEntryToLog("sessionCheck printerGetStatus - cnt: " + sessionCheckCounter, true, true, 'warn');
                    }
                    if ((sessionCheckCounter % 15) == 0) {
                        printerGetInfo(printerSocket);
                        addEntryToLog("sessionCheck printerGetInfo - cnt: " + sessionCheckCounter, true, true, 'warn');
                    }
                } else if (session.state == 'blocked') {
                    addEntryToLog("sessionCheck at state " + session.state + " - cnt: " + sessionCheckCounter + " - stopSessionTimer", true, true);
                    stopSessionTimer(session.checkTimer);
                    // start retry
                } else if (session.state == 'socketError') {
                    // start retry
                } else if (session.state == 'closed') {
                    addEntryToLog("sessionCheck at state " + session.state + " - cnt: " + sessionCheckCounter + " - stopSessionTimer", true, true);
                    stopSessionTimer(session.checkTimer);
                } else if (session.state == 'released' || session.state == 'releasing') {
                    addEntryToLog("sessionCheck at state " + session.state + " - cnt: " + sessionCheckCounter + " - stopSessionTimer", true, true);
                    stopSessionTimer(session.checkTimer);
                } else { // 
                    addEntryToLog("sessionCheck at state " + session.state + " - cnt: " + sessionCheckCounter + " - stopSessionTimer", true, true);
                    stopSessionTimer(session.checkTimer);
                }
            } else if (socketState == "CLOSED") {
                // start retry
                session.state = "finished";
                stopSessionTimer(session.checkTimer);
            }
            lastState = session.state;
            sessionCheckCounter++;
            document.getElementById("refreshTimer").innerText = sessionCheckCounter;
            if (sessionCheckCounter >= 60) { sessionCheckCounter = 0; }
        }, 1000);
    }
}

function sessionStop(printerSocket, targetState = 'releasing') {
    session.state = targetState;
    addEntryToLog("protocol.js (sessionStop) - state: " + session.state, consoleDebug);
    printerControlEnd(printerSocket);
}

function stopSessionTimer(timerVar) {
    clearInterval(timerVar);
    session.checkTimer = null;
}

// *** limitited network update in background needed
// pause the regular data update
function checkAndSwitchInBackgroundMode(printerSocket) {
    if (baseConnection.active) {
        if (global.appPaused && (getSocketState(printerSocket)) == "OPENED") {
            sessionStop(printerSocket, "backgroundUpdateIdle");
        } else if ((getSocketState(printerSocket)) != "OPENED") {
            printerSocket = sessionStart();
        }
    }
}


// *****************

function startConnection() {

    const printer_ip_address_user = getValue("global.printerData.base.printerIPadress") || global.printerData.base.printerIPadress;
    const printer_port_user = getValue("global.printerData.base.printerIPport") || global.printerData.base.printerIPport;

    try { // for debugging in browser
        var socket = new Socket();

        // event listener
        socket.onData = function (data) {
            let responseString = "";
            try {
                responseString = hexStringToString(data.toString());
            } catch (error) {
                addEntryToLog("protocol.js - onData (str) - error: " + error.message, consoleDebug);
            }

            let responseCommand = responseString.substring(0, 8);
            responseString = responseString.replace(/(\r\n|\r|\n)/g, ";");

            switch (responseCommand) {
                case "CMD M601": // got control for printer
                    // CMD M601 Received.;Control Success.;ok;
                    if (responseString.split(";")[1] == "Control Success.") {
                        session.state = "established";
                        addEntryToLog("protocol.js - onData - got: GotControl: " + responseString, consoleDebug);
                        // if backgorund mode
                        if (global.appPaused) {
                            session.state = "backgroundUpdateGetState";
                            printerGetStatus(printerSocket);
                            addEntryToLog("protocol.js - onData BackGround- got: GotControl: " + responseString, consoleDebug);
                        }
                    } else if (responseString.split(";")[1] == "Control failed.") { // CMD M601 Received.;Control failed.;ok;
                        session.state = "blocked";
                        session.lastError = "blocked";
                        shutdownConnection(socket);
                        addEntryToLog("protocol.js - onData - got: NO Control: " + responseString, consoleDebug, "warn");
                    }
                    break;
                case "CMD M602": // got approved release control for printer
                    session.state = "released";
                    addEntryToLog("protocol.js - onData - got: ControlRelease: " + responseString, consoleDebug);
                    shutdownConnection(socket);
                    if (global.appPaused) {
                        session.state = "backgroundUpdateIdle";
                        addEntryToLog("protocol.js - onData BackGround- got: GotControl: " + responseString, consoleDebug);
                    }
                    break;
                default: // all other should be responses
                    reactOnCmdsFromPrinter(responseCommand, responseString);
                    // addEntryToLog("protocol.js - onData - got: notRecognized: " + responseString, consoleDebug);
                    break;
            }
        };
        socket.onError = function (errorMessage) {
            // invoked after error occurs during connection
            session.state = "socketError";
            session.lastError = "socketError";
            console.log("protocol.js - onError: " + errorMessage);
            addEntryToLog("protocol.js - onError: " + errorMessage);
        };
        socket.onClose = function (hasError) {
            // invoked after connection close
            session.state = "closed";
            addEntryToLog("protocol.js - onClose - hasError: " + hasError, consoleDebug);
        };

        addEntryToLog("protocol.js (startConnection) - opening socket to IP: " + printer_ip_address_user + " port: " + printer_port_user, consoleDebug);

        socket.open(
            printer_ip_address_user,
            printer_port_user,
            function () {
                // onSuccess - invoked after successful opening of socket
                session.state = "socketOpened";
                addEntryToLog("protocol.js (startConnection - socket.open) - onSuccess - session: " + session.state, consoleDebug);
                // according to printer protocol -> at first requesting control
                sendMessage(socket, request_control_message);
            },
            function (errorMessage) {
                // onError - invoked after unsuccessful opening of socket
                session.state = "socketOpenError";
                if(errorMessage.startsWith("Host unreachable")) {
                    session.lastError = "hostUnreachable";
                } else if(errorMessage.endsWith("(Connection timed out)")) {
                    session.lastError = "connTimeout";
                } else {
                    session.lastError = "socketOpenError";
                }
                
                addEntryToLog("protocol.js (startConnection socket.open) - open -> onError: " + errorMessage + " - session: " + session.state, consoleDebug);
            });

    } catch (error) {
        addEntryToLog("protocol.js (startConnection) - catched error: 'Uncaught ReferenceError: Socket is not defined' - in browser mode", consoleDebug);
    }

    return socket;
}

function sendMessage(socket, message) {
    // addEntryToLog("protocol.js - sendMessage: " + message, consoleDebug);
    var dataString = message;
    var data = new Uint8Array(dataString.length);
    for (var i = 0; i < data.length; i++) {
        data[i] = dataString.charCodeAt(i);
    }
    if (global.isDeviceReady) {
        socket.write(data);
    }
}
function shutdownConnection(socket) {
    socket.shutdownWrite(
        function () {
            // onSuccess - invoked after successful shutdown/ close of socket
            addEntryToLog("protocol.js (shutdownConnection) - shutdownWrite -> onSuccess", consoleDebug);
        },
        function (errorMessage) {
            // onError - invoked after unsuccessful shutdown/ close of socket
            addEntryToLog("protocol.js (shutdownConnection) - shutdownWrite -> onError: " + errorMessage, consoleDebug);
        }
    );
}
function forceClose(socket) {
    socket.close(
        function () {
            // onSuccess - invoked after successful close of socket
            addEntryToLog("protocol.js (forceClose) - close -> onSuccess", consoleDebug);
        },
        function (errorMessage) {
            // onError - invoked after unsuccessful closing of socket
            addEntryToLog("protocol.js (forceClose) - close -> onError: " + errorMessage, consoleDebug);
        }
    );
}
function getSocketState(socket) {
    let state = 'socket not recognized'
    try {
        if (socket.state == Socket.State.OPENED) {
            state = "OPENED";
            // addEntryToLog("protocol.js (getSocketState) - Socket is OPENED", consoleDebug);
        }
        if (socket.state == Socket.State.OPENING) {
            state = "OPENING";
            addEntryToLog("protocol.js (getSocketState) - Socket is OPENING", consoleDebug);
        }
        if (socket.state == Socket.State.CLOSED) {
            state = "CLOSED";
            addEntryToLog("protocol.js (getSocketState) - Socket is CLOSED", consoleDebug);
        }
        if (socket.state == Socket.State.CLOSING) {
            state = "CLOSING";
            addEntryToLog("protocol.js (getSocketState) - Socket is CLOSING", consoleDebug);
        }
    } catch (error) {
        state = "socket error: " + error.message;
    }

    return state;
}
function hexStringToString(hexString) {
    let hexArray = hexString.split(",");
    let returnStr = "";
    hexArray.forEach(element => {
        returnStr += String.fromCharCode(element);
    });
    return returnStr;
}

// printer requests
function printerControlEnd(socket) {
    sendMessage(socket, request_control_release);
}
function printerGetInfo(socket) {
    sendMessage(socket, request_info_message);
}
function printerGetStatus(socket) {
    sendMessage(socket, request_status);
}
function printerGetTemp(socket) {
    sendMessage(socket, request_temp);
}
function printerGetProgress(socket) {
    sendMessage(socket, request_progress);
}
function printerHeadPositions(socket) {
    sendMessage(socket, request_head_position);
}

// response decoder
// CMD M115 Received.\r\nMachine Type: FlashForge Adventurer III\r\nMachine Name: ******\r\nFirmware: v2.2.1\r\nSN: SN**********\r\nX: 150 Y: 150 Z: 150\r\nTool Count: 1\r\nMac Address: **:**:**:**:**:**\n\r\nok\r\n
function decodeInfo(inputString) {
    const info_fields = ['Type', 'Name', 'Firmware', 'SN', 'MaxDimension', 'Tool Count'];
    inputString = inputString.split(";");
    let statusObj = {};
    info_fields.forEach(element => {
        inputString.forEach(entry => {
            if (entry.match(element)) {
                element = element.replace(" ", "_");
                statusObj[element] = entry.split(": ")[1];
            }
            if (element == 'MaxDimension' && entry.match("X:")) {
                let posStrArr = entry.split(" ");
                statusObj[element] = {};
                statusObj[element].X = posStrArr[1];
                statusObj[element].Y = posStrArr[3];
                statusObj[element].Z = posStrArr[5];
            }
        });
    });
    return statusObj;
}
//CMD M119 Received.\r\nEndstop: X-max:1 Y-max:0 Z-max:0\r\nMachineStatus: READY\r\nMoveMode: READY\r\nStatus: S:1 L:0 J:0 F:0\r\nok\r\n
function decodeStatus(inputString) {
    const info_fields = ['Endstop', 'MachineStatus', 'MoveMode', 'Status'];
    inputString = inputString.split(";");
    let statusObj = {};
    info_fields.forEach(element => {
        inputString.forEach(entry => {
            if (entry.match(element)) {
                element = element.replace(" ", "_");
                statusObj[element] = entry.split(": ")[1];
            }
        });
    });
    return statusObj;
}
// CMD M105 Received.;T0:27 /0 B:20/0;ok;
function decodeTemp(inputString) {
    const info_fields = ['ext_current', 'ext_target', 'bed_current', 'bed_target'];
    inputString = inputString.split(";");
    let statusObj = {};
    info_fields.forEach(element => {
        inputString.forEach(entry => {
            if (entry.match("T0:")) {
                let newValue = entry.split("T0:")[1];
                if (element == 'ext_current') {
                    newValue = newValue.split(" ")[0];
                } else if (element == 'ext_target') {
                    newValue = (newValue.split("/")[1]).split(" ")[0];
                } else if (element == 'bed_current') {
                    newValue = (newValue.split("B:")[1]).split("/")[0];
                } else if (element == 'bed_target') {
                    newValue = (newValue.split("B:")[1]).split("/")[1];
                }

                statusObj[element] = newValue;
            }
        });
    });
    return statusObj;
}
// CMD M27 Received.\r\nSD printing byte 0/100\r\nok\r\n
function decodeProgress(inputString) {
    let statusObj = {};
    inputString = inputString.split(";")[1];
    let entry = (inputString.split("/")[0]).split(" ")[3];
    statusObj['progress'] = entry;

    return statusObj;
}
// CMD M114 Received.;X:79.9981 Y:50.0002 Z:77.9001 A:0 B:0;ok;
function decodeHeadPositions(inputString) {
    let statusObj = {};
    inputString = inputString.split(";")[1];
    inputString = inputString.split(" ");
    statusObj.X = (inputString[0]).split(":")[1]; //X:79.9981
    statusObj.Y = (inputString[1]).split(":")[1]; //Y:50.0002
    statusObj.Z = (inputString[2]).split(":")[1]; //Z:77.9001
    statusObj.A = (inputString[3]).split(":")[1]; //Z:77.9001
    statusObj.B = (inputString[4]).split(":")[1]; //Z:77.9001
    return statusObj;
}