import { API_END_POINTS } from '../endPoints';
import type { UserProfile, UserStats, User } from '../../types';
import { baseApi } from './baseApi';
import type { ApiResponse } from './types';

interface UpdateProfilePayload {
  userId: string;
  profile: Partial<UserProfile>;
}

interface UpdateStatsPayload {
  userId: string;
  stats: Partial<UserStats>;
}

export const userApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get current user profile (requires auth token)
    getMyProfile: builder.query<ApiResponse<User>, void>({
      query: () => ({
        url: '/user/get',
        method: 'GET',
      }),
      providesTags: ['User'],
    }),
    // Update current user profile (requires auth token)
    updateMyProfile: builder.mutation<ApiResponse<User>, Partial<User> & { trainingTypes?: string[] }>({
      query: (userData) => ({
        url: '/user/update',
        method: 'PUT',
        body: userData,
      }),
      invalidatesTags: ['User'],
    }),
    getUserProfile: builder.query<ApiResponse<UserProfile>, string>({
      query: (userId) => ({
        url: API_END_POINTS.users.profile(userId),
        method: 'GET',
      }),
      providesTags: ['User'],
    }),
    updateUserProfile: builder.mutation<ApiResponse<UserProfile>, UpdateProfilePayload>({
      query: ({ userId, profile }) => ({
        url: API_END_POINTS.users.profile(userId),
        method: 'PUT',
        body: profile,
      }),
      invalidatesTags: ['User'],
    }),
    getUserStats: builder.query<ApiResponse<UserStats>, string>({
      query: (userId) => ({
        url: API_END_POINTS.users.stats(userId),
        method: 'GET',
      }),
      providesTags: ['User'],
    }),
    updateUserStats: builder.mutation<ApiResponse<UserStats>, UpdateStatsPayload>({
      query: ({ userId, stats }) => ({
        url: API_END_POINTS.users.stats(userId),
        method: 'PUT',
        body: stats,
      }),
      invalidatesTags: ['User'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetMyProfileQuery,
  useLazyGetMyProfileQuery,
  useUpdateMyProfileMutation,
  useGetUserProfileQuery,
  useUpdateUserProfileMutation,
  useGetUserStatsQuery,
  useUpdateUserStatsMutation,
} = userApi;
