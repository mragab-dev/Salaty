
import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View, Platform } from 'react-native';
import { RFValue } from 'react-native-responsive-fontsize';
import Colors from '../constants/colors';
import { ListBulletIcon, BookmarkOutlineIcon, DownloadIcon, CloseIcon, IconProps, PencilIcon } from './Icons'; // Removed TextStyleIcon

export type QuranSettingsAction = 'Index' | 'Bookmarks' | 'Downloads' | 'MemorizationTest'; // Removed 'FontSize'

interface ActionItemProps {
  icon: React.ReactElement<IconProps>; 
  text: string;
  onPress: () => void;
}

const ActionItem: React.FC<ActionItemProps> = ({ icon, text, onPress }) => (
  <TouchableOpacity style={styles.actionItem} onPress={onPress}>
    {React.cloneElement(icon, { size: RFValue(20), color: Colors.primary })}
    <Text style={styles.actionText}>{text}</Text>
  </TouchableOpacity>
);

interface SettingsActionSheetProps {
  visible: boolean;
  onClose: () => void;
  onNavigate: (screen: QuranSettingsAction) => void;
}

const SettingsActionSheet: React.FC<SettingsActionSheetProps> = ({ visible, onClose, onNavigate }) => {
  const handleActionPress = (screen: QuranSettingsAction) => {
    onNavigate(screen);
    onClose(); 
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPressOut={onClose}>
        <TouchableOpacity style={styles.container} activeOpacity={1} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>خيارات المصحف</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButtonIcon}>
              <CloseIcon color={Colors.primary} size={RFValue(22)} />
            </TouchableOpacity>
          </View>
          <ActionItem icon={<ListBulletIcon />} text="الفهرس" onPress={() => handleActionPress('Index')} />
          <ActionItem icon={<BookmarkOutlineIcon />} text="العلامات المرجعية" onPress={() => handleActionPress('Bookmarks')} />
          <ActionItem icon={<DownloadIcon />} text="تحميل الصوتيات" onPress={() => handleActionPress('Downloads')} />
          <ActionItem icon={<PencilIcon />} text="بدء اختبار حفظ" onPress={() => handleActionPress('MemorizationTest')} />
          
          <TouchableOpacity style={styles.cancelButtonInternal} onPress={onClose}>
            <Text style={styles.cancelText}>إلغاء</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center', 
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
    marginBottom: 8,
    position: 'relative', 
  },
  headerTitle: {
    fontSize: RFValue(17), 
    fontFamily: Platform.OS === 'web' ? 'Amiri, serif' : (Platform.OS === 'ios' ? 'Amiri-Bold' : 'sans-serif-medium'),
    color: Colors.primary,
    fontWeight: 'bold',
  },
  closeButtonIcon: {
    position: 'absolute',
    right: 0, 
    top: Platform.OS === 'ios' ? -2 : 0, 
    padding: 5,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: RFValue(12), 
  },
  actionText: {
    fontSize: RFValue(15), 
    fontFamily: Platform.OS === 'web' ? 'Amiri, serif' : (Platform.OS === 'ios' ? 'Amiri' : 'sans-serif'),
    color: Colors.text,
    marginLeft: 15,
  },
  cancelButtonInternal: {
    marginTop: 16,
    borderRadius: 10,
    backgroundColor: Colors.grayLight, 
    padding: RFValue(12),
    alignItems: 'center',
  },
  cancelText: {
    fontSize: RFValue(15),
    fontFamily: Platform.OS === 'web' ? 'Amiri, serif' : (Platform.OS === 'ios' ? 'Amiri-Bold' : 'sans-serif-medium'),
    color: Colors.primary,
    fontWeight: 'bold',
  },
});

export default SettingsActionSheet;
