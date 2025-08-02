import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute, RouteProp, NavigationProp } from '@react-navigation/native';
import { Reciter, Ayah } from '../types';
import QuranAudioService from '../services/quranAudioService';
import Colors from '../constants/colors';
import { CheckmarkIcon } from '../components/Icons';
import { QuranStackParamList } from '../App'; 
import LoadingSpinner from '../components/LoadingSpinner';
import { RFValue } from 'react-native-responsive-fontsize';

const AnyFlatList = FlatList as any;

type ReciterListScreenRouteProp = RouteProp<QuranStackParamList, 'ReciterList'>;
type ReciterListNavigationProp = NavigationProp<QuranStackParamList, 'ReciterList'>;

const ReciterListScreen: React.FC = () => {
  const navigation = useNavigation<ReciterListNavigationProp>();
  const route = useRoute<ReciterListScreenRouteProp>();
  // ayahToPlay is passed but not directly used in this screen's UI logic,
  // it's implicitly handled by QuranPageViewerScreen upon navigation back.
  // const { ayahToPlay } = route.params; 

  const audioService = QuranAudioService.getInstance();
  const [reciters, setReciters] = useState<Reciter[]>([]);
  const [currentReciterId, setCurrentReciterId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReciters = () => {
      setLoading(true);
      const availableReciters = audioService.getReciters();
      setReciters(availableReciters);
      setCurrentReciterId(audioService.getCurrentReciter()?.id || null);
      setLoading(false);
    };
    fetchReciters();
  }, [audioService]);

  const handleSelectReciter = (reciter: Reciter) => {
    audioService.setReciter(reciter);
    // QuranPageViewerScreen will use useIsFocused and its ayahPendingPlayback state
    // to start playback of the Ayah that was initially selected.
    if (navigation.canGoBack()) {
        navigation.goBack();
    } else {
        // Fallback if somehow cannot go back, navigate to viewer with initial page.
        // This specific ayahToPlay param might not be directly used by QuranPageViewer if it relies on its own state.
        navigation.navigate('QuranPageViewer', { initialPageNumber: route.params.ayahToPlay.page });
    }
  };

  const renderReciterItem = ({ item }: { item: Reciter }) => (
    <TouchableOpacity
      style={[
        styles.reciterItem,
        currentReciterId === item.id && styles.selectedReciterItem,
      ]}
      onPress={() => handleSelectReciter(item)}
    >
      <View style={styles.reciterInfo}>
        <Text style={styles.reciterNameAr}>{item.nameAr}</Text>
        <Text style={styles.reciterRewaya}>{item.rewaya.ar}</Text>
      </View>
      {currentReciterId === item.id && (
        <CheckmarkIcon color={Colors.primary} size={RFValue(24)} />
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return <LoadingSpinner text="جاري تحميل قائمة القراء..." style={styles.centered}/>;
  }

  return (
    <View style={styles.container}>
      <AnyFlatList
        data={reciters}
        renderItem={renderReciterItem}
        keyExtractor={(item: Reciter) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<View style={styles.centered}><Text>لا يوجد قراء متاحون حالياً.</Text></View>}
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
  },
  listContent: {
    paddingVertical: RFValue(8),
  },
  reciterItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: RFValue(16),
    paddingHorizontal: RFValue(20),
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
    backgroundColor: Colors.white,
    marginVertical: RFValue(5),
    marginHorizontal: RFValue(12),
    borderRadius: RFValue(10),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  selectedReciterItem: {
    backgroundColor: `rgba(${parseInt(Colors.secondary.slice(1,3),16)}, ${parseInt(Colors.secondary.slice(3,5),16)}, ${parseInt(Colors.secondary.slice(5,7),16)}, 0.25)`,
    borderColor: Colors.secondary,
    borderWidth: 1.5,
  },
  reciterInfo: {
    flex: 1,
    alignItems: 'flex-end', // Align text to the right for Arabic
  },
  reciterNameAr: {
    fontSize: RFValue(18),
    color: Colors.arabicText,
    fontFamily: Platform.OS === 'web' ? 'Amiri, serif' : (Platform.OS === 'ios' ? 'Amiri' : 'sans-serif-medium'),
    textAlign: 'right',
  },
  reciterRewaya: {
    fontSize: RFValue(14),
    color: Colors.accent,
    fontFamily: Platform.OS === 'web' ? 'Amiri, serif' : (Platform.OS === 'ios' ? 'Amiri' : 'sans-serif'),
    marginTop: RFValue(3),
    textAlign: 'right',
  },
});

export default ReciterListScreen;