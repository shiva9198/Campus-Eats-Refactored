# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Add any project specific keep options here:

# React Native Core
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }

# Networking (Axios -> OkHttp)
-keep class okhttp3.** { *; }
-keep class retrofit2.** { *; }

# SVG support
-keep class com.horcrux.svg.** { *; }

# JSON (Pydantic-style responses)
-keep class com.google.gson.** { *; }

# Gesture Handler / Reanimated (if added later)
-keep class com.swmansion.reanimated.** { *; }
-keep class com.swmansion.gesturehandler.** { *; }

# Firebase (if added later)
-keep class com.google.firebase.** { *; }

# MMKV (if added later)
-keep class com.tencent.mmkv.** { *; }
