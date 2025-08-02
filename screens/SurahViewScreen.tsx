import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import Colors from '../constants/colors';
import { RFValue } from 'react-native-responsive-fontsize';

// This screen is deprecated. Its functionality is replaced by QuranPageViewerScreen.tsx
// It's kept to avoid breaking existing navigation stack immediately but should be removed later.

type RootStackParamList = {
  QuranIndex: undefined; 
  // Add other routes your app might have from here
};


const DeprecatedSurahViewScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  return (
    <View style={styles.container}>
      <Text style={styles.message}>
        تم تحديث طريقة عرض السور.
      </Text>
      <Text style={styles.subMessage}>
        لعرض القرآن الكريم بنظام الصفحات الجديد، يرجى الرجوع إلى فهرس القرآن واختيار سورة.
      </Text>
      <TouchableOpacity 
        style={styles.button} 
        onPress={() => navigation.navigate('QuranIndex')}
      >
        <Text style={styles.buttonText}>الذهاب إلى فهرس القرآن</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: RFValue(20),
    backgroundColor: Colors.background, 
  },
  message: {
    fontSize: RFValue(20),
    fontWeight: 'bold',
    textAlign: 'center',
    color: Colors.primary, 
    marginBottom: RFValue(10),
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  },
  subMessage: {
    fontSize: RFValue(16),
    textAlign: 'center',
    color: Colors.accent, 
    marginBottom: RFValue(20),
    lineHeight: RFValue(24),
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  button: {
    backgroundColor: Colors.secondary, 
    paddingVertical: RFValue(12),
    paddingHorizontal: RFValue(25),
    borderRadius: RFValue(8),
  },
  buttonText: {
    color: Colors.primary, 
    fontSize: RFValue(16),
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  }
});

export default DeprecatedSurahViewScreen;