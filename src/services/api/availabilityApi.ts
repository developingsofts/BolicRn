import { API_END_POINTS } from "../endPoints";
import { baseApi } from "./baseApi";
import type { ApiResponse } from "./types";

export interface AvailabilitySlot {
  day: string;
  start_time: string;
  end_time: string;
}

export interface TrainerAvailability {
  id?: string | number;
  slots: AvailabilitySlot[];
}

export const availabilityApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createAvailability: builder.mutation<any, { slots: AvailabilitySlot[] }>({
      query: (body) => ({
        url: API_END_POINTS.trainerAvailability.create,
        method: "POST",
        body,
      }),
      invalidatesTags: ["TrainerAvailability", "TrainerSetup"],
    }),
    updateAvailability: builder.mutation<
      any,
      { id: string | number; slots: AvailabilitySlot[] }
    >({
      query: (body) => ({
        url: API_END_POINTS.trainerAvailability.update,
        method: "POST",
        body,
      }),
      invalidatesTags: ["TrainerAvailability", "TrainerSetup"],
    }),
    getAvailability: builder.query<
      ApiResponse<TrainerAvailability[]>,
      { trainerId: string | number }
    >({
      query: (body) => ({
        url: API_END_POINTS.trainerAvailability.list,
        method: "POST",
        body,
      }),
      providesTags: ["TrainerAvailability", "TrainerSetup"],
    }),
    deleteAvailability: builder.mutation<any, { ids: (string | number)[] }>({
      query: (body) => ({
        url: API_END_POINTS.trainerAvailability.delete,
        method: "POST",
        body,
      }),
      invalidatesTags: ["TrainerAvailability", "TrainerSetup"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useCreateAvailabilityMutation,
  useUpdateAvailabilityMutation,
  useGetAvailabilityQuery,
  useDeleteAvailabilityMutation,
} = availabilityApi;
