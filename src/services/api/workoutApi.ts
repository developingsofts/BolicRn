import { API_END_POINTS } from '../endPoints';
import type { Workout, Exercise, UserWorkoutSession, UserExerciseProgress, UserWorkout, Achievement } from '../../types';
import { baseApi } from './baseApi';
import type { ApiResponse } from './types';
import { use } from 'react';

interface StartWorkoutPayload {
  workoutId: string;
}

interface ActiveWorkoutSessionResponse {
  session: UserWorkoutSession;
  progress: UserExerciseProgress[];
}

interface CompleteExercisePayload {
  sessionId: string;
  workoutExerciseId: string;
  setNumber: number;
  repsCompleted?: number;
  durationCompleted?: number;
  weightUsed?: number;
  /** Unit for weightUsed. The server defaults to "kg" when omitted. */
  weightUnit?: 'kg' | 'lbs';
  notes?: string;
}

// `GET /workout/categories` — server-authored pairs mapping the display `type`
// ("Chest Workout") to a stable machine slug ("chest").
interface WorkoutCategoriesResponse {
  categories: { type: string; category: string }[];
}

interface WorkoutsResponse {
  workouts: Workout[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalWorkouts: number;
    limit: number;
    hasMore: boolean;
  };
}

interface WorkoutHistoryResponse {
  sessions: UserWorkoutSession[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalSessions: number;
    limit: number;
    hasMore: boolean;
  };
}

interface UserWorkoutsResponse {
  workouts: UserWorkout[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalWorkouts: number;
    limit: number;
    hasMore: boolean;
  };
}

export interface AchievementCatalogueItem {
  id?: number | string;
  achivenmentId?: number | string;
  achievementId?: number | string;
  key?: string;
  code?: string;
  slug?: string;
  type?: string;
  title?: string;
  name?: string;
  description?: string;
  icon?: string;
  progress?: number | null;
  currentProgress?: number | null;
  progressValue?: number | null;
  target?: number | null;
  maxProgress?: number | null;
  goal?: number | null;
  threshold?: number | null;
  earned?: boolean | null;
  unlocked?: boolean | null;
  earnedAt?: string | null;
}

// The catalogue endpoint may hand back a bare array or a wrapped list; both are tolerated.
export type AchievementCataloguePayload =
  | AchievementCatalogueItem[]
  | {
      achievements?: AchievementCatalogueItem[];
      achivements?: AchievementCatalogueItem[];
      items?: AchievementCatalogueItem[];
      data?: AchievementCatalogueItem[];
    };

export const workoutApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // `/workout/all` paginates at 10 by default, so callers that need the whole
    // catalogue (e.g. the workout picker) must pass an explicit limit.
    getWorkouts: builder.query<ApiResponse<WorkoutsResponse>, { page?: number; limit?: number; category?: string } | void>({
      query: (args) => {
        const params: string[] = [];
        if (args?.page) {
          params.push(`page=${args.page}`);
        }
        if (args?.limit) {
          params.push(`limit=${args.limit}`);
        }
        // Filters on the machine slug from `/workout/categories`, not the display string.
        if (args?.category) {
          params.push(`category=${encodeURIComponent(args.category)}`);
        }

        return {
          url: params.length
            ? `${API_END_POINTS.workouts.all}?${params.join('&')}`
            : API_END_POINTS.workouts.all,
          method: 'GET',
        };
      },
      providesTags: ['Workout'],
    }),

    getWorkoutById: builder.query<ApiResponse<Workout>, string>({
      query: (id) => ({
        url: API_END_POINTS.workouts.byId(id),
        method: 'GET',
      }),
      providesTags: ['Workout'],
    }),

    // Unauthenticated on the server; the authoritative display-type → slug mapping.
    getWorkoutCategories: builder.query<ApiResponse<WorkoutCategoriesResponse>, void>({
      query: () => ({
        url: API_END_POINTS.workouts.categories,
        method: 'GET',
      }),
      providesTags: ['Workout'],
    }),

    getExercises: builder.query<ApiResponse<Exercise[]>, void>({
      query: () => ({
        url: API_END_POINTS.exercises.all,
        method: 'GET',
      }),
      providesTags: ['Exercise'],
    }),

    getExerciseById: builder.query<ApiResponse<Exercise>, string>({
      query: (id) => ({
        url: API_END_POINTS.exercises.byId(id),
        method: 'GET',
      }),
      providesTags: ['Exercise'],
    }),

    startWorkoutSession: builder.mutation<ApiResponse<UserWorkoutSession>, StartWorkoutPayload>({
      query: (data) => ({
        url: API_END_POINTS.workouts.sessions.start,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['WorkoutSession'],
    }),

    getActiveWorkoutSession: builder.query<ApiResponse<ActiveWorkoutSessionResponse | null>, void>({
      query: () => ({
        url: API_END_POINTS.workouts.sessions.active,
        method: 'GET',
      }),
      providesTags: ['WorkoutSession'],
    }),

    completeExercise: builder.mutation<ApiResponse<UserExerciseProgress>, CompleteExercisePayload>({
      query: (data) => ({
        url: API_END_POINTS.workouts.sessions.completeExercise,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['WorkoutSession'],
    }),

    completeWorkoutSession: builder.mutation<ApiResponse<UserWorkoutSession>, { sessionId: string }>({
      query: ({ sessionId }) => ({
        url: API_END_POINTS.workouts.sessions.complete,
        method: 'POST',
        body: { sessionId },
      }),
      invalidatesTags: ['WorkoutSession', 'WeeklyGoal', 'Activity', 'User'],
    }),

    pauseWorkoutSession: builder.mutation<ApiResponse<UserWorkoutSession>, { sessionId: string }>({
      query: ({ sessionId }) => ({
        url: API_END_POINTS.workouts.sessions.pause,
        method: 'POST',
        body: { sessionId },
      }),
      invalidatesTags: ['WorkoutSession'],
    }),

    resumeWorkoutSession: builder.mutation<ApiResponse<UserWorkoutSession>, { sessionId: string }>({
      query: ({ sessionId }) => ({
        url: API_END_POINTS.workouts.sessions.resume,
        method: 'POST',
        body: { sessionId },
      }),
      invalidatesTags: ['WorkoutSession'],
    }),

    cancelWorkoutSession: builder.mutation<ApiResponse<UserWorkoutSession>, { sessionId: string }>({
      query: ({ sessionId }) => ({
        url: API_END_POINTS.workouts.sessions.cancel,
        method: 'POST',
        body: { sessionId },
      }),
      invalidatesTags: ['WorkoutSession'],
    }),

    getWorkoutHistory: builder.query<ApiResponse<WorkoutHistoryResponse>, void>({
      query: () => ({
        url: API_END_POINTS.workouts.sessions.history,
        method: 'GET',
      }),
      providesTags: ['WorkoutSession'],
    }),

    getUserWorkouts: builder.query<ApiResponse<UserWorkoutsResponse>, { page?: number; limit?: number }>({
      query: ({ page = 1, limit = 10 }) => ({
        url: `${API_END_POINTS.workouts.userWorkouts}?page=${page}&limit=${limit}`,
        method: 'GET',
      }),
      providesTags: ['UserWorkout'],
    }),

    // With `includeLocked` the server returns the FULL catalogue (earned and not),
    // each row carrying the requesting user's `progress`/`target` — instead of the
    // earned list only. Only meaningful for the caller's own profile.
    getUserAchievements: builder.query<ApiResponse<Achievement[]>, { userId?: string; includeLocked?: boolean }>({
      query: (body) => ({
        url: `${API_END_POINTS.users.achievements(body.userId ?? 'me')}${body.includeLocked ? '?include=locked' : ''}`,
        method: 'GET',
      }),
      providesTags: ['Achievements'],
    }),

    // Full achievement catalogue (every achievement that exists, earned or not).
    // The server shape is not pinned down yet, so this stays deliberately loose and
    // callers normalise it — see src/screens/Achievements.tsx.
    getAchievementCatalogue: builder.query<ApiResponse<AchievementCataloguePayload>, void>({
      query: () => ({
        url: API_END_POINTS.workouts.achievements,
        method: 'GET',
      }),
      providesTags: ['Achievements'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetWorkoutsQuery,
  useGetWorkoutByIdQuery,
  useGetWorkoutCategoriesQuery,
  useGetExercisesQuery,
  useGetExerciseByIdQuery,
  useStartWorkoutSessionMutation,
  useGetActiveWorkoutSessionQuery,
  useCompleteExerciseMutation,
  useCompleteWorkoutSessionMutation,
  usePauseWorkoutSessionMutation,
  useResumeWorkoutSessionMutation,
  useCancelWorkoutSessionMutation,
  useGetWorkoutHistoryQuery,
  useGetUserWorkoutsQuery,
  useGetUserAchievementsQuery,
  useGetAchievementCatalogueQuery,
} = workoutApi;
