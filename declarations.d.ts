// declarations.d.ts

/**
 * Declares the 'require' function globally for TypeScript.
 * In React Native, 'require' is often used to import static assets like images.
 * This declaration helps TypeScript understand its usage and prevents type errors.
 * The return type is 'any' for broad compatibility, as the exact return type
 * can vary (e.g., a number for image assets processed by Metro).
 */
declare var require: (path: string) => any;

// Optional: If you want more specific typing for image assets when using 'require',
// you could also declare modules for common image types. However, the global
// 'require' declaration above is usually sufficient to resolve the "Cannot find name" error.
// Example for more specific image typing (if you were to use import syntax more often):
/*
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
*/
