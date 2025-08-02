import React from 'react';
import { Modal as RNModal, View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import Colors from '../constants/colors'; // Import the new Colors
import { RFValue } from 'react-native-responsive-fontsize';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  return (
    <RNModal
      transparent={true}
      visible={isOpen}
      onRequestClose={onClose}
      animationType="fade"
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose} // Close on overlay click
      >
        <TouchableOpacity 
            style={styles.modalContainer} 
            activeOpacity={1} 
            onPress={(e) => e.stopPropagation()} // Prevent close when clicking inside modal content
        >
          <View style={styles.modalContent}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>&times;</Text>
            </TouchableOpacity>
            {title && <Text style={styles.title}>{title}</Text>}
            <View style={styles.childrenContainer}>
              {children}
            </View>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Dimmed background
    justifyContent: 'center',
    alignItems: 'center',
    padding: RFValue(20),
  },
  modalContainer: {
    width: '100%',
    maxWidth: 500, // Max width for larger screens
    maxHeight: '80%', // Max height
    backgroundColor: Colors.background, // Updated: Was '#F8F4E3' (islamic-cream)
    borderRadius: RFValue(10),
    padding: RFValue(20),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    display: 'flex',
    flexDirection: 'column',
  },
  modalContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  closeButton: {
    position: 'absolute',
    top: RFValue(-10), 
    right: RFValue(-5), 
    padding: RFValue(5),
    zIndex: 1,
  },
  closeButtonText: {
    fontSize: RFValue(28),
    color: Colors.primary, // Updated: Was '#104f37' (islamic-green)
    fontWeight: 'bold',
  },
  title: {
    fontSize: RFValue(20),
    fontWeight: 'bold',
    color: Colors.primary, // Updated: Was '#104f37' (islamic-green)
    marginBottom: RFValue(15),
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  },
  childrenContainer: {
    flex: 1,
    minHeight: 0, // Fix for FlatList inside a flex container
  },
});

export default Modal;