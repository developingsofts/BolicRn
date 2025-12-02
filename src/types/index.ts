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
  notificationEnabled?: boolean;
  profileVisibility?: boolean;
  matchingEnabled?: boolean;
  matchingPreference?: 'Strength' | 'Cardio' | 'CrossFit' | null;
  isDeleted?: boolean;
  deletedAt?: string | null;
  profilePicture?: string;
  imageUrl?: string;
  bio?: string;
  location?: string;
  experienceLevel?: string;
  availability?: string;
  onboardingStep?: number;
  trainerOnboardingStep?: number;
  role?: 'user' | 'trainer';
  createdAt: Date;
  updatedAt: Date;
  workExperience?: string;
  introVideo?: string; // URL or file path to intro video
  isFollowing?: boolean;
  booking_request?:BookingData[]
  today_schedule?:BookingData[]
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
export interface Workout {
  id: string;
  title: string;
  description: string;
  type: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  totalDuration: number; // in seconds
  totalCalories: number;
  exerciseCount: number;
  targetMuscleGroups: string[]; // JSON parsed
  equipmentRequired: string[]; // JSON parsed
  workoutExercises?: WorkoutExercise[]; // Include related exercises
  createdAt: Date;
  updatedAt: Date;
}

export interface Exercise {
  id: string;
  name: string;
  description: string;
  type: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  duration: number; // in seconds
  calories: number;
  muscleGroups: string[]; // JSON parsed
  equipment: string[]; // JSON parsed
  instructions: string[]; // JSON parsed
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkoutExercise {
  id: string;
  workoutId: string;
  exerciseId: string;
  order: number;
  sets: number;
  reps?: number;
  duration?: number; // for time-based exercises
  restTime: number; // in seconds
  exercise?: Exercise; // populated when needed
}

export interface UserWorkout {
  id: number;
  userId: number;
  workoutId: number;
  isCompleted: boolean;
  duration: number;
  level: string;
  createdAt: Date;
  updatedAt: Date;
  workout?: Workout; // populated when needed
}

export interface UserWorkoutSession {
  id: string;
  userId: string;
  workoutId: string;
  startedAt: Date;
  completedAt?: Date;
  totalDuration: number; // in seconds
  totalCaloriesBurned: number;
  status: 'in_progress' | 'completed' | 'paused' | 'cancelled';
  workout?: Workout; // populated when needed
  progress?: UserExerciseProgress[];
}

export interface UserExerciseProgress {
  id: string;
  userWorkoutSessionId: string;
  workoutExerciseId: string;
  setNumber: number;
  repsCompleted?: number;
  durationCompleted?: number; // in seconds
  caloriesBurned: number;
  completedAt: Date;
  workoutExercise?: WorkoutExercise;
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
  memberCount?: number;
  trainingTypes?: string[];
  type?: string;
  location: string;
  privacy?: string;
  isMember?: boolean;
  joinRequestStatus?: 'pending' | 'approved' | 'rejected' | null;
  creatorId?: number | string;
  createdAt: Date;
}

import { BookingData } from "../services/api/bookingApi";
import type { ReactionType } from "../services/api/likesCommentsApi";

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
  likeCount?: number; // From backend API
  commentCount?: number; // From backend API
  isLikedByUser?: boolean; // From backend API
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
  workout?: {
    id: string;
    title: string;
    totalDuration: number;
    difficulty: string;
  };
  achievement?: {
    id: string;
    title: string;
    description: string;
    icon: string;
  };
  reactionSummary?: Record<ReactionType, number>;
  totalReactions?: number;
  currentUserReaction?: ReactionType | null;
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
  id: number;
  userId: string;
  type: "streak" | "pr" | "workout" | "social" | "strength";
  title: string;
  description: string;
  icon: string;
  earnedAt: Date;
  progress?: number;
  target?: number;
}

export interface Note {
  id: number;
  userId: number;
  text: string;
  createdAt: string;
  updatedAt: string;
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

export * from './chat';

// Navigation Types
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Home: undefined;
  Find: undefined;
  Groups: undefined;
  Messages: undefined;
  Profile: undefined;
  Chat: {
    conversationId?: string | number;
    conversationName?: string | null;
    partnerId?: string | number;
    partnerName?: string | null;
    initialMessage?: string;
  };
  SelectWorkout: undefined;
  WorkoutSession: { sessionId?: string; workoutType?: string; workoutName?: string };
  CreatePost: undefined;
  Settings: undefined;
  ForgotPassword: undefined;
  GroupDetails: { group: Group };
  ManageGroup: { group: Group };
  ShareWorkout: undefined;
  EditProfile: { userId?: string; isGuest?: boolean } | undefined;
  BookTrainer: { trainerId?: string; trainerName?: string } | undefined;
  SelectDateTime: { trainerId?: string; trainerName?: string; packageTitle?: string; price?: number } | undefined;
  BookingConfirmation: { trainerId?: string; trainerName?: string; packageTitle?: string; price?: number; date?: string; time?: string } | undefined;
  BookingSuccess: { trainerId?: string; trainerName?: string; dateTime?: string; location?: string } | undefined;
  MyPosts: undefined;
  WorkoutHistory: undefined;
  Connections: undefined;
  ScheduledSessions: undefined;
  Achievements: undefined;
  MyRatings: undefined;
  UserProfile: { userId: string; user: any };
  TrainerSetup: undefined;
  MyBookings: undefined;
  RescheduleSession: undefined;
  TrainerAvailability: undefined;
  TrainerPricing: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Find: undefined;
  Groups: undefined;
  Messages: undefined;
  Profile: undefined;
};

export type FindStackParams = {
  FindMain: undefined;
  UserProfile: { userId: string; isGuest: boolean };

};

export type HomeStackParams = {
  HomeFeed: undefined;
  CreatePost: undefined;
  ShareWorkout: undefined;

};
