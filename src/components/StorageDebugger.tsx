import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { storageService } from '../services/storage';
import { COLORS } from '../config/constants';

interface StorageDebuggerProps {
  visible?: boolean;
}

export const StorageDebugger: React.FC<StorageDebuggerProps> = ({ visible = false }) => {
  const [isClearing, setIsClearing] = useState(false);

  const clearAllStorage = async () => {
    Alert.alert(
      'Clear All Storage',
      'This will delete all stored data including authentication tokens, user profiles, and app settings. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            setIsClearing(true);
            try {
              await storageService.clearCorruptedData();
              Alert.alert('Success', 'All storage data has been cleared.');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear storage data.');
              console.error('Error clearing storage:', error);
            } finally {
              setIsClearing(false);
            }
          },
        },
      ]
    );
  };

  const validateStorage = async () => {
    setIsClearing(true);
    try {
      await storageService.validateStorageData();
      Alert.alert('Success', 'Storage validation completed.');
    } catch (error) {
      Alert.alert('Error', 'Storage validation failed.');
      console.error('Error validating storage:', error);
    } finally {
      setIsClearing(false);
    }
  };

  if (!visible) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Storage Debugger</Text>
      <TouchableOpacity
        style={[styles.button, styles.validateButton]}
        onPress={validateStorage}
        disabled={isClearing}
      >
        <Text style={styles.buttonText}>
          {isClearing ? 'Validating...' : 'Validate Storage'}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.button, styles.clearButton]}
        onPress={clearAllStorage}
        disabled={isClearing}
      >
        <Text style={styles.buttonText}>
          {isClearing ? 'Clearing...' : 'Clear All Storage'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    margin: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  button: {
    padding: 12,
    borderRadius: 6,
    marginVertical: 5,
    alignItems: 'center',
  },
  validateButton: {
    backgroundColor: '#007AFF',
  },
  clearButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
  },
});

export default StorageDebugger;

