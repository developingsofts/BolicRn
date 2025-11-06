import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';
import { initializeSocket } from '../services/socketClient';
import {
  useCreateConversationMutation,
  useGetConversationsQuery,
  useGetMessagesQuery,
  useMarkConversationAsReadMutation,
  useSendMessageMutation,
} from '../services/api/messagingApi';
import type {
  ApiResponse,
  ApiSuccessResponse,
} from '../services/api/types';
import type {
  ChatMessage,
  Conversation,
  ConversationListItem,
  ConversationType,
  MessagesResponse,
  MessageType,
  MessageDeliveryStatus,
} from '../types';

const isSuccessResponse = <T,>(response?: ApiResponse<T>): response is ApiSuccessResponse<T> =>
  Boolean(response && response.status);

interface UseChatOptions {
  conversationId?: string | number;
  autoJoin?: boolean;
}

interface SendMessageArgs {
  conversationId: string | number;
  content?: string;
  attachmentUrl?: string;
  messageType?: MessageType;
}

interface CreateConversationArgs {
  type?: ConversationType;
  name?: string;
  participantIds?: Array<number | string>;
  initialMessage?: string;
  attachmentUrl?: string;
  messageType?: MessageType;
}

interface TypingPayload {
  conversationId: number;
  userId: number;
  isTyping: boolean;
}

interface MessageStatusPayload {
  conversationId: number;
  messageId: number;
  userId: number;
  status: MessageDeliveryStatus;
}

interface MessageReadPayload {
  conversationId: number;
  userId: number;
  messageIds?: number[];
}

export const useChat = ({ conversationId, autoJoin = true }: UseChatOptions = {}) => {
  const { token, user } = useAuth();
  const userIdNumeric = useMemo(() => (user?.id ? Number(user.id) : null), [user?.id]);
  const numericConversationId = useMemo(
    () => (conversationId !== undefined && conversationId !== null ? Number(conversationId) : undefined),
    [conversationId]
  );

  const socketRef = useRef<Socket | null>(null);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typingUsers, setTypingUsers] = useState<number[]>([]);
  const [chatError, setChatError] = useState<string | null>(null);

  const {
    data: conversationsResponse,
    isFetching: isFetchingConversations,
    refetch: refetchConversations,
  } = useGetConversationsQuery(undefined, { skip: !token });

  const {
    data: messagesResponse,
    isFetching: isFetchingMessages,
    refetch: refetchMessages,
  } = useGetMessagesQuery(
    { conversationId: numericConversationId ?? 0, limit: 50 },
    { skip: !token || numericConversationId === undefined }
  );

  const [sendMessageMutation] = useSendMessageMutation();
  const [markConversationAsReadMutation] = useMarkConversationAsReadMutation();
  const [createConversationMutation] = useCreateConversationMutation();

  const conversations: ConversationListItem[] = useMemo(() => {
    if (!isSuccessResponse(conversationsResponse)) {
      return [];
    }

    return (conversationsResponse.data ?? []).map((conversation: Conversation) => {
      const latestMessage = conversation.messages?.[0] ?? null;
      const unreadCount = latestMessage?.statuses?.filter((status) => {
        if (userIdNumeric == null) {
          return false;
        }
        return status.userId === userIdNumeric && status.status !== 'read';
      }).length;

      return {
        ...conversation,
        latestMessage: latestMessage ?? null,
        unreadCount: unreadCount ?? 0,
      } as ConversationListItem;
    });
  }, [conversationsResponse, userIdNumeric]);

  useEffect(() => {
    if (!token) {
      return;
    }

    const instance = initializeSocket(token);
    socketRef.current = instance;

    const handleConnect = () => {
      setIsSocketConnected(true);
      instance.emit('load_conversations');
      if (autoJoin && numericConversationId !== undefined) {
        instance.emit('join_conversation', { conversationId: numericConversationId });
      }
    };

    const handleDisconnect = () => {
      setIsSocketConnected(false);
    };

    const handleError = (payload: { message?: string }) => {
      setChatError(payload?.message ?? 'Chat connection error');
    };

    const handleNewMessage = (incoming: ChatMessage) => {
      void refetchConversations();

      setMessages((prev) => {
        if (incoming.conversationId !== (numericConversationId ?? -1)) {
          return prev;
        }

        const exists = prev.some((message) => message.id === incoming.id);
        const next = exists
          ? prev.map((message) => (message.id === incoming.id ? incoming : message))
          : [...prev, incoming];

        return next.sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      });

      if (incoming.conversationId === numericConversationId && userIdNumeric != null && incoming.senderId !== userIdNumeric) {
        instance.emit('mark_as_read', {
          conversationId: incoming.conversationId,
          messageIds: [incoming.id],
        });
      }
    };

    const handleMessageStatus = ({
      messageId,
      status,
      conversationId: payloadConversationId,
      userId: statusUserId,
    }: MessageStatusPayload) => {
      if (payloadConversationId !== (numericConversationId ?? -1)) {
        return;
      }
      setMessages((prev) =>
        prev.map((message) => {
          if (message.id !== messageId) {
            return message;
          }
          const statuses = message.statuses ?? [];
          const updatedStatuses = statuses.map((item) =>
            item.userId === statusUserId ? { ...item, status } : item
          );
          return {
            ...message,
            statuses: updatedStatuses,
          };
        })
      );
    };

    const handleMessageRead = ({ conversationId: payloadConversationId, messageIds, userId: statusUserId }: MessageReadPayload) => {
      if (payloadConversationId !== (numericConversationId ?? -1)) {
        return;
      }
      if (!messageIds?.length) {
        return;
      }
      setMessages((prev) =>
        prev.map((message) => {
          if (!messageIds.includes(message.id)) {
            return message;
          }
          const statuses = message.statuses ?? [];
          const updatedStatuses = statuses.map((item) =>
            item.userId === statusUserId ? { ...item, status: 'read' as MessageDeliveryStatus } : item
          );
          return {
            ...message,
            statuses: updatedStatuses,
          };
        })
      );
    };

    const handleTyping = ({ conversationId: payloadConversationId, userId: typingUserId, isTyping }: TypingPayload) => {
      if (
        payloadConversationId !== (numericConversationId ?? -1) ||
        typingUserId == null ||
        userIdNumeric === typingUserId
      ) {
        return;
      }

      setTypingUsers((prev) => {
        if (isTyping) {
          return prev.includes(typingUserId) ? prev : [...prev, typingUserId];
        }
        return prev.filter((id) => id !== typingUserId);
      });
    };

    instance.on('connect', handleConnect);
    instance.on('disconnect', handleDisconnect);
    instance.on('chat_error', handleError);
    instance.on('new_message', handleNewMessage);
    instance.on('message_status', handleMessageStatus);
    instance.on('message_read', handleMessageRead);
    instance.on('typing', handleTyping);

    return () => {
      instance.off('connect', handleConnect);
      instance.off('disconnect', handleDisconnect);
      instance.off('chat_error', handleError);
      instance.off('new_message', handleNewMessage);
      instance.off('message_status', handleMessageStatus);
      instance.off('message_read', handleMessageRead);
      instance.off('typing', handleTyping);
    };
  }, [token, autoJoin, numericConversationId, userIdNumeric, refetchConversations]);

  useEffect(() => {
    if (!isSuccessResponse(messagesResponse)) {
      setMessages([]);
      return;
    }

    const remoteMessages = messagesResponse.data?.messages ?? [];

    const sortedMessages = [...remoteMessages].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    setMessages(sortedMessages);
  }, [messagesResponse]);

  useEffect(() => {
    if (!socketRef.current || numericConversationId === undefined || !autoJoin) {
      return;
    }

    socketRef.current.emit('join_conversation', { conversationId: numericConversationId });
  }, [numericConversationId, autoJoin]);

  const refreshConversationsHandler = useCallback(async () => {
    if (!token) {
      return;
    }
    await refetchConversations();
    socketRef.current?.emit('load_conversations');
  }, [refetchConversations, token]);

  const refreshMessagesHandler = useCallback(async () => {
    if (numericConversationId === undefined) {
      return;
    }
    await refetchMessages();
  }, [numericConversationId, refetchMessages]);

  const sendMessage = useCallback(
    async ({ conversationId: targetConversationId, content, attachmentUrl, messageType = 'text' }: SendMessageArgs) => {
      const payloadConversationId = Number(targetConversationId);
      const socket = socketRef.current;

      if (socket && isSocketConnected) {
        socket.emit('send_message', {
          conversationId: payloadConversationId,
          content: content ?? null,
          attachmentUrl: attachmentUrl ?? null,
          messageType,
        });
      } else {
        await sendMessageMutation({
          conversationId: payloadConversationId,
          content,
          attachmentUrl,
          messageType,
        }).unwrap().catch(() => undefined);
      }
    },
    [isSocketConnected, sendMessageMutation]
  );

  const emitTyping = useCallback(
    (isTyping: boolean) => {
      if (!socketRef.current || numericConversationId === undefined) {
        return;
      }
      socketRef.current.emit('typing', {
        conversationId: numericConversationId,
        isTyping,
      });
    },
    [numericConversationId]
  );

  const markConversationAsRead = useCallback(
    async (messageIds?: Array<number | string>) => {
      if (numericConversationId === undefined) {
        return;
      }
      const messageIdNumbers = messageIds?.map(Number).filter((id) => !Number.isNaN(id));

      socketRef.current?.emit('mark_as_read', {
        conversationId: numericConversationId,
        ...(messageIdNumbers?.length ? { messageIds: messageIdNumbers } : {}),
      });

      await markConversationAsReadMutation({
        conversationId: numericConversationId,
        messageIds: messageIdNumbers,
      }).unwrap().catch(() => undefined);
    },
    [numericConversationId, markConversationAsReadMutation]
  );

  const createConversation = useCallback(
    async (payload: CreateConversationArgs) => {
      const response = await createConversationMutation(payload).unwrap();
      if (response.status) {
        await refreshConversationsHandler();
      }
      return response;
    },
    [createConversationMutation, refreshConversationsHandler]
  );

  return {
    socket: socketRef.current,
    isSocketConnected,
    conversations,
    isFetchingConversations,
    refreshConversations: refreshConversationsHandler,
    messages,
    isFetchingMessages,
    refreshMessages: refreshMessagesHandler,
    sendMessage,
    emitTyping,
    typingUsers,
    markConversationAsRead,
    createConversation,
    chatError,
  };
};

export type UseChatReturn = ReturnType<typeof useChat>;
