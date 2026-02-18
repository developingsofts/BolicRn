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
  attachmentUrl?: string | { uri: string; type: string; name: string };
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
  attachmentUrl?: string | { uri: string; type: string; name: string };
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
      query: ({ conversationId, content, attachmentUrl, messageType }) => {
        // If attachmentUrl is a file object, use FormData
        if (attachmentUrl && typeof attachmentUrl === 'object' && 'uri' in attachmentUrl) {
          const formData = new FormData();
          if (content) formData.append('content', content);
          formData.append('messageType', messageType || 'image');
          formData.append('attachmentUrl', {
            uri: attachmentUrl.uri,
            type: attachmentUrl.type,
            name: attachmentUrl.name,
          } as any);
          
          return {
            url: API_END_POINTS.messages.sendMessage(conversationId),
            method: 'POST',
            body: formData,
          };
        }
        
        // Otherwise use regular JSON payload
        return {
          url: API_END_POINTS.messages.sendMessage(conversationId),
          method: 'POST',
          body: {
            content,
            attachmentUrl,
            messageType,
          },
        };
      },
    }),
    markConversationAsRead: builder.mutation<ApiResponse<{ updatedCount: number }>, MarkConversationAsReadPayload>({
      query: ({ conversationId, messageIds }) => ({
        url: API_END_POINTS.messages.markConversationAsRead(conversationId),
        method: 'POST',
        body: messageIds?.length ? { messageIds } : {},
      }),
    }),
    markMessageAsRead: builder.mutation<ApiResponse<{ updated: number }>, MarkMessageAsReadPayload>({
      query: ({ messageId }) => ({
        url: API_END_POINTS.messages.markMessageAsRead(messageId),
        method: 'POST',
        body: {},
      }),
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
    }),
    createConversation: builder.mutation<
      ApiResponse<{ conversation: Conversation; initialMessage?: ChatMessage | null }>,
      CreateConversationPayload
    >({
      query: (payload) => {
        // If attachmentUrl is a file object, use FormData
        if (payload.attachmentUrl && typeof payload.attachmentUrl === 'object' && 'uri' in payload.attachmentUrl) {
          const formData = new FormData();
          if (payload.type) formData.append('type', payload.type);
          if (payload.name) formData.append('name', payload.name);
          if (payload.participantIds && payload.participantIds.length > 0) {
            payload.participantIds.forEach((id) => {
              formData.append('participantIds[]', String(id));
            });
          }
          if (payload.initialMessage) formData.append('initialMessage', payload.initialMessage);
          formData.append('messageType', payload.messageType || 'image');
          formData.append('attachmentUrl', {
            uri: payload.attachmentUrl.uri,
            type: payload.attachmentUrl.type,
            name: payload.attachmentUrl.name,
          } as any);
          
          return {
            url: API_END_POINTS.messages.conversations,
            method: 'POST',
            body: formData,
          };
        }
        
        // Otherwise use regular JSON payload
        return {
          url: API_END_POINTS.messages.conversations,
          method: 'POST',
          body: payload,
        };
      },
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
