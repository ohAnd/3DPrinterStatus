// based on https://github.com/andycb/AdventurerClientJS/blob/master/stubPrinter/stubPrinter.js
var net = require('net');

console.log("try to start server");
let progress = 0;

var server = net.createServer((socket) => {    
    var isReceivingFile = false;

    socket.on('data', (data) => {

        console.log("\n<<< data in: " + data);

        var dataStr = data.toString();
        var lines = dataStr.split('\n');

        for (var i = 0; i < lines.length; ++i){
        var line = lines[i]; 

        var parts = line.split(' ');
    
        var command = "";
        if (parts.length > 0){
            var commandPart = parts[0];
            if (commandPart.startsWith("~")){
                command = commandPart.substring(1, commandPart.length);
                command = command.replace(/(\r\n|\n|\r)/gm, "");
            } 
        }

        var respond = function(text){
            console.log("sendResponse >>>" + text);
            socket.write(text);
        }

        if (command != "") {
            console.log("<<< ...." + command);
            if (isReceivingFile && command == "M29"){
                isReceivingFile = false;
            }
            else if (isReceivingFile) {
                console.log("Ignored");
                return;
            }

            let response = "CMD " + command + " Received.\r\n";
            // respond("CMD " + command + " Received.");
            
            switch(command){
                case "M601":    // CMD M601 Received.\r\nControl Success.\r\nok\r\n
                    // respond("CMD M601 Received.");
                    response += "Control Success.\r\n";
                    response += "ok\r\n";
                    break;
                case "M602":    // CMD M602 Received.\r\nControl Release.\r\nok\r\n
                    response += "Control Release.\r\n";
                    response += "ok\r\n";
                    break;
                case "M119":    // CMD M119 Received.\r\nEndstop: X-max:1 Y-max:0 Z-max:0\r\nMachineStatus: READY\r\nMoveMode: READY\r\nStatus: S:1 L:0 J:0 F:0\r\nok\r\n
                    response += "Endstop: X-max:1 Y-max:0 Z-max:0\r\n";
                    response += "MachineStatus: BUILDING_FROM_SD\r\n";
                    response += "MoveMode: READY\r\n";
                    response += "Status: S:0 L:0 J:0 F:0\r\n";
                    response += "ok\r\n";
                    break;
    
                case "M115":    // CMD M115 Received.\r\nMachine Type: FlashForge Adventurer III\r\nMachine Name: ******\r\nFirmware: v2.2.1\r\nSN: SN**********\r\nX: 150 Y: 150 Z: 150\r\nTool Count: 1\r\nMac Address: **:**:**:**:**:**\n\r\nok\r\n
                    response += "Machine Type: Flasforge Virtual\r\n";
                    response += "Machine Name: TestPrinterServer\r\n";
                    response += "Firmware: v1.0.0\r\n";
                    response += "SN: XXXX999999\r\n";
                    response += "X: 150 Y: 150 Z: 150\r\n";
                    response += "Tool Count: 1\r\n";
                    response += "ok\r\n";
                    break;

                case "M105":    // CMD M105 Received.\r\nT0:27 /0 B:20/0\r\nok\r\n
                    var t1 = Math.floor(Math.random() * Math.floor(200));
                    var t2 = Math.floor(Math.random() * Math.floor(100));
                    response += "T0:" + t1 + " /" + (t1 + 15) + " B:" + t2 + "/" + (t2 + 10) + " \r\n";
                    response += "ok\r\n";
                    break;

                case "M114":        // CMD M114 Received.\r\nX:79.9981 Y:50.0002 Z:77.9001 A:0 B:0\r\nok\r\n
                    var x = Math.floor(Math.random() * Math.floor(200));
                    var y = Math.floor(Math.random() * Math.floor(200))+10;
                    var z = Math.floor(Math.random() * Math.floor(200))+25;
                    response += "X:" + x + " Y:" + y + " Z:" + z + " A:0 B:0\r\n";
                    response += "ok\r\n";
                    break;

                case "M27":        // CMD M27 Received.\r\nSD printing byte 0/100\r\nok\r\n
                    progress = progress + 0.2;
                    if(progress > 100) progress = 0;
                    response += "SD printing byte " + parseInt(progress) + "/100\r\n";
                    response += "ok\r\n";
                    break;

                case "":
                    break;

                case "M29":
                    startTime = new Date().getTime();
                    while (new Date().getTime() < startTime + 6000);
                    response += "ok\r\n";
                    
                    break;

                case "M28":
                    response += "ok\r\n";
                    
                    break;

                default:
                    response += "ok\r\n";
                    break;
                }
                respond(response);
            }
        }
    });

});

server.on('error', (err) => {
    throw err;
});

server.listen(8899, () => {
    console.log('server bound');
});
