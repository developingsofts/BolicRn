 import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { COLORS } from '../config/constants';

export interface WorkoutSession {
  id: string;
  userId: string;
  date: Date;
  duration: number;
  type: 'strength' | 'cardio' | 'flexibility' | 'mixed';
  exercises: Array<{
    name: string;
    sets: number;
    reps: number;
    weight?: number;
    notes?: string;
    completed: boolean;
  }>;
  caloriesBurned: number;
  difficulty: 'easy' | 'medium' | 'hard';
  notes: string;
  location?: string;
  partnerId?: string;
}

export interface ProgressGoal {
  id: string;
  userId: string;
  type: 'workout' | 'strength' | 'cardio' | 'weight' | 'custom';
  title: string;
  description: string;
  target: number;
  current: number;
  unit: string;
  timeframe: 'daily' | 'weekly' | 'monthly' | 'yearly';
  startDate: Date;
  endDate: Date;
  completed: boolean;
  milestones: Array<{
    value: number;
    achieved: boolean;
    date?: Date;
  }>;
}

export interface UserStats {
  userId: string;
  totalWorkouts: number;
  currentStreak: number;
  longestStreak: number;
  totalPartners: number;
  totalBadges: number;
  totalXP: number;
  level: number;
  weeklyGoal: number;
  weeklyProgress: number;
  monthlyGoal: number;
  monthlyProgress: number;
  yearlyGoal: number;
  yearlyProgress: number;
  lastWorkoutDate?: Date;
  averageWorkoutDuration: number;
  totalWorkoutTime: number;
  caloriesBurned: number;
  strengthProgress: {
    bench: number;
    squat: number;
    deadlift: number;
    overhead: number;
  };
  cardioProgress: {
    running: number;
    cycling: number;
    swimming: number;
  };
}

interface ProgressTrackerProps {
  workoutSessions: WorkoutSession[];
  progressGoals: ProgressGoal[];
  userStats: UserStats | null;
  onStartWorkout: () => void;
  onSetGoal: () => void;
  onViewStats: () => void;
}

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({
  workoutSessions,
  progressGoals,
  userStats,
  onStartWorkout,
  onSetGoal,
  onViewStats,
}) => {
  // Get progress statistics
  const getProgressStats = () => {
    const totalWorkouts = workoutSessions.length;
    const totalTime = workoutSessions.reduce((sum, session) => sum + session.duration, 0);
    const averageDuration = totalWorkouts > 0 ? Math.round(totalTime / totalWorkouts) : 0;
    const thisWeekWorkouts = workoutSessions.filter(session => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return session.date >= weekAgo;
    }).length;
    
    return {
      totalWorkouts,
      totalTime,
      averageDuration,
      thisWeekWorkouts,
      activeGoals: progressGoals.filter(goal => !goal.completed).length,
      completedGoals: progressGoals.filter(goal => goal.completed).length,
    };
  };

  const progressStats = getProgressStats();

  return (
    <View style={styles.progressTrackerCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>📊 Progress Tracker</Text>
        <TouchableOpacity onPress={onViewStats}>
          <Text style={styles.viewAllText}>Details</Text>
        </TouchableOpacity>
      </View>
      
      {/* Progress Stats */}
      <View style={styles.progressSummary}>
        <View style={styles.progressItem}>
          <Text style={styles.progressNumber}>{progressStats.totalWorkouts}</Text>
          <Text style={styles.progressLabel}>Total Workouts</Text>
        </View>
        <View style={styles.progressItem}>
          <Text style={styles.progressNumber}>{userStats?.currentStreak || 0}</Text>
          <Text style={styles.progressLabel}>Day Streak</Text>
        </View>
        <View style={styles.progressItem}>
          <Text style={styles.progressNumber}>{progressStats.thisWeekWorkouts}</Text>
          <Text style={styles.progressLabel}>This Week</Text>
        </View>
        <View style={styles.progressItem}>
          <Text style={styles.progressNumber}>{progressStats.activeGoals}</Text>
          <Text style={styles.progressLabel}>Active Goals</Text>
        </View>
      </View>
      
      {/* Active Goals Preview */}
      {progressGoals.filter(goal => !goal.completed).length > 0 && (
        <View style={styles.goalsPreview}>
          <Text style={styles.goalsPreviewTitle}>Active Goals</Text>
          {progressGoals.filter(goal => !goal.completed).slice(0, 2).map(goal => (
            <View key={goal.id} style={styles.goalPreviewItem}>
              <View style={styles.goalPreviewInfo}>
                <Text style={styles.goalPreviewTitle}>{goal.title}</Text>
                <Text style={styles.goalPreviewProgress}>
                  {goal.current}/{goal.target} {goal.unit}
                </Text>
              </View>
              <View style={styles.goalPreviewBar}>
                <View 
                  style={[
                    styles.goalPreviewFill, 
                    { width: `${(goal.current / goal.target) * 100}%` }
                  ]} 
                />
              </View>
            </View>
          ))}
        </View>
      )}
      
      {/* Quick Actions */}
      <View style={styles.progressActions}>
        <TouchableOpacity 
          style={styles.progressActionButton}
          onPress={onSetGoal}
        >
          <Text style={styles.progressActionIcon}>🎯</Text>
          <Text style={styles.progressActionText}>Set Goal</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.progressActionButton}
          onPress={onViewStats}
        >
          <Text style={styles.progressActionIcon}>📈</Text>
          <Text style={styles.progressActionText}>View Stats</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Progress Stats Component
interface ProgressStatsProps {
  workoutSessions: WorkoutSession[];
  progressGoals: ProgressGoal[];
  userStats: UserStats | null;
}

export const ProgressStats: React.FC<ProgressStatsProps> = ({
  workoutSessions,
  progressGoals,
  userStats,
}) => {
  const getProgressStats = () => {
    const totalWorkouts = workoutSessions.length;
    const totalTime = workoutSessions.reduce((sum, session) => sum + session.duration, 0);
    const averageDuration = totalWorkouts > 0 ? Math.round(totalTime / totalWorkouts) : 0;
    const thisWeekWorkouts = workoutSessions.filter(session => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return session.date >= weekAgo;
    }).length;
    
    const thisMonthWorkouts = workoutSessions.filter(session => {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return session.date >= monthAgo;
    }).length;
    
    const totalCalories = workoutSessions.reduce((sum, session) => sum + session.caloriesBurned, 0);
    
    return {
      totalWorkouts,
      totalTime,
      averageDuration,
      thisWeekWorkouts,
      thisMonthWorkouts,
      totalCalories,
      activeGoals: progressGoals.filter(goal => !goal.completed).length,
      completedGoals: progressGoals.filter(goal => goal.completed).length,
    };
  };

  const stats = getProgressStats();

  return (
    <ScrollView style={styles.statsContainer}>
      {/* Overview Stats */}
      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.totalWorkouts}</Text>
            <Text style={styles.statLabel}>Total Workouts</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{userStats?.currentStreak || 0}</Text>
            <Text style={styles.statLabel}>Current Streak</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{userStats?.longestStreak || 0}</Text>
            <Text style={styles.statLabel}>Longest Streak</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.averageDuration}</Text>
            <Text style={styles.statLabel}>Avg Duration (min)</Text>
          </View>
        </View>
      </View>

      {/* Time-based Stats */}
      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>This Period</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.thisWeekWorkouts}</Text>
            <Text style={styles.statLabel}>This Week</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.thisMonthWorkouts}</Text>
            <Text style={styles.statLabel}>This Month</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{Math.round(stats.totalCalories / 1000)}k</Text>
            <Text style={styles.statLabel}>Calories Burned</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{Math.round(stats.totalTime / 60)}</Text>
            <Text style={styles.statLabel}>Total Hours</Text>
          </View>
        </View>
      </View>

      {/* Goals Stats */}
      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>Goals</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.activeGoals}</Text>
            <Text style={styles.statLabel}>Active Goals</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.completedGoals}</Text>
            <Text style={styles.statLabel}>Completed Goals</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{userStats?.level || 1}</Text>
            <Text style={styles.statLabel}>Level</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{userStats?.totalXP || 0}</Text>
            <Text style={styles.statLabel}>Total XP</Text>
          </View>
        </View>
      </View>

      {/* Recent Workouts */}
      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>Recent Workouts</Text>
        {workoutSessions.slice(0, 5).map((session) => (
          <View key={session.id} style={styles.workoutItem}>
            <View style={styles.workoutInfo}>
              <Text style={styles.workoutType}>{session.type}</Text>
              <Text style={styles.workoutDate}>
                {session.date.toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.workoutStats}>
              <Text style={styles.workoutDuration}>{session.duration} min</Text>
              <Text style={styles.workoutCalories}>{session.caloriesBurned} cal</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  progressTrackerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    width: '100%',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  viewAllText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
  progressSummary: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
  },
  progressItem: {
    alignItems: 'center',
    minWidth: 60,
  },
  progressNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3B82F6',
    marginBottom: 4,
  },
  progressLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  
  // Enhanced progress tracking styles
  goalsPreview: {
    marginTop: 16,
  },
  goalsPreviewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  goalPreviewItem: {
    marginBottom: 12,
  },
  goalPreviewInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  goalPreviewTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  goalPreviewProgress: {
    fontSize: 12,
    color: '#6B7280',
  },
  goalPreviewBar: {
    height: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 3,
    overflow: 'hidden',
  },
  goalPreviewFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 3,
  },
  progressActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  progressActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
  },
  progressActionIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  progressActionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  
  // Stats styles
  statsContainer: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  statsSection: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3B82F6',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  workoutItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  workoutInfo: {
    flex: 1,
  },
  workoutType: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    textTransform: 'capitalize',
  },
  workoutDate: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  workoutStats: {
    alignItems: 'flex-end',
  },
  workoutDuration: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  workoutCalories: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
}); 