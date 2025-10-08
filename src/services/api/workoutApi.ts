import { API_END_POINTS } from '../endPoints';
import type { ProgressGoal, WorkoutSession } from '../../types';
import { baseApi } from './baseApi';
import type { ApiResponse } from './types';

interface WorkoutSessionPayload extends Partial<WorkoutSession> {
  userId?: string;
}

interface UpdateWorkoutSessionPayload {
  sessionId: string;
  data: Partial<WorkoutSession>;
}

interface DeleteWorkoutSessionPayload {
  sessionId: string;
}

interface ProgressGoalPayload extends Partial<ProgressGoal> {
  userId?: string;
}

interface UpdateProgressGoalPayload {
  goalId: string;
  data: Partial<ProgressGoal>;
}

interface DeleteProgressGoalPayload {
  goalId: string;
}

export const workoutApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get user's completed workouts with pagination
    getUserWorkouts: builder.query<
      ApiResponse<{ workouts: any[]; pagination: any }>, 
      { page?: number; limit?: number } | void
    >({
      query: (params) => {
        const page = params?.page || 1;
        const limit = params?.limit || 3;
        return {
          url: `/user-workout/all?page=${page}&limit=${limit}`,
          method: 'GET',
        };
      },
      providesTags: ['Workout'],
      // Support for infinite scroll - merge results
      serializeQueryArgs: ({ endpointName }) => {
        // Use same cache key for all pages to enable merging
        return endpointName;
      },
      merge: (currentCache, newItems, { arg }) => {
        // If page 1 or no arg, return fresh data
        if (!arg || arg.page === 1) {
          return newItems;
        }
        
        // Merge results for page > 1
        if ('data' in currentCache && 'data' in newItems && currentCache.status && newItems.status) {
          return {
            ...newItems,
            data: {
              workouts: [
                ...(currentCache.data?.workouts || []),
                ...(newItems.data?.workouts || [])
              ],
              pagination: newItems.data?.pagination
            }
          };
        }
        
        return newItems;
      },
      forceRefetch({ currentArg, previousArg }) {
        return currentArg?.page !== previousArg?.page;
      },
    }),
    getWorkoutSessions: builder.query<ApiResponse<WorkoutSession[]>, string>({
      query: (userId) => ({
        url: API_END_POINTS.workouts.sessions(userId),
        method: 'GET',
      }),
      providesTags: ['Workout'],
    }),
    createWorkoutSession: builder.mutation<
      ApiResponse<WorkoutSession>,
      WorkoutSessionPayload
    >({
      query: (data) => ({
        url: API_END_POINTS.workouts.sessions(),
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Workout'],
    }),
    updateWorkoutSession: builder.mutation<
      ApiResponse<WorkoutSession>,
      UpdateWorkoutSessionPayload
    >({
      query: ({ sessionId, data }) => ({
        url: API_END_POINTS.workouts.sessionById(sessionId),
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Workout'],
    }),
    deleteWorkoutSession: builder.mutation<
      ApiResponse<{ success: boolean }>,
      DeleteWorkoutSessionPayload
    >({
      query: ({ sessionId }) => ({
        url: API_END_POINTS.workouts.sessionById(sessionId),
        method: 'DELETE',
      }),
      invalidatesTags: ['Workout'],
    }),
    getProgressGoals: builder.query<ApiResponse<ProgressGoal[]>, string>({
      query: (userId) => ({
        url: API_END_POINTS.workouts.goals(userId),
        method: 'GET',
      }),
      providesTags: ['Workout'],
    }),
    createProgressGoal: builder.mutation<
      ApiResponse<ProgressGoal>,
      ProgressGoalPayload
    >({
      query: (data) => ({
        url: API_END_POINTS.workouts.goals(),
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Workout'],
    }),
    updateProgressGoal: builder.mutation<
      ApiResponse<ProgressGoal>,
      UpdateProgressGoalPayload
    >({
      query: ({ goalId, data }) => ({
        url: API_END_POINTS.workouts.goalById(goalId),
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Workout'],
    }),
    deleteProgressGoal: builder.mutation<
      ApiResponse<{ success: boolean }>,
      DeleteProgressGoalPayload
    >({
      query: ({ goalId }) => ({
        url: API_END_POINTS.workouts.goalById(goalId),
        method: 'DELETE',
      }),
      invalidatesTags: ['Workout'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetUserWorkoutsQuery,
  useGetWorkoutSessionsQuery,
  useCreateWorkoutSessionMutation,
  useUpdateWorkoutSessionMutation,
  useDeleteWorkoutSessionMutation,
  useGetProgressGoalsQuery,
  useCreateProgressGoalMutation,
  useUpdateProgressGoalMutation,
  useDeleteProgressGoalMutation,
} = workoutApi;
