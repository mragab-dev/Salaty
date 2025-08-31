// declarations.d.ts

/**
 * Declares the 'require' function globally for TypeScript.
 * In React Native, 'require' is often used to import static assets like images.
 * This declaration helps TypeScript understand its usage and prevents type errors.
 * The return type is 'any' for broad compatibility, as the exact return type
 * can vary (e.g., a number for image assets processed by Metro).
 */
declare var require: (path: string) => any;

// Declarations for image assets to allow importing them in TypeScript files.
declare module '*.png' {
  const value: import('react-native').ImageSourcePropType;
  export default value;
}

declare module '*.jpg' {
  const value: import('react-native').ImageSourcePropType;
  export default value;
}

declare module '*.jpeg' {
  const value: import('react-native').ImageSourcePropType;
  export default value;
}

// Declaration for audio assets
declare module '*.mp3' {
  const value: any; // Or a more specific type if available, e.g., from expo-av
  export default value;
}
