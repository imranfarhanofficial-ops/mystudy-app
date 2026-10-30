import JSZip from 'jszip';
import { triggerDownload } from './backup';

export async function downloadAndroidProjectZip(): Promise<void> {
  const zip = new JSZip();

  // Root configuration files
  zip.file(
    'package.json',
    JSON.stringify(
      {
        name: 'mystudy-offline-android',
        version: '1.0.0',
        private: true,
        type: 'module',
        scripts: {
          dev: 'vite',
          build: 'vite build',
          'cap:sync': 'cap sync android',
          'build:apk': 'npm run build && npx cap sync android && cd android && ./gradlew assembleDebug',
        },
        dependencies: {
          '@capacitor/android': '^7.0.1',
          '@capacitor/cli': '^7.0.1',
          '@capacitor/core': '^7.0.1',
          jszip: '^3.10.2',
          'lucide-react': '^0.546.0',
          react: '^19.0.1',
          'react-dom': '^19.0.1',
        },
        devDependencies: {
          '@tailwindcss/vite': '^4.3.3',
          '@types/jszip': '^3.4.0',
          '@types/react': '^19.3.0',
          '@types/react-dom': '^19.3.0',
          '@vitejs/plugin-react': '^6.1.1',
          tailwindcss: '^4.3.3',
          typescript: '^7.0.2',
          vite: '^8.3.0',
          'vite-plugin-pwa': '^2.0.0',
        },
      },
      null,
      2
    )
  );

  zip.file(
    'capacitor.config.json',
    JSON.stringify(
      {
        appId: 'com.mystudy.app',
        appName: 'MyStudy',
        webDir: 'dist',
        server: {
          androidScheme: 'https',
        },
        android: {
          allowMixedContent: true,
          webContentsDebuggingEnabled: false,
        },
      },
      null,
      2
    )
  );

  // Android Native project structure
  const androidFolder = zip.folder('android')!;
  androidFolder.file(
    'build.gradle',
    `buildscript {
    repositories {
        google()
        mavenCentral()
    }
    dependencies {
        classpath 'com.android.tools.build:gradle:8.2.1'
        classpath 'com.google.gms:google-services:4.4.0'
    }
}
apply from: "variables.gradle"
allprojects {
    repositories {
        google()
        mavenCentral()
    }
}
tasks.register('clean', Delete) {
    delete rootProject.buildDir
}`
  );

  androidFolder.file(
    'variables.gradle',
    `ext {
    minSdkVersion = 22
    compileSdkVersion = 34
    targetSdkVersion = 34
    androidxActivityVersion = '1.8.0'
    androidxAppCompatVersion = '1.6.1'
    androidxCoordinatorLayoutVersion = '1.2.0'
    androidxCoreVersion = '1.12.0'
    androidxFragmentVersion = '1.6.2'
    junitVersion = '4.13.2'
    androidxJunitVersion = '1.1.5'
    androidxEspressoCoreVersion = '3.5.1'
    cordovaAndroidVersion = '10.1.1'
}`
  );

  androidFolder.file('settings.gradle', `include ':app'\nrootProject.name = 'android'`);

  const appFolder = androidFolder.folder('app')!;
  appFolder.file(
    'build.gradle',
    `apply plugin: 'com.android.application'

android {
    namespace "com.mystudy.app"
    compileSdkVersion rootProject.ext.compileSdkVersion
    defaultConfig {
        applicationId "com.mystudy.app"
        minSdkVersion rootProject.ext.minSdkVersion
        targetSdkVersion rootProject.ext.targetSdkVersion
        versionCode 1
        versionName "1.0.0"
        testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"
    }
    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
        debug {
            applicationIdSuffix ".debug"
            debuggable true
        }
    }
    compileOptions {
        sourceCompatibility JavaVersion.VERSION_17
        targetCompatibility JavaVersion.VERSION_17
    }
}

dependencies {
    implementation fileTree(include: ['*.jar'], dir: 'libs')
    implementation "androidx.appcompat:appcompat:$androidxAppCompatVersion"
    implementation "androidx.coordinatorlayout:coordinatorlayout:$androidxCoordinatorLayoutVersion"
    implementation "androidx.core:core-splashscreen:1.0.1"
    implementation project(':capacitor-android')
}`
  );

  const mainFolder = appFolder.folder('src')!.folder('main')!;
  mainFolder.file(
    'AndroidManifest.xml',
    `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:usesCleartextTraffic="true"
        android:requestLegacyExternalStorage="true"
        android:theme="@style/AppTheme">
        <activity
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|smallestScreenSize|screenLayout|uiMode|navigation|density"
            android:name=".MainActivity"
            android:label="@string/title_activity_main"
            android:theme="@style/AppTheme.NoActionBarLaunch"
            android:launchMode="singleTask"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
        <provider
            android:name="androidx.core.content.FileProvider"
            android:authorities="\${applicationId}.fileprovider"
            android:exported="false"
            android:grantUriPermissions="true">
            <meta-data
                android:name="android.support.FILE_PROVIDER_PATHS"
                android:resource="@xml/file_paths"></meta-data>
        </provider>
    </application>
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" android:maxSdkVersion="32" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" android:maxSdkVersion="29" />
    <uses-permission android:name="android.permission.READ_MEDIA_DOCUMENTS" />
</manifest>`
  );

  const javaFolder = mainFolder.folder('java')!.folder('com')!.folder('mystudy')!.folder('app')!;
  javaFolder.file(
    'MainActivity.java',
    `package com.mystudy.app;

import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        if (this.bridge != null && this.bridge.getWebView() != null) {
            WebView webView = this.bridge.getWebView();
            WebSettings settings = webView.getSettings();
            settings.setDomStorageEnabled(true);
            settings.setDatabaseEnabled(true);
            settings.setAllowFileAccess(true);
            settings.setAllowContentAccess(true);
            settings.setJavaScriptEnabled(true);
            settings.setJavaScriptCanOpenWindowsAutomatically(true);
            settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        }
    }
}`
  );

  const resValues = mainFolder.folder('res')!.folder('values')!;
  resValues.file(
    'strings.xml',
    `<?xml version='1.0' encoding='utf-8'?>
<resources>
    <string name="app_name">MyStudy</string>
    <string name="title_activity_main">MyStudy</string>
    <string name="package_name">com.mystudy.app</string>
</resources>`
  );

  resValues.file(
    'styles.xml',
    `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="AppTheme" parent="Theme.AppCompat.Light.NoActionBar">
        <item name="colorPrimary">#0D9488</item>
        <item name="colorPrimaryDark">#0F766E</item>
        <item name="colorAccent">#10B981</item>
        <item name="android:windowBackground">#F8FAFC</item>
    </style>
    <style name="AppTheme.NoActionBarLaunch" parent="AppTheme">
        <item name="android:windowBackground">#F8FAFC</item>
    </style>
</resources>`
  );

  const resXml = mainFolder.folder('res')!.folder('xml')!;
  resXml.file(
    'file_paths.xml',
    `<?xml version="1.0" encoding="utf-8"?>
<paths xmlns:android="http://schemas.android.com/apk/res/android">
    <external-path name="my_images" path="." />
    <external-files-path name="my_files" path="." />
    <files-path name="internal_files" path="." />
</paths>`
  );

  // GitHub Actions Free Cloud Build workflow
  const workflows = zip.folder('.github')!.folder('workflows')!;
  workflows.file(
    'build-apk.yml',
    `name: Build Android APK
on:
  workflow_dispatch:
  push:
    branches: [ main, master ]

jobs:
  build:
    name: Build Signed Android APK
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Source Code
        uses: actions/checkout@v4
      - name: Set up JDK 21
        uses: actions/setup-java@v4
        with:
          distribution: 'zulu'
          java-version: '21'
      - name: Set up Node.js 20
        uses: actions/setup-node@v4
        with:
          node-version: 20
      - name: Install Dependencies
        run: npm install
      - name: Build Web Production Assets
        run: npm run build
      - name: Sync Capacitor Android
        run: npx cap sync android
      - name: Build Android Debug APK
        run: |
          cd android
          ./gradlew assembleDebug --stacktrace
      - name: Upload Debug APK Artifact
        uses: actions/upload-artifact@v4
        with:
          name: MyStudy-Android-APK
          path: android/app/build/outputs/apk/debug/*.apk`
  );

  // User Guide
  zip.file(
    'README.md',
    `# MyStudy — Android Application Source Project

## How to get your installable Android APK (100% Free):

### Method A: PWABuilder (Instant 30-Second APK from your Phone)
1. Copy your MyStudy app URL.
2. Open https://www.pwabuilder.com in your mobile browser.
3. Paste the URL and tap "Package for Android" -> "Download APK".
4. Download the signed APK directly to your phone and install!

### Method B: GitHub Actions Free Cloud Build (No PC required)
1. Create a free GitHub repository on your phone or PC.
2. Upload this unzipped project.
3. Tap the "Actions" tab -> "Build Android APK" -> "Run workflow".
4. After 2 minutes, download the ready-to-install \`MyStudy-Android-APK.apk\` artifact directly onto your phone!

### Method C: Local Android Studio Build
1. Run \`npm install && npm run build && npx cap sync android\`.
2. Open the \`android\` directory in Android Studio.
3. Click Build -> Build APK.
`
  );

  const dateStr = new Date().toISOString().slice(0, 10);
  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
  triggerDownload(blob, `MyStudy_Complete_Android_Project_${dateStr}.zip`);
}
