import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Switch } from 'react-native';
import { COLORS, DIMENSIONS } from '../config/constants';
import { useAuth } from '../contexts/AuthContext';
import StorageDebugger from '../components/StorageDebugger';

interface SettingsScreenProps {
  navigation: any;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  const { logout } = useAuth();
  const [showDebugger, setShowDebugger] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Settings</Text>
        
        {/* Notification Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Enable Notifications</Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
              thumbColor={notificationsEnabled ? COLORS.white : COLORS.textSecondary}
            />
          </View>
        </View>

        {/* Account Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <TouchableOpacity style={styles.settingButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Developer Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Developer Options</Text>
          <TouchableOpacity 
            style={styles.settingButton} 
            onPress={() => setShowDebugger(!showDebugger)}
          >
            <Text style={styles.settingButtonText}>
              {showDebugger ? 'Hide' : 'Show'} Storage Debugger
            </Text>
          </TouchableOpacity>
        </View>

        {/* Storage Debugger */}
        <StorageDebugger visible={showDebugger} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: DIMENSIONS.spacing.lg,
    paddingTop: DIMENSIONS.spacing.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: DIMENSIONS.spacing.lg,
    textAlign: 'center',
  },
  section: {
    marginBottom: DIMENSIONS.spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: DIMENSIONS.spacing.md,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: DIMENSIONS.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  settingLabel: {
    fontSize: 16,
    color: COLORS.text,
  },
  settingButton: {
    paddingVertical: DIMENSIONS.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  settingButtonText: {
    fontSize: 16,
    color: COLORS.text,
  },
  logoutText: {
    fontSize: 16,
    color: COLORS.error,
    fontWeight: '600',
  },
});

export default SettingsScreen;

