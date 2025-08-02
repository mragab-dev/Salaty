import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Colors from '../constants/colors';
import { RFValue } from 'react-native-responsive-fontsize';

// This screen is deprecated and its functionality has been moved to 
// QuranIndexScreen.tsx and SurahViewScreen.tsx (now QuranPageViewerScreen.tsx)
// It's kept in the file structure to avoid breaking imports if any,
// but should ideally be removed in a future cleanup.

const DeprecatedQuranScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.message}>
        This Quran screen has been updated. Please use the new Quran Index.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: RFValue(20),
    backgroundColor: Colors.background, // Updated
  },
  message: {
    fontSize: RFValue(18),
    textAlign: 'center',
    color: Colors.primary, // Updated
  },
});

export default DeprecatedQuranScreen;