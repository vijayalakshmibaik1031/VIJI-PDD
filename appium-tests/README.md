# Appium Android E2E Scaffold

This folder contains an isolated Appium test scaffold for the FacilityDesk project. It is intentionally separate from the existing `selenium-tests` and app source so it does not disturb the current project structure.

## Required files and packages

- `appium-tests/package.json`
- `appium-tests/wdio.conf.js`
- `appium-tests/pageobjects/LoginPage.js`
- `appium-tests/test/specs/login.e2e.js`
- `appium-tests/.gitignore`

## Install

```bash
cd appium-tests
npm install
```

## Prerequisites

- Node.js installed
- Java JDK 11+ installed and `JAVA_HOME` configured
- Android SDK installed and `ANDROID_HOME` or `ANDROID_SDK_ROOT` configured
- `adb` available on PATH
- Appium installed locally via `npm install` (already included in this scaffold)
- A valid Android APK for the app under test

## Run

Set the app path and device as needed, then run:

```bash
cd appium-tests
set ANDROID_APP_PATH=C:\path\to\app.apk
set ANDROID_DEVICE_NAME=Pixel_5_API_33
npm test
```

## Notes

- This scaffold does not modify existing project files outside `appium-tests`.
- The selectors in `pageobjects/LoginPage.js` are placeholders and should be updated to match the actual Android app UI.
- If you want to use a real Android emulator or physical device, make sure Android tools are configured and the device is visible via `adb devices`.
