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
  useGetWorkoutSessionsQuery,
  useCreateWorkoutSessionMutation,
  useUpdateWorkoutSessionMutation,
  useDeleteWorkoutSessionMutation,
  useGetProgressGoalsQuery,
  useCreateProgressGoalMutation,
  useUpdateProgressGoalMutation,
  useDeleteProgressGoalMutation,
} = workoutApi;
