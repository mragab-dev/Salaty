import React, { useRef, useEffect } from 'react';
import { StyleSheet, PanResponder, Animated, TouchableOpacity, Dimensions, View, Platform, Easing, I18nManager } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NavigationContainerRef } from '@react-navigation/native';
import { AppStackParamList } from '../App'; 
import { SalatyLogoIcon } from './Icons';
import Colors from '../constants/colors';
import { RFValue } from 'react-native-responsive-fontsize';
import { LinearGradient } from 'expo-linear-gradient';

const FAB_SIZE = RFValue(60);
const MARGIN = RFValue(20);
const TAB_BAR_HEIGHT = RFValue(60); // Approximate height to avoid overlap

interface DraggableChatbotFABProps {
  navigationRef: React.RefObject<NavigationContainerRef<AppStackParamList> | null>;
}

const DraggableChatbotFAB: React.FC<DraggableChatbotFABProps> = ({ navigationRef }) => {
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = Dimensions.get('window');

  // RTL-aware initial position
  const isRtl = I18nManager.isRTL;
  const initialX = isRtl ? MARGIN : windowWidth - FAB_SIZE - MARGIN;
  const initialY = windowHeight - FAB_SIZE - MARGIN - insets.bottom - TAB_BAR_HEIGHT;

  const pan = useRef(new Animated.ValueXY({ x: initialX, y: initialY })).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2, // Glow expands
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  const handlePress = () => {
    navigationRef.current?.navigate('Chatbot');
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pan.setOffset({
          x: (pan.x as any)._value,
          y: (pan.y as any)._value,
        });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (e, gestureState) => {
        pan.flattenOffset();
        
        // Check if it was a tap or a drag
        if (Math.abs(gestureState.dx) < 5 && Math.abs(gestureState.dy) < 5) {
          handlePress();
        } else {
          // It's a drag, so snap to the nearest edge
          let newY = (pan.y as any)._value;

          // Clamp Y position
          const topBoundary = MARGIN + insets.top;
          const bottomBoundary = windowHeight - FAB_SIZE - MARGIN - insets.bottom - TAB_BAR_HEIGHT;
          if (newY < topBoundary) newY = topBoundary;
          if (newY > bottomBoundary) newY = bottomBoundary;

          let newX = 0;
          // Snap to left or right edge based on release position
          if ((pan.x as any)._value + (FAB_SIZE / 2) > windowWidth / 2) {
              newX = windowWidth - FAB_SIZE - MARGIN; // Snap right
          } else {
              newX = MARGIN; // Snap left
          }

          Animated.spring(pan, {
            toValue: { x: newX, y: newY },
            friction: 7,
            tension: 40,
            useNativeDriver: false, 
          }).start();
        }
      },
    })
  ).current;

  return (
    <Animated.View
      style={[
        styles.fabContainer,
        {
          top: pan.y,
          left: pan.x,
        }
      ]}
      {...panResponder.panHandlers}
    >
      <Animated.View style={[styles.glow, { transform: [{ scale: pulseAnim }], opacity: pulseAnim.interpolate({ inputRange: [1, 1.2], outputRange: [0.7, 1] }) }]} />
      <TouchableOpacity 
        style={styles.fabButton} 
        onPress={handlePress}
        activeOpacity={0.8}
        accessibilityLabel="افتح شات بوت صلاتي"
        accessibilityRole="button"
      >
        <LinearGradient
          colors={[Colors.secondaryLight, Colors.secondary]}
          style={styles.gradient}
        >
          <SalatyLogoIcon color={Colors.primary} size={FAB_SIZE * 0.55} />
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  fabContainer: {
    position: 'absolute',
    width: FAB_SIZE,
    height: FAB_SIZE,
    zIndex: 1000,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glow: {
    position: 'absolute',
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    backgroundColor: Colors.secondary,
    opacity: 0.5,
  },
  fabButton: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    ...Platform.select({
      ios: {
        shadowColor: Colors.secondary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  gradient: {
    flex: 1,
    borderRadius: FAB_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default DraggableChatbotFAB;