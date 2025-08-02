
import 'dotenv/config';

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
      bundleIdentifier: "com.quadrovexa.salaty" // Replace with your bundle ID
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png", // Ensure you have this icon
        backgroundColor: "#1A2F45"
      },
      package: "com.quadrovexa.salaty" // Replace with your package name
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
            "sounds": [ // For custom Adhan sounds if you bundle them locally
                "./assets/sounds/adhan_makki.mp3",
                "./assets/sounds/adhan_kurdi.mp3"
            ]
          }
        ]
    ]
  }
};