import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Platform, Animated, Easing } from 'react-native';
import { QiblaIcon } from './Icons'; 
import Colors from '../constants/colors';
import { RFValue } from 'react-native-responsive-fontsize';

interface QiblaCompassProps {
  heading: number | null;
  qiblaDirection: number | null;
}

const QiblaCompass: React.FC<QiblaCompassProps> = ({ heading, qiblaDirection }) => {
  const rotationAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (heading !== null && qiblaDirection !== null) {
      // The angle for the needle is the difference between the Qibla direction and the phone's heading
      const needleRotation = qiblaDirection - heading;

      // Use Animated.spring for a smoother, more natural, and dampened transition
      Animated.spring(rotationAnim, {
        toValue: needleRotation,
        friction: 6, // Controls bounciness/damping. Higher value means less bouncy.
        tension: 40, // Controls speed. Lower value is slower.
        useNativeDriver: true, // Use native driver for transform animations
      }).start();
    }
  }, [heading, qiblaDirection, rotationAnim]);

  const rotationInterpolate = rotationAnim.interpolate({
    inputRange: [-360, 360],
    outputRange: ['-360deg', '360deg'],
  });

  const animatedNeedleStyle = {
    transform: [{ rotate: rotationInterpolate }],
  };

  const renderContent = () => {
    if (heading === null || qiblaDirection === null) {
      return (
        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>جاري تحديد اتجاه القبلة...</Text>
          <Text style={styles.infoSubText}>تأكد من تفعيل خدمات الموقع وتدوير الجهاز.</Text>
        </View>
      );
    }

    return (
      <>
        <View style={styles.compassBase}>
          {['N', 'E', 'S', 'W'].map((dir, i) => (
            <Text
              key={dir}
              style={[
                styles.directionMarking,
                { transform: [{ rotate: `${i * 90}deg` }, { translateY: -RFValue(68) }] }
              ]}
            >
              {dir}
            </Text>
          ))}
          
          <Animated.View style={[styles.needleContainer, animatedNeedleStyle]}>
            <View style={styles.needleTip} />
          </Animated.View>

          <View style={styles.compassCenter}>
             <QiblaIcon width={RFValue(32)} height={RFValue(32)} color={Colors.primary}/>
          </View>
        </View>
        <Text style={styles.disclaimer}>
          ضع هاتفك بشكل مسطح وبعيدًا عن الأجسام المعدنية للحصول على أفضل دقة.
        </Text>
        <Text style={styles.qiblaAngleText}>
          اتجاه القبلة: {Math.round(qiblaDirection)}°
        </Text>
      </>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>بوصلة القبلة</Text>
      {renderContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: RFValue(16),
    backgroundColor: `rgba(${parseInt(Colors.background.slice(1,3),16)}, ${parseInt(Colors.background.slice(3,5),16)}, ${parseInt(Colors.background.slice(5,7),16)}, 0.8)`,
    borderRadius: RFValue(8),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  title: {
    fontSize: RFValue(18),
    fontWeight: '600',
    color: Colors.primary, 
    marginBottom: RFValue(10),
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  },
  compassBase: {
    width: RFValue(150), 
    height: RFValue(150), 
    borderRadius: RFValue(75), 
    borderWidth: RFValue(4),
    borderColor: Colors.secondary, 
    backgroundColor: Colors.background, 
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative', 
  },
  directionMarking: {
    position: 'absolute',
    color: Colors.primary, 
    fontWeight: '600',
    fontSize: RFValue(12), 
  },
  needleContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    alignItems: 'center',
  },
  needleTip: { 
    width: 0,
    height: 0,
    borderLeftWidth: RFValue(8), 
    borderRightWidth: RFValue(8), 
    borderBottomWidth: RFValue(14), 
    borderStyle: 'solid',
    backgroundColor: 'transparent',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: Colors.accent, 
    position: 'absolute',
    top: RFValue(12), // Adjust to be near the edge
  },
  compassCenter: {
    width: RFValue(40),
    height: RFValue(40),
    borderRadius: RFValue(20),
    backgroundColor: Colors.secondaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  disclaimer: {
    marginTop: RFValue(12),
    fontSize: RFValue(11), 
    color: Colors.accent, 
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  qiblaAngleText: {
    marginTop: RFValue(5),
    fontSize: RFValue(14),
    fontWeight: 'bold',
    color: Colors.primary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-bold',
  },
  infoContainer: {
    height: RFValue(150),
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoText: {
    fontSize: RFValue(16),
    color: Colors.primary,
    fontWeight: '500',
  },
  infoSubText: {
    fontSize: RFValue(12),
    color: Colors.accent,
    marginTop: RFValue(4),
  }
});

export default QiblaCompass;