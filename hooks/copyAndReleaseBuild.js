#!/usr/bin/env node
const { EOF } = require('dns');
var fs = require('fs');
var path = require('path');

const localSecretFilePath = "localBuild.secret";

const configXMLPath = "config.xml";
const pathToBuildNumberFile = "hooks/buildnumber.txt";


let secretSrc = {};
// run from local or github action?
// if secret exist then local - otherwise create template for local for next run or in github action for nothing ;-)
if (fs.existsSync(__dirname+'/'+localSecretFilePath)) {
    secretSrc = require("./" + localSecretFilePath);
} else {
    console.log("cordova hook with " + path.basename(__filename) + " - local secret file not found - writing template to: " + localSecretFilePath + " - can be ignored in Github action");
    const templateSecret = `module.exports = {
        'srcFile' : '/path/to/apk',     // path to the built e.g. apk file - for windows adapt the slashes to \\
        'tgtPath' : '/path/to/publish', // path to the publishing location
        'appName' : 'testAppName',      // name of application for the final file name
        'appExtension' : '.apk'         // extension of release file
        };
    `;
    writeStringToFile(templateSecret, __dirname+'/'+localSecretFilePath);
    process.exit(0);
}

var srcFile = secretSrc.srcFile;
var tgtPath = secretSrc.tgtPath;
var appName = secretSrc.appName;
var appExtension = secretSrc.appExtension;

const buildSrc = ".localDev";

// get version
var rawJSON = loadConfigXMLDoc(configXMLPath);
var version = rawJSON.widget.$.version;
console.log(getDateTimeString() + " - " + "Version:", version);

// get buildnumber, increment and save
let buildnumber_current = parseInt(get_string_from_file(pathToBuildNumberFile));
let buildnumber_new = buildnumber_current + 1;
writeStringToFile(buildnumber_new.toString() + buildSrc, pathToBuildNumberFile);
let buildnumber_current_str = ("0000" + buildnumber_current).slice(-4);
console.log(getDateTimeString() + " - " + "buildnumber: " + buildnumber_current_str + " (saved for next run: " + buildnumber_new + ")");

deleteFiles(tgtPath)
let filename = appName + "_" + version + "." + buildnumber_current_str + buildSrc + appExtension;
console.log(getDateTimeString() + " - " + "filename: " + filename);
// write history to json
copyFile(srcFile, tgtPath + filename);

function writeStringToFile(str, filename) {
    fs.writeFileSync(filename, str, 'utf8');
}
function loadConfigXMLDoc(filePath) {
    var fs = require('fs');
    var xml2js = require('xml2js');
    var json = "";
    try {
        var fileData = fs.readFileSync(filePath, 'ascii');
        var parser = new xml2js.Parser();
        parser.parseString(fileData.substring(0, fileData.length), function (err, result) {
            //console.log(getDateTimeString() + " - " + "config.xml as JSON", JSON.stringify(result, null, 2));
            json = result;
        });
        // console.log(getDateTimeString() + " - " + "File '" + filePath + "' was successfully read.");
        return json;
    } catch (ex) {

        console.log(getDateTimeString() + " - " + ex)
    }
}
function copyFile(src, tgt) {
    // File destination.txt will be created or overwritten by default.
    fs.copyFile(src, tgt, (err) => {
        if (err) throw err;
        console.log(getDateTimeString() + " - " + "releasing from " + src + ' to ' + tgt);
    });
}
function deleteFiles(directory) {
    const fs = require("fs");
    const path = require("path");

    // console.log(getDateTimeString() + " - " + "dir: " + directory)

    fs.readdir(directory, (err, files) => {
        if (err) throw err;

        for (const file of files) {
            fs.unlink(path.join(directory, file), (err) => {
                if (err) throw err;
            });
        }
    });
}
function getDateTimeString() {
    let date_ob = new Date();
    // current date
    // adjust 0 before single digit date
    let date = ("0" + date_ob.getDate()).slice(-2);
    // current month
    let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
    // current year
    let year = date_ob.getFullYear();
    // current hours
    // let hours = date_ob.getHours();
    let hours = ("0" + date_ob.getHours()).slice(-2);
    // current minutes
    // let minutes = date_ob.getMinutes();
    let minutes = ("0" + date_ob.getMinutes()).slice(-2);
    // current seconds
    // let seconds = date_ob.getSeconds();
    let seconds = ("0" + date_ob.getSeconds()).slice(-2);
    // prints date in YYYY-MM-DD format
    // console.log(getDateTimeString() + " - " + year + "-" + month + "-" + date);
    // prints date & time in YYYY-MM-DD HH:MM:SS format
    var datestimetring = year + "-" + month + "-" + date + " " + hours + ":" + minutes + ":" + seconds;
    // prints time in HH:MM format
    // console.log(getDateTimeString() + " - " + hours + ":" + minutes);

    return datestimetring;
}
function get_string_from_file(filename) {
    var data = fs.readFileSync(filename, 'utf8');
    return data;
}