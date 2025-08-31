import React, { useEffect, useState, useRef } from 'react';
import { Alert, Animated, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { RotateCcwIcon, SettingsIcon, InfoIcon } from './Icons';
import Svg, { Circle, G } from 'react-native-svg';
import Colors from '../constants/colors';
import { logActivity } from '../services/activityLogService';
import { RFValue } from 'react-native-responsive-fontsize';

type TasbihMode = 'free' | 'target' | 'traditional';

interface DigitalTasbihProps {
  mode: TasbihMode;
  target: number;
  hapticEnabled: boolean;
  dhikrText: string;
  fadl?: string;
  onSessionComplete: (dhikrName: string, count: number) => void;
  resetToken: number; // Used to trigger a reset from the parent
}

const DigitalTasbih = ({ 
  mode,
  target,
  hapticEnabled,
  dhikrText,
  fadl,
  onSessionComplete,
  resetToken,
}: DigitalTasbihProps) => {
  const [count, setCount] = useState(0);
  const [completionFired, setCompletionFired] = useState(false);
  
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const completionGlowAnim = useRef(new Animated.Value(0)).current;

  const countRef = useRef(count);
  countRef.current = count;
  const completionFiredRef = useRef(completionFired);
  completionFiredRef.current = completionFired;
  const dhikrTextRef = useRef(dhikrText);
  dhikrTextRef.current = dhikrText;

  // Effect to handle unmounting and logging partial counts
  useEffect(() => {
    return () => {
      if (countRef.current > 0 && !completionFiredRef.current) {
        logActivity('tasbih_set_completed', { dhikrName: dhikrTextRef.current, count: countRef.current });
        console.log(`Unmounting Tasbih. Logged partial count directly: ${countRef.current} for ${dhikrTextRef.current}`);
      }
    };
  }, []); 

  // Reset internal state when the key (dhikr) or reset token changes
  useEffect(() => {
    setCount(0);
    setCompletionFired(false);
  }, [dhikrText, resetToken]);


  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.timing(rotateAnim, { toValue: 1, duration: 40000, useNativeDriver: true })
    ).start();
  }, [glowAnim, rotateAnim]);

  useEffect(() => {
    if (!completionFired && mode !== 'free' && count >= target && count > 0) {
      setCompletionFired(true); 

      if (hapticEnabled && Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(err => console.log("Haptic error", err));
      }
      
      Animated.sequence([
          Animated.timing(completionGlowAnim, { toValue: 1, duration: 400, useNativeDriver: false }),
          Animated.timing(completionGlowAnim, { toValue: 0, delay: 600, duration: 800, useNativeDriver: false })
      ]).start(() => {
          onSessionComplete(dhikrText, target);
      });
    }
  }, [count, target, mode, hapticEnabled, completionFired, onSessionComplete, dhikrText]);

  const handleTap = () => {
    if (mode !== 'free' && count >= target) return;

    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.95, duration: 50, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();

    if (hapticEnabled && Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(err => console.log("Haptic error", err));
    }

    setCount(prev => prev + 1);
  };

  const getProgress = () => {
    if (mode === 'free' || target <= 0) return 0;
    return Math.min((count / target) * 100, 100);
  };

  const rotation = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const glowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.8] });
  const isCompleted = mode !== 'free' && count >= target;

  const completionGlowStyle = {
    shadowColor: Colors.success,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: completionGlowAnim,
    shadowRadius: completionGlowAnim.interpolate({ inputRange: [0, 1], outputRange: [0, RFValue(20)] }),
    elevation: completionGlowAnim.interpolate({ inputRange: [0, 1], outputRange: [10, 30] }),
  };

  return (
    <View style={styles.container}>
      <View style={styles.dhikrHeader}>
        <Text style={styles.dhikrText}>{dhikrText}</Text>
        {fadl && (
            <TouchableOpacity style={styles.infoButton} onPress={() => Alert.alert('فضل الذكر', fadl)}>
                <InfoIcon color={Colors.white} size={RFValue(18)} />
            </TouchableOpacity>
        )}
      </View>

      <View style={styles.counterContainer}>
        <Animated.View style={[ styles.decorativeBackground, { transform: [{ rotate: rotation }] } ]}>
          <Svg width={RFValue(300)} height={RFValue(300)} style={styles.backgroundSvg}>
            <G>
              <Circle cx={RFValue(150)} cy={RFValue(150)} r={RFValue(140)} fill="none" stroke={Colors.white} strokeWidth="2" strokeOpacity="0.3" strokeDasharray="10,5"/>
            </G>
          </Svg>
        </Animated.View>

        {mode !== 'free' && (
          <View style={styles.progressContainer}>
            <Svg width={RFValue(250)} height={RFValue(250)}>
              <Circle cx={RFValue(125)} cy={RFValue(125)} r={RFValue(110)} fill="none" stroke={Colors.white} strokeWidth="8" strokeOpacity="0.2"/>
              <Circle cx={RFValue(125)} cy={RFValue(125)} r={RFValue(110)} fill="none" stroke={Colors.secondary} strokeWidth="8" strokeDasharray={`${2 * Math.PI * RFValue(110)}`} strokeDashoffset={`${2 * Math.PI * RFValue(110) * (1 - getProgress() / 100)}`} strokeLinecap="round" transform={`rotate(-90 ${RFValue(125)} ${RFValue(125)})`}/>
            </Svg>
          </View>
        )}

        <Animated.View style={[styles.counterButton, completionGlowStyle]}>
          <Animated.View style={[{ flex: 1 }, { transform: [{ scale: scaleAnim }] }]}>
            <TouchableOpacity style={styles.counterTouchable} onPress={handleTap} activeOpacity={0.8}>
              <LinearGradient colors={isCompleted ? [Colors.success, '#388E3C'] : ['#D4B872', '#C4A052']} style={styles.counterGradient}>
                <Animated.View style={[ styles.glowEffect, { opacity: glowOpacity, backgroundColor: isCompleted ? Colors.success : Colors.secondary } ]}/>
                <Text style={styles.countText}>{count}</Text>
                {mode !== 'free' && (<Text style={styles.targetText}>من {target}</Text>)}
                <Text style={styles.tapText}>اضغط للتسبيح</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </View>

      <View style={styles.controls}>
        {mode !== 'free' && (
          <View style={styles.progressInfo}>
            <Text style={styles.progressText}>التقدم: {getProgress().toFixed(0)}%</Text>
            <Text style={styles.remainingText}>المتبقي: {Math.max(0, target - count)}</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    padding: RFValue(20),
    justifyContent: 'space-between',
  },
  dhikrHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: RFValue(20),
    paddingTop: RFValue(10),
  },
  dhikrText: {
    color: Colors.secondaryLight,
    fontSize: RFValue(24),
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  },
  infoButton: {
    marginLeft: RFValue(10),
    padding: RFValue(5),
  },
  counterContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    height: RFValue(300),
  },
  decorativeBackground: {
    position: 'absolute',
  },
  backgroundSvg: {},
  progressContainer: {
    position: 'absolute',
  },
  counterButton: {
    width: RFValue(200),
    height: RFValue(200),
    borderRadius: RFValue(100),
    elevation: 10,
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  counterTouchable: {
    width: '100%',
    height: '100%',
    borderRadius: RFValue(100),
  },
  counterGradient: {
    width: '100%',
    height: '100%',
    borderRadius: RFValue(100),
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  glowEffect: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: RFValue(100),
    opacity: 0.3,
  },
  countText: {
    fontSize: RFValue(48),
    fontWeight: 'bold',
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: RFValue(5),
  },
  targetText: {
    fontSize: RFValue(16),
    color: Colors.primary,
    opacity: 0.9,
    textAlign: 'center',
  },
  tapText: {
    fontSize: RFValue(14),
    color: Colors.primary,
    opacity: 0.8,
    textAlign: 'center',
    marginTop: RFValue(5),
  },
  controls: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: RFValue(10),
    minHeight: RFValue(50), 
  },
  progressInfo: {
    alignItems: 'flex-end',
    flex: 1, 
  },
  progressText: {
    fontSize: RFValue(16),
    color: Colors.white,
    fontWeight: '600',
  },
  remainingText: {
    fontSize: RFValue(14),
    color: Colors.secondaryLight,
    marginTop: RFValue(2),
  },
});

export default DigitalTasbih;
