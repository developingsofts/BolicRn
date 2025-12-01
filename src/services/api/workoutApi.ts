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

// Get user achievements

export const workoutApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get all workouts
    getWorkouts: builder.query<ApiResponse<WorkoutsResponse>, void>({
      query: () => ({
        url: API_END_POINTS.workouts.all,
        method: 'GET',
      }),
      providesTags: ['Workout'],
    }),

    // Get workout by ID
    getWorkoutById: builder.query<ApiResponse<Workout>, string>({
      query: (id) => ({
        url: API_END_POINTS.workouts.byId(id),
        method: 'GET',
      }),
      providesTags: ['Workout'],
    }),

    // Get all exercises
    getExercises: builder.query<ApiResponse<Exercise[]>, void>({
      query: () => ({
        url: API_END_POINTS.exercises.all,
        method: 'GET',
      }),
      providesTags: ['Exercise'],
    }),

    // Get exercise by ID
    getExerciseById: builder.query<ApiResponse<Exercise>, string>({
      query: (id) => ({
        url: API_END_POINTS.exercises.byId(id),
        method: 'GET',
      }),
      providesTags: ['Exercise'],
    }),

    // Start workout session
    startWorkoutSession: builder.mutation<ApiResponse<UserWorkoutSession>, StartWorkoutPayload>({
      query: (data) => ({
        url: API_END_POINTS.workouts.sessions.start,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['WorkoutSession'],
    }),

    // Get active workout session
    getActiveWorkoutSession: builder.query<ApiResponse<ActiveWorkoutSessionResponse | null>, void>({
      query: () => ({
        url: API_END_POINTS.workouts.sessions.active,
        method: 'GET',
      }),
      providesTags: ['WorkoutSession'],
    }),

    // Complete exercise
    completeExercise: builder.mutation<ApiResponse<UserExerciseProgress>, CompleteExercisePayload>({
      query: (data) => ({
        url: API_END_POINTS.workouts.sessions.completeExercise,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['WorkoutSession'],
    }),

    // Complete workout session
    completeWorkoutSession: builder.mutation<ApiResponse<UserWorkoutSession>, { sessionId: string }>({
      query: ({ sessionId }) => ({
        url: API_END_POINTS.workouts.sessions.complete,
        method: 'POST',
        body: { sessionId },
      }),
      invalidatesTags: ['WorkoutSession'],
    }),

    // Pause workout session
    pauseWorkoutSession: builder.mutation<ApiResponse<UserWorkoutSession>, { sessionId: string }>({
      query: ({ sessionId }) => ({
        url: API_END_POINTS.workouts.sessions.pause,
        method: 'POST',
        body: { sessionId },
      }),
      invalidatesTags: ['WorkoutSession'],
    }),

    // Resume workout session
    resumeWorkoutSession: builder.mutation<ApiResponse<UserWorkoutSession>, { sessionId: string }>({
      query: ({ sessionId }) => ({
        url: API_END_POINTS.workouts.sessions.resume,
        method: 'POST',
        body: { sessionId },
      }),
      invalidatesTags: ['WorkoutSession'],
    }),

    // Cancel workout session
    cancelWorkoutSession: builder.mutation<ApiResponse<UserWorkoutSession>, { sessionId: string }>({
      query: ({ sessionId }) => ({
        url: API_END_POINTS.workouts.sessions.cancel,
        method: 'POST',
        body: { sessionId },
      }),
      invalidatesTags: ['WorkoutSession'],
    }),

    // Get workout history
    getWorkoutHistory: builder.query<ApiResponse<WorkoutHistoryResponse>, void>({
      query: () => ({
        url: API_END_POINTS.workouts.sessions.history,
        method: 'GET',
      }),
      providesTags: ['WorkoutSession'],
    }),

    // Get user workouts
    getUserWorkouts: builder.query<ApiResponse<UserWorkoutsResponse>, { page?: number; limit?: number }>({
      query: ({ page = 1, limit = 10 }) => ({
        url: `${API_END_POINTS.workouts.userWorkouts}?page=${page}&limit=${limit}`,
        method: 'GET',
      }),
      providesTags: ['UserWorkout'],
    }),

    // Get user achievements
    getUserAchievements: builder.query<ApiResponse<Achievement[]>, { userId?: string }>({
      query: (body) => ({
        url: API_END_POINTS.users.achievements(body.userId??'me'),
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
} = workoutApi;
