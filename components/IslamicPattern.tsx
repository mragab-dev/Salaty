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

export const IslamicPattern: React.FC<IslamicPatternProps> = ({ 
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
              <Pattern id="geom" patternUnits="userSpaceOnUse" width={RFValue(20)} height={RFValue(20)}>
                <Path d={`M0 0 L${RFValue(10)} ${RFValue(10)} L0 ${RFValue(20)} Z M${RFValue(10)} 0 L${RFValue(20)} ${RFValue(10)} L${RFValue(10)} ${RFValue(20)}Z`} fill="none" stroke={color} strokeWidth={RFValue(0.5)} />
                 <Rect x="0" y="0" width={RFValue(20)} height={RFValue(20)} fill="none" stroke={color} strokeWidth={RFValue(0.2)} opacity="0.5"/>
                 <Circle cx={RFValue(10)} cy={RFValue(10)} r={RFValue(3)} fill={color} opacity="0.3" />
              </Pattern>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#geom)" />
          </Svg>
        );
      case 'floral':
         return (
          <Svg height="100%" width="100%" viewBox="0 0 100 100">
            <Defs>
              <Pattern id="floral" patternUnits="userSpaceOnUse" width={RFValue(30)} height={RFValue(30)}>
                <Circle cx={RFValue(15)} cy={RFValue(15)} r={RFValue(10)} stroke={color} strokeWidth={RFValue(1)} fill="none" opacity="0.6"/>
                <Circle cx={RFValue(15)} cy={RFValue(15)} r={RFValue(5)} fill={color} opacity="0.4"/>
                <Path d={`M${RFValue(15)} ${RFValue(5)} Q${RFValue(10)} ${RFValue(15)} ${RFValue(15)} ${RFValue(25)} Q${RFValue(20)} ${RFValue(15)} ${RFValue(15)} ${RFValue(5)}`} fill="none" stroke={color} strokeWidth={RFValue(0.5)} opacity="0.7"/>
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
              <Pattern id="simpleGrid" patternUnits="userSpaceOnUse" width={RFValue(10)} height={RFValue(10)}>
                <Path d={`M0 ${RFValue(5)} H${RFValue(10)} M${RFValue(5)} 0 V${RFValue(10)}`} stroke={color} strokeWidth={RFValue(0.3)} opacity="0.5"/>
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
    transform: [{ translateX: -RFValue(50) }, { translateY: -RFValue(10) }],
    color: 'red',
    fontSize: RFValue(12),
  }
});
