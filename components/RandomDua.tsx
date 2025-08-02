import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { getRandomDua, Dua } from '../constants/duas';
import Colors from '../constants/colors';
import { RefreshCwIcon } from './Icons';
import { LinearGradient } from 'expo-linear-gradient';
import { RFValue } from 'react-native-responsive-fontsize';

type RandomDuaProps = {
  autoRefresh?: boolean;
  refreshInterval?: number;
};

const RandomDua = ({ autoRefresh = true, refreshInterval = 30000 }: RandomDuaProps) => {
  const [dua, setDua] = useState<Dua | null>(null);
  const [expanded, setExpanded] = useState(false);

  const fetchNewDua = () => {
    setDua(getRandomDua());
    setExpanded(false);
  }

  useEffect(() => {
    // Set initial dua
    fetchNewDua();
    
    // Set up interval for auto-refresh if enabled
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchNewDua();
      }, refreshInterval);
      
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  const handleRefresh = () => {
    fetchNewDua();
  };

  const toggleExpand = () => {
    setExpanded(!expanded);
  };

  if (!dua) return null;

  return (
    <LinearGradient
      colors={['rgba(15, 26, 42, 0.7)', 'rgba(15, 26, 42, 0.5)']}
      style={styles.container}
    >
      <TouchableOpacity 
        style={styles.contentContainer} 
        onPress={toggleExpand}
        activeOpacity={0.9}
      >
        <View style={styles.header}>
          <Text style={styles.title}>دعاء اللحظة</Text>
          <TouchableOpacity 
            style={styles.refreshButton} 
            onPress={(e) => {
                e.stopPropagation(); // Prevent toggling expand when refreshing
                handleRefresh();
            }}
          >
            <RefreshCwIcon size={RFValue(16)} color={Colors.secondary} />
          </TouchableOpacity>
        </View>
        
        <Text style={styles.arabic}>{dua.arabic}</Text>
        
        {expanded && (
          <View style={styles.expandedContent}>
            <Text style={styles.translation}>{dua.translation}</Text>
            <Text style={styles.reference}>{dua.reference}</Text>
          </View>
        )}
        
        {!expanded && (
          <Text style={styles.tapHint}>اضغط هنا لعرض الترجمة</Text>
        )}
      </TouchableOpacity>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: RFValue(16),
    marginTop: RFValue(8),
    borderRadius: RFValue(12),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  contentContainer: {
    padding: RFValue(16),
  },
  header: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: RFValue(12),
  },
  title: {
    fontSize: RFValue(16),
    fontWeight: '600',
    color: Colors.white,
  },
  refreshButton: {
    padding: RFValue(4),
  },
  arabic: {
    fontSize: RFValue(18),
    lineHeight: RFValue(30),
    textAlign: 'right',
    color: Colors.white,
    fontWeight: '500',
    fontFamily: 'Amiri, serif',
    marginBottom: RFValue(8),
  },
  expandedContent: {
    marginTop: RFValue(12),
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    paddingTop: RFValue(12),
  },
  translation: {
    fontSize: RFValue(14),
    color: Colors.moonlight,
    marginBottom: RFValue(8),
    lineHeight: RFValue(20),
    textAlign: 'left',
    fontStyle: 'italic',
  },
  reference: {
    fontSize: RFValue(12),
    color: Colors.secondary,
    textAlign: 'left',
  },
  tapHint: {
    fontSize: RFValue(12),
    color: Colors.secondary,
    textAlign: 'center',
    marginTop: RFValue(8),
    fontStyle: 'italic',
  },
});

export default RandomDua;