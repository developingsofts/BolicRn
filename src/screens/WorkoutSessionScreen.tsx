import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { COLORS, DIMENSIONS } from '../config/constants';
import STRINGS from '../config/strings';

interface WorkoutSessionScreenProps {
  navigation: any;
  route: any;
}

const WorkoutSessionScreen: React.FC<WorkoutSessionScreenProps> = ({ navigation, route }) => {
  const { sessionId } = route.params || {};

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>{STRINGS.WORKOUT_SESSION.title}</Text>
        <Text style={styles.subtitle}>
          {sessionId ? STRINGS.WORKOUT_SESSION.subtitle : STRINGS.WORKOUT_SESSION.subtitleNew}
        </Text>
        <Text style={styles.comingSoon}>{STRINGS.WORKOUT_SESSION.comingSoon}</Text>
        <Text style={styles.description}>
          {STRINGS.WORKOUT_SESSION.description}
        </Text>
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: DIMENSIONS.spacing.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: DIMENSIONS.spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: DIMENSIONS.spacing.lg,
    textAlign: 'center',
  },
  comingSoon: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: DIMENSIONS.spacing.lg,
  },
  description: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default WorkoutSessionScreen;

