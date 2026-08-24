export interface User {
  id: string;
  weeklyActivity?: {
    Mon: boolean;
    Tue: boolean;
    Wed: boolean;
    Thu: boolean;
    Fri: boolean;
    Sat: boolean;
    Sun: boolean;
  };
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
  matchingPreference?: ("Strength" | "Cardio" | "CrossFit" | "Powerlifting" | "BodyBuilding" | "Lifestyle" | "Hybrid" | "Olympic Lifting" | "Functional Fitness" | "Yoga" | "Pilates" | "Running" | "Cycling" | "Swimming")[];
  isDeleted?: boolean;
  deletedAt?: string | null;
  profilePicture?: string;
  imageUrl?: string;
  bio?: string;
  location?: string;
  latitude?: number | null;
  longitude?: number | null;
  /** Match score (0-100) returned by the matching endpoints only. */
  compatibility?: number | null;
  /** Distance in miles from the current user, returned by the matching endpoints only. */
  distance?: number | null;
  experienceLevel?: string;
  availability?: string;
  onboardingStep?: number;
  trainerOnboardingStep?: number;
  role?: "user" | "trainer";
  createdAt: Date;
  updatedAt: Date;
  workExperience?: string;
  introVideo?: string;
  isFollowing?: boolean;
  booking_request?: BookingData[];
  today_schedule?: BookingData[];
  totalWorkouts?: number;
  partnersCount?: number;
  awardsCount?: number;
  streak?: number;
  longestStreak?: number;
  clientCount?: number;
  totalWeeklySessions?: number;
  completedWeeklySessions?: number;
}

export interface PotentialUsers{
  users: User[];
  totalPages: number;
}

export interface UserProfile {
  userId: string;
  weeklyActivity?: {
    Mon: boolean;
    Tue: boolean;
    Wed: boolean;
    Thu: boolean;
    Fri: boolean;
    Sat: boolean;
    Sun: boolean;
  };
  displayName: string;
  bio: string;
  trainingTypes: string[];
  yearsTraining: string;
  trainingSchedule: string;
  genderPreference: string;
  userGender: string;
  currentPRs: string;
  location: string;
  latitude?: number | null;
  longitude?: number | null;
  gym: string;
  photo?: string;
  verified: boolean;
  totalWorkouts?: number;
  partnersCount?: number;
  awardsCount?: number;
  streak?: number;
  longestStreak?: number;
  clientCount?: number;
  totalWeeklySessions?: number;
  completedWeeklySessions?: number;
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

export interface Workout {
  id: string;
  title: string;
  description: string;
  type: string;
  difficulty: "Easy" | "Medium" | "Hard";
  totalDuration: number;
  totalCalories: number;
  exerciseCount: number;
  targetMuscleGroups: string[];
  equipmentRequired: string[];
  /** Server-side artwork URL. Present on /workout/all but null for every row today. */
  imageUrl?: string | null;
  /** Machine slug ("arms", "full_body", …) — present per row on /workout/all; matches GET /workout/categories. */
  category?: string | null;
  workoutExercises?: WorkoutExercise[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Exercise {
  id: string;
  name: string;
  description: string;
  type: string;
  difficulty: "Easy" | "Medium" | "Hard";
  duration: number;
  calories: number;
  muscleGroups: string[];
  equipment: string[];
  instructions: string[];
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
  duration?: number;
  restTime: number;
  exercise?: Exercise;
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
  workout?: Workout;
}

export interface UserWorkoutSession {
  id: string;
  userId: string;
  workoutId: string;
  startedAt: Date;
  completedAt?: Date;
  totalDuration: number;
  totalCaloriesBurned: number;
  status: "in_progress" | "completed" | "paused" | "cancelled";
  workout?: Workout;
  progress?: UserExerciseProgress[];
}

export interface UserExerciseProgress {
  id: string;
  userWorkoutSessionId: string;
  workoutExerciseId: string;
  setNumber: number;
  repsCompleted?: number;
  durationCompleted?: number;
  weightUsed?: number;
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
  joinRequestStatus?: "pending" | "approved" | "rejected" | null;
  /** Authoritative server flags — prefer these over inferring from `privacy`. */
  canJoin?: boolean;
  canRequestJoin?: boolean;
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
  likeCount?: number;
  commentCount?: number;
  isLikedByUser?: boolean;
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

export interface WeeklyGoalProgress {
  current: number;
  target: number;
  unit: string;
  percent: number;
  completed: boolean;
  weekStart: string;
  weekEnd: string;
}

export interface WeeklyGoalRecord {
  id: number;
  userId: number;
  type: WeeklyGoalType;
  target: number;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface WeeklyGoalResponse {
  goal: WeeklyGoalRecord | null;
  progress: WeeklyGoalProgress | null;
}

export type ActivityType = "workout" | "achievement" | "post";

export interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  detail: string;
  occurredAt: string;
  meta?: {
    workoutId?: number;
    sessionId?: number;
    durationSeconds?: number;
    exerciseCount?: number;
    caloriesBurned?: number;
    achievementId?: number;
    icon?: string;
    postId?: number;
    likeCount?: number;
    commentCount?: number;
  };
}

export interface ActivityFeedResponse {
  activities: ActivityItem[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalActivities: number;
    limit: number;
    hasMore: boolean;
  };
}

export type WeeklyGoalType = "workouts";

export interface WeeklyGoal {
  id: string;
  title: string;
  target: number;
  unit: string;
  type: WeeklyGoalType;
  createdAt: string;
}

export type RatingScore = 1 | 2 | 3 | 4 | 5;

export interface RatingAuthor {
  id: number;
  userName: string | null;
  displayName: string | null;
  imageUrl: string | null;
  role: string | null;
}

export interface Rating {
  id: number;
  raterId: number;
  rateeId: number;
  score: RatingScore;
  review: string | null;
  createdAt: string;
  updatedAt: string;
  rater?: RatingAuthor;
}

export type RatingBreakdown = Record<RatingScore, number>;

export interface RatingSummary {
  average: number;
  count: number;
  breakdown: RatingBreakdown;
}

export interface RatingsPagination {
  currentPage: number;
  totalPages: number;
  totalRatings: number;
  limit: number;
  hasMore: boolean;
}

export interface RatingsListResponse {
  ratings: Rating[];
  summary: RatingSummary;
  myRating: Rating | null;
  pagination: RatingsPagination;
}

export interface SubmitRatingResponse {
  rating: Rating;
  summary: RatingSummary;
  created: boolean;
}

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

export interface NotificationSettings {
  workoutReminders: boolean;
  streakAlerts: boolean;
  goalMilestones: boolean;
  partnerMessages: boolean;
  achievementAlerts: boolean;
  weeklyProgress: boolean;
  reminderTime: string;
  reminderDays: number[];
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
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

export * from "./chat";

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
  WorkoutSession: { workout: Workout };
  CreatePost: undefined;
  Settings: undefined;
  ForgotPassword: undefined;
  GroupDetails: { group: Group };
  ManageGroup: { group: Group };
  ShareWorkout:
    | {
        workoutId?: string;
        workoutTitle?: string;
        sessionId?: string;
      }
    | undefined;
  EditProfile: { userId?: string; isGuest?: boolean } | undefined;
  BookTrainer: { trainerId?: string; trainerName?: string } | undefined;
  SelectDateTime:
    | {
        priceId?: string;
        trainerId?: string;
        trainerName?: string;
        packageName?: string;
        price?: number;
        description?: string;
        trainerAddress?: string;
      }
    | undefined;
  BookingConfirmation:
    | {
        priceId?: string;
        trainerId?: string;
        trainerName?: string;
        packageName?: string;
        price?: number;
        description?: string;
        trainerAddress?: string;
        date?: string;
        time?: string;
        selectedSlots?: { date: string; time: string }[];
      }
    | undefined;
  BookingSuccess:
    | {
        trainerId?: string;
        trainerName?: string;
        packageName?: string;
        price?: number;
        dateTime?: string;
        location?: string;
        slotCount?: number;
      }
    | undefined;
  MyPosts: undefined;
  WorkoutHistory: undefined;
  Connections: undefined;
  ScheduledSessions: undefined;
  Achievements: undefined;
  MyRatings: { userId?: string; name?: string } | undefined;
  CreateWeeklyGoal: { goal?: WeeklyGoal } | undefined;
  UserProfile: { userId: string; user: any };
  TrainerSetup: undefined;
  MyBookings: undefined;
  RescheduleSession: { booking?: BookingData } | undefined;
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
  ShareWorkout:
    | {
        workoutId?: string;
        workoutTitle?: string;
        sessionId?: string;
      }
    | undefined;
};
