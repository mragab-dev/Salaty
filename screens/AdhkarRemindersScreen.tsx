import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Switch, Alert, Platform, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications'; // For direct cancellation if needed here, though service is preferred
import { AdhkarReminder, AdhkarCategoryInfo } from '../types';
import { ASYNC_STORAGE_ADHKAR_REMINDERS_KEY } from '../constants';
import { scheduleAdhkarReminder, cancelAdhkarReminder } from '../services/notificationService';
import rawCategoryData from '../assets/data/azkar/category';
import Colors from '../constants/colors';
import LoadingSpinner from '../components/LoadingSpinner';
import { BellIcon, ClockIcon, SparklesIcon } from '../components/Icons';
import { RFValue } from 'react-native-responsive-fontsize';

const AnyFlatList = FlatList as any;

const getAdhkarCategoriesForReminders = (): AdhkarCategoryInfo[] => {
  // Filter for categories that are typically daily, like morning/evening, or allow all
  const commonCategories = ["أذكار الصباح", "أذكار المساء", "أذكار النوم"];
  return rawCategoryData
    .filter(cat => commonCategories.includes(cat.cat_name)) // Or show all: .map(...)
    .map(cat => ({
      id: cat.cat_name,
      name: cat.cat_name,
    }));
};

const AdhkarRemindersScreen: React.FC = () => {
  const [reminders, setReminders] = useState<AdhkarReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [availableCategories] = useState<AdhkarCategoryInfo[]>(getAdhkarCategoriesForReminders());

  const loadReminders = useCallback(async () => {
    setLoading(true);
    try {
      const storedRemindersJson = await AsyncStorage.getItem(ASYNC_STORAGE_ADHKAR_REMINDERS_KEY);
      let storedReminders: AdhkarReminder[] = [];
      if (storedRemindersJson) {
        storedReminders = JSON.parse(storedRemindersJson);
      }

      // Initialize reminders for all available categories if not already present
      const initializedReminders = availableCategories.map(category => {
        const existing = storedReminders.find(r => r.categoryId === category.id);
        return existing || {
          categoryId: category.id,
          categoryName: category.name,
          isEnabled: false,
          time: category.id === "أذكار الصباح" ? "07:00" : category.id === "أذكار المساء" ? "18:00" : "22:00", // Default times
          notificationId: undefined,
        };
      });
      setReminders(initializedReminders);
    } catch (e) {
      console.error("Failed to load Adhkar reminders:", e);
      Alert.alert("خطأ", "لم نتمكن من تحميل إعدادات تذكيرات الأذكار.");
    } finally {
      setLoading(false);
    }
  }, [availableCategories]);

  useEffect(() => {
    loadReminders();
  }, [loadReminders]);

  const saveReminders = async (updatedReminders: AdhkarReminder[]) => {
    try {
      await AsyncStorage.setItem(ASYNC_STORAGE_ADHKAR_REMINDERS_KEY, JSON.stringify(updatedReminders));
      setReminders(updatedReminders); // Update local state
    } catch (e) {
      console.error("Failed to save Adhkar reminders:", e);
      Alert.alert("خطأ", "لم نتمكن من حفظ إعدادات تذكيرات الأذكار.");
    }
  };

  const handleToggleReminder = async (categoryId: string, isEnabled: boolean) => {
    const reminderIndex = reminders.findIndex(r => r.categoryId === categoryId);
    if (reminderIndex === -1) return;

    const updatedReminders = [...reminders];
    const reminderToUpdate = { ...updatedReminders[reminderIndex], isEnabled };

    if (reminderToUpdate.notificationId) {
      await cancelAdhkarReminder(reminderToUpdate.notificationId);
      reminderToUpdate.notificationId = undefined;
    }

    if (isEnabled) {
      const newNotificationId = await scheduleAdhkarReminder(reminderToUpdate);
      reminderToUpdate.notificationId = newNotificationId || undefined;
    }
    
    updatedReminders[reminderIndex] = reminderToUpdate;
    saveReminders(updatedReminders);
  };

  const handleChangeTime = (categoryId: string) => {
    const reminder = reminders.find(r => r.categoryId === categoryId);
    if (!reminder) return;

    Alert.prompt(
      `ضبط وقت تذكير ${reminder.categoryName}`,
      "أدخل الوقت بصيغة HH:MM (نظام 24 ساعة)",
      [
        { text: "إلغاء", style: "cancel" },
        {
          text: "ضبط",
          onPress: async (timeInput) => {
            if (timeInput) {
              const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
              if (timeRegex.test(timeInput)) {
                const reminderIndex = reminders.findIndex(r => r.categoryId === categoryId);
                if (reminderIndex === -1) return;

                const updatedReminders = [...reminders];
                const reminderToUpdate = { ...updatedReminders[reminderIndex], time: timeInput, isEnabled: true }; // Enable if time is set

                if (reminderToUpdate.notificationId) {
                  await cancelAdhkarReminder(reminderToUpdate.notificationId);
                }
                const newNotificationId = await scheduleAdhkarReminder(reminderToUpdate);
                reminderToUpdate.notificationId = newNotificationId || undefined;
                
                updatedReminders[reminderIndex] = reminderToUpdate;
                saveReminders(updatedReminders);

              } else {
                Alert.alert("صيغة خاطئة", "الرجاء إدخال الوقت بصيغة HH:MM الصحيحة (مثال: 07:00 أو 18:30).");
              }
            }
          },
        },
      ],
      "plain-text",
      reminder.time // Default value in prompt
    );
  };
  
  const renderReminderItem = ({ item }: { item: AdhkarReminder }) => (
    <View style={styles.reminderItem}>
      <View style={styles.reminderInfo}>
        <Text style={styles.categoryName}>{item.categoryName}</Text>
        {item.isEnabled && <Text style={styles.reminderTimeText}>الوقت: {item.time}</Text>}
      </View>
      <View style={styles.reminderControls}>
        <TouchableOpacity 
            onPress={() => handleChangeTime(item.categoryId)} 
            style={[styles.timeButton, !item.isEnabled && styles.timeButtonDisabled]}
            disabled={!item.isEnabled}
        >
            <ClockIcon size={RFValue(18)} color={item.isEnabled ? Colors.primary : Colors.textLight} />
            <Text style={[styles.timeButtonText, !item.isEnabled && styles.disabledText]}>تغيير الوقت</Text>
        </TouchableOpacity>
        <Switch
          trackColor={{ false: Colors.grayDark, true: Colors.secondary }}
          thumbColor={item.isEnabled ? Colors.primary : Colors.moonlight}
          ios_backgroundColor="#3e3e3e"
          onValueChange={(value) => handleToggleReminder(item.categoryId, value)}
          value={item.isEnabled}
        />
      </View>
    </View>
  );

  if (loading) {
    return <LoadingSpinner text="جاري تحميل إعدادات التذكيرات..." style={styles.loadingContainer} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
         <SparklesIcon color={Colors.secondary} width={RFValue(28)} height={RFValue(28)} />
        <Text style={styles.headerTitle}>تذكيرات الأذكار اليومية</Text>
      </View>
      <Text style={styles.infoText}>
        قم بتفعيل وضبط التوقيت اليومي لتذكيرك بقراءة فئات الأذكار الهامة.
      </Text>
      <AnyFlatList
        data={reminders}
        renderItem={renderReminderItem}
        keyExtractor={(item: AdhkarReminder) => item.categoryId}
        ListEmptyComponent={<Text style={styles.emptyListText}>لا توجد فئات أذكار متاحة للتذكير.</Text>}
        contentContainerStyle={styles.listContent}
      />
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
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: RFValue(15),
    paddingHorizontal: RFValue(20),
    borderBottomWidth: 1,
    borderBottomColor: Colors.secondaryLight,
  },
  headerTitle: {
    fontSize: RFValue(22),
    fontWeight: 'bold',
    color: Colors.secondary,
    marginRight: RFValue(10),
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  },
  infoText: {
    fontSize: RFValue(15),
    color: Colors.accent,
    textAlign: 'center',
    paddingHorizontal: RFValue(20),
    paddingVertical: RFValue(15),
    lineHeight: RFValue(22),
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.moonlight,
  },
  listContent: {
    padding: RFValue(10),
  },
  reminderItem: {
    backgroundColor: Colors.white,
    borderRadius: RFValue(10),
    padding: RFValue(15),
    marginBottom: RFValue(12),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reminderInfo: {
    flex: 1,
    alignItems: 'flex-end', // For RTL
  },
  categoryName: {
    fontSize: RFValue(17),
    fontWeight: '600',
    color: Colors.primary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
    marginBottom: RFValue(4),
  },
  reminderTimeText: {
    fontSize: RFValue(14),
    color: Colors.text,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  reminderControls: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  timeButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingVertical: RFValue(6),
    paddingHorizontal: RFValue(10),
    borderRadius: RFValue(15),
    backgroundColor: Colors.secondaryLight,
    marginRight: Platform.OS === 'android' ? RFValue(12) : 0, 
    marginLeft: Platform.OS === 'ios' ? RFValue(12) : 0,
  },
  timeButtonDisabled: {
    backgroundColor: Colors.grayLight,
    opacity: 0.7,
  },
  timeButtonText: {
    color: Colors.primary,
    fontSize: RFValue(13),
    fontWeight: '500',
    marginRight: RFValue(5),
  },
  disabledText: {
    color: Colors.textLight,
  },
  emptyListText: {
    textAlign: 'center',
    fontSize: RFValue(16),
    color: Colors.textLight,
    marginTop: RFValue(30),
  },
});

export default AdhkarRemindersScreen;