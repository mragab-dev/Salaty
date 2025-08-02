
import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment-timezone';
import { ActivityLog, ActivityType, AdhkarCompletedLog, QuranReadSessionLog, TasbihSetCompletedLog } from '../types';
import { ASYNC_STORAGE_ACTIVITY_LOGS_KEY } from '../constants';

const MAX_LOG_AGE_DAYS = 7; // Keep logs for 7 days

export const logActivity = async (
  type: ActivityType, 
  details: Omit<ActivityLog, 'id' | 'timestamp' | 'date' | 'type'>
): Promise<void> => {
  try {
    const now = new Date();
    const newLog: ActivityLog = {
      id: `${now.getTime()}-${Math.random().toString(36).substring(2, 9)}`,
      type,
      timestamp: now.getTime(),
      date: moment(now).format('YYYY-MM-DD'), // Use moment for local timezone date string
      ...details,
    } as ActivityLog; // Type assertion to satisfy specific log types

    const existingLogsJson = await AsyncStorage.getItem(ASYNC_STORAGE_ACTIVITY_LOGS_KEY);
    let logs: ActivityLog[] = existingLogsJson ? JSON.parse(existingLogsJson) : [];
    
    logs.unshift(newLog); // Add new log to the beginning

    // Keep logs sorted by timestamp descending and filter old logs
    logs.sort((a, b) => b.timestamp - a.timestamp);
    const cutoffTimestamp = new Date().setDate(new Date().getDate() - MAX_LOG_AGE_DAYS);
    logs = logs.filter(log => log.timestamp >= cutoffTimestamp);

    await AsyncStorage.setItem(ASYNC_STORAGE_ACTIVITY_LOGS_KEY, JSON.stringify(logs));
    console.log('Activity logged:', newLog.type, newLog.id);
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
};

export const getLogs = async (): Promise<ActivityLog[]> => {
  try {
    const logsJson = await AsyncStorage.getItem(ASYNC_STORAGE_ACTIVITY_LOGS_KEY);
    if (!logsJson) return [];
    
    let logs: ActivityLog[] = JSON.parse(logsJson);
    
    // Filter old logs again just in case some persisted
    const cutoffTimestamp = new Date().setDate(new Date().getDate() - MAX_LOG_AGE_DAYS);
    logs = logs.filter(log => log.timestamp >= cutoffTimestamp);
    
    // Ensure they are sorted, newest first
    logs.sort((a, b) => b.timestamp - a.timestamp);
    
    return logs;
  } catch (error) {
    console.error('Failed to get activity logs:', error);
    return [];
  }
};

// Helper to check if a specific type of activity has been logged today
// Useful for activities that should only be logged once per day (e.g., Quran reading session)
export const hasLoggedToday = async (type: ActivityType): Promise<boolean> => {
  try {
    const logs = await getLogs();
    const todayStr = moment().format('YYYY-MM-DD'); // Use moment for local timezone date
    return logs.some(log => log.type === type && log.date === todayStr);
  } catch (error) {
    console.error(`Failed to check if ${type} was logged today:`, error);
    return false; 
  }
};
