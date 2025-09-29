import { API_CONFIG, ERROR_MESSAGES } from '../config/constants';

// API Response Types
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

// API Client Class
class ApiClient {
  private baseUrl: string;
  private timeout: number;

  constructor() {
    this.baseUrl = API_CONFIG.baseUrl;
    this.timeout = API_CONFIG.timeout;
  }

  // Generic request method
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const config: RequestInit = {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        timeout: this.timeout,
        ...options,
      };

      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || ERROR_MESSAGES.networkError);
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : ERROR_MESSAGES.networkError,
      };
    }
  }

  // GET request
  async get<T>(endpoint: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'GET',
      headers,
    });
  }

  // POST request
  async post<T>(endpoint: string, data: any, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
  }

  // PUT request
  async put<T>(endpoint: string, data: any, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    });
  }

  // DELETE request
  async delete<T>(endpoint: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
      headers,
    });
  }

  // PATCH request
  async patch<T>(endpoint: string, data: any, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(data),
    });
  }
}

// Create singleton instance
export const apiClient = new ApiClient();

// Auth API Service
export class AuthService {
  static async login(email: string, password: string) {
    return apiClient.post('/auth/login', { email, password });
  }

  static async register(userData: {
    email: string;
    password: string;
    displayName: string;
    phoneNumber: string;
    age: string;
    trainingTypes: string[];
    genderPreference: string;
    userGender: string;
    currentPRs: string;
  }) {
    return apiClient.post('/auth/register', userData);
  }

  static async logout(token: string) {
    return apiClient.post('/auth/logout', {}, {
      Authorization: `Bearer ${token}`,
    });
  }

  static async refreshToken(refreshToken: string) {
    return apiClient.post('/auth/refresh', { refreshToken });
  }

  static async forgotPassword(email: string) {
    return apiClient.post('/auth/forgot-password', { email });
  }

  static async resetPassword(token: string, newPassword: string) {
    return apiClient.post('/auth/reset-password', { token, newPassword });
  }
}

// User API Service
export class UserService {
  static async getUserProfile(token: string, userId: string) {
    return apiClient.get(`/users/${userId}/profile`, {
      Authorization: `Bearer ${token}`,
    });
  }

  static async updateUserProfile(token: string, userId: string, profileData: any) {
    return apiClient.put(`/users/${userId}/profile`, profileData, {
      Authorization: `Bearer ${token}`,
    });
  }

  static async getUserStats(token: string, userId: string) {
    return apiClient.get(`/users/${userId}/stats`, {
      Authorization: `Bearer ${token}`,
    });
  }

  static async updateUserStats(token: string, userId: string, statsData: any) {
    return apiClient.put(`/users/${userId}/stats`, statsData, {
      Authorization: `Bearer ${token}`,
    });
  }

  static async getUserAchievements(token: string, userId: string) {
    return apiClient.get(`/users/${userId}/achievements`, {
      Authorization: `Bearer ${token}`,
    });
  }

  static async getUserRatings(token: string, userId: string) {
    return apiClient.get(`/users/${userId}/ratings`, {
      Authorization: `Bearer ${token}`,
    });
  }
}

// Workout API Service
export class WorkoutService {
  static async getWorkoutSessions(token: string, userId: string) {
    return apiClient.get(`/workouts/${userId}/sessions`, {
      Authorization: `Bearer ${token}`,
    });
  }

  static async createWorkoutSession(token: string, sessionData: any) {
    return apiClient.post('/workouts/sessions', sessionData, {
      Authorization: `Bearer ${token}`,
    });
  }

  static async updateWorkoutSession(token: string, sessionId: string, sessionData: any) {
    return apiClient.put(`/workouts/sessions/${sessionId}`, sessionData, {
      Authorization: `Bearer ${token}`,
    });
  }

  static async deleteWorkoutSession(token: string, sessionId: string) {
    return apiClient.delete(`/workouts/sessions/${sessionId}`, {
      Authorization: `Bearer ${token}`,
    });
  }

  static async getProgressGoals(token: string, userId: string) {
    return apiClient.get(`/workouts/${userId}/goals`, {
      Authorization: `Bearer ${token}`,
    });
  }

  static async createProgressGoal(token: string, goalData: any) {
    return apiClient.post('/workouts/goals', goalData, {
      Authorization: `Bearer ${token}`,
    });
  }

  static async updateProgressGoal(token: string, goalId: string, goalData: any) {
    return apiClient.put(`/workouts/goals/${goalId}`, goalData, {
      Authorization: `Bearer ${token}`,
    });
  }

  static async deleteProgressGoal(token: string, goalId: string) {
    return apiClient.delete(`/workouts/goals/${goalId}`, {
      Authorization: `Bearer ${token}`,
    });
  }
}

// Matching API Service
export class MatchingService {
  static async findNearbyPartners(token: string, location: any, radius: number = 10) {
    return apiClient.post('/matching/nearby', { location, radius }, {
      Authorization: `Bearer ${token}`,
    });
  }

  static async likePartner(token: string, partnerId: string) {
    return apiClient.post('/matching/like', { partnerId }, {
      Authorization: `Bearer ${token}`,
    });
  }

  static async dislikePartner(token: string, partnerId: string) {
    return apiClient.post('/matching/dislike', { partnerId }, {
      Authorization: `Bearer ${token}`,
    });
  }

  static async getMatches(token: string) {
    return apiClient.get('/matching/matches', {
      Authorization: `Bearer ${token}`,
    });
  }

  static async getPotentialMatches(token: string) {
    return apiClient.get('/matching/potential', {
      Authorization: `Bearer ${token}`,
    });
  }
}

// Messaging API Service
export class MessagingService {
  static async getConversations(token: string) {
    return apiClient.get('/messages/conversations', {
      Authorization: `Bearer ${token}`,
    });
  }

  static async getMessages(token: string, conversationId: string) {
    return apiClient.get(`/messages/conversations/${conversationId}`, {
      Authorization: `Bearer ${token}`,
    });
  }

  static async sendMessage(token: string, messageData: any) {
    return apiClient.post('/messages/send', messageData, {
      Authorization: `Bearer ${token}`,
    });
  }

  static async markMessageAsRead(token: string, messageId: string) {
    return apiClient.patch(`/messages/${messageId}/read`, {}, {
      Authorization: `Bearer ${token}`,
    });
  }

  static async deleteMessage(token: string, messageId: string) {
    return apiClient.delete(`/messages/${messageId}`, {
      Authorization: `Bearer ${token}`,
    });
  }
}

// Groups API Service
export class GroupsService {
  static async getGroups(token: string) {
    return apiClient.get('/groups', {
      Authorization: `Bearer ${token}`,
    });
  }

  static async getGroupDetails(token: string, groupId: string) {
    return apiClient.get(`/groups/${groupId}`, {
      Authorization: `Bearer ${token}`,
    });
  }

  static async joinGroup(token: string, groupId: string) {
    return apiClient.post(`/groups/${groupId}/join`, {}, {
      Authorization: `Bearer ${token}`,
    });
  }

  static async leaveGroup(token: string, groupId: string) {
    return apiClient.post(`/groups/${groupId}/leave`, {}, {
      Authorization: `Bearer ${token}`,
    });
  }

  static async createGroup(token: string, groupData: any) {
    return apiClient.post('/groups', groupData, {
      Authorization: `Bearer ${token}`,
    });
  }
}

// Posts API Service
export class PostsService {
  static async getPosts(token: string, page: number = 1, limit: number = 20) {
    return apiClient.get(`/posts?page=${page}&limit=${limit}`, {
      Authorization: `Bearer ${token}`,
    });
  }

  static async createPost(token: string, postData: any) {
    return apiClient.post('/posts', postData, {
      Authorization: `Bearer ${token}`,
    });
  }

  static async likePost(token: string, postId: string) {
    return apiClient.post(`/posts/${postId}/like`, {}, {
      Authorization: `Bearer ${token}`,
    });
  }

  static async unlikePost(token: string, postId: string) {
    return apiClient.delete(`/posts/${postId}/like`, {
      Authorization: `Bearer ${token}`,
    });
  }

  static async addComment(token: string, postId: string, commentData: any) {
    return apiClient.post(`/posts/${postId}/comments`, commentData, {
      Authorization: `Bearer ${token}`,
    });
  }

  static async deletePost(token: string, postId: string) {
    return apiClient.delete(`/posts/${postId}`, {
      Authorization: `Bearer ${token}`,
    });
  }
}

// Ratings API Service
export class RatingsService {
  static async submitRating(token: string, ratingData: any) {
    return apiClient.post('/ratings', ratingData, {
      Authorization: `Bearer ${token}`,
    });
  }

  static async getUserRatings(token: string, userId: string) {
    return apiClient.get(`/ratings/user/${userId}`, {
      Authorization: `Bearer ${token}`,
    });
  }

  static async updateRating(token: string, ratingId: string, ratingData: any) {
    return apiClient.put(`/ratings/${ratingId}`, ratingData, {
      Authorization: `Bearer ${token}`,
    });
  }

  static async deleteRating(token: string, ratingId: string) {
    return apiClient.delete(`/ratings/${ratingId}`, {
      Authorization: `Bearer ${token}`,
    });
  }
}

// Notifications API Service
export class NotificationsService {
  static async getNotifications(token: string) {
    return apiClient.get('/notifications', {
      Authorization: `Bearer ${token}`,
    });
  }

  static async markNotificationAsRead(token: string, notificationId: string) {
    return apiClient.patch(`/notifications/${notificationId}/read`, {}, {
      Authorization: `Bearer ${token}`,
    });
  }

  static async updateNotificationSettings(token: string, settings: any) {
    return apiClient.put('/notifications/settings', settings, {
      Authorization: `Bearer ${token}`,
    });
  }

  static async getNotificationSettings(token: string) {
    return apiClient.get('/notifications/settings', {
      Authorization: `Bearer ${token}`,
    });
  }
}

// Export all services
export const apiServices = {
  auth: AuthService,
  user: UserService,
  workout: WorkoutService,
  matching: MatchingService,
  messaging: MessagingService,
  groups: GroupsService,
  posts: PostsService,
  ratings: RatingsService,
  notifications: NotificationsService,
};

