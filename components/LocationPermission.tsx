// components/LocationPermission.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import Colors from '../constants/colors'; // Assuming colors.ts is in constants folder

interface LocationPermissionProps {
  onRequestPermission: () => void;
}

const LocationPermission: React.FC<LocationPermissionProps> = ({ onRequestPermission }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>إذن تحديد الموقع</Text>
      <Text style={styles.message}>
        نحتاج إلى إذنك للوصول إلى موقعك لعرض أوقات الصلاة الدقيقة وتحديد اتجاه القبلة.
      </Text>
      <TouchableOpacity style={styles.button} onPress={onRequestPermission}>
        <Text style={styles.buttonText}>منح الإذن</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: Colors.backgroundDark,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.secondary,
    marginBottom: 16,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  },
  message: {
    fontSize: 16,
    color: Colors.white,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  button: {
    backgroundColor: Colors.secondary,
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonText: {
    color: Colors.primary, // Or Colors.backgroundDark for contrast
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-bold',
  },
});

export default LocationPermission;
