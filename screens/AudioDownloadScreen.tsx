import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, FlatList, Alert, ActivityIndicator } from 'react-native';
import * as FileSystem from 'expo-file-system';
import Colors from '../constants/colors';
import { DownloadIcon, CheckmarkIcon, CloseIcon } from '../components/Icons'; 
import QuranAudioService from '../services/quranAudioService';
import { fetchSurahList } from '../services/quranService';
import { Reciter, Surah } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import { RFValue } from 'react-native-responsive-fontsize';

const AnyFlatList = FlatList as any;
const AUDIO_DIR = FileSystem.documentDirectory + 'salaty_audio/';

const AudioDownloadScreen: React.FC = () => {
  const [reciters, setReciters] = useState<Reciter[]>([]);
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [selectedReciter, setSelectedReciter] = useState<Reciter | null>(null);
  const [selectedSurahIds, setSelectedSurahIds] = useState<Set<number>>(new Set());
  
  const [loading, setLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<{ surahName: string, progress: string } | null>(null);
  const [downloadedSurahs, setDownloadedSurahs] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const audioService = QuranAudioService.getInstance();

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        await audioService.initializeAudio(); // Ensure directory exists
        const [reciterList, surahList] = await Promise.all([
          audioService.getReciters(),
          fetchSurahList()
        ]);
        setReciters(reciterList);
        setSurahs(surahList);
        const currentReciter = audioService.getCurrentReciter();
        if (currentReciter) {
            setSelectedReciter(currentReciter);
        } else if (reciterList.length > 0) {
            setSelectedReciter(reciterList[0]);
        }
      } catch (e: any) {
        setError(e.message || "فشل في تحميل البيانات");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const checkDownloadedSurahs = useCallback(async () => {
    if (!selectedReciter || surahs.length === 0) {
      setDownloadedSurahs(new Set());
      return;
    }
    const reciterDir = `${AUDIO_DIR}${selectedReciter.id}/`;
    const downloaded = new Set<number>();
    for (const surah of surahs) {
      const surahDir = `${reciterDir}${surah.id}/`;
      try {
        const dirInfo = await FileSystem.getInfoAsync(surahDir);
        if (dirInfo.exists) {
          const files = await FileSystem.readDirectoryAsync(surahDir);
          if (files.length >= surah.total_verses) {
            downloaded.add(surah.id);
          }
        }
      } catch (e) { /* Dir does not exist */ }
    }
    setDownloadedSurahs(downloaded);
  }, [selectedReciter, surahs]);

  useEffect(() => {
    checkDownloadedSurahs();
  }, [checkDownloadedSurahs]);

  const handleReciterSelect = (reciter: Reciter) => {
    setSelectedReciter(reciter);
    setSelectedSurahIds(new Set());
  };

  const toggleSurahSelection = (surahId: number) => {
    if (downloadedSurahs.has(surahId)) return;
    setSelectedSurahIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(surahId)) newSet.delete(surahId);
      else newSet.add(surahId);
      return newSet;
    });
  };

  const handleSelectAllSurahs = () => {
    const allNonDownloadedIds = surahs
        .filter(s => !downloadedSurahs.has(s.id))
        .map(s => s.id);
    if (selectedSurahIds.size === allNonDownloadedIds.length) {
      setSelectedSurahIds(new Set());
    } else {
      setSelectedSurahIds(new Set(allNonDownloadedIds));
    }
  };

  const downloadSurah = async (reciter: Reciter, surah: Surah) => {
    const reciterDir = `${AUDIO_DIR}${reciter.id}/`;
    const surahDir = `${reciterDir}${surah.id}/`;
    await FileSystem.makeDirectoryAsync(surahDir, { intermediates: true });
    
    for (let i = 1; i <= surah.total_verses; i++) {
        setDownloadProgress({ surahName: surah.name_arabic, progress: `${i}/${surah.total_verses}` });
        const formattedSurah = surah.id.toString().padStart(3, '0');
        const formattedAyah = i.toString().padStart(3, '0');
        const remoteUrl = `${reciter.serverUrl}/${formattedSurah}${formattedAyah}${reciter.fileSuffix || '.mp3'}`;
        const localUri = `${surahDir}${i}.mp3`;
        
        try {
            const fileInfo = await FileSystem.getInfoAsync(localUri);
            if (!fileInfo.exists) {
                await FileSystem.downloadAsync(remoteUrl, localUri);
            }
        } catch (downloadError) {
            console.error(`Failed to download ${remoteUrl}`, downloadError);
            throw new Error(`فشل تحميل الآية ${i} من سورة ${surah.name_arabic}`);
        }
    }
  };

  const handleDownloadSelected = async () => {
    if (!selectedReciter || selectedSurahIds.size === 0) {
      Alert.alert("تنبيه", "الرجاء اختيار القارئ والسور المراد تحميلها أولاً.");
      return;
    }
    setIsDownloading(true);
    setDownloadProgress(null);
    let errorOccurred = false;
    try {
        const surahsToDownload = surahs.filter(s => selectedSurahIds.has(s.id));
        for (const surah of surahsToDownload) {
            if (downloadedSurahs.has(surah.id)) continue;
            await downloadSurah(selectedReciter, surah);
            setDownloadedSurahs(prev => new Set(prev).add(surah.id));
        }
    } catch (error: any) {
        errorOccurred = true;
        Alert.alert("خطأ في التحميل", error.message);
    }
    
    setIsDownloading(false);
    setDownloadProgress(null);
    if (!errorOccurred) {
        Alert.alert("اكتمل التحميل", "تم تحميل السور المختارة بنجاح.");
        setSelectedSurahIds(new Set());
    }
  };
  
  const handleDeleteSurah = async (surahId: number) => {
    if (!selectedReciter) return;
    const surah = surahs.find(s => s.id === surahId);
    if (!surah) return;
    Alert.alert(
      "تأكيد الحذف",
      `هل أنت متأكد أنك تريد حذف سورة ${surah.name_arabic} من جهازك؟`,
      [
        { text: "إلغاء", style: "cancel" },
        { 
          text: "حذف", 
          style: "destructive", 
          onPress: async () => {
            const surahDir = `${AUDIO_DIR}${selectedReciter.id}/${surahId}/`;
            try {
              await FileSystem.deleteAsync(surahDir, { idempotent: true });
              setDownloadedSurahs(prev => {
                const newSet = new Set(prev);
                newSet.delete(surahId);
                return newSet;
              });
            } catch (e) {
              Alert.alert("خطأ", "لم نتمكن من حذف السورة.");
              console.error("Failed to delete surah:", e);
            }
          }
        }
      ]
    );
  };
  
  const renderReciterItem = ({ item }: { item: Reciter }) => (
    <TouchableOpacity
      style={[styles.itemChip, selectedReciter?.id === item.id && styles.itemChipSelected]}
      onPress={() => handleReciterSelect(item)}
    >
      <Text style={[styles.itemChipText, selectedReciter?.id === item.id && styles.itemChipTextSelected]}>{item.nameAr}</Text>
    </TouchableOpacity>
  );

  const renderSurahItem = ({ item }: { item: Surah }) => {
    const isSelected = selectedSurahIds.has(item.id);
    const isDownloaded = downloadedSurahs.has(item.id);
    return (
        <View style={[styles.itemRow, isDownloaded && styles.itemRowDisabled]}>
            <TouchableOpacity
                style={[styles.itemButton, isSelected && styles.itemButtonSelected]}
                onPress={() => toggleSurahSelection(item.id)}
                disabled={isDownloaded}
            >
                <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                    {isSelected && <CheckmarkIcon color={Colors.white} size={RFValue(12)} />}
                </View>
                <Text style={styles.itemText}>{item.id}. {item.name_arabic}</Text>
            </TouchableOpacity>
            {isDownloaded &&
                <TouchableOpacity onPress={() => handleDeleteSurah(item.id)} style={styles.deleteButton}>
                    <CloseIcon color={Colors.error} size={RFValue(18)} />
                </TouchableOpacity>
            }
      </View>
    );
  };

  if (loading) {
      return <LoadingSpinner text="جاري تحميل البيانات..." style={styles.container} color={Colors.primary} />
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <DownloadIcon color={Colors.secondary} size={RFValue(28)}/>
        <Text style={styles.headerTitle}>تحميل الصوتيات للاستماع بدون انترنت</Text>
      </View>
      
      {error && <Text style={styles.errorText}>{error}</Text>}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>1. اختر القارئ:</Text>
        <AnyFlatList
            data={reciters} renderItem={renderReciterItem} keyExtractor={(item: Reciter) => item.id}
            horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}
          />
      </View>

      <View style={[styles.section, { flex: 1 }]}>
        <View style={styles.surahListHeader}>
            <Text style={styles.sectionTitle}>2. اختر السور للتحميل:</Text>
            <TouchableOpacity style={styles.selectAllButton} onPress={handleSelectAllSurahs}>
                <Text style={styles.selectAllButtonText}>تحديد الكل</Text>
            </TouchableOpacity>
        </View>
        <AnyFlatList
            data={surahs} renderItem={renderSurahItem} keyExtractor={(item: Surah) => item.id.toString()}
            contentContainerStyle={{ paddingBottom: RFValue(10) }}
        />
      </View>
      
      <View style={styles.downloadActionsContainer}>
        {isDownloading && downloadProgress ? (
            <View style={styles.progressContainer}>
                <ActivityIndicator color={Colors.primary} />
                <Text style={styles.progressText}>
                    جاري تحميل: {downloadProgress.surahName} ({downloadProgress.progress})
                </Text>
            </View>
        ) : (
            <TouchableOpacity 
                style={[styles.downloadButton, (!selectedReciter || selectedSurahIds.size === 0) && styles.disabledButton]} 
                onPress={handleDownloadSelected}
                disabled={!selectedReciter || selectedSurahIds.size === 0 || isDownloading}
            >
              <Text style={styles.downloadButtonText}>تحميل السور المختارة ({selectedSurahIds.size})</Text>
            </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, },
  headerContainer: { backgroundColor: Colors.primary, paddingVertical: RFValue(20), paddingHorizontal: RFValue(20), alignItems: 'center', flexDirection: 'row-reverse', justifyContent: 'center', },
  headerTitle: { fontSize: RFValue(22), color: Colors.secondary, fontWeight: 'bold', marginRight: RFValue(10), fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-bold', },
  errorText: { color: Colors.error, textAlign: 'center', padding: RFValue(10), },
  section: { paddingHorizontal: RFValue(15), paddingTop: RFValue(15), marginBottom: RFValue(10), },
  sectionTitle: { fontSize: RFValue(18), fontWeight: '600', color: Colors.primary, marginBottom: RFValue(10), fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium', textAlign: 'right', },
  surahListHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', },
  selectAllButton: { paddingVertical: RFValue(5), paddingHorizontal: RFValue(10), backgroundColor: Colors.primaryLight, borderRadius: RFValue(5), },
  selectAllButtonText: { color: Colors.white, fontSize: RFValue(13), },
  horizontalList: { paddingVertical: RFValue(5), },
  itemChip: { paddingVertical: RFValue(8), paddingHorizontal: RFValue(16), borderRadius: RFValue(20), borderWidth: 1, borderColor: Colors.secondary, backgroundColor: Colors.white, marginRight: RFValue(10), },
  itemChipSelected: { backgroundColor: Colors.secondary, },
  itemChipText: { color: Colors.primary, fontSize: RFValue(14), fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif', },
  itemChipTextSelected: { color: Colors.white, fontWeight: '500', },
  itemRow: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: Colors.white, borderRadius: RFValue(8), marginBottom: RFValue(8), shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 1.5, elevation: 1, },
  itemRowDisabled: { backgroundColor: Colors.moonlight, },
  itemButton: { flex: 1, flexDirection: 'row-reverse', alignItems: 'center', padding: RFValue(12), },
  itemButtonSelected: { backgroundColor: `rgba(${parseInt(Colors.secondary.slice(1,3),16)}, ${parseInt(Colors.secondary.slice(3,5),16)}, ${parseInt(Colors.secondary.slice(5,7),16)}, 0.1)`, },
  itemButtonDownloaded: { backgroundColor: `rgba(${parseInt(Colors.success.slice(1,3),16)}, ${parseInt(Colors.success.slice(3,5),16)}, ${parseInt(Colors.success.slice(5,7),16)}, 0.1)`, },
  checkbox: { width: RFValue(20), height: RFValue(20), borderRadius: RFValue(4), borderWidth: 1.5, borderColor: Colors.grayMedium, justifyContent: 'center', alignItems: 'center', marginRight: RFValue(12), },
  checkboxSelected: { backgroundColor: Colors.secondary, borderColor: Colors.secondary, },
  itemText: { color: Colors.primary, fontSize: RFValue(16), fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif', },
  itemTextDisabled: { color: Colors.grayMedium, },
  deleteButton: { padding: RFValue(12), },
  downloadActionsContainer: { padding: RFValue(15), borderTopWidth: 1, borderTopColor: Colors.divider, backgroundColor: Colors.white, },
  downloadButton: { backgroundColor: Colors.primary, paddingVertical: RFValue(14), borderRadius: RFValue(8), alignItems: 'center', },
  downloadButtonText: { color: Colors.white, fontSize: RFValue(16), fontWeight: '600', },
  disabledButton: { backgroundColor: Colors.grayMedium, opacity: 0.7, },
  progressContainer: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', paddingVertical: RFValue(14), },
  progressText: { color: Colors.primary, fontSize: RFValue(16), marginRight: RFValue(10), },
});

export default AudioDownloadScreen;
