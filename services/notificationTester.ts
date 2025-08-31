import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  APP_NAME,
  ADHAN_SOUND_OPTIONS,
  ASYNC_STORAGE_NOTIFICATION_SETTINGS_KEY,
  DEFAULT_NOTIFICATION_SETTINGS,
} from '../constants';
import { NotificationSettings } from '../types';

const getSelectedAdhanSoundFileNameForTest = async (returnExtension: boolean = false): Promise<string> => {
  try {
    const settingsJson = await AsyncStorage.getItem(ASYNC_STORAGE_NOTIFICATION_SETTINGS_KEY);
    const settings: NotificationSettings = settingsJson ? JSON.parse(settingsJson) : DEFAULT_NOTIFICATION_SETTINGS;
    if (settings.sound && settings.sound !== 'default') {
      const soundOption = ADHAN_SOUND_OPTIONS.find(opt => opt.id === settings.sound);
      if (soundOption && soundOption.fileName) {
        return returnExtension ? soundOption.fileName : soundOption.fileName.replace('.mp3', '');
      }
    }
  } catch (e) {
    console.error("Failed to get selected adhan sound for test, using default.", e);
  }
  return 'adhan_makki.mp3';
};

export const testAllNotificationTypes = async (): Promise<boolean> => {
  try {
    const selectedSound = await getSelectedAdhanSoundFileNameForTest(true);

    // Test 1: Adhan Notification (after 5s)
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `${APP_NAME} (اختبار)`,
        body: `حان الآن وقت صلاة العشاء (تجريبي)`,
        sound: selectedSound,
        data: { type: 'testPrayerTime' },
      },
      trigger: {
        seconds: 5,
        channelId: 'adhan_channel',
      },
    });

    // Test 2: Pre-Prayer Notification (after 10s)
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `${APP_NAME} (اختبار)`,
        body: `اقترب وقت صلاة العشاء (تجريبي)`,
        sound: 'default',
        data: { type: 'testPrePrayer' },
      },
      trigger: {
        seconds: 10,
        channelId: 'pre_prayer_reminder_channel',
      },
    });

    // Test 3: Adhkar Notification (after 15s)
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `تذكير أذكار - ${APP_NAME} (اختبار)`,
        body: `حان الآن وقت أذكار المساء (تجريبي)`,
        sound: 'default',
        data: { type: 'testAdhkarReminder' },
      },
      trigger: {
        seconds: 15,
        channelId: 'adhkar_channel',
      },
    });

    console.log("Scheduled all test notifications successfully.");
    return true;
  } catch (error) {
    console.error("Failed to schedule comprehensive test notifications:", error);
    return false;
  }
};

export const getAllScheduledNotifications = async (): Promise<string> => {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    let result = `إجمالي الإشعارات المجدولة: ${scheduled.length}\n\n`;
    scheduled.forEach(notif => {
      const trigger = notif.trigger as any;
      const triggerDate = trigger.value ? new Date(trigger.value).toLocaleString() : 'N/A';
      result += `- ${notif.content.body} @ ${triggerDate} (القناة: ${trigger.channelId})\n`;
    });
    return result;
  } catch (error: any) {
    console.error("Failed to get all scheduled notifications:", error);
    return `خطأ في جلب الإشعارات: ${error.message}`;
  }
};
