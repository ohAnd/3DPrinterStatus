#!/usr/bin/env node

// This plugin replaces text in a file with the app version from config.xml.

// var wwwFileToReplace = "settings/settings.html";
var wwwFileToReplace = "js/global.js";

var fs = require('fs');
var path = require('path');




var configXMLPath = "config.xml";
var rawJSON = loadConfigXMLDoc(configXMLPath);
var version = rawJSON.widget.$.version;
console.log("Version:", version);
writeStringToFile(version,"hooks/versionnumber.txt");

var buildnumber = parseInt(get_string_from_file("hooks/buildnumber.txt"));
var devState = '';
if((get_string_from_file("hooks/buildnumber.txt")).endsWith("dev")) {
    devState = 'dev';
}
buildnumber = ("0000" + buildnumber).slice(-4) + devState;
console.log("build number:", buildnumber);

let androidversion = version.split(".")[0] + "." + version.split(".")[1] + "." + version.split(".")[2] + "." + buildnumber;

var builddate = getDateTimeString();
console.log("Build Date:", builddate);

replaceForFile(wwwFileToReplace);

function loadConfigXMLDoc(filePath) {
    var fs = require('fs');
    var xml2js = require('xml2js');
    var json = "";
    try {
        var fileData = fs.readFileSync(filePath, 'ascii');
        var parser = new xml2js.Parser();
        parser.parseString(fileData.substring(0, fileData.length), function (err, result) {
            //console.log("config.xml as JSON", JSON.stringify(result, null, 2));
            json = result;
        });
        console.log("File '" + filePath + "' was successfully read.");
        return json;
    } catch (ex) {

        console.log(ex)
    }
}

function replace_string_in_file(filename, to_replace, replace_with) {
    var data = fs.readFileSync(filename, 'utf8');
    var result = data.replace(new RegExp(to_replace, "g"), replace_with);
    fs.writeFileSync(filename, result, 'utf8');
}

function get_string_from_file(filename) {
    var data = fs.readFileSync(filename, 'utf8');
    return data;
}

function writeStringToFile(str, filename) {
    fs.writeFileSync(filename, str, 'utf8');
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
    // console.log(year + "-" + month + "-" + date);
    // prints date & time in YYYY-MM-DD HH:MM:SS format
    var datestimetring = year + "-" + month + "-" + date + " " + hours + ":" + minutes + ":" + seconds;
    // prints time in HH:MM format
    // console.log(hours + ":" + minutes);

    return datestimetring;
}

function replaceForFile(wwwFileToReplace) {
    wwwPath = "platforms/android/app/src/main/assets/www/"
    var fullfilename = wwwPath + wwwFileToReplace;
    if (fs.existsSync(fullfilename)) {
        replace_string_in_file(fullfilename, "%%VERSION%%", version);
        replace_string_in_file(fullfilename, "%%BUILDNUMBER%%", androidversion);
        replace_string_in_file(fullfilename, "%%BUILDDATE%%", builddate);
        console.log("Replaced version in file: " + fullfilename);
    }

    wwwPath = "platforms/browser/www/"
    var fullfilename = wwwPath + wwwFileToReplace;
    if (fs.existsSync(fullfilename)) {
        replace_string_in_file(fullfilename, "%%VERSION%%", version);
        replace_string_in_file(fullfilename, "%%BUILDNUMBER%%", androidversion);
        replace_string_in_file(fullfilename, "%%BUILDDATE%%", builddate);
        console.log("Replaced version in file: " + fullfilename);
    }

}
