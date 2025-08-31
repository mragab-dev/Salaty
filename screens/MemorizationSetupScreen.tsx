import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, ScrollView, Alert, Platform, Modal } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Surah } from '../types';
import { fetchSurahList, fetchAyahsForSurah } from '../services/quranService';
import { QuranStackParamList, MemorizationTestParams } from '../App';
import LoadingSpinner from '../components/LoadingSpinner';
import Colors from '../constants/colors';
import { CheckmarkIcon, ChevronDownIcon, SearchIcon, BookOpenIcon, SlidersHorizontalIcon, TrendingUpIcon, CloseIcon, MicIcon, EyeIcon } from '../components/Icons';
import { RFValue } from 'react-native-responsive-fontsize';

const AnyFlatList = FlatList as any;

type Difficulty = 'easy' | 'medium' | 'hard';
type ScopeType = 'full_surah' | 'ayah_range';
type TestMode = 'visual' | 'audio';

const MemorizationSetupScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp<QuranStackParamList>>();
    const insets = useSafeAreaInsets();
    const [surahs, setSurahs] = useState<Surah[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [selectedSurah, setSelectedSurah] = useState<Surah | null>(null);
    const [scopeType, setScopeType] = useState<ScopeType>('full_surah');
    const [startAyah, setStartAyah] = useState('');
    const [endAyah, setEndAyah] = useState('');
    const [difficulty, setDifficulty] = useState<Difficulty>('medium');
    const [testMode, setTestMode] = useState<TestMode>('visual');

    // UI state for the modal
    const [isSurahSelectorVisible, setIsSurahSelectorVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const loadData = async () => {
            try {
                const surahList = await fetchSurahList();
                setSurahs(surahList);
            } catch (err: any) {
                setError(err.message || "فشل في تحميل قائمة السور.");
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);
    
    const isFormValid = () => {
        if (!selectedSurah || !difficulty || !testMode) return false;
        if (scopeType === 'ayah_range') {
            const startNum = parseInt(startAyah, 10);
            const endNum = parseInt(endAyah, 10);
            if (isNaN(startNum) || isNaN(endNum) || startNum <= 0 || endNum < startNum || endNum > selectedSurah.total_verses) {
                return false;
            }
        }
        return true;
    };

    const handleSubmit = async () => {
        if (!isFormValid() || !selectedSurah) {
            Alert.alert("بيانات غير مكتملة", "يرجى التأكد من اختيار السورة وتحديد نطاق آيات صحيح.");
            return;
        }

        const params: MemorizationTestParams = {
            difficulty: difficulty,
            surahId: selectedSurah.id,
            startAyahNumber: scopeType === 'full_surah' ? 1 : parseInt(startAyah, 10),
            endAyahNumber: scopeType === 'full_surah' ? selectedSurah.total_verses : parseInt(endAyah, 10),
            testMode: testMode, // Pass the selected test mode
        };
        
        // For audio test, we navigate but also pass an indicator to show the mic
        if (testMode === 'audio') {
            navigation.navigate('QuranPageViewer', { testParams: params, initialPageNumber: selectedSurah.pages[0] });
            return;
        }

        // For visual test, we fetch ayahs here to determine start page
        try {
            const ayahsOfSelectedSurah = await fetchAyahsForSurah(selectedSurah.id);
            const firstAyahInRange = ayahsOfSelectedSurah.find(a => a.verse_number === params.startAyahNumber);
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
        String(surah.id).includes(searchQuery)
    );

    const renderSurahSelectItem = ({ item }: { item: Surah }) => (
        <TouchableOpacity
            style={styles.surahItem}
            onPress={() => {
                setSelectedSurah(item);
                setIsSurahSelectorVisible(false);
                setSearchQuery('');
            }}
        >
            <Text style={styles.surahName}>{`${item.id}. ${item.name_arabic}`}</Text>
            <Text style={styles.surahInfo}>{`${item.revelation_type === 'Meccan' ? 'مكية' : 'مدنية'} - ${item.total_verses} آيات`}</Text>
        </TouchableOpacity>
    );

    if (loading) return <LoadingSpinner text="جاري تحميل البيانات..." style={styles.centered} />;
    if (error) return <View style={styles.centered}><Text style={styles.errorText}>{error}</Text></View>;

    return (
        <View style={styles.screenWrapper}>
            <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>

                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <CheckmarkIcon color={Colors.primary} size={RFValue(20)} />
                        <Text style={styles.sectionTitle}>1. اختر نوع الاختبار</Text>
                    </View>
                    <View style={styles.segmentedControl}>
                        <TouchableOpacity
                            style={[styles.segment, testMode === 'visual' && styles.segmentActive]}
                            onPress={() => setTestMode('visual')}
                        >
                            <EyeIcon size={RFValue(16)} color={testMode === 'visual' ? Colors.white : Colors.primary}/>
                            <Text style={[styles.segmentText, testMode === 'visual' && styles.segmentTextActive, { marginLeft: 5 }]}>مرئي (إخفاء كلمات)</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.segment, testMode === 'audio' && styles.segmentActive]}
                            onPress={() => setTestMode('audio')}
                        >
                            <MicIcon size={RFValue(16)} color={testMode === 'audio' ? Colors.white : Colors.primary}/>
                            <Text style={[styles.segmentText, testMode === 'audio' && styles.segmentTextActive, { marginLeft: 5 }]}>صوتي (تسميع)</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <BookOpenIcon color={Colors.primary} size={RFValue(20)} />
                        <Text style={styles.sectionTitle}>2. اختر السورة</Text>
                    </View>
                    <TouchableOpacity style={styles.selectorButton} onPress={() => setIsSurahSelectorVisible(true)}>
                        <Text style={styles.selectorButtonText}>{selectedSurah ? selectedSurah.name_arabic : 'اختر السورة...'}</Text>
                        <ChevronDownIcon />
                    </TouchableOpacity>
                </View>

                {selectedSurah && (
                    <>
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <SlidersHorizontalIcon color={Colors.primary} size={RFValue(20)} />
                                <Text style={styles.sectionTitle}>3. حدد النطاق</Text>
                            </View>
                            <View style={styles.segmentedControl}>
                                <TouchableOpacity
                                    style={[styles.segment, scopeType === 'full_surah' && styles.segmentActive]}
                                    onPress={() => setScopeType('full_surah')}
                                >
                                    <Text style={[styles.segmentText, scopeType === 'full_surah' && styles.segmentTextActive]}>سورة كاملة</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.segment, scopeType === 'ayah_range' && styles.segmentActive]}
                                    onPress={() => setScopeType('ayah_range')}
                                >
                                    <Text style={[styles.segmentText, scopeType === 'ayah_range' && styles.segmentTextActive]}>تحديد نطاق</Text>
                                </TouchableOpacity>
                            </View>

                            {scopeType === 'ayah_range' && (
                                <View style={styles.rangeInputContainer}>
                                    <TextInput
                                        style={styles.inputField}
                                        placeholder={`من آية (1-${selectedSurah.total_verses})`}
                                        keyboardType="number-pad"
                                        value={startAyah}
                                        onChangeText={setStartAyah}
                                        placeholderTextColor={Colors.textLight}
                                    />
                                    <TextInput
                                        style={styles.inputField}
                                        placeholder={`إلى آية (1-${selectedSurah.total_verses})`}
                                        keyboardType="number-pad"
                                        value={endAyah}
                                        onChangeText={setEndAyah}
                                        placeholderTextColor={Colors.textLight}
                                    />
                                </View>
                            )}
                        </View>
                        { testMode === 'visual' &&
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <TrendingUpIcon color={Colors.primary} size={RFValue(20)} />
                                <Text style={styles.sectionTitle}>4. اختر الصعوبة</Text>
                            </View>
                            <View style={styles.segmentedControl}>
                                {([['easy', 'سهل'], ['medium', 'متوسط'], ['hard', 'صعب']] as const).map(([level, label]) => (
                                    <TouchableOpacity
                                        key={level}
                                        style={[styles.segment, difficulty === level && styles.segmentActive]}
                                        onPress={() => setDifficulty(level)}
                                    >
                                        <Text style={[styles.segmentText, difficulty === level && styles.segmentTextActive]}>{label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                        }
                    </>
                )}

                <TouchableOpacity
                    style={[styles.submitButton, !isFormValid() && styles.disabledButton]}
                    onPress={handleSubmit}
                    disabled={!isFormValid()}
                >
                    <CheckmarkIcon color={Colors.primary} size={RFValue(20)} />
                    <Text style={styles.submitButtonText}>بدء الاختبار</Text>
                </TouchableOpacity>
            </ScrollView>

            <Modal
                animationType="slide"
                visible={isSurahSelectorVisible}
                onRequestClose={() => setIsSurahSelectorVisible(false)}
            >
                <View style={[styles.modalView, { paddingTop: insets.top }]}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>اختر سورة</Text>
                        <TouchableOpacity style={styles.closeButton} onPress={() => setIsSurahSelectorVisible(false)}>
                            <CloseIcon size={RFValue(24)} color={Colors.primary} />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.searchBarContainer}>
                        <TextInput
                            style={styles.searchInput}
                            placeholder="ابحث..."
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            placeholderTextColor={Colors.textLight}
                            autoFocus={true}
                        />
                        <View style={styles.searchIconContainer}><SearchIcon color={Colors.primary} size={RFValue(18)} /></View>
                    </View>
                    <AnyFlatList
                        data={filteredSurahs}
                        renderItem={renderSurahSelectItem}
                        keyExtractor={(item: Surah) => String(item.id)}
                        style={styles.modalSurahList}
                    />
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    screenWrapper: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: RFValue(16),
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
    section: {
        backgroundColor: Colors.white,
        borderRadius: RFValue(12),
        padding: RFValue(16),
        marginBottom: RFValue(20),
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    sectionHeader: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        marginBottom: RFValue(12),
    },
    sectionTitle: {
        fontSize: RFValue(18),
        fontWeight: 'bold',
        color: Colors.primary,
        marginRight: RFValue(10),
        fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
    },
    selectorButton: {
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: RFValue(12),
        borderRadius: RFValue(8),
        borderWidth: 1,
        borderColor: Colors.divider,
    },
    selectorButtonText: {
        fontSize: RFValue(16),
        color: Colors.text,
    },
    searchBarContainer: {
        margin: RFValue(10),
    },
    searchInput: {
        height: RFValue(40),
        backgroundColor: Colors.moonlight,
        borderRadius: RFValue(8),
        paddingHorizontal: RFValue(15),
        paddingLeft: RFValue(40),
        fontSize: RFValue(15),
        textAlign: 'right',
        color: Colors.primary,
    },
    searchIconContainer: {
        position: 'absolute',
        left: RFValue(12),
        top: '50%',
        transform: [{ translateY: -RFValue(9) }],
    },
    surahItem: {
        padding: RFValue(12),
        borderBottomWidth: 1,
        borderBottomColor: Colors.moonlight,
    },
    surahName: {
        fontSize: RFValue(16),
        color: Colors.primary,
        textAlign: 'right',
    },
    surahInfo: {
        fontSize: RFValue(12),
        color: Colors.accent,
        textAlign: 'right',
        marginTop: RFValue(2),
    },
    segmentedControl: {
        flexDirection: 'row-reverse',
        width: '100%',
        backgroundColor: Colors.moonlight,
        borderRadius: RFValue(8),
        overflow: 'hidden',
    },
    segment: {
        flex: 1,
        paddingVertical: RFValue(10),
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row-reverse',
    },
    segmentActive: {
        backgroundColor: Colors.primary,
    },
    segmentText: {
        fontSize: RFValue(14),
        color: Colors.primary,
        fontWeight: '500',
    },
    segmentTextActive: {
        color: Colors.white,
    },
    rangeInputContainer: {
        flexDirection: 'row-reverse',
        marginTop: RFValue(12),
        justifyContent: 'space-between',
    },
    inputField: {
        backgroundColor: Colors.white,
        paddingHorizontal: RFValue(15),
        paddingVertical: RFValue(10),
        borderRadius: RFValue(8),
        fontSize: RFValue(16),
        textAlign: 'right',
        borderWidth: 1,
        borderColor: Colors.divider,
        color: Colors.primary,
        width: '48%',
    },
    submitButton: {
        backgroundColor: Colors.secondary,
        paddingVertical: RFValue(15),
        borderRadius: RFValue(8),
        alignItems: 'center',
        flexDirection: 'row-reverse',
        justifyContent: 'center',
        marginTop: RFValue(10),
    },
    submitButtonText: {
        color: Colors.primary,
        fontSize: RFValue(16),
        fontWeight: 'bold',
        marginRight: RFValue(8),
    },
    disabledButton: {
        backgroundColor: Colors.grayMedium,
        opacity: 0.7,
    },
    // Modal Styles
    modalView: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    modalHeader: {
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: RFValue(15),
        borderBottomWidth: 1,
        borderBottomColor: Colors.divider,
    },
    modalTitle: {
        fontSize: RFValue(20),
        fontWeight: 'bold',
        color: Colors.primary,
    },
    closeButton: {
        padding: RFValue(5),
    },
    modalSurahList: {
        flex: 1,
    }
});

export default MemorizationSetupScreen;