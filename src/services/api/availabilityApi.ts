import { API_END_POINTS } from "../endPoints";
import { baseApi } from "./baseApi";
import type { ApiResponse } from "./types";

export interface AvailabilitySlot {
  day: string;
  start_time: string;
  end_time: string;
}

export interface TrainerAvailability {
  id?: string;
  /** IANA timezone the record's wall-clock times live in; "UTC" on legacy rows. */
  timezone?: string | null;
  slots: AvailabilitySlot[];
}

/** Device IANA timezone (e.g. "Asia/Karachi"); undefined when unavailable. */
const deviceTimeZone = (): string | undefined => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || undefined;
  } catch {
    return undefined;
  }
};

/** Server-owned scheduling grid, returned alongside the records on `/list`. */
export interface AvailabilityGrid {
  timezone?: string | null;
  has_configured_availability?: boolean;
  slot_duration_minutes?: number;
  slot_buffer_minutes?: number;
  lead_time_minutes?: number;
  booking_horizon_days?: number;
}

export const availabilityApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createAvailability: builder.mutation<
      any,
      { slots: AvailabilitySlot[]; timezone?: string }
    >({
      query: (body) => ({
        url: API_END_POINTS.trainerAvailability.create,
        method: "POST",
        // Times are the trainer's wall clock; the IANA timezone tells the
        // server which zone that clock is in (it does all date-specific
        // UTC/DST conversion — BACKEND-CHANGES.md §6).
        body: { timezone: deviceTimeZone(), ...body },
      }),
      invalidatesTags: [
        "TrainerAvailability",
        "TrainerSetup",
        "SelectDateTime",
      ],
    }),
    updateAvailability: builder.mutation<
      any,
      { id: string | number; slots: AvailabilitySlot[]; timezone?: string }
    >({
      query: (body) => ({
        url: API_END_POINTS.trainerAvailability.update,
        method: "POST",
        // See createAvailability — wall-clock times plus the IANA timezone.
        body: { timezone: deviceTimeZone(), ...body },
      }),
      invalidatesTags: [
        "TrainerAvailability",
        "TrainerSetup",
        "SelectDateTime",
      ],
    }),
    getAvailability: builder.query<
      ApiResponse<TrainerAvailability[]> & { grid?: AvailabilityGrid },
      { trainerId: string | number }
    >({
      query: (body) => ({
        url: API_END_POINTS.trainerAvailability.list,
        method: "POST",
        body,
      }),
      // `/list` changed from `data: [records]` to `data: { records, ...grid }`
      // (timezone, slot/lead/horizon values). Normalise both shapes so every
      // consumer keeps reading an array; the grid rides along under `grid`.
      transformResponse: (res: any) => {
        const d = res?.data;
        if (d && typeof d === "object" && !Array.isArray(d) && Array.isArray(d.records)) {
          const { records, ...grid } = d;
          return { ...res, data: records, grid };
        }
        return res;
      },
      providesTags: ["TrainerAvailability", "TrainerSetup", "SelectDateTime"],
    }),
    deleteAvailability: builder.mutation<any, { id: string }>({
      query: ({ id }) => ({
        url: API_END_POINTS.trainerAvailability.delete,
        method: "POST",
        body: { ids: [id] },
      }),
      invalidatesTags: [
        "TrainerAvailability",
        "TrainerSetup",
        "SelectDateTime",
      ],
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
