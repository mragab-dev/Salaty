// constants/colors.ts
// Palette based on the user's provided spiritual theme.

export const Colors = {
  // Deep spiritual blues and golds
  primary: '#1A2F45', // Richer deep blue
  primaryLight: '#2C4A6B',
  primaryDark: '#102030', // Added darker shade of primary
  secondary: '#C4A052', // Softer gold
  secondaryLight: '#D9BC76',
  accent: '#8B5E3C', // Warmer brown
  
  // Spiritual gradients (can be used for backgrounds or accents)
  spiritualBlue: '#102942',
  mysticPurple: '#2D1B4F',
  sacredGreen: '#1C4D3D',
  
  // Background variations
  background: '#EBE6D9', // Warmer cream
  backgroundDark: '#0F1A2A', // For dark mode or specific dark sections
  
  // Text colors
  text: '#2C3E50', // General text (dark grayish blue)
  textLight: '#8595A6', // Lighter text for secondary info or on dark backgrounds
  textGold: '#C4A052', // For text that needs a gold highlight
  arabicText: '#1A472A', // Specific dark green for Arabic text for readability & spirituality
  
  // Spiritual effects & UI Elements
  white: '#FFFFFF',
  black: '#000000', // Added for shadows
  success: '#2E8B57', // Sea green for success states
  error: '#CD4B3E',   // Indian red for error states
  divider: 'rgba(196, 160, 82, 0.2)', // Soft gold divider
  
  // New spiritual colors from user's request
  moonlight: '#F0F0F0', // Very light gray, almost white
  starlight: '#FFE978', // Light yellow, like starlight
  prayer: '#4A90A4',    // Calming blue for prayer related elements
  meditation: '#6B5B95', // Deep purple for meditation or focus elements

  // Retain some semantic names from old palette if they map well, or add new ones.
  // These can be direct mappings or new conceptual colors.
  // Example: if islamicGreen was a key color, decide if sacredGreen or primary replaces it.
  // For this update, we'll rely on the new names above primarily.
  // Adding some common grays for UI elements if not covered:
  grayLight: '#E0E0E0',
  grayMedium: '#a0a0a0',
  grayDark: '#767577',
  transparent: 'transparent',

  // Specific semantic mappings if needed, derived from the new palette
  prayerCardNextBg: '#C4A052', // secondary (Softer gold)
  prayerCardNextText: '#1A2F45', // primary (Richer deep blue)
};

export default Colors;