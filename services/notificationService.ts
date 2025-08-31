  import * as Notifications from 'expo-notifications';
  import { Platform } from 'react-native';
  import moment from 'moment-timezone';
  import AsyncStorage from '@react-native-async-storage/async-storage';
  import { Audio } from 'expo-av';
  import {
    Prayer,
    NotificationSettings,
    PrayerNotificationSettings,
    AdhanSoundOption,
    AdhkarReminder
  } from '../types';
  import {
    APP_NAME,
    ADHAN_SOUND_OPTIONS,
    ASYNC_STORAGE_ADHKAR_REMINDERS_KEY,
    ASYNC_STORAGE_PRAYER_NOTIFICATION_IDS_KEY,
    ASYNC_STORAGE_NOTIFICATION_SETTINGS_KEY,
    DEFAULT_NOTIFICATION_SETTINGS,
  } from '../constants';

  // استيراد أصوات الأذان
  import adhanMakkiSound from '../assets/sounds/adhan_makki.mp3';
  import adhanKurdiSound from '../assets/sounds/adhan_kurdi.mp3';

  // ====================
  // 1. إعداد الإشعارات
  // ====================

  // Preload sounds for faster notification playback on Android
  export const preloadAdhanSounds = async () => {
    try {
      const soundFile = await getSelectedAdhanSoundFileName();
      console.log(`Preloading sound: ${soundFile}`);
      const sound = new Audio.Sound();
      const soundAsset = soundFile.includes('makki') ? adhanMakkiSound : adhanKurdiSound;
      
      // This process of loading and unloading helps cache the sound for the OS
      await sound.loadAsync(soundAsset);
      await sound.unloadAsync();
      console.log('Sound preloaded successfully.');
    } catch (error) {
      console.error('Failed to preload adhan sound:', error);
    }
  };


  // إعداد كيفية عرض الإشعار عندما يصل
  Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
      console.log("Notification received:", notification);
      
      // إذا كان إشعار الصلاة، قم بتشغيل الأذان
      if (notification.request.content.data?.type === 'prayerTime') {
        console.log("Prayer time notification received, playing adhan...");
        try {
          await playAdhanSound();
        } catch (error) {
          console.error("Failed to play adhan sound:", error);
        }
      }
      
      return {
        shouldShowAlert: true,
        shouldPlaySound: true, // السماح للنظام بتشغيل الصوت
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      };
    },
  });

  // دالة تشغيل الأذان
  export const playAdhanSound = async () => {
    try {
      console.log("Playing adhan sound...");
      const soundFile = await getSelectedAdhanSoundFileName();
      console.log(`Playing sound file: ${soundFile}`);
      
      const sound = new Audio.Sound();
      const soundAsset = soundFile.includes('makki') ? adhanMakkiSound : adhanKurdiSound;
      
      await sound.loadAsync(soundAsset);
      await sound.playAsync();
      
      console.log("Adhan sound playing...");
      
      // إيقاف الصوت بعد 30 ثانية
      setTimeout(async () => {
        try {
          await sound.stopAsync();
          await sound.unloadAsync();
          console.log("Adhan sound stopped");
        } catch (error) {
          console.error("Error stopping adhan sound:", error);
        }
      }, 30000);
      
      return true;
    } catch (error) {
      console.error("Failed to play adhan sound:", error);
      return false;
    }
  };

  const getSelectedAdhanSoundFileName = async (): Promise<string> => {
    try {
      const settingsJson = await AsyncStorage.getItem(ASYNC_STORAGE_NOTIFICATION_SETTINGS_KEY);
      const settings: NotificationSettings = settingsJson ? JSON.parse(settingsJson) : DEFAULT_NOTIFICATION_SETTINGS;
      
      console.log("Current sound settings:", settings.sound);
      
      if (settings.sound && settings.sound !== 'default') {
        const soundOption = ADHAN_SOUND_OPTIONS.find(opt => opt.id === settings.sound);
        if (soundOption && soundOption.fileName) {
          const fileName = soundOption.fileName.replace('.mp3', '');
          console.log(`Selected sound file: ${fileName}`);
          return fileName;
        }
      }
    } catch (e) {
      console.error("Failed to get selected adhan sound, using default.", e);
    }
    
    // الافتراضي الآن 'makki' بدلاً من 'default'
    console.log("Using default sound: adhan_makki");
    return 'adhan_makki';
  };

  // إنشاء قنوات الإشعارات للأندرويد + طلب الصلاحيات
  async function registerForPushNotificationsAsync(): Promise<string | null> {
    if (Platform.OS === 'android') {
      const selectedAdhanSound = await getSelectedAdhanSoundFileName();

      await Notifications.setNotificationChannelAsync('default', {
        name: 'إشعارات عامة',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
        sound: 'default', 
      });
      
      await Notifications.setNotificationChannelAsync('adhkar_channel', { 
        name: 'تذكيرات الأذكار',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default', 
        vibrationPattern: [0, 250, 250, 250],
      });
      
      await Notifications.setNotificationChannelAsync('adhan_channel', {
        name: 'أذان مواقيت الصلاة',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 500, 250, 500],
        lightColor: '#C4A052',
  // Ensure the channel is recreated so Android picks up the selected sound resource.
  // If the channel already exists Android may ignore changes to the sound, so delete first.
  sound: selectedAdhanSound, // استخدام الصوت المحدد من قبل المستخدم
  // Consider allowing bypassing Do Not Disturb for prayer adhan if appropriate
  bypassDnd: false,
      });
      
      await Notifications.setNotificationChannelAsync('pre_prayer_reminder_channel', {
        name: 'تذكيرات قبل الصلاة',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 400, 200, 400],
        sound: 'default',
      });
      
      console.log("Android notification channels created successfully");
      console.log("Selected adhan sound for channel:", selectedAdhanSound);
      try {
        // Recreate adhan channel to ensure the sound resource is applied on Android
        // Delete first (no-op if not present), then create again with explicit options.
        await Notifications.deleteNotificationChannelAsync('adhan_channel');
        await Notifications.setNotificationChannelAsync('adhan_channel', {
          name: 'أذان مواقيت الصلاة',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 500, 250, 500],
          lightColor: '#C4A052',
          sound: selectedAdhanSound,
          bypassDnd: false,
        });

        const channels = await Notifications.getNotificationChannelsAsync();
        const adhanChannel = channels.find(c => c.id === 'adhan_channel');
        console.log('Recreated adhan_channel:', adhanChannel);
      } catch (e) {
        console.warn('Could not recreate adhan_channel (non-fatal):', e);
      }
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.warn('Notification permissions denied.');
      return null;
    }
    return 'granted';
  }

  export const initializeNotifications = async (): Promise<boolean> => {
    const permissionStatus = await registerForPushNotificationsAsync();
    return permissionStatus === 'granted';
  };

  // Compatibility wrappers for older imports in App.tsx / SettingsScreen.tsx
  // These thin wrappers keep the public API stable while we refactor internals.
  export const rescheduleNotifications = async (...args: any[]) => {
    // If caller expects rescheduling of prayer notifications, call schedulePrayerNotifications
    // If they pass prayers and settings, forward them; otherwise just return false.
    try {
      if (args && args.length >= 2) {
        return await schedulePrayerNotifications(args[0], args[1]);
      }
      // No-op fallback: return true to indicate success for compatibility
      return true;
    } catch (e) {
      console.error('rescheduleNotifications wrapper failed:', e);
      return false;
    }
  };

  export const reinitializeNotificationChannels = async () => {
    // Recreate Android channels by calling registerForPushNotificationsAsync
    try {
      await registerForPushNotificationsAsync();
      return true;
    } catch (e) {
      console.error('Failed to reinitialize notification channels:', e);
      return false;
    }
  };

  // Background refresh handlers (no-op wrappers provided for compatibility)
  export const setupDailyNotificationRefresh = async () => {
    // Previously this may have scheduled a repeating background job; keep as no-op for now.
    return true;
  };

  export const handleBackgroundNotificationRefresh = async () => {
    // Called when a background daily refresh notification is received. We'll reload adhkar reminders.
    try {
      await loadAndRescheduleAllAdhkarReminders();
      return true;
    } catch (e) {
      console.error('handleBackgroundNotificationRefresh failed:', e);
      return false;
    }
  };

  // Diagnostics wrappers expected by SettingsScreen
  export const getDetailedNotificationDiagnostics = async () => {
    try {
      const status = await comprehensiveNotificationCheck();
      return JSON.stringify(status, null, 2);
    } catch (e) {
      console.error('getDetailedNotificationDiagnostics failed:', e);
      return `Diagnostics failed: ${e}`;
    }
  };

  export const runNotificationSystemTest = async () => {
    try {
      const res = await comprehensiveSystemTest();
      // Return true if successRate is high
      if (res && typeof res.successRate === 'number') {
        return res.successRate > 50;
      }
      return false;
    } catch (e) {
      console.error('runNotificationSystemTest failed:', e);
      return false;
    }
  };

  // ====================
  // 2. إشعارات الصلاة
  // ====================

  // جدولة إشعارات الصلاة
  export const schedulePrayerNotifications = async (
    prayers: Prayer[],
    settings: NotificationSettings
  ) => {
    console.log("🚀 Starting enhanced prayer notification scheduling...");
    
    // Check if notifications are already scheduled for today
    try {
      const existingNotifications = await Notifications.getAllScheduledNotificationsAsync();
      const today = moment.tz(moment.tz.guess()).format('YYYY-MM-DD');
      
      // Check if we already have prayer notifications for today
      const hasTodayNotifications = existingNotifications.some(notification => {
        const trigger = notification.trigger as any;
        if (trigger && trigger.value) {
          const notificationDate = moment(trigger.value).format('YYYY-MM-DD');
          return notificationDate === today && 
                 (notification.content.data?.type === 'prayerTime' || 
                  notification.content.data?.type === 'prePrayer');
        }
        return false;
      });
      
      if (hasTodayNotifications) {
        console.log("⚠️ Prayer notification scheduling is already in progress. Skipping.");
        return;
      }
    } catch (error) {
      console.error("Error checking existing notifications:", error);
    }
    
    // إلغاء أي إشعارات قديمة
    await cancelAllPrayerNotifications();

    if (!settings.masterEnabled) {
      console.log("Master notifications disabled. No new notifications scheduled.");
      await AsyncStorage.setItem(ASYNC_STORAGE_PRAYER_NOTIFICATION_IDS_KEY, JSON.stringify([]));
      return;
    }

    const now = moment.tz(moment.tz.guess());
    const ids: string[] = [];

    for (const prayer of prayers) {
      const prayerKey = prayer.name.toLowerCase() as keyof PrayerNotificationSettings;
      if (!settings.prayers[prayerKey] || !prayer.time) {
        console.log(`Skipping ${prayer.name}: enabled=${settings.prayers[prayerKey]}, time=${prayer.time}`);
        continue;
      }

      const prayerTime = moment.tz(prayer.time, 'hh:mm A', moment.tz.guess())
        .year(now.year()).month(now.month()).date(now.date());

      if (prayerTime.isBefore(now)) {
        prayerTime.add(1, 'day');
      }

      const isSunrise = prayerKey === 'sunrise';
      const mainBody = isSunrise ? `حان الآن وقت الشروق` : `حان الآن وقت صلاة ${prayer.arabicName}`;
      const preBody = isSunrise ? `اقترب وقت الشروق` : `اقترب وقت صلاة ${prayer.arabicName}`;
      
      // تحديد ملف صوت الأذان
      let adhanSoundFile: string | undefined = undefined;
      if (!isSunrise && settings.sound !== 'default') {
        const soundOption = ADHAN_SOUND_OPTIONS.find(opt => opt.id === settings.sound);
        if (soundOption && soundOption.fileName) {
          adhanSoundFile = soundOption.fileName.replace('.mp3', '');
        }
      }
      // لو مفيش صوت مختار، نستخدم adhan_makki
      const mainSound = adhanSoundFile || 'adhan_makki';

      console.log(`Scheduling ${prayer.name} notification for ${prayerTime.format('YYYY-MM-DD HH:mm')} with sound: ${mainSound}`);

      // إشعار وقت الصلاة
      // Android: use timeInterval trigger (seconds until target) because calendar triggers may not be supported
      // iOS: use calendar trigger for accurate local scheduling
      let mainTrigger: any = null;
      const secondsUntilPrayer = Math.max(1, Math.ceil(prayerTime.diff(now, 'seconds')));
      if (Platform.OS === 'android') {
        mainTrigger = {
          type: 'timeInterval' as any,
          seconds: secondsUntilPrayer,
          repeats: false,
          channelId: 'adhan_channel',
        };
      } else {
        mainTrigger = {
          type: 'calendar' as any,
          year: prayerTime.year(),
          month: prayerTime.month() + 1,
          day: prayerTime.date(),
          hour: prayerTime.hour(),
          minute: prayerTime.minute(),
          channelId: undefined,
        };
      }

      const mainContent: any = {
        title: APP_NAME,
        body: mainBody,
        data: { type: 'prayerTime', prayerName: prayer.name }
      };

      // On iOS we can attach the sound name (with extension). On Android the channel controls the sound.
      if (Platform.OS === 'ios') {
        mainContent.sound = `${mainSound}.mp3`;
      }

      const mainId = await Notifications.scheduleNotificationAsync({
        content: mainContent,
        trigger: mainTrigger
      }).catch(error => {
          console.error(`Failed to schedule ${prayer.name} notification:`, error);
          return null;
      });
      
      if (mainId) {
          ids.push(mainId);
          console.log(`Successfully scheduled ${prayer.name} notification with ID: ${mainId}`);
      } else {
          console.error(`Failed to get notification ID for ${prayer.name}`);
      }

      // إشعار قبل الصلاة (إذا مفعل وليس للشروق)
      if (settings.preNotificationEnabled && !isSunrise) {
        const preTime = prayerTime.clone().subtract(settings.preNotificationOffset, 'minutes');
        if (preTime.isAfter(now)) {
          console.log(`Scheduling pre-prayer notification for ${prayer.name} at ${preTime.format('YYYY-MM-DD HH:mm')}`);
          console.log(`Pre-notification offset: ${settings.preNotificationOffset} minutes`);
          
          // Use timeInterval triggers on Android (seconds until target). iOS uses calendar triggers.
          const secondsUntilPre = Math.max(1, Math.ceil(preTime.diff(now, 'seconds')));
          let preTrigger: any = null;
          if (Platform.OS === 'android') {
            preTrigger = {
              type: 'timeInterval' as any,
              seconds: secondsUntilPre,
              repeats: false,
              channelId: 'pre_prayer_reminder_channel'
            };
          } else {
            preTrigger = {
              type: 'calendar' as any,
              year: preTime.year(),
              month: preTime.month() + 1,
              day: preTime.date(),
              hour: preTime.hour(),
              minute: preTime.minute(),
              second: 0,
              channelId: undefined
            };
          }

          console.log(`Pre-prayer trigger details:`, {
            year: preTime.year(),
            month: preTime.month() + 1,
            day: preTime.date(),
            hour: preTime.hour(),
            minute: preTime.minute()
          });
          
          const preId = await Notifications.scheduleNotificationAsync({
            content: {
              title: APP_NAME,
              body: preBody,
              sound: 'default',
              data: { type: 'prePrayer', prayerName: prayer.name }
            },
            trigger: preTrigger
          }).catch(error => {
              console.error(`Failed to schedule pre-notification for ${prayer.name}:`, error);
              return null;
          });
          
          if (preId) {
              ids.push(preId);
              console.log(`Successfully scheduled pre-prayer notification for ${prayer.name} with ID: ${preId}`);
          } else {
              console.error(`Failed to get pre-notification ID for ${prayer.name}`);
          }
        } else {
          console.log(`Pre-prayer time for ${prayer.name} has already passed, skipping`);
        }
      }
    }

    await AsyncStorage.setItem(ASYNC_STORAGE_PRAYER_NOTIFICATION_IDS_KEY, JSON.stringify(ids));
    console.log(`✅ Prayer notification scheduling finished. Lock released.`);
    console.log(`Successfully scheduled ${ids.length} prayer notifications. IDs:`, ids);
  };

  // إلغاء كل إشعارات الصلاة
  export const cancelAllPrayerNotifications = async () => {
    try {
      const json = await AsyncStorage.getItem(ASYNC_STORAGE_PRAYER_NOTIFICATION_IDS_KEY);
      if (json) {
        const ids: string[] = JSON.parse(json);
        for (const id of ids) {
          await Notifications.cancelScheduledNotificationAsync(id);
        }
      }
      await AsyncStorage.removeItem(ASYNC_STORAGE_PRAYER_NOTIFICATION_IDS_KEY);
    } catch (error) {
      console.error('Error cancelling all prayer notifications:', error);
    }
  };

  // ====================
  // 3. إشعارات الأذكار
  // ====================

  // جدولة تذكير الأذكار (يومي متكرر)
  export const scheduleAdhkarReminder = async (reminder: AdhkarReminder): Promise<string | null> => {
    if (!reminder.isEnabled || !reminder.time) {
      console.log(`Skipping Adhkar reminder for ${reminder.categoryName}: enabled=${reminder.isEnabled}, time=${reminder.time}`);
      return null;
    }

    const [hour, minute] = reminder.time.split(':').map(Number);
    if (isNaN(hour) || isNaN(minute)) {
      console.error(`Invalid time format for ${reminder.categoryName}: ${reminder.time}`);
      return null;
    }

    try {
      console.log(`Scheduling Adhkar reminder for ${reminder.categoryName} at ${hour}:${minute}`);
      
      // حساب الوقت المتبقي حتى الوقت المحدد
      const now = new Date();
      const targetTime = new Date();
      targetTime.setHours(hour, minute, 0, 0);
      
      // إذا كان الوقت قد مر اليوم، نضبطه للغد
      if (targetTime <= now) {
        targetTime.setDate(targetTime.getDate() + 1);
      }
      
      const timeUntilTarget = targetTime.getTime() - now.getTime();
      const secondsUntilTarget = Math.floor(timeUntilTarget / 1000);
      
      console.log(`Time until target: ${secondsUntilTarget} seconds`);
      
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: `تذكير أذكار - ${APP_NAME}`,
          body: `حان الآن وقت ${reminder.categoryName}. لا تنس قراءتها.`,
          sound: 'default',
          data: { 
            type: 'adhkarReminder', 
            categoryId: reminder.categoryId,
            categoryName: reminder.categoryName 
          }
        },
        trigger: {
          type: 'timeInterval' as any,
          seconds: secondsUntilTarget,
          repeats: true,
          channelId: Platform.OS === 'android' ? 'adhkar_channel' : undefined
        }
      });
      
      console.log(`Successfully scheduled Adhkar reminder for ${reminder.categoryName} with ID: ${notificationId}`);
      return notificationId;
    } catch (error) {
      console.error(`Failed to schedule Adhkar reminder for ${reminder.categoryName}:`, error);
      return null;
    }
  };

  // إلغاء تذكير الأذكار
  export const cancelAdhkarReminder = async (id?: string) => {
    if (id) {
      try {
        await Notifications.cancelScheduledNotificationAsync(id);
      } catch (error) {
        console.error(`Failed to cancel Adhkar reminder ID ${id}:`, error);
      }
    }
  };

  // إعادة جدولة كل الأذكار من التخزين
  export const loadAndRescheduleAllAdhkarReminders = async () => {
    try {
      console.log("Starting to load and reschedule all Adhkar reminders...");
      
      const json = await AsyncStorage.getItem(ASYNC_STORAGE_ADHKAR_REMINDERS_KEY);
      if (!json) {
        console.log("No Adhkar reminders found in storage");
        return;
      }

      const reminders: AdhkarReminder[] = JSON.parse(json);
      console.log(`Found ${reminders.length} Adhkar reminders in storage:`, reminders);
      
      // إلغاء جميع الإشعارات القديمة أولاً
      for (const reminder of reminders) {
        if (reminder.notificationId) {
          console.log(`Cancelling existing notification for ${reminder.categoryName} with ID: ${reminder.notificationId}`);
          await cancelAdhkarReminder(reminder.notificationId);
        }
      }
      
      const updated = await Promise.all(
        reminders.map(async (reminder) => {
          if (reminder.isEnabled) {
            console.log(`Rescheduling enabled reminder for ${reminder.categoryName}`);
            const newId = await scheduleAdhkarReminder(reminder);
            const updatedReminder = { ...reminder, notificationId: newId || undefined };
            console.log(`Updated reminder for ${reminder.categoryName}:`, updatedReminder);
            return updatedReminder;
          } else {
            console.log(`Skipping disabled reminder for ${reminder.categoryName}`);
            return { ...reminder, notificationId: undefined };
          }
        })
      );

      await AsyncStorage.setItem(ASYNC_STORAGE_ADHKAR_REMINDERS_KEY, JSON.stringify(updated));
      console.log(`Successfully updated ${updated.length} Adhkar reminders in storage`);
      
      // طباعة جميع الإشعارات المجدولة للتشخيص
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      console.log(`Total scheduled notifications: ${scheduledNotifications.length}`);
      scheduledNotifications.forEach((notification, index) => {
        console.log(`Notification ${index + 1}:`, {
          id: notification.identifier,
          title: notification.content.title,
          body: notification.content.body,
          trigger: notification.trigger
        });
      });
    } catch (error) {
      console.error('Failed to load and reschedule Adhkar reminders:', error);
    }
  };

  // ====================
  // 4. تشغيل الأذان
  // ====================

  // لم نعد بحاجة إلى المستمع لتشغيل الصوت يدويًا
  // سيقوم نظام التشغيل بتشغيل الصوت المخصص المرفق بالإشعار مباشرةً
  // هذا يضمن تشغيل الأذان حتى لو كان التطبيق مغلقًا

  // ====================
  // 5. اختبار الإشعارات
  // ====================

  // دالة لاختبار الإشعارات
  export const testNotification = async () => {
    try {
      console.log("Testing notification...");
      
      const testId = await Notifications.scheduleNotificationAsync({
        content: {
          title: "اختبار الإشعارات",
          body: "هذا إشعار تجريبي للتأكد من عمل الإشعارات",
          sound: 'default',
          data: { type: 'test' }
        },
        trigger: {
          type: 'timeInterval' as any,
          seconds: 5, // إشعار بعد 5 ثوان
        }
      });
      
      console.log("Test notification scheduled with ID:", testId);
      return testId;
    } catch (error) {
      console.error("Failed to schedule test notification:", error);
      return null;
    }
  };

  // دالة للتحقق من حالة الإشعارات
  export const checkNotificationStatus = async () => {
    try {
      const permissions = await Notifications.getPermissionsAsync();
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      
      console.log("Notification permissions:", permissions);
      console.log("Scheduled notifications count:", scheduledNotifications.length);
      
      return {
        permissions,
        scheduledCount: scheduledNotifications.length
      };
    } catch (error) {
      console.error("Failed to check notification status:", error);
      return null;
    }
  };

  // دالة فحص شامل لحالة الإشعارات
  export const comprehensiveNotificationCheck = async () => {
    try {
      console.log("Running comprehensive notification check...");
      
      const results = {
        permissions: null,
        scheduledNotifications: [],
        channels: [],
        settings: null,
        errors: []
      };
      
      // فحص الصلاحيات
      try {
        results.permissions = await Notifications.getPermissionsAsync();
        console.log("Permissions status:", results.permissions);
      } catch (error) {
        console.error("Failed to check permissions:", error);
        results.errors.push(`Permissions check failed: ${error}`);
      }
      
      // فحص الإشعارات المجدولة
      try {
        results.scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
        console.log("Scheduled notifications:", results.scheduledNotifications.length);
      } catch (error) {
        console.error("Failed to get scheduled notifications:", error);
        results.errors.push(`Scheduled notifications check failed: ${error}`);
      }
      
      // فحص الإعدادات المحفوظة
      try {
        const settingsJson = await AsyncStorage.getItem(ASYNC_STORAGE_NOTIFICATION_SETTINGS_KEY);
        results.settings = settingsJson ? JSON.parse(settingsJson) : null;
        console.log("Saved notification settings:", results.settings);
      } catch (error) {
        console.error("Failed to get saved settings:", error);
        results.errors.push(`Settings check failed: ${error}`);
      }
      
      // فحص قنوات الإشعارات (Android)
      if (Platform.OS === 'android') {
        try {
          const channels = await Notifications.getNotificationChannelsAsync();
          results.channels = channels;
          console.log("Android notification channels:", channels);
        } catch (error) {
          console.error("Failed to get notification channels:", error);
          results.errors.push(`Channels check failed: ${error}`);
        }
      }
      
      console.log("Comprehensive check completed:", results);
      return results;
    } catch (error) {
      console.error("Comprehensive check failed:", error);
      return { errors: [`Comprehensive check failed: ${error}`] };
    }
  };

  // دالة لاختبار صوت الأذان
  export const testAdhanSound = async () => {
    try {
      console.log("Testing Adhan sound...");
      
      const soundFile = await getSelectedAdhanSoundFileName();
      console.log(`Testing sound file: ${soundFile}`);
      
      const sound = new Audio.Sound();
      const soundAsset = soundFile.includes('makki') ? adhanMakkiSound : adhanKurdiSound;
      
      await sound.loadAsync(soundAsset);
      await sound.playAsync();
      
      console.log("Adhan sound playing...");
      
      // إيقاف الصوت بعد 10 ثوان
      setTimeout(async () => {
        await sound.stopAsync();
        await sound.unloadAsync();
        console.log("Adhan sound stopped");
      }, 10000);
      
      return true;
    } catch (error) {
      console.error("Failed to test Adhan sound:", error);
      return false;
    }
  };

  // دالة لاختبار إشعارات الأذكار
  export const testAdhkarNotification = async () => {
    try {
      console.log("Testing Adhkar notification...");
      
      const testId = await Notifications.scheduleNotificationAsync({
        content: {
          title: `تذكير أذكار - ${APP_NAME}`,
          body: `هذا إشعار تجريبي لتذكير الأذكار.`,
          sound: 'default',
          data: { 
            type: 'adhkarReminder', 
            categoryId: 'test',
            categoryName: 'اختبار' 
          }
        },
        trigger: {
          type: 'timeInterval' as any,
          seconds: 10, // إشعار بعد 10 ثوان
        }
      });
      
      console.log("Test Adhkar notification scheduled with ID:", testId);
      return testId;
    } catch (error) {
      console.error("Failed to schedule test Adhkar notification:", error);
      return null;
    }
  };

  // دالة لاختبار إشعارات اقتراب الصلاة
  export const testPrePrayerNotification = async () => {
    try {
      console.log("Testing pre-prayer notification...");
      
      // حساب الوقت المستهدف (بعد 15 ثانية)
      const now = new Date();
      const targetTime = new Date(now.getTime() + (15 * 1000));
      
      const secondsUntil = Math.max(1, Math.ceil((targetTime.getTime() - Date.now()) / 1000));
      const trigger = Platform.OS === 'android' ?
        ({ type: 'timeInterval' as any, seconds: secondsUntil, repeats: false, channelId: 'pre_prayer_reminder_channel' }) :
        ({ type: 'calendar' as any, year: targetTime.getFullYear(), month: targetTime.getMonth() + 1, day: targetTime.getDate(), hour: targetTime.getHours(), minute: targetTime.getMinutes(), second: targetTime.getSeconds() });

      const testId = await Notifications.scheduleNotificationAsync({
        content: {
          title: APP_NAME,
          body: "هذا إشعار تجريبي لاقتراب الصلاة.",
          sound: 'default',
          data: { type: 'prePrayer', prayerName: 'اختبار' }
        },
        trigger
      });
      
      console.log("Test pre-prayer notification scheduled with ID:", testId);
      return testId;
    } catch (error) {
      console.error("Failed to schedule test pre-prayer notification:", error);
      return null;
    }
  };

  // دالة لاختبار إشعارات اقتراب الصلاة مع أوقات مختلفة
  export const testPrePrayerNotificationWithOffset = async (offsetMinutes: number) => {
    try {
      console.log(`Testing pre-prayer notification with ${offsetMinutes} minutes offset...`);
      
      // حساب الوقت المستهدف
      const now = new Date();
      const targetTime = new Date(now.getTime() + (offsetMinutes * 60 * 1000));
      
      console.log(`Current time: ${now.toLocaleTimeString()}`);
      console.log(`Target time: ${targetTime.toLocaleTimeString()}`);
      
      const secondsUntil = Math.max(1, Math.ceil((targetTime.getTime() - Date.now()) / 1000));
      const trigger = Platform.OS === 'android' ?
        ({ type: 'timeInterval' as any, seconds: secondsUntil, repeats: false, channelId: 'pre_prayer_reminder_channel' }) :
        ({ type: 'calendar' as any, year: targetTime.getFullYear(), month: targetTime.getMonth() + 1, day: targetTime.getDate(), hour: targetTime.getHours(), minute: targetTime.getMinutes(), second: 0 });

      const testId = await Notifications.scheduleNotificationAsync({
        content: {
          title: APP_NAME,
          body: `هذا إشعار تجريبي لاقتراب الصلاة (قبل ${offsetMinutes} دقيقة).`,
          sound: 'default',
          data: { type: 'prePrayer', prayerName: 'اختبار' }
        },
        trigger
      });
      
      console.log(`Test pre-prayer notification with ${offsetMinutes} minutes offset scheduled with ID:`, testId);
      return testId;
    } catch (error) {
      console.error(`Failed to schedule test pre-prayer notification with ${offsetMinutes} minutes offset:`, error);
      return null;
    }
  };

  // دالة لاختبار إشعارات الصلاة الرئيسية
  export const testMainPrayerNotification = async () => {
    try {
      console.log("Testing main prayer notification...");
      
      // حساب الوقت المستهدف (بعد 20 ثانية)
      const now = new Date();
      const targetTime = new Date(now.getTime() + (20 * 1000));
      
      const secondsUntil = Math.max(1, Math.ceil((targetTime.getTime() - Date.now()) / 1000));
      const trigger = Platform.OS === 'android' ?
        ({ type: 'timeInterval' as any, seconds: secondsUntil, repeats: false, channelId: 'adhan_channel' }) :
        ({ type: 'calendar' as any, year: targetTime.getFullYear(), month: targetTime.getMonth() + 1, day: targetTime.getDate(), hour: targetTime.getHours(), minute: targetTime.getMinutes(), second: targetTime.getSeconds() });

      const testId = await Notifications.scheduleNotificationAsync({
        content: {
          title: APP_NAME,
          body: "هذا إشعار تجريبي لوقت الصلاة.",
          sound: Platform.OS === 'ios' ? 'adhan_makki.mp3' : 'default',
          data: { type: 'prayerTime', prayerName: 'اختبار' }
        },
        trigger
      });
      
      console.log("Test main prayer notification scheduled with ID:", testId);
      return testId;
    } catch (error) {
      console.error("Failed to schedule test main prayer notification:", error);
      return null;
    }
  };

  // دالة لاختبار جميع أنواع الإشعارات
  export const testAllNotifications = async () => {
    try {
      console.log("Testing all notification types...");
      
      const results = {
        general: false,
        adhkar: false,
        prePrayer: false,
        mainPrayer: false,
        adhan: false
      };
      
      // اختبار الإشعارات العامة
      try {
        const generalId = await testNotification();
        results.general = !!generalId;
      } catch (error) {
        console.error("General notification test failed:", error);
      }
      
      // اختبار إشعارات الأذكار
      try {
        const adhkarId = await testAdhkarNotification();
        results.adhkar = !!adhkarId;
      } catch (error) {
        console.error("Adhkar notification test failed:", error);
      }
      
      // اختبار إشعارات اقتراب الصلاة
      try {
        const prePrayerId = await testPrePrayerNotification();
        results.prePrayer = !!prePrayerId;
      } catch (error) {
        console.error("Pre-prayer notification test failed:", error);
      }
      
      // اختبار إشعارات الصلاة الرئيسية
      try {
        const mainPrayerId = await testMainPrayerNotification();
        results.mainPrayer = !!mainPrayerId;
      } catch (error) {
        console.error("Main prayer notification test failed:", error);
      }
      
      // اختبار صوت الأذان
      try {
        const adhanResult = await testAdhanSound();
        results.adhan = adhanResult;
      } catch (error) {
        console.error("Adhan sound test failed:", error);
      }
      
      console.log("All notification tests completed:", results);
      return results;
    } catch (error) {
      console.error("Failed to run all notification tests:", error);
      return null;
    }
  };

  // دالة اختبار شاملة للتأكد من جميع الوظائف
  export const comprehensiveSystemTest = async () => {
    try {
      console.log("=== بدء اختبار شامل للنظام ===");
      
      const results = {
        channels: false,
        permissions: false,
        prayerNotifications: false,
        prePrayerNotifications: false,
        adhkarNotifications: false,
        adhanSound: false,
        settings: false,
        errors: []
      };
      
      // 1. اختبار قنوات الإشعارات
      try {
        if (Platform.OS === 'android') {
          const channels = await Notifications.getNotificationChannelsAsync();
          const requiredChannels = ['default', 'adhkar_channel', 'adhan_channel', 'pre_prayer_reminder_channel'];
          const hasAllChannels = requiredChannels.every(channel => 
            channels.some(c => c.id === channel)
          );
          results.channels = hasAllChannels;
          console.log(`Notification channels test: ${hasAllChannels ? 'PASS' : 'FAIL'}`);
          console.log("Available channels:", channels.map(c => c.id));
        } else {
          results.channels = true; // iOS لا يحتاج قنوات
        }
      } catch (error) {
        console.error("Channels test failed:", error);
        results.errors.push(`Channels: ${error}`);
      }
      
      // 2. اختبار الصلاحيات
      try {
        const permissions = await Notifications.getPermissionsAsync();
        results.permissions = permissions.status === 'granted';
        console.log(`Permissions test: ${results.permissions ? 'PASS' : 'FAIL'} - ${permissions.status}`);
      } catch (error) {
        console.error("Permissions test failed:", error);
        results.errors.push(`Permissions: ${error}`);
      }
      
      // 3. اختبار إشعارات الصلاة
      try {
        const now = new Date();
        const targetTime = new Date(now.getTime() + (5 * 1000));
        
        const secondsUntil = Math.max(1, Math.ceil((targetTime.getTime() - Date.now()) / 1000));
        const trigger = Platform.OS === 'android' ?
          ({ type: 'timeInterval' as any, seconds: secondsUntil, repeats: false, channelId: 'adhan_channel' }) :
          ({ type: 'calendar' as any, year: targetTime.getFullYear(), month: targetTime.getMonth() + 1, day: targetTime.getDate(), hour: targetTime.getHours(), minute: targetTime.getMinutes(), second: targetTime.getSeconds() });

        const testPrayerId = await Notifications.scheduleNotificationAsync({
          content: {
            title: APP_NAME,
            body: "اختبار إشعار الصلاة",
            sound: Platform.OS === 'ios' ? 'adhan_makki.mp3' : 'default',
            data: { type: 'prayerTime', prayerName: 'test' }
          },
          trigger
        });
        results.prayerNotifications = !!testPrayerId;
        console.log(`Prayer notifications test: ${results.prayerNotifications ? 'PASS' : 'FAIL'}`);
        
        // إلغاء الإشعار التجريبي
        if (testPrayerId) {
          await Notifications.cancelScheduledNotificationAsync(testPrayerId);
        }
      } catch (error) {
        console.error("Prayer notifications test failed:", error);
        results.errors.push(`Prayer notifications: ${error}`);
      }
      
      // 4. اختبار إشعارات اقتراب الصلاة
      try {
        const now = new Date();
        const targetTime = new Date(now.getTime() + (10 * 1000));
        
        const secondsUntilPre = Math.max(1, Math.ceil((targetTime.getTime() - Date.now()) / 1000));
        const triggerPre = Platform.OS === 'android' ?
          ({ type: 'timeInterval' as any, seconds: secondsUntilPre, repeats: false, channelId: 'pre_prayer_reminder_channel' }) :
          ({ type: 'calendar' as any, year: targetTime.getFullYear(), month: targetTime.getMonth() + 1, day: targetTime.getDate(), hour: targetTime.getHours(), minute: targetTime.getMinutes(), second: targetTime.getSeconds() });

        const testPreId = await Notifications.scheduleNotificationAsync({
          content: {
            title: APP_NAME,
            body: "اختبار إشعار اقتراب الصلاة",
            sound: 'default',
            data: { type: 'prePrayer', prayerName: 'test' }
          },
          trigger: triggerPre
        });
        results.prePrayerNotifications = !!testPreId;
        console.log(`Pre-prayer notifications test: ${results.prePrayerNotifications ? 'PASS' : 'FAIL'}`);
        
        // إلغاء الإشعار التجريبي
        if (testPreId) {
          await Notifications.cancelScheduledNotificationAsync(testPreId);
        }
      } catch (error) {
        console.error("Pre-prayer notifications test failed:", error);
        results.errors.push(`Pre-prayer notifications: ${error}`);
      }
      
      // 5. اختبار إشعارات الأذكار
      try {
        const now = new Date();
        const targetTime = new Date(now.getTime() + (15 * 1000));
        
        const secondsUntilAdhkar = Math.max(1, Math.ceil((targetTime.getTime() - Date.now()) / 1000));
        const triggerAdhkar = Platform.OS === 'android' ?
          ({ type: 'timeInterval' as any, seconds: secondsUntilAdhkar, repeats: false, channelId: 'adhkar_channel' }) :
          ({ type: 'calendar' as any, year: targetTime.getFullYear(), month: targetTime.getMonth() + 1, day: targetTime.getDate(), hour: targetTime.getHours(), minute: targetTime.getMinutes(), second: targetTime.getSeconds() });

        const testAdhkarId = await Notifications.scheduleNotificationAsync({
          content: {
            title: `تذكير أذكار - ${APP_NAME}`,
            body: "اختبار تذكير الأذكار",
            sound: 'default',
            data: { type: 'adhkarReminder', categoryId: 'test', categoryName: 'اختبار' }
          },
          trigger: triggerAdhkar
        });
        results.adhkarNotifications = !!testAdhkarId;
        console.log(`Adhkar notifications test: ${results.adhkarNotifications ? 'PASS' : 'FAIL'}`);
        
        // إلغاء الإشعار التجريبي
        if (testAdhkarId) {
          await Notifications.cancelScheduledNotificationAsync(testAdhkarId);
        }
      } catch (error) {
        console.error("Adhkar notifications test failed:", error);
        results.errors.push(`Adhkar notifications: ${error}`);
      }
      
      // 6. اختبار صوت الأذان
      try {
        const adhanResult = await playAdhanSound();
        results.adhanSound = adhanResult;
        console.log(`Adhan sound test: ${results.adhanSound ? 'PASS' : 'FAIL'}`);
      } catch (error) {
        console.error("Adhan sound test failed:", error);
        results.errors.push(`Adhan sound: ${error}`);
      }
      
      // 7. اختبار الإعدادات
      try {
        const settingsJson = await AsyncStorage.getItem(ASYNC_STORAGE_NOTIFICATION_SETTINGS_KEY);
        const settings = settingsJson ? JSON.parse(settingsJson) : null;
        results.settings = !!settings && typeof settings === 'object';
        console.log(`Settings test: ${results.settings ? 'PASS' : 'FAIL'}`);
        if (settings) {
          console.log("Current settings:", settings);
        }
      } catch (error) {
        console.error("Settings test failed:", error);
        results.errors.push(`Settings: ${error}`);
      }
      
      // حساب النتيجة الإجمالية
      const totalTests = Object.keys(results).filter(key => key !== 'errors').length;
      const passedTests = Object.keys(results).filter(key => key !== 'errors' && results[key as keyof typeof results] === true).length;
      const successRate = (passedTests / totalTests) * 100;
      
      console.log("=== نتائج الاختبار الشامل ===");
      console.log(`إجمالي الاختبارات: ${totalTests}`);
      console.log(`الاختبارات الناجحة: ${passedTests}`);
      console.log(`معدل النجاح: ${successRate.toFixed(1)}%`);
      
      if (results.errors.length > 0) {
        console.log("الأخطاء:", results.errors);
      }
      
      console.log("=== انتهاء الاختبار الشامل ===");
      
      return {
        ...results,
        totalTests,
        passedTests,
        successRate
      };
    } catch (error) {
      console.error("Comprehensive system test failed:", error);
      return {
        errors: [`System test failed: ${error}`],
        totalTests: 0,
        passedTests: 0,
        successRate: 0
      };
    }
  };

  // Immediate quick test: recreate a fresh adhan channel and schedule a 7s notification
  export const testImmediateAdhanChannel = async (soundName?: string) => {
    try {
      const selected = soundName || await getSelectedAdhanSoundFileName();
      console.log('Running immediate adhan channel test with sound:', selected);

      if (Platform.OS === 'android') {
        const channelId = 'adhan_channel_test_v1';

        try {
          await Notifications.deleteNotificationChannelAsync(channelId);
        } catch (e) {
          // ignore
        }

        await Notifications.setNotificationChannelAsync(channelId, {
          name: 'أذان - اختبار سريع',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 500, 250, 500],
          lightColor: '#C4A052',
          sound: selected,
          bypassDnd: false,
        });

        const channels = await Notifications.getNotificationChannelsAsync();
        console.log('Channels after creating test channel:', channels.map(c => ({ id: c.id, sound: c.sound })));

        const testId = await Notifications.scheduleNotificationAsync({
          content: {
            title: APP_NAME,
            body: 'اختبار صوت الأذان (قناة اختبار)',
            data: { type: 'prayerTime', prayerName: 'test' },
            sound: 'default'
          },
          trigger: { type: 'timeInterval' as any, seconds: 7, repeats: false, channelId }
        });

        console.log('Scheduled immediate test notification with ID:', testId);
        return testId;
      } else {
        // iOS: schedule a short test using the sound filename
        const testId = await Notifications.scheduleNotificationAsync({
          content: {
            title: APP_NAME,
            body: 'اختبار صوت الأذان (iOS)',
            data: { type: 'prayerTime', prayerName: 'test' },
            sound: `${selected}.mp3`
          },
          trigger: { type: 'timeInterval' as any, seconds: 7, repeats: false }
        });
        console.log('Scheduled immediate iOS test notification with ID:', testId);
        return testId;
      }
    } catch (error) {
      console.error('Immediate adhan channel test failed:', error);
      return null;
    }
  };