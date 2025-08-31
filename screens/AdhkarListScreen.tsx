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
import AppHeader from '../components/AppHeader';

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
        id: `${item.category}-${index}-${item.zekr.substring(0, 10)}`, // Stable ID
        category: item.category,
        arabic: item.zekr,
        translation: item.description || undefined,
        reference: item.reference || undefined,
        count: typeof item.count === 'string' && parseInt(item.count, 10) > 0 ? parseInt(item.count, 10) : (typeof item.count === 'number' ? item.count : 0),
        fadl: item.description,
      }));
    
    setAdhkarForCategory(filteredAdhkar);
    setCurrentIndex(0);
    setLoading(false);
  }, [categoryId]);

  useEffect(() => {
    if (isCompletedAll && adhkarForCategory.length > 0) {
      logActivity('adhkar_completed', { categoryName: categoryId });
      console.log(`Activity logged: Adhkar category '${categoryId}' completed.`);
    }
  }, [isCompletedAll, categoryId, adhkarForCategory.length]);

  const handleNextAdhkar = useCallback(() => {
    if (currentIndex < adhkarForCategory.length) {
      setCurrentIndex(prevIndex => prevIndex + 1);
    }
  }, [currentIndex, adhkarForCategory.length]);

  const handlePrevAdhkar = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prevIndex => prevIndex - 1);
    }
  };

  const handleAdhkarCompleted = useCallback(() => {
    if (currentIndex < adhkarForCategory.length - 1) {
      setTimeout(() => setCurrentIndex(prevIndex => prevIndex + 1), 300);
    } else {
       setTimeout(() => setCurrentIndex(adhkarForCategory.length), 300);
    }
  }, [currentIndex, adhkarForCategory.length]);

  if (loading) {
    return <LoadingSpinner text={`جاري تحميل أذكار ${categoryName}...`} style={styles.loadingContainer} color={Colors.secondary} />;
  }

  const currentAdhkar = adhkarForCategory[currentIndex];

  return (
    <View style={styles.container}>
      <AppHeader title={categoryName} />
      <View style={styles.header}>
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
              key={currentAdhkar.id}
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
            <ChevronUpIcon color={currentIndex === 0 ? Colors.grayMedium : Colors.primary} size={RFValue(20)}/>
            <Text style={[styles.navButtonText, currentIndex === 0 && styles.disabledText]}>السابق</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={handleNextAdhkar} 
            disabled={isCompletedAll}
            style={[styles.navButtonBase, isCompletedAll && styles.navButtonDisabled]}
          >
            <Text style={[styles.navButtonText, isCompletedAll && styles.disabledText]}>التالي</Text>
            <ChevronDownIcon color={isCompletedAll ? Colors.grayMedium : Colors.primary} size={RFValue(20)}/>
          </TouchableOpacity>
        </View>
      )}
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
    paddingBottom: RFValue(10),
    paddingHorizontal: RFValue(20),
    backgroundColor: Colors.background,
    alignItems: 'center',
  },
  progressText: {
    fontSize: RFValue(15),
    color: Colors.accent,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  scrollContentContainer: {
    flexGrow: 1,
    padding: RFValue(15),
  },
  contentArea: {
    flex: 1,
  },
  centeredMessage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: RFValue(17),
    color: Colors.textLight,
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
    color: Colors.primary,
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
  },
  navigationFooter: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: RFValue(12),
    paddingHorizontal: RFValue(20),
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.moonlight,
  },
  navButtonBase: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingVertical: RFValue(8),
    paddingHorizontal: RFValue(15),
    backgroundColor: Colors.white,
    borderRadius: RFValue(20),
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  navButtonText: {
    color: Colors.primary,
    fontSize: RFValue(16),
    fontWeight: '600',
    marginHorizontal: RFValue(8),
  },
  navButtonDisabled: {
    borderColor: Colors.grayMedium,
    opacity: 0.7,
  },
  disabledText: {
    color: Colors.grayMedium,
  }
});

export default AdhkarListScreen;
