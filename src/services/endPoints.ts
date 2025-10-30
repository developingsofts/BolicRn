export const API_END_POINTS = {
  auth: {
    login: "/user/login",
    register: "/user/register",
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
    all: "/workout/all",
    byId: (id: string) => `/workout/${id}`,
    userWorkouts: "/user-workout/all",
    achievements: "/achivement/all",
    sessions: {
      start: "/workout-session/start",
      active: "/workout-session/active",
      completeExercise: "/workout-session/complete-exercise",
      complete: "/workout-session/complete",
      pause: "/workout-session/pause",
      resume: "/workout-session/resume",
      cancel: "/workout-session/cancel",
      history: "/workout-session/history",
    },
  },

  exercises: {
    all: "/exercise/all",
    byId: (id: string) => `/exercise/${id}`,
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
  trainingTypes: {
    all: "/training-type/all",
  },

  selectedTrainingTypes: {
    all: "/selected-training-type/all",
    add: "/selected-training-type/add",
    update: "/selected-training-type/update",
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
