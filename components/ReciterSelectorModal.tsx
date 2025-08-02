
// This file is no longer needed as ReciterListScreen.tsx replaces its functionality.
// You can safely delete this file from your project.
// Keeping it empty or with a comment ensures it's part of the "changes" XML for removal.

/*
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import RNModal from 'react-native-modal';
import { Reciter } from '../types';
import Colors from '../constants/colors';
import { CheckmarkIcon, CloseIcon } from './Icons'; 

interface ReciterSelectorModalProps {
  isVisible: boolean;
  onClose: () => void;
  reciters: Reciter[];
  currentReciter: Reciter | null;
  onSelectReciter: (reciter: Reciter) => void;
}

const ReciterSelectorModal: React.FC<ReciterSelectorModalProps> = ({
  isVisible,
  onClose,
  reciters,
  currentReciter,
  onSelectReciter,
}) => {
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
    >
      <View style={styles.container}>
        <View style={styles.handleBar} />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>اختر القارئ</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButtonIcon}>
            <CloseIcon color={Colors.primary} size={26} />
          </TouchableOpacity>
        </View>
        <ScrollView>
          {reciters.map((reciter) => (
            <TouchableOpacity
              key={reciter.id}
              style={[
                styles.reciterItem,
                currentReciter?.id === reciter.id && styles.selectedReciterItem,
              ]}
              onPress={() => {
                onSelectReciter(reciter);
                onClose(); 
              }}
            >
              <View style={styles.reciterInfo}>
                <Text style={styles.reciterNameAr}>{reciter.nameAr}</Text>
                <Text style={styles.reciterRewaya}>{reciter.rewaya.ar}</Text>
              </View>
              {currentReciter?.id === reciter.id && (
                <CheckmarkIcon color={Colors.primary} size={24} />
              )}
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
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
    maxHeight: '80%',
  },
  handleBar: {
    width: 40,
    height: 5,
    backgroundColor: Colors.textLight,
    borderRadius: 2.5,
    alignSelf: 'center',
    marginBottom: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.secondary,
  },
  headerTitle: {
    fontSize: 18,
    color: Colors.primary,
    fontFamily: Platform.OS === 'web' ? 'Amiri, serif' : (Platform.OS === 'ios' ? 'Amiri' : 'sans-serif-medium'),
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
    marginRight: 30, 
  },
  closeButtonIcon: {
    padding: 5,
  },
  reciterItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  selectedReciterItem: {
    backgroundColor: `rgba(${parseInt(Colors.secondary.slice(1,3),16)}, ${parseInt(Colors.secondary.slice(3,5),16)}, ${parseInt(Colors.secondary.slice(5,7),16)}, 0.15)`, 
  },
  reciterInfo: {
    flex: 1,
    alignItems: 'flex-end', 
  },
  reciterNameAr: {
    fontSize: 17,
    color: Colors.arabicText,
    fontFamily: Platform.OS === 'web' ? 'Amiri, serif' : (Platform.OS === 'ios' ? 'Amiri' : 'sans-serif-medium'),
  },
  reciterRewaya: {
    fontSize: 13,
    color: Colors.accent,
    fontFamily: Platform.OS === 'web' ? 'Amiri, serif' : (Platform.OS === 'ios' ? 'Amiri' : 'sans-serif'),
    marginTop: 2,
  },
});

export default ReciterSelectorModal;
*/
