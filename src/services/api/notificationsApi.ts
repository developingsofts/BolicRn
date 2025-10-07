import { API_END_POINTS } from '../endPoints';
import type { Notification, NotificationSettings } from '../../types';
import { baseApi } from './baseApi';
import type { ApiResponse } from './types';

interface NotificationActionPayload {
  notificationId: string;
}

interface UpdateSettingsPayload extends Partial<NotificationSettings> {}

export const notificationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getNotifications: builder.query<ApiResponse<Notification[]>, void>({
      query: () => ({
        url: API_END_POINTS.notifications.list,
        method: 'GET',
      }),
      providesTags: ['Notifications'],
    }),
    markNotificationAsRead: builder.mutation<
      ApiResponse<{ success: boolean }>,
      NotificationActionPayload
    >({
      query: ({ notificationId }) => ({
        url: API_END_POINTS.notifications.markAsRead(notificationId),
        method: 'PATCH',
        body: {},
      }),
      invalidatesTags: ['Notifications'],
    }),
    updateNotificationSettings: builder.mutation<
      ApiResponse<NotificationSettings>,
      UpdateSettingsPayload
    >({
      query: (settings) => ({
        url: API_END_POINTS.notifications.settings,
        method: 'PUT',
        body: settings,
      }),
      invalidatesTags: ['Notifications'],
    }),
    getNotificationSettings: builder.query<
      ApiResponse<NotificationSettings>,
      void
    >({
      query: () => ({
        url: API_END_POINTS.notifications.settings,
        method: 'GET',
      }),
      providesTags: ['Notifications'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetNotificationsQuery,
  useMarkNotificationAsReadMutation,
  useUpdateNotificationSettingsMutation,
  useGetNotificationSettingsQuery,
} = notificationsApi;
