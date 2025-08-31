import { PrayerTimes, Ayah, AdhanSoundOption, NotificationSettings, Prayer } from './types'; 

export const APP_NAME = "صلاتي - Salaty";

// Placeholder for API endpoints if you choose to use real APIs later
export const PRAYER_TIMES_API_ENDPOINT = "https://api.aladhan.com/v1/timings"; // Example
export const QURAN_API_ENDPOINT = "https://api.alquran.cloud/v1"; // Example
export const TAFSIR_API_BASE_URL = "https://api.alquran.cloud/v1"; // Changed from v2 to v1
export const DEFAULT_TAFSIR_EDITION_IDENTIFIER = "ar.muyassar"; // التفسير الميسر

// Placeholder image URI for Home Screen background
// User should replace this with a local asset or a valid remote URI.
export const HOME_BACKGROUND_IMAGE_URI = "https://images.unsplash.com/photo-1558014350-f7e280164d75?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1000&q=80"; // Example placeholder

export const TOTAL_QURAN_PAGES = 604;

// Base prayers for local calculation
export const BASE_PRAYERS: Prayer[] = [
  { name: 'fajr', time: '00:00', arabicName: 'الفجر' },
  { name: 'sunrise', time: '00:00', arabicName: 'الشروق' },
  { name: 'dhuhr', time: '00:00', arabicName: 'الظهر' },
  { name: 'asr', time: '00:00', arabicName: 'العصر' },
  { name: 'maghrib', time: '00:00', arabicName: 'المغرب' },
  { name: 'isha', time: '00:00', arabicName: 'العشاء' },
];


export const MOCK_PRAYER_TIMES: PrayerTimes = {
  date: new Date().toLocaleDateString('ar-EG'),
  fajr: "04:30 AM",
  dhuhr: "12:00 PM",
  asr: "03:30 PM",
  maghrib: "06:00 PM",
  isha: "07:30 PM",
};

export const MOCK_AYAT_AL_FATIHA: Ayah[] = [
  { id: 1, surah_number: 1, verse_number: 1, text: "بِسْمِ اللَّهِ الرَّحْمَـٰنِ الرَّحِيمِ", translation: "In the name of Allah, the Entirely Merciful, the Especially Merciful.", page: 1 },
  { id: 2, surah_number: 1, verse_number: 2, text: "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ", translation: "All praise is due to Allah, Lord of the worlds.", page: 1 },
  { id: 3, surah_number: 1, verse_number: 3, text: "الرَّحْمَـٰنِ الرَّحِيمِ", translation: "The Entirely Merciful, the Especially Merciful,", page: 1 },
  { id: 4, surah_number: 1, verse_number: 4, text: "مَالِكِ يَوْمِ الدِّينِ", translation: "Sovereign of the Day of Recompense.", page: 1 },
  { id: 5, surah_number: 1, verse_number: 5, text: "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ", translation: "It is You we worship and You we ask for help.", page: 1 },
  { id: 6, surah_number: 1, verse_number: 6, text: "اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ", translation: "Guide us to the straight path.", page: 1 },
  { id: 7, surah_number: 1, verse_number: 7, text: "صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ", translation: "The path of those upon whom You have bestowed favor, not of those who have evoked [Your] anger or of those who are astray.", page: 1 },
];

// --- Notification Settings Constants ---
export const ADHAN_SOUND_OPTIONS: AdhanSoundOption[] = [
  { id: 'default', name: 'صوت الإشعار الافتراضي' },
  { id: 'makki', name: 'أذان الحرم المكي', fileName: 'adhan_makki.mp3' },
  { id: 'kurdi', name: 'أذان أحمد الكردي', fileName: 'adhan_kurdi.mp3' },
];

export const PRE_NOTIFICATION_OFFSET_OPTIONS = [5, 10, 15, 20, 30];

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  masterEnabled: true,
  sound: 'makki', // تغيير من 'default' إلى 'makki' لضمان عمل صوت الأذان
  prayers: {
    fajr: true,
    dhuhr: true,
    asr: true,
    maghrib: true,
    isha: true,
    sunrise: false,
  },
  preNotificationEnabled: true, // تفعيل إشعارات اقتراب الصلاة افتراضياً
  preNotificationOffset: 15,
};

// AsyncStorage keys
export const ASYNC_STORAGE_NOTIFICATION_SETTINGS_KEY = 'SalatyNotificationSettings';
export const ASYNC_STORAGE_PRAYER_NOTIFICATION_IDS_KEY = 'SalatyPrayerNotificationIds';
export const ASYNC_STORAGE_LATEST_PRAYER_TIMES = 'SalatyLatestPrayerTimes';
export const ASYNC_STORAGE_LAST_NOTIFICATION_SCHEDULE_DATE = 'SalatyLastNotificationScheduleDate';
export const ASYNC_STORAGE_BOOKMARKS_KEY = 'SalatyQuranBookmarks';
export const ASYNC_STORAGE_FONT_SIZE_KEY = 'SalatyQuranFontSize';
export const ASYNC_STORAGE_SELECTED_RECITER_ID_KEY = 'SalatyQuranSelectedReciterId'; 
export const ASYNC_STORAGE_LAST_READ_PAGE_KEY = 'SalatyLastReadPage';
export const ASYNC_STORAGE_CHAT_HISTORY_KEY = 'SalatyChatHistory';
export const ASYNC_STORAGE_ADHKAR_REMINDERS_KEY = 'SalatyAdhkarReminders';
export const ASYNC_STORAGE_ACTIVITY_LOGS_KEY = 'SalatyActivityLogs';
export const ASYNC_STORAGE_ADHKAR_FAVORITES_KEY = 'SalatyAdhkarFavorites';


// Constants for Chatbot Follow-up Notifications
export const ASYNC_STORAGE_LAST_EMOTIONAL_CONTEXT = 'SalatyLastEmotionalContext';
export const ASYNC_STORAGE_LAST_EMOTIONAL_TIMESTAMP = 'SalatyLastEmotionalTimestamp';
export const ASYNC_STORAGE_FOLLOW_UP_NOTIFICATION_ID = 'SalatyFollowUpNotificationId';
export const HOURS_FOR_RECENT_EMOTIONAL_INTERACTION = 2; // Consider interaction recent if within 2 hours
export const FOLLOW_UP_NOTIFICATION_DELAY_HOURS = 12; // Send follow-up after 12 hours
export const SESSION_TIMEOUT_HOURS = 1; // Consider session timed out for follow-up greeting after 1 hour