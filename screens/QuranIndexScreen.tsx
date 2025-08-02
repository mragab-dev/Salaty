
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Platform, ActivityIndicator } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { Surah } from '../types';
import { fetchSurahList } from '../services/quranService';
import LoadingSpinner from '../components/LoadingSpinner';
import { BookOpenIcon, ListBulletIcon, SearchIcon } from '../components/Icons';
import Colors from '../constants/colors';

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

  const loadSurahsData = async () => {
    try {
      setLoading(true);
      const surahList = await fetchSurahList();
      setSurahs(surahList);
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
          <BookOpenIcon color={Colors.primary} size={16} />
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
       <View style={styles.searchBarContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="ابحث باسم السورة أو رقمها..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={Colors.textLight} 
        />
        <View style={styles.searchIconContainer}>
            <SearchIcon color={Colors.primary} size={20} />
        </View>
      </View>
      <AnyFlatList
        data={filteredSurahs}
        renderItem={renderSurahItem}
        keyExtractor={(item: Surah) => item.id.toString()}
        contentContainerStyle={styles.listContentContainer}
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
    padding: 20,
  },
  errorText: {
    color: Colors.error, 
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  retryButton: {
    backgroundColor: Colors.primary, 
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-bold',
  },
  searchBarContainer: {
    padding: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.moonlight,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    height: 48,
    backgroundColor: Colors.moonlight, 
    borderRadius: 24, 
    paddingHorizontal: 20, 
    fontSize: 16,
    textAlign: Platform.OS === 'android' ? 'right' : 'auto',
    color: Colors.primary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  searchIconContainer: {
      position: 'absolute',
      left: 25, 
      top: '50%',
      transform: [{translateY: -10}] 
  },
  listContentContainer: {
    paddingVertical: 8,
  },
  surahItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginVertical: 5,
    marginHorizontal: 12,
    borderRadius: 12, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, 
    shadowRadius: 3,
    elevation: 2,
  },
  surahNumberContainer: {
    width: 44, 
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary, 
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14, 
  },
  surahNumberText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: 'bold',
  },
  surahInfoContainer: {
    flex: 1,
    alignItems: 'flex-end', 
  },
  surahNameArabic: {
    fontSize: 20, 
    fontWeight: '600',
    color: Colors.arabicText, 
    fontFamily: Platform.OS === 'web' ? 'Amiri, serif' : (Platform.OS === 'ios' ? 'Amiri' : 'sans-serif-medium'), 
  },
  surahNameEnglish: {
    fontSize: 14,
    color: Colors.accent, 
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  surahDetails: {
    fontSize: 12,
    color: Colors.text,
    marginTop: 3,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  surahPageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: `rgba(${parseInt(Colors.secondary.slice(1,3),16)}, ${parseInt(Colors.secondary.slice(3,5),16)}, ${parseInt(Colors.secondary.slice(5,7),16)}, 0.15)`, 
    borderRadius: 8,
  },
  surahPageText: {
    fontSize: 14, 
    color: Colors.accent, 
    marginLeft: 5, 
    fontWeight: '500',
    fontFamily: Platform.OS === 'web' ? 'Amiri, serif' : (Platform.OS === 'ios' ? 'Amiri' : 'sans-serif'),
  },
  emptyListText: {
    fontSize: 16,
    color: Colors.accent,
    textAlign: 'center',
    marginTop: 40, 
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  }
});

export default QuranIndexScreen;
