import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Platform, Share, Linking, TextInput, Alert, PanResponder, Animated } from 'react-native';
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
import { TOTAL_QURAN_PAGES, ASYNC_STORAGE_BOOKMARKS_KEY, ASYNC_STORAGE_FONT_SIZE_KEY, ASYNC_STORAGE_LAST_READ_PAGE_KEY } from '../constants';
import Colors from '../constants/colors';
import { AVPlaybackStatus } from 'expo-av'; 
import { QuranStackParamList, MemorizationTestParams } from '../App'; 
import { logActivity, hasLoggedToday } from '../services/activityLogService';
import { RFValue } from 'react-native-responsive-fontsize';
import Svg, { Path, Defs, Pattern, Rect } from 'react-native-svg';

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
  hiddenIndices: Map<number, Set<number>>;
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
  
  // --- State for Pinch-to-Zoom ---
  const [fontSizeScale, setFontSizeScale] = useState<number>(1.0);
  const [isPinching, setIsPinching] = useState(false);
  const pinchRef = useRef({ initialDistance: 0, initialScale: 1 }).current;

  // --- PanResponder for Pinch-to-Zoom ---
  const panResponder = useRef(
    PanResponder.create({
        onStartShouldSetPanResponder: (evt) => evt.nativeEvent.touches.length === 2,
        onMoveShouldSetPanResponder: (evt) => evt.nativeEvent.touches.length === 2,
        onPanResponderGrant: (evt) => {
            setIsPinching(true);
            const [t1, t2] = evt.nativeEvent.touches;
            const distance = Math.sqrt(Math.pow(t2.pageX - t1.pageX, 2) + Math.pow(t2.pageY - t1.pageY, 2));
            pinchRef.initialDistance = distance;
            pinchRef.initialScale = fontSizeScale;
        },
        onPanResponderMove: (evt, gestureState) => {
            if (evt.nativeEvent.touches.length < 2) return;
            const [t1, t2] = evt.nativeEvent.touches;
            const distance = Math.sqrt(Math.pow(t2.pageX - t1.pageX, 2) + Math.pow(t2.pageY - t1.pageY, 2));
            const scale = distance / pinchRef.initialDistance;
            let newScale = pinchRef.initialScale * scale;
            newScale = Math.max(0.7, Math.min(newScale, 1.5)); // Clamp the scale
            setFontSizeScale(newScale);
        },
        onPanResponderRelease: () => {
            setIsPinching(false);
            AsyncStorage.setItem(ASYNC_STORAGE_FONT_SIZE_KEY, fontSizeScale.toString());
        },
        onPanResponderTerminationRequest: () => true,
    })
  ).current;

  const { targetSurahIdentifier, targetVerseNumber } = route.params || {};

  // New useEffect to handle navigation from chatbot
  useEffect(() => {
    const navigateToTargetAyah = () => {
        // Ensure all data is loaded and params are present
        if (!isFocused || !targetSurahIdentifier || !targetVerseNumber || !allAyahs.length || !surahList.length) {
            return;
        }

        console.log(`Attempting to navigate to target: ${targetSurahIdentifier}:${targetVerseNumber}`);

        // Find the surah using identifier (can be name or number)
        const surahInfo = surahList.find(s => 
            s.id.toString() === targetSurahIdentifier.toString() || 
            s.name_arabic === targetSurahIdentifier || 
            s.name_english.toLowerCase() === targetSurahIdentifier.toString().toLowerCase()
        );

        if (!surahInfo) {
            Alert.alert("خطأ", `لم نتمكن من العثور على سورة "${targetSurahIdentifier}".`);
            // Clear params to prevent re-triggering
            navigation.setParams({ targetSurahIdentifier: undefined, targetVerseNumber: undefined } as any);
            return;
        }

        // Find the specific ayah
        const targetAyah = allAyahs.find(a => 
            a.surah_number === surahInfo.id && 
            a.verse_number === targetVerseNumber
        );

        if (targetAyah) {
            setCurrentPage(targetAyah.page);
            setHighlightedAyahId(targetAyah.id);
            // Clear the params to prevent this from running again on re-focus
            navigation.setParams({ targetSurahIdentifier: undefined, targetVerseNumber: undefined } as any);
        } else {
            Alert.alert("خطأ", `لم نتمكن من العثور على الآية ${targetVerseNumber} في سورة ${surahInfo.name_arabic}.`);
            // Clear params anyway
            navigation.setParams({ targetSurahIdentifier: undefined, targetVerseNumber: undefined } as any);
        }
    };

    navigateToTargetAyah();
    // This effect should run when the screen is focused or when the target parameters change
  }, [isFocused, targetSurahIdentifier, targetVerseNumber, allAyahs, surahList, navigation]);

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

  useEffect(() => {
    const savePage = async () => {
        if (!isFocused && hasNavigatedRef.current) { 
            try {
                await AsyncStorage.setItem(ASYNC_STORAGE_LAST_READ_PAGE_KEY, currentPage.toString());
                console.log(`Saved last read page: ${currentPage}`);
            } catch (e) {
                console.error("Failed to save last read page", e);
            }
        }
    };
    savePage();
  }, [isFocused, currentPage]);

  useEffect(() => {
    if (isFocused) {
        const newCurrentReciter = audioService.getCurrentReciter();
        if (newCurrentReciter?.id !== currentReciter?.id) {
            setCurrentReciter(newCurrentReciter);
        }
    }
  }, [isFocused, audioService]);


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
    if (route.params?.bookmarkedAyahs) {
        setBookmarkedAyahs(new Set(route.params.bookmarkedAyahs));
    }
  }, [route.params?.bookmarkedAyahs]);

  useEffect(() => {
    const loadFontSize = async () => {
      try {
        const storedScale = await AsyncStorage.getItem(ASYNC_STORAGE_FONT_SIZE_KEY);
        if (storedScale) { const scale = parseFloat(storedScale); if (!isNaN(scale)) setFontSizeScale(scale); }
      } catch (e) { console.error("Failed to load font size:", e); } 
    };
    loadFontSize();
  }, []);

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

  const handleNavigateFromMenu = (screen: QuranSettingsAction) => {
    setSettingsMenuVisible(false); 
    switch (screen) {
      case 'Index': navigation.navigate('QuranIndex'); break;
      case 'Bookmarks': navigation.navigate('Bookmarks', { bookmarkedAyahs: Array.from(bookmarkedAyahs), surahList: surahList }); break;
      case 'Downloads': navigation.navigate('AudioDownload'); break;
      case 'MemorizationTest': navigation.navigate('MemorizationSetup'); break; 
    }
  };

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={() => setSettingsMenuVisible(true)} style={{ paddingHorizontal: RFValue(15), paddingVertical: RFValue(5) }}>
          <EllipsisVerticalIcon color={Colors.secondary} size={RFValue(26)} />
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
    const handleVerseChange = (info: { surah: number; ayah: number } | null) => {
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
    return getAyahsForPageNumber(currentPage, allAyahs);
  }, [currentPage, allAyahs]);

  const pageMetadata = useMemo(() => {
    if (!ayahsOnCurrentPage.length || !surahList.length) return { surahsOnPage: [], juzNumber: undefined };
    return getPageMetadata(currentPage, ayahsOnCurrentPage, surahList);
  }, [currentPage, ayahsOnCurrentPage, surahList]);
  
  const generateHiddenIndices = (text: string, difficultyRatio: number): Set<number> => {
    const words = text.split(/\s+/).filter(Boolean); 
    const numWordsToHide = Math.floor(words.length * difficultyRatio);
    const indices = new Set<number>();
    if (words.length === 0 || numWordsToHide === 0) return indices;
    while (indices.size < numWordsToHide) { const randomIndex = Math.floor(Math.random() * words.length); indices.add(randomIndex); }
    return indices;
  };

  const handleStartMemorizationTest = async (params: MemorizationTestParams) => {
    audioService.stopAudio();
  
    const { difficulty, surahId, startAyahNumber, endAyahNumber, testMode } = params;
  
    if (testMode === 'audio') {
      Alert.alert(
        "ميزة قيد التطوير",
        "الاختبار الصوتي للتسميع ميزة سيتم إضافتها في التحديثات القادمة إن شاء الله.",
        [{ text: "حسنًا", onPress: () => setTestModeState(null) }]
      );
      return;
    }
  
    // Visual test logic
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
      const hiddenIndicesMap = new Map<number, Set<number>>();
      ayahsForTestSetup.forEach(ayah => {
        hiddenIndicesMap.set(ayah.id, generateHiddenIndices(ayah.text, ratio));
      });
  
      setTestModeState({
        isActive: true,
        ayahsToTest: ayahsForTestSetup,
        difficultyRatio: ratio,
        revealed: false,
        currentTestSurahName: surahInfo?.name_arabic || `سورة ${surahId}`,
        currentTestRangeString: `آيات ${startAyahNumber}-${endAyahNumber}`,
        hiddenIndices: hiddenIndicesMap,
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

  const groupedAyahs = useMemo(() => {
    const groups: { [key: number]: Ayah[] } = {};
    ayahsOnCurrentPage.forEach(ayah => {
        if (!groups[ayah.surah_number]) {
            groups[ayah.surah_number] = [];
        }
        groups[ayah.surah_number].push(ayah);
    });
    return Object.entries(groups).map(([surahNum, ayahs]) => ({
        surahNumber: parseInt(surahNum, 10),
        ayahs: ayahs,
    }));
  }, [ayahsOnCurrentPage]);
  
  const baseFontSize = RFValue(Platform.OS === 'ios' ? 26 : 24);
  const scaledFontSize = baseFontSize * fontSizeScale;

  const renderTestContent = () => {
    if (!testModeState) return null;

    // Filter ayahs to only those on the current page to prevent rendering huge lists.
    const ayahsForThisPage = testModeState.ayahsToTest.filter(
        (ayah) => ayah.page === currentPage
    );

    if (ayahsForThisPage.length === 0) {
        // This view is shown if the user navigates to a page outside the test range.
        return (
            <View style={[styles.centeredMessage, styles.mushafPageContent]}>
                <Text style={styles.centeredMessageText}>
                    أنت حاليًا خارج نطاق الاختبار.
                </Text>
                <Text style={styles.centeredMessageText}>
                    يبدأ الاختبار من صفحة {testModeState.ayahsToTest[0]?.page}.
                </Text>
            </View>
        );
    }

    return (
      <View style={styles.mushafPageContent}>
        <Text style={[styles.ayahTextFlow, { lineHeight: scaledFontSize * 1.9 }]}>
          {ayahsForThisPage.map(ayah => {
            if (testModeState.revealed) {
              return (
                <Text key={ayah.id}>
                  <Text style={{ fontSize: scaledFontSize }}>{ayah.text}</Text>
                  <Text style={[styles.mushafVerseNumber, { fontSize: scaledFontSize * 0.8 }]}>
                    {` \uFD3F${ayah.verse_number}\uFD3E`}
                  </Text>
                  {' '}
                </Text>
              );
            }
            const words = ayah.text.split(/(\s+)/); // Split while keeping spaces for layout
            const hiddenIndices = testModeState.hiddenIndices.get(ayah.id) || new Set();
            let wordIndex = -1;
            
            return (
              <Text key={ayah.id}>
                {words.map((word, i) => {
                  if (word.trim().length > 0) {
                    wordIndex++;
                    if (hiddenIndices.has(wordIndex)) {
                      return <Text key={i} style={[styles.hiddenWord, { fontSize: scaledFontSize }]}>{'─'.repeat(word.length)}</Text>;
                    }
                  }
                  return <Text key={i} style={{ fontSize: scaledFontSize }}>{word}</Text>;
                })}
                <Text style={[styles.mushafVerseNumber, { fontSize: scaledFontSize * 0.8 }]}>
                    {` \uFD3F${ayah.verse_number}\uFD3E`}
                </Text>
                {' '}
              </Text>
            );
          })}
        </Text>
      </View>
    );
  };
  

  if (loading && !allAyahs.length) return <LoadingSpinner text="جاري تحميل بيانات المصحف..." style={styles.centeredMessage} color={Colors.primary} />;
  if (error && !testModeState?.isActive) return <View style={styles.centeredMessage}><Text style={styles.errorText}>{error}</Text><TouchableOpacity onPress={loadData} style={styles.retryButton}><Text style={styles.retryButtonText}>إعادة المحاولة</Text></TouchableOpacity></View>;
  

  return (
    <View style={styles.screenContainer}>
      <View style={styles.pageHeader}>
        <Text style={styles.pageHeaderText}>{pageMetadata.surahsOnPage.map(s => s.name_arabic).join(' - ')}</Text>
        {pageMetadata.juzNumber && <Text style={styles.pageHeaderText}>الجزء: {pageMetadata.juzNumber}</Text>}
      </View>
      
      <View style={{ flex: 1 }} {...panResponder.panHandlers}>
        <ScrollView contentContainerStyle={styles.scrollViewContent} scrollEnabled={!isPinching}>
            {ayahsOnCurrentPage.length === 0 && !loading && !testModeState?.isActive && <Text style={styles.centeredMessageText}>لا توجد آيات لعرضها لهذه الصفحة.</Text>}
            
            {testModeState?.isActive ? renderTestContent() : (
              <View style={styles.mushafPageContent}>
                  {groupedAyahs.map(({ surahNumber, ayahs }) => {
                      const surahInfo = surahList.find(s => s.id === surahNumber);
                      const isFirstAyahInGroup = ayahs[0].verse_number === 1;
                      const displaySurahHeader = isFirstAyahInGroup && surahInfo;
                      const displayBismillah = isFirstAyahInGroup && surahNumber !== 1 && surahNumber !== 9;

                      return (
                          <React.Fragment key={surahNumber}>
                              {displaySurahHeader && (
                                  <View style={styles.surahHeaderOuterContainer}>
                                      <View style={styles.surahHeaderInnerContainer}>
                                          <Text style={styles.surahHeaderInfoText}>{surahInfo.total_verses} آيات</Text>
                                          <Text style={[styles.surahHeaderNameText, { fontSize: scaledFontSize * 1.2 }]}>سورة {surahInfo.name_arabic}</Text>
                                          <Text style={styles.surahHeaderInfoText}>{surahInfo.revelation_type === 'Meccan' ? 'مكية' : 'مدنية'}</Text>
                                      </View>
                                  </View>
                              )}
                              {displayBismillah && (
                                  <View style={styles.bismillahContainer}>
                                      <Text style={[styles.bismillahText, { fontSize: scaledFontSize * 1.1 }]}>
                                          بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                                      </Text>
                                  </View>
                              )}
                              <Text style={[styles.ayahTextFlow, { lineHeight: scaledFontSize * 1.9 }]}>
                                  {ayahs.map(ayah => (
                                      <Text key={ayah.id} onPress={() => openAyahActionSheet(ayah)} style={[highlightedAyahId === ayah.id && styles.highlightedAyah]}>
                                          <Text style={{ fontSize: scaledFontSize }}>{ayah.text}</Text>
                                          <Text style={[styles.mushafVerseNumber, { fontSize: scaledFontSize * 0.8 }, bookmarkedAyahs.has(ayah.id) && styles.bookmarkedVerseNumber]}>
                                              {` \uFD3F${ayah.verse_number}\uFD3E`}
                                          </Text>
                                          {' '}
                                      </Text>
                                  ))}
                              </Text>
                          </React.Fragment>
                      );
                  })}
              </View>
            )}

            <View style={styles.pageFooter}>
                <View style={styles.footerDecoration} />
                <Text style={styles.pageFooterText}>{currentPage}</Text>
                <View style={styles.footerDecoration} />
            </View>
        </ScrollView>
      </View>

      {testModeState?.isActive && (
        <View style={styles.testModePanel}>
            <Text style={styles.testModePanelText} numberOfLines={1}>
              اختبار {testModeState.currentTestSurahName || ''} ({testModeState.currentTestRangeString || ''})
            </Text>
            <View style={styles.testModeButtonsContainer}>
                <TouchableOpacity onPress={handleToggleRevealTest} style={styles.testModeButton}>
                    {testModeState.revealed ? <EyeOffIcon color={Colors.white} size={RFValue(20)}/> : <EyeIcon color={Colors.white} size={RFValue(20)} />}
                    <Text style={styles.testModeButtonText}>{testModeState.revealed ? 'إخفاء الكل' : 'إظهار الكل'}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleEndMemorizationTest} style={styles.testModeButton}>
                    <StopCircleIcon color={Colors.white} size={RFValue(20)}/>
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
                <StopCircleIcon color={Colors.white} size={RFValue(24)} />
                <Text style={styles.playbackStopButtonText}>إيقاف</Text>
            </TouchableOpacity>
        </View>
      )}


      <View style={styles.navigationFooter}>
        <TouchableOpacity onPress={handlePrevPage} disabled={currentPage <= 1 } style={[styles.navButton, (currentPage <= 1 ) && styles.navButtonDisabled]}>
          <ChevronUpIcon color={Colors.secondary} size={RFValue(28)} /> 
          <Text style={styles.navButtonText}>السابقة</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleNextPage} disabled={currentPage >= TOTAL_QURAN_PAGES} style={[styles.navButton, (currentPage >= TOTAL_QURAN_PAGES) && styles.navButtonDisabled, { justifyContent: 'flex-end' }]}>
          <Text style={styles.navButtonText}>التالية</Text>
          <ChevronDownIcon color={Colors.secondary} size={RFValue(28)} /> 
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
  screenContainer: { flex: 1, backgroundColor: '#FDF8E8' },
  centeredMessage: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: RFValue(20), },
  centeredMessageText: { fontSize: RFValue(18), color: Colors.accent, textAlign: 'center', },
  errorText: { color: Colors.error, fontSize: RFValue(16), textAlign: 'center', marginBottom: RFValue(10), },
  retryButton: { backgroundColor: Colors.primary, paddingVertical: RFValue(8), paddingHorizontal: RFValue(16), borderRadius: RFValue(6), },
  retryButtonText: { color: Colors.white, fontSize: RFValue(15), },
  pageHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: RFValue(8), paddingHorizontal: RFValue(16), backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.divider, },
  pageHeaderText: { fontSize: RFValue(16), color: Colors.primary, fontFamily: 'Amiri-Regular' },
  scrollViewContent: { paddingBottom: RFValue(10), paddingHorizontal: RFValue(10), }, 
  mushafPageContent: {
    padding: RFValue(12),
    backgroundColor: '#FDF8E8',
    minHeight: '80%', // Ensure it takes up significant space
  },
  ayahTextFlow: {
    writingDirection: 'rtl',
    fontFamily: 'UthmanTNB',
    textAlign: 'right',
    color: Colors.text,
  },
  hiddenWord: {
    color: Colors.grayMedium,
    letterSpacing: 2,
    textDecorationLine: 'underline',
    textDecorationStyle: 'dotted',
  },
  bismillahContainer: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: RFValue(15),
    marginBottom: RFValue(10),
  },
  bismillahText: {
    fontFamily: 'UthmanTNB',
    color: Colors.primary,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  highlightedAyah: { backgroundColor: `rgba(196, 160, 82, 0.25)`, borderRadius: RFValue(5), },
  mushafVerseNumber: { color: Colors.secondary, fontFamily: 'UthmanTNB' },
  bookmarkedVerseNumber: {
    color: Colors.white,
    backgroundColor: Colors.accent,
    borderRadius: RFValue(5),
    paddingHorizontal: RFValue(4),
    paddingVertical: RFValue(1),
    overflow: 'hidden', // for iOS to respect borderRadius on Text
    fontWeight: 'bold',
  },
  navigationFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: RFValue(10), paddingHorizontal: RFValue(16), backgroundColor: Colors.primary, borderTopWidth: 1, borderTopColor: Colors.secondary, },
  navButton: { flexDirection: 'row', alignItems: 'center', padding: RFValue(8), flex: 1, },
  navButtonDisabled: { opacity: 0.5, },
  navButtonText: { color: Colors.secondary, fontSize: RFValue(16), fontWeight: '600', marginHorizontal: RFValue(5), fontFamily: 'Amiri-Regular' },
  surahPlaybackFooter: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: RFValue(12),
    paddingHorizontal: RFValue(16),
    backgroundColor: Colors.primaryLight,
    borderTopWidth: 1,
    borderTopColor: Colors.secondary,
  },
  playbackInfoContainer: {
    flex: 1,
    alignItems: 'flex-end',
    marginRight: RFValue(10),
  },
  playbackSurahName: {
      color: Colors.white,
      fontSize: RFValue(15),
      fontWeight: 'bold',
      fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  },
  reciterTouchable: {
    marginTop: RFValue(4),
  },
  playbackReciterName: {
    color: Colors.secondaryLight,
    fontSize: RFValue(13),
    textDecorationLine: 'underline',
  },
  playbackStopButton: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      paddingVertical: RFValue(6),
      paddingHorizontal: RFValue(12),
      borderRadius: RFValue(20),
      backgroundColor: Colors.error,
  },
  playbackStopButtonText: {
      color: Colors.white,
      fontSize: RFValue(14),
      fontWeight: '600',
      marginRight: RFValue(6),
  },
  testModePanel: { backgroundColor: Colors.accent, paddingVertical: RFValue(8), paddingHorizontal: RFValue(16), flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderColor: Colors.secondaryLight, },
  testModePanelText: { color: Colors.white, fontSize: RFValue(13), fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif', flexShrink: 1, marginRight: RFValue(10), },
  testModeButtonsContainer: { flexDirection: 'row-reverse', },
  testModeButton: { flexDirection: 'row-reverse', alignItems: 'center', paddingVertical: RFValue(6), paddingHorizontal: RFValue(10), borderRadius: RFValue(5), backgroundColor: Colors.primaryLight, marginLeft: RFValue(8), },
  testModeButtonText: { color: Colors.white, fontSize: RFValue(13), fontWeight: '500', marginLeft: RFValue(5), },
  surahHeaderOuterContainer: {
    width: '100%',
    padding: RFValue(5),
    marginVertical: RFValue(15),
  },
  surahHeaderInnerContainer: {
    width: '100%',
    backgroundColor: `rgba(196, 160, 82, 0.1)`, // secondary with opacity
    borderWidth: 2,
    borderColor: Colors.secondary,
    borderRadius: RFValue(10),
    paddingVertical: RFValue(12),
    paddingHorizontal: RFValue(15),
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  surahHeaderNameText: {
    fontFamily: 'UthmanTNB',
    color: Colors.primary,
    fontWeight: 'bold',
  },
  surahHeaderInfoText: {
    fontFamily: 'Amiri-Regular',
    color: Colors.accent,
    fontSize: RFValue(14),
  },
  pageFooter: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: RFValue(15),
    flexDirection: 'row',
  },
  pageFooterText: {
    color: Colors.primary,
    fontSize: RFValue(16),
    fontFamily: 'Amiri-Bold',
    marginHorizontal: RFValue(10),
  },
  footerDecoration: {
    width: RFValue(20),
    height: RFValue(20),
    borderWidth: 2,
    borderColor: Colors.secondary,
    borderRadius: RFValue(10),
    transform: [{ rotate: '45deg' }],
  },
});

export default QuranPageViewerScreen;