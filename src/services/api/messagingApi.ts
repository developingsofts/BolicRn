import { API_END_POINTS } from '../endPoints';
import { baseApi } from './baseApi';
import type { ApiResponse } from './types';

interface ConversationResponse {
  id: string;
  partnerId: string;
  partnerName: string;
  lastMessage?: string;
  updatedAt: string;
  unreadCount?: number;
}

interface MessageResponse {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
  read: boolean;
  type?: string;
}

interface FetchMessagesPayload {
  conversationId: string;
}

interface SendMessagePayload {
  content: string;
  conversationId: string;
  receiverId: string;
  type?: string;
}

interface MessageActionPayload {
  messageId: string;
}

export const messagingApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getConversations: builder.query<
      ApiResponse<ConversationResponse[]>,
      void
    >({
      query: () => ({
        url: API_END_POINTS.messages.conversations,
        method: 'GET',
      }),
      providesTags: ['Messaging'],
    }),
    getMessages: builder.query<
      ApiResponse<MessageResponse[]>,
      FetchMessagesPayload
    >({
      query: ({ conversationId }) => ({
        url: API_END_POINTS.messages.conversationById(conversationId),
        method: 'GET',
      }),
      providesTags: ['Messaging'],
    }),
    sendMessage: builder.mutation<
      ApiResponse<MessageResponse>,
      SendMessagePayload
    >({
      query: (body) => ({
        url: API_END_POINTS.messages.send,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Messaging'],
    }),
    markMessageAsRead: builder.mutation<
      ApiResponse<{ success: boolean }>,
      MessageActionPayload
    >({
      query: ({ messageId }) => ({
        url: API_END_POINTS.messages.markAsRead(messageId),
        method: 'PATCH',
        body: {},
      }),
      invalidatesTags: ['Messaging'],
    }),
    deleteMessage: builder.mutation<
      ApiResponse<{ success: boolean }>,
      MessageActionPayload
    >({
      query: ({ messageId }) => ({
        url: API_END_POINTS.messages.delete(messageId),
        method: 'DELETE',
      }),
      invalidatesTags: ['Messaging'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetConversationsQuery,
  useGetMessagesQuery,
  useSendMessageMutation,
  useMarkMessageAsReadMutation,
  useDeleteMessageMutation,
} = messagingApi;
