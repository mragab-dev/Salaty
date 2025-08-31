import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Platform } from 'react-native';
import { useRoute, RouteProp, useNavigation, NavigationProp } from '@react-navigation/native';
import Colors from '../constants/colors';
import { Ayah, Surah } from '../types';
import { fetchAllAyahs } from '../services/quranService';
import LoadingSpinner from '../components/LoadingSpinner';
import { BookOpenIcon } from '../components/Icons';
import { QuranStackParamList } from '../App';
import { RFValue } from 'react-native-responsive-fontsize';

const AnyFlatList = FlatList as any;

type BookmarksScreenRouteProp = RouteProp<QuranStackParamList, 'Bookmarks'>;

const BookmarksScreen: React.FC = () => {
  const route = useRoute<BookmarksScreenRouteProp>();
  const navigation = useNavigation<NavigationProp<QuranStackParamList>>();
  const { bookmarkedAyahs: bookmarkedAyahIds, surahList } = route.params;

  const [loading, setLoading] = useState(true);
  const [displayableBookmarks, setDisplayableBookmarks] = useState<Ayah[]>([]);

  useEffect(() => {
    const processBookmarks = async () => {
      // Keep loading spinner on while fetching AND filtering
      setLoading(true);
      try {
        const allAyahs = await fetchAllAyahs();
        
        // Defer heavy filtering to next event loop cycle to prevent UI freeze during navigation
        setTimeout(() => {
          if (allAyahs && allAyahs.length > 0 && bookmarkedAyahIds) {
            const bookmarkedIdSet = new Set(bookmarkedAyahIds);
            const filtered = allAyahs.filter(ayah => bookmarkedIdSet.has(ayah.id));
            
            filtered.sort((a, b) => {
              if (a.surah_number !== b.surah_number) {
                return a.surah_number - b.surah_number;
              }
              return a.verse_number - b.verse_number;
            });
            setDisplayableBookmarks(filtered);
          } else {
            setDisplayableBookmarks([]);
          }
          setLoading(false); // Stop loading only after filtering is done
        }, 0);

      } catch (error) {
        console.error("Error loading ayahs for bookmarks:", error);
        setDisplayableBookmarks([]);
        setLoading(false);
      }
    };
    
    processBookmarks();
  }, [bookmarkedAyahIds]);

  const handleNavigate = (pageNumber: number) => {
    navigation.navigate('QuranPageViewer', { initialPageNumber: pageNumber });
  };

  const getSurahName = useCallback((surahNumber: number): string => {
    if (!surahList || surahList.length === 0) {
      return `سورة ${surahNumber}`;
    }
    const surahInfo = surahList.find(s => s.id === surahNumber);
    return surahInfo ? surahInfo.name_arabic : `سورة ${surahNumber}`;
  }, [surahList]);

  const renderBookmarkItem = ({ item }: { item: Ayah }) => (
    <TouchableOpacity style={styles.bookmarkItem} onPress={() => handleNavigate(item.page)}>
      <Text style={styles.bookmarkAyahText}>{item.text.substring(0, 100)}{item.text.length > 100 ? '...' : ''}</Text>
      <View style={styles.bookmarkDetails}>
        <Text style={styles.bookmarkSurahText}>
          {getSurahName(item.surah_number)} - آية {item.verse_number}
        </Text>
        <View style={styles.pageInfo}>
            <BookOpenIcon color={Colors.accent} size={RFValue(14)} />
            <Text style={styles.bookmarkPageText}>صفحة {item.page}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return <LoadingSpinner text="جاري تحميل العلامات المرجعية..." style={styles.centered} />;
  }

  if (displayableBookmarks.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>لا توجد علامات مرجعية محفوظة حالياً.</Text>
        <Text style={styles.emptySubText}>يمكنك إضافة علامة مرجعية من صفحة المصحف.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
        <View style={styles.headerContainer}>
            <Text style={styles.headerTitle}>العلامات المرجعية</Text>
        </View>
        <AnyFlatList
            data={displayableBookmarks}
            renderItem={renderBookmarkItem}
            keyExtractor={(item: Ayah) => item.id.toString()}
            contentContainerStyle={styles.listContent}
        />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: RFValue(20),
  },
  emptyText: {
    fontSize: RFValue(18),
    color: Colors.accent,
    textAlign: 'center',
    marginBottom: RFValue(8),
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  },
  emptySubText: {
    fontSize: RFValue(14),
    color: Colors.textLight,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  headerContainer: {
    backgroundColor: Colors.primary,
    paddingVertical: RFValue(15),
    paddingHorizontal: RFValue(20),
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  headerTitle: {
    fontSize: RFValue(22),
    color: Colors.secondary,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-bold',
  },
  listContent: {
    padding: RFValue(16),
  },
  bookmarkItem: {
    backgroundColor: Colors.white,
    padding: RFValue(16),
    borderRadius: RFValue(10),
    marginBottom: RFValue(12),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: Colors.secondary,
  },
  bookmarkAyahText: {
    fontSize: RFValue(16),
    fontFamily: 'AmiriQuran-Regular',
    color: Colors.arabicText,
    textAlign: 'right',
    marginBottom: RFValue(10),
    lineHeight: RFValue(28),
  },
  bookmarkDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bookmarkSurahText: {
    fontSize: RFValue(13),
    color: Colors.accent,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  pageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bookmarkPageText: {
    fontSize: RFValue(13),
    color: Colors.accent,
    marginLeft: RFValue(5),
    fontFamily: 'Amiri-Regular',
  },
});

export default BookmarksScreen;
