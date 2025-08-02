
import { Audio, InterruptionModeIOS, InterruptionModeAndroid, AVPlaybackStatusError, AVPlaybackStatus } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { Reciter, Surah } from '../types';
import { fetchSurahList } from './quranService'; 
import { ASYNC_STORAGE_SELECTED_RECITER_ID_KEY } from '../constants';

// --- Reciter Data ---
export const FEATURED_RECITERS: Reciter[] = [
  {
    id: "Alafasy_128kbps",
    name: "Mishary Rashid Alafasy",
    nameAr: "مشاري راشد العفاسي",
    rewaya: { ar: "حفص عن عاصم", en: "Hafs an Asim" },
    serverUrl: "https://everyayah.com/data/Alafasy_128kbps",
    fileSuffix: ".mp3",
  },
  {
    id: "Abdul_Basit_Murattal_64kbps",
    name: "Abdul Basit Abdus Samad (Murattal)",
    nameAr: "عبد الباسط عبد الصمد (مرتل)",
    rewaya: { ar: "حفص عن عاصم", en: "Hafs an Asim" },
    serverUrl: "https://everyayah.com/data/Abdul_Basit_Murattal_64kbps",
    fileSuffix: ".mp3",
  },
  {
    id: "Husary_128kbps",
    name: "Mahmoud Khalil Al-Husary",
    nameAr: "محمود خليل الحصري",
    rewaya: { ar: "حفص عن عاصم", en: "Hafs an Asim" },
    serverUrl: "https://everyayah.com/data/Husary_128kbps",
    fileSuffix: ".mp3",
  },
  {
    id: "Minshawy_Murattal_128kbps",
    name: "Mohamed Siddiq El-Minshawi (Murattal)",
    nameAr: "محمد صديق المنشاوي (مرتل)",
    rewaya: { ar: "حفص عن عاصم", en: "Hafs an Asim" },
    serverUrl: "https://everyayah.com/data/Minshawy_Murattal_128kbps",
    fileSuffix: ".mp3",
  },
  {
    id: "Ghamadi_40kbps",
    name: "Saad Al-Ghamdi",
    nameAr: "سعد الغامدي",
    rewaya: { ar: "حفص عن عاصم", en: "Hafs an Asim" },
    serverUrl: "https://everyayah.com/data/Ghamadi_40kbps",
    fileSuffix: ".mp3",
  },
  {
    id: "Abu_Bakr_Ash-Shaatree_128kbps",
    name: "Abu Bakr Ash-Shaatree",
    nameAr: "أبو بكر الشاطري",
    rewaya: { ar: "حفص عن عاصم", en: "Hafs an Asim" },
    serverUrl: "https://everyayah.com/data/Abu_Bakr_Ash-Shaatree_128kbps",
    fileSuffix: ".mp3",
  },
  {
    id: "Saood_ash-Shuraym_128kbps",
    name: "Saud Ash-Shuraym",
    nameAr: "سعود الشريم",
    rewaya: { ar: "حفص عن عاصم", en: "Hafs an Asim" },
    serverUrl: "https://everyayah.com/data/Saood_ash-Shuraym_128kbps",
    fileSuffix: ".mp3",
  },
  {
    id: "Abdurrahmaan_As-Sudais_192kbps",
    name: "Abdur-Rahman As-Sudais",
    nameAr: "عبدالرحمن السديس",
    rewaya: { ar: "حفص عن عاصم", en: "Hafs an Asim" },
    serverUrl: "https://everyayah.com/data/Abdurrahmaan_As-Sudais_192kbps",
    fileSuffix: ".mp3",
  },
  {
    id: "ahmed_ibn_ali_al_ajamy_128kbps_ketaballah.net",
    name: "Ahmed Ibn Ali Al-Ajamy",
    nameAr: "أحمد بن علي العجمي",
    rewaya: { ar: "حفص عن عاصم", en: "Hafs an Asim" },
    serverUrl: "https://everyayah.com/data/ahmed_ibn_ali_al_ajamy_128kbps_ketaballah.net",
    fileSuffix: ".mp3",
  },
  {
    id: "Khaalid_Abdullaah_al-Qahtaanee_192kbps",
    name: "Khalid Abdullah Al-Qahtani",
    nameAr: "خالد القحطاني",
    rewaya: { ar: "حفص عن عاصم", en: "Hafs an Asim" },
    serverUrl: "https://everyayah.com/data/Khaalid_Abdullaah_al-Qahtaanee_192kbps",
    fileSuffix: ".mp3",
  },
  {
    id: "Hani_Rifai_192kbps",
    name: "Hani Ar-Rifai",
    nameAr: "هاني الرفاعي",
    rewaya: { ar: "حفص عن عاصم", en: "Hafs an Asim" },
    serverUrl: "https://everyayah.com/data/Hani_Rifai_192kbps",
    fileSuffix: ".mp3",
  },
  {
    id: "Nasser_Alqatami_128kbps",
    name: "Nasser Alqatami",
    nameAr: "ناصر القطامي",
    rewaya: { ar: "حفص عن عاصم", en: "Hafs an Asim" },
    serverUrl: "https://everyayah.com/data/Nasser_Alqatami_128kbps",
    fileSuffix: ".mp3",
  },
  {
    id: "Ali_Jaber_64kbps",
    name: "Ali Jaber",
    nameAr: "علي جابر",
    rewaya: { ar: "حفص عن عاصم", en: "Hafs an Asim" },
    serverUrl: "https://everyayah.com/data/Ali_Jaber_64kbps",
    fileSuffix: ".mp3",
  },
  {
    id: "Mohammad_Ayyub_128kbps",
    name: "Muhammad Ayyub",
    nameAr: "محمد أيوب",
    rewaya: { ar: "حفص عن عاصم", en: "Hafs an Asim" },
    serverUrl: "https://everyayah.com/data/Mohammad_Ayyub_128kbps",
    fileSuffix: ".mp3",
  },
  {
    id: "Fares_Abbad_64kbps",
    name: "Fares Abbad",
    nameAr: "فارس عباد",
    rewaya: { ar: "حفص عن عاصم", en: "Hafs an Asim" },
    serverUrl: "https://everyayah.com/data/Fares_Abbad_64kbps",
    fileSuffix: ".mp3",
  }
];

const AUDIO_DIR = FileSystem.documentDirectory + 'salaty_audio/';

// Helper function to get local URI if it exists
const getLocalAyahUri = async (reciterId: string, surahId: number, ayahId: number): Promise<string | null> => {
  const surahDir = `${AUDIO_DIR}${reciterId}/${surahId}/`;
  const fileUri = `${surahDir}${ayahId}.mp3`;
  try {
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    if (fileInfo.exists) {
      return fileUri;
    }
  } catch (e) {
    // This can happen if directory doesn't exist, which is fine
  }
  return null;
};

class QuranAudioService {
  private static instance: QuranAudioService;
  private sound: Audio.Sound | null = null;
  private currentReciter: Reciter | null = null;
  private isPlaying: boolean = false;
  private currentPlayingInfo: { surah: number; ayah: number } | null = null;
  
  private onVerseChangeCallback: ((info: { surah: number; ayah: number } | null) => void) | null = null;
  private onPlaybackStateChangeCallback: ((isPlaying: boolean) => void) | null = null;
  private onDetailedPlaybackStatusUpdateCallback: ((status: AVPlaybackStatus) => void) | null = null;

  private surahDetailsMap: Map<number, { totalVerses: number }> = new Map();
  private playbackMode: 'single' | 'surah' = 'single';


  private constructor() {
    this.loadSurahDetails();
  }

  public static getInstance(): QuranAudioService {
    if (!QuranAudioService.instance) {
      QuranAudioService.instance = new QuranAudioService();
    }
    return QuranAudioService.instance;
  }

  private async loadSurahDetails(): Promise<void> {
    try {
      const surahs = await fetchSurahList();
      surahs.forEach(surah => {
        this.surahDetailsMap.set(surah.id, { totalVerses: surah.total_verses });
      });
      console.log("Surah details loaded for audio service.");
    } catch (error) {
      console.error("Error loading Surah details for audio service:", error);
    }
  }

  async initializeAudio(): Promise<void> {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        interruptionModeIOS: InterruptionModeIOS.MixWithOthers,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
        playThroughEarpieceAndroid: false,
      });
      // Ensure base audio directory exists
      await FileSystem.makeDirectoryAsync(AUDIO_DIR, { intermediates: true });
      await this.loadPersistedReciter();
      console.log("Audio service initialized and persisted reciter loaded.");
    } catch (error) {
      console.error('Failed to initialize audio service:', error);
    }
  }

  async loadPersistedReciter(): Promise<void> {
    try {
      const reciterId = await AsyncStorage.getItem(ASYNC_STORAGE_SELECTED_RECITER_ID_KEY);
      if (reciterId) {
        const foundReciter = FEATURED_RECITERS.find(r => r.id === reciterId);
        if (foundReciter) {
          this.currentReciter = foundReciter;
          console.log("Persisted reciter loaded:", foundReciter.nameAr);
        } else {
          console.warn(`Persisted reciter ID "${reciterId}" not found in current list. Using default.`);
          this.currentReciter = FEATURED_RECITERS[0] || null; // Fallback
        }
      } else {
        this.currentReciter = FEATURED_RECITERS[0] || null;
        console.log("No persisted reciter found. Using default:", this.currentReciter?.nameAr);
      }
    } catch (e) {
      console.error("Failed to load persisted reciter:", e);
      this.currentReciter = FEATURED_RECITERS[0] || null; // Fallback
    }
  }

  getReciters(): Reciter[] {
    return FEATURED_RECITERS;
  }

  async setReciter(reciter: Reciter | null): Promise<void> {
    this.currentReciter = reciter;
    console.log("Reciter set to:", reciter?.nameAr);
    try {
        if (reciter) {
            await AsyncStorage.setItem(ASYNC_STORAGE_SELECTED_RECITER_ID_KEY, reciter.id);
            console.log("Reciter preference saved:", reciter.id);
        } else {
            await AsyncStorage.removeItem(ASYNC_STORAGE_SELECTED_RECITER_ID_KEY);
            console.log("Reciter preference cleared.");
        }
    } catch (e) {
        console.error("Failed to save reciter preference:", e);
    }
  }

  getCurrentReciter(): Reciter | null {
    return this.currentReciter;
  }

  private formatNumber(num: number, length: number = 3): string {
    return num.toString().padStart(length, '0');
  }

  private getRemoteAudioUrl(surahNumber: number, ayahNumber: number): string | null {
    if (!this.currentReciter) return null;
    const formattedSurah = this.formatNumber(surahNumber);
    const formattedAyah = this.formatNumber(ayahNumber);
    return `${this.currentReciter.serverUrl}/${formattedSurah}${formattedAyah}${this.currentReciter.fileSuffix || '.mp3'}`;
  }

  private async _internalPlay(surah: number, ayah: number): Promise<void> {
    if (!this.currentReciter) {
        console.warn("No reciter selected. Cannot play audio.");
        return;
    }

    // Unload any existing sound before playing a new one
    if (this.sound) {
        try {
            await this.sound.unloadAsync();
        } catch (e) { /* ignore */ }
    }

    let audioUri = await getLocalAyahUri(this.currentReciter.id, surah, ayah);
    if (!audioUri) {
        audioUri = this.getRemoteAudioUrl(surah, ayah);
    }

    if (!audioUri) {
        console.error("Could not construct audio URI.");
        return;
    }

    console.log(`Playing: ${audioUri}`);
    try {
        this.isPlaying = true;
        this.currentPlayingInfo = { surah, ayah };
        this.onVerseChangeCallback?.(this.currentPlayingInfo);
        this.onPlaybackStateChangeCallback?.(true);

        const { sound } = await Audio.Sound.createAsync({ uri: audioUri }, { shouldPlay: true });
        this.sound = sound;

        sound.setOnPlaybackStatusUpdate(this._onPlaybackStatusUpdate);

    } catch (error: any) {
        console.error(`Error playing audio for Surah ${surah}, Ayah ${ayah}: ${error.message}`);
        this.stopAudio();
    }
}

private _onPlaybackStatusUpdate = async (status: AVPlaybackStatus) => {
    this.onDetailedPlaybackStatusUpdateCallback?.(status);

    if (status.isLoaded) {
        if (this.isPlaying !== status.isPlaying) {
            this.isPlaying = status.isPlaying;
            this.onPlaybackStateChangeCallback?.(this.isPlaying);
        }

        if (status.didJustFinish && !status.isLooping) {
            if (this.playbackMode === 'surah') {
                await this.playNextSequentialAyah();
            } else {
                this.stopAudio(); // Single ayah playback finished
            }
        }
    } else if ((status as AVPlaybackStatusError).error) {
        console.error(`Playback Error: ${(status as AVPlaybackStatusError).error}`);
        this.stopAudio();
    }
};

private async playNextSequentialAyah(): Promise<void> {
    if (!this.currentPlayingInfo) {
        this.stopAudio();
        return;
    }

    let { surah, ayah } = this.currentPlayingInfo;
    const surahData = this.surahDetailsMap.get(surah);
    if (!surahData) {
        console.error(`Details for Surah ${surah} not found for sequential play.`);
        this.stopAudio();
        return;
    }

    if (ayah < surahData.totalVerses) {
        // Play next ayah in the same surah
        ayah++;
        await this._internalPlay(surah, ayah);
    } else {
        // Reached the end of the surah, move to the next one
        if (surah < 114) {
            const nextSurah = surah + 1;
            const nextAyah = 1;
            console.log(`Finished Surah ${surah}, moving to Surah ${nextSurah}.`);
            await this._internalPlay(nextSurah, nextAyah);
        } else {
            console.log(`Finished playing the entire Quran.`);
            this.stopAudio();
        }
    }
}


public async playSurah(surah: number, startingAyah: number = 1): Promise<void> {
    // When starting a new surah (like when changing reciters), we want to
    // stop the old audio but not immediately clear the UI state, because a new
    // state will be set right away.
    await this.stopAudio(true); // Pass `true` to indicate a transition
    this.playbackMode = 'surah';
    await this._internalPlay(surah, startingAyah);
  }


  async pauseAudio(): Promise<void> {
    if (this.sound && this.isPlaying) {
      try {
        await this.sound.pauseAsync();
        this.isPlaying = false;
        this.onPlaybackStateChangeCallback?.(false);
        console.log("Audio paused.");
      } catch (error) {
        console.error("Error pausing audio:", error);
      }
    }
  }

  async resumeAudio(): Promise<void> {
    if (this.sound && !this.isPlaying && this.currentPlayingInfo) {
      try {
        await this.sound.playAsync();
        this.isPlaying = true;
        this.onPlaybackStateChangeCallback?.(true);
        console.log("Audio resumed.");
      } catch (error) {
        console.error("Error resuming audio:", error);
      }
    } else if (!this.sound && this.currentPlayingInfo) { 
        console.log("No sound object, attempting to replay current Ayah to resume.");
        await this._internalPlay(this.currentPlayingInfo.surah, this.currentPlayingInfo.ayah);
    }
  }

  async stopAudio(isTransition: boolean = false): Promise<void> {
    this.playbackMode = 'single'; // Always reset mode on stop
    if (this.sound) {
      try {
        await this.sound.stopAsync(); 
        await this.sound.unloadAsync();
        console.log("Audio stopped and unloaded.");
      } catch (error) {
        // Suppress errors on stop/unload
      }
      this.sound = null; 
    }
    
    // Only nullify the callbacks if it's a hard stop, not a transition.
    // The new playback will immediately set a new verse info.
    if (this.isPlaying || this.currentPlayingInfo) {
        this.isPlaying = false;
        this.currentPlayingInfo = null;
        this.onPlaybackStateChangeCallback?.(false);
        if (!isTransition) { // This is the key change
            this.onVerseChangeCallback?.(null);
        }
    }
  }

  isAudioPlaying(): boolean {
    return this.isPlaying;
  }
  
  getCurrentPlayingAyahInfo(): { surah: number; ayah: number } | null {
    return this.currentPlayingInfo;
  }

  setOnVerseChange(callback: (info: { surah: number; ayah: number } | null) => void): void {
    this.onVerseChangeCallback = callback;
  }

  setOnPlaybackStateChange(callback: (isPlaying: boolean) => void): void {
    this.onPlaybackStateChangeCallback = callback;
  }

  public setOnDetailedPlaybackStatusUpdate(callback: ((status: AVPlaybackStatus) => void) | null): void {
    this.onDetailedPlaybackStatusUpdateCallback = callback;
  }
}

export default QuranAudioService;
