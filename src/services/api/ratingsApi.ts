import { API_END_POINTS } from '../endPoints';
import type { Rating, UserRating } from '../../types';
import { baseApi } from './baseApi';
import type { ApiResponse } from './types';

interface SubmitRatingPayload extends Partial<Rating> {
  ratedUserId: string;
  stars: Rating['stars'];
  comment?: string;
  trainingSession?: Rating['trainingSession'];
}

interface UpdateRatingPayload {
  ratingId: string;
  data: Partial<Rating>;
}

interface DeleteRatingPayload {
  ratingId: string;
}

interface FetchUserRatingsPayload {
  userId: string;
}

export const ratingsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    submitRating: builder.mutation<
      ApiResponse<Rating>,
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
      ApiResponse<UserRating>,
      FetchUserRatingsPayload
    >({
      query: ({ userId }) => ({
        url: API_END_POINTS.ratings.userRatings(userId),
        method: 'GET',
      }),
      providesTags: ['Ratings'],
    }),
    updateRating: builder.mutation<ApiResponse<Rating>, UpdateRatingPayload>({
      query: ({ ratingId, data }) => ({
        url: API_END_POINTS.ratings.ratingById(ratingId),
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Ratings'],
    }),
    deleteRating: builder.mutation<
      ApiResponse<{ success: boolean }>,
      DeleteRatingPayload
    >({
      query: ({ ratingId }) => ({
        url: API_END_POINTS.ratings.ratingById(ratingId),
        method: 'DELETE',
      }),
      invalidatesTags: ['Ratings'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useSubmitRatingMutation,
  useGetUserRatingsQuery,
  useUpdateRatingMutation,
  useDeleteRatingMutation,
} = ratingsApi;
