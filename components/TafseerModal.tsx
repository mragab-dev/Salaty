import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  FlatList,
} from 'react-native';
import { Ayah, TafseerEdition, ApiTafseerAyahData } from '../types';
import { fetchAvailableTafseers, fetchTafseerForAyah } from '../services/tafseerService';
import { DEFAULT_TAFSIR_EDITION_IDENTIFIER } from '../constants';
import Colors from '../constants/colors';
import { CloseIcon } from './Icons';
import { RFValue } from 'react-native-responsive-fontsize';

const AnyFlatList = FlatList as any;

interface TafseerModalProps {
  isVisible: boolean;
  onClose: () => void;
  ayah: Ayah | null;
  surahName: string;
}

const TafseerModal: React.FC<TafseerModalProps> = ({
  isVisible,
  onClose,
  ayah,
  surahName,
}) => {
  const [availableEditions, setAvailableEditions] = useState<TafseerEdition[]>([]);
  const [selectedEditionId, setSelectedEditionId] = useState<string>('');
  const [currentTafseerData, setCurrentTafseerData] = useState<ApiTafseerAyahData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Reset state when modal becomes visible
  useEffect(() => {
    if (isVisible && ayah) {
      setCurrentTafseerData(null);
      setError(null);
      setSelectedEditionId('');
      setIsInitialized(false);
    }
  }, [isVisible, ayah]);

  // Load available editions when modal becomes visible
  useEffect(() => {
    if (isVisible && ayah && !isInitialized) {
      const loadInitialData = async () => {
        setLoading(true);
        setError(null);

        try {
          const editions = await fetchAvailableTafseers();
          
          if (editions.length > 0) {
            setAvailableEditions(editions);
            const defaultExists = editions.some(e => e.id === DEFAULT_TAFSIR_EDITION_IDENTIFIER);
            const initialEditionId = defaultExists ? DEFAULT_TAFSIR_EDITION_IDENTIFIER : editions[0].id;
            setSelectedEditionId(initialEditionId);
            setIsInitialized(true);
          } else {
            setError("لا توجد تفاسير متاحة حالياً.");
          }
        } catch (e: any) {
          console.error('Error loading tafseers:', e);
          setError(e.message || "حدث خطأ أثناء تحميل البيانات.");
        } finally {
          setLoading(false);
        }
      };
      loadInitialData();
    }
  }, [isVisible, ayah, isInitialized]);

  // Load tafseer content when edition changes
  const loadTafseerContent = useCallback(async (editionId: string) => {
    if (!ayah || !editionId) return;
    
    setLoading(true);
    setError(null);
    setCurrentTafseerData(null);
    
    try {
      const tafseerData = await fetchTafseerForAyah(ayah.surah_number, ayah.verse_number, editionId);
      setCurrentTafseerData(tafseerData);
    } catch (e: any) {
      console.error('Error loading tafseer:', e);
      setError(e.message || "فشل في تحميل نص التفسير.");
    } finally {
      setLoading(false);
    }
  }, [ayah]);

  // Load tafseer when selected edition changes
  useEffect(() => {
    if (selectedEditionId && isInitialized) {
      loadTafseerContent(selectedEditionId);
    }
  }, [selectedEditionId, isInitialized, loadTafseerContent]);

  const handleEditionSelect = (editionId: string) => {
    if (editionId !== selectedEditionId) {
      setSelectedEditionId(editionId);
    }
  };
  
  const renderEditionItem = ({ item }: { item: TafseerEdition }) => (
    <TouchableOpacity
      style={[
        styles.editionItem,
        selectedEditionId === item.id && styles.selectedEdition,
      ]}
      onPress={() => handleEditionSelect(item.id)}
      disabled={loading}
    >
      <Text
        style={[
          styles.editionText,
          selectedEditionId === item.id && styles.selectedEditionText,
        ]}
      >
        {item.nameAr}
      </Text>
    </TouchableOpacity>
  );

  const ayahDisplayText = ayah?.text || 'نص الآية غير متوفر';
  const currentTafseerEditionName = availableEditions.find(e => e.id === selectedEditionId)?.nameAr || selectedEditionId;

  if (!isVisible) {
    return null;
  }

  return (
    <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
      <TouchableOpacity style={styles.modalContent} activeOpacity={1} onPress={(e) => e.stopPropagation()}>
        <View style={styles.header}>
          <Text style={styles.title}>التفسير - {ayah?.surah_number}:{ayah?.verse_number}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <CloseIcon size={RFValue(24)} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {ayah && (
            <View style={styles.ayahContainer}>
              <Text style={styles.ayahText}>{ayahDisplayText}</Text>
              <Text style={styles.ayahReference}>
                سورة {surahName} - آية {ayah.verse_number}
              </Text>
            </View>
          )}

          {availableEditions.length > 0 && (
            <View style={styles.editionsContainer}>
              <Text style={styles.editionsTitle}>اختر التفسير:</Text>
              <View style={styles.editionsListContainer}>
                <AnyFlatList
                  data={availableEditions}
                  horizontal
                  keyExtractor={(item: TafseerEdition) => item.id}
                  showsHorizontalScrollIndicator={false}
                  renderItem={renderEditionItem}
                  contentContainerStyle={{ paddingEnd: 10, flexDirection: 'row-reverse' }}
                  inverted={Platform.OS === 'android' ? true : false}
                />
              </View>
            </View>
          )}

          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>جاري التحميل...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity 
                style={styles.retryButton} 
                onPress={() => {
                  setError(null);
                  if (selectedEditionId) {
                    loadTafseerContent(selectedEditionId);
                  }
                }}
              >
                <Text style={styles.retryButtonText}>إعادة المحاولة</Text>
              </TouchableOpacity>
            </View>
          ) : currentTafseerData ? (
            <View style={styles.tafseerContainer}>
              <Text style={styles.tafseerTitle}>{currentTafseerEditionName}</Text>
              <Text style={styles.tafseerText}>{currentTafseerData.text}</Text>
            </View>
          ) : (
            !error && <Text style={styles.noDataText}>اختر تفسيراً لعرض النص.</Text>
          )}
        </ScrollView>
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: Colors.background,
    width: '95%',
    height: '85%',
    borderRadius: RFValue(20),
    padding: RFValue(16),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: RFValue(10),
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
    marginBottom: RFValue(10),
    height: RFValue(50),
  },
  title: {
    fontSize: RFValue(18),
    fontWeight: 'bold',
    color: Colors.primary,
    textAlign: 'center',
    flex: 1,
  },
  closeButton: {
    position: 'absolute',
    right: 0,
    padding: RFValue(8),
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: RFValue(8),
  },
  ayahContainer: {
    backgroundColor: `rgba(${parseInt(Colors.primary.slice(1,3),16)}, ${parseInt(Colors.primary.slice(3,5),16)}, ${parseInt(Colors.primary.slice(5,7),16)}, 0.05)`,
    borderRadius: RFValue(10),
    padding: RFValue(12),
    marginVertical: RFValue(12),
    borderColor: Colors.divider,
    borderWidth: 1,
  },
  ayahText: {
    fontSize: RFValue(17),
    lineHeight: RFValue(28),
    textAlign: 'center',
    color: Colors.arabicText,
    fontFamily: Platform.OS === 'web' ? 'Amiri Quran, Amiri, serif' : (Platform.OS === 'ios' ? 'Amiri Quran' : 'sans-serif-medium'),
    marginBottom: RFValue(8),
  },
  ayahReference: {
    fontSize: RFValue(13),
    color: Colors.accent,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  editionsContainer: {
    marginBottom: RFValue(12),
    paddingVertical: RFValue(8),
  },
  editionsTitle: {
    fontSize: RFValue(15),
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: RFValue(8),
    textAlign: 'right',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  },
  editionsListContainer: {
    // This style is needed to ensure the FlatList contentContainerStyle works correctly
    // when it's inverted and has a paddingEnd.
    // Without this, the paddingEnd might not apply correctly to the FlatList content.
    // This is a common issue when using inverted FlatList with paddingEnd.
    // The paddingEnd is applied to the parent View.
  },
  editionItem: {
    paddingVertical: RFValue(10),
    paddingHorizontal: RFValue(16),
    marginLeft: RFValue(8),
    borderRadius: RFValue(20),
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.secondaryLight,
    minWidth: RFValue(100),
    alignItems: 'center',
  },
  selectedEdition: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.primaryLight,
  },
  editionText: {
    fontSize: RFValue(13),
    color: Colors.primary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    textAlign: 'center',
  },
  selectedEditionText: {
    color: Colors.white,
    fontWeight: '500',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: RFValue(20),
  },
  loadingText: {
    fontSize: RFValue(16),
    color: Colors.primary,
    textAlign: 'center',
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: RFValue(20),
  },
  errorText: {
    fontSize: RFValue(15),
    color: Colors.error,
    textAlign: 'center',
    marginBottom: RFValue(12),
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingVertical: RFValue(8),
    paddingHorizontal: RFValue(16),
    borderRadius: RFValue(6),
  },
  retryButtonText: {
    color: Colors.white,
    fontSize: RFValue(14),
    fontWeight: '500',
  },
  tafseerContainer: {
    marginTop: RFValue(8),
    padding: RFValue(12),
    backgroundColor: Colors.white,
    borderRadius: RFValue(10),
    borderColor: Colors.divider,
    borderWidth: 1,
    flex: 1,
    minHeight: RFValue(200),
  },
  tafseerTitle: {
    fontSize: RFValue(16),
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: RFValue(8),
    textAlign: 'right',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  },
  tafseerText: {
    fontSize: RFValue(15),
    textAlign: 'right',
    color: Colors.text,
    lineHeight: RFValue(26),
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    flex: 1,
  },
  noDataText: {
    fontSize: RFValue(15),
    color: Colors.textLight,
    textAlign: 'center',
    paddingVertical: RFValue(20),
  },
});

export default TafseerModal;
