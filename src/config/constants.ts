// App Configuration
export const APP_CONFIG = {
  name: 'BolicBuddy',
  version: '1.0.0',
  description: 'Find your perfect training partner',
};

// API Configuration
export const API_CONFIG = {
  baseUrl: process.env.EXPO_PUBLIC_API_URL || 'https://api.bolicbuddy.com',
  timeout: 10000,
  retryAttempts: 3,
};

// Firebase Configuration
export const FIREBASE_CONFIG = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Location Configuration
export const LOCATION_CONFIG = {
  defaultRadius: 10, // km
  maxRadius: 50, // km
  updateInterval: 5000, // ms
  distanceInterval: 10, // meters
};

// Notification Configuration
export const NOTIFICATION_CONFIG = {
  defaultReminderTime: '18:00',
  defaultReminderDays: [1, 2, 3, 4, 5, 6, 0], // All days
  quietHours: {
    enabled: false,
    start: '22:00',
    end: '08:00',
  },
};

// XP and Leveling Configuration
export const XP_CONFIG = {
  workoutCompletion: 50,
  achievementEarned: 100,
  postCreated: 10,
  messageSent: 5,
  noteSaved: 5,
  ratingGiven: 5,
  streakMilestone: 25,
  goalMilestone: 15,
  xpPerLevel: 1000,
};

// Matching Configuration
export const MATCHING_CONFIG = {
  minCompatibilityScore: 50,
  maxDistance: 50, // km
  mutualMatchChance: 0.3, // 30% chance for demo
};

// Workout Configuration
export const WORKOUT_CONFIG = {
  defaultDuration: 60, // minutes
  defaultCalories: 300,
  exerciseTypes: ['strength', 'cardio', 'flexibility', 'mixed'],
  difficultyLevels: ['easy', 'medium', 'hard'],
};

// Training Types
export const TRAINING_TYPES = [
  'Powerlifting',
  'BodyBuilding',
  'Lifestyle',
  'Hybrid',
  'CrossFit',
  'Olympic Lifting',
  'Functional Fitness',
  'Yoga',
  'Pilates',
  'Running',
  'Cycling',
  'Swimming',
];

// Gender Options
export const GENDER_OPTIONS = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];

// Gender Preference Options
export const GENDER_PREFERENCE_OPTIONS = ['All', 'Same Gender Only', 'Opposite Gender Only'];

// Training Schedule Options
export const TRAINING_SCHEDULE_OPTIONS = ['AM', 'PM', 'Flexible', 'Weekends Only'];

// Years Training Options
export const YEARS_TRAINING_OPTIONS = [
  'Less than 1 year',
  '1-2 years',
  '3-5 years',
  '5-10 years',
  '10+ years',
];

// Storage Keys
export const STORAGE_KEYS = {
  authToken: 'authToken',
  userProfile: 'userProfile',
  userStats: 'userStats',
  notificationSettings: 'notificationSettings',
  workoutSessions: 'workoutSessions',
  progressGoals: 'progressGoals',
  trainingPartners: 'trainingPartners',
  messages: 'messages',
  groups: 'groups',
  notifications: 'notifications',
  posts: 'posts',
  ratings: 'ratings',
  achievements: 'achievements',
  notepadNotes: 'notepadNotes',
};

// Error Messages
export const ERROR_MESSAGES = {
  networkError: 'Network error. Please check your connection.',
  authenticationError: 'Authentication failed. Please try again.',
  locationError: 'Location access is required to find nearby partners.',
  notificationError: 'Notification permission is required for reminders.',
  generalError: 'Something went wrong. Please try again.',
  validationError: 'Please check your input and try again.',
};

// Success Messages
export const SUCCESS_MESSAGES = {
  loginSuccess: 'Successfully signed in!',
  registrationSuccess: 'Account created successfully!',
  logoutSuccess: 'Logged out successfully',
  profileUpdateSuccess: 'Profile updated successfully!',
  workoutComplete: 'Workout completed successfully!',
  goalCreated: 'Goal created successfully!',
  postCreated: 'Post created successfully!',
  messageSent: 'Message sent successfully!',
  noteSaved: 'Note saved successfully!',
  ratingSubmitted: 'Rating submitted successfully!',
};

// Colors (for consistent theming)
export const COLORS = {
  primary: '#007AFF',
  secondary: '#5856D6',
  success: '#34C759',
  warning: '#FF9500',
  error: '#FF3B30',
  background: '#F2F2F7',
  surface: '#FFFFFF',
  text: '#000000',
  textSecondary: '#8E8E93',
  border: '#C6C6C8',
  card: '#FFFFFF',
  black: '#000000',
  white: '#FFFFFF',
  placeholder: '#8E8E93',
  border_dark:'#CDCDCD',
  app_black:"#151515",
  _5E5E5E:"#5E5E5E",
  _818181:"#818181",
  _C9C9C9:"#C9C9C9",
  _FFC362:"#FFC362",
  _FFF5E9:"#FFF5E9",
  _B9780E:"#B9780E",
  gradient1:"#1B1F35",
  gradient2:"#222B68",
  gradient3:"#334691",
  _D9D9D9:"#D9D9D9",
  _FF1616:"#FF1616",
  _E2E2E2:"#E2E2E2",
  _EB3434:"#EB3434",
  _E6E6E7:"#E6E6E7",
  _EAEBF4:"#EAEBF4",
  _616888:"#616888",
  _CCCCCC:"#CCCCCC",
  _D2E7FF:"#D2E7FF",
  _0B80FF:"#0B80FF",
  _3FE363:"#3FE363",
  _F3A455:"#F3A455",
  // Added for SettingsScreen buttons
  buttonGrayBg: 'rgba(223, 223, 223, 1)',
  buttonGrayText: 'rgba(102, 102, 102, 1)',
  // Chat message background
  chatReceiverBg: '#9398F61F',
  // Chat screen colors
  chatMessageListBg: '#E4E4E466',
  chatDateSeparatorLine: '#0B123633',
  chatDateSeparatorText: '#051A5C9E',
};

// Dimensions
export const DIMENSIONS = {
  screenWidth: 375, // Default iPhone width
  screenHeight: 812, // Default iPhone height
  cardWidth: 320,
  cardHeight: 480,
  buttonHeight: 44,
  inputHeight: 44,
  borderRadius: 12,
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
};

// Animation Configuration
export const ANIMATION_CONFIG = {
  duration: {
    fast: 200,
    normal: 300,
    slow: 500,
  },
  easing: {
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
  },
};

