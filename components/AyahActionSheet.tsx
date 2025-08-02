
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import RNModal from 'react-native-modal'; 
import { Ayah } from '../types';
import { BookmarkIcon, BookmarkOutlineIcon, MusicalNoteIcon, BookOpenIcon, ClipboardIcon, ShareIcon, CloseIcon, PlayIcon, PauseIcon, RepeatIcon, PencilIcon } from './Icons'; 
import Colors from '../constants/colors';
import { RFValue } from 'react-native-responsive-fontsize';

interface AyahActionSheetProps {
  isVisible: boolean;
  onClose: () => void;
  ayah: Ayah;
  surahName: string;
  isBookmarked: boolean;
  onBookmark: (ayahId: number) => void;
  onPlaySurah: () => void; 
  onStopSurahPlayback: () => void;
  isSurahPlaying: boolean;
  onTafseer: () => void;
  onCopy: () => void;
  onShare: () => void;
  // Repetition and Test props are now conditional or removed
  onSetRepetitionStart?: (ayah: Ayah) => void;
  onSetRepetitionEnd?: (ayah: Ayah) => void;
}

const AyahActionSheet: React.FC<AyahActionSheetProps> = ({
  isVisible,
  onClose,
  ayah,
  surahName,
  isBookmarked,
  onBookmark,
  onPlaySurah,
  onStopSurahPlayback,
  isSurahPlaying,
  onTafseer,
  onCopy,
  onShare,
}) => {
  const bookmarkActionTitle = isBookmarked ? 'إزالة العلامة' : 'حفظ العلامة';
  const bookmarkActionIcon = isBookmarked ? <BookmarkIcon color={Colors.secondary} /> : <BookmarkOutlineIcon color={Colors.primary} />;

  const handleTafseerPress = () => {
    onClose();
    onTafseer();
  };

  const actions = [
    { title: bookmarkActionTitle, icon: bookmarkActionIcon, onPress: () => { onBookmark(ayah.id); onClose(); } },
    { 
      title: isSurahPlaying ? 'إيقاف تشغيل السورة' : 'بدء التلاوة من هنا', 
      icon: isSurahPlaying ? <PauseIcon color={Colors.primary} /> : <PlayIcon color={Colors.primary} />, 
      onPress: () => { 
        isSurahPlaying ? onStopSurahPlayback() : onPlaySurah(); 
        onClose(); 
      } 
    },
    { title: 'عرض التفسير', icon: <BookOpenIcon color={Colors.primary} />, onPress: handleTafseerPress },
    { title: 'نسخ الآية', icon: <ClipboardIcon color={Colors.primary} />, onPress: onCopy },
    { title: 'مشاركة الآية', icon: <ShareIcon color={Colors.primary} />, onPress: onShare },
  ];

  return (
    <RNModal
      isVisible={isVisible}
      onSwipeComplete={onClose}
      swipeDirection={['down']}
      onBackdropPress={onClose}
      style={styles.modal}
      backdropOpacity={0.3}
      animationIn="slideInUp"
      animationOut="slideOutDown"
      useNativeDriverForBackdrop
    >
      <View style={styles.container}>
        <View style={styles.handleBar} />
        <View style={styles.header}>
          <Text style={styles.headerText}>
            سورة {surahName} - آية {ayah.verse_number}
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButtonIcon}>
            <CloseIcon color={Colors.primary} size={RFValue(26)} />
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.actionsContainer}>
          {actions.map((action, index) => (
            <TouchableOpacity key={index} style={styles.actionButton} onPress={action.onPress}>
              {React.cloneElement(action.icon, { size: RFValue(22) })}
              <Text style={styles.actionText}>{action.title}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  modal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  container: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: RFValue(20),
    borderTopRightRadius: RFValue(20),
    paddingHorizontal: RFValue(16),
    paddingTop: RFValue(8), 
    paddingBottom: Platform.OS === 'ios' ? RFValue(30) : RFValue(20), 
    maxHeight: '80%', 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 10,
  },
  handleBar: {
    width: RFValue(40),
    height: RFValue(5),
    backgroundColor: Colors.textLight,
    borderRadius: RFValue(2.5),
    alignSelf: 'center',
    marginBottom: RFValue(10),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: RFValue(16),
    paddingBottom: RFValue(10),
    borderBottomWidth: 1,
    borderBottomColor: Colors.secondary,
  },
  headerText: {
    fontSize: RFValue(17),
    color: Colors.primary,
    fontFamily: Platform.OS === 'web' ? 'Amiri, serif' : (Platform.OS === 'ios' ? 'Amiri' : 'sans-serif-medium'),
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
    marginRight: RFValue(30), 
  },
  closeButtonIcon: {
    padding: RFValue(5),
  },
  actionsContainer: {},
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: RFValue(15), 
    paddingHorizontal: RFValue(10),
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider, 
  },
  actionText: {
    marginLeft: RFValue(12), 
    fontSize: RFValue(16),
    color: Colors.primary,
    fontFamily: Platform.OS === 'web' ? 'Amiri, serif' : (Platform.OS === 'ios' ? 'Amiri' : 'sans-serif'),
  },
});

export default AyahActionSheet;