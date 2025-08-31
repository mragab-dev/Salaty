


export default {
  expo: {
    name: "صلاتي - Salaty",
    slug: "salaty",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png", // Ensure you have this icon
    userInterfaceStyle: "light", // Or 'automatic' or 'dark'
    splash: {
      image: "./assets/splash.png", // Ensure you have this splash screen
      resizeMode: "contain",
      backgroundColor: "#1A2F45" // Example background color, align with your theme
    },
    updates: {
      fallbackToCacheTimeout: 0
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.quadravexa.salaty" // Replace with your bundle ID
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png", // Ensure you have this icon
        backgroundColor: "#1A2F45"
      },
      package: "com.quadravexa.salaty", // Replace with your package name
      permissions: [
        "android.permission.ACCESS_COARSE_LOCATION",
        "android.permission.ACCESS_FINE_LOCATION",
        "android.permission.ACCESS_NETWORK_STATE",
        "android.permission.INTERNET",
        "android.permission.POST_NOTIFICATIONS",
        "android.permission.RECEIVE_BOOT_COMPLETED",
        "android.permission.VIBRATE",
        "android.permission.WAKE_LOCK",
        "android.permission.FOREGROUND_SERVICE",
        "android.permission.SCHEDULE_EXACT_ALARM",
        "android.permission.USE_FULL_SCREEN_INTENT",
        "android.permission.SYSTEM_ALERT_WINDOW",
        // Added for better reliability on some devices, may require justification for Play Store
        "android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS"
      ],
      // إضافة إعدادات مهمة للإشعارات
      allowBackup: true,
      allowClearUserData: false,
      // إضافة إعدادات للصوت
      audio: {
        "android:hardwareAccelerated": "true"
      }
    },
    web: {
      favicon: "./assets/favicon.png" // Ensure you have this favicon
    },
    extra: {
      eas: {
        "projectId": "ab21ce1e-20f7-41d2-991d-9703952b3bf3"
      }
    },
    plugins: [
        [
            "expo-location",
            {
              "locationAlwaysAndWhenInUsePermission": "Allow $(PRODUCT_NAME) to use your location to show accurate prayer times and Qibla direction."
            }
        ],
        [
          "expo-notifications",
          {
            "icon": "./assets/notification-icon.png", // Ensure you have a 96x96 notification icon
            "color": "#C4A052", // Notification color
            "sounds": [ // This ensures the sound files are bundled in the native build
                "./assets/sounds/adhan_makki.mp3",
                "./assets/sounds/adhan_kurdi.mp3"
            ],
            "mode": "production",
            "androidMode": "default",
            "androidCollapsedTitle": "صلاتي - Salaty"
          }
        ],
        [
          "expo-av",
          {
            "microphonePermission": false,
            "cameraPermission": false
          }
        ]
    ]
  }
};