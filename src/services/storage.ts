import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../config/constants';

// Storage Service Class
class StorageService {
  // Generic storage methods
  async setItem(key: string, value: any): Promise<void> {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
    } catch (error) {
      console.error('Error saving to storage:', error);
      throw error;
    }
  }

  async getItem<T>(key: string): Promise<T | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      if (jsonValue == null) {
        return null;
      }
      
      // Try to parse the JSON value
      try {
        return JSON.parse(jsonValue);
      } catch (parseError) {
        console.error(`Error parsing JSON for key ${key}:`, parseError);
        console.error('Raw value:', jsonValue);
        
        // If parsing fails, remove the corrupted data
        await this.removeItem(key);
        return null;
      }
    } catch (error) {
      console.error('Error reading from storage:', error);
      return null;
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from storage:', error);
      throw error;
    }
  }

  async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Error clearing storage:', error);
      throw error;
    }
  }

  async getAllKeys(): Promise<string[]> {
    try {
      return await AsyncStorage.getAllKeys();
    } catch (error) {
      console.error('Error getting all keys:', error);
      return [];
    }
  }

  async multiGet(keys: string[]): Promise<[string, string | null][]> {
    try {
      return await AsyncStorage.multiGet(keys);
    } catch (error) {
      console.error('Error getting multiple items:', error);
      return [];
    }
  }

  async multiSet(keyValuePairs: [string, string][]): Promise<void> {
    try {
      await AsyncStorage.multiSet(keyValuePairs);
    } catch (error) {
      console.error('Error setting multiple items:', error);
      throw error;
    }
  }

  async multiRemove(keys: string[]): Promise<void> {
    try {
      await AsyncStorage.multiRemove(keys);
    } catch (error) {
      console.error('Error removing multiple items:', error);
      throw error;
    }
  }

  // Method to clear corrupted storage data
  async clearCorruptedData(): Promise<void> {
    try {
      console.log('Clearing potentially corrupted storage data...');
      await this.clear();
      console.log('Storage cleared successfully');
    } catch (error) {
      console.error('Error clearing corrupted data:', error);
      throw error;
    }
  }

  // Method to validate and clean storage data
  async validateStorageData(): Promise<void> {
    try {
      const allKeys = await this.getAllKeys();
      console.log('Validating storage data for keys:', allKeys);
      
      for (const key of allKeys) {
        try {
          await this.getItem(key);
        } catch (error) {
          console.error(`Corrupted data found for key: ${key}`, error);
          await this.removeItem(key);
        }
      }
    } catch (error) {
      console.error('Error validating storage data:', error);
    }
  }

  // Auth-specific methods
  async setAuthToken(token: string): Promise<void> {
    return this.setItem(STORAGE_KEYS.authToken, token);
  }

  async getAuthToken(): Promise<string | null> {
    return this.getItem<string>(STORAGE_KEYS.authToken);
  }

  async removeAuthToken(): Promise<void> {
    return this.removeItem(STORAGE_KEYS.authToken);
  }

  // User-specific methods
  async setUserProfile(profile: any): Promise<void> {
    return this.setItem(STORAGE_KEYS.userProfile, profile);
  }

  async getUserProfile(): Promise<any | null> {
    return this.getItem(STORAGE_KEYS.userProfile);
  }

  async setUserStats(stats: any): Promise<void> {
    return this.setItem(STORAGE_KEYS.userStats, stats);
  }

  async getUserStats(): Promise<any | null> {
    return this.getItem(STORAGE_KEYS.userStats);
  }

  // Workout-specific methods
  async setWorkoutSessions(sessions: any[]): Promise<void> {
    return this.setItem(STORAGE_KEYS.workoutSessions, sessions);
  }

  async getWorkoutSessions(): Promise<any[] | null> {
    return this.getItem<any[]>(STORAGE_KEYS.workoutSessions);
  }

  async addWorkoutSession(session: any): Promise<void> {
    const sessions = await this.getWorkoutSessions() || [];
    sessions.unshift(session); // Add to beginning
    return this.setWorkoutSessions(sessions);
  }

  async updateWorkoutSession(sessionId: string, updatedSession: any): Promise<void> {
    const sessions = await this.getWorkoutSessions() || [];
    const index = sessions.findIndex(s => s.id === sessionId);
    if (index !== -1) {
      sessions[index] = updatedSession;
      return this.setWorkoutSessions(sessions);
    }
  }

  async removeWorkoutSession(sessionId: string): Promise<void> {
    const sessions = await this.getWorkoutSessions() || [];
    const filteredSessions = sessions.filter(s => s.id !== sessionId);
    return this.setWorkoutSessions(filteredSessions);
  }

  // Progress goals methods
  async setProgressGoals(goals: any[]): Promise<void> {
    return this.setItem(STORAGE_KEYS.progressGoals, goals);
  }

  async getProgressGoals(): Promise<any[] | null> {
    return this.getItem<any[]>(STORAGE_KEYS.progressGoals);
  }

  async addProgressGoal(goal: any): Promise<void> {
    const goals = await this.getProgressGoals() || [];
    goals.push(goal);
    return this.setProgressGoals(goals);
  }

  async updateProgressGoal(goalId: string, updatedGoal: any): Promise<void> {
    const goals = await this.getProgressGoals() || [];
    const index = goals.findIndex(g => g.id === goalId);
    if (index !== -1) {
      goals[index] = updatedGoal;
      return this.setProgressGoals(goals);
    }
  }

  async removeProgressGoal(goalId: string): Promise<void> {
    const goals = await this.getProgressGoals() || [];
    const filteredGoals = goals.filter(g => g.id !== goalId);
    return this.setProgressGoals(filteredGoals);
  }

  // Training partners methods
  async setTrainingPartners(partners: any[]): Promise<void> {
    return this.setItem(STORAGE_KEYS.trainingPartners, partners);
  }

  async getTrainingPartners(): Promise<any[] | null> {
    return this.getItem<any[]>(STORAGE_KEYS.trainingPartners);
  }

  async addTrainingPartner(partner: any): Promise<void> {
    const partners = await this.getTrainingPartners() || [];
    partners.push(partner);
    return this.setTrainingPartners(partners);
  }

  async removeTrainingPartner(partnerId: string): Promise<void> {
    const partners = await this.getTrainingPartners() || [];
    const filteredPartners = partners.filter(p => p.id !== partnerId);
    return this.setTrainingPartners(filteredPartners);
  }

  // Messages methods
  async setMessages(messages: any[]): Promise<void> {
    return this.setItem(STORAGE_KEYS.messages, messages);
  }

  async getMessages(): Promise<any[] | null> {
    return this.getItem<any[]>(STORAGE_KEYS.messages);
  }

  async addMessage(message: any): Promise<void> {
    const messages = await this.getMessages() || [];
    messages.push(message);
    return this.setMessages(messages);
  }

  async updateMessage(messageId: string, updatedMessage: any): Promise<void> {
    const messages = await this.getMessages() || [];
    const index = messages.findIndex(m => m.id === messageId);
    if (index !== -1) {
      messages[index] = updatedMessage;
      return this.setMessages(messages);
    }
  }

  async removeMessage(messageId: string): Promise<void> {
    const messages = await this.getMessages() || [];
    const filteredMessages = messages.filter(m => m.id !== messageId);
    return this.setMessages(filteredMessages);
  }

  // Groups methods
  async setGroups(groups: any[]): Promise<void> {
    return this.setItem(STORAGE_KEYS.groups, groups);
  }

  async getGroups(): Promise<any[] | null> {
    return this.getItem<any[]>(STORAGE_KEYS.groups);
  }

  async updateGroup(groupId: string, updatedGroup: any): Promise<void> {
    const groups = await this.getGroups() || [];
    const index = groups.findIndex(g => g.id === groupId);
    if (index !== -1) {
      groups[index] = updatedGroup;
      return this.setGroups(groups);
    }
  }

  // Notifications methods
  async setNotifications(notifications: any[]): Promise<void> {
    return this.setItem(STORAGE_KEYS.notifications, notifications);
  }

  async getNotifications(): Promise<any[] | null> {
    return this.getItem<any[]>(STORAGE_KEYS.notifications);
  }

  async addNotification(notification: any): Promise<void> {
    const notifications = await this.getNotifications() || [];
    notifications.unshift(notification); // Add to beginning
    return this.setNotifications(notifications);
  }

  async updateNotification(notificationId: string, updatedNotification: any): Promise<void> {
    const notifications = await this.getNotifications() || [];
    const index = notifications.findIndex(n => n.id === notificationId);
    if (index !== -1) {
      notifications[index] = updatedNotification;
      return this.setNotifications(notifications);
    }
  }

  async removeNotification(notificationId: string): Promise<void> {
    const notifications = await this.getNotifications() || [];
    const filteredNotifications = notifications.filter(n => n.id !== notificationId);
    return this.setNotifications(filteredNotifications);
  }

  // Notification settings methods
  async setNotificationSettings(settings: any): Promise<void> {
    return this.setItem(STORAGE_KEYS.notificationSettings, settings);
  }

  async getNotificationSettings(): Promise<any | null> {
    return this.getItem(STORAGE_KEYS.notificationSettings);
  }

  // Posts methods
  async setPosts(posts: any[]): Promise<void> {
    return this.setItem(STORAGE_KEYS.posts, posts);
  }

  async getPosts(): Promise<any[] | null> {
    return this.getItem<any[]>(STORAGE_KEYS.posts);
  }

  async addPost(post: any): Promise<void> {
    const posts = await this.getPosts() || [];
    posts.unshift(post); // Add to beginning
    return this.setPosts(posts);
  }

  async updatePost(postId: string, updatedPost: any): Promise<void> {
    const posts = await this.getPosts() || [];
    const index = posts.findIndex(p => p.id === postId);
    if (index !== -1) {
      posts[index] = updatedPost;
      return this.setPosts(posts);
    }
  }

  async removePost(postId: string): Promise<void> {
    const posts = await this.getPosts() || [];
    const filteredPosts = posts.filter(p => p.id !== postId);
    return this.setPosts(filteredPosts);
  }

  // Ratings methods
  async setRatings(ratings: any[]): Promise<void> {
    return this.setItem(STORAGE_KEYS.ratings, ratings);
  }

  async getRatings(): Promise<any[] | null> {
    return this.getItem<any[]>(STORAGE_KEYS.ratings);
  }

  async addRating(rating: any): Promise<void> {
    const ratings = await this.getRatings() || [];
    ratings.push(rating);
    return this.setRatings(ratings);
  }

  // Achievements methods
  async setAchievements(achievements: any[]): Promise<void> {
    return this.setItem(STORAGE_KEYS.achievements, achievements);
  }

  async getAchievements(): Promise<any[] | null> {
    return this.getItem<any[]>(STORAGE_KEYS.achievements);
  }

  async addAchievement(achievement: any): Promise<void> {
    const achievements = await this.getAchievements() || [];
    achievements.push(achievement);
    return this.setAchievements(achievements);
  }

  // Notepad methods
  async setNotepadNotes(notes: any[]): Promise<void> {
    return this.setItem(STORAGE_KEYS.notepadNotes, notes);
  }

  async getNotepadNotes(): Promise<any[] | null> {
    return this.getItem<any[]>(STORAGE_KEYS.notepadNotes);
  }

  async addNotepadNote(note: any): Promise<void> {
    const notes = await this.getNotepadNotes() || [];
    notes.unshift(note); // Add to beginning
    return this.setNotepadNotes(notes);
  }

  async updateNotepadNote(noteId: string, updatedNote: any): Promise<void> {
    const notes = await this.getNotepadNotes() || [];
    const index = notes.findIndex(n => n.id === noteId);
    if (index !== -1) {
      notes[index] = updatedNote;
      return this.setNotepadNotes(notes);
    }
  }

  async removeNotepadNote(noteId: string): Promise<void> {
    const notes = await this.getNotepadNotes() || [];
    const filteredNotes = notes.filter(n => n.id !== noteId);
    return this.setNotepadNotes(filteredNotes);
  }

  // Utility methods
  async clearUserData(): Promise<void> {
    const keysToRemove = [
      STORAGE_KEYS.userProfile,
      STORAGE_KEYS.userStats,
      STORAGE_KEYS.workoutSessions,
      STORAGE_KEYS.progressGoals,
      STORAGE_KEYS.trainingPartners,
      STORAGE_KEYS.messages,
      STORAGE_KEYS.groups,
      STORAGE_KEYS.notifications,
      STORAGE_KEYS.posts,
      STORAGE_KEYS.ratings,
      STORAGE_KEYS.achievements,
      STORAGE_KEYS.notepadNotes,
    ];
    await this.multiRemove(keysToRemove);
  }

  async clearAllData(): Promise<void> {
    await this.clear();
  }

  // Migration methods for app updates
  async migrateData(fromVersion: string, toVersion: string): Promise<void> {
    // Add migration logic here when needed
    console.log(`Migrating data from ${fromVersion} to ${toVersion}`);
  }
}

// Create singleton instance
export const storageService = new StorageService();

// Export for convenience
export default storageService;

