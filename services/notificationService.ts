import * as Notifications from 'expo-notifications';
import { Platform, Alert } from 'react-native';
import moment from 'moment-timezone';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Prayer, NotificationSettings, PrayerNotificationSettings, AdhanSoundOption, AdhkarReminder } from '../types';
import { APP_NAME, ADHAN_SOUND_OPTIONS, ASYNC_STORAGE_ADHKAR_REMINDERS_KEY, ASYNC_STORAGE_PRAYER_NOTIFICATION_IDS_KEY } from '../constants';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true, 
    shouldShowList: true, 
  }),
});

async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
      sound: 'default', 
    });
     await Notifications.setNotificationChannelAsync('adhkar_channel', { // Specific channel for Adhkar
      name: 'Adhkar Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default', // Default sound for Adhkar reminders, can be overridden
      vibrationPattern: [0, 250, 250, 250],
    });
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

const getPrayerNotificationSoundFile = (soundSetting: NotificationSettings['sound']): string | undefined => {
  const selectedOption = ADHAN_SOUND_OPTIONS.find(opt => opt.id === soundSetting);
  if (selectedOption && selectedOption.fileName) {
    return selectedOption.fileName;
  }
  return 'default'; 
};

export const schedulePrayerNotifications = async (
  prayersToSchedule: Prayer[],
  settings: NotificationSettings
) => {
  // Cancel previous prayer notifications using stored IDs for reliability
  try {
    const storedIdsJson = await AsyncStorage.getItem(ASYNC_STORAGE_PRAYER_NOTIFICATION_IDS_KEY);
    if (storedIdsJson) {
      const ids: string[] = JSON.parse(storedIdsJson);
      if (ids && ids.length > 0) {
        console.log(`Cancelling ${ids.length} previous prayer notifications...`);
        for (const id of ids) {
          await Notifications.cancelScheduledNotificationAsync(id);
        }
      }
    }
  } catch (e) {
    console.error("Failed to cancel previous prayer notifications using stored IDs:", e);
  }

  const newNotificationIds: string[] = [];

  if (!settings.masterEnabled) {
    console.log("Master prayer notifications disabled. No new notifications will be scheduled.");
    await AsyncStorage.setItem(ASYNC_STORAGE_PRAYER_NOTIFICATION_IDS_KEY, JSON.stringify([]));
    return;
  }

  if (Platform.OS === 'web') {
    console.log('Local prayer notifications might have limitations on web. Using default sound behavior.');
  }

  const timezone = moment.tz.guess();
  const nowMoment = moment.tz(timezone);

  for (const prayer of prayersToSchedule) {
    const prayerKey = prayer.name.toLowerCase();
    if (prayerKey === 'sunrise') continue;

    const shouldScheduleThisPrayer = Object.prototype.hasOwnProperty.call(settings.prayers, prayerKey)
      ? settings.prayers[prayerKey as keyof PrayerNotificationSettings]
      : false;

    if (shouldScheduleThisPrayer) {
      if (!prayer.time) {
        console.warn(`Prayer time for ${prayer.arabicName} is undefined. Skipping notification.`);
        continue;
      }
      const prayerTimeMoment = moment.tz(prayer.time, 'hh:mm A', timezone);
      if (!prayerTimeMoment.isValid()) {
          console.warn(`Invalid time format for ${prayer.name}: ${prayer.time}. Skipping notification.`);
          continue;
      }
      
      prayerTimeMoment.year(nowMoment.year()).month(nowMoment.month()).date(nowMoment.date());
      if(prayerTimeMoment.isBefore(nowMoment)) {
        prayerTimeMoment.add(1, 'day');
      }

      // Schedule main prayer notification
      const triggerSeconds = prayerTimeMoment.diff(nowMoment, 'seconds');
      if (triggerSeconds > 0) {
        try {
          const notificationId = await Notifications.scheduleNotificationAsync({
            content: {
              title: APP_NAME,
              body: `حان الآن وقت صلاة ${prayer.arabicName}`,
              sound: getPrayerNotificationSoundFile(settings.sound), 
              data: { type: 'prayerTime', prayerName: prayer.name },
            },
            trigger: { 
              type: 'timeInterval' as any,
              seconds: triggerSeconds, 
              repeats: false 
            },
          });
          newNotificationIds.push(notificationId);
          console.log(`Prayer notification scheduled for ${prayer.arabicName} at ${prayerTimeMoment.format('YYYY-MM-DD HH:mm:ss')} with ID: ${notificationId}`);
        } catch (e) {
          console.error(`Failed to schedule prayer notification for ${prayer.arabicName}:`, e);
        }
      }

      // Schedule pre-prayer reminder if enabled
      if (settings.preNotificationEnabled) {
        const prePrayerTimeMoment = prayerTimeMoment.clone().subtract(settings.preNotificationOffset, 'minutes');
        const preTriggerSeconds = prePrayerTimeMoment.diff(nowMoment, 'seconds');
        if (preTriggerSeconds > 0) {
            try {
                const preNotificationId = await Notifications.scheduleNotificationAsync({
                    content: {
                        title: APP_NAME,
                        body: `اقترب وقت صلاة ${prayer.arabicName}`,
                        sound: 'default',
                        data: { type: 'prePrayerTime', prayerName: prayer.name },
                    },
                    trigger: { 
                      type: 'timeInterval' as any,
                      seconds: preTriggerSeconds, 
                      repeats: false 
                    },
                });
                newNotificationIds.push(preNotificationId);
                console.log(`Pre-prayer notification scheduled for ${prayer.arabicName} at ${prePrayerTimeMoment.format('YYYY-MM-DD HH:mm:ss')} with ID: ${preNotificationId}`);
            } catch (e) {
                console.error(`Failed to schedule pre-prayer notification for ${prayer.arabicName}:`, e);
            }
        }
      }
    }
  }
  
  await AsyncStorage.setItem(ASYNC_STORAGE_PRAYER_NOTIFICATION_IDS_KEY, JSON.stringify(newNotificationIds));
  console.log(`Stored ${newNotificationIds.length} new prayer notification IDs.`);
};

// --- Adhkar Reminder Functions ---

export const scheduleAdhkarReminder = async (reminder: AdhkarReminder): Promise<string | null> => {
  if (!reminder.isEnabled || !reminder.time) return null;

  const [hours, minutes] = reminder.time.split(':').map(Number);
  if (isNaN(hours) || isNaN(minutes)) {
    console.error(`Invalid time format for Adhkar reminder ${reminder.categoryName}: ${reminder.time}`);
    return null;
  }

  try {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `تذكير أذكار - ${APP_NAME}`,
        body: `حان الآن وقت ${reminder.categoryName}. لا تنس قراءتها.`,
        sound: 'default',
        data: {
          type: 'adhkarReminder',
          categoryId: reminder.categoryId,
          categoryName: reminder.categoryName,
        },
      },
      trigger: {
        type: 'calendar' as any,
        hour: hours,
        minute: minutes,
        repeats: true, // Daily repeating
        channelId: Platform.OS === 'android' ? 'adhkar_channel' : undefined,
      },
    });
    console.log(`Adhkar reminder scheduled for ${reminder.categoryName} at ${reminder.time} daily. ID: ${notificationId}`);
    return notificationId;
  } catch (error) {
    console.error(`Failed to schedule Adhkar reminder for ${reminder.categoryName}:`, error);
    return null;
  }
};

export const cancelAdhkarReminder = async (notificationId?: string) => {
  if (notificationId) {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      console.log(`Cancelled Adhkar reminder with ID: ${notificationId}`);
    } catch (error) {
      console.error(`Failed to cancel Adhkar reminder ID ${notificationId}:`, error);
    }
  }
};

export const loadAndRescheduleAllAdhkarReminders = async () => {
  try {
    const storedRemindersJson = await AsyncStorage.getItem(ASYNC_STORAGE_ADHKAR_REMINDERS_KEY);
    if (!storedRemindersJson) {
        console.log("No Adhkar reminders found in storage to reschedule.");
        return;
    }
      
    const reminders: AdhkarReminder[] = JSON.parse(storedRemindersJson);
    const updatedRemindersPromises = reminders.map(async (reminder) => {
      // Always try to cancel the existing notification first to clean up orphans.
      if (reminder.notificationId) {
        await cancelAdhkarReminder(reminder.notificationId);
      }

      // If the reminder is enabled, schedule a new one and store its ID.
      if (reminder.isEnabled) {
        const newNotificationId = await scheduleAdhkarReminder(reminder);
        return { ...reminder, notificationId: newNotificationId || undefined };
      } else {
        // If it's disabled, ensure it has no notificationId.
        return { ...reminder, notificationId: undefined };
      }
    });
      
    const updatedReminders = await Promise.all(updatedRemindersPromises);
    await AsyncStorage.setItem(ASYNC_STORAGE_ADHKAR_REMINDERS_KEY, JSON.stringify(updatedReminders));
    console.log("Adhkar reminders state synchronized on app load/foreground.");

  } catch (error) {
    console.error("Failed to load and reschedule Adhkar reminders:", error);
  }
};

export const cancelAllPrayerNotifications = async () => {
  try {
    const storedIdsJson = await AsyncStorage.getItem(ASYNC_STORAGE_PRAYER_NOTIFICATION_IDS_KEY);
    if (storedIdsJson) {
      const ids: string[] = JSON.parse(storedIdsJson);
      for (const id of ids) {
        await Notifications.cancelScheduledNotificationAsync(id);
      }
    }
    await AsyncStorage.removeItem(ASYNC_STORAGE_PRAYER_NOTIFICATION_IDS_KEY);
    console.log('All prayer notifications have been cancelled.');
  } catch (error) {
    console.error('Error cancelling all prayer notifications:', error);
  }
};