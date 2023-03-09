# 3DPrinterStatus

- [3DPrinterStatus](#3dprinterstatus)
  - [description](#description)
    - [pre notice](#pre-notice)
    - [original purpose for the app](#original-purpose-for-the-app)
    - [features](#features)
  - [downloads](#downloads)
    - [get latest release](#get-latest-release)
    - [get latest debug build](#get-latest-debug-build)
  - [development status](#development-status)
  - [screenshots](#screenshots)
  - [features planned/ done](#features-planned-done)
  - [info](#info)
  - [licenses](#licenses)

## description
### pre notice
project is based on [cordova build environment](https://cordova.apache.org/) and so written in NodeJS and cordova specific plugins - currently only builds for android available

contribution to this project is likely welcome


### original purpose for the app

Give an alternative way to reach 3D printer e.g. 'Bresser Rex' or 'Flashforge Adventurer III' directly in an app for getting the current state of print job and watching the live video stream from internal webcam.
Futher there are thougts to use that information to gather some statistics for visualization and use the state changes of printer for further switching of external IFTTT devices.
If you have other cool ideas please raise a [feature request](https://github.com/ohAnd/3DPrinterStatus/issues/new?assignees=&labels=content%2C+good+first+issue%2C+UX&template=feature_request.md&title=%5BFEATURE%5D+%3Cshort+summary+of+the+feature+request%3E)

### features
you can find already given and described content features here

[![GitHub closed issues by-label](https://img.shields.io/github/issues-closed-raw/ohand/3DPrinterStatus/content)](https://github.com/ohAnd/3DPrinterStatus/issues?q=is%3Aissue+label%3Acontent+is%3Aclosed)

and UX marked features here

[![GitHub closed issues by-label](https://img.shields.io/github/issues-closed-raw/ohand/3DPrinterStatus/ux)](https://github.com/ohAnd/3DPrinterStatus/issues?q=is%3Aissue+is%3Aclosed+label%3AUX)


## downloads
### get latest release
you can reach the latest release here 

[![GitHub all releases](https://img.shields.io/github/downloads/ohand/3dprinterstatus/total)](https://github.com/ohAnd/3DPrinterStatus/releases)


### get latest debug build
goto the last (green) workflow run and find the .apk file in the artifact section below

[![develop - Build Android debug app](https://github.com/ohAnd/3DPrinterStatus/actions/workflows/cordovaBuildAndroid.yml/badge.svg)](https://github.com/ohAnd/3DPrinterStatus/actions/workflows/cordovaBuildAndroid.yml)



## development status
you can raise a feture or bug reqest here and also use this information

[![GitHub issues by-label](https://img.shields.io/github/issues-raw/ohand/3dprinterstatus/bugs)](https://github.com/ohAnd/3DPrinterStatus/labels/bug) [![GitHub issues](https://img.shields.io/github/issues/ohand/3dprinterstatus)](https://github.com/ohAnd/3DPrinterStatus/issues) [![GitHub closed issues](https://img.shields.io/github/issues-closed-raw/ohand/3DPrinterStatus)](https://github.com/ohAnd/3DPrinterStatus/issues?q=is%3Aissue+is%3Aclosed)


## screenshots
<img src="doc/Screenshot_home1.jpg" width="300px"><img src="doc/Screenshot_home2.jpg" width="300px"><img src="doc/Screenshot_infos.jpg" width="300px"><img src="doc/Screenshot_settings.jpg" width="300px"><img src="doc/notification_progress.jpg" width="300px"><img src="doc/notification_band.jpg" width="300px">

## features planned/ done
- open content the app recognized the finish state of the current job. This state could trigger a smart plug with MQTT or IFTTT. So it is maybe possible to integrate with a specific call on an url or direct MQTT integration.
- open content prevent connection with default values or inform user about the try to connect with default values
- done UX animation of changed values from printer, to recognize easily the changed value
- open UX button connect should be according to the current session state (currently: state info with butto color and button text without a direct understandable connection)
- done UX IP of printer should be directly take over for the webcam or at least offered
- open content also offer modeling tools e.g. freeCAD oder tinkerCAD
- open content offer temperature graph
- open content idea -> visualize current layer of printing with the XYZ data (why? Don't know! ;-) )
- open UX darkmode: invert colors to get dark environment
- open UX darkmode: switch darkmode with systemsettings
- open UX notification: local push notification, if printer job is done
- open UX notification: local push notification, if printer stopped before done, e.g. filament error (empty)
- open UX notification: progess should be optionally shown as an notification
- open content searching for printer in the local network, present result and give the option to take over to the printer connection
- open content show the video stream of webcam directly inside the app
- done UX notification: local push notification with progress as a permanent info during printing
- open UX notification: should be switchable on/off in settings
- done content stablize session to the printer - re-connect if connection lost, but the user still required an open connection (connect button -> not manually disconnected)
- done content notification: local single push notification every 10% during printing

## info
- current usage (at least until 0.0.1.0172) of connect/ disconnect button colors -> orange = is initialized / green = is connected / red = error occured (check debug log, e.g. BLOCKED means PC has already active connection to printer)/ blue = session releasing or finished
- "Bresser REX" offer itself as a "Flashforge Adventurer III"

## licenses
- logo was taken from here [Image by macrovector](https://www.freepik.com/free-vector/3d-printing-icons-set_4358644.htm#query=3d%20printer&position=1&from_view=keyword&track=ais") on Freepik
- ui template/ javascript based on https://github.com/chrisbroski/aerophane