

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  Modal as RNModal, 
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
  Linking,
  Alert,
  FlatList,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFocused, NavigationProp, useFocusEffect } from '@react-navigation/native';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import Svg, { Path, Circle } from 'react-native-svg';
import moment from 'moment-timezone';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RFValue } from 'react-native-responsive-fontsize';

import LocationPermission from '../components/LocationPermission';
import PrayerCard, { Prayer as PrayerCardPrayer } from '../components/PrayerCard';
import RandomDua from '../components/RandomDua';
import DigitalTasbih from '../components/DigitalTasbih';
import QiblaCompass from '../components/QiblaCompass'; // Import the compass
import Colors from '../constants/colors';
import { calculateAndFormatPrayerTimes, getDeviceLocation } from '../services/prayerTimeService';
import { schedulePrayerNotifications } from '../services/notificationService'; 
import { Prayer as PrayerType, RNGeolocationCoordinates, NotificationSettings, ActivityLog, DhikrOption } from '../types'; // Renamed Prayer to PrayerType
import { DEFAULT_NOTIFICATION_SETTINGS, ASYNC_STORAGE_NOTIFICATION_SETTINGS_KEY, ASYNC_STORAGE_LATEST_PRAYER_TIMES, ASYNC_STORAGE_LAST_NOTIFICATION_SCHEDULE_DATE } from '../constants'; 
import LoadingSpinner from '../components/LoadingSpinner';
import { BellIcon, BellOffIcon, CalendarIcon, ClockIcon as OriginalClockIcon, SparklesIcon as OriginalSparklesIcon, BookOpenIcon, RepeatIcon, CloseIcon, SettingsIcon, RotateCcwIcon } from '../components/Icons';
import { logActivity } from '../services/activityLogService';
import { ADDITIONAL_TASBIH_OPTIONS } from '../assets/data/azkar/tasbih_options';
import { IslamicPattern } from '../components/IslamicPattern';
import IslamicPatternImg from '../assets/images/islamic_pattern.png';
import MosqueSilhouetteImg from '../assets/images/mosque_silhouette.png';
import AppHeader from '../components/AppHeader';
import { AppStackParamList } from '../App';


const DHIKR_SEQUENCE: DhikrOption[] = [
  { id: 'subhanAllah', text: 'سبحان الله', count: 33, fadl: "من قال 'سبحان الله' مئة مرة، كتبت له ألف حسنة أو حطت عنه ألف خطيئة." },
  { id: 'alhamdulillah', text: 'الحمد لله', count: 33, fadl: "'الحمد لله' تملأ الميزان، وهي أحب الكلام إلى الله." },
  { id: 'allahuAkbar', text: 'الله أكبر', count: 34, fadl: "'الله أكبر' من الكلمات التي يحبها الله، وتملأ ما بين السماء والأرض." },
];

const { width: screenWidth } = Dimensions.get('window');
const ITEM_VISIBLE_COUNT = 3.3; 
const DHIKR_BUTTON_WIDTH = screenWidth / ITEM_VISIBLE_COUNT;

interface DisplayPrayer extends PrayerCardPrayer {
  id: string; // Already in PrayerCardPrayer through PrayerType
}

type TasbihMode = 'free' | 'target' | 'traditional';

export default function PrayerTimesScreen({ navigation }: { navigation: NavigationProp<AppStackParamList> }) {
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const [locationPermissionStatus, setLocationPermissionStatus] = useState<boolean | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [timeRemaining, setTimeRemaining] = useState('');
  
  const [selectedDhikr, setSelectedDhikr] = useState<DhikrOption | null>(null);
  const [isMoreTasbihVisible, setIsMoreTasbihVisible] = useState(false);
  const [isSettingTargetInModal, setIsSettingTargetInModal] = useState(false);
  const [tasbihTargetInput, setTasbihTargetInput] = useState('33');

  // --- Tasbih State (lifted from DigitalTasbih) ---
  const [tasbihMode, setTasbihMode] = useState<TasbihMode>('traditional');
  const [tasbihTarget, setTasbihTarget] = useState(33);
  const [tasbihTotalSessions, setTasbihTotalSessions] = useState(0);
  const [tasbihHapticEnabled, setTasbihHapticEnabled] = useState(true);
  const [tasbihResetToken, setTasbihResetToken] = useState(0);
  // ---------------------------------------------------

  // --- New states for Qibla Compass ---
  const [location, setLocation] = useState<RNGeolocationCoordinates | null>(null);
  const [heading, setHeading] = useState<number | null>(null);
  const [qiblaDirection, setQiblaDirection] = useState<number | null>(null);
  // --------------------------------------

  const [prayerTimesData, setPrayerTimesData] = useState<PrayerType[] | null>(null); // Changed to PrayerType[]
  const [currentFormattedDate, setCurrentFormattedDate] = useState<string>('');
  const [nextPrayerDetails, setNextPrayerDetails] = useState<PrayerType | null>(null);
  const [prayerTimesLoading, setPrayerTimesLoading] = useState(true);
  const [prayerTimesError, setPrayerTimesError] = useState<string | null>(null);
  const [lastPrayerTimesUpdate, setLastPrayerTimesUpdate] = useState<Date | null>(null);
  
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const timeOpacity = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-50)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const requestLocationPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    setLocationPermissionStatus(status === 'granted');
    if (status === 'granted') {
      onRefresh(); // Trigger a refresh to load data with new permission
    }
  };
  
  const loadDataAndSchedule = useCallback(async (isRefresh = false) => {
    setPrayerTimesLoading(true);
    setPrayerTimesError(null);

    try {
        // 1. Load settings first
        const storedSettings = await AsyncStorage.getItem(ASYNC_STORAGE_NOTIFICATION_SETTINGS_KEY);
        const currentSettings = storedSettings ? JSON.parse(storedSettings) : DEFAULT_NOTIFICATION_SETTINGS;
        setNotificationSettings(currentSettings);

        // 2. Check location permission
        let { status } = await Location.getForegroundPermissionsAsync();
        if (status !== 'granted' && isRefresh) {
            status = (await Location.requestForegroundPermissionsAsync()).status;
        }
        const hasPermission = status === 'granted';
        setLocationPermissionStatus(hasPermission);

        // 3. Get location if permitted
        let coords: RNGeolocationCoordinates | null = null;
        if (hasPermission) {
            coords = await getDeviceLocation();
            setLocation(coords);
        }

        // 4. Calculate prayer times
        const { prayers: times, date: formattedDate, isMock, error: fetchError } = await calculateAndFormatPrayerTimes(coords);
        
        // 5. Update state
        setPrayerTimesData(times);
        setCurrentFormattedDate(formattedDate);
        if (fetchError) setPrayerTimesError(fetchError);
        setLastPrayerTimesUpdate(new Date());

        // 6. Schedule notifications ONLY if data is real and not already scheduled today
        if (!isMock && times && times.length > 0) {
            await AsyncStorage.setItem(ASYNC_STORAGE_LATEST_PRAYER_TIMES, JSON.stringify(times));
            
            // Check if notifications were already scheduled today
            const lastScheduleDate = await AsyncStorage.getItem(ASYNC_STORAGE_LAST_NOTIFICATION_SCHEDULE_DATE);
            const today = new Date().toDateString();
            
            if (lastScheduleDate !== today) {
                console.log("Notifications not scheduled for today, scheduling now...");
                await schedulePrayerNotifications(times, currentSettings);
                // Mark that notifications were scheduled today
                await AsyncStorage.setItem(ASYNC_STORAGE_LAST_NOTIFICATION_SCHEDULE_DATE, today);
            } else {
                console.log("Notifications already scheduled for today, skipping re-scheduling.");
            }
        } else {
            console.log("Not scheduling notifications because data is mock or empty.");
        }
    } catch (err: any) {
        setPrayerTimesError(err.message || "An unexpected error occurred.");
    } finally {
        setPrayerTimesLoading(false);
        if (isRefresh) setRefreshing(false);
    }
}, []);


  useFocusEffect(
    useCallback(() => {
        loadDataAndSchedule(false);
    }, [loadDataAndSchedule])
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // --- New useEffects for Qibla Compass ---
  useEffect(() => {
    let headingSubscription: Location.LocationSubscription | null = null;

    const startWatchingHeading = async () => {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status === 'granted') {
            headingSubscription = await Location.watchHeadingAsync(newHeading => {
                if (newHeading.trueHeading !== -1 && newHeading.trueHeading !== null) {
                    setHeading(newHeading.trueHeading);
                } else {
                    setHeading(newHeading.magHeading);
                }
            });
        }
    };

    if (isFocused && locationPermissionStatus) {
        startWatchingHeading();
    }

    return () => {
        if (headingSubscription) {
            headingSubscription.remove();
        }
    };
  }, [isFocused, locationPermissionStatus]);

  useEffect(() => {
    if (location) {
        const kaabaLat = 21.422487 * (Math.PI / 180);
        const kaabaLon = 39.826206 * (Math.PI / 180);
        const userLat = location.latitude * (Math.PI / 180);
        const userLon = location.longitude * (Math.PI / 180);

        const lonDiff = kaabaLon - userLon;

        const y = Math.sin(lonDiff) * Math.cos(kaabaLat);
        const x = Math.cos(userLat) * Math.sin(kaabaLat) - Math.sin(userLat) * Math.cos(kaabaLat) * Math.cos(lonDiff);
        
        let directionRad = Math.atan2(y, x);
        let directionDeg = directionRad * (180 / Math.PI);
        directionDeg = (directionDeg + 360) % 360;
        
        setQiblaDirection(directionDeg);
    }
  }, [location]);
  // ------------------------------------------

  useEffect(() => {
    if (prayerTimesData && prayerTimesData.length > 0) {
        const timezone = moment.tz.guess();
        const nowMoment = moment(currentTime).tz(timezone);
        
        let foundNext: PrayerType | null = null;

        for (const prayer of prayerTimesData) {
            if (!prayer.time || prayer.name === 'sunrise') continue; // Skip sunrise for "next prayer" display

            const prayerTimeMoment = moment.tz(prayer.time, 'h:mm A', timezone);
            // Ensure the prayer time is for today
            prayerTimeMoment.year(nowMoment.year()).month(nowMoment.month()).date(nowMoment.date());

            if (prayerTimeMoment.isAfter(nowMoment)) {
                foundNext = prayer;
                break;
            }
        }
        
        // If all prayers for today have passed, next prayer is Fajr of tomorrow
        if (!foundNext) {
            const fajrTomorrow = prayerTimesData.find(p => p.name === 'fajr');
            if (fajrTomorrow) {
                 // Create a new object for Fajr tomorrow to avoid mutating prayerTimesData
                foundNext = { ...fajrTomorrow, date: moment(nowMoment).add(1, 'day').tz(timezone).format('YYYY-MM-DD') };
            }
        }
        setNextPrayerDetails(foundNext);

      if (foundNext) {
        const targetPrayer = foundNext;
        const updateTimeRemaining = () => {
          const rightNowMoment = moment(new Date()).tz(timezone);
          const prayerDateTimeMoment = moment.tz(targetPrayer.time!, 'h:mm A', timezone);

          // Adjust date for targetPrayer
          if(targetPrayer.date && targetPrayer.date !== currentFormattedDate) { // Fajr of tomorrow case
            prayerDateTimeMoment.year(parseInt(targetPrayer.date.substring(0,4))).month(parseInt(targetPrayer.date.substring(5,7))-1).date(parseInt(targetPrayer.date.substring(8,10)));
          } else {
            prayerDateTimeMoment.year(rightNowMoment.year()).month(rightNowMoment.month()).date(rightNowMoment.date());
          }

          const diff = prayerDateTimeMoment.diff(rightNowMoment);

          if (diff < 0) {
             setTimeRemaining("00:00"); 
          } else {
            const duration = moment.duration(diff);
            const hoursRem = Math.floor(duration.asHours());
            const minsRem = duration.minutes();
            setTimeRemaining(`${hoursRem.toString().padStart(2, '0')}:${minsRem.toString().padStart(2, '0')}`);
          }
        };
        updateTimeRemaining(); 
        const timeRemainingInterval = setInterval(updateTimeRemaining, 60000); 
        return () => clearInterval(timeRemainingInterval);
      }
    }
  }, [prayerTimesData, currentTime, currentFormattedDate]);

  // FIX: This useEffect updates the tasbih target and mode when a new dhikr is selected.
  useEffect(() => {
    if (selectedDhikr) {
      const isTraditional = DHIKR_SEQUENCE.some(d => d.id === selectedDhikr.id);
      setTasbihTarget(selectedDhikr.count);
      setTasbihMode(isTraditional ? 'traditional' : 'target');
    }
  }, [selectedDhikr]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 800, easing: Easing.out(Easing.back(1.5)), useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 800, easing: Easing.out(Easing.cubic), useNativeDriver: true })
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true })
      ])
    ).start();
  }, [fadeAnim, scaleAnim, slideAnim, pulseAnim]);

  useEffect(() => {
    timeOpacity.setValue(0);
    Animated.timing(timeOpacity, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, [currentTime, timeOpacity]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadDataAndSchedule(true);
  }, [loadDataAndSchedule]);


  const formattedTime = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  const formattedGregorianDate = currentTime.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });

  const getHijriDate = () => {
    try {
      return new Intl.DateTimeFormat('ar-SA-u-ca-islamic', {day: 'numeric', month: 'long', year:'numeric'}).format(currentTime);
    } catch (e) {
      const hijriMonths = ["محرم", "صفر", "ربيع الأول", "ربيع الثاني", "جمادى الأولى", "جمادى الثانية", "رجب", "شعبان", "رمضان", "شوال", "ذو القعدة", "ذو الحجة"];
      const gYear = currentTime.getFullYear();
      const hijriYear = Math.round((gYear - 622) * 1.0307); 
      return `${currentTime.getDate()} ${hijriMonths[currentTime.getMonth()]} ${hijriYear} هـ (تقريبي)`;
    }
  };

  const handleToggleNotifications = () => {
     const newMasterState = !notificationSettings.masterEnabled;
     const updatedSettings = { ...notificationSettings, masterEnabled: newMasterState };
     setNotificationSettings(updatedSettings);
     if (prayerTimesData && prayerTimesData.length > 0) {
       schedulePrayerNotifications(prayerTimesData, updatedSettings);
     }
     console.log("Global notifications toggled to:", newMasterState);
  }

  // --- Tasbih Handlers (lifted up) ---
  const handleTasbihModeChange = () => {
    const modes: TasbihMode[] = ['traditional', 'target', 'free'];
    const currentIndex = modes.indexOf(tasbihMode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    
    setTasbihMode(nextMode);
    
    if (nextMode === 'traditional') {
      setTasbihTarget(33);
      setIsSettingTargetInModal(false);
    } else if (nextMode === 'target') {
      setTasbihTargetInput(tasbihTarget.toString());
      setIsSettingTargetInModal(true);
    } else { // free mode
      setIsSettingTargetInModal(false);
    }
  };

  const handleSetTasbihTarget = () => {
    const newTarget = parseInt(tasbihTargetInput || '33', 10);
    setTasbihTarget(newTarget > 0 ? newTarget : 33);
    setIsSettingTargetInModal(false);
  };

  const handleTasbihSettings = () => {
    Alert.alert(
      'إعدادات السبحة',
      'اختر الإعدادات المطلوبة',
      [
        { text: tasbihHapticEnabled ? 'إيقاف الاهتزاز' : 'تشغيل الاهتزاز', onPress: () => setTasbihHapticEnabled(!tasbihHapticEnabled) },
        { text: 'إغلاق', style: 'cancel' }
      ]
    );
  };

  const handleTasbihResetAll = () => {
    Alert.alert(
      'إعادة تعيين السبحة',
      'هل تريد إعادة تعيين العداد وإجمالي الجلسات إلى الصفر؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        { 
          text: 'إعادة تعيين الكل', 
          style: 'destructive',
          onPress: () => {
            setTasbihTotalSessions(0);
            setTasbihResetToken(Date.now()); // Trigger reset in child component
            if (tasbihHapticEnabled && Platform.OS !== 'web') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(err => console.log("Haptic error", err));
            }
          }
        }
      ]
    );
  };

  const handleTasbihSessionComplete = (dhikrName: string, count: number) => {
    if (count > 0) {
      logActivity('tasbih_set_completed', { dhikrName, count });
    }
    setTasbihTotalSessions(prev => prev + 1);

    const completedIndex = DHIKR_SEQUENCE.findIndex(d => d.id === selectedDhikr?.id);

    if (completedIndex !== -1 && completedIndex < DHIKR_SEQUENCE.length - 1) {
      setSelectedDhikr(DHIKR_SEQUENCE[completedIndex + 1]);
    } else {
      setSelectedDhikr(null);
      Alert.alert("تقبل الله", "لقد أتممت ورد التسبيح.");
    }
  };

  const getTasbihModeText = () => {
    switch (tasbihMode) {
      case 'free': return 'وضع حر';
      case 'target': return `هدف: ${tasbihTarget}`;
      case 'traditional': return 'تقليدي';
      default: return 'تقليدي';
    }
  };
  // --- End of Tasbih Handlers ---


  const displayPrayersList: DisplayPrayer[] = prayerTimesData
    ? prayerTimesData
        .map(p => ({
          id: p.name, 
          name: p.name,
          nameArabic: p.arabicName,
          time: p.time,
        }))
    : [];


  if (locationPermissionStatus === false) {
    return <LocationPermission onRequestPermission={requestLocationPermission} />;
  }

  if (prayerTimesLoading && locationPermissionStatus === null) {
      return <LoadingSpinner text="جاري التحقق من إذن الموقع..." style={{flex: 1, backgroundColor: Colors.backgroundDark}} color={Colors.secondary}/>;
  }
  
  return (
    <View style={styles.container}>
      <View style={StyleSheet.absoluteFillObject}>
        <View style={styles.topSection}>
            <Image source={IslamicPatternImg} style={styles.patternImage} resizeMode="cover" />
        </View>
        <View style={styles.bottomSection}>
            <Image source={MosqueSilhouetteImg} style={styles.mosqueImage} resizeMode="contain" />
        </View>
      </View>
      <AppHeader />
      <Animated.ScrollView
        style={[styles.scrollView, { opacity: fadeAnim }]}
        contentContainerStyle={[styles.scrollContent, {paddingBottom: insets.bottom + RFValue(140) }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.secondary]} tintColor={Colors.secondary} />}
      >
        <Animated.View style={[styles.clockContainer, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
          <View style={styles.timeRow}><OriginalClockIcon size={RFValue(24)} color={Colors.secondary} /><Animated.Text style={[styles.timeText, { opacity: timeOpacity }]}>{formattedTime}</Animated.Text></View>
          <View style={styles.dateRow}><CalendarIcon size={RFValue(20)} color={Colors.secondary} /><View style={styles.dateTextContainer}><Text style={styles.dateText}>{formattedGregorianDate}</Text><Text style={styles.hijriDateText}>{getHijriDate()}</Text></View></View>
        </Animated.View>

        <View style={styles.duaContainer}><RandomDua /></View>

        {prayerTimesLoading && !prayerTimesData && <LoadingSpinner text="جاري تحميل مواقيت الصلاة..." color={Colors.secondary} />}
        {prayerTimesError && <View style={styles.errorContainer}><Text style={styles.errorText}>{prayerTimesError}</Text></View>}

        {nextPrayerDetails && prayerTimesData && (
          <Animated.View style={[styles.nextPrayerContainer, { transform: [{ scale: pulseAnim }] }]}>
            <View style={styles.nextPrayerHeader}>
              <Text style={styles.nextPrayerLabel}>الصلاة القادمة</Text>
              <View style={styles.prayerNameContainer}><Text style={styles.prayerNameArabic}>{nextPrayerDetails.arabicName}</Text><Text style={styles.prayerNameEnglish}>{nextPrayerDetails.name}</Text></View>
            </View>
            <View style={styles.countdownRow}>
              <View style={styles.timeContainer}><Text style={styles.timeLabel}>وقت الصلاة</Text><Text style={styles.nextPrayerTimeText}>{nextPrayerDetails.time}</Text></View>
              <View style={styles.countdownContainer}><Text style={styles.countdownLabel}>المتبقي</Text><Text style={styles.countdownTime}>{timeRemaining || '--:--'}</Text></View>
            </View>
            <View style={[styles.cornerDecoration, styles.topLeft]}><Svg width={RFValue(20)} height={RFValue(20)}><Path d="M2,2 L8,2 Q10,2 10,4 L10,8" stroke={Colors.secondary} strokeWidth="1.5" fill="none" /></Svg></View>
            <View style={[styles.cornerDecoration, styles.topRight]}><Svg width={RFValue(20)} height={RFValue(20)}><Path d="M18,2 L12,2 Q10,2 10,4 L10,8" stroke={Colors.secondary} strokeWidth="1.5" fill="none" /></Svg></View>
            <View style={[styles.cornerDecoration, styles.bottomLeft]}><Svg width={RFValue(20)} height={RFValue(20)}><Path d="M2,18 L8,18 Q10,18 10,16 L10,12" stroke={Colors.secondary} strokeWidth="1.5" fill="none" /></Svg></View>
            <View style={[styles.cornerDecoration, styles.bottomRight]}><Svg width={RFValue(20)} height={RFValue(20)}><Path d="M18,18 L12,18 Q10,18 10,16 L10,12" stroke={Colors.secondary} strokeWidth="1.5" fill="none" /></Svg></View>
          </Animated.View>
        )}

        {displayPrayersList.length > 0 && (
            <Animated.View style={[styles.prayerListContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] }]}>
            {displayPrayersList.map((prayer, index) => (
                <Animated.View key={prayer.id} style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim.interpolate({ inputRange: [-50, 0], outputRange: [RFValue(50) * (index + 1), 0] }) }] }}>
                <PrayerCard prayer={prayer} isNext={nextPrayerDetails ? prayer.id.toLowerCase() === nextPrayerDetails.name.toLowerCase() : false} remainingTime={nextPrayerDetails && prayer.id.toLowerCase() === nextPrayerDetails.name.toLowerCase() ? timeRemaining : undefined} />
                </Animated.View>
            ))}
            {lastPrayerTimesUpdate && <Text style={styles.lastUpdated}>آخر تحديث: {lastPrayerTimesUpdate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>}
            </Animated.View>
        )}
        
        <Animated.View style={[styles.tasbihOuterContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] }]}>
          <View style={[styles.tasbihGradient, {backgroundColor: `rgba(${parseInt(Colors.primary.slice(1,3),16)}, ${parseInt(Colors.primary.slice(3,5),16)}, ${parseInt(Colors.primary.slice(5,7),16)}, 0.95)`}]}>
            <View style={styles.tasbihHeader}><OriginalSparklesIcon size={RFValue(24)} color={Colors.secondary} /><Text style={styles.tasbihTitle}>السبحة الإلكترونية</Text><OriginalSparklesIcon size={RFValue(24)} color={Colors.secondary} /></View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dhikrScrollViewContent} style={styles.dhikrButtonsContainer}>
              {DHIKR_SEQUENCE.map((dhikr, index) => (
                <TouchableOpacity key={dhikr.id} style={[styles.dhikrButton, { width: DHIKR_BUTTON_WIDTH }]} onPress={() => setSelectedDhikr(dhikr)} activeOpacity={0.8}>
                  <View style={[styles.dhikrButtonGradient, {backgroundColor: Colors.secondaryLight}]}>
                    <Text style={styles.dhikrButtonText}>{dhikr.text}</Text><Text style={styles.dhikrCountText}>{dhikr.count}×</Text>
                  </View>
                </TouchableOpacity>
              ))}
               <TouchableOpacity key="more" style={[styles.dhikrButton, styles.moreDhikrButton, { width: DHIKR_BUTTON_WIDTH }]} onPress={() => setIsMoreTasbihVisible(true)} activeOpacity={0.8}>
                  <View style={styles.dhikrButtonGradient}>
                      <Text style={styles.dhikrButtonText}>تسبيحات أخرى</Text>
                  </View>
              </TouchableOpacity>
            </ScrollView>
            <View style={styles.tasbihDecoration}><Svg width={100} height={20}><Path d="M10,10 L40,10 M60,10 L90,10" stroke={Colors.secondary} strokeWidth="1" strokeLinecap="round"/><Circle cx="50" cy="10" r="3" fill={Colors.secondary} fillOpacity={0.8}/></Svg></View>
          </View>
        </Animated.View>

        <Animated.View style={[styles.qiblaOuterContainer, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
            <QiblaCompass heading={heading} qiblaDirection={qiblaDirection} />
        </Animated.View>
        
      </Animated.ScrollView>

      <RNModal
        visible={!!selectedDhikr}
        animationType="slide"
        onRequestClose={() => {
            setSelectedDhikr(null);
            setIsSettingTargetInModal(false);
        }}
      >
        <LinearGradient
            colors={[Colors.primaryDark, Colors.primary, Colors.spiritualBlue]}
            style={styles.modalGradientBackground}
        >
          {isSettingTargetInModal ? (
            <View style={styles.targetInputView}>
              <View style={styles.targetInputCard}>
                <Text style={styles.modalTitle}>تحديد الهدف</Text>
                <TextInput
                  style={styles.targetTextInput}
                  placeholder="أدخل عدد التسبيحات"
                  keyboardType="number-pad"
                  value={tasbihTargetInput}
                  onChangeText={setTasbihTargetInput}
                  autoFocus={true}
                  placeholderTextColor={Colors.textLight}
                />
                <View style={styles.targetButtonsRow}>
                  <TouchableOpacity style={styles.targetCancelButton} onPress={() => setIsSettingTargetInModal(false)}>
                    <Text style={styles.targetCancelButtonText}>إلغاء</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.targetSubmitButton} onPress={handleSetTasbihTarget}>
                    <Text style={styles.targetSubmitButtonText}>ضبط</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ) : (
            <>
              <IslamicPattern 
                  style={StyleSheet.absoluteFill} 
                  color="rgba(255, 255, 255, 0.05)" 
                  variant="geometric" 
              />
              <TouchableOpacity style={[styles.modalCloseButton, { top: insets.top + RFValue(10) }]} onPress={() => setSelectedDhikr(null)}>
                  <CloseIcon color={Colors.white} size={30} />
              </TouchableOpacity>

               <View style={[styles.tasbihModalHeaderContainer, { paddingTop: insets.top + RFValue(20) }]}>
                  <Text style={styles.tasbihModalTitle}>السبحة الإلكترونية</Text>
                  
                  <View style={styles.tasbihControlsContainer}>
                      <TouchableOpacity style={styles.tasbihControlButton} onPress={handleTasbihSettings}>
                          <SettingsIcon color={Colors.white} size={RFValue(20)} />
                      </TouchableOpacity>
                      <View style={styles.tasbihControlButton}>
                          <Text style={styles.tasbihControlText}>الجلسات: {tasbihTotalSessions}</Text>
                      </View>
                      <TouchableOpacity style={styles.tasbihControlButton} onPress={handleTasbihModeChange}>
                          <Text style={styles.tasbihControlText}>{getTasbihModeText()}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.tasbihControlButton} onPress={handleTasbihResetAll}>
                          <RotateCcwIcon color={Colors.white} size={RFValue(18)} />
                      </TouchableOpacity>
                  </View>

                  {selectedDhikr && DHIKR_SEQUENCE.some(d => d.id === selectedDhikr.id) && (
                    <View style={styles.dhikrSelectorContainer}>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dhikrSelectorScrollView}>
                        {DHIKR_SEQUENCE.map((dhikr) => (
                          <TouchableOpacity
                            key={dhikr.id}
                            style={[styles.dhikrSelectorButton, selectedDhikr?.id === dhikr.id && styles.dhikrSelectorButtonActive]}
                            onPress={() => setSelectedDhikr(dhikr)}
                          >
                            <Text style={[styles.dhikrSelectorText, selectedDhikr?.id === dhikr.id && styles.dhikrSelectorTextActive]}>
                              {dhikr.text}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
              </View>

              <View style={styles.modalContent}>
                {selectedDhikr && (
                  <DigitalTasbih 
                      key={`${selectedDhikr.id}-${tasbihResetToken}`} // Use a key to force re-mount on change or reset
                      mode={tasbihMode}
                      target={tasbihTarget}
                      hapticEnabled={tasbihHapticEnabled}
                      dhikrText={selectedDhikr.text}
                      fadl={selectedDhikr.fadl}
                      onSessionComplete={handleTasbihSessionComplete}
                      resetToken={tasbihResetToken}
                  />
                )}
              </View>
            </>
          )}
        </LinearGradient>
      </RNModal>
      
      <RNModal
        transparent={true}
        visible={isMoreTasbihVisible}
        onRequestClose={() => setIsMoreTasbihVisible(false)}
        animationType="fade"
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsMoreTasbihVisible(false)}
        >
          <TouchableOpacity 
              style={styles.moreTasbihModalContainer} 
              activeOpacity={1} 
              onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>تسبيحات وأذكار إضافية</Text>
              <TouchableOpacity onPress={() => setIsMoreTasbihVisible(false)} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>&times;</Text>
              </TouchableOpacity>
            </View>
            <FlatList
                data={ADDITIONAL_TASBIH_OPTIONS}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                    <TouchableOpacity 
                        style={styles.moreTasbihItem} 
                        onPress={() => {
                            setIsMoreTasbihVisible(false);
                            setSelectedDhikr(item);
                        }}
                    >
                        <Text style={styles.moreTasbihText}>{item.text}</Text>
                        <Text style={styles.moreTasbihCount}>{item.count} مرة</Text>
                    </TouchableOpacity>
                )}
            />
          </TouchableOpacity>
        </TouchableOpacity>
      </RNModal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.backgroundDark },
  topSection: { position: 'absolute', top: 0, left: 0, right: 0, height: '30%', overflow: 'hidden' },
  bottomSection: { position: 'absolute', top: '30%', left: 0, right: 0, height: '70%', overflow: 'hidden' },
  patternImage: { width: '100%', height: '100%', opacity: 0.15 },
  mosqueImage: { width: '100%', height: '100%', opacity: 0.1 },
  scrollView: { flex: 1, backgroundColor: 'transparent' },
  scrollContent: { paddingBottom: RFValue(140) }, 
  headerContainer: { paddingVertical: RFValue(24), paddingHorizontal: RFValue(20), marginBottom: RFValue(16), borderBottomLeftRadius: RFValue(30), borderBottomRightRadius: RFValue(30), borderBottomWidth: 1, borderBottomColor: Colors.divider },
  header: { alignItems: 'center', position: 'relative' },
  headerDecoration: { marginTop: RFValue(16), alignItems: 'center' },
  title: { fontSize: RFValue(36), fontWeight: '700', color: Colors.secondary, textAlign: 'center', textShadowColor: 'rgba(0, 0, 0, 0.5)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 4, fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium', },
  titleEnglish: { fontSize: RFValue(20), fontWeight: '500', color: Colors.white, textAlign: 'center', marginTop: RFValue(8), opacity: 1, fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif', },
  notificationButton: { position: 'absolute', right: 0, top: 0, borderRadius: RFValue(25), overflow: 'hidden' },
  notificationGradient: { width: RFValue(50), height: RFValue(50), justifyContent: 'center', alignItems: 'center' },
  clockContainer: { margin: RFValue(16), marginTop: 0, borderRadius: RFValue(20), padding: RFValue(24), borderWidth: 1.5, borderColor: Colors.divider, backgroundColor: `rgba(${parseInt(Colors.primary.slice(1,3),16)}, ${parseInt(Colors.primary.slice(3,5),16)}, ${parseInt(Colors.primary.slice(5,7),16)}, 0.9)`, shadowColor: Colors.secondary, shadowOffset: { width: 0, height: RFValue(4) }, shadowOpacity: 0.2, shadowRadius: RFValue(12), elevation: 8 },
  timeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: RFValue(16) },
  timeText: { fontSize: RFValue(40), fontWeight: '700', color: Colors.white, marginLeft: RFValue(16), textShadowColor: 'rgba(0, 0, 0, 0.4)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 3, fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-bold', },
  dateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  dateTextContainer: { marginLeft: RFValue(12), alignItems: 'center' },
  dateText: { fontSize: RFValue(18), color: Colors.white, fontWeight: '500', fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium', },
  hijriDateText: { fontSize: RFValue(16), color: Colors.secondary, marginTop: RFValue(4), fontWeight: '600', fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium', },
  nextPrayerContainer: { margin: RFValue(16), marginTop: RFValue(8), borderRadius: RFValue(24), padding: RFValue(28), borderWidth: 1.5, borderColor: Colors.secondary, backgroundColor: `rgba(${parseInt(Colors.primary.slice(1,3),16)}, ${parseInt(Colors.primary.slice(3,5),16)}, ${parseInt(Colors.primary.slice(5,7),16)}, 0.95)`, shadowColor: Colors.secondary, shadowOffset: { width: 0, height: RFValue(6) }, shadowOpacity: 0.25, shadowRadius: RFValue(12), elevation: 10, position: 'relative' },
  nextPrayerHeader: { alignItems: 'center', marginBottom: RFValue(20) },
  nextPrayerLabel: { fontSize: RFValue(22), color: Colors.secondary, fontWeight: '700', marginBottom: RFValue(12), textShadowColor: 'rgba(0, 0, 0, 0.3)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 2, fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-bold', },
  prayerNameContainer: { alignItems: 'center' },
  prayerNameArabic: { fontSize: RFValue(28), fontWeight: '700', color: Colors.white, marginBottom: RFValue(6), textShadowColor: 'rgba(0, 0, 0, 0.4)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 3, fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-bold', },
  prayerNameEnglish: { fontSize: RFValue(16), color: Colors.white, opacity: 0.9, fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif', },
  countdownRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  timeContainer: { alignItems: 'center' },
  timeLabel: { fontSize: RFValue(14), color: Colors.secondary, fontWeight: '600', marginBottom: RFValue(4), fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium', },
  nextPrayerTimeText: { fontSize: RFValue(28), fontWeight: '700', color: Colors.white, textShadowColor: 'rgba(0, 0, 0, 0.2)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 2, fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-bold', },
  countdownContainer: { alignItems: 'center', backgroundColor: `rgba(${parseInt(Colors.secondary.slice(1,3),16)}, ${parseInt(Colors.secondary.slice(3,5),16)}, ${parseInt(Colors.secondary.slice(5,7),16)}, 0.3)`, paddingVertical: RFValue(12), paddingHorizontal: RFValue(24), borderRadius: RFValue(16), borderWidth: 1.5, borderColor: `rgba(${parseInt(Colors.secondary.slice(1,3),16)}, ${parseInt(Colors.secondary.slice(3,5),16)}, ${parseInt(Colors.secondary.slice(5,7),16)}, 0.5)` },
  countdownLabel: { fontSize: RFValue(14), color: Colors.white, fontWeight: '600', marginBottom: RFValue(4), fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium', },
  countdownTime: { fontSize: RFValue(28), fontWeight: '700', color: Colors.secondary, textShadowColor: 'rgba(0, 0, 0, 0.2)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 2, fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-bold', },
  cornerDecoration: { position: 'absolute', width: RFValue(20), height: RFValue(20) },
  topLeft: { top: RFValue(8), left: RFValue(8) }, topRight: { top: RFValue(8), right: RFValue(8), transform: [{ scaleX: -1 }] },
  bottomLeft: { bottom: RFValue(8), left: RFValue(8), transform: [{ scaleY: -1 }] }, bottomRight: { bottom: RFValue(8), right: RFValue(8), transform: [{ scale: -1 }] },
  errorContainer: { margin: RFValue(16), padding: RFValue(24), backgroundColor: `rgba(${parseInt(Colors.error.slice(1,3),16)}, ${parseInt(Colors.error.slice(3,5),16)}, ${parseInt(Colors.error.slice(5,7),16)}, 0.1)`, borderRadius: RFValue(16), borderWidth: 1, borderColor: `rgba(${parseInt(Colors.error.slice(1,3),16)}, ${parseInt(Colors.error.slice(3,5),16)}, ${parseInt(Colors.error.slice(5,7),16)}, 0.2)`, alignItems: 'center' },
  errorText: { fontSize: RFValue(16), color: Colors.error, textAlign: 'center', marginBottom: 0, fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif', }, 
  prayerListContainer: { marginTop: RFValue(16), paddingHorizontal:0, backgroundColor: `rgba(${parseInt(Colors.primary.slice(1,3),16)}, ${parseInt(Colors.primary.slice(3,5),16)}, ${parseInt(Colors.primary.slice(5,7),16)}, 0.8)`, borderRadius: RFValue(24), padding: RFValue(16), borderWidth: 1, borderColor: Colors.divider },
  lastUpdated: { fontSize: RFValue(12), color: Colors.textLight, textAlign: 'center', marginTop: RFValue(16), marginBottom: RFValue(8), opacity: 0.8, fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif', },
  duaContainer: { marginHorizontal: RFValue(16), marginVertical: RFValue(8), zIndex: 2 },
  qiblaOuterContainer: { marginHorizontal: RFValue(15), marginVertical: RFValue(10) },
  tasbihOuterContainer: { marginHorizontal: RFValue(15), marginVertical: RFValue(10), borderRadius: RFValue(24), overflow: 'hidden', elevation: 8, shadowColor: Colors.secondary, shadowOffset: { width: 0, height: RFValue(4) }, shadowOpacity: 0.3, shadowRadius: RFValue(12) },
  tasbihGradient: { padding: RFValue(15), borderWidth: 1.5, borderColor: Colors.divider, borderRadius: RFValue(24) },
  tasbihHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: RFValue(15) },
  tasbihTitle: { fontSize: RFValue(22), fontWeight: '700', color: Colors.secondary, marginHorizontal: RFValue(12), textShadowColor: 'rgba(0, 0, 0, 0.3)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 2, fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-bold', },
  dhikrButtonsContainer: { height: RFValue(100), marginBottom: RFValue(16) },
  dhikrScrollViewContent: { alignItems: 'center', paddingHorizontal: RFValue(10) },
  dhikrButton: { height: RFValue(80), marginHorizontal: RFValue(5), borderRadius: RFValue(16), overflow: 'hidden', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4 },
  moreDhikrButton: { backgroundColor: Colors.primaryLight },
  dhikrButtonGradient: { flex: 1, paddingVertical: RFValue(16), paddingHorizontal: RFValue(12), alignItems: 'center', justifyContent: 'center' },
  dhikrButtonText: { fontSize: RFValue(16), fontWeight: '700', color: Colors.primary, textAlign: 'center', marginBottom: RFValue(4), fontFamily: Platform.OS === 'ios' ? 'System': 'sans-serif', }, 
  dhikrCountText: { fontSize: RFValue(12), fontWeight: '600', color: Colors.primary, opacity: 0.9, fontFamily: Platform.OS === 'ios' ? 'System': 'sans-serif', }, 
  tasbihDecoration: { alignItems: 'center', marginTop: RFValue(8) },
  modalGradientBackground: { flex: 1 },
  modalContent: { flex: 1, backgroundColor: 'transparent', justifyContent: 'center' },
  modalCloseButton: { position: 'absolute', left: RFValue(20), padding: RFValue(10), zIndex: 10, backgroundColor: 'rgba(255, 255, 255, 0.2)', borderRadius: RFValue(25), },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center', padding: RFValue(20), },
  moreTasbihModalContainer: { width: '100%', maxHeight: '80%', backgroundColor: Colors.background, borderRadius: RFValue(10), shadowColor: '#000', shadowOffset: { width: 0, height: 2, }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5, },
  moreTasbihItem: { paddingVertical: RFValue(15), paddingHorizontal: RFValue(20), borderBottomWidth: 1, borderBottomColor: Colors.divider, },
  moreTasbihText: { fontSize: RFValue(16), color: Colors.text, textAlign: 'right', fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium', marginBottom: RFValue(4), },
  moreTasbihCount: { fontSize: RFValue(14), color: Colors.accent, textAlign: 'right', },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: RFValue(15), borderBottomWidth: 1, borderBottomColor: Colors.divider, position: 'relative' },
  modalTitle: { fontSize: RFValue(18), fontWeight: 'bold', color: Colors.primary, fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium', },
  closeButton: { position: 'absolute', top: RFValue(5), right: RFValue(10), padding: RFValue(10), },
  closeButtonText: { fontSize: RFValue(28), color: Colors.primary, fontWeight: 'bold', },
  tasbihModalHeaderContainer: { alignItems: 'center', paddingHorizontal: RFValue(20), },
  tasbihModalTitle: { fontSize: RFValue(28), fontWeight: 'bold', color: Colors.secondary, marginBottom: RFValue(15), textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 3 },
  tasbihControlsContainer: { flexDirection: 'row-reverse', justifyContent: 'space-around', alignItems: 'center', width: '100%', paddingVertical: RFValue(10), backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: RFValue(15), marginBottom: RFValue(15), },
  tasbihControlButton: { paddingHorizontal: RFValue(12), paddingVertical: RFValue(8), alignItems: 'center', justifyContent: 'center' },
  tasbihControlText: { color: Colors.white, fontSize: RFValue(14), fontWeight: '600' },
  dhikrSelectorContainer: { width: '100%', paddingVertical: RFValue(10), },
  dhikrSelectorScrollView: { paddingHorizontal: RFValue(10), alignItems: 'center', },
  dhikrSelectorButton: { paddingVertical: RFValue(10), paddingHorizontal: RFValue(20), borderRadius: RFValue(20), marginHorizontal: RFValue(5), backgroundColor: 'rgba(255, 255, 255, 0.15)', borderWidth: 1.5, borderColor: 'transparent', justifyContent: 'center', alignItems: 'center' },
  dhikrSelectorButtonActive: { backgroundColor: Colors.secondary, borderColor: Colors.white, shadowColor: Colors.white, shadowRadius: 5, shadowOpacity: 0.5, },
  dhikrSelectorText: { color: Colors.white, fontSize: RFValue(15), fontWeight: '600', fontFamily: Platform.OS === 'ios' ? 'System': 'sans-serif-medium', },
  dhikrSelectorTextActive: { color: Colors.primary, },
  targetInputView: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: RFValue(20) },
  targetInputCard: { width: '90%', maxWidth: 340, backgroundColor: Colors.background, borderRadius: RFValue(15), padding: RFValue(25), alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5, },
  targetTextInput: { width: '100%', borderWidth: 1, borderColor: Colors.divider, backgroundColor: Colors.white, padding: RFValue(15), borderRadius: RFValue(10), fontSize: RFValue(18), textAlign: 'center', marginBottom: RFValue(20), color: Colors.primary },
  targetButtonsRow: { flexDirection: 'row-reverse', justifyContent: 'space-around', width: '100%', marginTop: RFValue(20), },
  targetSubmitButton: { backgroundColor: Colors.primary, paddingVertical: RFValue(12), paddingHorizontal: RFValue(30), borderRadius: RFValue(10), },
  targetSubmitButtonText: { color: Colors.white, fontSize: RFValue(16), fontWeight: 'bold' },
  targetCancelButton: { paddingVertical: RFValue(12), paddingHorizontal: RFValue(30), borderRadius: RFValue(10), },
  targetCancelButtonText: { color: Colors.accent, fontSize: RFValue(16), fontWeight: 'bold', },
});
