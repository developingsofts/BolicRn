import React from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import * as Notifications from 'expo-notifications';
import { COLORS } from '../config/constants';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface NotificationSettings {
  workoutReminders: boolean;
  streakAlerts: boolean;
  goalMilestones: boolean;
  partnerMessages: boolean;
  achievementAlerts: boolean;
  weeklyProgress: boolean;
  reminderTime: string; // "HH:MM" format
  reminderDays: number[]; // [0,1,2,3,4,5,6] for days of week
  quietHours: {
    enabled: boolean;
    start: string; // "HH:MM"
    end: string; // "HH:MM"
  };
}

export interface ScheduledNotification {
  id: string;
  type: 'workout_reminder' | 'streak_alert' | 'goal_milestone' | 'achievement' | 'weekly_progress';
  title: string;
  body: string;
  scheduledDate: Date;
  data?: any;
  identifier?: string;
}

export class NotificationManager {
  private static instance: NotificationManager;
  private notificationPermission: boolean = false;
  private scheduledNotifications: ScheduledNotification[] = [];

  static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }

  // Request notification permissions
  async requestPermission(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        Alert.alert(
          'Notification Permission Required',
          'Enable notifications to receive workout reminders and progress updates.',
          [{ text: 'OK' }]
        );
        this.notificationPermission = false;
        return false;
      }
      
      this.notificationPermission = true;
      
      // Get push token for remote notifications
      const token = await Notifications.getExpoPushTokenAsync();
      console.log('Push token:', token);
      
      return true;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      this.notificationPermission = false;
      return false;
    }
  }

  // Schedule a notification
  async scheduleNotification(notification: ScheduledNotification): Promise<string | null> {
    try {
      if (!this.notificationPermission) {
        console.log('Notification permission not granted');
        return null;
      }
      
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data || {},
          sound: true,
          badge: 1,
        },
        trigger: {
          date: notification.scheduledDate,
        },
      });
      
      const scheduledNotification = {
        ...notification,
        identifier,
      };
      
      this.scheduledNotifications.push(scheduledNotification);
      return identifier;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return null;
    }
  }

  // Schedule recurring workout reminders
  async scheduleWorkoutReminders(settings: NotificationSettings): Promise<void> {
    if (!settings.workoutReminders) return;
    
    try {
      // Cancel existing workout reminders
      await this.cancelWorkoutReminders();
      
      const [hours, minutes] = settings.reminderTime.split(':').map(Number);
      
      for (const day of settings.reminderDays) {
        const now = new Date();
        const reminderTime = new Date();
        reminderTime.setHours(hours, minutes, 0, 0);
        reminderTime.setDate(reminderTime.getDate() + ((day - reminderTime.getDay() + 7) % 7));
        
        // If the time has passed today, schedule for next week
        if (reminderTime <= now) {
          reminderTime.setDate(reminderTime.getDate() + 7);
        }
        
        const notification: ScheduledNotification = {
          id: `workout-reminder-${day}`,
          type: 'workout_reminder',
          title: '🏋️ Time to Work Out!',
          body: 'Your training partner is waiting! Time to crush your goals.',
          scheduledDate: reminderTime,
          data: { type: 'workout_reminder', day },
        };
        
        await this.scheduleNotification(notification);
      }
    } catch (error) {
      console.error('Error scheduling workout reminders:', error);
    }
  }

  // Cancel workout reminders
  async cancelWorkoutReminders(): Promise<void> {
    try {
      const existingNotifications = await Notifications.getAllScheduledNotificationsAsync();
      const workoutReminders = existingNotifications.filter((n: any) => 
        n.content.data?.type === 'workout_reminder'
      );
      
      for (const notification of workoutReminders) {
        if (notification.identifier) {
          await Notifications.cancelScheduledNotificationAsync(notification.identifier);
        }
      }
      
      this.scheduledNotifications = this.scheduledNotifications.filter(n => n.type !== 'workout_reminder');
    } catch (error) {
      console.error('Error canceling workout reminders:', error);
    }
  }

  // Send streak alert notification
  async sendStreakAlert(streakDays: number, settings: NotificationSettings): Promise<void> {
    if (!settings.streakAlerts) return;
    
    const notification: ScheduledNotification = {
      id: `streak-alert-${Date.now()}`,
      type: 'streak_alert',
      title: `🔥 ${streakDays} Day Streak!`,
      body: `Amazing! You've been working out for ${streakDays} days straight. Keep the momentum going!`,
      scheduledDate: new Date(),
      data: { type: 'streak_alert', streakDays },
    };
    
    await this.scheduleNotification(notification);
  }

  // Send goal milestone notification
  async sendGoalMilestoneNotification(goalTitle: string, milestone: number, unit: string, settings: NotificationSettings): Promise<void> {
    if (!settings.goalMilestones) return;
    
    const notification: ScheduledNotification = {
      id: `goal-milestone-${Date.now()}`,
      type: 'goal_milestone',
      title: `🎯 Goal Milestone Reached!`,
      body: `Congratulations! You've reached ${milestone} ${unit} in your ${goalTitle} goal!`,
      scheduledDate: new Date(),
      data: { type: 'goal_milestone', milestone },
    };
    
    await this.scheduleNotification(notification);
  }

  // Send achievement notification
  async sendAchievementNotification(achievementTitle: string, achievementDescription: string, settings: NotificationSettings): Promise<void> {
    if (!settings.achievementAlerts) return;
    
    const notification: ScheduledNotification = {
      id: `achievement-${Date.now()}`,
      type: 'achievement',
      title: `🏆 Achievement Unlocked!`,
      body: `${achievementTitle}: ${achievementDescription}`,
      scheduledDate: new Date(),
      data: { type: 'achievement' },
    };
    
    await this.scheduleNotification(notification);
  }

  // Send weekly progress notification
  async sendWeeklyProgressNotification(weeklyProgress: number, weeklyGoal: number, settings: NotificationSettings): Promise<void> {
    if (!settings.weeklyProgress) return;
    
    const notification: ScheduledNotification = {
      id: `weekly-progress-${Date.now()}`,
      type: 'weekly_progress',
      title: `📊 Weekly Progress Report`,
      body: `You completed ${weeklyProgress}/${weeklyGoal} workouts this week. Great job!`,
      scheduledDate: new Date(),
      data: { type: 'weekly_progress' },
    };
    
    await this.scheduleNotification(notification);
  }

  // Get all scheduled notifications
  async getAllScheduledNotifications(): Promise<ScheduledNotification[]> {
    try {
      const notifications = await Notifications.getAllScheduledNotificationsAsync();
      return notifications.map((n: any) => ({
        id: n.identifier,
        type: n.content.data?.type || 'unknown',
        title: n.content.title || '',
        body: n.content.body || '',
        scheduledDate: new Date(n.trigger.date),
        data: n.content.data,
        identifier: n.identifier,
      }));
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  }

  // Cancel all notifications
  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      this.scheduledNotifications = [];
    } catch (error) {
      console.error('Error canceling all notifications:', error);
    }
  }
}

// Notification Settings Component
interface NotificationSettingsProps {
  settings: NotificationSettings;
  onSettingsChange: (settings: NotificationSettings) => void;
}

export const NotificationSettingsComponent: React.FC<NotificationSettingsProps> = ({
  settings,
  onSettingsChange,
}) => {
  const updateSetting = (key: keyof NotificationSettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    onSettingsChange(newSettings);
  };

  return (
    <View style={styles.notificationCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>🔔 Notifications</Text>
      </View>
      
      <View style={styles.notificationSettings}>
        <View style={styles.notificationSetting}>
          <View style={styles.notificationSettingInfo}>
            <Text style={styles.notificationSettingTitle}>Workout Reminders</Text>
            <Text style={styles.notificationSettingDesc}>Daily workout reminders</Text>
          </View>
          <TouchableOpacity 
            style={[
              styles.notificationToggle,
              settings.workoutReminders && styles.notificationToggleActive
            ]}
            onPress={() => updateSetting('workoutReminders', !settings.workoutReminders)}
          >
            <Text style={styles.notificationToggleText}>
              {settings.workoutReminders ? 'ON' : 'OFF'}
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.notificationSetting}>
          <View style={styles.notificationSettingInfo}>
            <Text style={styles.notificationSettingTitle}>Streak Alerts</Text>
            <Text style={styles.notificationSettingDesc}>Celebrate your streaks</Text>
          </View>
          <TouchableOpacity 
            style={[
              styles.notificationToggle,
              settings.streakAlerts && styles.notificationToggleActive
            ]}
            onPress={() => updateSetting('streakAlerts', !settings.streakAlerts)}
          >
            <Text style={styles.notificationToggleText}>
              {settings.streakAlerts ? 'ON' : 'OFF'}
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.notificationSetting}>
          <View style={styles.notificationSettingInfo}>
            <Text style={styles.notificationSettingTitle}>Goal Milestones</Text>
            <Text style={styles.notificationSettingDesc}>Track your progress</Text>
          </View>
          <TouchableOpacity 
            style={[
              styles.notificationToggle,
              settings.goalMilestones && styles.notificationToggleActive
            ]}
            onPress={() => updateSetting('goalMilestones', !settings.goalMilestones)}
          >
            <Text style={styles.notificationToggleText}>
              {settings.goalMilestones ? 'ON' : 'OFF'}
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.notificationSetting}>
          <View style={styles.notificationSettingInfo}>
            <Text style={styles.notificationSettingTitle}>Achievement Alerts</Text>
            <Text style={styles.notificationSettingDesc}>Celebrate achievements</Text>
          </View>
          <TouchableOpacity 
            style={[
              styles.notificationToggle,
              settings.achievementAlerts && styles.notificationToggleActive
            ]}
            onPress={() => updateSetting('achievementAlerts', !settings.achievementAlerts)}
          >
            <Text style={styles.notificationToggleText}>
              {settings.achievementAlerts ? 'ON' : 'OFF'}
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.notificationSetting}>
          <View style={styles.notificationSettingInfo}>
            <Text style={styles.notificationSettingTitle}>Weekly Progress</Text>
            <Text style={styles.notificationSettingDesc}>Weekly progress reports</Text>
          </View>
          <TouchableOpacity 
            style={[
              styles.notificationToggle,
              settings.weeklyProgress && styles.notificationToggleActive
            ]}
            onPress={() => updateSetting('weeklyProgress', !settings.weeklyProgress)}
          >
            <Text style={styles.notificationToggleText}>
              {settings.weeklyProgress ? 'ON' : 'OFF'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  notificationCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  notificationSettings: {
    marginTop: 12,
  },
  notificationSetting: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  notificationSettingInfo: {
    flex: 1,
  },
  notificationSettingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  notificationSettingDesc: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  notificationToggle: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
  },
  notificationToggleActive: {
    backgroundColor: '#10B981',
  },
  notificationToggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
}); 