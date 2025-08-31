import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RFValue } from 'react-native-responsive-fontsize';

import Colors from '../constants/colors';
import { CogIcon, ChevronRightIcon } from './Icons';
import { APP_NAME } from '../constants';
import LogoURL from '../assets/logo.png';
import { AppStackParamList } from '../App'; 

interface AppHeaderProps {
  title?: string;
  headerRight?: React.ReactNode;
}

const AppHeader: React.FC<AppHeaderProps> = ({ title, headerRight }) => {
  const navigation = useNavigation<NavigationProp<AppStackParamList>>();
  const insets = useSafeAreaInsets();
  const canGoBack = navigation.canGoBack();

  const defaultHeaderRightContent = (
    <TouchableOpacity style={styles.settingsButton} onPress={() => navigation.navigate('Settings')}>
      <CogIcon color={Colors.secondary} size={RFValue(26)} />
    </TouchableOpacity>
  );
  
  // If headerRight is explicitly provided, use it.
  // Otherwise, if we can go back, render a placeholder to balance the back button for centering.
  // If we can't go back, render the default settings icon.
  const rightContent = headerRight !== undefined ? headerRight : (canGoBack ? <View style={{ width: RFValue(40) }} /> : defaultHeaderRightContent);


  return (
    <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
      <View style={styles.headerContent}>
        <View style={styles.actionContainerLeft}>
            {canGoBack && (
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ChevronRightIcon color={Colors.secondary} size={RFValue(26)} />
                </TouchableOpacity>
            )}
        </View>
        <View style={styles.titleContainer}>
          {!title && <Image source={LogoURL} style={styles.headerLogo} />}
          <Text style={styles.headerTitleText}>{title || APP_NAME}</Text>
        </View>
        <View style={styles.actionContainerRight}>
          {rightContent}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: Colors.primary,
    paddingHorizontal: RFValue(15),
    paddingBottom: RFValue(10),
    borderBottomWidth: 1,
    borderBottomColor: `rgba(196, 160, 82, 0.3)`,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: RFValue(50),
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    // The fixed-width action containers on both sides will center this flex: 1 view
  },
  headerLogo: {
    width: RFValue(30),
    height: RFValue(30),
    borderRadius: RFValue(15),
    marginRight: RFValue(10),
  },
  headerTitleText: {
    color: Colors.secondary,
    fontSize: RFValue(20),
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  },
  actionContainerLeft: {
    width: RFValue(40),
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  actionContainerRight: {
    width: RFValue(40),
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  settingsButton: {
    padding: RFValue(5),
  },
  backButton: {
      padding: RFValue(5),
  },
});

export default AppHeader;
