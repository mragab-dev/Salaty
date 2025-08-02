import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Platform, StyleProp, ViewStyle } from 'react-native';
import { LoadingSpinnerIcon } from './Icons'; // Using custom SVG spinner for consistent look
import Colors from '../constants/colors'; // Import the new Colors
import { RFValue } from 'react-native-responsive-fontsize';

interface LoadingSpinnerProps {
  size?: 'small' | 'large' | number; // Updated to match ActivityIndicator or provide custom size for SVG
  text?: string;
  style?: StyleProp<ViewStyle>;
  color?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'large', text, style, color = Colors.primary }) => { // Updated: default color was '#104f37'
  const activityIndicatorSize = typeof size === 'number' ? undefined : size; // ActivityIndicator takes 'small' or 'large'
  const svgSize = typeof size === 'number' ? RFValue(size) : (size === 'small' ? RFValue(20) : RFValue(36));

  return (
    <View style={[styles.container, style]}>
      {Platform.OS === 'android' && activityIndicatorSize ? ( // Use native on Android if 'small'/'large'
        <ActivityIndicator size={activityIndicatorSize} color={color} />
      ) : (
        <LoadingSpinnerIcon color={color} width={svgSize} height={svgSize} />
      )}
      {text && <Text style={[styles.text, { color: color }]}>{text}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: RFValue(10),
  },
  text: {
    marginTop: RFValue(8),
    fontSize: RFValue(14),
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
});

export default LoadingSpinner;