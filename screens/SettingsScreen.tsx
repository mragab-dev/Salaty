import React, { useState, useEffect } from 'react';
import { View, Text, Linking , StyleSheet, ScrollView, Switch, TouchableOpacity, Platform, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import { useIsFocused, useNavigation, NavigationProp } from '@react-navigation/native';
import { PlayIcon, StopCircleIcon, InformationCircleIcon, BellIcon, CogIcon } from '../components/Icons'; 
import { NotificationSettings, AdhanSound, PrayerNotificationSettings, AdhanSoundOption } from '../types';
import { ADHAN_SOUND_OPTIONS, DEFAULT_NOTIFICATION_SETTINGS, ASYNC_STORAGE_NOTIFICATION_SETTINGS_KEY, PRE_NOTIFICATION_OFFSET_OPTIONS } from '../constants';
import Colors from '../constants/colors';
import LoadingSpinner from '../components/LoadingSpinner';
import { AppStackParamList } from '../App';
import adhanMakkiSound from '../assets/sounds/adhan_makki.mp3';
import adhanKurdiSound from '../assets/sounds/adhan_kurdi.mp3';
import { RFValue } from 'react-native-responsive-fontsize';
import AppHeader from '../components/AppHeader';
import { 
  reinitializeNotificationChannels,
  rescheduleNotifications,
  testAdhanSound,
  getDetailedNotificationDiagnostics,
  runNotificationSystemTest
} from '../services/notificationService';


const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<AppStackParamList>>();
  const isFocused = useIsFocused();
  
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(true);

  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [playingSoundId, setPlayingSoundId] = useState<AdhanSound | null>(null);
  const [isLoadingSound, setIsLoadingSound] = useState(false);

  useEffect(() => {
    const cleanupSound = async () => {
      if (sound) {
        await sound.unloadAsync();
        setSound(null);
        setPlayingSoundId(null);
        setIsLoadingSound(false);
      }
    };
  
    if (!isFocused) {
      cleanupSound();
    }
  
    return () => {
      cleanupSound();
    };
  }, [isFocused, sound]);


  const handlePlaySound = async (soundOption: AdhanSoundOption) => {
    if (playingSoundId === soundOption.id && sound) {
      await sound.stopAsync();
      setPlayingSoundId(null);
      return;
    }

    if (sound) {
        await sound.unloadAsync();
        setSound(null);
        setPlayingSoundId(null);
    }
    
    if (!soundOption.fileName) {
        Alert.alert("صوت افتراضي", "هذا هو صوت الإشعار الافتراضي لجهازك ولا يمكن تجربته هنا.");
        return;
    }
    
    setIsLoadingSound(true);

    try {
        const soundFiles = {
            'adhan_makki.mp3': adhanMakkiSound,
            'adhan_kurdi.mp3': adhanKurdiSound,
        };
        const source = soundFiles[soundOption.fileName as keyof typeof soundFiles];
        if (!source) throw new Error('Sound file not found.');

        const { sound: newSound } = await Audio.Sound.createAsync(source, { shouldPlay: true });
        setSound(newSound);
        setPlayingSoundId(soundOption.id);

        newSound.setOnPlaybackStatusUpdate(async (status) => {
            if (status.isLoaded && status.didJustFinish) {
                setPlayingSoundId(null);
                await newSound.unloadAsync();
                setSound(null);
            } else if (!status.isLoaded && (status as any).error) {
                 setPlayingSoundId(null);
                 setSound(null);
            }
        });

    } catch (error) {
        Alert.alert("خطأ", "لم نتمكن من تشغيل الصوت.");
        setPlayingSoundId(null);
    } finally {
        setIsLoadingSound(false);
    }
};

  useEffect(() => {
    const loadSettings = async () => {
      setLoadingSettings(true);
      try {
        const storedSettings = await AsyncStorage.getItem(ASYNC_STORAGE_NOTIFICATION_SETTINGS_KEY);
        setNotificationSettings(storedSettings ? JSON.parse(storedSettings) : DEFAULT_NOTIFICATION_SETTINGS);
      } catch (e) {
        setNotificationSettings(DEFAULT_NOTIFICATION_SETTINGS);
      } finally {
        setLoadingSettings(false);
      }
    };
    loadSettings();
  }, []);

  const saveSettings = async (newSettings: NotificationSettings) => {
    try {
      const oldSound = notificationSettings?.sound;
      setNotificationSettings(newSettings);
      await AsyncStorage.setItem(ASYNC_STORAGE_NOTIFICATION_SETTINGS_KEY, JSON.stringify(newSettings));
      
      if (Platform.OS === 'android' && oldSound !== newSettings.sound) {
        console.log("Adhan sound changed, re-initializing channels and rescheduling...");
        await reinitializeNotificationChannels();
      }
      
      await rescheduleNotifications();
      
    } catch (e) {
      console.error("Failed to save notification settings:", e);
      Alert.alert("خطأ", "لم نتمكن من حفظ الإعدادات.");
    }
  };
  
  const handleToggle = (key: keyof NotificationSettings, value: boolean) => {
    if (notificationSettings) {
        const newSettings = { ...notificationSettings, [key]: value };
        saveSettings(newSettings);
    }
  };

  const handlePrayerToggle = (prayer: keyof PrayerNotificationSettings, value: boolean) => {
    if (notificationSettings) {
      const newSettings = {
        ...notificationSettings,
        prayers: { ...notificationSettings.prayers, [prayer]: value },
      };
      saveSettings(newSettings);
    }
  };

  const handleAdhanSoundSelect = async (soundId: AdhanSound) => {
    if (notificationSettings) {
      if (sound) {
        await sound.unloadAsync();
        setSound(null);
        setPlayingSoundId(null);
      }
      const newSettings = { ...notificationSettings, sound: soundId };
      saveSettings(newSettings);
    }
  };
  
  const handlePreNotificationOffsetSelect = (offset: number) => {
    if (notificationSettings) {
        const newSettings = { ...notificationSettings, preNotificationOffset: offset };
        saveSettings(newSettings);
    }
  };

  const handleDiagnostics = async () => {
    const report = await getDetailedNotificationDiagnostics();
    Alert.alert('تقرير التشخيص المفصل', report, [{ text: "حسنًا" }]);
  };

  const handleSystemTest = async () => {
    const success = await runNotificationSystemTest();
    Alert.alert(
      success ? 'نجح الاختبار' : 'فشل الاختبار',
      success ? 'النظام يعمل بشكل سليم وسيظهر إشعار تجريبي خلال ثوانٍ.' : 'يوجد مشكلة في النظام. حاول إعادة ضبط القنوات.'
    );
  };

  const handleReinitializeChannels = () => {
    Alert.alert(
      "إعادة ضبط القنوات",
      "سيؤدي هذا إلى حذف وإعادة إنشاء قنوات الإشعارات (لأجهزة أندرويد). قد يساعد هذا في حل مشاكل الصوت أو عدم ظهور الإشعارات. هل تريد المتابعة؟",
      [
        { text: "إلغاء", style: "cancel" },
        { 
          text: "إعادة الضبط", 
          style: "destructive", 
          onPress: async () => {
            await reinitializeNotificationChannels();
            await rescheduleNotifications(); 
            Alert.alert("اكتمل", "تمت إعادة ضبط قنوات الإشعارات بنجاح. تم تحديث جدول الصلاة.");
          } 
        }
      ]
    );
  };

  const prayerNamesMap: { [key in keyof PrayerNotificationSettings]: string } = {
    fajr: "الفجر", sunrise: "الشروق", dhuhr: "الظهر", asr: "العصر", maghrib: "المغرب", isha: "العشاء",
  };

  if (loadingSettings || !notificationSettings) {
    return <LoadingSpinner text="جاري تحميل الإعدادات..." style={styles.loadingContainer} color={Colors.primary} />;
  }

  return (
    <View style={styles.container}>
      <AppHeader title="الإعدادات" />
      <ScrollView contentContainerStyle={styles.contentContainer}>
        
        <View style={styles.settingsGroup}>
          <Text style={styles.groupTitle}>إعدادات التنبيهات</Text>
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>تفعيل إشعارات مواقيت الصلاة</Text>
            <Switch
              trackColor={{ false: Colors.grayDark, true: Colors.secondary }}
              thumbColor={notificationSettings.masterEnabled ? Colors.primary : Colors.moonlight}
              onValueChange={(value) => handleToggle('masterEnabled', value)}
              value={notificationSettings.masterEnabled}
            />
          </View>

          {notificationSettings.masterEnabled && (
            <>
              <View style={styles.settingItem}>
                <Text style={styles.settingLabel}>صوت الأذان لمواقيت الصلاة</Text>
              </View>
              <View style={styles.adhanSoundSelector}>
                {ADHAN_SOUND_OPTIONS.map(option => (
                  <View key={option.id} style={styles.adhanSoundOptionRow}>
                    <TouchableOpacity
                      style={[styles.adhanSoundOption, notificationSettings.sound === option.id && styles.adhanSoundOptionSelected, { flex: 1 }]}
                      onPress={() => handleAdhanSoundSelect(option.id)}
                    >
                      <Text style={[styles.adhanSoundOptionText, notificationSettings.sound === option.id && styles.adhanSoundOptionTextSelected]}>{option.name}</Text>
                    </TouchableOpacity>
                    {option.fileName && (
                      <TouchableOpacity style={styles.playSoundButton} onPress={() => handlePlaySound(option)} disabled={isLoadingSound && playingSoundId !== option.id}>
                          {isLoadingSound && playingSoundId === option.id ? <ActivityIndicator size="small" color={Colors.primary} /> : 
                            (playingSoundId === option.id ? 
                              <StopCircleIcon color={Colors.primary} size={RFValue(22)} /> : 
                              <PlayIcon color={Colors.primary} size={RFValue(22)} />
                            )
                          }
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>
              
              <View style={styles.separator} />

             {/*  <View style={styles.settingItem}>
                  <Text style={styles.settingLabel}>تذكير قبل الصلاة</Text>
                  <Switch
                      trackColor={{ false: Colors.grayDark, true: Colors.secondary }}
                      thumbColor={notificationSettings.preNotificationEnabled ? Colors.primary : Colors.moonlight}
                      onValueChange={(value) => handleToggle('preNotificationEnabled', value)}
                      value={notificationSettings.preNotificationEnabled}
                  />
              </View>

             {notificationSettings.preNotificationEnabled && (
                <View style={styles.offsetSelectorContainer}>
                  <Text style={styles.offsetLabel}>التذكير قبل:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.offsetOptions}>
                    {PRE_NOTIFICATION_OFFSET_OPTIONS.map(offset => (
                      <TouchableOpacity
                        key={offset}
                        style={[styles.offsetOption, notificationSettings.preNotificationOffset === offset && styles.offsetOptionSelected]}
                        onPress={() => handlePreNotificationOffsetSelect(offset)}
                      >
                        <Text style={[styles.offsetOptionText, notificationSettings.preNotificationOffset === offset && styles.offsetOptionTextSelected]}>
                          {offset} دقيقة
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}*/}

              <View style={styles.separator} />
              
              {(Object.keys(notificationSettings.prayers) as Array<keyof PrayerNotificationSettings>).map((prayerKey) => (
                <View style={styles.settingItem} key={prayerKey as string}>
                  <Text style={styles.settingLabel}>{prayerNamesMap[prayerKey]}</Text>
                  <Switch
                    trackColor={{ false: Colors.grayDark, true: Colors.secondary }}
                    thumbColor={notificationSettings.prayers[prayerKey] ? Colors.primary : Colors.moonlight}
                    onValueChange={(value) => handlePrayerToggle(prayerKey, value)}
                    value={notificationSettings.prayers[prayerKey]}
                  />
                </View>
              ))}
            </>
          )}
        </View>

      {/*  <View style={styles.settingsGroup}>
            <Text style={styles.groupTitle}>فحص النظام واختباره</Text>
            <TouchableOpacity style={styles.settingItemLink} onPress={handleDiagnostics}>
                <InformationCircleIcon color={Colors.primary} size={RFValue(20)} />
                <Text style={styles.settingLabelLink}>عرض تقرير التشخيص</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingItemLink} onPress={handleSystemTest}>
                <BellIcon color={Colors.primary} size={RFValue(20)} />
                <Text style={styles.settingLabelLink}>إجراء اختبار شامل للنظام</Text>
            </TouchableOpacity>
             <TouchableOpacity style={styles.settingItemLink} onPress={testAdhanSound}>
                <PlayIcon color={Colors.primary} size={RFValue(20)} />
                <Text style={styles.settingLabelLink}>اختبار صوت الأذان المحدد</Text>
            </TouchableOpacity>
             {Platform.OS === 'android' && (
              <TouchableOpacity style={styles.settingItemLink} onPress={handleReinitializeChannels}>
                  <CogIcon color={Colors.primary} size={RFValue(20)} />
                  <Text style={styles.settingLabelLink}>إعادة ضبط قنوات الإشعارات (Android)</Text>
              </TouchableOpacity>
             )}
        </View>*/}

        <View style={styles.settingsGroup}>
            <Text style={styles.groupTitle}>إعدادات عامة ومعلومات</Text>
            {/*<TouchableOpacity style={styles.settingItemLink} onPress={() => navigation.navigate('AdhkarReminders')}>
                <BellIcon color={Colors.primary} size={RFValue(20)} />
                <Text style={styles.settingLabelLink}>إدارة تذكيرات الأذكار</Text>
            </TouchableOpacity>*/}
            <TouchableOpacity style={styles.settingItemLink} onPress={() => navigation.navigate('About')}>
                <InformationCircleIcon color={Colors.primary} size={RFValue(20)} />
                <Text style={styles.settingLabelLink}>عن التطبيق ودليل الاستخدام</Text>
            </TouchableOpacity>
        </View>
        
<Text style={styles.footerText}>
  جميع الحقوق محفوظة © 2025 صلاتي.{"\n"}
  تم تطوير هذا التطبيق بواسطة شركة Quadravexa {"\n"}
  <Text 
    style={{ color: 'blue', textDecorationLine: 'underline' }}
    onPress={() => Linking.openURL('https://quadravexa.com')}
  >
    🌐 quadravexa.com
  </Text>
</Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background, 
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  contentContainer: {
    padding: RFValue(16),
  },
  settingsGroup: {
    backgroundColor: Colors.white, 
    borderRadius: RFValue(10),
    padding: RFValue(16),
    marginBottom: RFValue(20),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  groupTitle: {
    fontSize: RFValue(20),
    fontWeight: '600',
    color: Colors.primary, 
    marginBottom: RFValue(16),
    borderBottomWidth: 1,
    borderBottomColor: Colors.secondary, 
    paddingBottom: RFValue(8),
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
    textAlign: 'right'
  },
  settingItem: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: RFValue(12),
  },
  settingLabel: {
    fontSize: RFValue(16),
    color: Colors.accent, 
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    textAlign: 'right',
    flex:1,
    marginRight: RFValue(10),
  },
  adhanSoundSelector: {
    marginVertical: RFValue(10),
  },
  adhanSoundOptionRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: RFValue(8),
  },
  adhanSoundOption: {
    paddingVertical: RFValue(10),
    paddingHorizontal: RFValue(15),
    borderRadius: RFValue(8),
    borderWidth: 1,
    borderColor: Colors.secondary,
    alignItems: 'center',
  },
  adhanSoundOptionSelected: {
    backgroundColor: Colors.secondary,
  },
  adhanSoundOptionText: {
    fontSize: RFValue(15),
    color: Colors.primary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  adhanSoundOptionTextSelected: {
    color: Colors.white, 
    fontWeight: 'bold',
  },
  playSoundButton: {
    width: RFValue(44),
    height: RFValue(44),
    borderRadius: RFValue(22),
    backgroundColor: Colors.secondaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: RFValue(10),
    borderWidth: 1,
    borderColor: Colors.secondary,
  },
  settingItemLink: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingVertical: RFValue(14),
    borderTopWidth: 1,
    borderTopColor: Colors.moonlight,
    marginTop: RFValue(10),
  },
  settingLabelLink: {
    fontSize: RFValue(16),
    color: Colors.primary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
    marginRight: RFValue(10),
  },
  footerText: {
    textAlign: 'center',
    color: Colors.accent, 
    marginTop: RFValue(20),
    fontSize: RFValue(14),
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  separator: {
    height: 1,
    backgroundColor: Colors.moonlight,
    marginVertical: RFValue(10),
  },
  offsetSelectorContainer: {
    paddingVertical: RFValue(10),
  },
  offsetLabel: {
    fontSize: RFValue(15),
    color: Colors.accent,
    textAlign: 'right',
    marginBottom: RFValue(10),
  },
  offsetOptions: {
    flexDirection: 'row-reverse',
    paddingVertical: RFValue(5),
  },
  offsetOption: {
    paddingVertical: RFValue(8),
    paddingHorizontal: RFValue(16),
    borderRadius: RFValue(18),
    borderWidth: 1,
    borderColor: Colors.secondary,
    marginHorizontal: RFValue(4),
  },
  offsetOptionSelected: {
    backgroundColor: Colors.secondary,
  },
  offsetOptionText: {
    color: Colors.primary,
    fontSize: RFValue(14),
  },
  offsetOptionTextSelected: {
    color: Colors.white,
    fontWeight: 'bold',
  },
});

export default SettingsScreen;