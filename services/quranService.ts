
import { Surah, Ayah, AudioDataItem } from '../types';
import chaptersDataFromFile from '../assets/data/quran/chapters.en';
import { surahDataLoaders } from './quranDataManifest'; // Import the new manifest

const actualChaptersData: any[] = (chaptersDataFromFile && chaptersDataFromFile.length > 0 && Array.isArray(chaptersDataFromFile[0])) 
                               ? chaptersDataFromFile[0] 
                               : [];

interface VerseDataItem {
  number: number; 
  text: {
    ar: string;
    en: string;
  };
  juz: number;
  page: number;
  sajda: boolean | {id: number, obligatory: boolean, recommended: boolean}; // Sajda can be boolean or object
}

interface SurahDataFile {
  number: number; 
  name: {
    ar: string;
    en: string;
    transliteration: string;
  };
  revelation_place: {
    ar: string;
    en: string;
  };
  verses_count: number;
  words_count: number;
  letters_count: number;
  verses: VerseDataItem[];
  audio: AudioDataItem[];
}


export const fetchSurahList = async (): Promise<Surah[]> => {
  await new Promise(resolve => setTimeout(resolve, 100)); // Simulate network delay

  if (actualChaptersData.length > 0) {
    const formattedSurahs: Surah[] = actualChaptersData.map(s => ({
      id: s.id,
      name_arabic: s.name_arabic,
      name_english: s.translated_name.name || s.name_simple,
      revelation_type: s.revelation_place === "مكية" || s.revelation_place === "Meccan" ? "Meccan" : "Medinan",
      total_verses: s.verses_count,
      pages: s.pages as [number, number], 
    }));
    return Promise.resolve(formattedSurahs);
  } else {
    console.warn("Chapters data is not in the expected format or is empty. Falling back to empty list for Surahs.");
    return Promise.resolve([]);
  }
};

const mapVerseToAyah = (verse: VerseDataItem, surahNumber: number, surahAudioLinks: AudioDataItem[]): Ayah => {
  let sajdaValue = false;
  if (typeof verse.sajda === 'boolean') {
    sajdaValue = verse.sajda;
  } else if (typeof verse.sajda === 'object' && verse.sajda !== null) {
    sajdaValue = verse.sajda.obligatory || verse.sajda.recommended;
  }
  return {
    id: (surahNumber * 1000) + verse.number,
    surah_number: surahNumber,
    verse_number: verse.number,
    text: verse.text.ar,
    translation: verse.text.en,
    page: verse.page,
    juz: verse.juz,
    sajda: sajdaValue,
    surahAudioLinks: surahAudioLinks,
  };
};

export const fetchAyahsForSurah = async (surahNumber: number): Promise<Ayah[]> => {
  try {
    const loadSurahData = surahDataLoaders[surahNumber];
    if (!loadSurahData) {
      throw new Error(`لا يوجد مُحمِّل لبيانات السورة رقم ${surahNumber} في الملف المجمع.`);
    }
    
    const surahModule = await loadSurahData();
    const jsonData = (surahModule.default || surahModule) as SurahDataFile;

    if (!jsonData || !jsonData.verses || jsonData.number !== surahNumber) {
      console.error(`Surah data for surah ${surahNumber} from imported JSON is invalid, missing verses, or has mismatched surah number.`);
      throw new Error(`بيانات غير صالحة للسورة رقم ${surahNumber}.`);
    }

    const ayahs: Ayah[] = jsonData.verses.map((verse) => mapVerseToAyah(verse, surahNumber, jsonData.audio));
    
    return ayahs;
  } catch (error: any) {
    console.error(`فشل في تحميل آيات السورة رقم ${surahNumber}:`, error);
    if (error.message.includes('Cannot find module') || error.message.includes('לא נמצא מודול')) {
        throw new Error(`ملف السورة رقم ${surahNumber} غير موجود أو تعذر الوصول إليه. التفاصيل: ${error.message}`);
    } else if (error instanceof SyntaxError) {
        throw new Error(`ملف السورة رقم ${surahNumber} يحتوي على بيانات غير صالحة. التفاصيل: ${error.message}`);
    }
    throw new Error(`تعذر تحميل آيات سورة رقم ${surahNumber}. التفاصيل: ${error.message}`);
  }
};

let allAyahsCache: Ayah[] | null = null;

export const fetchAllAyahs = async (): Promise<Ayah[]> => {
  if (allAyahsCache) {
    return allAyahsCache;
  }

  const allAyahsPromises: Promise<Ayah[]>[] = [];
  for (const surahNumberStr in surahDataLoaders) {
    const surahNumber = parseInt(surahNumberStr, 10);
    if (!isNaN(surahNumber)) {
      allAyahsPromises.push(fetchAyahsForSurah(surahNumber));
    }
  }

  try {
    const results = await Promise.all(allAyahsPromises);
    allAyahsCache = results.flat();
    return allAyahsCache;
  } catch (error) {
    console.error("Failed to fetch all ayahs:", error);
    throw error; // Re-throw to be handled by caller
  }
};

export const getAyahsForPageNumber = (pageNumber: number, allAyahs: Ayah[]): Ayah[] => {
  return allAyahs.filter(ayah => ayah.page === pageNumber);
};

export const getPageMetadata = (
  pageNumber: number, 
  ayahsOnPage: Ayah[], 
  surahList: Surah[]
): { surahsOnPage: { name_arabic: string; id: number }[], juzNumber?: number } => {
  if (!ayahsOnPage || ayahsOnPage.length === 0) {
    return { surahsOnPage: [] };
  }

  const surahIdsOnPage = new Set<number>();
  let juzNumber: number | undefined = undefined;

  ayahsOnPage.forEach(ayah => {
    surahIdsOnPage.add(ayah.surah_number);
    if (ayah.juz && juzNumber === undefined) { // Take the first Juz number encountered on the page
      juzNumber = ayah.juz;
    } else if (ayah.juz && juzNumber !== undefined && ayah.juz !== juzNumber) {
      // Handle multiple Juz numbers on a page if necessary, e.g., display a range or primary one.
      // For now, we keep the first one encountered.
    }
  });

  const surahsOnPage = Array.from(surahIdsOnPage)
    .map(id => {
      const surahInfo = surahList.find(s => s.id === id);
      return surahInfo ? { name_arabic: surahInfo.name_arabic, id: surahInfo.id } : null;
    })
    .filter(s => s !== null) as { name_arabic: string; id: number }[];
    
  return { surahsOnPage, juzNumber };
};
