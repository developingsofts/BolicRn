import { API_END_POINTS } from '../endPoints';
import { baseApi } from './baseApi';
import type { ApiResponse } from './types';

interface FollowPayload {
  followUserId: string;
}

interface UnfollowPayload {
  unfollowUserId: string;
}

export const followsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    followUser: builder.mutation<ApiResponse<any>, FollowPayload>({
      query: (body) => ({
        url: API_END_POINTS.follows.follow,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['User', 'Matching', 'Connections'],
    }),
    unfollowUser: builder.mutation<ApiResponse<any>, UnfollowPayload>({
      query: (body) => ({
        url: API_END_POINTS.follows.unfollow,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['User', 'Matching', 'Connections'],
    }),
    getFollowers: builder.query<ApiResponse<any>, { userId: string; page?: number; limit?: number }>({
      query: ({ userId, page = 1, limit = 10 }) => ({
        url: API_END_POINTS.follows.followers(userId, page, limit),
        method: 'GET',
      }),
      providesTags: ['User'],
    }),
    getFollowing: builder.query<ApiResponse<any>, { userId: string; page?: number; limit?: number }>({
      query: ({ userId, page = 1, limit = 10 }) => ({
        url: API_END_POINTS.follows.following(userId, page, limit),
        method: 'GET',
      }),
      providesTags: ['User'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useFollowUserMutation,
  useUnfollowUserMutation,
  useGetFollowersQuery,
  useGetFollowingQuery,
} = followsApi;
