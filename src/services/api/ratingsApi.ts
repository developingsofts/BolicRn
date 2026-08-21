import { API_END_POINTS } from '../endPoints';
import type {
  RatingScore,
  RatingsListResponse,
  SubmitRatingResponse,
} from '../../types';
import { baseApi } from './baseApi';
import type { ApiResponse } from './types';

export interface SubmitRatingPayload {
  rateeId: number;
  score: RatingScore;
  review?: string;
}

export interface FetchUserRatingsPayload {
  userId: string | number;
  page?: number;
  limit?: number;
}

export const RATINGS_PAGE_SIZE = 10;

export const ratingsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    submitRating: builder.mutation<
      ApiResponse<SubmitRatingResponse>,
      SubmitRatingPayload
    >({
      query: (body) => ({
        url: API_END_POINTS.ratings.create,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Ratings'],
    }),

    getUserRatings: builder.query<
      ApiResponse<RatingsListResponse>,
      FetchUserRatingsPayload
    >({
      query: ({ userId, page = 1, limit = RATINGS_PAGE_SIZE }) => ({
        url: `${API_END_POINTS.ratings.userRatings(
          String(userId),
        )}?page=${page}&limit=${limit}`,
        method: 'GET',
      }),
      providesTags: ['Ratings'],
    }),
  }),
  overrideExisting: false,
});

export const { useSubmitRatingMutation, useGetUserRatingsQuery } = ratingsApi;
