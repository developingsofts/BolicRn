export const API_END_POINTS = {
  auth: {
    login: "/auth/login",
    register: "/auth/register",
    logout: "/auth/logout",
    refresh: "/auth/refresh",
    forgotPassword: "/auth/forgot-password",
    resetPassword: "/auth/reset-password",
  },

  users: {
    profile: (userId: string) => `/users/${userId}/profile`,
    stats: (userId: string) => `/users/${userId}/stats`,
    achievements: (userId: string) => `/users/${userId}/achievements`,
    ratings: (userId: string) => `/users/${userId}/ratings`,
  },

  workouts: {
    sessions: (userId?: string) =>
      userId ? `/workouts/${userId}/sessions` : `/workouts/sessions`,
    sessionById: (sessionId: string) => `/workouts/sessions/${sessionId}`,
    goals: (userId?: string) =>
      userId ? `/workouts/${userId}/goals` : `/workouts/goals`,
    goalById: (goalId: string) => `/workouts/goals/${goalId}`,
  },

  matching: {
    nearby: "/matching/nearby",
    like: "/matching/like",
    dislike: "/matching/dislike",
    matches: "/matching/matches",
    potential: "/matching/potential",
  },

  messages: {
    conversations: "/messages/conversations",
    conversationById: (conversationId: string) =>
      `/messages/conversations/${conversationId}`,
    send: "/messages/send",
    markAsRead: (messageId: string) => `/messages/${messageId}/read`,
    delete: (messageId: string) => `/messages/${messageId}`,
  },

  groups: {
    list: "/groups",
    details: (groupId: string) => `/groups/${groupId}`,
    join: (groupId: string) => `/groups/${groupId}/join`,
    leave: (groupId: string) => `/groups/${groupId}/leave`,
  },

  posts: {
    list: (page: number = 1, limit: number = 20) =>
      `/posts?page=${page}&limit=${limit}`,
    create: "/posts",
    like: (postId: string) => `/posts/${postId}/like`,
    comments: (postId: string) => `/posts/${postId}/comments`,
    delete: (postId: string) => `/posts/${postId}`,
  },

  ratings: {
    create: "/ratings",
    userRatings: (userId: string) => `/ratings/user/${userId}`,
    ratingById: (ratingId: string) => `/ratings/${ratingId}`,
  },

  notifications: {
    list: "/notifications",
    markAsRead: (notificationId: string) =>
      `/notifications/${notificationId}/read`,
    settings: "/notifications/settings",
  },
};
