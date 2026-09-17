# Firekeeper ProGuard / R8 Rules
# ──────────────────────────────────────────────────────────────
# React Native core — preserve TurboModules and JNI interfaces
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.jni.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }
-keepclassmembers class * {
    @com.facebook.react.bridge.ReactMethod *;
}

# Kotlin coroutines / reflection
-keep class kotlin.** { *; }
-keep class kotlin.Metadata { *; }
-dontwarn kotlin.**
-keepclassmembers class **$WhenMappings { <fields>; }

# Firebase — prevent stripping of dynamic dispatch classes
-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.firebase.**
-dontwarn com.google.android.gms.**

# Expo modules
-keep class expo.modules.** { *; }
-dontwarn expo.modules.**

# React Navigation
-keep class com.swmansion.** { *; }
-dontwarn com.swmansion.**

# AsyncStorage
-keep class com.reactnativecommunity.asyncstorage.** { *; }

# WebView
-keep class com.reactnativecommunity.webview.** { *; }

# OkHttp / Retrofit (used by axios native layer)
-dontwarn okhttp3.**
-dontwarn okio.**
-keep class okhttp3.** { *; }
-keep interface okhttp3.** { *; }

# Serialization — keep data classes
-keepclassmembers class * implements java.io.Serializable {
    static final long serialVersionUID;
    private static final java.io.ObjectStreamField[] serialPersistentFields;
    private void writeObject(java.io.ObjectOutputStream);
    private void readObject(java.io.ObjectInputStream);
    java.lang.Object writeReplace();
    java.lang.Object readResolve();
}

# Prevent stripping R classes
-keep class **.R
-keep class **.R$* { <fields>; }

# Add any project-specific keep options here:
