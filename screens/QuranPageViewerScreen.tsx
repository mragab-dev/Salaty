import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Platform, Share, Linking, TextInput, Alert } from 'react-native';
import { useRoute, RouteProp, useNavigation, NavigationProp, useIsFocused } from '@react-navigation/native'; 
import * as Clipboard from 'expo-clipboard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ayah, Surah, AudioDataItem, Reciter } from '../types';
import { fetchAllAyahs, getAyahsForPageNumber, getPageMetadata, fetchSurahList, fetchAyahsForSurah as fetchAyahsForSingleSurah } from '../services/quranService'; 
import QuranAudioService from '../services/quranAudioService';
import TafseerModal from '../components/TafseerModal'; 
import LoadingSpinner from '../components/LoadingSpinner';
import AyahActionSheet from '../components/AyahActionSheet';
import SettingsActionSheet, { QuranSettingsAction } from '../components/SettingsActionSheet'; 
import { ChevronDownIcon, ChevronUpIcon, PlayIcon, PauseIcon, EllipsisVerticalIcon, RepeatIcon, CloseIcon as ClearIcon, EyeIcon, EyeOffIcon, StopCircleIcon } from '../components/Icons'; 
import { TOTAL_QURAN_PAGES, ASYNC_STORAGE_BOOKMARKS_KEY, ASYNC_STORAGE_FONT_SIZE_KEY } from '../constants';
import Colors from '../constants/colors';
import { AVPlaybackStatus } from 'expo-av'; 
import { QuranStackParamList, MemorizationTestParams } from '../App'; 
import { logActivity, hasLoggedToday } from '../services/activityLogService';

type QuranPageViewerRouteProp = RouteProp<QuranStackParamList, 'QuranPageViewer'>; 

interface RepetitionSettings {
  startAyah: Ayah | null;
  endAyah: Ayah | null;
  count: number;
}

interface TestModeState {
  isActive: boolean;
  ayahsToTest: Ayah[]; 
  difficultyRatio: number; 
  revealed: boolean;
  currentTestSurahName?: string; 
  currentTestRangeString?: string; 
}

interface SurahPlaybackInfo {
    surahNumber: number;
    surahName: string;
}

const QuranPageViewerScreen: React.FC = () => {
  const route = useRoute<QuranPageViewerRouteProp>();
  const navigation = useNavigation<NavigationProp<QuranStackParamList>>();
  const isFocused = useIsFocused(); 

  const [allAyahs, setAllAyahs] = useState<Ayah[]>([]);
  const [surahList, setSurahList] = useState<Surah[]>([]);
  const [currentPage, setCurrentPage] = useState(route.params?.initialPageNumber || 1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [actionSheetVisible, setActionSheetVisible] = useState(false);
  const [settingsMenuVisible, setSettingsMenuVisible] = useState(false); 
  const [selectedAyah, setSelectedAyah] = useState<Ayah | null>(null);
  
  const [bookmarkedAyahs, setBookmarkedAyahs] = useState<Set<number>>(new Set());
  const [fontSizeScale, setFontSizeScale] = useState<number>(1.0);
  const [initialFontSizeLoaded, setInitialFontSizeLoaded] = useState(false);
  const [initialBookmarksLoaded, setInitialBookmarksLoaded] = useState(false);

  const [isTafseerApiModalVisible, setIsTafseerApiModalVisible] = useState(false);

  const audioService = QuranAudioService.getInstance();
  const [currentReciter, setCurrentReciter] = useState<Reciter | null>(null); 
  const [highlightedAyahId, setHighlightedAyahId] = useState<number | null>(null);
  const [surahPlaybackInfo, setSurahPlaybackInfo] = useState<SurahPlaybackInfo | null>(null);
  const [pendingSurahPlayback, setPendingSurahPlayback] = useState<Ayah | null>(null);
  const ayahToResumeRef = useRef<{ surah: number; ayah: number } | null>(null);


  const [repetitionSettings, setRepetitionSettings] = useState<RepetitionSettings>({ startAyah: null, endAyah: null, count: 3 });
  const [isRepetitionPlaying, setIsRepetitionPlaying] = useState(false);
  const [currentRepeatingAyah, setCurrentRepeatingAyah] = useState<Ayah | null>(null);
  const repetitionQueueRef = useRef<Ayah[]>([]);

  const [testModeState, setTestModeState] = useState<TestModeState | null>(null);
  
  const hasNavigatedRef = useRef(false); // Ref to track if user has changed pages

  const handleEndMemorizationTest = useCallback(() => {
    if (testModeState?.isActive) {
      let difficultyString = 'متوسط';
      if (testModeState.difficultyRatio <= 0.2) difficultyString = 'سهل';
      else if (testModeState.difficultyRatio >= 0.6) difficultyString = 'صعب';
      
      logActivity('memorization_test_completed', {
        surahName: testModeState.currentTestSurahName || 'غير معروف',
        ayahRange: testModeState.currentTestRangeString || 'غير معروف',
        difficulty: difficultyString,
      });
      console.log("Logged memorization test completion.");
    }
    setTestModeState(null);
  }, [testModeState]);

  const playNextInRepetitionQueue = useCallback(async () => {
    // This function is for ayah-by-ayah repetition, not surah playback.
    if (repetitionQueueRef.current.length > 0) {
        const nextToPlay = repetitionQueueRef.current.shift(); 
        if (nextToPlay) {
            setCurrentRepeatingAyah(nextToPlay); 
            setHighlightedAyahId(nextToPlay.id); 
            // This needs a single-ayah play method, which we are removing.
            // For now, this feature will be implicitly disabled by UI changes.
            // await audioService.playAudio(nextToPlay.surah_number, nextToPlay.verse_number);
        } else { 
            setIsRepetitionPlaying(false);
            setCurrentRepeatingAyah(null);
            setHighlightedAyahId(null);
        }
    } else {
        setIsRepetitionPlaying(false);
        setCurrentRepeatingAyah(null);
        setHighlightedAyahId(null);
    }
  }, []);


    useEffect(() => {
        if (isFocused) {
            const newCurrentReciter = audioService.getCurrentReciter();
            
            // Case 1: Reciter has changed and we need to resume playback
            if (newCurrentReciter && currentReciter && newCurrentReciter.id !== currentReciter.id && ayahToResumeRef.current) {
                setCurrentReciter(newCurrentReciter); // Update state with new reciter
                
                const { surah, ayah } = ayahToResumeRef.current;
                const surahInfo = surahList.find(s => s.id === surah);
                
                // Set playback info for UI
                setSurahPlaybackInfo({
                    surahNumber: surah,
                    surahName: surahInfo?.name_arabic || `سورة ${surah}`
                });
                
                // Resume playback from stored position
                audioService.playSurah(surah, ayah);
                
                // Clear the ref
                ayahToResumeRef.current = null;
                return; // Exit effect early
            }
    
            // Just update the reciter if it has changed for any other reason
            if (newCurrentReciter?.id !== currentReciter?.id) {
                setCurrentReciter(newCurrentReciter);
            }
    
            // A pending playback was set because no reciter was chosen initially
            if (pendingSurahPlayback && newCurrentReciter) {
                console.log("Reciter selected, now starting pending surah playback for:", pendingSurahPlayback.surah_number);
                handlePlaySurah(pendingSurahPlayback);
                setPendingSurahPlayback(null);
                navigation.setParams({ ayahToPlayAfterReciterSelection: undefined } as any);
            } else { // Deep link navigation
                const { targetSurahIdentifier, targetVerseNumber } = route.params || {};
                if (targetSurahIdentifier && targetVerseNumber && allAyahs.length > 0 && surahList.length > 0) {
                   console.log(`Navigating to Surah: ${targetSurahIdentifier}, Verse: ${targetVerseNumber}`);
                   let surahIdToFind: number | undefined;
                   if (typeof targetSurahIdentifier === 'number') {
                       surahIdToFind = targetSurahIdentifier;
                   } else {
                       const foundSurah = surahList.find(s => s.name_arabic === targetSurahIdentifier || s.name_english.toLowerCase() === targetSurahIdentifier.toLowerCase() || s.id.toString() === targetSurahIdentifier);
                       surahIdToFind = foundSurah?.id;
                   }
           
                   if (surahIdToFind) {
                       const targetAyah = allAyahs.find(a => a.surah_number === surahIdToFind && a.verse_number === targetVerseNumber);
                       if (targetAyah) {
                           setCurrentPage(targetAyah.page);
                       }
                   }
                   navigation.setParams({ targetSurahIdentifier: undefined, targetVerseNumber: undefined } as any);
                }
            }
        }
    }, [isFocused, route.params, allAyahs, surahList, currentReciter, pendingSurahPlayback, navigation]);



  useEffect(() => {
    const loadBookmarks = async () => {
      try {
        const storedBookmarks = await AsyncStorage.getItem(ASYNC_STORAGE_BOOKMARKS_KEY);
        if (storedBookmarks) setBookmarkedAyahs(new Set(JSON.parse(storedBookmarks)));
      } catch (e) { console.error("Failed to load bookmarks:", e); }
      finally { setInitialBookmarksLoaded(true); }
    };
    loadBookmarks();
  }, []);
  
  useEffect(() => {
    if (initialBookmarksLoaded) { 
        const saveBookmarks = async () => {
          try { await AsyncStorage.setItem(ASYNC_STORAGE_BOOKMARKS_KEY, JSON.stringify(Array.from(bookmarkedAyahs))); }
          catch (e) { console.error("Failed to save bookmarks:", e); }
        };
        saveBookmarks();
    }
  }, [bookmarkedAyahs, initialBookmarksLoaded]);

  useEffect(() => {
    const loadFontSize = async () => {
      try {
        const storedScale = await AsyncStorage.getItem(ASYNC_STORAGE_FONT_SIZE_KEY);
        if (storedScale) { const scale = parseFloat(storedScale); if (!isNaN(scale)) setFontSizeScale(scale); }
      } catch (e) { console.error("Failed to load font size:", e); } 
      finally { setInitialFontSizeLoaded(true); }
    };
    loadFontSize();
  }, []);

  useEffect(() => {
    if (initialFontSizeLoaded) {
      const saveFontSize = async () => {
        try { await AsyncStorage.setItem(ASYNC_STORAGE_FONT_SIZE_KEY, fontSizeScale.toString()); }
        catch (e) { console.error("Failed to save font size:", e); }
      };
      saveFontSize();
    }
  }, [fontSizeScale, initialFontSizeLoaded]);

  useEffect(() => {
    if (route.params?.bookmarkedAyahs && route.params.bookmarkedAyahs !== bookmarkedAyahs ) {
        setBookmarkedAyahs(route.params.bookmarkedAyahs);
    }
  }, [route.params?.bookmarkedAyahs, bookmarkedAyahs]);


  useEffect(() => {
    const testParams = route.params?.testParams;
    if (testParams && allAyahs.length > 0 && surahList.length > 0) {
      handleStartMemorizationTest(testParams);
      navigation.setParams({ testParams: undefined } as any); 
    }
  }, [route.params?.testParams, allAyahs, surahList, navigation]);

  useEffect(() => {
    return () => {
      if (hasNavigatedRef.current) {
        hasLoggedToday('quran_read_session').then(logged => {
          if (!logged) {
            logActivity('quran_read_session', { details: 'تم تصفح المصحف' });
          }
        });
      }
    };
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      // Reload font size when returning from FontSizeSettings
      const loadFontSize = async () => {
        try {
          const storedScale = await AsyncStorage.getItem(ASYNC_STORAGE_FONT_SIZE_KEY);
          if (storedScale) { 
            const scale = parseFloat(storedScale); 
            if (!isNaN(scale)) setFontSizeScale(scale); 
          }
        } catch (e) { 
          console.error("Failed to load font size:", e); 
        }
      };
      loadFontSize();
    });

    return unsubscribe;
  }, [navigation]);


  const handleNavigateFromMenu = (screen: QuranSettingsAction) => {
    setSettingsMenuVisible(false); 
    switch (screen) {
      case 'Index': navigation.navigate('QuranIndex'); break;
      case 'Bookmarks': navigation.navigate('Bookmarks', { bookmarkedAyahs: bookmarkedAyahs, allAyahs: allAyahs }); break;
      case 'Downloads': navigation.navigate('AudioDownload'); break;
      case 'FontSize': navigation.navigate('FontSizeSettings', { currentScale: fontSizeScale }); break;
      case 'MemorizationTest': navigation.navigate('MemorizationSetup'); break; 
    }
  };

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={() => setSettingsMenuVisible(true)} style={{ paddingHorizontal: 15, paddingVertical: 5 }}>
          <EllipsisVerticalIcon color={Colors.secondary} size={26} />
        </TouchableOpacity>
      ),
      title: `القرآن الكريم - صفحة ${currentPage}`,
    });
  }, [navigation, currentPage]);

  const loadData = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      await audioService.initializeAudio(); 
      setCurrentReciter(audioService.getCurrentReciter());

      const [loadedAyahs, loadedSurahs] = await Promise.all([ fetchAllAyahs(), fetchSurahList() ]);
      setAllAyahs(loadedAyahs); setSurahList(loadedSurahs);

    } catch (err: any) { setError(err.message || "فشل في تحميل بيانات المصحف."); console.error(err); } 
    finally { setLoading(false); }
  }, [audioService]); 

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    const handleVerseChange = (info: { surah: number, ayah: number } | null) => {
      if (info) {
        const currentAyah = allAyahs.find(a => a.surah_number === info.surah && a.verse_number === info.ayah);
        
        if (currentAyah) {
            setHighlightedAyahId(currentAyah.id);
            if (currentAyah.page !== currentPage) {
                console.log(`Auto-turning page from ${currentPage} to ${currentAyah.page} for ayah ${info.surah}:${info.ayah}`);
                setCurrentPage(currentAyah.page);
            }
        } else {
            setHighlightedAyahId((info.surah * 1000) + info.ayah);
        }
      } else {
        setHighlightedAyahId(null);
        setSurahPlaybackInfo(null);
      }
    };

    audioService.setOnVerseChange(handleVerseChange);
    
    return () => { 
      audioService.setOnVerseChange(() => {});
    };
  }, [audioService, allAyahs, currentPage]);


  const ayahsOnCurrentPage = useMemo(() => {
    if (!allAyahs.length) return [];
    const ayahs = getAyahsForPageNumber(currentPage, allAyahs);
    return ayahs.map(ayah => {
        const isCurrentTestAyah = testModeState?.isActive && testModeState.ayahsToTest.some(testAyah => testAyah.id === ayah.id);
        return {
            ...ayah,
            isHighlighted: ayah.id === highlightedAyahId || isCurrentTestAyah, 
            isBookmarked: bookmarkedAyahs.has(ayah.id), 
        };
    });
  }, [currentPage, allAyahs, highlightedAyahId, bookmarkedAyahs, testModeState]);


  const pageMetadata = useMemo(() => {
    if (!ayahsOnCurrentPage.length || !surahList.length) return { surahsOnPage: [], juzNumber: undefined };
    const rawAyahsOnPage = getAyahsForPageNumber(currentPage, allAyahs); 
    return getPageMetadata(currentPage, rawAyahsOnPage, surahList);
  }, [currentPage, allAyahs, surahList, ayahsOnCurrentPage.length]);

  const handleStartMemorizationTest = async (params: MemorizationTestParams) => {
    audioService.stopAudio();   

    const { difficulty, surahId, startAyahNumber, endAyahNumber } = params;
    let ratio = 0.2; 
    if (difficulty === 'medium') ratio = 0.4;
    else if (difficulty === 'hard') ratio = 0.6;

    try {
      setLoading(true); 
      const surahForTest = await fetchAyahsForSingleSurah(surahId);
      const ayahsForTestSetup = surahForTest.filter(
        ayah => ayah.verse_number >= startAyahNumber && ayah.verse_number <= endAyahNumber
      );

      if (ayahsForTestSetup.length === 0) {
        setError("لم يتم العثور على آيات لنطاق الاختبار المحدد.");
        setTestModeState(null);
        setLoading(false);
        return;
      }
      
      const surahInfo = surahList.find(s => s.id === surahId);
      
      setTestModeState({
        isActive: true,
        ayahsToTest: ayahsForTestSetup, 
        difficultyRatio: ratio,
        revealed: false,
        currentTestSurahName: surahInfo?.name_arabic || `سورة ${surahId}`,
        currentTestRangeString: `آيات ${startAyahNumber}-${endAyahNumber}`
      });

      const firstTestAyah = ayahsForTestSetup[0];
      if (firstTestAyah && firstTestAyah.page !== currentPage) {
        setCurrentPage(firstTestAyah.page);
      }
      setLoading(false);
    } catch (e: any) {
      setError(e.message || "فشل في إعداد بيانات اختبار الحفظ.");
      setTestModeState(null);
      setLoading(false);
    }
  };


  const handleToggleRevealTest = () => { setTestModeState(prev => (prev ? { ...prev, revealed: !prev.revealed } : null)); };
  

  const renderAyahTextWithTest = (ayah: Ayah, baseFontSize: number) => {
    if (testModeState?.isActive && testModeState.ayahsToTest.some(testAyah => testAyah.id === ayah.id)) {
      const words = ayah.text.split(/(\s+)/); 
      return words.map((word, index) => {
        const actualWordIndex = words.slice(0, index + 1).filter(w => w.trim() !== '').length -1;
        const hiddenIndicesForThisAyah = generateHiddenIndices(ayah.text, testModeState.difficultyRatio);

        if (word.trim() !== '' && hiddenIndicesForThisAyah.has(actualWordIndex) && !testModeState.revealed) {
          return (
            <Text key={index} style={[styles.mushafAyahText, { fontSize: baseFontSize }, styles.hiddenWordPlaceholder]}>
              {word.replace(/./g, 'ـ')}
            </Text>
          );
        }
        return ( <Text key={index} style={[styles.mushafAyahText, { fontSize: baseFontSize }]}>{word}</Text> );
      });
    }
    return <Text style={[styles.mushafAyahText, { fontSize: baseFontSize }]}>{ayah.text}</Text>;
  };

  const generateHiddenIndices = (text: string, difficultyRatio: number): Set<number> => {
    const words = text.split(/\s+/).filter(Boolean); 
    const numWordsToHide = Math.floor(words.length * difficultyRatio);
    const indices = new Set<number>();
    if (words.length === 0 || numWordsToHide === 0) return indices;
    while (indices.size < numWordsToHide) { const randomIndex = Math.floor(Math.random() * words.length); indices.add(randomIndex); }
    return indices;
  };

  const handleNextPage = () => { 
    if (currentPage < TOTAL_QURAN_PAGES) { 
      hasNavigatedRef.current = true;
      audioService.stopAudio(); 
      setSurahPlaybackInfo(null);
      setCurrentPage(prev => prev + 1); 
    } 
  };
  const handlePrevPage = () => { 
    if (currentPage > 1) { 
      hasNavigatedRef.current = true;
      audioService.stopAudio(); 
      setSurahPlaybackInfo(null);
      setCurrentPage(prev => prev - 1); 
    } 
  };
  const openAyahActionSheet = (ayah: Ayah) => { setSelectedAyah(ayah); setActionSheetVisible(true); };
  const closeAyahActionSheet = () => setActionSheetVisible(false);
  const handleShowTafsir = (ayah: Ayah) => { 
    setSelectedAyah(ayah); 
    setIsTafseerApiModalVisible(true); 
  };
  const toggleBookmarkInPage = (ayahId: number) => setBookmarkedAyahs(prev => { const newSet = new Set(prev); if (newSet.has(ayahId)) newSet.delete(ayahId); else newSet.add(ayahId); return newSet; });
  const handleCopyAyah = async (ayah: Ayah) => { await Clipboard.setStringAsync(`${ayah.text} (سورة ${getSurahName(ayah)}: ${ayah.verse_number})`); alert('تم نسخ الآية!'); closeAyahActionSheet(); };
  const handleShareAyah = async (ayah: Ayah) => { try { await Share.share({ message: `${ayah.text}\n\n(سورة ${getSurahName(ayah)}: ${ayah.verse_number}) - من تطبيق صلاتي`, }); } catch (error: any) { alert(error.message); } closeAyahActionSheet(); };
  
  const handlePlaySurah = (ayah: Ayah) => {
    if (!currentReciter) {
        setPendingSurahPlayback(ayah);
        navigation.navigate('ReciterList', { ayahToPlay: ayah });
        return;
    }
    const surahInfo = surahList.find(s => s.id === ayah.surah_number);
    setSurahPlaybackInfo({
        surahNumber: ayah.surah_number,
        surahName: surahInfo?.name_arabic || `سورة ${ayah.surah_number}`
    });
    audioService.playSurah(ayah.surah_number, ayah.verse_number);
    closeAyahActionSheet();
  };

  const handleChangeReciter = async () => {
    const currentPlayingInfo = audioService.getCurrentPlayingAyahInfo();
    if (currentPlayingInfo && allAyahs.length > 0) {
        await audioService.pauseAudio();
        ayahToResumeRef.current = currentPlayingInfo;
        const currentAyah = allAyahs.find(a => a.surah_number === currentPlayingInfo.surah && a.verse_number === currentPlayingInfo.ayah);
        if(currentAyah){
            navigation.navigate('ReciterList', { ayahToPlay: currentAyah });
        }
    }
  };

  const handleStopSurah = () => {
    audioService.stopAudio();
    setSurahPlaybackInfo(null);
    closeAyahActionSheet();
  };

  const getSurahName = (ayah: Ayah | null): string => {
    if (!ayah) return 'غير محدد';
    if (surahList.length === 0) return `سورة ${ayah.surah_number}`;
    const surahInfo = surahList.find(s => s.id === ayah.surah_number);
    return surahInfo?.name_arabic || `سورة ${ayah.surah_number}`;
  };


  if (loading && !allAyahs.length) return <LoadingSpinner text="جاري تحميل بيانات المصحف..." style={styles.centeredMessage} color={Colors.primary} />;
  if (error && !testModeState?.isActive) return <View style={styles.centeredMessage}><Text style={styles.errorText}>{error}</Text><TouchableOpacity onPress={loadData} style={styles.retryButton}><Text style={styles.retryButtonText}>إعادة المحاولة</Text></TouchableOpacity></View>;
  
  const getBismillahForPageStart = () => { const firstAyahOnPage = ayahsOnCurrentPage[0]; if (firstAyahOnPage && firstAyahOnPage.verse_number === 1 && firstAyahOnPage.surah_number !== 1 && firstAyahOnPage.surah_number !== 9) return "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ"; return null; };
  const baseFontSize = Platform.OS === 'ios' ? 26 : 24;
  const scaledFontSize = baseFontSize * fontSizeScale;

  return (
    <View style={styles.screenContainer}>
      <View style={styles.pageHeader}>
        <Text style={styles.pageHeaderText}>{pageMetadata.surahsOnPage.map(s => s.name_arabic).join(' - ')}</Text>
        {pageMetadata.juzNumber && <Text style={styles.pageHeaderText}>الجزء: {pageMetadata.juzNumber}</Text>}
      </View>
      
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
         {ayahsOnCurrentPage.length === 0 && !loading && <Text style={styles.centeredMessageText}>لا توجد آيات لعرضها لهذه الصفحة.</Text>}
        {getBismillahForPageStart() && currentPage !== 1 && <Text style={[styles.bismillahPageStart, { fontSize: scaledFontSize * 0.9 }]}>{getBismillahForPageStart()}</Text>}
        
        <View style={styles.mushafTextContainer}>
          {ayahsOnCurrentPage.map((ayah, index) => {
            const displaySurahNameHeader = ayah.verse_number === 1 && ayah.surah_number !== 1 && (index === 0 || (index > 0 && ayahsOnCurrentPage[index-1]?.surah_number !== ayah.surah_number));
            let surahNameForHeader: string | null = null;
            if (displaySurahNameHeader) {
                const surahInfo = surahList.find(s => s.id === ayah.surah_number);
                surahNameForHeader = surahInfo ? surahInfo.name_arabic : null;
            }
            const displayBismillahBeforeAyah = ayah.verse_number === 1 && ayah.surah_number !== 1 && ayah.surah_number !== 9 && (index === 0 || (index > 0 && ayahsOnCurrentPage[index-1]?.surah_number !== ayah.surah_number));
            
            const isBookmarked = bookmarkedAyahs.has(ayah.id);
            const isCurrentTestAyah = testModeState?.isActive && testModeState.ayahsToTest.some(testAyah => testAyah.id === ayah.id);
            
            return (
            <React.Fragment key={ayah.id}>
                {surahNameForHeader && (
                    <View style={styles.inlineSurahHeaderContainer}>
                        <Text style={[styles.inlineSurahNameText, { fontSize: scaledFontSize * 1.1 }]}>
                            سورة {surahNameForHeader}
                        </Text>
                    </View>
                )}
                {displayBismillahBeforeAyah && <Text style={[styles.bismillahInText, { fontSize: scaledFontSize * 0.9 }]}>بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</Text>}
                <Text
                    style={[ styles.mushafAyahText, { lineHeight: scaledFontSize * (Platform.OS === 'ios' ? 1.7 : 1.8) }, (ayah.isHighlighted) && styles.highlightedAyah, isCurrentTestAyah && styles.testAyahHighlight ]} 
                    onPress={() => openAyahActionSheet(ayah)} 
                >
                    {isCurrentTestAyah ? renderAyahTextWithTest(ayah, scaledFontSize) : <Text style={{fontSize: scaledFontSize}}>{ayah.text}</Text>}
                    <Text style={[ styles.mushafVerseNumber, { fontSize: scaledFontSize * 0.8 }, isBookmarked && styles.bookmarkedVerseNumber ]}>{` \uFD3F${ayah.verse_number}\uFD3E`}</Text>
                    {index < ayahsOnCurrentPage.length - 1 ? ' ' : ''}
                </Text>
            </React.Fragment>
            )
          })}
        </View>
      </ScrollView>

      {testModeState?.isActive && (
        <View style={styles.testModePanel}>
            <Text style={styles.testModePanelText} numberOfLines={1}>
              اختبار {testModeState.currentTestSurahName || ''} ({testModeState.currentTestRangeString || ''})
            </Text>
            <View style={styles.testModeButtonsContainer}>
                <TouchableOpacity onPress={handleToggleRevealTest} style={styles.testModeButton}>
                    {testModeState.revealed ? <EyeOffIcon color={Colors.white} size={20}/> : <EyeIcon color={Colors.white} size={20} />}
                    <Text style={styles.testModeButtonText}>{testModeState.revealed ? 'إخفاء الكل' : 'إظهار الكل'}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleEndMemorizationTest} style={styles.testModeButton}>
                    <StopCircleIcon color={Colors.white} size={20}/>
                    <Text style={styles.testModeButtonText}>إنهاء الاختبار</Text>
                </TouchableOpacity>
            </View>
        </View>
      )}
      
      {surahPlaybackInfo && currentReciter && (
        <View style={styles.surahPlaybackFooter}>
            <View style={styles.playbackInfoContainer}>
                <Text style={styles.playbackSurahName} numberOfLines={1}>تشغيل: سورة {surahPlaybackInfo.surahName}</Text>
                <TouchableOpacity onPress={handleChangeReciter} style={styles.reciterTouchable}>
                    <Text style={styles.playbackReciterName} numberOfLines={1}>{currentReciter.nameAr}</Text>
                </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={handleStopSurah} style={styles.playbackStopButton}>
                <StopCircleIcon color={Colors.white} size={24} />
                <Text style={styles.playbackStopButtonText}>إيقاف</Text>
            </TouchableOpacity>
        </View>
      )}


      <View style={styles.navigationFooter}>
        <TouchableOpacity onPress={handlePrevPage} disabled={currentPage <= 1 } style={[styles.navButton, (currentPage <= 1 ) && styles.navButtonDisabled]}>
          <ChevronUpIcon color={Colors.secondary} size={28} /> 
          <Text style={styles.navButtonText}>السابقة</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleNextPage} disabled={currentPage >= TOTAL_QURAN_PAGES} style={[styles.navButton, (currentPage >= TOTAL_QURAN_PAGES) && styles.navButtonDisabled, { justifyContent: 'flex-end' }]}>
          <Text style={styles.navButtonText}>التالية</Text>
          <ChevronDownIcon color={Colors.secondary} size={28} /> 
        </TouchableOpacity>
      </View>

      {selectedAyah && (
        <AyahActionSheet
          isVisible={actionSheetVisible} onClose={closeAyahActionSheet} ayah={selectedAyah}
          surahName={getSurahName(selectedAyah)}
          isBookmarked={bookmarkedAyahs.has(selectedAyah.id)} onBookmark={toggleBookmarkInPage}
          onPlaySurah={() => handlePlaySurah(selectedAyah)}
          onStopSurahPlayback={handleStopSurah}
          isSurahPlaying={surahPlaybackInfo?.surahNumber === selectedAyah.surah_number}
          onTafseer={() => handleShowTafsir(selectedAyah)}
          onCopy={() => handleCopyAyah(selectedAyah)} onShare={() => handleShareAyah(selectedAyah)}
        />
      )}
      {selectedAyah && isTafseerApiModalVisible && (
        <TafseerModal 
          isVisible={isTafseerApiModalVisible} 
          onClose={() => {
            setIsTafseerApiModalVisible(false);
          }} 
          ayah={selectedAyah} 
          surahName={getSurahName(selectedAyah)} 
        />
      )}
      <SettingsActionSheet visible={settingsMenuVisible} onClose={() => setSettingsMenuVisible(false)} onNavigate={handleNavigateFromMenu} />
    </View>
  );
};

const styles = StyleSheet.create({
  screenContainer: { flex: 1, backgroundColor: Colors.background, fontFamily: Platform.OS === 'web' ? 'Amiri Quran, Amiri, serif' : (Platform.OS === 'ios' ? 'Amiri' : 'sans-serif'), },
  centeredMessage: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, },
  centeredMessageText: { fontSize: 18, color: Colors.accent, textAlign: 'center', },
  errorText: { color: Colors.error, fontSize: 16, textAlign: 'center', marginBottom: 10, },
  retryButton: { backgroundColor: Colors.primary, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 6, },
  retryButtonText: { color: Colors.white, fontSize: 15, },
  pageHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 16, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.secondary, },
  pageHeaderText: { fontSize: 16, color: Colors.primary, fontFamily: Platform.OS === 'web' ? 'Amiri, serif' : (Platform.OS === 'ios' ? 'Amiri' : 'sans-serif-medium'), },
  scrollViewContent: { paddingVertical: 10, paddingHorizontal: 8, }, 
  bismillahPageStart: { color: Colors.text, textAlign: 'center', marginBottom: 12, fontFamily: Platform.OS === 'web' ? 'Amiri Quran, Amiri, serif' : (Platform.OS === 'ios' ? 'Amiri Quran' : 'sans-serif-medium'), },
  bismillahInText: { color: Colors.text, textAlign: 'center', width: '100%', marginBottom: 8, marginTop: 8, fontFamily: Platform.OS === 'web' ? 'Amiri Quran, Amiri, serif' : (Platform.OS === 'ios' ? 'Amiri Quran' : 'sans-serif-medium'), },
  mushafTextContainer: { 
    flexDirection: 'row-reverse', 
    flexWrap: 'wrap', 
    justifyContent: 'flex-start', 
    writingDirection: 'rtl', 
    alignItems: 'flex-start', 
    borderWidth: 1, 
    borderColor: Colors.divider, 
    borderRadius: 8, 
    padding: 8, 
    backgroundColor: Colors.white, 
  },
  mushafAyahText: { 
    color: Colors.text, 
    fontFamily: Platform.OS === 'web' ? 'Amiri Quran, Amiri, serif' : (Platform.OS === 'ios' ? 'Amiri Quran' : 'sans-serif-medium'), 
    textAlign: 'right', 
    paddingHorizontal: 1, 
    marginVertical: 0, 
  },
  highlightedAyah: { backgroundColor: `rgba(${parseInt(Colors.secondary.slice(1,3),16)}, ${parseInt(Colors.secondary.slice(3,5),16)}, ${parseInt(Colors.secondary.slice(5,7),16)}, 0.25)`, borderRadius: 5, },
  testAyahHighlight: { backgroundColor: `rgba(${parseInt(Colors.accent.slice(1,3),16)}, ${parseInt(Colors.accent.slice(3,5),16)}, ${parseInt(Colors.accent.slice(5,7),16)}, 0.2)`, },
  hiddenWordPlaceholder: { color: Colors.accent, opacity: 0.8, },
  mushafVerseNumber: { color: Colors.secondary, fontFamily: Platform.OS === 'web' ? 'Amiri Quran, Amiri, serif' : (Platform.OS === 'ios' ? 'Amiri Quran' : 'sans-serif-bold'), },
  bookmarkedVerseNumber: { color: Colors.accent, fontWeight: 'bold', },
  navigationFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 16, backgroundColor: Colors.primary, borderTopWidth: 1, borderTopColor: Colors.secondary, },
  navButton: { flexDirection: 'row', alignItems: 'center', padding: 8, flex: 1, },
  navButtonDisabled: { opacity: 0.5, },
  navButtonText: { color: Colors.secondary, fontSize: 16, fontWeight: '600', marginHorizontal: 5, fontFamily: Platform.OS === 'web' ? 'Amiri, serif' : (Platform.OS === 'ios' ? 'Amiri' : 'sans-serif-medium'), },
  surahPlaybackFooter: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.primaryLight,
    borderTopWidth: 1,
    borderTopColor: Colors.secondary,
  },
  playbackInfoContainer: {
    flex: 1,
    alignItems: 'flex-end',
    marginRight: 10,
  },
  playbackSurahName: {
      color: Colors.white,
      fontSize: 15,
      fontWeight: 'bold',
      fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  },
  reciterTouchable: {
    marginTop: 4,
  },
  playbackReciterName: {
    color: Colors.secondaryLight,
    fontSize: 13,
    textDecorationLine: 'underline',
  },
  playbackStopButton: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 20,
      backgroundColor: Colors.error,
  },
  playbackStopButtonText: {
      color: Colors.white,
      fontSize: 14,
      fontWeight: '600',
      marginRight: 6,
  },
  testModePanel: { backgroundColor: Colors.accent, paddingVertical: 8, paddingHorizontal: 16, flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderColor: Colors.secondaryLight, },
  testModePanelText: { color: Colors.white, fontSize: 13, fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif', flexShrink: 1, marginRight: 10, },
  testModeButtonsContainer: { flexDirection: 'row-reverse', },
  testModeButton: { flexDirection: 'row-reverse', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 5, backgroundColor: Colors.primaryLight, marginLeft: 8, },
  testModeButtonText: { color: Colors.white, fontSize: 13, fontWeight: '500', marginLeft: 5, },
  inlineSurahHeaderContainer: {
    width: '100%', 
    alignItems: 'center', 
    marginVertical: 10, 
    paddingVertical: 8,
    backgroundColor: `rgba(${parseInt(Colors.secondary.slice(1,3),16)}, ${parseInt(Colors.secondary.slice(3,5),16)}, ${parseInt(Colors.secondary.slice(5,7),16)}, 0.1)`,
    borderRadius: 6,
  },
  inlineSurahNameText: {
    fontFamily: Platform.OS === 'web' ? 'Amiri Quran, Amiri, serif' : (Platform.OS === 'ios' ? 'Amiri Quran' : 'sans-serif-bold'),
    color: Colors.primary,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default QuranPageViewerScreen;