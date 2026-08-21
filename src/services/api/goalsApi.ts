import { API_END_POINTS } from '../endPoints';
import type { WeeklyGoalResponse, WeeklyGoalType } from '../../types';
import { baseApi } from './baseApi';
import type { ApiResponse } from './types';

export interface SaveWeeklyGoalPayload {
  type: WeeklyGoalType;
  target: number;
  title?: string;
}

export const goalsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getWeeklyGoal: builder.query<ApiResponse<WeeklyGoalResponse>, void>({
      query: () => ({
        url: API_END_POINTS.weeklyGoal.current,
        method: 'GET',
      }),
      providesTags: ['WeeklyGoal'],
    }),

    saveWeeklyGoal: builder.mutation<
      ApiResponse<WeeklyGoalResponse>,
      SaveWeeklyGoalPayload
    >({
      query: (body) => ({
        url: API_END_POINTS.weeklyGoal.save,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['WeeklyGoal'],
    }),

    deleteWeeklyGoal: builder.mutation<ApiResponse<{ deleted: boolean }>, void>({
      query: () => ({
        url: API_END_POINTS.weeklyGoal.remove,
        method: 'DELETE',
      }),
      invalidatesTags: ['WeeklyGoal'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetWeeklyGoalQuery,
  useSaveWeeklyGoalMutation,
  useDeleteWeeklyGoalMutation,
} = goalsApi;
