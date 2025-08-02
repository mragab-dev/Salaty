

import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ImageBackground, Platform, Linking } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { Prayer, PrayerTimes } from '../types'; 
import { getDeviceLocationAndPrayerTimesForHome as getDeviceLocationAndPrayerTimes } from '../services/prayerTimeService'; 
import LoadingSpinner from '../components/LoadingSpinner';
import { ClockIcon, BookOpenIcon, SparklesIcon, IconProps } from '../components/Icons'; 
import { HOME_BACKGROUND_IMAGE_URI } from '../constants'; 
import Colors from '../constants/colors';
import moment from 'moment-timezone';


// Define ParamList for type safety with useNavigation
type RootStackParamList = {
  QuranTab: undefined; 
  PrayerTimesTab: undefined;
  AdhkarTab: undefined;
  // Add other routes here
};


const HomeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [loadingPrayerTimes, setLoadingPrayerTimes] = useState(true);

  useEffect(() => {
    const fetchTimes = async () => {
      setLoadingPrayerTimes(true);
      const { prayerTimes: times, error } = await getDeviceLocationAndPrayerTimes();
      setPrayerTimes(times);
      if (error) setLocationError(error);
      setLoadingPrayerTimes(false);
    };
    fetchTimes();
  }, []);

  const nextPrayer = useMemo((): Prayer | null => {
    if (!prayerTimes) return null;
    const timezone = moment.tz.guess();
    const nowMoment = moment.tz(timezone);

    const prayers: Prayer[] = [
      { name: 'Fajr', time: prayerTimes.fajr, arabicName: 'الفجر' },
      { name: 'Dhuhr', time: prayerTimes.dhuhr, arabicName: 'الظهر' },
      { name: 'Asr', time: prayerTimes.asr, arabicName: 'العصر' },
      { name: 'Maghrib', time: prayerTimes.maghrib, arabicName: 'المغرب' },
      { name: 'Isha', time: prayerTimes.isha, arabicName: 'العشاء' },
    ];

    for (const prayer of prayers) {
      // The format must match what prayerTimeService produces
      const prayerTimeMoment = moment.tz(prayer.time, 'hh:mm A', timezone);
      // Ensure the prayer time is for today for comparison
      prayerTimeMoment.year(nowMoment.year()).month(nowMoment.month()).date(nowMoment.date());

      if (prayerTimeMoment.isAfter(nowMoment)) {
        return prayer;
      }
    }

    // If all prayers have passed, the next prayer is Fajr tomorrow
    return { name: 'Fajr', time: prayerTimes.fajr, arabicName: 'الفجر (الغد)' };
  }, [prayerTimes]);

  const FeatureCard: React.FC<{ title: string; description: string; navigateTo: keyof RootStackParamList; icon: React.ReactElement<IconProps>; bgColor?: string; textColor?: string }> = 
  ({ title, description, navigateTo, icon, bgColor = Colors.primary, textColor = Colors.secondary }) => (
    <TouchableOpacity 
        onPress={() => navigation.navigate(navigateTo as any)} 
        style={[styles.featureCardBase, { backgroundColor: bgColor }]}
    >
      <View style={styles.featureCardHeader}>
        <View style={[styles.featureCardIconContainer, { backgroundColor: 'rgba(255,255,255,0.2)'}]}>
          {React.cloneElement(icon, { color: textColor, width: 28, height: 28 })}
        </View>
        <Text style={[styles.featureCardTitle, { color: textColor }]}>{title}</Text>
      </View>
      <Text style={[styles.featureCardDescription, { color: textColor === Colors.secondary ? Colors.moonlight : Colors.text }]}>{description}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <ImageBackground 
        source={{ uri: HOME_BACKGROUND_IMAGE_URI }} 
        style={styles.heroSection}
        imageStyle={styles.heroBackgroundImage} 
        resizeMode="cover"
      >
        <View style={styles.heroOverlay}>
          <Text style={styles.heroTitle}>مرحباً بك في صلاتي</Text>
          <Text style={styles.heroSubtitle}>رفيقك اليومي للعبادة والذكر.</Text>
          {loadingPrayerTimes ? <LoadingSpinner text="جاري تحميل مواقيت الصلاة..." color={Colors.white} style={{marginTop: 10}}/> : 
          nextPrayer && prayerTimes && (
            <View style={styles.nextPrayerContainer}>
              <Text style={styles.nextPrayerText}>الصلاة القادمة: {nextPrayer.arabicName}</Text>
              <Text style={styles.nextPrayerTime}>{nextPrayer.time}</Text> 
              <Text style={styles.nextPrayerDate}>التاريخ: {prayerTimes.date}</Text>
            </View>
          )}
          {locationError && <Text style={styles.locationErrorText}>خطأ: {locationError}. يتم عرض مواقيت تقديرية.</Text>}
        </View>
      </ImageBackground>

      <View style={styles.featuresGrid}>
        <FeatureCard 
          title="القرآن الكريم" 
          description="تصفح واستمع إلى آيات القرآن الكريم مع التفسير." 
          navigateTo="QuranTab"
          icon={<BookOpenIcon />} 
        />
        <FeatureCard 
          title="مواقيت الصلاة" 
          description="اطلع على مواقيت الصلاة الدقيقة لمنطقتك واتجاه القبلة." 
          navigateTo="PrayerTimesTab"
          icon={<ClockIcon />}
          bgColor={Colors.accent} 
          textColor={Colors.background} 
        />
        <FeatureCard 
          title="الأذكار والأدعية" 
          description="حصنك اليومي من الأذكار وأدعية مختارة." 
          navigateTo="AdhkarTab"
          icon={<SparklesIcon />}
          bgColor={Colors.spiritualBlue} 
          textColor={Colors.secondary} 
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background, 
  },
  contentContainer: {
    paddingBottom: 20,
  },
  heroSection: {
    padding: 20, 
    minHeight: 250, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 20,
  },
  heroBackgroundImage: {
    // borderRadius: 12, 
  },
  heroOverlay: {
    backgroundColor: `rgba(${parseInt(Colors.primary.slice(1,3),16)}, ${parseInt(Colors.primary.slice(3,5),16)}, ${parseInt(Colors.primary.slice(5,7),16)}, 0.85)`, // primary with opacity
    padding: 20,
    borderRadius: 12,
    alignItems: 'center', 
    width: '100%', 
  },
  heroTitle: {
    fontSize: 28, 
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  },
  heroSubtitle: {
    fontSize: 18,
    color: Colors.moonlight, 
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  nextPrayerContainer: {
    marginTop: 10,
    backgroundColor: 'rgba(240, 240, 240, 0.2)', // Colors.moonlight with opacity
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  nextPrayerText: {
    fontSize: 18,
    color: Colors.white,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  nextPrayerTime: {
    fontSize: 26,
    fontWeight: 'bold',
    color: Colors.white,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-bold',
  },
  nextPrayerDate: {
    fontSize: 12,
    color: Colors.moonlight,
    marginTop: 2,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  locationErrorText: {
    fontSize: 13,
    color: `rgba(${parseInt(Colors.error.slice(1,3),16)}, ${parseInt(Colors.error.slice(3,5),16)}, ${parseInt(Colors.error.slice(5,7),16)}, 0.7)`, // Lighter error
    marginTop: 8,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  featuresGrid: {
    marginHorizontal: 16,
    marginTop: 20, 
  },
  featureCardBase: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  featureCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureCardIconContainer: {
    padding: 8,
    borderRadius: 100, 
    marginRight: 12, 
  },
  featureCardTitle: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  },
  featureCardDescription: {
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    lineHeight: 20,
  },
});

export default HomeScreen;