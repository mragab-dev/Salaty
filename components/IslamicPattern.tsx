import React from 'react';
import { View, StyleSheet, Text, ViewStyle, TextStyle, StyleProp } from 'react-native'; // Added StyleProp
import Svg, { Path, Defs, Pattern, Rect, Circle } from 'react-native-svg';
import Colors from '../constants/colors'; // Assuming Colors is correctly set up
import { RFValue } from 'react-native-responsive-fontsize';

interface IslamicPatternProps {
  style?: StyleProp<ViewStyle>;
  color?: string;
  variant?: 'geometric' | 'floral' | 'simple'; // Example variants
  animated?: boolean; // Placeholder for potential animation
}

const IslamicPattern: React.FC<IslamicPatternProps> = ({ 
  style, 
  color = Colors.secondaryLight, 
  variant = 'simple',
  animated = false 
}) => {
  // This is a very basic placeholder.
  // Real Islamic patterns can be quite complex and might require more intricate SVG paths or images.
  
  const renderPattern = () => {
    switch(variant) {
      case 'geometric':
        return (
          <Svg height="100%" width="100%" viewBox="0 0 100 100">
            <Defs>
              <Pattern id="geom" patternUnits="userSpaceOnUse" width="20" height="20">
                <Path d="M0 0 L10 10 L0 20 Z M10 0 L20 10 L10 20Z" fill="none" stroke={color} strokeWidth={RFValue(0.5)} />
                 <Rect x="0" y="0" width="20" height="20" fill="none" stroke={color} strokeWidth={RFValue(0.2)} opacity="0.5"/>
                 <Circle cx="10" cy="10" r="3" fill={color} opacity="0.3" />
              </Pattern>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#geom)" />
          </Svg>
        );
      case 'floral':
         return (
          <Svg height="100%" width="100%" viewBox="0 0 100 100">
            <Defs>
              <Pattern id="floral" patternUnits="userSpaceOnUse" width="30" height="30">
                <Circle cx="15" cy="15" r="10" stroke={color} strokeWidth={RFValue(1)} fill="none" opacity="0.6"/>
                <Circle cx="15" cy="15" r="5" fill={color} opacity="0.4"/>
                <Path d="M15 5 Q10 15 15 25 Q20 15 15 5" fill="none" stroke={color} strokeWidth={RFValue(0.5)} opacity="0.7"/>
              </Pattern>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#floral)" />
          </Svg>
        );
      case 'simple':
      default:
        return (
          <Svg height="100%" width="100%" viewBox="0 0 100 100">
            <Defs>
              <Pattern id="simpleGrid" patternUnits="userSpaceOnUse" width="10" height="10">
                <Path d="M0 5 H10 M5 0 V10" stroke={color} strokeWidth={RFValue(0.3)} opacity="0.5"/>
              </Pattern>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#simpleGrid)" />
          </Svg>
        );
    }
  };

  return (
    <View style={[styles.container, style]}>
      {renderPattern()}
      {/* Text added for placeholder visibility if SVG is too subtle */}
      {/* <Text style={styles.placeholderText}>Islamic Pattern</Text> */}
    </View>
  );
};

const styles = StyleSheet.create<{
  container: ViewStyle;
  placeholderText: TextStyle;
}>({
  container: {
    width: '100%',
    height: '100%',
    overflow: 'hidden', // Ensure SVG pattern stays within bounds
  },
  placeholderText: { // For debugging or if SVG pattern is too faint
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -50 }, { translateY: -10 }],
    color: 'rgba(0,0,0,0.1)',
    fontSize: RFValue(10),
  }
});

export default IslamicPattern;