import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import Colors from '../constants/colors';
import { RFValue } from 'react-native-responsive-fontsize';
import { SalatyLogoIcon } from './Icons';

const TypingIndicator = () => {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = (dot: Animated.Value, delay: number) => {
      return Animated.sequence([
        Animated.delay(delay),
        Animated.timing(dot, {
          toValue: -RFValue(5),
          duration: 300,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(dot, {
          toValue: 0,
          duration: 300,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
      ]);
    };

    const loop = Animated.loop(
      Animated.parallel([animate(dot1, 0), animate(dot2, 150), animate(dot3, 300)])
    );
    loop.start();

    return () => loop.stop();
  }, [dot1, dot2, dot3]);

  return (
    <View style={styles.messageRow}>
      <View style={[styles.avatarContainer, styles.botAvatar]}>
        <SalatyLogoIcon size={RFValue(28)} color={Colors.white} />
      </View>
      <View style={styles.container}>
        <Animated.View style={[styles.dot, { transform: [{ translateY: dot1 }] }]} />
        <Animated.View style={[styles.dot, { transform: [{ translateY: dot2 }] }]} />
        <Animated.View style={[styles.dot, { transform: [{ translateY: dot3 }] }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: RFValue(12),
    alignSelf: 'flex-start',
  },
  avatarContainer: {
    width: RFValue(40),
    height: RFValue(40),
    borderRadius: RFValue(20),
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  botAvatar: {
    backgroundColor: Colors.primaryLight,
    marginLeft: RFValue(8),
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: RFValue(15),
    paddingHorizontal: RFValue(12),
    backgroundColor: Colors.white,
    borderRadius: RFValue(18),
    borderBottomLeftRadius: RFValue(6),
  },
  dot: {
    width: RFValue(8),
    height: RFValue(8),
    borderRadius: RFValue(4),
    backgroundColor: Colors.textLight,
    marginHorizontal: RFValue(4),
  },
});

export default TypingIndicator;
