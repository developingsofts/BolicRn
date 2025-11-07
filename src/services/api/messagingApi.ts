import { API_END_POINTS } from '../endPoints';
import { baseApi } from './baseApi';
import type { ApiResponse } from './types';
import type {
  Conversation,
  MessagesResponse,
  ChatMessage,
  ConversationType,
  MessageType,
  MessageReactionType,
} from '../../types';

interface FetchMessagesPayload {
  conversationId: string | number;
  page?: number;
  limit?: number;
}

interface SendMessagePayload {
  conversationId: string | number;
  content?: string;
  attachmentUrl?: string;
  messageType?: MessageType;
}

interface MarkConversationAsReadPayload {
  conversationId: string | number;
  messageIds?: Array<number | string>;
}

interface MarkMessageAsReadPayload {
  messageId: string | number;
}

interface ToggleMessageReactionPayload {
  messageId: string | number;
  reactionType?: MessageReactionType;
}

interface CreateConversationPayload {
  type?: ConversationType;
  name?: string;
  participantIds?: Array<number | string>;
  initialMessage?: string;
  attachmentUrl?: string;
  messageType?: MessageType;
}

export const messagingApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getConversations: builder.query<ApiResponse<Conversation[]>, void>({
      query: () => ({
        url: API_END_POINTS.messages.conversations,
        method: 'GET',
      }),
      providesTags: ['Messaging'],
    }),
    getMessages: builder.query<ApiResponse<MessagesResponse>, FetchMessagesPayload>({
      query: ({ conversationId, page, limit }) => ({
        url: API_END_POINTS.messages.conversationMessages(conversationId),
        method: 'GET',
        params: {
          ...(page ? { page } : {}),
          ...(limit ? { limit } : {}),
        },
      }),
      providesTags: ['Messaging'],
    }),
    sendMessage: builder.mutation<ApiResponse<ChatMessage>, SendMessagePayload>({
      query: ({ conversationId, ...body }) => ({
        url: API_END_POINTS.messages.sendMessage(conversationId),
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Messaging'],
    }),
    markConversationAsRead: builder.mutation<ApiResponse<{ updatedCount: number }>, MarkConversationAsReadPayload>({
      query: ({ conversationId, messageIds }) => ({
        url: API_END_POINTS.messages.markConversationAsRead(conversationId),
        method: 'POST',
        body: messageIds?.length ? { messageIds } : {},
      }),
      invalidatesTags: ['Messaging'],
    }),
    markMessageAsRead: builder.mutation<ApiResponse<{ updated: number }>, MarkMessageAsReadPayload>({
      query: ({ messageId }) => ({
        url: API_END_POINTS.messages.markMessageAsRead(messageId),
        method: 'POST',
        body: {},
      }),
      invalidatesTags: ['Messaging'],
    }),
    toggleMessageReaction: builder.mutation<
      ApiResponse<{ message: ChatMessage; isActive: boolean }>,
      ToggleMessageReactionPayload
    >({
      query: ({ messageId, reactionType = 'like' }) => ({
        url: API_END_POINTS.messages.toggleMessageReaction(messageId),
        method: 'POST',
        body: { reactionType },
      }),
      invalidatesTags: ['Messaging'],
    }),
    createConversation: builder.mutation<
      ApiResponse<{ conversation: Conversation; initialMessage?: ChatMessage | null }>,
      CreateConversationPayload
    >({
      query: (body) => ({
        url: API_END_POINTS.messages.conversations,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Messaging'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetConversationsQuery,
  useGetMessagesQuery,
  useLazyGetMessagesQuery,
  useSendMessageMutation,
  useMarkConversationAsReadMutation,
  useMarkMessageAsReadMutation,
  useCreateConversationMutation,
  useToggleMessageReactionMutation,
} = messagingApi;
