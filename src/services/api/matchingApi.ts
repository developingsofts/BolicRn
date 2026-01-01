import { API_END_POINTS } from "../endPoints";
import type { PotentialUsers, TrainingPartner, User } from "../../types";
import { baseApi } from "./baseApi";
import type { ApiResponse } from "./types";

interface SwipeUserResponse {
  match: boolean;
  swip: {
    id: number;
    swipedToId: number;
    swipedById: number;
    type: string;
  };
}

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
        method: "POST",
        body,
      }),
      invalidatesTags: ["Matching"],
    }),
    likePartner: builder.mutation<
      ApiResponse<{ success: boolean }>,
      PartnerActionPayload
    >({
      query: ({ partnerId }) => ({
        url: API_END_POINTS.matching.like,
        method: "POST",
        body: { partnerId },
      }),
      invalidatesTags: ["Matching"],
    }),
    dislikePartner: builder.mutation<
      ApiResponse<{ success: boolean }>,
      PartnerActionPayload
    >({
      query: ({ partnerId }) => ({
        url: API_END_POINTS.matching.dislike,
        method: "POST",
        body: { partnerId },
      }),
      invalidatesTags: ["Matching"],
    }),
    getMatches: builder.query<ApiResponse<TrainingPartner[]>, void>({
      query: () => ({
        url: API_END_POINTS.matching.matches,
        method: "GET",
      }),
      providesTags: ["Matching"],
    }),
    getPotentialMatches: builder.query<ApiResponse<PotentialUsers>, {page: number,limit: number}>({
      query: ({page, limit}) => ({
        url: `${API_END_POINTS.matching.potential}?page=${page}&limit=${limit}`,
        method: "GET",
      }),
      providesTags: ["Matching"],
    }),
    getPotentialUsers: builder.query<ApiResponse<PotentialUsers>, {page: number,limit: number}>({
      query: ({page, limit}) => ({
        url: `${API_END_POINTS.matching.partners}?page=${page}&limit=${limit}`,
        method: "GET",
        query: {page, limit},
      }),
      providesTags: ["Matching"],
    }),
    getPotentialTrainers: builder.query<ApiResponse<PotentialUsers>, {page: number,limit: number}>({
      query: ({page, limit}) => ({
        url: `${API_END_POINTS.matching.trainers}?page=${page}&limit=${limit}`,
        method: "GET",
      }),
      providesTags: ["Matching"],
    }),

    swipeUser: builder.mutation<
      ApiResponse<SwipeUserResponse>,
      { swipedToId: number; type: "Liked" | "Disliked" }
    >({
      query: (body) => ({
        url: API_END_POINTS.matching.swipe,
        method: "POST",
        body,
      }),
      invalidatesTags: ["FindMain"],
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
  useGetPotentialUsersQuery,
  useGetPotentialTrainersQuery,
  useSwipeUserMutation,
} = matchingApi;
