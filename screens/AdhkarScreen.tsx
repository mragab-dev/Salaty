import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { Dimensions, FlatList, ImageBackground, StyleSheet, Text, TouchableOpacity, View, Animated, Platform, ColorValue, TextInput, ScrollView } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BookOpen, Heart, Moon, Sun, Sunrise, Sunset, Volume2, Star, Sparkles, Shirt, ShieldCheck, ThumbsUp, TrendingUp, Zap, Send, RefreshCw } from 'lucide-react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RFValue } from 'react-native-responsive-fontsize';

import Colors from '../constants/colors';
import IslamicPattern from '../components/IslamicPattern';
import rawCategoryData from '../assets/data/azkar/category';
import { AdhkarStackParamList } from '../App';
import { SearchIcon } from '../components/Icons'; 
import { ASYNC_STORAGE_ADHKAR_FAVORITES_KEY } from '../constants';

const AnyAnimatedScrollView = Animated.ScrollView as any;

interface AdhkarCategory {
  id: string;
  titleArabic: string;
  icon: string;
}

const transformCategories = (): AdhkarCategory[] => {
  const iconMapping: { [key: string]: string } = {
    "أذكار الصباح": "sun",
    "أذكار المساء": "sunset",
    "أذكار النوم": "moon",
    "أذكار الآذان": "volume-2",
    "أذكار الاستيقاظ من النوم": "sunrise",
    "دعاء لبس الثوب": "shirt",
    "دعاء الاستفتاح": "book-open",
    "الأذكار بعد السلام من الصلاة": "heart",
    "الرُّقية الشرعية من القرآن الكريم": "shield-check",
    "الرُّقية الشرعية من السنة النبوية": "shield-check",
    "دعاء السفر": "send",
    "فضل الصلاة على النبي صلى الله عليه و سلم": "heart",
    "الاستغفار و التوبة": "refresh-cw",
    "التسبيح، التحميد، التهليل، التكبير": "trending-up",
    "default": "sparkles"
  };

  return rawCategoryData.map((cat) => {
    const mappedIcon = iconMapping[cat.cat_name] || iconMapping["default"];
    return {
      id: cat.cat_name,
      titleArabic: cat.cat_name,
      icon: mappedIcon
    };
  });
};

const adhkarCategories: AdhkarCategory[] = transformCategories();

const { width: screenWidth, height } = Dimensions.get('window');
const CARD_MARGIN = RFValue(15);
const CARD_WIDTH = (screenWidth - (CARD_MARGIN * 3)) / 2;


interface TimeColorsReturn {
  primary: readonly [ColorValue, ColorValue, ColorValue];
  secondary: readonly [ColorValue, ColorValue, ColorValue];
}

const CategoryCard = ({
  item,
  index,
  onPress,
  getIcon,
  isFavorite,
  onToggleFavorite,
}: {
  item: AdhkarCategory;
  index: number;
  onPress: (categoryId: string, categoryName: string) => void;
  getIcon: (iconName: string, isActive?: boolean) => React.ReactNode;
  isFavorite: boolean;
  onToggleFavorite: (categoryId: string) => void;
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const [isPressed, setIsPressed] = useState(false);
  const glowAnim = useRef(new Animated.Value(0)).current;

  const cardGradientColors: readonly [ColorValue, ColorValue] = isPressed
    ? [Colors.secondaryLight, Colors.secondary]
    : [Colors.primary, Colors.primaryLight];

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 500,
      delay: index * 100,
      useNativeDriver: true,
    }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2500, 
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 2500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [animatedValue, glowAnim, index]);

  const cardOpacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const cardTranslateY = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [RFValue(20), 0], 
  });
  
  const cardScale = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.95, 1] 
  });

  const handlePressIn = () => {
    setIsPressed(true);
  };

  const handlePressOut = () => {
    setIsPressed(false);
  };
  
  return (
    <Animated.View
      style={[
        styles.categoryCard,
        {
          opacity: cardOpacity,
          transform: [{ translateY: cardTranslateY }, { scale: cardScale }],
        },
      ]}
    >
      <Animated.View
        style={[
          styles.spiritualGlow,
          {
            opacity: glowAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.05, 0.15],
            }),
             transform: [{ scale: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.05] }) }] 
          },
        ]}
      />
      
      <TouchableOpacity
        onPress={() => onPress(item.id, item.titleArabic)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1} 
        style={styles.cardTouchable}
      >
        <LinearGradient
           colors={cardGradientColors}
          start={{ x: 0.2, y: 0.2 }}
          end={{ x: 0.8, y: 0.8 }}
          style={styles.cardGradient}
        >
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={() => onToggleFavorite(item.id)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Star
              size={RFValue(20)}
              color={isFavorite ? Colors.secondary : Colors.moonlight}
              fill={isFavorite ? Colors.secondary : 'transparent'}
              strokeWidth={1.5}
            />
          </TouchableOpacity>

          <View style={[styles.iconContainer, isPressed && styles.iconContainerPressed]}>
             <View style={styles.iconAura} />
            {getIcon(item.icon, isPressed)}
          </View>

          <Text style={[styles.categoryTitle, isPressed && styles.categoryTitlePressed]} numberOfLines={2} ellipsizeMode="tail">
            {item.titleArabic}
          </Text>
          
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function AdhkarScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp<AdhkarStackParamList>>();
  const scrollY = useRef(new Animated.Value(0)).current;
  const [timeOfDay, setTimeOfDay] = useState<'morning' | 'evening' | 'night'>('morning');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  
  const [searchQuery, setSearchQuery] = useState('');
  const [favoriteCategoryIds, setFavoriteCategoryIds] = useState<Set<string>>(new Set());
  const [initialFavsLoaded, setInitialFavsLoaded] = useState(false);

  useEffect(() => {
    const loadFavorites = async () => {
        try {
            const stored = await AsyncStorage.getItem(ASYNC_STORAGE_ADHKAR_FAVORITES_KEY);
            if (stored) {
                setFavoriteCategoryIds(new Set(JSON.parse(stored)));
            }
        } catch (e) { console.error("Failed to load Adhkar favorites", e); }
        finally { setInitialFavsLoaded(true); }
    };
    loadFavorites();
  }, []);

  useEffect(() => {
      if (!initialFavsLoaded) return;
      const saveFavorites = async () => {
          try {
              await AsyncStorage.setItem(ASYNC_STORAGE_ADHKAR_FAVORITES_KEY, JSON.stringify(Array.from(favoriteCategoryIds)));
          } catch (e) { console.error("Failed to save Adhkar favorites", e); }
      };
      saveFavorites();
  }, [favoriteCategoryIds, initialFavsLoaded]);

  const handleToggleFavorite = useCallback((categoryId: string) => {
      setFavoriteCategoryIds(prev => {
          const newSet = new Set(prev);
          if (newSet.has(categoryId)) {
              newSet.delete(categoryId);
          } else {
              newSet.add(categoryId);
          }
          return newSet;
      });
  }, []);

  const favoriteCategories = useMemo(() =>
      adhkarCategories.filter(cat => favoriteCategoryIds.has(cat.id)),
      [favoriteCategoryIds]
  );

  const regularCategories = useMemo(() =>
      adhkarCategories.filter(cat => !favoriteCategoryIds.has(cat.id)),
      [favoriteCategoryIds]
  );
  
  const filteredCategories = useMemo(() => {
      if (!searchQuery) return [];
      return adhkarCategories.filter(cat => 
          cat.titleArabic.toLowerCase().includes(searchQuery.toLowerCase())
      );
  }, [searchQuery]);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 12) setTimeOfDay('morning'); 
    else if (hour >= 12 && hour < 18) setTimeOfDay('evening'); 
    else setTimeOfDay('night'); 

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700, 
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50, 
        friction: 6,
        useNativeDriver: true,
      })
    ]).start();
  }, [fadeAnim, scaleAnim]);

 const getTimeBasedColors = (): TimeColorsReturn => { 
    switch (timeOfDay) {
      case 'morning':
        return {
          primary: [Colors.prayer, Colors.spiritualBlue, Colors.starlight],
          secondary: [Colors.secondaryLight, Colors.secondary, Colors.white]
        };
      case 'evening':
        return {
          primary: [Colors.mysticPurple, Colors.accent, Colors.secondary],
          secondary: [Colors.moonlight, Colors.grayLight, Colors.backgroundDark]
        };
      case 'night':
        return {
          primary: [Colors.backgroundDark, Colors.primary, Colors.mysticPurple], 
          secondary: [Colors.moonlight, Colors.spiritualBlue, Colors.secondaryLight]
        };
      default: 
         return {
          primary: [Colors.prayer, Colors.spiritualBlue, Colors.starlight],
          secondary: [Colors.secondaryLight, Colors.secondary, Colors.white]
        };
    }
  };

  const timeColors = getTimeBasedColors();

  const getIcon = (iconName: string, isActive = false) => {
    const iconColor = isActive ? Colors.primaryDark : Colors.secondaryLight;
    const iconSize = isActive ? RFValue(32) : RFValue(30);
    
    const iconComponents: { [key: string]: React.FC<any> } = {
      'sun': Sun, 'sunset': Sunset, 'moon': Moon, 'volume-2': Volume2, 'sunrise': Sunrise,
      'shirt': Shirt, 'book-open': BookOpen, 'heart': Heart,
      'shield-check': ShieldCheck, 'send': Send, 'refresh-cw': RefreshCw,
      'trending-up': TrendingUp, 'zap': Zap, 'sparkles': Sparkles, 'default': Sparkles,
    };
    const IconComponent = iconComponents[iconName] || Sparkles;
    return <IconComponent size={iconSize} color={iconColor} strokeWidth={isActive ? 2 : 1.8} />;
  };

  const handleCategoryPress = (categoryId: string, categoryName: string) => {
    navigation.navigate('AdhkarList', { categoryId, categoryName });
  };

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 70], 
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, 70],
    outputRange: [0, -25], 
    extrapolate: 'clamp',
  });

  const renderGridItems = (items: AdhkarCategory[], baseIndex: number = 0) => {
    const gridItems = items.map((item, index) => (
      <CategoryCard
        key={item.id}
        item={item}
        index={index + baseIndex}
        onPress={handleCategoryPress}
        getIcon={getIcon}
        isFavorite={favoriteCategoryIds.has(item.id)}
        onToggleFavorite={handleToggleFavorite}
      />
    ));
    
    // If there's an odd number of items, add a spacer to prevent the last item from stretching to the left
    if (items.length % 2 !== 0) {
      gridItems.push(<View key="spacer" style={{ width: CARD_WIDTH }} />);
    }
    
    return gridItems;
  };

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === 'android' ? insets.top : 0 }]}>
      <StatusBar style={Platform.OS === 'ios' ? "light" : "dark"} backgroundColor={Colors.primary} />
      
      <LinearGradient
        colors={timeColors.primary}
        style={styles.backgroundGradient}
      >
         <IslamicPattern style={styles.pattern} variant="geometric" color="rgba(255,255,255,0.05)" animated />
      </LinearGradient>
      
      <Animated.View 
        style={[
          styles.header, {paddingTop: Platform.OS === 'ios' ? insets.top + RFValue(10) : RFValue(20)}, 
          {
            opacity: headerOpacity,
            transform: [{ translateY: headerTranslateY }],
          },
        ]}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }} >
          <View style={styles.titleContainer}>
            <Text style={styles.title}>الأذكــــار</Text>
            <View style={styles.titleDecoration}>
              <Star size={RFValue(14)} color={Colors.white} opacity={0.9}/>
              <Text style={styles.subtitle}>حصن المسلم اليومي</Text>
              <Star size={RFValue(14)} color={Colors.white} opacity={0.9}/>
            </View>
          </View>
          <View style={styles.greetingContainer}>
            <Text style={styles.greeting}>
              {timeOfDay === 'morning' ? 'أذكار الصباح والمساء ودعوات مباركة' : 
               timeOfDay === 'evening' ? 'أذكار المساء وأدعية متنوعة ونافعة' : 'أذكار النوم والرقية الشرعية وسكينة الليل'}
            </Text>
          </View>
          <View style={styles.headerDecoration}>
            <Svg width={RFValue(120)} height={RFValue(30)}>
              <Path d="M10,15 L50,15 M70,15 L110,15" stroke={Colors.white} strokeWidth="1.8" strokeLinecap="round" strokeOpacity="0.8"/>
              <Circle cx={60} cy={15} r="5" fill="none" stroke={Colors.white} strokeWidth="1.8" strokeOpacity="0.6"/>
              <Circle cx={60} cy={15} r="2.5" fill={Colors.white} fillOpacity="0.8" />
            </Svg>
          </View>
        </Animated.View>
      </Animated.View>
      
      <View style={styles.listContainer}>
        <View style={styles.searchBarContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="ابحث في فئات الأذكار..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={Colors.textLight}
            />
            <View style={styles.searchIconContainer}>
                <SearchIcon color={Colors.primary} size={RFValue(20)} />
            </View>
        </View>

        <AnyAnimatedScrollView
            onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                { useNativeDriver: true } 
            )}
            scrollEventThrottle={16}
            contentContainerStyle={[styles.listContent, {paddingBottom: insets.bottom + RFValue(20)}]}
        >
            {searchQuery.length > 0 ? (
                <View style={styles.gridContainer}>
                    {filteredCategories.length > 0 ? (
                        renderGridItems(filteredCategories)
                    ) : (
                        <Text style={styles.noResultsText}>لا توجد نتائج مطابقة لبحثك.</Text>
                    )}
                </View>
            ) : (
                <>
                    {favoriteCategories.length > 0 && (
                        <View>
                            <Text style={styles.sectionTitle}>المفضلة</Text>
                            <View style={styles.gridContainer}>
                                {renderGridItems(favoriteCategories)}
                            </View>
                        </View>
                    )}
                    <Text style={styles.sectionTitle}>جميع الفئات</Text>
                    <View style={styles.gridContainer}>
                        {renderGridItems(regularCategories, favoriteCategories.length)}
                    </View>
                </>
            )}
        </AnyAnimatedScrollView>
      </View>
      
      <Animated.View
        style={[
          styles.mosqueSilhouetteContainer,
          {
            transform: [
              {
                translateY: scrollY.interpolate({
                  inputRange: [0, 200],
                  outputRange: [0, 50], 
                  extrapolate: 'clamp',
                }),
              },
            ],
            opacity: scrollY.interpolate({ 
              inputRange: [0, 180],
              outputRange: [0.4, 0],
              extrapolate: 'clamp',
            })
          },
        ]}
      >
        <ImageBackground
          source={require('../assets/images/mosque_silhouette.png')}
          style={styles.mosqueSilhouette}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundDark, 
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.55,
  },
  pattern: { 
    height: '100%', 
    opacity: 0.1,  
  },
  header: {
    paddingHorizontal: RFValue(20),
    paddingBottom: RFValue(18), 
    backgroundColor: 'transparent', 
    alignItems: 'center',
    zIndex: 10, 
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: RFValue(8), 
  },
  titleDecoration: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: RFValue(8),
  },
  title: {
    fontSize: RFValue(Platform.OS === 'ios' ? 36 : 32), 
    fontWeight: 'bold',
    color: Colors.white,
    fontFamily: Platform.OS === 'web' ? 'Amiri Quran, Amiri, serif' : (Platform.OS === 'ios' ? 'Amiri-Bold' : 'sans-serif-condensed'), 
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 2.5 },
    textShadowRadius: 5,
  },
  subtitle: {
    fontSize: RFValue(Platform.OS === 'ios' ? 16 : 14.5),
    color: Colors.moonlight, 
    fontWeight: '500',
    marginHorizontal: RFValue(8),
    fontFamily: Platform.OS === 'web' ? 'Amiri, serif' : (Platform.OS === 'ios' ? 'Amiri' : 'sans-serif'), 
  },
  greetingContainer: {
    backgroundColor: `rgba(${parseInt(Colors.secondary.slice(1,3),16)}, ${parseInt(Colors.secondary.slice(3,5),16)}, ${parseInt(Colors.secondary.slice(5,7),16)}, 0.2)`, 
    paddingHorizontal: RFValue(20),
    paddingVertical: RFValue(8),
    borderRadius: RFValue(20),
    marginBottom: RFValue(18),
    borderWidth: 1,
    borderColor: `rgba(${parseInt(Colors.secondary.slice(1,3),16)}, ${parseInt(Colors.secondary.slice(3,5),16)}, ${parseInt(Colors.secondary.slice(5,7),16)}, 0.3)`,
  },
  greeting: {
    fontSize: RFValue(Platform.OS === 'ios' ? 13.5 : 12.5),
    color: Colors.white,
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: Platform.OS === 'web' ? 'Amiri, serif' : (Platform.OS === 'ios' ? 'Amiri' : 'sans-serif-medium'),
  },
  headerDecoration: {
    alignItems: 'center',
    marginTop: RFValue(8), 
  },
  listContainer: {
    flex: 1,
    backgroundColor: Colors.background, 
    borderTopLeftRadius: RFValue(30), 
    borderTopRightRadius: RFValue(30),
    marginTop: RFValue(-35), 
    zIndex: 5, 
  },
  searchBarContainer: {
    padding: RFValue(16),
    paddingBottom: RFValue(10),
  },
  searchInput: {
    height: RFValue(48),
    backgroundColor: Colors.white,
    borderRadius: RFValue(24),
    paddingHorizontal: RFValue(20),
    paddingLeft: RFValue(50),
    fontSize: RFValue(16),
    textAlign: 'right',
    color: Colors.primary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    borderWidth: 1,
    borderColor: Colors.moonlight,
  },
  searchIconContainer: {
    position: 'absolute',
    left: RFValue(32),
    top: RFValue(29),
  },
  listContent: {
    padding: CARD_MARGIN, 
    paddingTop: RFValue(10),
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  noResultsText: {
    textAlign: 'center',
    color: Colors.textLight,
    fontSize: RFValue(16),
    marginTop: RFValue(20),
    width: '100%',
  },
  sectionTitle: {
    fontSize: RFValue(20),
    fontWeight: 'bold',
    color: Colors.primary,
    textAlign: 'right',
    marginRight: 0,
    marginBottom: RFValue(15),
    marginTop: RFValue(10),
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  },
  categoryCard: {
    width: CARD_WIDTH,
    height: CARD_WIDTH * 1.15,
    marginBottom: CARD_MARGIN * 1.5,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.15, 
    shadowRadius: 8,
    elevation: 6, 
  },
  cardTouchable: {
    flex: 1,
    borderRadius: RFValue(15),
    overflow: 'hidden',
  },
  cardGradient: {
    flex: 1,
    padding: RFValue(12),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1, 
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: RFValue(15),
  },
  spiritualGlow: {
    position: 'absolute',
    width: '110%', 
    height: '110%',
    top: '-5%',
    left: '-5%',
    backgroundColor: Colors.starlight, 
    borderRadius: CARD_WIDTH * 0.6, 
    zIndex: -1, 
  },
  patternOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.08,
    borderRadius: RFValue(15),
    overflow: 'hidden',
  },
  cardPattern: { 
    width: '100%',
    height: '100%',
  },
  favoriteButton: {
    position: 'absolute',
    top: RFValue(8),
    right: RFValue(8),
    zIndex: 1,
    padding: RFValue(5),
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: RFValue(15),
  },
  iconContainer: {
    width: RFValue(58),
    height: RFValue(58),
    borderRadius: RFValue(12),
    marginBottom: RFValue(12),
    backgroundColor: Colors.white,
    alignItems:'center',
    justifyContent:'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 4,
    borderWidth: 1.5,
    borderColor: Colors.secondaryLight,
  },
  iconContainerPressed: {
    transform: [{ scale: 1.05 }], 
    borderColor: Colors.secondary,
  },
  iconAura: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.secondary,
    borderRadius: RFValue(10),
    transform: [{scale: 1.1}],
    opacity: 0.15,
  },
  categoryTitle: {
    fontSize: RFValue(Platform.OS === 'ios' ? 18 : 17),
    fontWeight: 'bold',
    color: Colors.white, 
    textAlign: 'center',
    fontFamily: Platform.OS === 'web' ? 'Amiri Quran, Amiri, serif' : (Platform.OS === 'ios' ? 'Amiri-Bold' : 'Amiri-Regular'), 
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1.5 },
    textShadowRadius: 3,
    lineHeight: RFValue(Platform.OS === 'ios' ? 24 : 22),
  },
  categoryTitlePressed: {
    color: Colors.primaryDark,
  },
  mosqueSilhouetteContainer: {
    position: 'absolute',
    bottom: RFValue(-25), 
    left: 0,
    right: 0,
    height: RFValue(160), 
    zIndex: 1, 
  },
  mosqueSilhouette: {
    flex: 1,
  },
});
