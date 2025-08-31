// Jest setup file for React Native/Expo testing

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);



// Mock common Expo modules
jest.mock('expo-av', () => ({}));
jest.mock('expo-location', () => ({}));
jest.mock('expo-notifications', () => ({}));
jest.mock('expo-haptics', () => ({}));
jest.mock('expo-clipboard', () => ({}));

// Mock other common libraries
jest.mock('react-native-svg', () => ({}));
jest.mock('moment-timezone', () => ({}));
jest.mock('adhan', () => ({}));

// Global test timeout
jest.setTimeout(10000);
