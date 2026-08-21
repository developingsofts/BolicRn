import { API_END_POINTS } from '../endPoints';
import type { ActivityFeedResponse } from '../../types';
import { baseApi } from './baseApi';
import type { ApiResponse } from './types';

export interface ActivityFeedPayload {
  page?: number;
  limit?: number;
}

export const ACTIVITY_PAGE_SIZE = 20;

export const activityApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getActivityFeed: builder.query<
      ApiResponse<ActivityFeedResponse>,
      ActivityFeedPayload | void
    >({
      query: (args) => ({
        url: API_END_POINTS.activity.feed(
          args?.page ?? 1,
          args?.limit ?? ACTIVITY_PAGE_SIZE,
        ),
        method: 'GET',
      }),
      providesTags: ['Activity'],
    }),
  }),
  overrideExisting: false,
});

export const { useGetActivityFeedQuery } = activityApi;
