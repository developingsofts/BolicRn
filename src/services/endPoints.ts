export const API_END_POINTS = {
  auth: {
    login: "/user/login",
    register: "/user/register",
    logout: "/auth/logout",
    refresh: "/auth/refresh",
    forgotPassword: "/auth/forgot-password",
    resetPassword: "/auth/reset-password",
  },

  trainingPrice: {
    create: "/training-price/create",
    update: "/training-price/update",
    list: "/training-price/list",
    delete: "/training-price/delete",
  },

  users: {
    profile: (userId: string) => `/users/${userId}/profile`,
    stats: (userId: string) => `/users/${userId}/stats`,
    achievements: (userId: string) => `/users/${userId}/achievements`,
    ratings: (userId: string) => `/users/${userId}/ratings`,
  },
  trainerAvailability: {
    create: "/trainer-availability-slot/create",
    update: "/trainer-availability-slot/update",
    list: "/trainer-availability-slot/list",
    delete: "/trainer-availability-slot/delete",
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
    swipe: "/swipes/create",
    partners: "/matching/potential/users",
    trainers: "/matching/potential/trainers",
  },

  messages: {
    conversations: "/chat/conversations",
    conversationMessages: (conversationId: string | number) =>
      `/chat/conversations/${conversationId}/messages`,
    conversationMembers: (conversationId: string | number) =>
      `/chat/conversations/${conversationId}/members`,
    sendMessage: (conversationId: string | number) =>
      `/chat/conversations/${conversationId}/messages`,
    markConversationAsRead: (conversationId: string | number) =>
      `/chat/conversations/${conversationId}/read`,
    markMessageAsRead: (messageId: string | number) =>
      `/chat/messages/${messageId}/read`,
    toggleMessageReaction: (messageId: string | number) =>
      `/chat/messages/${messageId}/reaction`,
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
  bookings: {
    create: "/booking/create",
    update: "/booking/update",
    delete: "/booking/delete",
    userBookings: "/booking/user",
    trainerBookings: "/booking/trainer",
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

  notes: {
    list: "/notes",
    create: "/notes",
    update: (noteId: string) => `/notes/${noteId}`,
    delete: (noteId: string) => `/notes/${noteId}`,
  },

  notifications: {
    list: "/notifications",
    markAsRead: (notificationId: string) =>
      `/notifications/${notificationId}/read`,
    settings: "/notifications/settings",
  },

  follows: {
    follow: "/follows/follow",
    unfollow: "/follows/unfollow",
    followers: (userId: string, page: number = 1, limit: number = 10) =>
      `/follows/followers?userId=${userId}&page=${page}&limit=${limit}`,
    following: (userId: string, page: number = 1, limit: number = 10) =>
      `/follows/following?userId=${userId}&page=${page}&limit=${limit}`,
  },

  connections: {
    userConnections: "/connections/user",
  },
};
