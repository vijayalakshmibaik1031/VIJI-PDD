const path = require('path');

const androidSdk = process.env.ANDROID_HOME
  || process.env.ANDROID_SDK_ROOT
  || `${process.env.LOCALAPPDATA}\\Android\\Sdk`;

const javaHome = process.env.JAVA_HOME
  || 'C:\\Program Files\\Android\\Android Studio\\jbr';

module.exports = {
  apiUrl: process.env.API_URL || 'http://10.0.2.2:5000',
  appPackage: 'com.vijinew.webadmin',
  appActivity: 'com.vijinew.webadmin.MainActivity',
  apkPath: process.env.ANDROID_APP_PATH
    || path.join(__dirname, '..', 'web-admin', 'android', 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk'),
  androidSdk,
  javaHome,
  adbPath: path.join(androidSdk, 'platform-tools', 'adb.exe'),
  emulatorName: process.env.ANDROID_AVD || 'Pixel_10_Pro_XL',
  deviceName: process.env.ANDROID_DEVICE_NAME || 'Android Emulator',
  appiumPort: Number(process.env.APPIUM_PORT || 4725),
  timeoutMs: Number(process.env.TIMEOUT_MS || 15000),
  credentials: {
    manager: { userId: 'manager', password: 'man123' },
    authority: { userId: 'auth', password: 'auth123' },
  },
};
