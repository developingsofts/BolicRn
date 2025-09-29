// User Types
export interface User {
  id: string;
  email: string;
  displayName: string;
  phoneNumber?: string;
  phoneVerified?: boolean;
  age: number;
  trainingTypes: string[];
  genderPreference: string;
  userGender: string;
  currentPRs: string;
  profilePicture?: string;
  bio?: string;
  location?: string;
  experienceLevel?: string;
  availability?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  userId: string;
  displayName: string;
  bio: string;
  trainingTypes: string[];
  yearsTraining: string;
  trainingSchedule: string;
  genderPreference: string;
  userGender: string;
  currentPRs: string;
  location: string;
  gym: string;
  photo?: string;
  verified: boolean;
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

// Workout Types
export interface WorkoutSession {
  id: string;
  userId: string;
  date: Date;
  duration: number;
  type: "strength" | "cardio" | "flexibility" | "mixed";
  exercises: Array<{
    name: string;
    sets: number;
    reps: number;
    weight?: number;
    notes?: string;
    completed: boolean;
  }>;
  caloriesBurned: number;
  difficulty: "easy" | "medium" | "hard";
  notes: string;
  location?: string;
  partnerId?: string;
}

export interface ProgressGoal {
  id: string;
  userId: string;
  type: "workout" | "strength" | "cardio" | "weight" | "custom";
  title: string;
  description: string;
  target: number;
  current: number;
  unit: string;
  timeframe: "daily" | "weekly" | "monthly" | "yearly";
  startDate: Date;
  endDate: Date;
  completed: boolean;
  milestones: Array<{
    value: number;
    achieved: boolean;
    date?: Date;
  }>;
}

// Social Types
export interface TrainingPartner {
  id: string;
  userId: string;
  displayName: string;
  age: number;
  gender: string;
  photo?: string;
  trainingTypes: string[];
  location: string;
  gym: string;
  distance: number;
  compatibility: number;
  lastActive: Date;
  verified: boolean;
  rating: number;
  trainingStyle: string;
  trainingMindset: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: Date;
  read: boolean;
  type: "text" | "image" | "workout";
}

export interface Group {
  id: string;
  name: string;
  description: string;
  photo?: string;
  memberCount: number;
  trainingTypes: string[];
  location: string;
  isMember: boolean;
  createdAt: Date;
}

export interface Post {
  id: string;
  userId: string;
  userDisplayName: string;
  userAvatar?: string;
  type: "workout" | "achievement" | "progress" | "motivation" | "question";
  content: string;
  workoutData?: {
    exercises: Array<{
      name: string;
      sets: number;
      reps: number;
      weight?: number;
      notes?: string;
    }>;
    duration: number;
    calories: number;
    difficulty: "easy" | "medium" | "hard";
  };
  achievementData?: {
    title: string;
    description: string;
    icon: string;
    xpEarned: number;
  };
  progressData?: {
    beforeValue: number;
    afterValue: number;
    unit: string;
    timeframe: string;
  };
  likes: number;
  comments: Array<{
    id: string;
    userId: string;
    userDisplayName: string;
    content: string;
    timestamp: Date;
  }>;
  timestamp: Date;
  isLiked: boolean;
  tags: string[];
}

// Rating Types
export interface Rating {
  id: string;
  raterId: string;
  raterDisplayName: string;
  ratedUserId: string;
  stars: 1 | 2 | 3 | 4 | 5;
  comment: string;
  timestamp: Date;
  trainingSession?: {
    date: Date;
    duration: number;
    activities: string[];
  };
}

export interface UserRating {
  averageRating: number;
  totalRatings: number;
  ratingBreakdown: {
    fiveStars: number;
    fourStars: number;
    threeStars: number;
    twoStars: number;
    oneStar: number;
  };
  recentRatings: Rating[];
}

// Achievement Types
export interface Achievement {
  id: string;
  userId: string;
  type: "streak" | "pr" | "workout" | "social" | "strength";
  title: string;
  description: string;
  icon: string;
  earnedAt: Date;
  progress?: number;
  target?: number;
}

// Notification Types
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
  type:
    | "workout_reminder"
    | "streak_alert"
    | "goal_milestone"
    | "achievement"
    | "weekly_progress";
  title: string;
  body: string;
  scheduledDate: Date;
  data?: any;
  identifier?: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: "message" | "match" | "achievement" | "reminder" | "social";
  title: string;
  message: string;
  read: boolean;
  timestamp: Date;
  data?: any;
}

// Navigation Types
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Home: undefined;
  Find: undefined;
  Groups: undefined;
  Messages: undefined;
  Profile: undefined;
  Chat: { partnerId: string; partnerName: string };
  WorkoutSession: { sessionId?: string };
  CreatePost: undefined;
  Settings: undefined;
  ForgotPassword: undefined;
  GroupDetails: { group: Group };
  ManageGroup: { group: Group };
};

export type MainTabParamList = {
  Home: undefined;
  Find: undefined;
  Groups: undefined;
  Messages: undefined;
  Profile: undefined;
};
