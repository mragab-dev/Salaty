import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { Adhkar } from '../types';
import rawAdhkarData from '../assets/data/azkar/azkar'; 
import AdhkarItem from '../components/AdhkarItem';
import LoadingSpinner from '../components/LoadingSpinner';
import Colors from '../constants/colors';
import { AdhkarStackParamList } from '../App'; 
import { ChevronDownIcon, ChevronUpIcon } from '../components/Icons';
import { logActivity } from '../services/activityLogService';
import { RFValue } from 'react-native-responsive-fontsize';

type AdhkarListScreenRouteProp = RouteProp<AdhkarStackParamList, 'AdhkarList'>;

const AdhkarListScreen: React.FC = () => {
  const route = useRoute<AdhkarListScreenRouteProp>();
  const navigation = useNavigation();
  const { categoryId, categoryName } = route.params;

  const [adhkarForCategory, setAdhkarForCategory] = useState<Adhkar[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  const isCompletedAll = currentIndex >= adhkarForCategory.length;

  useEffect(() => {
    setLoading(true);
    const filteredAdhkar = rawAdhkarData
      .filter(item => item.category === categoryId)
      .map((item, index) => ({
        id: `${item.category}-${index}-${item.zekr.substring(0,10)}-${Math.random()}`, // Ensure more unique ID for re-renders
        category: item.category,
        arabic: item.zekr,
        translation: item.description || undefined,
        reference: item.reference || undefined,
        count: typeof item.count === 'string' && parseInt(item.count, 10) > 0 ? parseInt(item.count, 10) : (typeof item.count === 'number' ? item.count : 0),
      }));
    
    setAdhkarForCategory(filteredAdhkar);
    setCurrentIndex(0); // Reset index when category changes
    setLoading(false);
  }, [categoryId]);

  // Log activity when all adhkar are completed
  useEffect(() => {
    if (isCompletedAll && adhkarForCategory.length > 0) {
      logActivity('adhkar_completed', { categoryName: categoryId });
      console.log(`Activity logged: Adhkar category '${categoryId}' completed.`);
    }
  }, [isCompletedAll, categoryId, adhkarForCategory.length]);


  const handleNextAdhkar = useCallback(() => {
    if (currentIndex < adhkarForCategory.length - 1) {
      setCurrentIndex(prevIndex => prevIndex + 1);
    } else if (currentIndex === adhkarForCategory.length - 1) {
      // Reached the end, but allow showing completion message
      setCurrentIndex(adhkarForCategory.length);
    }
  }, [currentIndex, adhkarForCategory.length]);

  const handlePrevAdhkar = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prevIndex => prevIndex - 1);
    }
  };

  const handleAdhkarCompleted = useCallback(() => {
    // Automatically move to the next Adhkar or completion screen
    if (currentIndex < adhkarForCategory.length - 1) {
      setTimeout(() => { // Add a slight delay for better UX
          setCurrentIndex(prevIndex => prevIndex + 1);
      }, 300);
    } else {
       setTimeout(() => {
        setCurrentIndex(adhkarForCategory.length); // Move to completion state
       }, 300);
    }
  }, [currentIndex, adhkarForCategory.length]);


  if (loading) {
    return <LoadingSpinner text={`جاري تحميل أذكار ${categoryName}...`} style={styles.loadingContainer} />;
  }

  const currentAdhkar = adhkarForCategory[currentIndex];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.categoryTitle}>{categoryName}</Text>
        {!loading && adhkarForCategory.length > 0 && !isCompletedAll && (
          <Text style={styles.progressText}>
            الذكر {currentIndex + 1} من {adhkarForCategory.length}
          </Text>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContentContainer}>
        {currentAdhkar && !isCompletedAll && (
          <View style={styles.contentArea}>
            <AdhkarItem
              adhkar={currentAdhkar}
              onCompleted={handleAdhkarCompleted}
              key={currentAdhkar.id} // Ensures AdhkarItem re-initializes
            />
          </View>
        )}

        {isCompletedAll && adhkarForCategory.length > 0 && (
          <View style={styles.completionContainer}>
            <Text style={styles.completionText}>ما شاء الله، لقد أتممت أذكار هذا القسم!</Text>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.actionButton}>
              <Text style={styles.actionButtonText}>العودة للفئات</Text>
            </TouchableOpacity>
          </View>
        )}

        {!loading && adhkarForCategory.length === 0 && (
          <View style={styles.centeredMessage}>
            <Text style={styles.emptyText}>لا توجد أذكار متاحة حالياً في هذا القسم.</Text>
          </View>
        )}
      </ScrollView>

      {!loading && adhkarForCategory.length > 0 && (
        <View style={styles.navigationFooter}>
          <TouchableOpacity 
            onPress={handlePrevAdhkar} 
            disabled={currentIndex === 0}
            style={[styles.navButtonBase, currentIndex === 0 && styles.navButtonDisabled]}
          >
            <ChevronUpIcon color={currentIndex === 0 ? Colors.grayMedium : Colors.white} size={RFValue(20)}/>
            <Text style={[styles.navButtonText, currentIndex === 0 && styles.disabledText]}>السابق</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={handleNextAdhkar} 
            disabled={isCompletedAll || currentIndex === adhkarForCategory.length -1 && !currentAdhkar} // Disable if on last item and not yet in completion state or actually completed all
            style={[styles.navButtonBase, (isCompletedAll || currentIndex === adhkarForCategory.length -1 && !currentAdhkar) && styles.navButtonDisabled]}
          >
            <Text style={[styles.navButtonText, (isCompletedAll || currentIndex === adhkarForCategory.length -1 && !currentAdhkar) && styles.disabledText]}>التالي</Text>
            <ChevronDownIcon color={(isCompletedAll || currentIndex === adhkarForCategory.length -1 && !currentAdhkar) ? Colors.grayMedium : Colors.white} size={RFValue(20)}/>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundDark, 
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.backgroundDark,
  },
  header: {
    paddingVertical: RFValue(15),
    paddingHorizontal: RFValue(20),
    backgroundColor: Colors.primary, 
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.secondaryLight,
  },
  categoryTitle: {
    fontSize: RFValue(22),
    fontWeight: 'bold',
    color: Colors.secondary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
    marginBottom: RFValue(5),
  },
  progressText: {
    fontSize: RFValue(15),
    color: Colors.moonlight,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  scrollContentContainer: {
    flexGrow: 1, // Allows ScrollView to take space for centering completion message
    padding: RFValue(15),
  },
  contentArea: {
    flex: 1, // Allow AdhkarItem to take available space
  },
  centeredMessage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: RFValue(17),
    color: Colors.moonlight,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  completionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: RFValue(20),
  },
  completionText: {
    fontSize: RFValue(20),
    fontWeight: 'bold',
    color: Colors.secondary,
    textAlign: 'center',
    marginBottom: RFValue(25),
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  },
  actionButton: {
    backgroundColor: Colors.secondary,
    paddingVertical: RFValue(12),
    paddingHorizontal: RFValue(30),
    borderRadius: RFValue(8),
  },
  actionButtonText: {
    color: Colors.primary,
    fontSize: RFValue(16),
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  },
  navigationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: RFValue(12),
    paddingHorizontal: RFValue(20),
    backgroundColor: Colors.primary, 
    borderTopWidth: 1,
    borderTopColor: Colors.secondaryLight,
  },
  navButtonBase: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: RFValue(8),
    paddingHorizontal: RFValue(15),
    backgroundColor: Colors.secondary,
    borderRadius: RFValue(20),
  },
  navButtonText: {
    color: Colors.primary,
    fontSize: RFValue(16),
    fontWeight: '600',
    marginHorizontal: RFValue(8),
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  },
  navButtonDisabled: {
    backgroundColor: Colors.primaryLight, // Darker shade for disabled
    opacity: 0.7,
  },
  disabledText: {
    color: Colors.grayMedium,
  }
});

export default AdhkarListScreen;