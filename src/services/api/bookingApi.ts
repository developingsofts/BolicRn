import { API_END_POINTS } from "../endPoints";
import { baseApi } from "./baseApi";
import type { ApiResponse } from "./types";

export interface PriceInfo {
  id: number;
  title: string;
  description: string;
  price: number;
}

export interface TrainerInfo {
  id: number;
  name: string;
  email: string;
}

export interface UserInfo {
  id: number;
  name: string;
  email: string;
}

export interface BookingData {
  id: number;
  trainer: TrainerInfo;
  user: UserInfo;
  date: string; // ISO format: "2025-12-10T00:00:00.000Z"
  time: string; // e.g., "10:00AM"
  price: PriceInfo;
  status: "upcomming" | "completed" | "canceled";
}

export interface CreateBookingRequest {
  trainer_id: string | number;
  price_id: string | number;
  date: string; // e.g., "12/10/2025"
  time: string; // e.g., "10:00AM"
  status: "upcomming" | "completed" | "canceled";
}

export interface UpdateBookingRequest {
  id: number | string;
  price_id?: string;
  date?: string;
  time?: string;
  status?: "upcomming" | "completed" | "canceled";
}

export interface DeleteBookingRequest {
  id: number | string;
  status?: "canceled"|"upcomming";
}

export interface PaginationInfo {
  page: number;
  limit: number;
  totalPages: number;
}

export interface UserBookingsRequest {
  user_id: number | string;
  status?: "upcomming" | "completed" | "canceled";
  page?: number;
  limit?: number;
}

export interface TrainerBookingsRequest {
  trainer_id: number | string;
  status?: "upcomming" | "completed" | "canceled";
  page?: number;
  limit?: number;
}

export interface BookingsListResponse {
  bookings: BookingData[];
  pagination: PaginationInfo;
}

export const bookingApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createBooking: builder.mutation<ApiResponse<BookingData>, CreateBookingRequest>({
      query: (body) => ({
        url: API_END_POINTS.bookings.create,
        method: "POST",
        body,
      }),
      invalidatesTags: ["MyBookings","UserProfile"],
    }),

    updateBooking: builder.mutation<ApiResponse<BookingData>, UpdateBookingRequest>({
      query: (body) => ({
        url: API_END_POINTS.bookings.update,
        method: "POST",
        body,
      }),
      invalidatesTags: ["MyBookings","UserProfile"],
    }),

    deleteBooking: builder.mutation<ApiResponse<any>, DeleteBookingRequest>({
      query: (body) => ({
        url: API_END_POINTS.bookings.update,
        method: "POST",
        body,
      }),
      invalidatesTags: ["MyBookings","UserProfile"],
    }),

    getUserBookings: builder.query<ApiResponse<BookingsListResponse>, UserBookingsRequest>({
      query: (body) => ({
        url: API_END_POINTS.bookings.userBookings,
        method: "POST",
        body,
      }),
      providesTags: ["MyBookings","ScheduledSessions"],
    }),

    getTrainerBookings: builder.query<ApiResponse<BookingsListResponse>, TrainerBookingsRequest>({
      query: (body) => ({
        url: API_END_POINTS.bookings.trainerBookings,
        method: "POST",
        body,
      }),
      providesTags: ["MyBookings"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useCreateBookingMutation,
  useUpdateBookingMutation,
  useDeleteBookingMutation,
  useGetUserBookingsQuery,
  useGetTrainerBookingsQuery,
} = bookingApi;
