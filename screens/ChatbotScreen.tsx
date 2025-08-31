import Colors from '../constants/colors';
import { LinearGradient } from 'expo-linear-gradient';
import { SendIcon, BookOpenIcon, SparklesIcon, SalatyLogoIcon, UserIcon, TrashIcon } from '../components/Icons';
import { Share2, Star, Navigation } from 'lucide-react-native';
import TypingIndicator from '../components/TypingIndicator';
import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppStackParamList } from '../App'; 
import { getChatbotResponse, ApiContent } from '../services/chatbotService'; 
import { fetchAllAyahs, fetchSurahList } from '../services/quranService';
import { Ayah, Surah, ChatMessage } from '../types'; 
import { suggestedPrompts } from '../assets/data/chatbot/responses';
import { 
  ASYNC_STORAGE_CHAT_HISTORY_KEY, 
  ASYNC_STORAGE_LAST_EMOTIONAL_CONTEXT,
  ASYNC_STORAGE_LAST_EMOTIONAL_TIMESTAMP,
  SESSION_TIMEOUT_HOURS 
} from '../constants';
import { RFValue } from 'react-native-responsive-fontsize';
import islamicPatternImg from '../assets/images/islamic_pattern.png';
import mosqueSilhouetteImg from '../assets/images/mosque_silhouette.png';
import AppHeader from '../components/AppHeader';

const AnyFlatList = FlatList as any;

type ChatbotNavigationProp = NavigationProp<AppStackParamList>;

export default function ChatbotScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<ChatbotNavigationProp>();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const [favoriteMessages, setFavoriteMessages] = useState<Set<string>>(new Set());

  const [allAyahs, setAllAyahs] = useState<Ayah[]>([]);
  const [surahList, setSurahList] = useState<Surah[]>([]);
  const [quranDataLoaded, setQuranDataLoaded] = useState(false);
  const [quickReplies, setQuickReplies] = useState<string[]>([]);

  const initialGreetingMessage: ChatMessage = {
    id: 'initial-greeting',
    text: 'السلام عليكم! أنا صلاتى، رفيقك الإسلامي. كيف حالك اليوم؟',
    isUser: false,
    type: 'text',
    timestamp: Date.now(),
  };

  const handleClearChat = () => {
    Alert.alert(
      "مسح المحادثة",
      "هل أنت متأكد أنك تريد مسح جميع الرسائل؟ لا يمكن التراجع عن هذا الإجراء.",
      [
        {
          text: "إلغاء",
          style: "cancel",
        },
        {
          text: "مسح",
          style: "destructive",
          onPress: async () => {
            try {
              setMessages([initialGreetingMessage]);
              await AsyncStorage.removeItem(ASYNC_STORAGE_CHAT_HISTORY_KEY);
              await AsyncStorage.removeItem(ASYNC_STORAGE_LAST_EMOTIONAL_CONTEXT);
              await AsyncStorage.removeItem(ASYNC_STORAGE_LAST_EMOTIONAL_TIMESTAMP);
              console.log("Chat history and context cleared.");
            } catch (e) {
              console.error("Failed to clear chat history:", e);
              Alert.alert("خطأ", "لم نتمكن من مسح المحادثة.");
            }
          },
        },
      ],
      { cancelable: true }
    );
  };
  
  const generateFollowUpMessage = useCallback((history: ChatMessage[]): ChatMessage | null => {
    if (history.length < 2) return null; 

    const recentHistory = history.slice(-10); 
    let lastEmotionalContext: string | undefined = undefined;
    let lastEmotionalTimestamp: number | undefined = undefined;

    for (let i = recentHistory.length - 1; i >= 0; i--) {
      const msg = recentHistory[i];
      if (!msg.isUser && msg.emotionalContext && msg.timestamp) {
        lastEmotionalContext = msg.emotionalContext;
        lastEmotionalTimestamp = msg.timestamp;
        break;
      }
    }
    
    if (lastEmotionalContext && lastEmotionalTimestamp) {
      const hoursSinceLastEmotion = (Date.now() - lastEmotionalTimestamp) / (1000 * 60 * 60);
      if (hoursSinceLastEmotion > SESSION_TIMEOUT_HOURS) {
        return {
          id: `followup-${Date.now()}`,
          text: `مرحباً بك مجدداً. في محادثتنا الأخيرة، بدا أنك تشعر بـ (${lastEmotionalContext}). كيف حالك اليوم بخصوص هذا الأمر؟`,
          isUser: false,
          type: 'text',
          timestamp: Date.now(),
        };
      }
    }
    return null;
  }, []);


  useEffect(() => {
    const loadChatData = async () => {
      if (suggestedPrompts && Array.isArray(suggestedPrompts)) {
        setQuickReplies(suggestedPrompts);
      } else {
        setQuickReplies([]);
      }

      try {
        const [loadedAyahs, loadedSurahs] = await Promise.all([
          fetchAllAyahs(),
          fetchSurahList(),
        ]);
        setAllAyahs(loadedAyahs);
        setSurahList(loadedSurahs);
        setQuranDataLoaded(true);
        console.log("Quran data loaded for chatbot screen.");
      } catch (error) {
        console.error("Error loading Quran data for chatbot:", error);
      }

      try {
        const storedHistory = await AsyncStorage.getItem(ASYNC_STORAGE_CHAT_HISTORY_KEY);
        if (storedHistory) {
          const parsedHistory: ChatMessage[] = JSON.parse(storedHistory);
          const followUpMsg = generateFollowUpMessage(parsedHistory);
          if (followUpMsg) {
            setMessages([...parsedHistory, followUpMsg]);
          } else {
            setMessages(parsedHistory);
          }
        } else {
          setMessages([initialGreetingMessage]);
        }
      } catch (e) {
        console.error('Failed to load chat history:', e);
        setMessages([initialGreetingMessage]);
      }
    };

    loadChatData();
  }, [generateFollowUpMessage]);
  

  useEffect(() => {
    if (messages.length > 0 && (messages.length > 1 || messages[0].id !== 'initial-greeting')) {
      AsyncStorage.setItem(ASYNC_STORAGE_CHAT_HISTORY_KEY, JSON.stringify(messages))
        .catch(e => console.error('Failed to save chat history:', e));
    }
  }, [messages]);


  const handleQuickReply = (reply: string) => {
    setInput(reply);
    setTimeout(() => handleSend(reply), 0); 
  };

  const toggleFavorite = (messageId: string) => {
    setFavoriteMessages(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(messageId)) {
        newFavorites.delete(messageId);
      } else {
        newFavorites.add(messageId);
      }
      setMessages(currentMessages => 
        currentMessages.map(msg => 
          msg.id === messageId ? { ...msg, isFavorite: !msg.isFavorite } : msg
        )
      );
      return newFavorites;
    });
  };

  const handleShare = async (messageText: string) => {
    try {
      await Share.share({
        message: `نصيحة من شات بوت صلاتي:\n"${messageText}"`,
      });
    } catch (error: any) {
      console.error('Error sharing message:', error.message);
      Alert.alert('فشل في مشاركة الرسالة.');
    }
  };

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      })
    ]).start();
  }, [fadeAnim, scaleAnim]);

  const handleSend = async (textToSend?: string) => {
    const currentInput = textToSend || input;
    if (currentInput.trim() === '') return;
    
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: currentInput,
      isUser: true,
      type: 'text',
      timestamp: Date.now(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    if(!textToSend) setInput(''); 
    setIsLoading(true);
    
    try {
      const historyForApi: ApiContent[] = messages
        .filter(m => m.id !== initialGreetingMessage.id) 
        .map(m => ({ 
          role: m.isUser ? 'user' : 'model' as 'user' | 'model',
          parts: [{ text: m.text }]
      }));

      const botResponse = await getChatbotResponse(currentInput, historyForApi);
      
      const ayahRefRegex = /\[AYAH_REF:([^\]]+)\]/;
      const dhikrCategoryRegex = /\[DHIKR_CATEGORY:([^\]]+)\]/;

      const ayahRefMatch = botResponse.text.match(ayahRefRegex);
      const dhikrCategoryMatch = botResponse.text.match(dhikrCategoryRegex);

      const cleanText = botResponse.text
        .replace(ayahRefRegex, "")
        .replace(dhikrCategoryRegex, "")
        .trim();

      const botMessageTimestamp = Date.now();
      const botMessage: ChatMessage = {
        id: (botMessageTimestamp + 1).toString(), // Ensure unique ID
        text: cleanText,
        isUser: false,
        type: 'text',
        ayahRef: ayahRefMatch ? ayahRefMatch[1] : undefined,
        dhikrCategory: dhikrCategoryMatch ? dhikrCategoryMatch[1] : undefined,
        dhikrCategoryName: dhikrCategoryMatch ? dhikrCategoryMatch[1] : undefined, 
        timestamp: botMessageTimestamp,
        emotionalContext: botResponse.emotionalContext, 
        navigationHint: botResponse.navigationHint,
      };
      
      setMessages(prev => [...prev, botMessage]);

      // Store emotional context for follow-up notification
      if (botMessage.emotionalContext) {
        await AsyncStorage.setItem(ASYNC_STORAGE_LAST_EMOTIONAL_CONTEXT, botMessage.emotionalContext);
        await AsyncStorage.setItem(ASYNC_STORAGE_LAST_EMOTIONAL_TIMESTAMP, botMessage.timestamp.toString());
        console.log("Stored emotional context:", botMessage.emotionalContext, "at", botMessage.timestamp);
      }

    } catch (error: any) {
      console.error('Error fetching response:', error.message);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: "عذراً، لم أستطع معالجة رسالتك. يرجى المحاولة مرة أخرى.",
        isUser: false,
        type: 'text',
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNavigateToAyah = (ayahRef: string) => {
    if (!quranDataLoaded) {
      Alert.alert("انتظر", "جاري تحميل بيانات المصحف، يرجى المحاولة بعد لحظات.");
      return;
    }
    const parts = ayahRef.split(':');
    if (parts.length < 2) {
      Alert.alert("خطأ", "مرجع الآية غير صحيح.");
      return;
    }

    const surahIdentifier = parts.slice(0, -1).join(':').trim();
    const verseNumber = parseInt(parts[parts.length - 1].trim(), 10);

    if (isNaN(verseNumber)) {
        Alert.alert("خطأ", "رقم الآية غير صحيح.");
        return;
    }
    
    navigation.navigate('Main', {
        screen: 'QuranStack',
        params: {
            screen: 'QuranPageViewer',
            params: {
                targetSurahIdentifier: surahIdentifier,
                targetVerseNumber: verseNumber
            }
        }
    });
};

  const handleNavigateToDhikr = (categoryId: string, categoryName?: string) => {
    navigation.navigate('Main', {
      screen: 'AdhkarTab',
      params: {
        screen: 'AdhkarList',
        params: {
          categoryId: categoryId,
          categoryName: categoryName || categoryId,
        },
      },
    });
  };

  const handleNavigation = (hint: { target: string; params?: any }) => {
    const { target, params } = hint;
    const tabScreens = ['PrayerTimesTab', 'QuranStack', 'AdhkarTab', 'ReportsTab'];

    if (tabScreens.includes(target)) {
        navigation.navigate('Main', {
            screen: target as any,
            ...(params && { params: params as any })
        });
    } else {
        navigation.navigate(target as any, params as any);
    }
  };


const renderMessageItem = ({ item }: { item: ChatMessage }) => {
    const isUser = item.isUser;
    return (
        <View style={[styles.messageRow, isUser ? styles.userRow : styles.botRow]}>
            <View style={[styles.avatarContainer, isUser ? styles.userAvatar : styles.botAvatar]}>
                {isUser ? (
                    <UserIcon size={RFValue(24)} color={Colors.primaryDark} />
                ) : (
                    <SalatyLogoIcon size={RFValue(28)} color={Colors.white} />
                )}
            </View>
            <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.botBubble]}>
                <View style={styles.messageHeader}>
                    <Text style={[styles.messageText, isUser ? styles.userText : styles.botText]}>{item.text}</Text>
                    {!isUser && (
                        <View style={styles.messageActions}>
                             <TouchableOpacity style={styles.actionButton} onPress={() => handleShare(item.text)}>
                                <Share2 size={RFValue(18)} color={Colors.textLight} />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.actionButton} onPress={() => toggleFavorite(item.id)}>
                                <Star size={RFValue(18)} color={item.isFavorite ? Colors.secondary : Colors.textLight} fill={item.isFavorite ? Colors.secondary : 'transparent'} />
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
                 {!item.isUser && (item.ayahRef || item.dhikrCategory || item.navigationHint) && (
                    <View style={styles.interactiveButtonsContainer}>
                        {item.ayahRef && (
                            <TouchableOpacity style={styles.interactiveButton} onPress={() => handleNavigateToAyah(item.ayahRef!)}>
                                <BookOpenIcon size={RFValue(16)} color={Colors.primary} />
                                <Text style={styles.interactiveButtonText}>عرض الآية في المصحف</Text>
                            </TouchableOpacity>
                        )}
                        {item.dhikrCategory && (
                            <TouchableOpacity style={styles.interactiveButton} onPress={() => handleNavigateToDhikr(item.dhikrCategory!, item.dhikrCategoryName)}>
                                <SparklesIcon size={RFValue(16)} color={Colors.primary} />
                                <Text style={styles.interactiveButtonText}>الذهاب إلى هذا الذكر</Text>
                            </TouchableOpacity>
                        )}
                        {item.navigationHint && (
                            <TouchableOpacity
                                style={styles.interactiveButton}
                                onPress={() => handleNavigation(item.navigationHint!)}>
                                <Navigation size={RFValue(16)} color={Colors.primary} />
                                <Text style={styles.interactiveButtonText}>{item.navigationHint.label}</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}
                {!item.isUser && item.id === initialGreetingMessage.id && messages.length <= (messages.find(m => m.id.startsWith("followup-")) ? 2 : 1) && quickReplies.length > 0 && (
                    <View style={styles.quickRepliesContainer}>
                        {quickReplies.map((reply, index) => (
                            <TouchableOpacity key={index} style={styles.quickReplyButton} onPress={() => handleQuickReply(reply)}>
                                <Text style={styles.quickReplyText}>{reply}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </View>
        </View>
    );
};

  return (
    <View style={styles.container}>
      <AppHeader 
        title="اسأل صلاتي" 
        headerRight={
            <TouchableOpacity onPress={handleClearChat} style={{ padding: RFValue(5) }}>
                <TrashIcon color={Colors.secondary} size={RFValue(24)} />
            </TouchableOpacity>
        }
      />
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + RFValue(50) : 0} 
      >
        <Animated.View style={[styles.chatContainer, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
            <AnyFlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item: ChatMessage) => item.id}
              renderItem={renderMessageItem}
              contentContainerStyle={styles.messagesList}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
              onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
              ListFooterComponent={isLoading ? <TypingIndicator /> : null}
            />
          
          <View style={styles.inputContainer}>
            <View style={styles.inputRow}>
              <TextInput style={styles.input} value={input} onChangeText={setInput} placeholder="شارك ما تشعر به..." placeholderTextColor={Colors.textLight} multiline maxLength={500}/>
              <TouchableOpacity style={[styles.sendButton, (!input.trim()) && styles.disabledButton]} onPress={() => handleSend()} disabled={(!input.trim()) || isLoading}>
                <LinearGradient colors={input.trim() ? [Colors.secondary, Colors.secondaryLight] : ['rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.1)']} style={styles.sendButtonGradient}>
                  {isLoading ? <ActivityIndicator size="small" color={Colors.primary} /> : <SendIcon size={RFValue(20)} color={Colors.primary} />}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary, },
  keyboardContainer: { flex: 1, },
  chatContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  messagesList: { padding: RFValue(10), },
  messageRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: RFValue(12), maxWidth: '85%', },
  userRow: { alignSelf: 'flex-end', flexDirection: 'row-reverse' },
  botRow: { alignSelf: 'flex-start', },
  avatarContainer: { width: RFValue(40), height: RFValue(40), borderRadius: RFValue(20), justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2, },
  userAvatar: { backgroundColor: Colors.secondaryLight, marginRight: RFValue(8) },
  botAvatar: { backgroundColor: Colors.primaryLight, marginLeft: RFValue(8) },
  messageBubble: { padding: RFValue(12), borderRadius: RFValue(18), flexShrink: 1, },
  userBubble: { backgroundColor: Colors.secondary, borderBottomRightRadius: RFValue(6), },
  botBubble: { backgroundColor: Colors.white, borderBottomLeftRadius: RFValue(6), },
  messageHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'flex-start', },
  messageText: { fontSize: RFValue(16), lineHeight: RFValue(24), textAlign: 'right', fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif', },
  userText: { color: Colors.primaryDark, },
  botText: { color: Colors.text, },
  inputContainer: { backgroundColor: Colors.background, borderTopWidth: 1, borderTopColor: Colors.moonlight, },
  inputRow: { flexDirection: 'row-reverse', padding: RFValue(10), alignItems: 'center', },
  input: { flex: 1, backgroundColor: Colors.white, borderRadius: RFValue(24), paddingHorizontal: RFValue(20), paddingVertical: Platform.OS === 'ios' ? RFValue(12) : RFValue(10), maxHeight: RFValue(100), fontSize: RFValue(16), color: Colors.text, textAlign: 'right', borderWidth: 1, borderColor: Colors.divider, },
  sendButton: { width: RFValue(48), height: RFValue(48), borderRadius: RFValue(24), marginLeft: RFValue(10), overflow: 'hidden', },
  sendButtonGradient: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', },
  disabledButton: { opacity: 0.6, },
  quickRepliesContainer: { flexDirection: 'row', flexWrap: 'wrap', marginTop: RFValue(12), justifyContent: 'flex-start', gap: RFValue(8), },
  quickReplyButton: { backgroundColor: Colors.background, paddingHorizontal: RFValue(14), paddingVertical: RFValue(8), borderRadius: RFValue(16), borderWidth: 1, borderColor: Colors.divider, },
  quickReplyText: { color: Colors.primary, fontSize: RFValue(14), fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium', },
  messageActions: { flexDirection: 'row', gap: RFValue(8), marginLeft: RFValue(10), paddingTop: RFValue(4) },
  actionButton: { padding: RFValue(4), },
  interactiveButtonsContainer: { marginTop: RFValue(12), paddingTop: RFValue(10), borderTopWidth: 1, borderTopColor: Colors.divider, alignItems: 'flex-start', },
  interactiveButton: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: `rgba(${parseInt(Colors.secondary.slice(1,3),16)}, ${parseInt(Colors.secondary.slice(3,5),16)}, ${parseInt(Colors.secondary.slice(5,7),16)}, 0.15)`, paddingVertical: RFValue(8), paddingHorizontal: RFValue(12), borderRadius: RFValue(18), marginTop: RFValue(8), },
  interactiveButtonText: { color: Colors.primary, fontSize: RFValue(14), marginRight: RFValue(8), fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium', },
});