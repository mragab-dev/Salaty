// components/PrayerCard.tsx
import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Colors from '../constants/colors';
import { ClockIcon } from './Icons'; 
import { RFValue } from 'react-native-responsive-fontsize';

export interface Prayer {
  id: string;
  name: string; 
  nameArabic: string; 
  time: string; 
}

interface PrayerCardProps {
  prayer: Prayer;
  isNext?: boolean;
  remainingTime?: string;
}

const PrayerCard: React.FC<PrayerCardProps> = ({ prayer, isNext, remainingTime }) => {
  return (
    <View style={[styles.card, isNext && styles.nextCard]}>
      <View style={styles.prayerInfo}>
        <ClockIcon size={RFValue(20)} color={isNext ? Colors.white : Colors.secondary} />
        <View style={styles.prayerNameContainer}>
          <Text style={[styles.prayerNameArabic, isNext && styles.nextPrayerNameArabic]}>{prayer.nameArabic}</Text>
          <Text style={[styles.prayerNameEnglish, isNext && styles.nextPrayerNameEnglish]}>{prayer.name}</Text>
        </View>
      </View>
      <View style={styles.timeInfo}>
        <Text style={[styles.prayerTime, isNext && styles.nextPrayerTime]}>{prayer.time}</Text>
        {isNext && remainingTime && (
          <Text style={styles.remainingTimeText}>متبقي: {remainingTime}</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.primary, 
    paddingVertical: RFValue(18),
    paddingHorizontal: RFValue(20),
    borderRadius: RFValue(18),
    marginVertical: RFValue(6),
    shadowColor: Colors.black, // Changed from Colors.black to Colors.primary or a generic black
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 4,
    borderWidth: 1,
    borderColor: Colors.divider, 
  },
  nextCard: {
    backgroundColor: 'rgba(196, 160, 82, 0.4)', // Transparent Gold
    borderColor: 'rgba(196, 160, 82, 0.8)', // More opaque gold
    shadowColor: Colors.secondary, 
    shadowOpacity: 0.3,
  },
  prayerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  prayerNameContainer: {
    marginLeft: RFValue(12), 
  },
  prayerNameArabic: {
    fontSize: RFValue(20),
    fontWeight: '600',
    color: Colors.secondary, 
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  },
  nextPrayerNameArabic: {
    color: Colors.white, 
  },
  prayerNameEnglish: {
    fontSize: RFValue(14),
    color: Colors.moonlight, 
    opacity: 0.9,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  nextPrayerNameEnglish: {
    color: Colors.moonlight, 
    opacity: 0.8,
  },
  timeInfo: {
    alignItems: 'flex-end',
  },
  prayerTime: {
    fontSize: RFValue(22),
    fontWeight: 'bold',
    color: Colors.moonlight, 
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-bold',
  },
  nextPrayerTime: {
    color: Colors.white, 
  },
  remainingTimeText: {
    fontSize: RFValue(12),
    color: Colors.moonlight, 
    opacity: 0.9,
    marginTop: RFValue(2),
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  }
});

export default PrayerCard;