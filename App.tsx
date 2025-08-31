

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { NavigationContainer, NavigatorScreenParams, NavigationContainerRef, NavigationState } from '@react-navigation/native'; 
import { createBottomTabNavigator, BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator, NativeStackNavigationOptions, NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Platform, StyleSheet, View, Text, Image, Alert, AppState, AppStateStatus, TouchableOpacity, I18nManager, Linking } from 'react-native';
import * as Notifications from 'expo-notifications';
import type { RouteProp, ParamListBase, Theme } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RFValue } from 'react-native-responsive-fontsize';
import { useFonts } from 'expo-font';
import * as NativeSplashScreen from 'expo-splash-screen';
import SplashScreen from './screens/SplashScreen';


// import HomeScreen from './screens/HomeScreen'; // Removed HomeScreen
// import QuranScreen from './screens/QuranScreen'; // Old QuranScreen
import PrayerTimesScreen from './screens/PrayerTimesScreen';
import AdhkarScreen from './screens/AdhkarScreen';
import SettingsScreen from './screens/SettingsScreen'; 
import QuranIndexScreen from './screens/QuranIndexScreen';
import QuranPageViewerScreen from './screens/QuranPageViewerScreen'; 
import SurahViewScreen from './screens/SurahViewScreen'; 
import ChatbotScreen from './screens/ChatbotScreen'; 
import ReciterListScreen from './screens/ReciterListScreen'; 
import DraggableChatbotFAB from './components/DraggableChatbotFAB'; 
import ReportsScreen from './screens/ReportsScreen'; // Added ReportsScreen
import AboutScreen from './screens/AboutScreen';

// New Quran Menu Screens
import BookmarksScreen from './screens/BookmarksScreen';
import AudioDownloadScreen from './screens/AudioDownloadScreen';
// import FontSizeSettingsScreen from './screens/FontSizeSettingsScreen'; // No longer needed
import MemorizationSetupScreen from './screens/MemorizationSetupScreen'; 
import AdhkarListScreen from './screens/AdhkarListScreen'; 
import AdhkarRemindersScreen from './screens/AdhkarRemindersScreen'; // Added AdhkarRemindersScreen


import { BookOpenIcon, ClockIcon, SparklesIcon, CogIcon, ChartBarIcon } from './components/Icons'; 
import { 
  APP_NAME, 
  ASYNC_STORAGE_LAST_EMOTIONAL_CONTEXT,
  ASYNC_STORAGE_LAST_EMOTIONAL_TIMESTAMP,
  ASYNC_STORAGE_FOLLOW_UP_NOTIFICATION_ID,
  HOURS_FOR_RECENT_EMOTIONAL_INTERACTION,
  FOLLOW_UP_NOTIFICATION_DELAY_HOURS,
  ASYNC_STORAGE_NOTIFICATION_SETTINGS_KEY
} from './constants';
import { initializeNotifications, loadAndRescheduleAllAdhkarReminders, preloadAdhanSounds, rescheduleNotifications, setupDailyNotificationRefresh, handleBackgroundNotificationRefresh } from './services/notificationService'; 
import Colors from './constants/colors';
import { Ayah, Surah, NotificationSettings } from './types';
import LogoURL from './assets/logo.png';

// Keep the native splash screen visible while we fetch resources and load fonts
NativeSplashScreen.preventAutoHideAsync();

// Enforce Right-to-Left layout for the entire app to ensure consistency
// This is important for an Arabic-centric application.
if (!I18nManager.isRTL) {
  try {
    I18nManager.forceRTL(true);
    // Note: A reload of the app might be required for this change to take full effect on native platforms.
    // In a production app, you might prompt the user to restart or use a library like `expo-updates` to reload.
  } catch (e) {
    console.error("Failed to force RTL layout:", e);
  }
}


export type MemorizationTestParams = {
  difficulty: 'easy' | 'medium' | 'hard';
  surahId: number;
  startAyahNumber: number;
  endAyahNumber: number;
  testMode: 'visual' | 'audio';
};

export type QuranStackParamList = {
  QuranIndex: undefined;
  QuranPageViewer: { 
    initialPageNumber?: number; 
    bookmarkedAyahs?: number[]; 
    testParams?: MemorizationTestParams; 
    ayahToPlayAfterReciterSelection?: Ayah; 
    targetSurahIdentifier?: string | number; 
    targetVerseNumber?: number; 
  }; 
  SurahViewDeprecated: undefined; 
  Bookmarks: { 
    bookmarkedAyahs: number[]; 
    surahList: Surah[];
  };
  AudioDownload: undefined;
  MemorizationSetup: undefined; 
  ReciterList: { ayahToPlay: Ayah }; 
};

export type AdhkarStackParamList = {
  AdhkarCategories: undefined; 
  AdhkarList: { categoryId: string; categoryName: string }; 
};


export type TabParamList = {
  QuranStack: NavigatorScreenParams<QuranStackParamList>; 
  PrayerTimesTab: undefined;
  AdhkarTab: NavigatorScreenParams<AdhkarStackParamList>; 
  ReportsTab: undefined;
};

export type AppStackParamList = {
  Main: NavigatorScreenParams<TabParamList>;
  Settings: undefined;
  Chatbot: undefined; 
  AdhkarReminders: undefined; // Added AdhkarRemindersScreen to AppStack
  About: undefined;
};


const QuranStackNav = createNativeStackNavigator<QuranStackParamList>();
const AdhkarStackNav = createNativeStackNavigator<AdhkarStackParamList>(); 
const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<AppStackParamList>();

const commonHeaderOptions: NativeStackNavigationOptions = {
  headerStyle: {
    backgroundColor: Colors.primary,
  },
  headerTintColor: Colors.secondary,
  headerTitleStyle: {
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium', 
  },
  headerTitleAlign: 'center',
};

const AppHeaderTitle: React.FC = () => (
  <View style={styles.headerTitleContainer}>
    <Image source={LogoURL} style={styles.headerLogo} />
    <Text style={styles.headerTitleText}>{APP_NAME}</Text>
  </View>
);

function QuranStack() {
  return (
    <QuranStackNav.Navigator
      id={undefined}
        initialRouteName="QuranIndex"
        screenOptions={{
            ...commonHeaderOptions,
            headerShown: false, // Use custom in-page header now
        }}
    >
        <QuranStackNav.Screen 
            name="QuranIndex" 
            component={QuranIndexScreen} 
        />
        <QuranStackNav.Screen 
            name="QuranPageViewer" 
            component={QuranPageViewerScreen}
            options={{
              headerShown: true, // This screen needs the dynamic page number header
            }}
        />
        <QuranStackNav.Screen 
            name="SurahViewDeprecated" 
            component={SurahViewScreen} 
            options={{ title: 'عرض السورة (قديم)', headerShown: true }} 
        />
        <QuranStackNav.Screen
            name="Bookmarks"
            component={BookmarksScreen}
            options={{ title: 'العلامات المرجعية', headerShown: true }}
        />
        <QuranStackNav.Screen
            name="AudioDownload"
            component={AudioDownloadScreen}
            options={{ title: 'تحميل الصوتيات', headerShown: true }}
        />
        <QuranStackNav.Screen 
            name="MemorizationSetup"
            component={MemorizationSetupScreen}
            options={{ title: 'إعداد اختبار الحفظ', headerShown: true }}
        />
        <QuranStackNav.Screen 
            name="ReciterList"
            component={ReciterListScreen}
            options={{ title: 'اختر القارئ', headerRight: () => null, headerShown: true }}
        />
    </QuranStackNav.Navigator>
  );
}

function AdhkarStack() {
  return (
    <AdhkarStackNav.Navigator
      id={undefined} 
        initialRouteName="AdhkarCategories"
        screenOptions={{
            ...commonHeaderOptions,
            headerShown: false, // Use custom in-page header now
        }}
    >
        <AdhkarStackNav.Screen
            name="AdhkarCategories"
            component={AdhkarScreen} 
        />
        <AdhkarStackNav.Screen
            name="AdhkarList"
            component={AdhkarListScreen}
            options={{ headerShown: false }}
        />
    </AdhkarStackNav.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      id={undefined}
      initialRouteName="PrayerTimesTab"
      screenOptions={{
        tabBarActiveTintColor: Colors.secondary,
        tabBarInactiveTintColor: Colors.moonlight,
        tabBarStyle: {
          backgroundColor: Colors.primary,
          borderTopColor: Colors.secondary,
          paddingBottom: Platform.OS === 'ios' ? RFValue(20) : RFValue(5),
          height: Platform.OS === 'ios' ? RFValue(80) : RFValue(60),
        },
        tabBarLabelStyle: {
          fontSize: RFValue(10),
          fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
        },
        headerShown: false,
      }}
    >
      <Tab.Screen 
        name="PrayerTimesTab" 
        component={PrayerTimesScreen} 
        options={{ 
            tabBarLabel: 'الصلاة',
            tabBarIcon: ({ color, size }) => <ClockIcon color={color} width={size} height={size} />
        }} 
      />
      <Tab.Screen 
        name="QuranStack"
        component={QuranStack}
        options={{ 
            tabBarLabel: 'القرآن',
            tabBarIcon: ({ color, size }) => <BookOpenIcon color={color} width={size} height={size} />
        }} 
      />
      <Tab.Screen 
        name="AdhkarTab" 
        component={AdhkarStack}
        options={{ 
            tabBarLabel: 'الأذكار',
            tabBarIcon: ({ color, size }) => <SparklesIcon color={color} width={size} height={size} />
        }} 
      />
      <Tab.Screen 
        name="ReportsTab" 
        component={ReportsScreen} 
        options={{ 
            tabBarLabel: 'التقارير',
            tabBarIcon: ({ color, size }) => <ChartBarIcon color={color} width={size} height={size} />
        }} 
      />
    </Tab.Navigator>
  );
}

const AppContent: React.FC = () => {
  const appState = useRef(AppState.currentState);
  const navigationRef = useRef<NavigationContainerRef<AppStackParamList>>(null);
  
  const [fontsLoaded, fontError] = useFonts({
      // It is assumed that these font files are located in the './assets/fonts/' directory.
      // If the app crashes on launch, please ensure these files are present.
      'Amiri-Regular': require('./assets/fonts/Amiri-Regular.ttf'),
      'Amiri-Bold': require('./assets/fonts/Amiri-Bold.ttf'),
      'AmiriQuran-Regular': require('./assets/fonts/AmiriQuran-Regular.ttf'),
      'UthmanTNB': require('./assets/fonts/UthmanTNB_v2-0.ttf'),
  });

  const [isCustomSplashDone, setIsCustomSplashDone] = useState(false);
  const [isFabVisible, setIsFabVisible] = useState(true);

  useEffect(() => {
  const setupApp = async () => {
    console.log("Starting initial app setup...");
    const granted = await initializeNotifications();
        
    if (granted) {
      await preloadAdhanSounds();
      await setupDailyNotificationRefresh();
      console.log("Notification permissions granted. Daily refresh is set up.");
    } else if (Platform.OS !== 'web') {
            console.warn("Notification permissions not granted");
            Alert.alert(
                "تنبيه الإشعارات",
                "لم يتم منح إذن الإشعارات. لن تتمكن من استقبال تنبيهات مواقيت الصلاة أو الأذكار.",
                [{ text: "فتح الإعدادات", onPress: () => Linking.openSettings() }, { text: "حسنًا", style: "cancel" }]
            );
        }
    };
    setupApp();

    const notificationReceivedSubscription = Notifications.addNotificationReceivedListener(notification => {
        const data = notification.request.content.data as any;
        if (data?.type === 'dailyRefresh') {
            console.log("Received daily refresh notification, triggering background handler...");
            // The repeating trigger handles rescheduling itself, no need to call setupDailyNotificationRefresh() here.
            handleBackgroundNotificationRefresh();
        }
    });

    const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response received:', response);
      const notificationData = response.notification.request.content.data as any;
      if (notificationData) {
        if (notificationData.type === 'chatbotFollowUp') {
          console.log('Chatbot follow-up notification tapped. Navigating to Chatbot screen.');
          navigationRef.current?.navigate('Chatbot');
        } else if (notificationData.type === 'adhkarReminder' && notificationData.categoryId && notificationData.categoryName) {
           console.log('Adhkar reminder notification tapped. Navigating to AdhkarList screen for category:', notificationData.categoryName);
           navigationRef.current?.navigate('Main', {
             screen: 'AdhkarTab',
             params: {
               screen: 'AdhkarList',
               params: {
                 categoryId: notificationData.categoryId,
                 categoryName: notificationData.categoryName,
               },
             },
           });
        } else if (notificationData.prayerName) {
            console.log('Prayer notification tapped for:', notificationData.prayerName);
            navigationRef.current?.navigate('Main', { screen: 'PrayerTimesTab' });
        }
      }
    });

    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        console.log('App has come to the foreground!');
        const notificationId = await AsyncStorage.getItem(ASYNC_STORAGE_FOLLOW_UP_NOTIFICATION_ID);
        if (notificationId) {
          await Notifications.cancelScheduledNotificationAsync(notificationId);
          await AsyncStorage.removeItem(ASYNC_STORAGE_FOLLOW_UP_NOTIFICATION_ID);
          console.log('Cancelled scheduled follow-up notification as app became active:', notificationId);
        }
        await loadAndRescheduleAllAdhkarReminders();

      } else if (appState.current === 'active' && nextAppState.match(/inactive|background/)) {
        console.log('App has gone to the background!');
        const lastContext = await AsyncStorage.getItem(ASYNC_STORAGE_LAST_EMOTIONAL_CONTEXT);
        const lastTimestampStr = await AsyncStorage.getItem(ASYNC_STORAGE_LAST_EMOTIONAL_TIMESTAMP);

        if (lastContext && lastTimestampStr) {
          const lastTimestamp = parseInt(lastTimestampStr, 10);
          const hoursSinceLastEmotion = (Date.now() - lastTimestamp) / (1000 * 60 * 60);

          if (hoursSinceLastEmotion < HOURS_FOR_RECENT_EMOTIONAL_INTERACTION) {
            const existingNotificationId = await AsyncStorage.getItem(ASYNC_STORAGE_FOLLOW_UP_NOTIFICATION_ID);
            if (existingNotificationId) {
              await Notifications.cancelScheduledNotificationAsync(existingNotificationId);
              console.log('Cancelled existing follow-up notification before scheduling a new one:', existingNotificationId);
            }

          const newNotificationId = await Notifications.scheduleNotificationAsync({
            content: {
              title: APP_NAME,
              body: `مرحباً بك. في محادثتنا الأخيرة، بدا أنك تشعر بـ (${lastContext}). كيف حالك اليوم بخصوص هذا الأمر؟`,
              data: { type: 'chatbotFollowUp' },
              sound: 'default',
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
              seconds: FOLLOW_UP_NOTIFICATION_DELAY_HOURS * 60 * 60,
              repeats: false,
            },
          });
          await AsyncStorage.setItem(
            ASYNC_STORAGE_FOLLOW_UP_NOTIFICATION_ID,
            newNotificationId
          );

          console.log(
            'Scheduled follow-up notification:',
            newNotificationId,
            'for context:',
            lastContext
          );
        } else {
          console.log('Last emotional interaction too old, not scheduling follow-up notification.');
        }
      } else {
        console.log('No recent emotional context found, not scheduling follow-up.');
      }
    }

    appState.current = nextAppState;
  };

  const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

  return () => {
    Notifications.removeNotificationSubscription(notificationReceivedSubscription);
    Notifications.removeNotificationSubscription(responseSubscription);
    appStateSubscription.remove();
  };
}, []);

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await NativeSplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    if (fontError) {
      console.error("Font loading error:", fontError);
      Alert.alert("Font Error", "Could not load required fonts. The app might not display correctly.");
    }
  }, [fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  // If fonts are loaded but our custom splash animation isn't done, show it.
  // The onLayout prop will hide the native splash screen, revealing this component.
  if (!isCustomSplashDone) {
    return (
      <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
        <SplashScreen onFinish={() => setIsCustomSplashDone(true)} />
      </View>
    );
  }
  
  const getActiveRouteName = (state: NavigationState | undefined): string => {
    if (!state) {
        return '';
    }
    const route = state.routes[state.index];

    if (route.state) {
        // Dive into nested navigators
        return getActiveRouteName(route.state as NavigationState);
    }
    return route.name;
  };


  // Both native and custom splashes are done. Show the main app.
  // The structure is changed here to properly handle overlays and safe areas.
  return (
    <View style={{ flex: 1 }}>
      <NavigationContainer 
        ref={navigationRef}
        onStateChange={(state) => {
          if (state) {
              const currentRouteName = getActiveRouteName(state);
              const fabVisibleRoutes = ['PrayerTimesTab', 'QuranIndex', 'AdhkarCategories', 'ReportsTab'];
              setIsFabVisible(fabVisibleRoutes.includes(currentRouteName));
          }
        }}
      >
        <Stack.Navigator
          id={undefined}
          initialRouteName="Main"
          screenOptions={{...commonHeaderOptions}}
        >
          <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }}/>
          <Stack.Screen name="Settings" component={SettingsScreen} options={{ headerShown: false }} />
          <Stack.Screen 
            name="Chatbot" 
            component={ChatbotScreen} 
            options={{ headerShown: false }} 
          />
          <Stack.Screen
            name="AdhkarReminders"
            component={AdhkarRemindersScreen}
            options={{ title: 'تذكيرات الأذكار', headerShown: false }}
          />
          <Stack.Screen 
            name="About" 
            component={AboutScreen} 
            options={{ title: 'عن التطبيق', headerShown: false }} 
          />
        </Stack.Navigator>
      </NavigationContainer>
      {isFabVisible && <DraggableChatbotFAB navigationRef={navigationRef} />}
    </View>
  );
};

const App: React.FC = () => {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  headerTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center', 
  },
  headerLogo: {
    width: RFValue(30),
    height: RFValue(30),
    borderRadius: RFValue(15),
    marginRight: RFValue(10), 
  },
  headerTitleText: {
    color: Colors.secondary, 
    fontSize: RFValue(20),
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  },
});

export default App;