

export interface Prayer {
  name: string;
  time: string;
  arabicName: string;
  date?: string; // Optional: To store the formatted date string with prayer times
}

export interface PrayerTimes {
  date: string;
  fajr: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
}

export interface Adhkar {
  id: string;
  category: string; // e.g., "Morning", "Evening"
  arabic: string;
  translation?: string; // Optional English translation
  reference?: string; // e.g., "Sahih Bukhari"
  count?: number; // How many times to recite
  fadl?: string; // The virtue/merit of the dhikr
}

export interface AudioDataItem {
  id: number;
  reciter: {
    ar: string;
    en: string;
  };
  rewaya: {
    ar: string;
    en: string;
  };
  server: string;
  link: string;
}

export interface Ayah {
  id: number;
  surah_number: number;
  verse_number: number;
  text: string; // Arabic text
  translation?: string; // Optional translation
  page: number; // Page number in the Mushaf
  juz?: number; // Juz number
  sajda?: boolean; // Sajda information
  surahAudioLinks?: AudioDataItem[]; // Audio links from the parent Surah's JSON
  isHighlighted?: boolean; // For highlighting currently playing Ayah
  isBookmarked?: boolean; // For bookmarking functionality
}

export interface Surah {
  id: number;
  name_arabic: string;
  name_english: string;
  revelation_type: string; // "Meccan" or "Medinan"
  total_verses: number;
  pages: [number, number]; // [start_page, end_page]
  verses?: Ayah[]; // Loaded on demand
}

// React Native Geolocation type (subset)
export interface RNGeolocationCoordinates {
    latitude: number;
    longitude: number;
    altitude: number | null;
    accuracy: number | null;
    altitudeAccuracy: number | null;
    heading: number | null;
    speed: number | null;
}

export interface Reciter {
  id: string; // Unique identifier for the reciter (e.g., "Alafasy_128kbps")
  name: string; // English name
  nameAr: string; // Arabic name
  rewaya: {
    ar: string;
    en: string;
  };
  // URL pattern for verse-by-verse audio. Example: https://everyayah.com/data/Alafasy_128kbps
  // Where {surah} and {ayah} will be replaced.
  serverUrl: string; 
  // Suffix for audio files, e.g. ".mp3"
  fileSuffix?: string; 
}

// --- Tafsir Types ---
export interface TafseerEditionInfo {
  identifier: string;
  language: string;
  name: string;
  englishName: string;
  format: string; // "text" or "audio"
  type: string; // "tafsir", "translation", etc.
  direction: string | null; // "ltr" or "rtl"
}

export interface TafseerEdition {
  id: string; // identifier
  name: string; // englishName
  nameAr: string; // name (if language is 'ar')
  language: string;
}

export interface ApiTafseerAyahData {
  number: number;
  text: string;
  edition: TafseerEditionInfo;
  surah: {
    number: number;
    name: string;
    englishName: string;
    englishNameTranslation: string;
    revelationType: string;
    numberOfAyahs: number;
  };
  numberInSurah: number;
  juz: number;
  manzil: number;
  page: number;
  ruku: number;
  hizbQuarter: number;
  sajda: boolean | object; // API can return object for sajda details
}

export interface ApiTafseerResponse {
  code: number;
  status: string;
  data: ApiTafseerAyahData;
}

// --- Notification Settings Types ---
export type AdhanSound = 'default' | 'makki' | 'kurdi';

export interface AdhanSoundOption {
  id: AdhanSound;
  name: string; // User-facing name in Arabic
  fileName?: string; // e.g., 'adhan_makki.mp3'
}

export interface PrayerNotificationSettings {
  fajr: boolean;
  dhuhr: boolean;
  asr: boolean;
  maghrib: boolean;
  isha: boolean;
}

export interface NotificationSettings {
  masterEnabled: boolean;
  sound: AdhanSound;
  prayers: PrayerNotificationSettings;
  preNotificationEnabled: boolean; // Reminder before prayer time
  preNotificationOffset: number; // Reminder offset in minutes
}

// Chatbot Message Type
export interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  type: 'text' | 'quick_reply'; // Retained for consistency, 'quick_reply' might not be stored in history
  isFavorite?: boolean;
  ayahRef?: string;
  dhikrCategory?: string;
  dhikrCategoryName?: string;
  timestamp: number; // For session management and follow-up
  emotionalContext?: string; // To store the detected emotion (e.g., "حزن", "قلق")
}

// --- Adhkar Reminder Types ---
export interface AdhkarCategoryInfo { // For AdhkarRemindersScreen to list categories
  id: string; // Category name, e.g., "أذكار الصباح"
  name: string; // Display name, e.g., "أذكار الصباح"
}

export interface AdhkarReminder {
  categoryId: string; // Matches AdhkarCategoryInfo.id
  categoryName: string; // For easier display in notifications if needed
  isEnabled: boolean;
  time: string; // "HH:MM" format (24-hour)
  notificationId?: string; // Expo notification ID for cancellation
}

// --- Activity Log Types ---
export type ActivityType = 'adhkar_completed' | 'quran_read_session' | 'tasbih_set_completed' | 'memorization_test_completed';

export interface ActivityLogBase {
  id: string;
  type: ActivityType;
  timestamp: number;
  date: string; // YYYY-MM-DD
}

export interface AdhkarCompletedLog extends ActivityLogBase {
  type: 'adhkar_completed';
  categoryName: string;
}

export interface QuranReadSessionLog extends ActivityLogBase {
  type: 'quran_read_session';
  details: string; // e.g., "تم تصفح المصحف"
}

export interface TasbihSetCompletedLog extends ActivityLogBase {
  type: 'tasbih_set_completed';
  dhikrName: string;
  count: number;
  details?: string; // Optional field for more details, ensure alignment if used
}

export interface MemorizationTestCompletedLog extends ActivityLogBase {
  type: 'memorization_test_completed';
  surahName: string;
  ayahRange: string;
  difficulty: string;
}

export type ActivityLog = AdhkarCompletedLog | QuranReadSessionLog | TasbihSetCompletedLog | MemorizationTestCompletedLog;

// --- Tasbih Types ---
export interface DhikrOption {
    id: string;
    text: string;
    count: number;
    fadl: string;
}
