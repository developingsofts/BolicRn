import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';
import { initializeSocket } from '../services/socketClient';
import {
  useCreateConversationMutation,
  useGetConversationsQuery,
  useLazyGetMessagesQuery,
  useMarkConversationAsReadMutation,
  useSendMessageMutation,
  useToggleMessageReactionMutation,
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
  MessageType,
  MessageDeliveryStatus,
  MessageReactionType,
} from '../types';

const isSuccessResponse = <T,>(response?: ApiResponse<T>): response is ApiSuccessResponse<T> =>
  Boolean(response && response.status);

const DEFAULT_MESSAGES_PAGE_SIZE = 30;

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
  const [conversationItems, setConversationItems] = useState<ConversationListItem[]>([]);
  const [typingUsers, setTypingUsers] = useState<number[]>([]);
  const [chatError, setChatError] = useState<string | null>(null);
  const [currentMessagesPage, setCurrentMessagesPage] = useState(0);
  const [, setTotalMessagePages] = useState<number | null>(null);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [isLoadingInitialMessages, setIsLoadingInitialMessages] = useState(false);
  const [isLoadingOlderMessages, setIsLoadingOlderMessages] = useState(false);

  const [fetchMessagesTrigger] = useLazyGetMessagesQuery();

  const fetchMessagesPage = useCallback(
    async (page: number, { append = false }: { append?: boolean } = {}) => {
      if (!token || numericConversationId === undefined) {
        return;
      }

      if (page <= 1 && !append) {
        setIsLoadingInitialMessages(true);
      } else {
        setIsLoadingOlderMessages(true);
      }

      try {
        const result = await fetchMessagesTrigger({
          conversationId: numericConversationId,
          page,
          limit: DEFAULT_MESSAGES_PAGE_SIZE,
        }).unwrap();

        if (!isSuccessResponse(result)) {
          throw new Error(result?.message ?? 'Failed to fetch messages');
        }

        const fetchedMessages = result.data?.messages ?? [];
        const sortedFetched = [...fetchedMessages].sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );

        setMessages((prev) => {
          if (page <= 1 && !append) {
            return sortedFetched;
          }

          const existingIds = new Set(prev.map((message) => message.id));
          const merged = [
            ...sortedFetched.filter((message) => !existingIds.has(message.id)),
            ...prev,
          ];

          return merged.sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        });

        const paginationInfo = result.data?.pagination;
        const reportedCurrentPage = paginationInfo?.currentPage ?? page;
        const reportedTotalPages = (() => {
          if (paginationInfo?.totalPages != null) {
            return Math.max(paginationInfo.totalPages, paginationInfo.totalPages > 0 ? 1 : paginationInfo.totalPages);
          }

          if (paginationInfo?.totalItems != null) {
            const limit = paginationInfo.limit ?? DEFAULT_MESSAGES_PAGE_SIZE;
            return Math.max(Math.ceil(paginationInfo.totalItems / limit), 0);
          }

          if (fetchedMessages.length === DEFAULT_MESSAGES_PAGE_SIZE) {
            return page + 1;
          }

          return page;
        })();

        setCurrentMessagesPage(reportedCurrentPage);
        setTotalMessagePages(reportedTotalPages);

        const hasMore = (() => {
          if (paginationInfo?.totalPages != null) {
            return reportedCurrentPage < paginationInfo.totalPages;
          }
          return fetchedMessages.length === DEFAULT_MESSAGES_PAGE_SIZE;
        })();

        setHasMoreMessages(hasMore);
      } catch (error) {
        console.error('Failed to fetch messages', error);
        if (page <= 1 && !append) {
          setMessages([]);
          setCurrentMessagesPage(0);
          setTotalMessagePages(null);
          setHasMoreMessages(false);
        }
      } finally {
        if (page <= 1 && !append) {
          setIsLoadingInitialMessages(false);
        } else {
          setIsLoadingOlderMessages(false);
        }
      }
    },
    [fetchMessagesTrigger, numericConversationId, token]
  );

  const loadOlderMessages = useCallback(async () => {
    if (
      !hasMoreMessages ||
      isLoadingOlderMessages ||
      isLoadingInitialMessages ||
      numericConversationId === undefined
    ) {
      return;
    }

    const nextPage = currentMessagesPage >= 1 ? currentMessagesPage + 1 : 2;
    await fetchMessagesPage(nextPage, { append: true });
  }, [
    currentMessagesPage,
    fetchMessagesPage,
    hasMoreMessages,
    isLoadingInitialMessages,
    isLoadingOlderMessages,
    numericConversationId,
  ]);

  const applyUpdatedMessage = useCallback(
    (updatedMessage: ChatMessage) => {
      const targetConversationId = Number(updatedMessage.conversationId);
      if (Number.isNaN(targetConversationId)) {
        return;
      }

      setMessages((prev) => {
        if (targetConversationId !== (numericConversationId ?? -1)) {
          return prev;
        }

        let found = false;

        const next = prev.map((message) => {
          if (message.id === updatedMessage.id) {
            found = true;
            return updatedMessage;
          }
          return message;
        });

        return found ? next : prev;
      });

      setConversationItems((prev) =>
        prev.map((conversationItem) => {
          if (Number(conversationItem.id) !== targetConversationId) {
            return conversationItem;
          }

          const latestMessage =
            conversationItem.latestMessage && conversationItem.latestMessage.id === updatedMessage.id
              ? updatedMessage
              : conversationItem.latestMessage;

          const messagesCollection = conversationItem.messages
            ? conversationItem.messages.map((message) =>
                message.id === updatedMessage.id ? updatedMessage : message
              )
            : conversationItem.messages;

          return {
            ...conversationItem,
            latestMessage,
            messages: messagesCollection,
          };
        })
      );
    },
    [numericConversationId]
  );

  const {
    data: conversationsResponse,
    isFetching: isFetchingConversations,
    refetch: refetchConversations,
  } = useGetConversationsQuery(undefined, { skip: !token });

  const [sendMessageMutation] = useSendMessageMutation();
  const [markConversationAsReadMutation] = useMarkConversationAsReadMutation();
  const [createConversationMutation] = useCreateConversationMutation();
  const [toggleMessageReactionMutation] = useToggleMessageReactionMutation();

  const mappedConversations: ConversationListItem[] = useMemo(() => {
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
    setConversationItems(mappedConversations);
  }, [mappedConversations]);

  useEffect(() => {
    if (!token) {
      return;
    }

  const instance = initializeSocket(token);
  socketRef.current = instance;

  setIsSocketConnected(instance.connected);

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
      console.log('Received new message via socket:', incoming);
      const incomingConversationId = Number(incoming.conversationId);
      if (Number.isNaN(incomingConversationId)) {
        return;
      }

      setMessages((prev) => {
        if (incomingConversationId !== (numericConversationId ?? -1)) {
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

      setConversationItems((prev) => {
        const index = prev.findIndex((item) => Number(item.id) === incomingConversationId);
        const isFromSelf = userIdNumeric != null && incoming.senderId === userIdNumeric;

        if (index === -1) {
          if (!isFromSelf) {
            void refetchConversations();
          }
          return prev;
        }

        const existing = prev[index];
        const latestMatches = existing.latestMessage?.id === incoming.id;
        const shouldIncrementUnread = !isFromSelf && incomingConversationId !== (numericConversationId ?? -1) && !latestMatches;
        const updatedUnreadCount = shouldIncrementUnread
          ? (existing.unreadCount ?? 0) + 1
          : (numericConversationId === incomingConversationId || isFromSelf ? 0 : existing.unreadCount ?? 0);

        const updatedConversation: ConversationListItem = {
          ...existing,
          latestMessage: incoming,
          unreadCount: updatedUnreadCount,
          updatedAt: incoming.createdAt ?? existing.updatedAt,
        };

        const next = [...prev];
        next[index] = updatedConversation;

        return next
          .slice()
          .sort((a, b) => {
            const aTime = new Date(a.latestMessage?.createdAt ?? a.updatedAt ?? 0).getTime();
            const bTime = new Date(b.latestMessage?.createdAt ?? b.updatedAt ?? 0).getTime();
            return bTime - aTime;
          });
      });

      if (
        incomingConversationId === numericConversationId &&
        userIdNumeric != null &&
        incoming.senderId !== userIdNumeric
      ) {
        instance.emit('mark_as_read', {
          conversationId: incomingConversationId,
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
      const normalizedConversationId = Number(payloadConversationId);
      if (Number.isNaN(normalizedConversationId) || normalizedConversationId !== (numericConversationId ?? -1)) {
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

      setConversationItems((prev) =>
        prev.map((conversationItem) => {
          if (Number(conversationItem.id) !== normalizedConversationId) {
            return conversationItem;
          }

          const updatedLatest =
            conversationItem.latestMessage && conversationItem.latestMessage.id === messageId
              ? {
                  ...conversationItem.latestMessage,
                  statuses: (conversationItem.latestMessage.statuses ?? []).map((item) =>
                    item.userId === statusUserId ? { ...item, status } : item
                  ),
                }
              : conversationItem.latestMessage;

          return {
            ...conversationItem,
            latestMessage: updatedLatest,
          };
        })
      );
    };

    const handleMessageRead = ({ conversationId: payloadConversationId, messageIds, userId: statusUserId }: MessageReadPayload) => {
      const normalizedConversationId = Number(payloadConversationId);
      if (Number.isNaN(normalizedConversationId) || normalizedConversationId !== (numericConversationId ?? -1)) {
        return;
      }
      const ensuredMessageIds = messageIds ?? [];
      if (!ensuredMessageIds.length) {
        return;
      }
      setMessages((prev) =>
        prev.map((message) => {
          if (!ensuredMessageIds.includes(message.id)) {
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

      setConversationItems((prev) =>
        prev.map((conversationItem) => {
          if (Number(conversationItem.id) !== normalizedConversationId) {
            return conversationItem;
          }

          const updatedLatest =
            conversationItem.latestMessage && conversationItem.latestMessage.id && ensuredMessageIds.includes(conversationItem.latestMessage.id)
              ? {
                  ...conversationItem.latestMessage,
                  statuses: (conversationItem.latestMessage.statuses ?? []).map((item) =>
                    item.userId === statusUserId ? { ...item, status: 'read' as MessageDeliveryStatus } : item
                  ),
                }
              : conversationItem.latestMessage;

          return {
            ...conversationItem,
            latestMessage: updatedLatest,
          };
        })
      );
    };

    const handleMessageReaction = (updated: ChatMessage) => {
      applyUpdatedMessage(updated);
    };

    const handleTyping = ({ conversationId: payloadConversationId, userId: typingUserId, isTyping }: TypingPayload) => {
      const normalizedConversationId = Number(payloadConversationId);
      if (
        Number.isNaN(normalizedConversationId) ||
        normalizedConversationId !== (numericConversationId ?? -1) ||
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
    instance.on('message_reaction', handleMessageReaction);
    instance.on('typing', handleTyping);

    return () => {
      instance.off('connect', handleConnect);
      instance.off('disconnect', handleDisconnect);
      instance.off('chat_error', handleError);
      instance.off('new_message', handleNewMessage);
      instance.off('message_status', handleMessageStatus);
      instance.off('message_read', handleMessageRead);
      instance.off('message_reaction', handleMessageReaction);
      instance.off('typing', handleTyping);
    };
  }, [token, autoJoin, numericConversationId, userIdNumeric, refetchConversations, applyUpdatedMessage]);

  useEffect(() => {
    setMessages([]);
    setCurrentMessagesPage(0);
    setTotalMessagePages(null);
    setHasMoreMessages(false);

    if (!token || numericConversationId === undefined) {
      setIsLoadingInitialMessages(false);
      setIsLoadingOlderMessages(false);
      return;
    }

    void fetchMessagesPage(1, { append: false });
  }, [fetchMessagesPage, numericConversationId, token]);

  useEffect(() => {
    if (numericConversationId === undefined) {
      return;
    }

    setConversationItems((prev) =>
      prev.map((conversationItem) => {
        if (Number(conversationItem.id) !== numericConversationId) {
          return conversationItem;
        }

        const latestMessage = messages[messages.length - 1] ?? conversationItem.latestMessage ?? null;

        return {
          ...conversationItem,
          latestMessage,
          unreadCount: 0,
          updatedAt: latestMessage?.createdAt ?? conversationItem.updatedAt,
        };
      })
    );
  }, [messages, numericConversationId]);

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
    if (!token || numericConversationId === undefined) {
      return;
    }
    await fetchMessagesPage(1, { append: false });
  }, [fetchMessagesPage, numericConversationId, token]);

  const sendMessage = useCallback(
    async ({ conversationId: targetConversationId, content, attachmentUrl, messageType = 'text' }: SendMessageArgs) => {
      const payloadConversationId = Number(targetConversationId);
      const socket = socketRef.current;
      const socketIsActive = socket?.connected ?? false;

      if (socket && socketIsActive) {
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
    [sendMessageMutation]
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

  const toggleMessageReaction = useCallback(
    async (messageId: number | string, reactionType: MessageReactionType = 'like') => {
      const numericMessageId = Number(messageId);
      if (Number.isNaN(numericMessageId)) {
        return;
      }

      const socket = socketRef.current;
      const socketIsActive = socket?.connected ?? false;

      if (socket && socketIsActive) {
        socket.emit('toggle_reaction', {
          messageId: numericMessageId,
          reactionType,
        });
        return;
      }

      try {
        const response = await toggleMessageReactionMutation({
          messageId: numericMessageId,
          reactionType,
        }).unwrap();

        if (response?.status && response.data?.message) {
          applyUpdatedMessage(response.data.message);
        }
      } catch {
        // Intentionally suppressed – UI can remain optimistic when offline
      }
    },
    [toggleMessageReactionMutation, applyUpdatedMessage]
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

      setConversationItems((prev) =>
        prev.map((conversationItem) =>
          Number(conversationItem.id) === numericConversationId
            ? {
                ...conversationItem,
                unreadCount: 0,
              }
            : conversationItem
        )
      );
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
  conversations: conversationItems,
    isFetchingConversations,
    refreshConversations: refreshConversationsHandler,
    messages,
    isFetchingMessages: isLoadingInitialMessages,
    isLoadingOlderMessages,
    hasMoreMessages,
    loadOlderMessages,
    refreshMessages: refreshMessagesHandler,
    sendMessage,
    emitTyping,
  toggleMessageReaction,
    typingUsers,
    markConversationAsRead,
    createConversation,
    chatError,
  };
};

export type UseChatReturn = ReturnType<typeof useChat>;
