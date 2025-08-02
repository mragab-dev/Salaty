import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, Platform, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import { useIsFocused } from '@react-navigation/native';
import { CogIcon, SparklesIcon, PlayIcon, StopCircleIcon, InformationCircleIcon } from '../components/Icons'; 
import { NotificationSettings, AdhanSound, PrayerNotificationSettings, AdhanSoundOption } from '../types';
import { ADHAN_SOUND_OPTIONS, DEFAULT_NOTIFICATION_SETTINGS, ASYNC_STORAGE_NOTIFICATION_SETTINGS_KEY, PRE_NOTIFICATION_OFFSET_OPTIONS } from '../constants';
import Colors from '../constants/colors';
import LoadingSpinner from '../components/LoadingSpinner';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { AppStackParamList } from '../App';

const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<AppStackParamList>>();
  const isFocused = useIsFocused();
  const [language, setLanguage] = useState('ar'); 
  const [prayerMethod, setPrayerMethod] = useState('ISNA'); 
  
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(true);

  // State for sound playback
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [playingSoundId, setPlayingSoundId] = useState<AdhanSound | null>(null);
  const [isLoadingSound, setIsLoadingSound] = useState(false);

  // Effect to handle cleanup when screen is unfocused or component unmounts
  useEffect(() => {
    const cleanupSound = async () => {
      if (sound) {
        console.log('Cleaning up sound object due to screen change or unmount.');
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
    // If tapping the currently playing sound, stop it.
    if (playingSoundId === soundOption.id && sound) {
      await sound.stopAsync();
      setPlayingSoundId(null);
      return;
    }

    // Stop and unload any other sound that might be playing or loaded.
    if (sound) {
        await sound.unloadAsync();
        setSound(null);
        setPlayingSoundId(null);
    }
    
    // Handle the case for the default system sound.
    if (!soundOption.fileName) {
        Alert.alert("صوت افتراضي", "هذا هو صوت الإشعار الافتراضي لجهازك ولا يمكن تجربته هنا.");
        return;
    }
    
    setIsLoadingSound(true);

    try {
        const soundFiles = {
            'adhan_makki.mp3': require('../assets/sounds/adhan_makki.mp3'),
            'adhan_kurdi.mp3': require('../assets/sounds/adhan_kurdi.mp3'),
        };
        const source = soundFiles[soundOption.fileName as keyof typeof soundFiles];

        if (!source) throw new Error('Sound file not found in map.');

        const { sound: newSound } = await Audio.Sound.createAsync(source, { shouldPlay: true });
        setSound(newSound);
        setPlayingSoundId(soundOption.id);

        newSound.setOnPlaybackStatusUpdate(async (status) => {
            if (status.isLoaded && status.didJustFinish) {
                setPlayingSoundId(null);
                // Don't unload here to allow for quick replay, but the cleanup effect will handle it on screen leave.
                await newSound.setPositionAsync(0);
            } else if (!status.isLoaded && (status as any).error) {
                 console.error(`Playback Error: ${(status as any).error}`);
                 setPlayingSoundId(null);
                 setSound(null);
            }
        });

    } catch (error) {
        console.error('Error playing sound', error);
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
        if (storedSettings) {
          const parsed = JSON.parse(storedSettings);
          const completeSettings = { ...DEFAULT_NOTIFICATION_SETTINGS, ...parsed };
          setNotificationSettings(completeSettings);
        } else {
          setNotificationSettings(DEFAULT_NOTIFICATION_SETTINGS);
        }
      } catch (e) {
        console.error("Failed to load notification settings:", e);
        setNotificationSettings(DEFAULT_NOTIFICATION_SETTINGS);
        Alert.alert("خطأ", "لم نتمكن من تحميل إعدادات الإشعارات. سيتم استخدام الإعدادات الافتراضية.");
      } finally {
        setLoadingSettings(false);
      }
    };
    loadSettings();
  }, []);

  const saveSettings = async (newSettings: NotificationSettings) => {
    try {
      setNotificationSettings(newSettings);
      await AsyncStorage.setItem(ASYNC_STORAGE_NOTIFICATION_SETTINGS_KEY, JSON.stringify(newSettings));
    } catch (e) {
      console.error("Failed to save notification settings:", e);
      Alert.alert("خطأ", "لم نتمكن من حفظ إعدادات الإشعارات.");
    }
  };

  const handleMasterToggle = (value: boolean) => {
    if (notificationSettings) {
      const newSettings = { ...notificationSettings, masterEnabled: value };
      saveSettings(newSettings);
    }
  };

  const handlePrayerToggle = (prayer: keyof PrayerNotificationSettings, value: boolean) => {
    if (notificationSettings) {
      const newSettings = {
        ...notificationSettings,
        prayers: {
          ...notificationSettings.prayers,
          [prayer]: value,
        },
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

  const handlePreNotificationToggle = (value: boolean) => {
    if (notificationSettings) {
      const newSettings = { ...notificationSettings, preNotificationEnabled: value };
      saveSettings(newSettings);
    }
  };

  const handlePreNotificationOffsetSelect = (offset: number) => {
    if (notificationSettings) {
      const newSettings = { ...notificationSettings, preNotificationOffset: offset };
      saveSettings(newSettings);
    }
  };

  const openLanguagePicker = () => Alert.alert("قيد التطوير","خيار تغيير اللغة قيد التطوير حاليًا.");
  const openPrayerMethodPicker = () => Alert.alert("قيد التطوير","خيار تغيير طريقة حساب المواقيت قيد التطوير حاليًا.");

  const prayerNamesMap: { [key in keyof PrayerNotificationSettings]: string } = {
    fajr: "الفجر",
    dhuhr: "الظهر",
    asr: "العصر",
    maghrib: "المغرب",
    isha: "العشاء",
  };

  if (loadingSettings || !notificationSettings) {
    return <LoadingSpinner text="جاري تحميل الإعدادات..." style={styles.loadingContainer} color={Colors.primary} />;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <CogIcon color={Colors.secondary} width={30} height={30} />
        <Text style={styles.headerTitle}>الإعدادات</Text>
      </View>
      <Text style={styles.headerSubtitle}>تخصيص تجربة تطبيق صلاتي.</Text>

      <View style={styles.settingsGroup}>
        <Text style={styles.groupTitle}>إعدادات عامة</Text>
        
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>اللغة</Text>
          <TouchableOpacity onPress={openLanguagePicker}>
            <Text style={styles.settingValue}>{language === 'ar' ? 'العربية' : 'English'} (قيد التطوير)</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>طريقة حساب مواقيت الصلاة</Text>
          <TouchableOpacity onPress={openPrayerMethodPicker}>
            <Text style={styles.settingValue}>{prayerMethod} (قيد التطوير)</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity 
            style={styles.settingItemLink}
            onPress={() => navigation.navigate('About')}
        >
            <InformationCircleIcon color={Colors.primary} size={20} />
            <Text style={styles.settingLabelLink}>عن التطبيق</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.settingsGroup}>
        <Text style={styles.groupTitle}>إعدادات التنبيهات</Text>
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>تفعيل إشعارات مواقيت الصلاة</Text>
          <Switch
            trackColor={{ false: Colors.grayDark, true: Colors.secondary }}
            thumbColor={notificationSettings.masterEnabled ? Colors.primary : Colors.moonlight}
            ios_backgroundColor="#3e3e3e"
            onValueChange={handleMasterToggle}
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
                    style={[
                      styles.adhanSoundOption,
                      notificationSettings.sound === option.id && styles.adhanSoundOptionSelected,
                      { flex: 1 }
                    ]}
                    onPress={() => handleAdhanSoundSelect(option.id)}
                  >
                    <Text style={[
                      styles.adhanSoundOptionText,
                      notificationSettings.sound === option.id && styles.adhanSoundOptionTextSelected
                    ]}>{option.name}</Text>
                  </TouchableOpacity>
                  {option.fileName && (
                    <TouchableOpacity style={styles.playSoundButton} onPress={() => handlePlaySound(option)} disabled={isLoadingSound}>
                        {isLoadingSound && playingSoundId !== option.id ? <ActivityIndicator size="small" color={Colors.primary} /> : 
                          (playingSoundId === option.id ? 
                            <StopCircleIcon color={Colors.primary} size={22} /> : 
                            <PlayIcon color={Colors.primary} size={22} />
                          )
                        }
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
            
            <View style={styles.separator} />

            <View style={styles.settingItem}>
                <Text style={styles.settingLabel}>تذكير قبل الصلاة</Text>
                <Switch
                    trackColor={{ false: Colors.grayDark, true: Colors.secondary }}
                    thumbColor={notificationSettings.preNotificationEnabled ? Colors.primary : Colors.moonlight}
                    ios_backgroundColor="#3e3e3e"
                    onValueChange={handlePreNotificationToggle}
                    value={notificationSettings.preNotificationEnabled}
                />
            </View>

            {notificationSettings.preNotificationEnabled && (
              <View style={styles.offsetSelectorContainer}>
                <Text style={styles.offsetLabel}>التذكير قبل:</Text>
                <View style={styles.offsetOptions}>
                  {PRE_NOTIFICATION_OFFSET_OPTIONS.map(offset => (
                    <TouchableOpacity
                      key={offset}
                      style={[
                        styles.offsetOption,
                        notificationSettings.preNotificationOffset === offset && styles.offsetOptionSelected,
                      ]}
                      onPress={() => handlePreNotificationOffsetSelect(offset)}
                    >
                      <Text style={[styles.offsetOptionText, notificationSettings.preNotificationOffset === offset && styles.offsetOptionTextSelected]}>
                        {offset} دقيقة
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            <View style={styles.separator} />
            
            {(Object.keys(notificationSettings.prayers) as Array<keyof PrayerNotificationSettings>).map((prayerKey) => (
              <View style={styles.settingItem} key={prayerKey as string}>
                <Text style={styles.settingLabel}>{prayerNamesMap[prayerKey]}</Text>
                <Switch
                  trackColor={{ false: Colors.grayDark, true: Colors.secondary }}
                  thumbColor={notificationSettings.prayers[prayerKey] ? Colors.primary : Colors.moonlight}
                  ios_backgroundColor="#3e3e3e"
                  onValueChange={(value) => handlePrayerToggle(prayerKey, value)}
                  value={notificationSettings.prayers[prayerKey]}
                />
              </View>
            ))}
          </>
        )}
        {!notificationSettings.masterEnabled && (
            <Text style={styles.comingSoonText}>إشعارات مواقيت الصلاة معطلة حالياً.</Text>
        )}
         <TouchableOpacity 
          style={styles.settingItemLink} 
          onPress={() => navigation.navigate('AdhkarReminders' as any)}
         >
          <SparklesIcon color={Colors.primary} size={20} />
          <Text style={styles.settingLabelLink}>تذكيرات الأذكار</Text>
        </TouchableOpacity>
      </View>
      
      <Text style={styles.footerText}>
        المزيد من الإعدادات ستتوفر في التحديثات القادمة إن شاء الله.
      </Text>
    </ScrollView>
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
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary, 
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: Colors.secondary, 
    marginLeft: 10, 
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  },
  headerSubtitle: {
    fontSize: 16,
    color: Colors.accent, 
    textAlign: 'center',
    marginVertical: 10,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  settingsGroup: {
    backgroundColor: Colors.white, 
    borderRadius: 10,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  groupTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.primary, 
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.secondary, 
    paddingBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
    textAlign: 'right'
  },
  settingItem: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.moonlight, 
  },
  settingLabel: {
    fontSize: 16,
    color: Colors.accent, 
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    textAlign: 'right',
    flex:1,
    marginRight: 10,
  },
  settingValue: {
    fontSize: 16,
    color: Colors.primary, 
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
    textAlign: 'left',
  },
  adhanSoundSelector: {
    marginVertical: 10,
  },
  adhanSoundOptionRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 8,
  },
  adhanSoundOption: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.secondary,
    alignItems: 'center',
  },
  adhanSoundOptionSelected: {
    backgroundColor: Colors.secondary,
  },
  adhanSoundOptionText: {
    fontSize: 15,
    color: Colors.primary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  adhanSoundOptionTextSelected: {
    color: Colors.white, 
    fontWeight: 'bold',
  },
  playSoundButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.secondaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
    borderWidth: 1,
    borderColor: Colors.secondary,
  },
  comingSoonText: {
    fontSize: 13,
    color: Colors.textLight, 
    marginTop: 12,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  settingItemLink: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.moonlight,
    marginTop: 10,
  },
  settingLabelLink: {
    fontSize: 16,
    color: Colors.primary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
    marginRight: 10,
  },
  footerText: {
    textAlign: 'center',
    color: Colors.accent, 
    marginTop: 20,
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  separator: {
    height: 1,
    backgroundColor: Colors.moonlight,
    marginVertical: 10,
  },
  offsetSelectorContainer: {
    paddingVertical: 10,
    paddingHorizontal: 5,
  },
  offsetLabel: {
    fontSize: 15,
    color: Colors.accent,
    textAlign: 'right',
    marginBottom: 10,
  },
  offsetOptions: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-around',
  },
  offsetOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: Colors.secondary,
  },
  offsetOptionSelected: {
    backgroundColor: Colors.secondary,
  },
  offsetOptionText: {
    color: Colors.primary,
    fontSize: 14,
  },
  offsetOptionTextSelected: {
    color: Colors.white,
    fontWeight: 'bold',
  },
});

export default SettingsScreen;
