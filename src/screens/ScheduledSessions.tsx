import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BasicTopBar from '../components/BasicTopBar';
import { COLORS, DIMENSIONS } from '../config/constants';
import FontWeight from '../hooks/useInterFonts';

const sessions = [
  {
    id: '1',
    icon: '📅',
    title: 'Session with Alex',
    description: 'Sunday, Oct 14, 2025 at 9:00 AM\nDowntown Fitness Club',
    progress: 1,
    maxProgress: 1,
    status: 'upcoming',
    trainerName: 'Alex',
  },
  {
    id: '2',
    icon: '📅',
    title: 'Session with Jordan',
    description: 'Monday, Oct 15, 2025 at 10:30 AM\nCity Gym',
    progress: 0,
    maxProgress: 1,
    status: 'upcoming',
    trainerName: 'Jordan',
  },
];

const ScheduledSessions: React.FC = ({ navigation }: any) => {
  const handleBookNew = () => {
    // TODO: Implement book new session logic
    alert('Book new session feature coming soon!');
  };

  const handleReschedule = (id: string) => {
    const session = sessions.find((s) => s.id === id);
    if (session) {
      alert(`Rescheduling session with ${session.trainerName}...`);
    }
  };

  const handleCancel = (id: string) => {
    const session = sessions.find((s) => s.id === id);
    if (session) {
      alert(`Cancelling session with ${session.trainerName}...`);
    }
  };

  return (
    <SafeAreaView edges={[]} style={styles.container}>
      <BasicTopBar
        onBackPress={() => navigation.goBack()}
        title="Scheduled Sessions"
        subtitle="Your upcoming sessions with trainers"
        containerStyle={{ paddingTop: DIMENSIONS.spacing.xxl, paddingBottom: DIMENSIONS.spacing.lg }}
      />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity style={styles.bookButton} onPress={handleBookNew}>
          <Text style={styles.bookButtonText}>Book New Session</Text>
        </TouchableOpacity>
        <View style={styles.sessionList}>
          {sessions.map((session) => (
            <View key={session.id} style={styles.sessionCard}>
              {/* Header with date/time and instructor (no icon) */}
              <View style={styles.sessionHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sessionDate}>{session.description.split(' at ')[0]}</Text>
                  <Text style={styles.sessionTime}>{session.description.split(' at ')[1]?.split('\n')[0]}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.sessionWith}>with</Text>
                  <Text style={styles.sessionInstructor}>{session.trainerName}</Text>
                </View>
              </View>
              {/* Location row */}
              <View style={styles.sessionLocationRow}>
                <Text style={styles.sessionLocation}>{session.description.split('\n')[1]}</Text>
              </View>
              {/* Actions row */}
              <View style={styles.sessionActions}>
                <TouchableOpacity style={styles.actionButton} onPress={() => handleReschedule(session.id)}>
                  <Text style={styles.actionButtonText}>Reschedule</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionButton, styles.cancelButton]} onPress={() => handleCancel(session.id)}>
                  <Text style={[styles.actionButtonText, styles.cancelButtonText]}>Cancel</Text>
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
  bookButton: {
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
  bookButtonText: {
    color: COLORS.white,
    fontFamily: FontWeight.SemiBold,
    fontSize: 16,
    letterSpacing: 0.2,
  },
  sessionList: {
    gap: 20,
  },
  sessionCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#6B6B6B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sessionDate: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  sessionTime: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 2,
  },
  sessionWith: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  sessionInstructor: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.text,
  },
  sessionLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  sessionLocationIcon: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  sessionLocation: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  sessionActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  actionButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#00000033',
    backgroundColor: COLORS.white,
  },
  actionButtonText: {
    color: COLORS.app_black,
    fontFamily: FontWeight.Medium,
    fontSize: 13,
  },
  cancelButton: {
    backgroundColor: COLORS._FF1616,
    borderColor: COLORS._FF1616,
  },
  cancelButtonText: {
    color: COLORS.white,
  },
});

export default ScheduledSessions;
