import { API_END_POINTS } from '../endPoints';
import type { TrainingPartner } from '../../types';
import { baseApi } from './baseApi';
import type { ApiResponse } from './types';

interface NearbyPartnersPayload {
  location: {
    latitude: number;
    longitude: number;
  };
  radius?: number;
}

interface PartnerActionPayload {
  partnerId: string;
}

export const matchingApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    findNearbyPartners: builder.mutation<
      ApiResponse<TrainingPartner[]>,
      NearbyPartnersPayload
    >({
      query: (body) => ({
        url: API_END_POINTS.matching.nearby,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Matching'],
    }),
    likePartner: builder.mutation<
      ApiResponse<{ success: boolean }>,
      PartnerActionPayload
    >({
      query: ({ partnerId }) => ({
        url: API_END_POINTS.matching.like,
        method: 'POST',
        body: { partnerId },
      }),
      invalidatesTags: ['Matching'],
    }),
    dislikePartner: builder.mutation<
      ApiResponse<{ success: boolean }>,
      PartnerActionPayload
    >({
      query: ({ partnerId }) => ({
        url: API_END_POINTS.matching.dislike,
        method: 'POST',
        body: { partnerId },
      }),
      invalidatesTags: ['Matching'],
    }),
    getMatches: builder.query<ApiResponse<TrainingPartner[]>, void>({
      query: () => ({
        url: API_END_POINTS.matching.matches,
        method: 'GET',
      }),
      providesTags: ['Matching'],
    }),
    getPotentialMatches: builder.query<
      ApiResponse<TrainingPartner[]>,
      void
    >({
      query: () => ({
        url: API_END_POINTS.matching.potential,
        method: 'GET',
      }),
      providesTags: ['Matching'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useFindNearbyPartnersMutation,
  useLikePartnerMutation,
  useDislikePartnerMutation,
  useGetMatchesQuery,
  useGetPotentialMatchesQuery,
} = matchingApi;
