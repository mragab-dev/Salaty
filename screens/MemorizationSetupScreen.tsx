import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, ScrollView, Alert, Platform } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { Surah } from '../types';
import { fetchSurahList, fetchAyahsForSurah } from '../services/quranService';
import { QuranStackParamList, MemorizationTestParams } from '../App'; // Adjust path as necessary
import LoadingSpinner from '../components/LoadingSpinner';
import Colors from '../constants/colors';
import { CheckmarkIcon, ChevronDownIcon, ChevronUpIcon, SearchIcon } from '../components/Icons';
import { RFValue } from 'react-native-responsive-fontsize';

const AnyFlatList = FlatList as any;

type Difficulty = 'easy' | 'medium' | 'hard';
type ScopeType = 'full_surah' | 'ayah_range';

const MemorizationSetupScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<QuranStackParamList>>();
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [loadingSurahs, setLoadingSurahs] = useState(true);
  const [errorSurahs, setErrorSurahs] = useState<string | null>(null);
  
  const [step, setStep] = useState(1); // 1: Difficulty, 2: Scope Type, 3: Surah/Range selection
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | null>(null);
  const [selectedScopeType, setSelectedScopeType] = useState<ScopeType | null>(null);
  const [selectedSurah, setSelectedSurah] = useState<Surah | null>(null);
  const [startAyah, setStartAyah] = useState('');
  const [endAyah, setEndAyah] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const surahList = await fetchSurahList();
        setSurahs(surahList);
      } catch (err: any) {
        setErrorSurahs(err.message || "فشل في تحميل قائمة السور.");
      } finally {
        setLoadingSurahs(false);
      }
    };
    loadData();
  }, []);

  const handleDifficultySelect = (difficulty: Difficulty) => {
    setSelectedDifficulty(difficulty);
    setStep(2);
  };

  const handleScopeTypeSelect = (scope: ScopeType) => {
    setSelectedScopeType(scope);
    setStep(3);
     // Reset surah selection when scope changes to avoid issues with ayah range input
    setSelectedSurah(null);
    setSearchQuery(''); // Reset search query
  };

  const handleSurahSelect = (surah: Surah) => {
    setSelectedSurah(surah);
    if (selectedScopeType === 'full_surah' && selectedDifficulty) {
      const params: MemorizationTestParams = {
        difficulty: selectedDifficulty,
        surahId: surah.id,
        startAyahNumber: 1,
        endAyahNumber: surah.total_verses,
      };
      navigation.navigate('QuranPageViewer', { testParams: params, initialPageNumber: surah.pages[0] });
    }
    // If ayah_range, selecting a surah here means we proceed to input range for THIS surah.
    // The UI will update to show range input fields.
  };

  const handleRangeSubmit = async () => {
    if (!selectedDifficulty || !selectedSurah || !startAyah || !endAyah) {
      Alert.alert("خطأ", "يرجى ملء جميع الحقول المطلوبة.");
      return;
    }
    const startNum = parseInt(startAyah, 10);
    const endNum = parseInt(endAyah, 10);

    if (isNaN(startNum) || isNaN(endNum) || startNum <= 0 || endNum <= 0 || startNum > endNum || endNum > selectedSurah.total_verses) {
      Alert.alert("خطأ في النطاق", `يرجى إدخال أرقام آيات صالحة. السورة ${selectedSurah.name_arabic} تحتوي على ${selectedSurah.total_verses} آيات.`);
      return;
    }

    const params: MemorizationTestParams = {
      difficulty: selectedDifficulty,
      surahId: selectedSurah.id,
      startAyahNumber: startNum,
      endAyahNumber: endNum,
    };
    
    try {
      const ayahsOfSelectedSurah = await fetchAyahsForSurah(selectedSurah.id);
      const firstAyahInRange = ayahsOfSelectedSurah.find(a => a.verse_number === startNum);
      const initialPage = firstAyahInRange ? firstAyahInRange.page : selectedSurah.pages[0];
      navigation.navigate('QuranPageViewer', { testParams: params, initialPageNumber: initialPage });
    } catch (e) {
        Alert.alert("خطأ", "لم نتمكن من تحديد صفحة البداية. سنبدأ من أول صفحة في السورة.");
        navigation.navigate('QuranPageViewer', { testParams: params, initialPageNumber: selectedSurah.pages[0] });
    }
  };
  
  const filteredSurahs = surahs.filter(surah => 
    surah.name_arabic.toLowerCase().includes(searchQuery.toLowerCase()) || 
    surah.name_english.toLowerCase().includes(searchQuery.toLowerCase()) ||
    surah.id.toString().includes(searchQuery)
  );

  const renderHeader = (title: string, currentStep: number) => (
    <View style={styles.stepHeader}>
      <Text style={styles.stepTitle}>{title}</Text>
      {currentStep > 1 && (
        <TouchableOpacity onPress={() => {
            if(currentStep === 3 && selectedScopeType === 'ayah_range' && selectedSurah) {
                setSelectedSurah(null); // Go back to Surah selection within range mode
                setStartAyah('');
                setEndAyah('');
            } else if (currentStep === 3) { // Coming from surah list (full_surah or ayah_range initial selection)
                setStep(2); 
                setSelectedSurah(null); 
                setSelectedScopeType(null); // Go back to scope type selection
                setSearchQuery('');
            } else if (currentStep === 2) {
                 setStep(1);
                 setSelectedDifficulty(null);
            }
        }} style={styles.backButton}>
          <Text style={styles.backButtonText}>رجوع</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loadingSurahs) return <LoadingSpinner text="جاري تحميل البيانات..." style={styles.centered} />;
  if (errorSurahs) return <View style={styles.centered}><Text style={styles.errorText}>{errorSurahs}</Text></View>;

  const renderContent = () => {
    if (step === 1) {
      return (
        <View>
          {renderHeader("الخطوة ١: اختر مستوى الصعوبة", 1)}
          <TouchableOpacity style={styles.optionButton} onPress={() => handleDifficultySelect('easy')}>
            <Text style={styles.optionButtonText}>سهل (إخفاء ~٢٠٪ من الكلمات)</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.optionButton} onPress={() => handleDifficultySelect('medium')}>
            <Text style={styles.optionButtonText}>متوسط (إخفاء ~٤٠٪ من الكلمات)</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.optionButton} onPress={() => handleDifficultySelect('hard')}>
            <Text style={styles.optionButtonText}>صعب (إخفاء ~٦٠٪ من الكلمات)</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (step === 2 && selectedDifficulty) {
      return (
        <View>
          {renderHeader("الخطوة ٢: اختر نطاق الاختبار", 2)}
          <TouchableOpacity style={styles.optionButton} onPress={() => handleScopeTypeSelect('full_surah')}>
            <Text style={styles.optionButtonText}>سورة كاملة</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.optionButton} onPress={() => handleScopeTypeSelect('ayah_range')}>
            <Text style={styles.optionButtonText}>تحديد نطاق آيات</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (step === 3 && selectedDifficulty && selectedScopeType) {
      if ((selectedScopeType === 'full_surah' && !selectedSurah) || (selectedScopeType === 'ayah_range' && !selectedSurah)) {
        return (
          <View style={{flex:1}}> {/* This View is crucial for FlatList to take space */}
            {renderHeader(selectedScopeType === 'full_surah' ? "الخطوة ٣: اختر السورة" : "الخطوة ٣أ: اختر السورة للنطاق", 3)}
            <View style={styles.searchBarContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="ابحث باسم السورة أو رقمها..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor={Colors.textLight}
              />
              <View style={styles.searchIconContainer}><SearchIcon color={Colors.primary} size={RFValue(20)} /></View>
            </View>
            <AnyFlatList
              data={filteredSurahs}
              keyExtractor={(item: Surah) => item.id.toString()}
              renderItem={({ item }: { item: Surah }) => (
                <TouchableOpacity style={styles.surahItem} onPress={() => handleSurahSelect(item)}>
                  <Text style={styles.surahName}>{item.id}. {item.name_arabic} ({item.name_english})</Text>
                  <Text style={styles.surahInfo}>{item.revelation_type === 'Meccan' ? 'مكية' : 'مدنية'} - {item.total_verses} آيات</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={<Text style={styles.emptyListText}>لم يتم العثور على سور.</Text>}
              style={{ flex: 1 }} // Ensure FlatList expands
            />
          </View>
        );
      } else if (selectedScopeType === 'ayah_range' && selectedSurah) {
        // Reverting to ScrollView to handle potential layout/keyboard issues.
        return (
          <ScrollView>
            {renderHeader(`الخطوة ٣ب: حدد الآيات من سورة ${selectedSurah.name_arabic}`, 3)}
            <Text style={styles.infoText}>السورة تحتوي على {selectedSurah.total_verses} آيات.</Text>
            <TextInput
              style={styles.inputField}
              placeholder="من آية رقم"
              keyboardType="number-pad"
              value={startAyah}
              onChangeText={setStartAyah}
              placeholderTextColor={Colors.textLight}
            />
            <TextInput
              style={styles.inputField}
              placeholder="إلى آية رقم"
              keyboardType="number-pad"
              value={endAyah}
              onChangeText={setEndAyah}
              placeholderTextColor={Colors.textLight}
            />
            <TouchableOpacity style={styles.submitButton} onPress={handleRangeSubmit}>
              <CheckmarkIcon color={Colors.white} size={RFValue(20)} />
              <Text style={styles.submitButtonText}>بدء الاختبار</Text>
            </TouchableOpacity>
          </ScrollView>
        );
      }
    }
    return null; // Should not reach here if logic is correct
  };


  return (
    <View style={styles.container}>
      {renderContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: RFValue(20), 
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: Colors.error,
    fontSize: RFValue(16),
  },
  stepHeader: {
    marginBottom: RFValue(20),
    paddingBottom: RFValue(10),
    borderBottomWidth: 1,
    borderBottomColor: Colors.secondary,
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepTitle: {
    fontSize: RFValue(20),
    fontWeight: 'bold',
    color: Colors.primary,
    textAlign: 'right',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  },
  backButton: {
    paddingVertical: RFValue(5),
    paddingHorizontal: RFValue(10),
    backgroundColor: Colors.moonlight,
    borderRadius: RFValue(5),
  },
  backButtonText: {
    color: Colors.primary,
    fontSize: RFValue(14),
  },
  optionButton: {
    backgroundColor: Colors.primary,
    paddingVertical: RFValue(15),
    paddingHorizontal: RFValue(20),
    borderRadius: RFValue(8),
    marginBottom: RFValue(12),
    alignItems: 'center',
  },
  optionButtonText: {
    color: Colors.white,
    fontSize: RFValue(16),
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  },
  searchBarContainer: {
    marginBottom: RFValue(15),
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    height: RFValue(45),
    backgroundColor: Colors.white,
    borderRadius: RFValue(22),
    paddingHorizontal: RFValue(20),
    paddingRight: RFValue(45), 
    fontSize: RFValue(15),
    textAlign: 'right',
    color: Colors.primary,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  searchIconContainer: {
    position: 'absolute',
    left: RFValue(15),
    top: '50%',
    transform: [{translateY: -RFValue(10)}] 
  },
  surahItem: {
    backgroundColor: Colors.white,
    padding: RFValue(15),
    borderRadius: RFValue(8),
    marginBottom: RFValue(10),
    borderWidth: 1,
    borderColor: Colors.moonlight,
  },
  surahName: {
    fontSize: RFValue(17),
    fontWeight: '600',
    color: Colors.arabicText,
    textAlign: 'right',
    fontFamily: Platform.OS === 'web' ? 'Amiri, serif' : (Platform.OS === 'ios' ? 'Amiri' : 'sans-serif-medium'),
  },
  surahInfo: {
    fontSize: RFValue(13),
    color: Colors.accent,
    textAlign: 'right',
    marginTop: RFValue(3),
  },
  emptyListText: {
    textAlign: 'center',
    color: Colors.accent,
    marginTop: RFValue(20),
  },
  infoText: {
    fontSize: RFValue(15),
    color: Colors.text,
    textAlign: 'right',
    marginBottom: RFValue(15),
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  inputField: {
    backgroundColor: Colors.white,
    paddingHorizontal: RFValue(15),
    paddingVertical: RFValue(12),
    borderRadius: RFValue(8),
    fontSize: RFValue(16),
    textAlign: 'right',
    marginBottom: RFValue(15),
    borderWidth: 1,
    borderColor: Colors.divider,
    color: Colors.primary,
  },
  submitButton: {
    backgroundColor: Colors.secondary,
    paddingVertical: RFValue(15),
    borderRadius: RFValue(8),
    alignItems: 'center',
    flexDirection: 'row-reverse',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: Colors.primary,
    fontSize: RFValue(16),
    fontWeight: 'bold',
    marginLeft: RFValue(8),
  },
});

export default MemorizationSetupScreen;