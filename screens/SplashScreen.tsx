import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '../constants/colors';
import { SalatyLogoIcon } from '../components/Icons';
import { inspirationalQuotes, Quote } from '../assets/data/inspirational_quotes';
import { RFValue } from 'react-native-responsive-fontsize';

const SplashScreen = () => {
  // Animation values
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const quoteOpacity = useRef(new Animated.Value(0)).current;

  const [quote, setQuote] = useState<Quote | null>(null);

  useEffect(() => {
    // Select a random quote on mount
    const randomIndex = Math.floor(Math.random() * inspirationalQuotes.length);
    setQuote(inspirationalQuotes[randomIndex]);

    // Sequence of animations
    const sequence = Animated.sequence([
      // Logo fades in and scales up
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 1000,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 4,
          tension: 30,
          useNativeDriver: true,
        }),
      ]),
      // Text fades in
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 700,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      // Add a small delay before showing the quote
      Animated.delay(200),
      // Quote fades in
      Animated.timing(quoteOpacity, {
        toValue: 1,
        duration: 800,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    ]);

    sequence.start();

    return () => {
      sequence.stop();
    };
  }, [logoOpacity, logoScale, textOpacity, quoteOpacity]);

  return (
    <LinearGradient
      colors={[Colors.primary, Colors.primaryDark]}
      style={styles.container}
    >
      <View style={styles.content}>
        <Animated.View style={{ opacity: logoOpacity, transform: [{ scale: logoScale }] }}>
          <SalatyLogoIcon size={RFValue(120)} />
        </Animated.View>
        <Animated.Text style={[styles.appName, { opacity: textOpacity }]}>
          صلاتي
        </Animated.Text>

        {quote && (
          <Animated.View style={[styles.quoteContainer, { opacity: quoteOpacity }]}>
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
  content: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  appName: {
    fontSize: RFValue(48),
    fontWeight: 'bold',
    color: Colors.secondary,
    marginTop: RFValue(20),
    fontFamily: Platform.OS === 'web' ? 'Amiri, serif' : (Platform.OS === 'ios' ? 'Amiri-Bold' : 'sans-serif-condensed'),
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  quoteContainer: {
    marginTop: RFValue(30),
    paddingHorizontal: RFValue(20),
    alignItems: 'center',
  },
  quoteText: {
    fontSize: RFValue(20),
    color: Colors.white,
    fontFamily: Platform.OS === 'web' ? 'Amiri, serif' : (Platform.OS === 'ios' ? 'Amiri' : 'sans-serif-medium'),
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
