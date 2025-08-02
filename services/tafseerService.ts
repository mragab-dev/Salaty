
import { TAFSIR_API_BASE_URL } from '../constants';
import { TafseerEditionInfo, TafseerEdition, ApiTafseerResponse, ApiTafseerAyahData } from '../types';

interface ApiEditionsResponse {
  code: number;
  status: string;
  data: TafseerEditionInfo[];
}

export const fetchAvailableTafseers = async (): Promise<TafseerEdition[]> => {
  try {
    const response = await fetch(`${TAFSIR_API_BASE_URL}/edition/type/tafsir`);
    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Failed to fetch Tafsir editions: ${response.status} ${errorData}`);
    }
    const result: ApiEditionsResponse = await response.json();
    if (result.code === 200 && Array.isArray(result.data)) {
      // Filter for Arabic Tafsirs and map to simpler structure
      return result.data
        .filter(edition => edition.language === 'ar' && edition.format === 'text')
        .map(edition => ({
          id: edition.identifier,
          name: edition.englishName, // Storing English name for potential future use
          nameAr: edition.name,    // Arabic name for display
          language: edition.language,
        }));
    } else {
      throw new Error('Invalid data structure for Tafsir editions.');
    }
  } catch (error) {
    console.error("Error fetching available Tafsirs:", error);
    throw error; // Re-throw to be handled by the caller
  }
};

export const fetchTafseerForAyah = async (
  surahNumber: number,
  ayahNumber: number,
  editionIdentifier: string
): Promise<ApiTafseerAyahData> => {
  try {
    const response = await fetch(`${TAFSIR_API_BASE_URL}/ayah/${surahNumber}:${ayahNumber}/${editionIdentifier}`);
    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Failed to fetch Tafsir for Ayah ${surahNumber}:${ayahNumber}, Edition: ${editionIdentifier}. Status: ${response.status} ${errorData}`);
    }
    const result: ApiTafseerResponse = await response.json();
    if (result.code === 200 && result.data) {
      return result.data;
    } else {
      throw new Error(`Invalid data structure for Tafsir of Ayah ${surahNumber}:${ayahNumber}. Status: ${result.status}`);
    }
  } catch (error) {
    console.error(`Error fetching Tafsir for Ayah ${surahNumber}:${ayahNumber}, Edition: ${editionIdentifier}:`, error);
    throw error; // Re-throw to be handled by the caller
  }
};
