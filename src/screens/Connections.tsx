import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BasicTopBar from '../components/BasicTopBar';
import { COLORS, DIMENSIONS } from '../config/constants';
import FontWeight from '../hooks/useInterFonts';
import { useAuth } from '../contexts/AuthContext';

const connections = [
  {
    id: '1',
    name: 'Mike',
    location: 'Downtown Gym',
    initial: 'M',
  },
  {
    id: '2',
    name: 'Emma',
    location: 'Central Park',
    initial: 'E',
  },
  {
    id: '3',
    name: 'Aiden',
    location: 'Times Square',
    initial: 'A',
  },
  {
    id: '4',
    name: 'Clara',
    location: 'Statue of Liberty',
    initial: 'C',
  },
];

const Connections: React.FC = ({ navigation, route }: any) => {
  const { user } = useAuth();
  const userId = route?.params?.userId || user?.id;
  const isOwnProfile = !route?.params?.userId || route?.params?.userId === user?.id;
  const handleAddNew = () => {
    // TODO: Implement add new connection logic
    alert('Add new connection feature coming soon!');
  };

  const handleMessage = (id: string) => {
    const connection = connections.find((c) => c.id === id);
    if (connection) {
      alert(`Opening chat with ${connection.name}...`);
    }
  };

  return (
    <SafeAreaView edges={[]} style={styles.container}>
      <BasicTopBar
        onBackPress={() => navigation.goBack()}
        title={isOwnProfile ? "Connections" : "User Connections"}
        subtitle={isOwnProfile ? "View / Add Connections" : "View user connections"}
        containerStyle={{ paddingTop: DIMENSIONS.spacing.xxl, paddingBottom: DIMENSIONS.spacing.lg }}
      />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {isOwnProfile && (
          <TouchableOpacity style={styles.addButton} onPress={handleAddNew}>
            <Text style={styles.addButtonText}>Add New</Text>
          </TouchableOpacity>
        )}
        <View style={styles.connectionList}>
          {connections.map((connection) => (
            <View key={connection.id} style={styles.card}>
              <View style={styles.cardRow}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{connection.initial}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{connection.name}</Text>
                  <Text style={styles.location}>{connection.location}</Text>
                </View>
                <TouchableOpacity style={styles.messageButton} onPress={() => handleMessage(connection.id)}>
                  <Text style={styles.messageButtonText}>Message</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingBottom: 100,
    paddingHorizontal: DIMENSIONS.spacing.lg,
  },
  addButton: {
    width: '100%',
    backgroundColor: COLORS.primary,
    paddingVertical: 18,
    borderRadius: 4,
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  addButtonText: {
    color: COLORS.white,
    fontFamily: FontWeight.SemiBold,
    fontSize: 16,
    letterSpacing: 0.2,
  },
  connectionList: {
    gap: 16,
    marginTop: 10,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS._D2E7FF,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarText: {
    color: COLORS._0B80FF,
    fontFamily: FontWeight.Bold,
    fontSize: 20,
  },
  name: {
    fontSize: 16,
    fontFamily: FontWeight.SemiBold,
    color: COLORS.text,
    marginBottom: 2,
  },
  location: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontFamily: FontWeight.Regular,
  },
  messageButton: {
    marginLeft: 16,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#00000033',
    backgroundColor: COLORS.white,
    alignSelf: 'flex-start',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  messageButtonText: {
    color: COLORS.app_black,
    fontFamily: FontWeight.Medium,
    fontSize: 14,
  },
});

export default Connections;
