import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { COLORS, DIMENSIONS } from '../config/constants';
import RatingStars from '../components/RatingStars';

interface ProfileScreenProps {
  navigation: any;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.subtitle}>Manage your account and settings</Text>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileSection}>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.displayName || 'Development User'}</Text>
            <Text style={styles.profileEmail}>{user?.email || 'dev@example.com'}</Text>
            <Text style={styles.profileLocation}>{user?.location || 'San Francisco, CA'}</Text>
          </View>
        </View>

        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Your Stats</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>156</Text>
              <Text style={styles.statLabel}>Total Workouts</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>7</Text>
              <Text style={styles.statLabel}>Current Streak</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>12</Text>
              <Text style={styles.statLabel}>Training Partners</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>8</Text>
              <Text style={styles.statLabel}>Achievements</Text>
            </View>
          </View>
        </View>

        <View style={styles.ratingSection}>
          <Text style={styles.sectionTitle}>Your Rating</Text>
          <View style={styles.ratingCard}>
            <View style={styles.ratingInfo}>
              <RatingStars rating={4.7} size="large" readonly={true} showRating={true} />
              <Text style={styles.ratingCount}>(23 reviews)</Text>
            </View>
            <View style={styles.ratingBreakdown}>
              <Text style={styles.ratingBreakdownTitle}>Rating Breakdown:</Text>
              <View style={styles.ratingRow}>
                <Text style={styles.ratingLabel}>5 stars</Text>
                <Text style={styles.ratingValue}>15</Text>
              </View>
              <View style={styles.ratingRow}>
                <Text style={styles.ratingLabel}>4 stars</Text>
                <Text style={styles.ratingValue}>6</Text>
              </View>
              <View style={styles.ratingRow}>
                <Text style={styles.ratingLabel}>3 stars</Text>
                <Text style={styles.ratingValue}>2</Text>
              </View>
              <View style={styles.ratingRow}>
                <Text style={styles.ratingLabel}>2 stars</Text>
                <Text style={styles.ratingValue}>0</Text>
              </View>
              <View style={styles.ratingRow}>
                <Text style={styles.ratingLabel}>1 star</Text>
                <Text style={styles.ratingValue}>0</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.shareRatingButton}>
              <Text style={styles.shareRatingButtonText}>⭐ Share My Rating</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <View style={styles.actionsSection}>
        <TouchableOpacity 
          style={styles.settingsButton} 
          onPress={() => navigation.navigate('Settings')}
        >
          <Text style={styles.settingsButtonText}>⚙️ Settings</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: DIMENSIONS.spacing.lg,
    paddingTop: DIMENSIONS.spacing.sm,
    paddingBottom: DIMENSIONS.spacing.sm,
    backgroundColor: COLORS.background,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: DIMENSIONS.spacing.xs,
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: DIMENSIONS.spacing.lg,
    paddingTop: DIMENSIONS.spacing.lg,
    paddingBottom: DIMENSIONS.spacing.xl,
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
  profileSection: {
    width: '100%',
    marginBottom: DIMENSIONS.spacing.xl,
  },
  profileInfo: {
    backgroundColor: COLORS.surface,
    borderRadius: DIMENSIONS.borderRadius,
    padding: DIMENSIONS.spacing.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: DIMENSIONS.spacing.xs,
    color: COLORS.text,
  },
  profileEmail: {
    fontSize: 16,
    marginBottom: DIMENSIONS.spacing.xs,
    color: COLORS.textSecondary,
  },
  profileLocation: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  statsSection: {
    width: '100%',
    marginBottom: DIMENSIONS.spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: DIMENSIONS.spacing.md,
    textAlign: 'center',
    color: COLORS.text,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: DIMENSIONS.spacing.sm,
  },
  statCard: {
    backgroundColor: COLORS.surface,
    borderRadius: DIMENSIONS.borderRadius,
    padding: DIMENSIONS.spacing.md,
    width: '45%',
    minWidth: 80,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: DIMENSIONS.spacing.xs,
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
    color: COLORS.textSecondary,
  },
  ratingSection: {
    width: '100%',
    marginBottom: DIMENSIONS.spacing.xl,
  },
  ratingCard: {
    backgroundColor: COLORS.surface,
    borderRadius: DIMENSIONS.borderRadius,
    padding: DIMENSIONS.spacing.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  ratingInfo: {
    alignItems: 'center',
    marginBottom: DIMENSIONS.spacing.lg,
  },
  ratingCount: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: DIMENSIONS.spacing.xs,
  },
  ratingBreakdown: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: DIMENSIONS.spacing.md,
  },
  ratingBreakdownTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: DIMENSIONS.spacing.sm,
  },
  ratingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: DIMENSIONS.spacing.xs,
  },
  ratingLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  ratingValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  shareRatingButton: {
    backgroundColor: COLORS.secondary,
    borderRadius: DIMENSIONS.borderRadius,
    paddingVertical: DIMENSIONS.spacing.sm,
    paddingHorizontal: DIMENSIONS.spacing.md,
    alignItems: 'center',
    marginTop: DIMENSIONS.spacing.md,
  },
  shareRatingButtonText: {
    color: COLORS.surface,
    fontSize: 14,
    fontWeight: '600',
  },
  actionsSection: {
    paddingHorizontal: DIMENSIONS.spacing.lg,
    paddingVertical: DIMENSIONS.spacing.lg,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    alignItems: 'center',
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
  settingsButton: {
    backgroundColor: COLORS.primary,
    borderRadius: DIMENSIONS.borderRadius,
    paddingVertical: DIMENSIONS.spacing.md,
    paddingHorizontal: DIMENSIONS.spacing.xl,
    alignItems: 'center',
    marginBottom: DIMENSIONS.spacing.md,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingsButtonText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: COLORS.error,
    borderRadius: DIMENSIONS.borderRadius,
    paddingVertical: DIMENSIONS.spacing.md,
    paddingHorizontal: DIMENSIONS.spacing.xl,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutButtonText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProfileScreen;

