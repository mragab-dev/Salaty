import Colors from '../constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Send, BookOpen, Sparkles as SparklesLucide } from 'lucide-react-native'; 
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
import { QuranStackParamList, AdhkarStackParamList } from '../App'; 
import { getChatbotResponse, ApiContent } from '../services/chatbotService'; 
import { fetchAllAyahs, fetchSurahList } from '../services/quranService';
import { Ayah, Surah, ChatMessage } from '../types'; 
import emotionalResponsesData from '../assets/data/chatbot/emotional_responses.json'; 
import { 
  ASYNC_STORAGE_CHAT_HISTORY_KEY, 
  ASYNC_STORAGE_LAST_EMOTIONAL_CONTEXT,
  ASYNC_STORAGE_LAST_EMOTIONAL_TIMESTAMP,
  SESSION_TIMEOUT_HOURS 
} from '../constants';
import { RFValue } from 'react-native-responsive-fontsize';

const AnyFlatList = FlatList as any;

type ChatbotNavigationProp = NavigationProp<QuranStackParamList & AdhkarStackParamList>;

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
      if (emotionalResponsesData && Array.isArray(emotionalResponsesData.suggestedPrompts)) {
        setQuickReplies(emotionalResponsesData.suggestedPrompts);
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
    if (parts.length !== 2) {
      Alert.alert("خطأ", "مرجع الآية غير صحيح.");
      return;
    }
    const surahIdentifier = parts[0].trim();
    const verseNumber = parseInt(parts[1].trim(), 10);

    if (isNaN(verseNumber)) {
      Alert.alert("خطأ", "رقم الآية غير صحيح.");
      return;
    }
    
    navigation.navigate('QuranPageViewer', { 
        targetSurahIdentifier: surahIdentifier, 
        targetVerseNumber: verseNumber 
    });
  };

  const handleNavigateToDhikr = (categoryId: string, categoryName?: string) => {
    navigation.navigate('AdhkarList', { 
        categoryId: categoryId, 
        categoryName: categoryName || categoryId 
    });
  };


  return (
    <View style={styles.container}>
      <View style={styles.topSection}><Image source={require('../assets/images/islamic_pattern.png')} style={styles.patternImage} resizeMode="repeat"/></View>
      <View style={styles.bottomSection}><Image source={require('../assets/images/islamic_pattern.png')} style={styles.mosqueImage} resizeMode="cover"/></View>

      <KeyboardAvoidingView
        style={[styles.keyboardContainer, { paddingTop: insets.top }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? (insets.top > 20 ? 60 : 90) : 0}
      >
        <Animated.View style={[styles.headerContainer, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
          <View style={styles.header}>
            <Text style={styles.title}>اسأل صلاتى</Text>
            <Text style={styles.titleEnglish}>Ask Salaty</Text>
            <Text style={styles.subtitle}>الإرشاد الإسلامي والراحة</Text>
            <View style={styles.headerDecoration}><Svg width={RFValue(120)} height={RFValue(20)}><Path d="M10,10 L50,10 M70,10 L110,10" stroke={Colors.secondary} strokeWidth="1" strokeLinecap="round"/><Circle cx={60} cy={10} r="4" fill={Colors.secondary} fillOpacity="0.8"/></Svg></View>
          </View>
        </Animated.View>
        
        <Animated.View style={[styles.chatContainer, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
          <LinearGradient colors={['rgba(26, 47, 69, 0.95)', 'rgba(26, 47, 69, 0.98)']} style={styles.chatBackground}>
            <AnyFlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item: ChatMessage) => item.id}
              renderItem={({ item }: { item: ChatMessage }) => (
                <View style={[styles.messageBubble, item.isUser ? styles.userBubble : styles.botBubble]}>
                    <View style={styles.messageHeader}>
                        <Text style={[styles.messageText, item.isUser ? styles.userText : styles.botText]}>{item.text}</Text>
                        {!item.isUser && (
                        <View style={styles.messageActions}>
                            <TouchableOpacity style={styles.actionButton} onPress={() => handleShare(item.text)}><Ionicons name="share-outline" size={RFValue(20)} color={Colors.white}/></TouchableOpacity>
                            <TouchableOpacity style={styles.actionButton} onPress={() => toggleFavorite(item.id)}><Ionicons name={item.isFavorite ? "star" : "star-outline"} size={RFValue(20)} color={item.isFavorite ? Colors.secondary : Colors.white}/></TouchableOpacity>
                        </View>
                        )}
                    </View>
                    {!item.isUser && (item.ayahRef || item.dhikrCategory) && (
                        <View style={styles.interactiveButtonsContainer}>
                            {item.ayahRef && (
                                <TouchableOpacity style={styles.interactiveButton} onPress={() => handleNavigateToAyah(item.ayahRef!)}>
                                    <BookOpen size={RFValue(16)} color={Colors.white} />
                                    <Text style={styles.interactiveButtonText}>عرض الآية في المصحف</Text>
                                </TouchableOpacity>
                            )}
                            {item.dhikrCategory && (
                                <TouchableOpacity style={styles.interactiveButton} onPress={() => handleNavigateToDhikr(item.dhikrCategory!, item.dhikrCategoryName)}>
                                     <SparklesLucide size={RFValue(16)} color={Colors.white} />
                                    <Text style={styles.interactiveButtonText}>الذهاب إلى هذا الذكر</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    )}
                    {!item.isUser && item.id === initialGreetingMessage.id && messages.length <= (messages.find(m=>m.id.startsWith("followup-")) ? 2:1) && quickReplies.length > 0 && (
                    <View style={styles.quickRepliesContainer}>
                        {quickReplies.map((reply, index) => (
                        <TouchableOpacity key={index} style={styles.quickReplyButton} onPress={() => handleQuickReply(reply)}><Text style={styles.quickReplyText}>{reply}</Text></TouchableOpacity>
                        ))}
                    </View>
                    )}
                </View>
              )}
              contentContainerStyle={styles.messagesList}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
              onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
            />
          </LinearGradient>
          
          <LinearGradient colors={['rgba(26, 47, 69, 0.98)', 'rgba(26, 47, 69, 1)']} style={styles.inputContainer}>
            <View style={styles.inputRow}>
              <TextInput style={styles.input} value={input} onChangeText={setInput} placeholder="شارك ما تشعر به..." placeholderTextColor={Colors.textLight} multiline maxLength={500}/>
              <TouchableOpacity style={[styles.sendButton, (!input.trim()) && styles.disabledButton]} onPress={() => handleSend()} disabled={(!input.trim()) || isLoading}>
                <LinearGradient colors={input.trim() ? [Colors.secondary, Colors.secondaryLight] : ['rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.1)']} style={styles.sendButtonGradient}>
                  {isLoading ? <ActivityIndicator size="small" color={Colors.white} /> : <Send size={RFValue(20)} color={Colors.white} />}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary, },
  topSection: { position: 'absolute', top: 0, left: 0, right: 0, height: '50%', zIndex: 0 },
  patternImage: { width: '100%', height: '100%', opacity: 0.3, },
  bottomSection: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%', zIndex: 0, },
  mosqueImage: { width: '100%', height: '100%', opacity: 0.4, },
  keyboardContainer: { flex: 1, },
  headerContainer: { paddingHorizontal: RFValue(20), paddingVertical: RFValue(1), backgroundColor: 'transparent', },
  header: { alignItems: 'center', },
  title: { fontSize: RFValue(32), fontWeight: 'bold', color: Colors.white, marginBottom: RFValue(4), textShadowColor: 'rgba(0, 0, 0, 0.3)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 2, fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium', },
  titleEnglish: { fontSize: RFValue(18), color: Colors.secondary, fontWeight: '600', marginBottom: RFValue(8), fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif', },
  subtitle: { fontSize: RFValue(16), color: Colors.white, opacity: 0.9, marginBottom: RFValue(10), fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif', },
  headerDecoration: { alignItems: 'center', marginBottom: RFValue(10), },
  chatContainer: { flex: 1, marginHorizontal: RFValue(16), marginBottom: RFValue(16), borderRadius: RFValue(24), overflow: 'hidden', borderWidth: 1.5, borderColor: 'rgba(212, 175, 55, 0.3)', shadowColor: Colors.secondary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 10, },
  chatBackground: { flex: 1, },
  messagesList: { padding: RFValue(16), paddingBottom: RFValue(100), },
  messageBubble: { maxWidth: '80%', padding: RFValue(16), borderRadius: RFValue(20), marginBottom: RFValue(12), shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3, },
  userBubble: { backgroundColor: Colors.secondary, alignSelf: 'flex-end', borderBottomRightRadius: RFValue(6), borderWidth: 1, borderColor: 'rgba(212, 175, 55, 0.3)', },
  botBubble: { backgroundColor: 'rgba(255, 255, 255, 0.95)', alignSelf: 'flex-start', borderBottomLeftRadius: RFValue(6), borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.2)', },
  messageText: { fontSize: RFValue(16), lineHeight: RFValue(24), textAlign: 'right', fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif', },
  userText: { color: Colors.primary, fontWeight: '500', },
  botText: { color: Colors.text, },
  inputContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, borderTopWidth: 1.5, borderTopColor: 'rgba(212, 175, 55, 0.3)', },
  inputRow: { flexDirection: 'row', padding: RFValue(16), alignItems: 'flex-end', },
  input: { flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: RFValue(24), paddingHorizontal: RFValue(20), paddingVertical: Platform.OS === 'ios' ? RFValue(12) : RFValue(10), maxHeight: RFValue(100), fontSize: RFValue(16), color: Colors.text, textAlign: 'right', borderWidth: 1, borderColor: 'rgba(212, 175, 55, 0.3)', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3, fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif', },
  sendButton: { width: RFValue(48), height: RFValue(48), borderRadius: RFValue(24), marginLeft: RFValue(12), overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 5, },
  sendButtonGradient: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', },
  disabledButton: { opacity: 0.6, },
  quickRepliesContainer: { flexDirection: 'row', flexWrap: 'wrap', marginTop: RFValue(10), justifyContent: 'flex-start', gap: RFValue(8), },
  quickReplyButton: { backgroundColor: Colors.moonlight, paddingHorizontal: RFValue(12), paddingVertical: RFValue(6), borderRadius: RFValue(16), borderWidth: 1, borderColor: Colors.divider, },
  quickReplyText: { color: Colors.primary, fontSize: RFValue(14), fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif', },
  messageHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: RFValue(8), },
  messageActions: { flexDirection: Platform.OS === 'web' ? 'row-reverse' : 'row', gap: RFValue(8), 
    alignSelf: 'flex-start', 
    paddingTop: RFValue(4),
  },
  actionButton: { padding: RFValue(4), },
  interactiveButtonsContainer: {
    flexDirection: 'column', 
    marginTop: RFValue(10),
    alignItems: 'flex-start', 
  },
  interactiveButton: {
    flexDirection: 'row-reverse', 
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    paddingVertical: RFValue(8),
    paddingHorizontal: RFValue(12),
    borderRadius: RFValue(18),
    marginTop: RFValue(8),
    alignSelf: 'flex-start', 
  },
  interactiveButtonText: {
    color: Colors.white,
    fontSize: RFValue(14),
    marginLeft: RFValue(8), 
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  },
});