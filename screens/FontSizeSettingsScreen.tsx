import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '../constants/colors';
import { TextStyleIcon, CheckmarkIcon } from '../components/Icons';
import { RFValue } from 'react-native-responsive-fontsize';
import { ASYNC_STORAGE_FONT_SIZE_KEY } from '../constants';
// Placeholder for a Slider component if you add one later, e.g., from '@react-native-community/slider'
// For now, using +/- buttons

// Local type definition to resolve type errors for this deprecated screen.
type LocalQuranStackParamList = {
    FontSizeSettings: { currentScale: number };
};
type FontSizeSettingsScreenRouteProp = RouteProp<LocalQuranStackParamList, 'FontSizeSettings'>;

const FONT_STEP = 0.1;
const MIN_SCALE = 0.7;
const MAX_SCALE = 1.5;

const FontSizeSettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<FontSizeSettingsScreenRouteProp>();
  
  // Safely access params to prevent runtime errors and fix type issues.
  const initialScale = route.params?.currentScale ?? 1.0;
  const [currentScale, setCurrentScale] = useState(initialScale);

  useEffect(() => {
    // Update header dynamically or use navigation.setParams if needed for other purposes
     navigation.setOptions({ title: `تعديل حجم الخط (${Math.round(currentScale * 100)}%)` });
  }, [currentScale, navigation]);

  const handleIncrease = () => {
    setCurrentScale(prev => Math.min(MAX_SCALE, parseFloat((prev + FONT_STEP).toFixed(2)) ));
  };

  const handleDecrease = () => {
    setCurrentScale(prev => Math.max(MIN_SCALE, parseFloat((prev - FONT_STEP).toFixed(2)) ));
  };

  const handleApply = async () => {
    try {
      await AsyncStorage.setItem(ASYNC_STORAGE_FONT_SIZE_KEY, currentScale.toString());
      console.log('Font size saved:', currentScale);
    } catch (error) {
      console.error('Error saving font size:', error);
    }
    if(navigation.canGoBack()) navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <TextStyleIcon color={Colors.secondary} size={RFValue(28)} />
        <Text style={styles.headerTitle}>تعديل حجم الخط</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.infoText}>
          استخدم الأزرار لتكبير أو تصغير حجم خط آيات القرآن الكريم.
        </Text>

        <View style={styles.previewContainer}>
          <Text style={[styles.previewText, { fontSize: RFValue(24) * currentScale }]}>
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ (الفاتحة: ١)
          </Text>
        </View>

        <View style={styles.controlsContainer}>
          <TouchableOpacity style={styles.controlButton} onPress={handleDecrease} disabled={currentScale <= MIN_SCALE}>
            <Text style={styles.controlButtonText}>-</Text>
          </TouchableOpacity>
          <Text style={styles.scaleText}>{Math.round(currentScale * 100)}%</Text>
          <TouchableOpacity style={styles.controlButton} onPress={handleIncrease} disabled={currentScale >= MAX_SCALE}>
            <Text style={styles.controlButtonText}>+</Text>
          </TouchableOpacity>
        </View>
        
        {/* Placeholder for Slider */}
        {/* <Text style={styles.sliderInfo}>أو استخدم شريط التمرير:</Text> */}
        {/* Add Slider component here when available */}

        <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
          <CheckmarkIcon color={Colors.primary} size={RFValue(20)} />
          <Text style={styles.applyButtonText}>تطبيق وحفظ</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerContainer: {
    backgroundColor: Colors.primary,
    paddingVertical: RFValue(20),
    paddingHorizontal: RFValue(20),
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  headerTitle: {
    fontSize: RFValue(22),
    color: Colors.secondary,
    fontWeight: 'bold',
    marginLeft: RFValue(10),
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-bold',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    padding: RFValue(20),
  },
  infoText: {
    fontSize: RFValue(16),
    color: Colors.text,
    textAlign: 'center',
    marginBottom: RFValue(20),
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  previewContainer: {
    padding: RFValue(20),
    backgroundColor: Colors.white,
    borderRadius: RFValue(10),
    marginBottom: RFValue(30),
    width: '100%',
    minHeight: RFValue(100),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  previewText: {
    fontFamily: 'AmiriQuran-Regular',
    color: Colors.arabicText,
    textAlign: 'center',
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '80%',
    marginBottom: RFValue(20),
  },
  controlButton: {
    backgroundColor: Colors.secondaryLight,
    width: RFValue(50),
    height: RFValue(50),
    borderRadius: RFValue(25),
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  controlButtonText: {
    fontSize: RFValue(28),
    color: Colors.primary,
    fontWeight: 'bold',
  },
  scaleText: {
    fontSize: RFValue(20),
    color: Colors.primary,
    fontWeight: '600',
    minWidth: RFValue(70),
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  },
  sliderInfo: {
    fontSize: RFValue(14),
    color: Colors.accent,
    marginBottom: RFValue(10),
  },
  applyButton: {
    backgroundColor: Colors.secondary,
    paddingVertical: RFValue(12),
    paddingHorizontal: RFValue(30),
    borderRadius: RFValue(8),
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: RFValue(20),
  },
  applyButtonText: {
    color: Colors.primary,
    fontSize: RFValue(16),
    fontWeight: '600',
    marginLeft: RFValue(8),
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  },
});

export default FontSizeSettingsScreen;
