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
  date: string;
  time: string;
  price: PriceInfo;
  status: "upcomming" | "completed" | "canceled";
}

export interface CreateBookingRequest {
  trainer_id: string | number;
  price_id: string | number;
  date: string;
  time: string;
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

export interface CancelBookingRequest {
  id: number | string;
}

export interface RefundRequest {
  sessionId: number;
}

export interface ExpectedArrival {
  business_days?: number | null;
  estimated_date?: string | null;
}

/** `POST /booking/refund-quote` — snake_case keys, amounts in MINOR UNITS (cents). */
export interface RefundQuoteData {
  booking_id: number;
  currency: string;
  charged: number;
  already_refunded: number;
  refundable: number;
  fee: number;
  net: number;
  fee_percent: number;
  fee_fixed_minor: number;
  expected_arrival: ExpectedArrival | null;
  policy_text: string | null;
  payment_status: string;
  refundable_now: boolean;
  reason: string | null;
}

/** `POST /booking/cancel` — atomic cancel + refund. */
export interface AtomicCancelResult {
  booking: BookingData;
  refund: {
    refund_id: string;
    amount: number;
    currency: string;
    status: string;
    expected_arrival?: ExpectedArrival | null;
  } | null;
  refund_error: string | null;
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
      invalidatesTags: ["MyBookings","ScheduledSessions","UserProfile"],
    }),

    updateBooking: builder.mutation<ApiResponse<BookingData>, UpdateBookingRequest>({
      query: (body) => ({
        url: API_END_POINTS.bookings.update,
        method: "POST",
        body,
      }),
      invalidatesTags: ["MyBookings","ScheduledSessions","UserProfile"],
    }),

    /**
     * Soft-cancel: flips the booking's status to "canceled" so it survives in
     * the Canceled tab. Use this (optionally after refundBookingPayment) for
     * user-facing cancellation — never the hard-delete/refund endpoint alone.
     */
    cancelBooking: builder.mutation<ApiResponse<BookingData>, CancelBookingRequest>({
      query: ({ id }) => ({
        url: API_END_POINTS.bookings.update,
        method: "POST",
        body: { id, status: "canceled" },
      }),
      invalidatesTags: ["MyBookings","ScheduledSessions","UserProfile"],
    }),

    /**
     * Atomic cancel + refund (`POST /booking/cancel`). Prefer this over
     * cancelBooking + refundBookingPayment: one idempotent call that cancels,
     * refunds where a payment exists, and returns the refund figures. A retry
     * answers 200 with code "ALREADY_CANCELED" — treat as success. `refund` is
     * null for an unpaid session; `refund_error` set means the cancel landed
     * but the refund did not — surface it, never report plain success.
     */
    cancelBookingAtomic: builder.mutation<
      ApiResponse<AtomicCancelResult>,
      { id: string | number; reason?: string }
    >({
      query: (body) => ({
        url: API_END_POINTS.bookings.cancel,
        method: "POST",
        body,
      }),
      invalidatesTags: ["MyBookings","ScheduledSessions","UserProfile"],
    }),

    /**
     * Server-authored refund quote for the cancellation sheet. Amounts are in
     * minor units — divide by 100 at render time. `fee`/`expected_arrival`/
     * `policy_text` stay 0/null until the business configures them; render
     * nothing for nulls (never invent figures).
     */
    getRefundQuote: builder.query<
      ApiResponse<RefundQuoteData>,
      { id: string | number }
    >({
      query: (body) => ({
        url: API_END_POINTS.bookings.refundQuote,
        method: "POST",
        body,
      }),
      // A quote is a point-in-time read; don't serve a stale one to the sheet.
      keepUnusedDataFor: 0,
    }),

    /** Money side of a cancellation only. Does not change booking status. */
    refundBookingPayment: builder.mutation<ApiResponse<any>, RefundRequest>({
      query: (body) => ({
        url: API_END_POINTS.bookings.initiateRefund,
        method: "POST",
        body,
      }),
      invalidatesTags: ["MyBookings","ScheduledSessions","UserProfile"],
    }),

    /** @deprecated hard-deletes the record; use cancelBooking + refundBookingPayment. */
    deleteBooking: builder.mutation<ApiResponse<any>, RefundRequest>({
      query: (body) => ({
        url: API_END_POINTS.bookings.initiateRefund,
        method: "POST",
        body,
      }),
      invalidatesTags: ["MyBookings","ScheduledSessions","UserProfile"],
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
  useCancelBookingMutation,
  useCancelBookingAtomicMutation,
  useLazyGetRefundQuoteQuery,
  useRefundBookingPaymentMutation,
  useDeleteBookingMutation,
  useGetUserBookingsQuery,
  useGetTrainerBookingsQuery,
} = bookingApi;
