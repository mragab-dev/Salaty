import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Animated } from 'react-native';
import { Adhkar } from '../types';
import Colors from '../constants/colors';
import { RFValue } from 'react-native-responsive-fontsize';

interface AdhkarItemProps {
  adhkar: Adhkar;
  onCompleted: () => void; 
}

const AdhkarItem: React.FC<AdhkarItemProps> = ({ adhkar, onCompleted }) => {
  const initialCountRef = useRef(adhkar.count || 0);
  const [count, setCount] = useState(adhkar.count || 0);
  const [completedVisual, setCompletedVisual] = useState(false); 
  const pulseAnim = useRef(new Animated.Value(1)).current; 

  useEffect(() => {
    initialCountRef.current = adhkar.count || 0;
    setCount(adhkar.count || 0);
    setCompletedVisual(false);
  }, [adhkar.id, adhkar.count]); 

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.03, 
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1, 
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);


  const handlePress = () => {
    if (typeof adhkar.count === 'number' && adhkar.count > 0) { 
      if (count > 1) {
        setCount(prev => prev - 1);
      } else if (count === 1) {
        setCount(0);
        setCompletedVisual(true);
        onCompleted(); 
      }
    } else { 
      setCompletedVisual(true);
      onCompleted(); 
    }
  };
  
  const isCountable = typeof adhkar.count === 'number' && adhkar.count > 0;
  const isEffectivelyCompleted = isCountable ? count === 0 : completedVisual;

  const progressPercentage = isCountable && initialCountRef.current > 0 
    ? ((initialCountRef.current - count) / initialCountRef.current) * 100 
    : (isEffectivelyCompleted ? 100 : 0);

  return (
    <Animated.View 
        style={[
            styles.adhkarItem, 
            isEffectivelyCompleted && styles.adhkarItemCompletedVisual,
            { transform: [{ scale: pulseAnim }] } 
        ]}
    >
      <Text style={styles.adhkarArabicText}>{adhkar.arabic}</Text>
      {adhkar.translation && <Text style={styles.adhkarTranslationText}>{adhkar.translation}</Text>}
      {adhkar.reference && <Text style={styles.adhkarReferenceText}>{adhkar.reference}</Text>}
      
      {isCountable && initialCountRef.current > 0 && (
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBarFill, { width: `${progressPercentage}%` }]} />
        </View>
      )}

      <TouchableOpacity
        onPress={handlePress}
        disabled={isCountable && count === 0} 
        style={[
            styles.adhkarButton, 
            (isCountable && count === 0) ? styles.adhkarButtonDisabled : {},
            (!isCountable && completedVisual) ? styles.adhkarButtonDoneNonCountable : {}
        ]}
        activeOpacity={0.7}
      >
        <Text style={styles.adhkarButtonText}>
          {isCountable ? 
            (count === 0 ? `أكملت (${adhkar.count})` : `تبقى (${count})`) : 
            (completedVisual ? 'تمت القراءة ✓' : 'تعليم كمقروء')}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  adhkarItem: {
    backgroundColor: Colors.white,
    padding: RFValue(16),
    borderRadius: RFValue(10),
    marginBottom: RFValue(12),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
    borderLeftWidth: 5,
    borderLeftColor: Colors.secondary, 
  },
  adhkarItemCompletedVisual: { 
    backgroundColor: `rgba(${parseInt(Colors.success.slice(1,3),16)}, ${parseInt(Colors.success.slice(3,5),16)}, ${parseInt(Colors.success.slice(5,7),16)}, 0.08)`, 
    borderLeftColor: Colors.success, 
  },
  adhkarArabicText: {
    fontSize: RFValue(Platform.OS === 'ios' ? 19 : 18),
    color: Colors.arabicText,
    textAlign: 'right',
    marginBottom: RFValue(10),
    fontFamily: 'AmiriQuran-Regular',
    lineHeight: RFValue(Platform.OS === 'ios' ? 34 : 32),
  },
  adhkarTranslationText: {
    fontSize: RFValue(Platform.OS === 'ios' ? 15 : 14),
    color: Colors.accent,
    fontStyle: 'italic',
    textAlign: 'right',
    marginBottom: RFValue(8),
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    lineHeight: RFValue(22),
  },
  adhkarReferenceText: {
    fontSize: RFValue(Platform.OS === 'ios' ? 13 : 12),
    color: Colors.textLight,
    textAlign: 'right',
    marginBottom: RFValue(12),
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  progressBarContainer: {
    height: RFValue(8),
    backgroundColor: Colors.moonlight,
    borderRadius: RFValue(4),
    overflow: 'hidden',
    marginBottom: RFValue(12),
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.secondary,
    borderRadius: RFValue(4),
  },
  adhkarButton: {
    backgroundColor: Colors.primary,
    paddingVertical: RFValue(10),
    paddingHorizontal: RFValue(16),
    borderRadius: RFValue(8),
    alignItems: 'center',
    alignSelf: 'flex-start', 
  },
  adhkarButtonDisabled: { 
    backgroundColor: Colors.grayMedium,
    opacity: 0.7,
  },
  adhkarButtonDoneNonCountable: { 
    backgroundColor: Colors.success, 
  },
  adhkarButtonText: {
    color: Colors.white,
    fontWeight: '600',
    fontSize: RFValue(14),
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  },
});

export default AdhkarItem;
