
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Platform, ActivityIndicator } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { Surah } from '../types';
import { fetchSurahList } from '../services/quranService';
import LoadingSpinner from '../components/LoadingSpinner';
import { BookOpenIcon, ListBulletIcon, SearchIcon, CloseIcon } from '../components/Icons';
import Colors from '../constants/colors';
import { RFValue } from 'react-native-responsive-fontsize';
import AppHeader from '../components/AppHeader';
import { AppStackParamList } from '../App';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ASYNC_STORAGE_LAST_READ_PAGE_KEY } from '../constants';

const AnyFlatList = FlatList as any;

type QuranStackParamList = {
  QuranIndex: undefined;
  QuranPageViewer: { initialPageNumber: number };
};

const QuranIndexScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<QuranStackParamList>>();
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [lastReadPage, setLastReadPage] = useState<number | null>(null);

  const loadSurahsData = async () => {
    try {
      setLoading(true);
      const [surahList, pageStr] = await Promise.all([
        fetchSurahList(),
        AsyncStorage.getItem(ASYNC_STORAGE_LAST_READ_PAGE_KEY)
      ]);
      setSurahs(surahList);
      if (pageStr) {
        setLastReadPage(parseInt(pageStr, 10));
      }
      setError(null);
    } catch (err: any) {
      setError(err.message || "فشل في تحميل فهرس السور.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSurahsData();
  }, []);
  
  const handleContinueReading = () => {
    if (lastReadPage) {
      navigation.navigate('QuranPageViewer', { initialPageNumber: lastReadPage });
    }
  };

  const dismissLastRead = async () => {
    setLastReadPage(null);
    await AsyncStorage.removeItem(ASYNC_STORAGE_LAST_READ_PAGE_KEY);
  };

  const handleSelectSurah = (item: Surah) => {
    navigation.navigate('QuranPageViewer', { initialPageNumber: item.pages[0] });
  };

  const filteredSurahs = surahs.filter(surah => 
    surah.name_arabic.toLowerCase().includes(searchQuery.toLowerCase()) || 
    surah.name_english.toLowerCase().includes(searchQuery.toLowerCase()) ||
    surah.id.toString().includes(searchQuery)
  );

  const renderSurahItem = ({ item }: { item: Surah }) => (
    <TouchableOpacity 
      style={styles.surahItem} 
      onPress={() => handleSelectSurah(item)}
      activeOpacity={0.7}
    >
      <View style={styles.surahNumberContainer}>
        <Text style={styles.surahNumberText}>{item.id}</Text>
      </View>
      <View style={styles.surahInfoContainer}>
        <Text style={styles.surahNameArabic}>{item.name_arabic}</Text>
        <Text style={styles.surahNameEnglish}>{item.name_english}</Text>
        <Text style={styles.surahDetails}>
          {item.revelation_type === 'Meccan' ? 'مكية' : 'مدنية'} • {item.total_verses} آيات
        </Text>
      </View>
      <View style={styles.surahPageContainer}>
          <BookOpenIcon color={Colors.primary} size={RFValue(16)} />
          <Text style={styles.surahPageText}>ص {item.pages[0]}</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return <LoadingSpinner text="جاري تحميل فهرس القرآن..." style={styles.centeredMessage} color={Colors.primary} />;
  }

  if (error) {
    return (
      <View style={styles.centeredMessage}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={loadSurahsData} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>إعادة المحاولة</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.screenContainer}>
       <AppHeader />
       <View style={styles.searchBarContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="ابحث باسم السورة أو رقمها..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={Colors.textLight} 
        />
        <View style={styles.searchIconContainer}>
            <SearchIcon color={Colors.primary} size={RFValue(20)} />
        </View>
      </View>
      <AnyFlatList
        style={{ flex: 1 }}
        data={filteredSurahs}
        renderItem={renderSurahItem}
        keyExtractor={(item: Surah) => item.id.toString()}
        contentContainerStyle={styles.listContentContainer}
        ListHeaderComponent={
          lastReadPage ? (
            <View style={styles.continueReadingContainer}>
              <View style={styles.continueReadingTextContainer}>
                <Text style={styles.continueReadingTitle}>متابعة القراءة</Text>
                <Text style={styles.continueReadingSubtitle}>
                  آخر مرة توقفت عند صفحة {lastReadPage}.
                </Text>
              </View>
              <View style={styles.continueButtons}>
                 <TouchableOpacity style={styles.continueButton} onPress={handleContinueReading}>
                    <Text style={styles.continueButtonText}>الانتقال للصفحة</Text>
                 </TouchableOpacity>
                 <TouchableOpacity style={styles.dismissButton} onPress={dismissLastRead}>
                    <CloseIcon size={RFValue(18)} color={Colors.primaryLight} />
                 </TouchableOpacity>
              </View>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.centeredMessage}>
            <Text style={styles.emptyListText}>لم يتم العثور على سور تطابق بحثك.</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: Colors.background, 
  },
  centeredMessage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: RFValue(20),
  },
  errorText: {
    color: Colors.error, 
    fontSize: RFValue(16),
    textAlign: 'center',
    marginBottom: RFValue(16),
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  retryButton: {
    backgroundColor: Colors.primary, 
    paddingVertical: RFValue(10),
    paddingHorizontal: RFValue(20),
    borderRadius: RFValue(8),
  },
  retryButtonText: {
    color: Colors.white,
    fontSize: RFValue(16),
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-bold',
  },
  searchBarContainer: {
    padding: RFValue(12),
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.moonlight,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    height: RFValue(48),
    backgroundColor: Colors.moonlight, 
    borderRadius: RFValue(24), 
    paddingHorizontal: RFValue(20), 
    fontSize: RFValue(16),
    textAlign: Platform.OS === 'android' ? 'right' : 'auto',
    color: Colors.primary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  searchIconContainer: {
      position: 'absolute',
      left: RFValue(25), 
      top: '50%',
      transform: [{translateY: -RFValue(10)}] 
  },
  listContentContainer: {
    paddingVertical: RFValue(8),
  },
  continueReadingContainer: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.secondaryLight,
    padding: RFValue(15),
    marginHorizontal: RFValue(12),
    borderRadius: RFValue(12),
    marginBottom: RFValue(10),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  continueReadingTextContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  continueReadingTitle: {
    fontSize: RFValue(16),
    fontWeight: 'bold',
    color: Colors.primaryDark,
  },
  continueReadingSubtitle: {
    fontSize: RFValue(14),
    color: Colors.accent,
    marginTop: RFValue(2),
  },
  continueButtons: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  continueButton: {
    backgroundColor: Colors.primary,
    paddingVertical: RFValue(8),
    paddingHorizontal: RFValue(12),
    borderRadius: RFValue(8),
  },
  continueButtonText: {
    color: Colors.white,
    fontWeight: '600',
  },
  dismissButton: {
    padding: RFValue(8),
    marginLeft: RFValue(10),
  },
  surahItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingVertical: RFValue(14),
    paddingHorizontal: RFValue(16),
    marginVertical: RFValue(5),
    marginHorizontal: RFValue(12),
    borderRadius: RFValue(12), 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, 
    shadowRadius: 3,
    elevation: 2,
  },
  surahNumberContainer: {
    width: RFValue(44), 
    height: RFValue(44),
    borderRadius: RFValue(22),
    backgroundColor: Colors.primary, 
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: RFValue(14), 
  },
  surahNumberText: {
    color: Colors.white,
    fontSize: RFValue(15),
    fontWeight: 'bold',
  },
  surahInfoContainer: {
    flex: 1,
    alignItems: 'flex-end', 
  },
  surahNameArabic: {
    fontSize: RFValue(20), 
    fontWeight: '600',
    color: Colors.arabicText, 
    fontFamily: 'Amiri-Regular', 
  },
  surahNameEnglish: {
    fontSize: RFValue(14),
    color: Colors.accent, 
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  surahDetails: {
    fontSize: RFValue(12),
    color: Colors.text,
    marginTop: RFValue(3),
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  surahPageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: RFValue(5),
    paddingHorizontal: RFValue(10),
    backgroundColor: `rgba(${parseInt(Colors.secondary.slice(1,3),16)}, ${parseInt(Colors.secondary.slice(3,5),16)}, ${parseInt(Colors.secondary.slice(5,7),16)}, 0.15)`, 
    borderRadius: RFValue(8),
  },
  surahPageText: {
    fontSize: RFValue(14), 
    color: Colors.accent, 
    marginLeft: RFValue(5), 
    fontWeight: '500',
    fontFamily: 'Amiri-Regular',
  },
  emptyListText: {
    fontSize: RFValue(16),
    color: Colors.accent,
    textAlign: 'center',
    marginTop: RFValue(40), 
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  }
});

export default QuranIndexScreen;
