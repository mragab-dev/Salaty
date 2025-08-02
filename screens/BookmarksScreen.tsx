import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Platform } from 'react-native';
import { useRoute, RouteProp, useNavigation, NavigationProp } from '@react-navigation/native'; // Added useNavigation
import Colors from '../constants/colors';
import { Ayah } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import { BookOpenIcon } from '../components/Icons';
import { QuranStackParamList } from '../App'; // Import ParamList for navigation
import { RFValue } from 'react-native-responsive-fontsize';

const AnyFlatList = FlatList as any;

type BookmarksScreenRouteProp = RouteProp<QuranStackParamList, 'Bookmarks'>;

const BookmarksScreen: React.FC = () => {
  const route = useRoute<BookmarksScreenRouteProp>();
  const navigation = useNavigation<NavigationProp<QuranStackParamList>>(); // Typed navigation
  const { bookmarkedAyahs: bookmarkedAyahIds, allAyahs } = route.params;

  const [loading, setLoading] = useState(true);
  const [displayableBookmarks, setDisplayableBookmarks] = useState<Ayah[]>([]);

  useEffect(() => {
    if (allAyahs && allAyahs.length > 0 && bookmarkedAyahIds) {
      const filtered = allAyahs.filter(ayah => bookmarkedAyahIds.has(ayah.id));
      // Sort by surah_number then verse_number
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
    setLoading(false);
  }, [allAyahs, bookmarkedAyahIds]);

  const handleNavigate = (pageNumber: number) => {
    // Navigate back to QuranPageViewerScreen and set the initial page
    navigation.navigate('QuranPageViewer', { initialPageNumber: pageNumber });
  };


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

  const getSurahNameFromAllAyahs = (surahNumber: number) => {
    // This is inefficient if allAyahs is huge. For a better approach, a surahList would be ideal.
    // Assuming surah_number maps to a loaded surah in allAyahs, or pass surahList.
    // For now, we'll find the first Ayah of that surah to get its name (if surah names aren't directly in Ayah objects).
    // This assumes a surah list is not directly available here, and uses the structure of `allAyahs`.
    // A better approach would be to also pass the `surahList` from `quranService` to this screen.
    // As a fallback, use surah number.
    return `سورة ${surahNumber}`; // Placeholder if surah name isn't easily accessible from ayah object
  };

  const renderBookmarkItem = ({ item }: { item: Ayah }) => (
    <TouchableOpacity style={styles.bookmarkItem} onPress={() => handleNavigate(item.page)}>
      <Text style={styles.bookmarkAyahText}>{item.text.substring(0, 100)}{item.text.length > 100 ? '...' : ''}</Text>
      <View style={styles.bookmarkDetails}>
        <Text style={styles.bookmarkSurahText}>
          {getSurahNameFromAllAyahs(item.surah_number)} - آية {item.verse_number}
        </Text>
        <View style={styles.pageInfo}>
            <BookOpenIcon color={Colors.accent} size={RFValue(14)} />
            <Text style={styles.bookmarkPageText}>صفحة {item.page}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

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
    fontFamily: Platform.OS === 'web' ? 'Amiri Quran, Amiri, serif' : (Platform.OS === 'ios' ? 'Amiri Quran' : 'sans-serif'),
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
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
});

export default BookmarksScreen;