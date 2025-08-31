import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Platform } from 'react-native';
import RNModal from 'react-native-modal';
import Colors from '../constants/colors';
import { RFValue } from 'react-native-responsive-fontsize';

const AnyFlatList = FlatList as any;

const ITEM_HEIGHT = RFValue(50);
const VISIBLE_ITEMS = 3;

interface TimePickerModalProps {
  isVisible: boolean;
  onClose: () => void;
  onTimeSelect: (time: string) => void;
  initialTime?: string; // "HH:MM"
}

const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

const TimePickerModal: React.FC<TimePickerModalProps> = ({ isVisible, onClose, onTimeSelect, initialTime }) => {
  const [selectedHour, setSelectedHour] = useState('07');
  const [selectedMinute, setSelectedMinute] = useState('00');
  
  const hourListRef = useRef<FlatList>(null);
  const minuteListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (isVisible && initialTime) {
      const [hour, minute] = initialTime.split(':');
      if (hour && minute) {
        setSelectedHour(hour);
        setSelectedMinute(minute);

        setTimeout(() => {
          try {
            hourListRef.current?.scrollToIndex({ index: parseInt(hour, 10), animated: false });
            minuteListRef.current?.scrollToIndex({ index: parseInt(minute, 10), animated: false });
          } catch (e) {
            console.warn("Could not scroll to initial time index.", e);
          }
        }, 100);
      }
    } else if (isVisible) {
      // Set to current time if no initial time is provided
      const now = new Date();
      const currentHour = now.getHours().toString().padStart(2, '0');
      const currentMinute = now.getMinutes().toString().padStart(2, '0');
      setSelectedHour(currentHour);
      setSelectedMinute(currentMinute);
      setTimeout(() => {
        try {
            hourListRef.current?.scrollToIndex({ index: now.getHours(), animated: false });
            minuteListRef.current?.scrollToIndex({ index: now.getMinutes(), animated: false });
        } catch(e) {
            console.warn("Could not scroll to current time index.", e);
        }
      }, 100);
    }
  }, [isVisible, initialTime]);
  
  const handleScrollEnd = (event: any, type: 'hour' | 'minute') => {
    const yOffset = event.nativeEvent.contentOffset.y;
    const index = Math.round(yOffset / ITEM_HEIGHT);
    if (type === 'hour') {
      if (index >= 0 && index < hours.length) setSelectedHour(hours[index]);
    } else {
      if (index >= 0 && index < minutes.length) setSelectedMinute(minutes[index]);
    }
  };

  const renderItem = ({ item }: { item: string }) => (
    <View style={styles.pickerItem}>
      <Text style={styles.pickerItemText}>{item}</Text>
    </View>
  );

  const handleConfirm = () => {
    onTimeSelect(`${selectedHour}:${selectedMinute}`);
    onClose();
  };

  return (
    <RNModal
      isVisible={isVisible}
      onBackdropPress={onClose}
      style={styles.modal}
      backdropOpacity={0.4}
      animationIn="fadeInUp"
      animationOut="fadeOutDown"
      useNativeDriverForBackdrop
    >
      <View style={styles.container}>
        <Text style={styles.title}>اختر التوقيت</Text>
        <View style={styles.pickerContainer}>
          <View style={styles.selectionIndicator} />
          <AnyFlatList
            ref={hourListRef}
            data={hours}
            renderItem={renderItem}
            keyExtractor={(item: string) => `h-${item}`}
            showsVerticalScrollIndicator={false}
            snapToInterval={ITEM_HEIGHT}
            decelerationRate="fast"
            contentContainerStyle={{ paddingVertical: ITEM_HEIGHT * ((VISIBLE_ITEMS - 1) / 2) }}
            onMomentumScrollEnd={(e: any) => handleScrollEnd(e, 'hour')}
            getItemLayout={(_: any, index: number) => ({ length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index })}
            initialScrollIndex={parseInt(selectedHour, 10)}
            onScrollToIndexFailed={(info: { index: number, highestMeasuredFrameIndex: number, averageItemLength: number }) => {
                const wait = new Promise(resolve => setTimeout(resolve, 50));
                wait.then(() => {
                    hourListRef.current?.scrollToOffset({
                        offset: info.index * ITEM_HEIGHT,
                        animated: false,
                    });
                });
            }}
          />
          <Text style={styles.separator}>:</Text>
          <AnyFlatList
            ref={minuteListRef}
            data={minutes}
            renderItem={renderItem}
            keyExtractor={(item: string) => `m-${item}`}
            showsVerticalScrollIndicator={false}
            snapToInterval={ITEM_HEIGHT}
            decelerationRate="fast"
            contentContainerStyle={{ paddingVertical: ITEM_HEIGHT * ((VISIBLE_ITEMS - 1) / 2) }}
            onMomentumScrollEnd={(e: any) => handleScrollEnd(e, 'minute')}
            getItemLayout={(_: any, index: number) => ({ length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index })}
            initialScrollIndex={parseInt(selectedMinute, 10)}
             onScrollToIndexFailed={(info: { index: number, highestMeasuredFrameIndex: number, averageItemLength: number }) => {
                const wait = new Promise(resolve => setTimeout(resolve, 50));
                wait.then(() => {
                    minuteListRef.current?.scrollToOffset({
                        offset: info.index * ITEM_HEIGHT,
                        animated: false,
                    });
                });
            }}
          />
        </View>
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={handleConfirm}>
            <Text style={styles.buttonText}>ضبط</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onClose}>
            <Text style={[styles.buttonText, styles.cancelButtonText]}>إلغاء</Text>
          </TouchableOpacity>
        </View>
      </View>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  modal: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: Colors.background,
    borderRadius: RFValue(15),
    padding: RFValue(20),
    width: '90%',
    alignItems: 'center',
  },
  title: {
    fontSize: RFValue(18),
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: RFValue(20),
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: ITEM_HEIGHT * VISIBLE_ITEMS,
    width: '80%',
  },
  selectionIndicator: {
    position: 'absolute',
    top: ITEM_HEIGHT,
    left: 0,
    right: 0,
    height: ITEM_HEIGHT,
    backgroundColor: `rgba(${parseInt(Colors.secondary.slice(1,3),16)}, ${parseInt(Colors.secondary.slice(3,5),16)}, ${parseInt(Colors.secondary.slice(5,7),16)}, 0.15)`,
    borderRadius: RFValue(10),
    borderWidth: 1,
    borderColor: Colors.secondary,
  },
  pickerItem: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerItemText: {
    fontSize: RFValue(24),
    color: Colors.text,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  },
  separator: {
    fontSize: RFValue(24),
    fontWeight: 'bold',
    color: Colors.primary,
    marginHorizontal: RFValue(10),
  },
  buttonContainer: {
    flexDirection: 'row-reverse',
    marginTop: RFValue(20),
    width: '100%',
    justifyContent: 'space-around',
  },
  button: {
    backgroundColor: Colors.primary,
    paddingVertical: RFValue(10),
    paddingHorizontal: RFValue(30),
    borderRadius: RFValue(8),
  },
  buttonText: {
    color: Colors.white,
    fontSize: RFValue(16),
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: Colors.moonlight,
  },
  cancelButtonText: {
    color: Colors.primary,
  },
});

export default TimePickerModal;