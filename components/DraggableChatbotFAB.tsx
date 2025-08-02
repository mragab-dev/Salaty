import React, { useRef } from 'react';
import { StyleSheet, PanResponder, Animated, TouchableOpacity, Dimensions, View, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NavigationContainerRef } from '@react-navigation/native';
import { AppStackParamList } from '../App'; 
import { ChatBubbleIcon } from './Icons';
import Colors from '../constants/colors';
import { RFValue } from 'react-native-responsive-fontsize';

const FAB_SIZE = RFValue(60);
const MARGIN = RFValue(20);

interface DraggableChatbotFABProps {
  navigationRef: React.RefObject<NavigationContainerRef<AppStackParamList> | null>;
}

const DraggableChatbotFAB: React.FC<DraggableChatbotFABProps> = ({ navigationRef }) => {
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = Dimensions.get('window');

  // Calculate initial position more accurately considering safe areas
  const initialX = windowWidth - FAB_SIZE - MARGIN;
  const initialY = windowHeight - FAB_SIZE - MARGIN - insets.bottom;


  const pan = useRef(new Animated.ValueXY({ x: initialX, y: initialY })).current;

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
        useNativeDriver: false, // Position changes are layout changes
      }),
      onPanResponderRelease: (e, gestureState) => {
        pan.flattenOffset();
        
        if (Math.abs(gestureState.dx) < 5 && Math.abs(gestureState.dy) < 5 && Math.abs(gestureState.vx) < 0.1 && Math.abs(gestureState.vy) < 0.1 ) {
          handlePress();
        } else {
          // Boundary clamping logic
          let newX = (pan.x as any)._value;
          let newY = (pan.y as any)._value;

          // Clamp X
          if (newX < MARGIN) newX = MARGIN;
          if (newX > windowWidth - FAB_SIZE - MARGIN) newX = windowWidth - FAB_SIZE - MARGIN;
          
          // Clamp Y
          const topBoundary = MARGIN + insets.top;
          const bottomBoundary = windowHeight - FAB_SIZE - MARGIN - insets.bottom;
          if (newY < topBoundary) newY = topBoundary;
          if (newY > bottomBoundary) newY = bottomBoundary;

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
          transform: [{ translateX: pan.x }, { translateY: pan.y }],
        },
      ]}
      {...panResponder.panHandlers}
    >
      <TouchableOpacity 
        style={styles.fabButton} 
        onPress={handlePress} // Allows tap if not dragged significantly
        activeOpacity={0.8}
        accessibilityLabel="افتح شات بوت صلاتي"
        accessibilityRole="button"
      >
        <ChatBubbleIcon color={Colors.primary} size={FAB_SIZE * 0.55} />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  fabContainer: {
    position: 'absolute',
    width: FAB_SIZE,
    height: FAB_SIZE,
    zIndex: 1000, // Ensure it's on top
  },
  fabButton: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    backgroundColor: Colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 6,
      },
    }),
  },
});

export default DraggableChatbotFAB;