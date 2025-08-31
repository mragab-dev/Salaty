import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '../constants/colors';
import { SalatyLogoIcon } from '../components/Icons';
import { inspirationalQuotes, Quote } from '../assets/data/inspirational_quotes';
import { RFValue } from 'react-native-responsive-fontsize';
import { IslamicPattern } from '../components/IslamicPattern'; // Import the pattern component

interface SplashScreenProps {
  onFinish: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  // Animation values
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(20)).current;
  const quoteOpacity = useRef(new Animated.Value(0)).current;
  const quoteTranslateY = useRef(new Animated.Value(10)).current;
  const patternRotation = useRef(new Animated.Value(0)).current;

  const [quote, setQuote] = useState<Quote | null>(null);

  useEffect(() => {
    // Select a random quote on mount
    const randomIndex = Math.floor(Math.random() * inspirationalQuotes.length);
    setQuote(inspirationalQuotes[randomIndex]);

    // Continuous, slow rotation for the background pattern
    Animated.loop(
      Animated.timing(patternRotation, {
        toValue: 1,
        duration: 40000, // A long duration for a very slow rotation
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Sequence of animations for intro
    const entranceAnimation = Animated.sequence([
      // Logo fades in and scales up gracefully
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 1200,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 5,
          tension: 40,
          useNativeDriver: true,
        }),
      ]),
      // App name slides up and fades in
      Animated.parallel([
         Animated.timing(textOpacity, {
          toValue: 1,
          duration: 800,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(textTranslateY, {
          toValue: 0,
          duration: 800,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      // Add a small delay before showing the quote
      Animated.delay(300),
      // Quote slides up and fades in
      Animated.parallel([
         Animated.timing(quoteOpacity, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(quoteTranslateY, {
          toValue: 0,
          duration: 1000,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ]);

    entranceAnimation.start();

    // Set a timer to call onFinish after the animations are expected to complete
    const finishTimer = setTimeout(() => {
      onFinish();
    }, 4000); // Increased duration to allow for the full, richer animation

    return () => {
      entranceAnimation.stop();
      clearTimeout(finishTimer);
    };
  }, [logoOpacity, logoScale, textOpacity, quoteOpacity, onFinish, patternRotation, textTranslateY, quoteTranslateY]);
  
  const rotation = patternRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <LinearGradient
      colors={[Colors.primary, Colors.primaryDark]}
      style={styles.container}
    >
      <Animated.View style={[styles.patternContainer, { transform: [{ rotate: rotation }] }]}>
          <IslamicPattern variant="geometric" color="rgba(255, 255, 255, 0.04)" />
      </Animated.View>
      <View style={styles.content}>
        <Animated.View style={[styles.logoWrapper, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}>
          <SalatyLogoIcon size={RFValue(120)} />
        </Animated.View>
        <Animated.Text style={[styles.appName, { opacity: textOpacity, transform: [{ translateY: textTranslateY }] }]}>
          صلاتي
        </Animated.Text>

        {quote && (
          <Animated.View style={[styles.quoteContainer, { opacity: quoteOpacity, transform: [{ translateY: quoteTranslateY }] }]}>
            <Text style={styles.quoteText}>"{quote.text}"</Text>
            <Text style={styles.quoteReference}>- {quote.reference} -</Text>
          </Animated.View>
        )}
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.primaryDark,
  },
  patternContainer: {
    position: 'absolute',
    width: '150%',
    height: '150%',
    opacity: 0.5,
  },
  content: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent', // Ensure content background is transparent to see the pattern
  },
  logoWrapper: {
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: RFValue(5) },
    shadowOpacity: 0.3,
    shadowRadius: RFValue(10),
    // Elevation for Android is tricky with rotation, so we keep it subtle or avoid it.
  },
  appName: {
    fontSize: RFValue(48),
    fontWeight: 'bold',
    color: Colors.secondary,
    marginTop: RFValue(20),
    fontFamily: 'Amiri-Bold',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  quoteContainer: {
    marginTop: RFValue(30),
    paddingHorizontal: RFValue(20),
    alignItems: 'center',
  },
  quoteText: {
    fontSize: RFValue(20),
    color: Colors.white,
    fontFamily: 'Amiri-Regular',
    textAlign: 'center',
    lineHeight: RFValue(30),
    marginBottom: RFValue(8),
    fontStyle: 'italic',
  },
  quoteReference: {
    fontSize: RFValue(14),
    color: Colors.secondaryLight,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
});

export default SplashScreen;