import React, { useEffect, useRef, useState } from 'react';
import { NavigationContainer, NavigatorScreenParams, NavigationContainerRef } from '@react-navigation/native'; 
import { createBottomTabNavigator, BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator, NativeStackNavigationOptions, NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Platform, StyleSheet, View, Text, Image, Alert, AppState, AppStateStatus, TouchableOpacity } from 'react-native';
import * as Notifications from 'expo-notifications';
import type { RouteProp, ParamListBase, Theme } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider } from 'react-native-safe-area-context'; // Added import
import { RFValue } from 'react-native-responsive-fontsize';


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
import SplashScreen from './screens/SplashScreen'; // Import the new splash screen
import AboutScreen from './screens/AboutScreen';

// New Quran Menu Screens
import BookmarksScreen from './screens/BookmarksScreen';
import AudioDownloadScreen from './screens/AudioDownloadScreen';
import FontSizeSettingsScreen from './screens/FontSizeSettingsScreen';
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
  FOLLOW_UP_NOTIFICATION_DELAY_HOURS
} from './constants';
import { initializeNotifications, loadAndRescheduleAllAdhkarReminders } from './services/notificationService'; 
import Colors from './constants/colors';
import { Ayah } from './types';


const LOGO_URL = require('./assets/logo.png'); 

export type MemorizationTestParams = {
  difficulty: 'easy' | 'medium' | 'hard';
  surahId: number;
  startAyahNumber: number;
  endAyahNumber: number;
};

export type QuranStackParamList = {
  QuranIndex: undefined;
  QuranPageViewer: { 
    initialPageNumber?: number; 
    bookmarkedAyahs?: Set<number>; 
    fontSizeScale?: number;     
    testParams?: MemorizationTestParams; 
    ayahToPlayAfterReciterSelection?: Ayah; 
    targetSurahIdentifier?: string | number; 
    targetVerseNumber?: number; 
  }; 
  SurahViewDeprecated: undefined; 
  Bookmarks: { 
    bookmarkedAyahs: Set<number>; 
    allAyahs: Ayah[]; 
  };
  AudioDownload: undefined;
  FontSizeSettings: { 
    currentScale: number; 
  };
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
    <Image source={LOGO_URL} style={styles.headerLogo} />
    <Text style={styles.headerTitleText}>{APP_NAME}</Text>
  </View>
);

function QuranStack() {
  return (
    <QuranStackNav.Navigator
      id={undefined}
        initialRouteName="QuranIndex"
        screenOptions={({ navigation }) => ({
            ...commonHeaderOptions,
            headerRight: () => (
            <TouchableOpacity style={{ marginRight: RFValue(15) }} onPress={() => (navigation as any).navigate('Settings')}>
                <CogIcon color={Colors.secondary} size={RFValue(26)} />
            </TouchableOpacity>
            ),
        })}
    >
        <QuranStackNav.Screen 
            name="QuranIndex" 
            component={QuranIndexScreen} 
            options={{ title: 'فهرس القرآن', headerTitle: () => <AppHeaderTitle /> }} 
        />
        <QuranStackNav.Screen 
            name="QuranPageViewer" 
            component={QuranPageViewerScreen} 
        />
        <QuranStackNav.Screen 
            name="SurahViewDeprecated" 
            component={SurahViewScreen} 
            options={{ title: 'عرض السورة (قديم)' }} 
        />
        <QuranStackNav.Screen
            name="Bookmarks"
            component={BookmarksScreen}
            options={{ title: 'العلامات المرجعية' }}
        />
        <QuranStackNav.Screen
            name="AudioDownload"
            component={AudioDownloadScreen}
            options={{ title: 'تحميل الصوتيات' }}
        />
        <QuranStackNav.Screen
            name="FontSizeSettings"
            component={FontSizeSettingsScreen}
            options={{ title: 'تعديل حجم الخط' }}
        />
        <QuranStackNav.Screen 
            name="MemorizationSetup"
            component={MemorizationSetupScreen}
            options={{ title: 'إعداد اختبار الحفظ' }}
        />
        <QuranStackNav.Screen 
            name="ReciterList"
            component={ReciterListScreen}
            options={{ title: 'اختر القارئ', headerRight: () => null }}
        />
    </QuranStackNav.Navigator>
  );
}

function AdhkarStack() {
  return (
    <AdhkarStackNav.Navigator
      id={undefined} 
        initialRouteName="AdhkarCategories"
        screenOptions={({ navigation }) => ({
            ...commonHeaderOptions,
            headerRight: () => (
            <TouchableOpacity style={{ marginRight: RFValue(15) }} onPress={() => (navigation as any).navigate('Settings')}>
                <CogIcon color={Colors.secondary} size={RFValue(26)} />
            </TouchableOpacity>
            ),
        })}
    >
        <AdhkarStackNav.Screen
            name="AdhkarCategories"
            component={AdhkarScreen} 
            options={{ title: 'فئات الأذكار', headerTitle: () => <AppHeaderTitle /> }}
        />
        <AdhkarStackNav.Screen
            name="AdhkarList"
            component={AdhkarListScreen}
            options={({ route }) => ({ title: route.params.categoryName })} 
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

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const appState = useRef(AppState.currentState);
  const navigationRef = useRef<NavigationContainerRef<AppStackParamList>>(null);


  useEffect(() => {
    const splashTimer = setTimeout(() => {
        setIsLoading(false);
    }, 5000);

    const setupNotifications = async () => {
      const granted = await initializeNotifications();
      if (!granted && Platform.OS !== 'web') { 
        Alert.alert(
          "تنبيه الإشعارات",
          "لم يتم منح إذن الإشعارات. لن تتمكن من استقبال تنبيهات مواقيت الصلاة أو الأذكار.",
          [{ text: "حسنًا" }]
        );
      }
      // Load and reschedule Adhkar reminders on app start
      await loadAndRescheduleAllAdhkarReminders();
    };
    setupNotifications();

    const foregroundSubscription = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received in foreground:', notification);
    });

    const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response received:', response);
      const notificationData = response.notification.request.content.data as any; // Cast to any for easier data access
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
        // Re-evaluate Adhkar reminders when app comes to foreground
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
    type: 'timeInterval' as any,
    seconds: FOLLOW_UP_NOTIFICATION_DELAY_HOURS * 60 * 60,
  },
});
            await AsyncStorage.setItem(ASYNC_STORAGE_FOLLOW_UP_NOTIFICATION_ID, newNotificationId);
            console.log('Scheduled follow-up notification:', newNotificationId, 'for context:', lastContext);
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
      clearTimeout(splashTimer);
      Notifications.removeNotificationSubscription(foregroundSubscription);
      Notifications.removeNotificationSubscription(responseSubscription);
      appStateSubscription.remove();
    };
  }, []);

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1 }}>
        <NavigationContainer ref={navigationRef}>
          <Stack.Navigator
            id={undefined} 
            initialRouteName="Main"
            screenOptions={({ navigation }) => ({
              ...commonHeaderOptions,
              headerTitle: () => <AppHeaderTitle />,
              headerRight: () => (
                <TouchableOpacity style={{ marginRight: RFValue(15) }} onPress={() => navigation.navigate('Settings')}>
                  <CogIcon color={Colors.secondary} size={RFValue(26)} />
                </TouchableOpacity>
              ),
            })}
          >
            <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }}/>
            <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'الإعدادات', headerRight: () => null }} />
            <Stack.Screen 
              name="Chatbot" 
              component={ChatbotScreen} 
              options={{ title: 'اسأل صلاتي' }} 
            />
            <Stack.Screen
              name="AdhkarReminders"
              component={AdhkarRemindersScreen}
              options={{ title: 'تذكيرات الأذكار', headerRight: () => null }}
            />
            <Stack.Screen 
              name="About" 
              component={AboutScreen} 
              options={{ title: 'عن التطبيق', headerRight: () => null }} 
            />
          </Stack.Navigator>
        </NavigationContainer>
        <DraggableChatbotFAB navigationRef={navigationRef} />
      </View>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start', 
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