import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, Platform, TouchableOpacity, ScrollView } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { getLogs } from '../services/activityLogService';
import { ActivityLog, AdhkarCompletedLog, QuranReadSessionLog, TasbihSetCompletedLog, ActivityType, MemorizationTestCompletedLog } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import Colors from '../constants/colors';
import { BookOpenIcon, SparklesIcon, RepeatIcon, ChartBarIcon, SunIcon, MoonIcon, SunsetIcon, CheckmarkIcon as OriginalCheckmarkIcon, PencilIcon } from '../components/Icons';
import moment from 'moment-timezone';
import 'moment/locale/ar';
import { Flame, Star } from 'lucide-react-native';
import { RFValue } from 'react-native-responsive-fontsize';
import AppHeader from '../components/AppHeader';

moment.locale('ar'); // Set locale to Arabic for all date formatting in this screen

const AnyFlatList = FlatList as any;

// Define a simple Checkmark for completed items
const Checkmark: React.FC<{ color?: string, size?: number }> = ({ color = Colors.success, size = 24 }) => (
  <OriginalCheckmarkIcon color={color} size={RFValue(size)} />
);

interface TrackableActivity {
  id: string;
  title: string;
  icon: React.FC<import('../components/Icons').IconProps>;
  logType: ActivityType;
  logMatcher?: (log: ActivityLog) => boolean;
}

const TRACKABLE_ACTIVITIES: TrackableActivity[] = [
  { id: 'morning_adhkar', title: 'أذكار الصباح', icon: SunIcon, logType: 'adhkar_completed', logMatcher: (log) => (log as AdhkarCompletedLog).categoryName === "أذكار الصباح" },
  { id: 'evening_adhkar', title: 'أذكار المساء', icon: MoonIcon, logType: 'adhkar_completed', logMatcher: (log) => (log as AdhkarCompletedLog).categoryName === "أذكار المساء" },
  { id: 'sleep_adhkar', title: 'أذكار النوم', icon: SunsetIcon, logType: 'adhkar_completed', logMatcher: (log) => (log as AdhkarCompletedLog).categoryName === "أذكار النوم" },
  { id: 'quran_reading', title: 'قراءة القرآن', icon: BookOpenIcon, logType: 'quran_read_session' },
  { id: 'tasbih_completion', title: 'إتمام دورة تسبيح', icon: RepeatIcon, logType: 'tasbih_set_completed' },
  { id: 'memorization_test', title: 'إتمام اختبار حفظ', icon: PencilIcon, logType: 'memorization_test_completed' },
];

const checkActivityCompletion = (activity: TrackableActivity, logs: ActivityLog[], date: string): boolean => {
    return logs.some(log => {
        if (log.date === date && log.type === activity.logType) {
            return activity.logMatcher ? activity.logMatcher(log) : true;
        }
        return false;
    });
};

const WeeklyProgressGrid: React.FC<{ logs: ActivityLog[], dateRange: string[] }> = ({ logs, dateRange }) => {
    return (
        <View style={styles.weeklyGridContainer}>
            <View style={styles.gridHeaderRow}>
                <View style={styles.gridActivityTitleColumn} />
                {dateRange.map(date => (
                    <Text key={date} style={styles.gridDayHeader}>{moment(date).format('dd')}</Text>
                ))}
            </View>
            {TRACKABLE_ACTIVITIES.map(activity => (
                <View key={activity.id} style={styles.gridRow}>
                    <View style={styles.gridActivityTitleColumn}>
                        <activity.icon color={Colors.primary} size={RFValue(18)} />
                    </View>
                    {dateRange.map(date => {
                        const isCompleted = checkActivityCompletion(activity, logs, date);
                        return (
                            <View key={`${activity.id}-${date}`} style={styles.gridCell}>
                                {isCompleted && <View style={styles.completedDot} />}
                            </View>
                        );
                    })}
                </View>
            ))}
        </View>
    );
};

const ReportsScreen: React.FC = () => {
  const [allLogs, setAllLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>(moment().format('YYYY-MM-DD'));
  const isFocused = useIsFocused();

  const dateRange = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => moment().subtract(i, 'days').format('YYYY-MM-DD')).reverse();
  }, []);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const logs = await getLogs();
    setAllLogs(logs);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isFocused) {
      fetchLogs();
    }
  }, [isFocused, fetchLogs]);
  
  const perfectDays = useMemo(() => {
      const perfectDateSet = new Set<string>();
      dateRange.forEach(date => {
          const completedOnDate = new Set<string>();
          TRACKABLE_ACTIVITIES.forEach(activity => {
              if (checkActivityCompletion(activity, allLogs, date)) {
                  completedOnDate.add(activity.id);
              }
          });
          if (completedOnDate.size === TRACKABLE_ACTIVITIES.length) {
              perfectDateSet.add(date);
          }
      });
      return perfectDateSet;
  }, [allLogs, dateRange]);

  const calculateStreak = useCallback((activity: TrackableActivity): number => {
    let streak = 0;
    for (let i = 0; i < 7; i++) {
        const pastDate = moment(selectedDate).subtract(i, 'days').format('YYYY-MM-DD');
        if (checkActivityCompletion(activity, allLogs, pastDate)) {
            streak++;
        } else {
            break;
        }
    }
    return streak;
  }, [allLogs, selectedDate]);

  const renderDateItem = (dateStr: string) => {
    const dateMoment = moment(dateStr);
    let displayLabel = dateMoment.format('dddd');
    if (dateStr === moment().format('YYYY-MM-DD')) {
      displayLabel = 'اليوم';
    } else if (dateStr === moment().subtract(1, 'days').format('YYYY-MM-DD')) {
      displayLabel = 'الأمس';
    }
    const isPerfect = perfectDays.has(dateStr);

    return (
      <TouchableOpacity
        key={dateStr}
        style={[styles.dateButton, selectedDate === dateStr && styles.dateButtonSelected]}
        onPress={() => setSelectedDate(dateStr)}
      >
        <View style={styles.dateTextContainer}>
            <Text style={[styles.dateButtonText, selectedDate === dateStr && styles.dateButtonTextSelected]}>
                {displayLabel}
            </Text>
            {isPerfect && <Star size={10} color={Colors.white} fill={Colors.white} style={{marginLeft: 4}}/>}
        </View>
        <Text style={[styles.dateButtonSubText, selectedDate === dateStr && styles.dateButtonTextSelected]}>
            {dateMoment.format('D MMM')}
        </Text>
      </TouchableOpacity>
    );
  };
  
  const renderTrackableActivity = ({ item }: { item: TrackableActivity }) => {
    const isCompleted = checkActivityCompletion(item, allLogs, selectedDate);
    const currentStreak = calculateStreak(item);
    const IconComponent = item.icon;
    
    let detailsContent: React.ReactNode = null;

    if (item.id === 'tasbih_completion' && isCompleted) {
        const completedTasbihLogs = allLogs.filter(log => log.date === selectedDate && log.type === 'tasbih_set_completed') as TasbihSetCompletedLog[];
        
        // Aggregate Tasbih logs
        const aggregatedTasbih: { [key: string]: number } = {};
        completedTasbihLogs.forEach(log => {
            if (aggregatedTasbih[log.dhikrName]) {
                aggregatedTasbih[log.dhikrName] += log.count;
            } else {
                aggregatedTasbih[log.dhikrName] = log.count;
            }
        });

        if (Object.keys(aggregatedTasbih).length > 0) {
            detailsContent = (
                <View style={styles.detailsContainer}>
                    {Object.entries(aggregatedTasbih).map(([dhikrName, totalCount]) => (
                        <Text key={dhikrName} style={styles.activityDetailText}>- {dhikrName}: {totalCount} مرة</Text>
                    ))}
                </View>
            );
        }
    } else if (item.id === 'memorization_test' && isCompleted) {
        const completedTestLogs = allLogs.filter(log => log.date === selectedDate && log.type === 'memorization_test_completed') as MemorizationTestCompletedLog[];
        if (completedTestLogs.length > 0) {
            const lastTest = completedTestLogs[0];
            detailsContent = <Text style={styles.activityDetailText}>({lastTest.surahName}: {lastTest.ayahRange})</Text>;
        }
    }

    return (
      <View style={[styles.activityRow, isCompleted && styles.activityRowCompleted]}>
        <View style={styles.activityInfo}>
          <IconComponent color={isCompleted ? Colors.success : Colors.primary} size={RFValue(24)} />
          <View style={styles.activityTitleContainer}>
            <Text style={[styles.activityTitle, isCompleted && styles.activityTitleCompleted]}>{item.title}</Text>
            {detailsContent}
          </View>
        </View>
        <View style={styles.activityStatus}>
            {currentStreak > 1 && (
                <View style={styles.streakIndicator}>
                    <Text style={styles.streakText}>{currentStreak}</Text>
                    <Flame size={RFValue(16)} color={Colors.accent} />
                </View>
            )}
            {isCompleted ? (
              <Checkmark color={Colors.success} size={RFValue(28)} />
            ) : (
              <View style={styles.pendingIndicator} />
            )}
        </View>
      </View>
    );
  };

  if (loading && allLogs.length === 0) {
    return <LoadingSpinner text="جاري تحميل التقارير..." style={styles.centeredMessage} color={Colors.primary} />;
  }

  return (
    <View style={styles.container}>
      <AppHeader />
      <WeeklyProgressGrid logs={allLogs} dateRange={dateRange} />

      <View style={styles.dateSelectorContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateSelectorContent}>
          {dateRange.slice().reverse().map(dateStr => renderDateItem(dateStr))}
        </ScrollView>
      </View>

      <AnyFlatList
        data={TRACKABLE_ACTIVITIES}
        renderItem={renderTrackableActivity}
        keyExtractor={(item: TrackableActivity) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={!loading ? (
            <View style={styles.centeredMessage}>
            <Text style={styles.emptyText}>لا توجد أنشطة مسجلة لهذا اليوم.</Text>
            </View>
        ) : null}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centeredMessage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: RFValue(20),
  },
  headerContainer: {
    backgroundColor: Colors.primary,
    paddingVertical: RFValue(20),
    paddingHorizontal: RFValue(20),
    alignItems: 'center',
    flexDirection: 'row-reverse',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: RFValue(22),
    color: Colors.secondary,
    fontWeight: 'bold',
    marginRight: RFValue(10),
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-bold',
  },
  dateSelectorContainer: {
    paddingVertical: RFValue(10),
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.moonlight,
  },
  dateSelectorContent: {
    paddingHorizontal: RFValue(10),
    alignItems: 'center',
  },
  dateButton: {
    paddingVertical: RFValue(8),
    paddingHorizontal: RFValue(15),
    borderRadius: RFValue(20),
    backgroundColor: Colors.moonlight,
    marginHorizontal: RFValue(5),
    alignItems: 'center',
  },
  dateButtonSelected: {
    backgroundColor: Colors.primary,
  },
  dateTextContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  dateButtonText: {
    color: Colors.primary,
    fontSize: RFValue(14),
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  },
  dateButtonSubText: {
    color: Colors.accent,
    fontSize: RFValue(11),
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  dateButtonTextSelected: {
    color: Colors.white,
  },
  listContainer: {
    padding: RFValue(15),
  },
  activityRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingVertical: RFValue(15),
    paddingHorizontal: RFValue(20),
    borderRadius: RFValue(10),
    marginBottom: RFValue(10),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.moonlight,
  },
  activityRowCompleted: {
    borderColor: Colors.success,
    backgroundColor: `rgba(${parseInt(Colors.success.slice(1,3),16)}, ${parseInt(Colors.success.slice(3,5),16)}, ${parseInt(Colors.success.slice(5,7),16)}, 0.05)`,
  },
  activityInfo: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    flex: 1,
  },
  activityTitleContainer: {
    marginRight: RFValue(12),
    flexShrink: 1, // To prevent pushing content out
  },
  activityTitle: {
    fontSize: RFValue(16),
    color: Colors.text,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  },
  activityTitleCompleted: {
    color: Colors.success,
  },
  detailsContainer: {
    marginTop: RFValue(4),
  },
  activityDetailText: {
    fontSize: RFValue(13),
    color: Colors.textLight,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    textAlign: 'right',
    lineHeight: RFValue(18),
  },
  activityStatus: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  streakIndicator: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginRight: RFValue(10),
    paddingHorizontal: RFValue(6),
    paddingVertical: RFValue(2),
    borderRadius: RFValue(10),
    backgroundColor: `rgba(200, 120, 40, 0.1)`,
  },
  streakText: {
    color: Colors.accent,
    fontSize: RFValue(14),
    fontWeight: 'bold',
    marginRight: RFValue(4),
  },
  pendingIndicator: {
    width: RFValue(24),
    height: RFValue(24),
    borderRadius: RFValue(12),
    borderWidth: 2,
    borderColor: Colors.grayMedium,
    opacity: 0.5,
  },
  emptyText: {
    fontSize: RFValue(17),
    color: Colors.accent,
    textAlign: 'center',
    marginTop: RFValue(30),
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  },
  // Weekly Grid Styles
  weeklyGridContainer: {
    backgroundColor: Colors.primary,
    padding: RFValue(10),
    margin: RFValue(15),
    borderRadius: RFValue(10),
  },
  gridRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  gridHeaderRow: {
    flexDirection: 'row-reverse',
    marginBottom: RFValue(5),
  },
  gridActivityTitleColumn: {
    width: RFValue(30),
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridDayHeader: {
    flex: 1,
    textAlign: 'center',
    color: Colors.moonlight,
    fontSize: RFValue(12),
    fontWeight: 'bold',
  },
  gridCell: {
    flex: 1,
    height: RFValue(25),
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedDot: {
    width: RFValue(10),
    height: RFValue(10),
    borderRadius: RFValue(5),
    backgroundColor: Colors.secondary,
  }
});

export default ReportsScreen;