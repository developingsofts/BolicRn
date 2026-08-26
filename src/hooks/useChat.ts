import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Socket } from "socket.io-client";
import { useAuth } from "../contexts/AuthContext";
import { initializeSocket } from "../services/socketClient";
import {
  messagingApi,
  useCreateConversationMutation,
  useGetConversationsQuery,
  useLazyGetMessagesQuery,
  useMarkConversationAsReadMutation,
  useSendMessageMutation,
  useToggleMessageReactionMutation,
} from "../services/api/messagingApi";
import { useAppDispatch } from "../store/hooks";
import type { ApiResponse, ApiSuccessResponse } from "../services/api/types";
import type {
  ChatMessage,
  Conversation,
  ConversationListItem,
  ConversationType,
  MessageType,
  MessageDeliveryStatus,
  MessageStatus,
  MessageReactionType,
} from "../types";

const isSuccessResponse = <T>(
  response?: ApiResponse<T>
): response is ApiSuccessResponse<T> => Boolean(response && response.status);

const DEFAULT_MESSAGES_PAGE_SIZE = 30;

const sortMessagesByDate = (messages: ChatMessage[]) =>
  messages
    .slice()
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

const mergeMessageCollections = (
  existing: ChatMessage[],
  incoming: ChatMessage[]
) => {
  if (!existing.length) {
    return sortMessagesByDate(incoming);
  }

  if (!incoming.length) {
    return sortMessagesByDate(existing);
  }

  const mergedMap = new Map<number, ChatMessage>();

  for (const message of existing) {
    mergedMap.set(message.id, message);
  }

  for (const message of incoming) {
    mergedMap.set(message.id, message);
  }

  return sortMessagesByDate(Array.from(mergedMap.values()));
};

const generateTemporaryMessageId = () =>
  -Math.floor(Date.now() + Math.random() * 1000);

const normalizeMessageContent = (value?: string | null) => value?.trim() ?? "";

const mergeMessageIntoCollection = (
  collection: ChatMessage[],
  incoming: ChatMessage,
  matchedTempId?: number
): ChatMessage[] => {
  if (matchedTempId != null) {
    const filtered = collection.filter(
      (item) => item.id !== matchedTempId && item.id !== incoming.id
    );
    filtered.push(incoming);
    return sortMessagesByDate(filtered);
  }

  const next = collection.slice();

  const existingIndex = next.findIndex((item) => item.id === incoming.id);
  if (existingIndex !== -1) {
    next[existingIndex] = incoming;
    return sortMessagesByDate(next);
  }

  next.push(incoming);
  return sortMessagesByDate(next);
};

type CachedConversationMessages = {
  messages: ChatMessage[];
  currentPage: number;
  totalPages: number | null;
  hasMore: boolean;
};

type PendingMessageMetadata = {
  conversationId: number;
  content: string;
  attachmentUrl: string | null;
  messageType: MessageType;
  createdAt: string;
};

const conversationMessageCache = new Map<number, CachedConversationMessages>();

interface UseChatOptions {
  conversationId?: string | number;
  autoJoin?: boolean;
}

interface SendMessageArgs {
  conversationId: string | number;
  content?: string;
  attachmentUrl?: string | { uri: string; type: string; name: string };
  messageType?: MessageType;
}

interface CreateConversationArgs {
  type?: ConversationType;
  name?: string;
  participantIds?: Array<number | string>;
  initialMessage?: string;
  attachmentUrl?: string | { uri: string; type: string; name: string };
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

export const useChat = ({
  conversationId,
  autoJoin = true,
}: UseChatOptions = {}) => {
  const { token, user } = useAuth();
  const userIdNumeric = useMemo(
    () => (user?.id ? Number(user.id) : null),
    [user?.id]
  );
  const numericConversationId = useMemo(
    () =>
      conversationId !== undefined && conversationId !== null
        ? Number(conversationId)
        : undefined,
    [conversationId]
  );
  const cachedConversation = useMemo(
    () =>
      numericConversationId !== undefined
        ? conversationMessageCache.get(numericConversationId)
        : undefined,
    [numericConversationId]
  );

  const dispatch = useAppDispatch();
  const socketRef = useRef<Socket | null>(null);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(
    cachedConversation?.messages ?? []
  );
  const messagesRef = useRef<ChatMessage[]>(cachedConversation?.messages ?? []);
  const pendingMessagesRef = useRef<Map<number, PendingMessageMetadata>>(
    new Map()
  );
  const lastMarkedMessageIdRef = useRef<Map<number, number>>(new Map());
  const [conversationItems, setConversationItems] = useState<
    ConversationListItem[]
  >([]);
  const [typingUsers, setTypingUsers] = useState<number[]>([]);
  const [chatError, setChatError] = useState<string | null>(null);
  const [currentMessagesPage, setCurrentMessagesPage] = useState(
    cachedConversation?.currentPage ?? 0
  );
  const [, setTotalMessagePages] = useState<number | null>(
    cachedConversation?.totalPages ?? null
  );
  const [hasMoreMessages, setHasMoreMessages] = useState(
    cachedConversation?.hasMore ?? false
  );
  const [isLoadingInitialMessages, setIsLoadingInitialMessages] =
    useState(false);
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
          throw new Error(result?.message ?? "Failed to fetch messages");
        }

        const fetchedMessages = result.data?.messages ?? [];
        const sortedFetched = [...fetchedMessages].sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );

        let updatedMessages: ChatMessage[] = [];

        setMessages((prev) => {
          if (page <= 1 && !append) {
            const merged = mergeMessageCollections(prev, sortedFetched);
            updatedMessages = merged;
            return merged;
          }

          const existingIds = new Set(prev.map((message) => message.id));
          const merged = [
            ...sortedFetched.filter((message) => !existingIds.has(message.id)),
            ...prev,
          ];

          updatedMessages = merged.sort(
            (a, b) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );

          return updatedMessages;
        });

        if (updatedMessages.length === 0) {
          updatedMessages = mergeMessageCollections([], sortedFetched);
        }

        const paginationInfo = result.data?.pagination;
        const reportedCurrentPage = paginationInfo?.currentPage ?? page;
        const reportedTotalPages = (() => {
          if (paginationInfo?.totalPages != null) {
            return Math.max(
              paginationInfo.totalPages,
              paginationInfo.totalPages > 0 ? 1 : paginationInfo.totalPages
            );
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

        if (numericConversationId !== undefined) {
          conversationMessageCache.set(numericConversationId, {
            messages: updatedMessages,
            currentPage: reportedCurrentPage,
            totalPages: reportedTotalPages,
            hasMore,
          });
        }
      } catch (error) {
        console.error("Failed to fetch messages", error);
        if (page <= 1 && !append) {
          setMessages([]);
          setCurrentMessagesPage(0);
          setTotalMessagePages(null);
          setHasMoreMessages(false);
          if (numericConversationId !== undefined) {
            conversationMessageCache.delete(numericConversationId);
          }
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

      const existingCache = conversationMessageCache.get(targetConversationId);

      if (existingCache) {
        conversationMessageCache.set(targetConversationId, {
          ...existingCache,
          messages: existingCache.messages.map((message) =>
            message.id === updatedMessage.id
              ? { ...message, ...updatedMessage }
              : message
          ),
        });
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
            conversationItem.latestMessage &&
            conversationItem.latestMessage.id === updatedMessage.id
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

  const integrateMessage = useCallback(
    (
      incoming: ChatMessage,
      {
        skipPendingResolution = false,
        finalize = false,
      }: { skipPendingResolution?: boolean; finalize?: boolean } = {}
    ) => {
      const incomingConversationId = Number(incoming.conversationId);
      if (Number.isNaN(incomingConversationId)) {
        return;
      }

      const isFromSelf =
        userIdNumeric != null && incoming.senderId === userIdNumeric;
      let matchedTempId: number | undefined;

      if (isFromSelf && !skipPendingResolution) {
        for (const [tempId, pending] of pendingMessagesRef.current.entries()) {
          // An upload's attachment URL *always* changes: the optimistic bubble
          // holds the local `file://` URI and the server returns the stored
          // remote URL. Requiring them to be equal meant a sent image never
          // matched its own optimistic bubble, so both rendered — the same
          // photo twice. For a local upload, any remote URL coming back is the
          // match.
          const pendingIsLocalUpload =
            typeof pending.attachmentUrl === "string" &&
            pending.attachmentUrl.startsWith("file://");

          const attachmentMatches = pendingIsLocalUpload
            ? Boolean(incoming.attachmentUrl)
            : (pending.attachmentUrl ?? null) ===
              (incoming.attachmentUrl ?? null);

          if (
            pending.conversationId === incomingConversationId &&
            pending.messageType === incoming.messageType &&
            pending.content === normalizeMessageContent(incoming.content) &&
            attachmentMatches
          ) {
            matchedTempId = tempId;
            pendingMessagesRef.current.delete(tempId);
            break;
          }
        }
      }

      const existingCache = conversationMessageCache.get(
        incomingConversationId
      );
      const baseMessages =
        existingCache?.messages && existingCache.messages.length
          ? existingCache.messages
          : incomingConversationId === (numericConversationId ?? -1)
          ? messagesRef.current
          : [];

      const normalizedMessage = finalize
        ? { ...incoming, isOptimistic: false, sendFailed: false }
        : incoming;

      const mergedMessages = mergeMessageIntoCollection(
        baseMessages,
        normalizedMessage,
        matchedTempId
      );

      const fallbackCurrentPage =
        existingCache?.currentPage ??
        (incomingConversationId === (numericConversationId ?? -1)
          ? currentMessagesPage > 0
            ? currentMessagesPage
            : 1
          : 1);

      const fallbackHasMore =
        existingCache?.hasMore ??
        (incomingConversationId === (numericConversationId ?? -1)
          ? hasMoreMessages
          : false);

      conversationMessageCache.set(incomingConversationId, {
        messages: mergedMessages,
        currentPage: fallbackCurrentPage,
        totalPages: existingCache?.totalPages ?? null,
        hasMore: fallbackHasMore,
      });

      dispatch(
        messagingApi.util.updateQueryData(
          "getMessages",
          {
            conversationId: incomingConversationId,
            page: 1,
            limit: DEFAULT_MESSAGES_PAGE_SIZE,
          },
          (draft) => {
            if (!draft || draft.status === false) {
              return;
            }

            if (!draft.data) {
              draft.data = {
                messages: [],
                pagination: {
                  currentPage: 1,
                  limit: DEFAULT_MESSAGES_PAGE_SIZE,
                  totalItems: 0,
                  totalPages: 1,
                },
              };
            }

            const existingDraftMessages = draft.data?.messages ?? [];
            const sanitizedDraftMessages =
              matchedTempId != null
                ? existingDraftMessages.filter(
                    (message) => message.id !== matchedTempId
                  )
                : existingDraftMessages;

            const mergedDraftMessages = mergeMessageCollections(
              sanitizedDraftMessages,
              [normalizedMessage]
            );

            const trimmedMessages =
              mergedDraftMessages.length > DEFAULT_MESSAGES_PAGE_SIZE
                ? mergedDraftMessages.slice(
                    mergedDraftMessages.length - DEFAULT_MESSAGES_PAGE_SIZE
                  )
                : mergedDraftMessages;

            draft.data.messages = trimmedMessages;

            if (draft.data.pagination) {
              draft.data.pagination.currentPage = 1;
              draft.data.pagination.limit = DEFAULT_MESSAGES_PAGE_SIZE;
              draft.data.pagination.totalItems = Math.max(
                draft.data.pagination.totalItems ?? trimmedMessages.length,
                trimmedMessages.length
              );
              draft.data.pagination.totalPages = Math.max(
                1,
                Math.ceil(
                  (draft.data.pagination.totalItems ?? trimmedMessages.length) /
                    DEFAULT_MESSAGES_PAGE_SIZE
                )
              );
            } else {
              draft.data.pagination = {
                currentPage: 1,
                limit: DEFAULT_MESSAGES_PAGE_SIZE,
                totalItems: trimmedMessages.length,
                totalPages: 1,
              };
            }
          }
        )
      );

      if (incomingConversationId === (numericConversationId ?? -1)) {
        setMessages(mergedMessages);
      }

      setConversationItems((prev) => {
        const index = prev.findIndex(
          (item) => Number(item.id) === incomingConversationId
        );

        if (index === -1) {
          if (!isFromSelf && socketRef.current) {
            socketRef.current.emit("join_conversation", {
              conversationId: incomingConversationId,
            });
          }
          return prev;
        }

        const existing = prev[index];
        const latestMatches =
          existing.latestMessage?.id === normalizedMessage.id;
        const shouldIncrementUnread =
          !isFromSelf &&
          incomingConversationId !== (numericConversationId ?? -1) &&
          !latestMatches;

        const updatedUnreadCount = shouldIncrementUnread
          ? (existing.unreadCount ?? 0) + 1
          : incomingConversationId === (numericConversationId ?? -1) ||
            isFromSelf
          ? 0
          : existing.unreadCount ?? 0;

        const updatedConversation: ConversationListItem = {
          ...existing,
          latestMessage: normalizedMessage,
          unreadCount: updatedUnreadCount,
          updatedAt: normalizedMessage.createdAt ?? existing.updatedAt,
          messages: existing.messages
            ? mergeMessageIntoCollection(
                existing.messages,
                normalizedMessage,
                matchedTempId
              )
            : existing.messages,
        };

        const next = [...prev];
        next[index] = updatedConversation;

        return next.slice().sort((a, b) => {
          const aTime = new Date(
            a.latestMessage?.createdAt ?? a.updatedAt ?? 0
          ).getTime();
          const bTime = new Date(
            b.latestMessage?.createdAt ?? b.updatedAt ?? 0
          ).getTime();
          return bTime - aTime;
        });
      });
    },
    [
      currentMessagesPage,
      dispatch,
      hasMoreMessages,
      numericConversationId,
      userIdNumeric,
    ]
  );

  const markMessageAsFailed = useCallback(
    (conversationId: number, tempId: number) => {
      pendingMessagesRef.current.delete(tempId);

      const existingCache = conversationMessageCache.get(conversationId);
      const baseMessages =
        existingCache?.messages && existingCache.messages.length
          ? existingCache.messages
          : conversationId === (numericConversationId ?? -1)
          ? messagesRef.current
          : [];

      const updatedMessages = baseMessages.map((message) =>
        message.id === tempId
          ? { ...message, isOptimistic: false, sendFailed: true }
          : message
      );

      const fallbackCurrentPage =
        existingCache?.currentPage ??
        (conversationId === (numericConversationId ?? -1)
          ? currentMessagesPage > 0
            ? currentMessagesPage
            : 1
          : 1);

      const fallbackHasMore =
        existingCache?.hasMore ??
        (conversationId === (numericConversationId ?? -1)
          ? hasMoreMessages
          : false);

      conversationMessageCache.set(conversationId, {
        messages: updatedMessages,
        currentPage: fallbackCurrentPage,
        totalPages: existingCache?.totalPages ?? null,
        hasMore: fallbackHasMore,
      });

      dispatch(
        messagingApi.util.updateQueryData(
          "getMessages",
          {
            conversationId,
            page: 1,
            limit: DEFAULT_MESSAGES_PAGE_SIZE,
          },
          (draft) => {
            if (
              !draft ||
              draft.status === false ||
              !draft.data?.messages?.length
            ) {
              return;
            }

            draft.data.messages = draft.data.messages.map((message) =>
              message.id === tempId
                ? { ...message, isOptimistic: false, sendFailed: true }
                : message
            );
          }
        )
      );

      if (conversationId === (numericConversationId ?? -1)) {
        setMessages(updatedMessages);
      }

      setConversationItems((prev) =>
        prev.map((conversationItem) => {
          if (Number(conversationItem.id) !== conversationId) {
            return conversationItem;
          }

          const updatedLatest =
            conversationItem.latestMessage &&
            conversationItem.latestMessage.id === tempId
              ? {
                  ...conversationItem.latestMessage,
                  isOptimistic: false,
                  sendFailed: true,
                }
              : conversationItem.latestMessage;

          return {
            ...conversationItem,
            latestMessage: updatedLatest,
            messages: conversationItem.messages
              ? conversationItem.messages.map((message) =>
                  message.id === tempId
                    ? { ...message, isOptimistic: false, sendFailed: true }
                    : message
                )
              : conversationItem.messages,
          };
        })
      );
    },
    [currentMessagesPage, dispatch, hasMoreMessages, numericConversationId]
  );

  const handleConversationUpsert = useCallback(
    (incoming: Conversation) => {
      if (!incoming) {
        return;
      }

      const normalizedId = Number(incoming.id);

      if (Number.isNaN(normalizedId)) {
        return;
      }

      const latestMessage =
        (incoming as ConversationListItem).latestMessage ??
        incoming.messages?.[0] ??
        null;

      const unreadCount = (() => {
        if (!latestMessage || userIdNumeric == null) {
          return 0;
        }

        const statuses = latestMessage.statuses ?? [];
        return statuses.filter(
          (status) =>
            status.userId === userIdNumeric && status.status !== "read"
        ).length;
      })();

      const updatedConversation: ConversationListItem = {
        ...(incoming as unknown as ConversationListItem),
        latestMessage: latestMessage ?? null,
        unreadCount,
      };

      setConversationItems((prev) => {
        const next = [...prev];
        const index = next.findIndex(
          (item) => Number(item.id) === normalizedId
        );

        if (index === -1) {
          next.unshift(updatedConversation);
        } else {
          const existing = next[index];
          next[index] = {
            ...existing,
            ...updatedConversation,
            latestMessage:
              updatedConversation.latestMessage ??
              existing.latestMessage ??
              null,
            messages: updatedConversation.messages ?? existing.messages,
            members: updatedConversation.members ?? existing.members,
            unreadCount: updatedConversation.unreadCount,
            updatedAt: updatedConversation.updatedAt ?? existing.updatedAt,
          } as ConversationListItem;
        }

        return next.slice().sort((a, b) => {
          const aTime = new Date(
            a.latestMessage?.createdAt ?? a.updatedAt ?? 0
          ).getTime();
          const bTime = new Date(
            b.latestMessage?.createdAt ?? b.updatedAt ?? 0
          ).getTime();
          return bTime - aTime;
        });
      });

      if (socketRef.current) {
        socketRef.current.emit("join_conversation", {
          conversationId: normalizedId,
        });
      }

      dispatch(
        messagingApi.util.updateQueryData(
          "getConversations",
          undefined,
          (draft) => {
            const target = draft as any;

            if (!target || target.status === false) {
              return;
            }

            if (!Array.isArray(target.data)) {
              target.data = [];
            }

            const payload = { ...(incoming as any) };
            const existingIndex = target.data.findIndex(
              (item: any) => Number(item.id) === normalizedId
            );

            if (existingIndex === -1) {
              target.data.unshift(payload);
            } else {
              target.data[existingIndex] = {
                ...target.data[existingIndex],
                ...payload,
              };
            }
          }
        )
      );
    },
    [dispatch, userIdNumeric]
  );

  const {
    data: conversationsResponse,
    isFetching: isFetchingConversations,
    refetch: refetchConversations,
  } = useGetConversationsQuery(undefined, {
    skip: !token,
    refetchOnReconnect: false,
    refetchOnFocus: false,
    refetchOnMountOrArgChange: false,
  });

  const [sendMessageMutation] = useSendMessageMutation();
  const [markConversationAsReadMutation] = useMarkConversationAsReadMutation();
  const [createConversationMutation] = useCreateConversationMutation();
  const [toggleMessageReactionMutation] = useToggleMessageReactionMutation();

  const mappedConversations: ConversationListItem[] = useMemo(() => {
    if (!isSuccessResponse(conversationsResponse)) {
      return [];
    }

    return (conversationsResponse.data ?? []).map(
      (conversation: Conversation) => {
        const latestMessage = conversation.messages?.[0] ?? null;

        // Prefer the server's per-conversation count. The fallback below only
        // inspects the statuses of the *latest* message, so it can never report
        // more than 1 and returns 0 whenever the list payload omits embedded
        // messages or their statuses — which is why no unread badge showed.
        const derivedUnread = latestMessage?.statuses?.filter((status) => {
          if (userIdNumeric == null) {
            return false;
          }
          return status.userId === userIdNumeric && status.status !== "read";
        }).length;

        const serverUnread =
          typeof conversation.unreadCount === "number"
            ? conversation.unreadCount
            : null;

        return {
          ...conversation,
          latestMessage: latestMessage ?? null,
          unreadCount: serverUnread ?? derivedUnread ?? 0,
        } as ConversationListItem;
      }
    );
  }, [conversationsResponse, userIdNumeric]);

  useEffect(() => {
    setConversationItems(mappedConversations);
  }, [mappedConversations]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    if (!token) {
      return;
    }

    const instance = initializeSocket(token);
    socketRef.current = instance;

    setIsSocketConnected(instance.connected);

    const handleConnect = () => {
      setIsSocketConnected(true);
      instance.emit("load_conversations");
      if (autoJoin && numericConversationId !== undefined) {
        instance.emit("join_conversation", {
          conversationId: numericConversationId,
        });
      }
    };

    const handleDisconnect = () => {
      setIsSocketConnected(false);
    };

    const handleError = (payload: { message?: string }) => {
      setChatError(payload?.message ?? "Chat connection error");
    };

    const handleNewMessage = (incoming: ChatMessage) => {
      console.log("📨 New message received from socket:", {
        messageId: incoming.id,
        conversationId: incoming.conversationId,
        senderId: incoming.senderId,
        messageType: incoming.messageType,
        content: incoming.content,
        hasAttachment: !!incoming.attachmentUrl,
        attachmentUrl: incoming.attachmentUrl,
        createdAt: incoming.createdAt,
        isFromReceiver: incoming.senderId !== userIdNumeric,
      });

      integrateMessage(incoming, { finalize: true });

      const incomingConversationId = Number(incoming.conversationId);

      if (
        incomingConversationId === numericConversationId &&
        userIdNumeric != null &&
        incoming.senderId !== userIdNumeric
      ) {
        console.log("✅ Marking message as read:", {
          messageId: incoming.id,
          conversationId: incomingConversationId,
        });
        instance.emit("mark_as_read", {
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
      if (
        Number.isNaN(normalizedConversationId) ||
        normalizedConversationId !== (numericConversationId ?? -1)
      ) {
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
            conversationItem.latestMessage &&
            conversationItem.latestMessage.id === messageId
              ? {
                  ...conversationItem.latestMessage,
                  statuses: (conversationItem.latestMessage.statuses ?? []).map(
                    (item) =>
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

    const handleMessageRead = ({
      conversationId: payloadConversationId,
      messageIds,
      userId: statusUserId,
    }: MessageReadPayload) => {
      const normalizedConversationId = Number(payloadConversationId);
      if (
        Number.isNaN(normalizedConversationId) ||
        normalizedConversationId !== (numericConversationId ?? -1)
      ) {
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
            item.userId === statusUserId
              ? { ...item, status: "read" as MessageDeliveryStatus }
              : item
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
            conversationItem.latestMessage &&
            conversationItem.latestMessage.id &&
            ensuredMessageIds.includes(conversationItem.latestMessage.id)
              ? {
                  ...conversationItem.latestMessage,
                  statuses: (conversationItem.latestMessage.statuses ?? []).map(
                    (item) =>
                      item.userId === statusUserId
                        ? { ...item, status: "read" as MessageDeliveryStatus }
                        : item
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

    const handleTyping = ({
      conversationId: payloadConversationId,
      userId: typingUserId,
      isTyping,
    }: TypingPayload) => {
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

    instance.on("connect", handleConnect);
    instance.on("disconnect", handleDisconnect);
    instance.on("chat_error", handleError);
    instance.on("new_message", handleNewMessage);
    instance.on("message_status", handleMessageStatus);
    instance.on("message_read", handleMessageRead);
    instance.on("message_reaction", handleMessageReaction);
    instance.on("typing", handleTyping);
    instance.on("conversation_upserted", handleConversationUpsert);

    return () => {
      instance.off("connect", handleConnect);
      instance.off("disconnect", handleDisconnect);
      instance.off("chat_error", handleError);
      instance.off("new_message", handleNewMessage);
      instance.off("message_status", handleMessageStatus);
      instance.off("message_read", handleMessageRead);
      instance.off("message_reaction", handleMessageReaction);
      instance.off("typing", handleTyping);
      instance.off("conversation_upserted", handleConversationUpsert);
    };
  }, [
    token,
    autoJoin,
    numericConversationId,
    userIdNumeric,
    applyUpdatedMessage,
    handleConversationUpsert,
    integrateMessage,
  ]);

  useEffect(() => {
    if (!token || numericConversationId === undefined) {
      setMessages([]);
      setCurrentMessagesPage(0);
      setTotalMessagePages(null);
      setHasMoreMessages(false);
      setIsLoadingInitialMessages(false);
      setIsLoadingOlderMessages(false);
      return;
    }

    const cached = conversationMessageCache.get(numericConversationId);

    if (cached) {
      setMessages(cached.messages);
      setCurrentMessagesPage(cached.currentPage);
      setTotalMessagePages(cached.totalPages ?? null);
      setHasMoreMessages(cached.hasMore);
      setIsLoadingInitialMessages(false);
      setIsLoadingOlderMessages(false);
      return;
    }

    if (!isLoadingInitialMessages) {
      void fetchMessagesPage(1, { append: false });
    }
  }, [
    fetchMessagesPage,
    isLoadingInitialMessages,
    numericConversationId,
    token,
  ]);

  useEffect(() => {
    if (numericConversationId === undefined) {
      return;
    }

    setConversationItems((prev) =>
      prev.map((conversationItem) => {
        if (Number(conversationItem.id) !== numericConversationId) {
          return conversationItem;
        }

        const latestMessage =
          messages[messages.length - 1] ??
          conversationItem.latestMessage ??
          null;

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
    if (
      !socketRef.current ||
      numericConversationId === undefined ||
      !autoJoin
    ) {
      return;
    }

    socketRef.current.emit("join_conversation", {
      conversationId: numericConversationId,
    });
  }, [numericConversationId, autoJoin]);

  const refreshConversationsHandler = useCallback(async () => {
    if (!token) {
      return;
    }
    await refetchConversations();
    socketRef.current?.emit("load_conversations");
  }, [refetchConversations, token]);

  const refreshMessagesHandler = useCallback(async () => {
    if (!token || numericConversationId === undefined) {
      return;
    }
    await fetchMessagesPage(1, { append: false });
  }, [fetchMessagesPage, numericConversationId, token]);

  const sendMessage = useCallback(
    async ({
      conversationId: targetConversationId,
      content,
      attachmentUrl,
      messageType = "text",
    }: SendMessageArgs) => {
      const payloadConversationId = Number(targetConversationId);

      if (Number.isNaN(payloadConversationId) || payloadConversationId <= 0) {
        return;
      }

      if (userIdNumeric == null) {
        return;
      }

      setChatError(null);

      const normalizedContent = normalizeMessageContent(content);

      if (!normalizedContent && !attachmentUrl) {
        return;
      }

      const timestamp = new Date().toISOString();
      const tempId = generateTemporaryMessageId();

      const attachmentUrlString = typeof attachmentUrl === 'string' ? attachmentUrl : attachmentUrl?.uri ?? null;

      const isFileAttachment = typeof attachmentUrl === 'object' && attachmentUrl !== null;

      const optimisticMessage: ChatMessage = {
        id: tempId,
        conversationId: payloadConversationId,
        senderId: userIdNumeric,
        content: normalizedContent ? normalizedContent : null,
        attachmentUrl: attachmentUrlString,
        messageType,
        createdAt: timestamp,
        updatedAt: timestamp,
        statuses: [],
        reactions: [],
        isOptimistic: true,
        sendFailed: false,
        clientGeneratedId: `client-${Math.abs(tempId)}`,
      };

      pendingMessagesRef.current.set(tempId, {
        conversationId: payloadConversationId,
        content: normalizedContent,
        attachmentUrl: attachmentUrlString,
        messageType,
        createdAt: timestamp,
      });

      // Render the bubble straight away, file attachments included — the local
      // `file://` URI displays fine while the upload runs. Skipping this for
      // attachments meant a failed image upload had no bubble to mark as failed,
      // so it vanished silently.
      integrateMessage(optimisticMessage, { skipPendingResolution: true });

      const socket = socketRef.current;
      const socketIsActive = socket?.connected ?? false;

      if (socket && socketIsActive && !isFileAttachment) {
        socket.emit("send_message", {
          conversationId: payloadConversationId,
          content: normalizedContent ? normalizedContent : null,
          attachmentUrl: attachmentUrlString,
          messageType,
        });
        return;
      }

      try {
        const response = await sendMessageMutation({
          conversationId: payloadConversationId,
          content: normalizedContent ? normalizedContent : undefined,
          attachmentUrl,
          messageType,
        }).unwrap();

        if (isSuccessResponse(response) && response.data) {
          // Don't trust a 200 for an upload. If the server's multipart field
          // name doesn't match the one we send, the file is dropped and the
          // message saves with no attachment — a success response describing a
          // message that lost its image. Verify the attachment came back as a
          // real (remote) URL before treating the send as done, otherwise the
          // bubble would silently keep showing the local preview and appear to
          // have worked until the next app launch.
          const savedAttachment = (response.data as any)?.attachmentUrl;
          const attachmentPersisted =
            typeof savedAttachment === "string" &&
            savedAttachment.trim().length > 0 &&
            !savedAttachment.startsWith("file://");

          if (isFileAttachment && !attachmentPersisted) {
            markMessageAsFailed(payloadConversationId, tempId);
            setChatError(
              "The image couldn't be attached. The message wasn't sent."
            );
            return;
          }

          integrateMessage(
            {
              ...response.data,
              isOptimistic: false,
              sendFailed: false,
            },
            { finalize: true }
          );
          pendingMessagesRef.current.delete(tempId);
        } else {
          markMessageAsFailed(payloadConversationId, tempId);
          setChatError(response?.message ?? "Failed to send message");
        }
      } catch (error: any) {
        markMessageAsFailed(payloadConversationId, tempId);
        setChatError(error?.data?.message ?? "Failed to send message");
      }
    },
    [integrateMessage, markMessageAsFailed, sendMessageMutation, userIdNumeric]
  );

  const emitTyping = useCallback(
    (isTyping: boolean) => {
      if (!socketRef.current || numericConversationId === undefined) {
        return;
      }
      socketRef.current.emit("typing", {
        conversationId: numericConversationId,
        isTyping,
      });
    },
    [numericConversationId]
  );

  const toggleMessageReaction = useCallback(
    async (
      messageId: number | string,
      reactionType: MessageReactionType = "like"
    ) => {
      const numericMessageId = Number(messageId);
      if (Number.isNaN(numericMessageId)) {
        return;
      }

      const socket = socketRef.current;
      const socketIsActive = socket?.connected ?? false;

      if (socket && socketIsActive) {
        socket.emit("toggle_reaction", {
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
      }
    },
    [toggleMessageReactionMutation, applyUpdatedMessage]
  );

  const markConversationAsRead = useCallback(
    async (messageIds?: Array<number | string>) => {
      if (numericConversationId === undefined || userIdNumeric == null) {
        return;
      }

      const messageIdNumbers = messageIds
        ?.map(Number)
        .filter((id) => !Number.isNaN(id) && id > 0);

      const deriveUnreadMessageIds = () => {
        const unreadIds = messagesRef.current
          .filter(
            (message) =>
              Number(message.conversationId) === numericConversationId &&
              message.senderId !== userIdNumeric &&
              message.id > 0
          )
          .filter((message) => {
            const statuses = message.statuses ?? [];
            const selfStatus = statuses.find(
              (status) => status.userId === userIdNumeric
            );
            if (!selfStatus) {
              return true;
            }
            return selfStatus.status !== "read";
          })
          .map((message) => message.id);

        return unreadIds;
      };

      const targetIds = (() => {
        if (messageIdNumbers?.length) {
          return messageIdNumbers;
        }
        return deriveUnreadMessageIds();
      })();

      if (!targetIds.length) {
        return;
      }

      const lastMarkedId =
        lastMarkedMessageIdRef.current.get(numericConversationId) ?? 0;
      const newIds = targetIds.filter((id) => id > lastMarkedId);

      if (!newIds.length) {
        return;
      }

      socketRef.current?.emit("mark_as_read", {
        conversationId: numericConversationId,
        messageIds: newIds,
      });

      const markTimestamp = new Date().toISOString();
      const newIdSet = new Set(newIds);

      const applyReadStatusToMessage = (message: ChatMessage): ChatMessage => {
        if (!newIdSet.has(Number(message.id))) {
          return message;
        }

        const statuses = message.statuses ?? [];
        let hasSelfStatus = false;
        let mutated = false;

        const updatedStatuses = statuses.map((status) => {
          if (status.userId === userIdNumeric) {
            hasSelfStatus = true;
            if (
              status.status !== "read" ||
              status.updatedAt !== markTimestamp
            ) {
              mutated =
                mutated ||
                status.status !== "read" ||
                status.updatedAt !== markTimestamp;
              return {
                ...status,
                status: "read" as MessageDeliveryStatus,
                updatedAt: markTimestamp,
              } satisfies MessageStatus;
            }
          }
          return status;
        });

        if (!hasSelfStatus && userIdNumeric != null) {
          mutated = true;
          updatedStatuses.push({
            id: -1,
            messageId: Number(message.id),
            userId: userIdNumeric,
            status: "read",
            createdAt: markTimestamp,
            updatedAt: markTimestamp,
          });
        }

        if (!mutated) {
          return message;
        }

        return {
          ...message,
          statuses: updatedStatuses,
        };
      };

      setMessages((prev) => prev.map(applyReadStatusToMessage));

      if (numericConversationId !== undefined) {
        const existingCache = conversationMessageCache.get(
          numericConversationId
        );
        if (existingCache) {
          conversationMessageCache.set(numericConversationId, {
            ...existingCache,
            messages: existingCache.messages.map(applyReadStatusToMessage),
          });
        }
      }

      setConversationItems((prev) =>
        prev.map((conversationItem) => {
          if (Number(conversationItem.id) !== numericConversationId) {
            return conversationItem;
          }

          const updatedLatest =
            conversationItem.latestMessage &&
            newIdSet.has(Number(conversationItem.latestMessage.id))
              ? applyReadStatusToMessage(conversationItem.latestMessage)
              : conversationItem.latestMessage;

          const updatedMessages = conversationItem.messages
            ? conversationItem.messages.map(applyReadStatusToMessage)
            : conversationItem.messages;

          return {
            ...conversationItem,
            unreadCount: 0,
            latestMessage: updatedLatest,
            messages: updatedMessages ?? conversationItem.messages,
          };
        })
      );

      dispatch(
        messagingApi.util.updateQueryData(
          "getConversations",
          undefined,
          (draft) => {
            const target = draft as any;
            if (
              !target ||
              target.status === false ||
              !Array.isArray(target.data)
            ) {
              return;
            }

            const conversation = target.data.find(
              (item: any) => Number(item.id) === numericConversationId
            );
            if (!conversation) {
              return;
            }

            conversation.unreadCount = 0;

            if (
              conversation.latestMessage &&
              newIdSet.has(Number(conversation.latestMessage.id))
            ) {
              conversation.latestMessage = applyReadStatusToMessage(
                conversation.latestMessage as ChatMessage
              );
            }

            if (
              Array.isArray(conversation.messages) &&
              conversation.messages.length
            ) {
              conversation.messages = conversation.messages.map(
                (message: any) =>
                  newIdSet.has(Number(message.id))
                    ? applyReadStatusToMessage(message as ChatMessage)
                    : message
              );
            }
          }
        )
      );

      try {
        await markConversationAsReadMutation({
          conversationId: numericConversationId,
          messageIds: newIds,
        }).unwrap();
        lastMarkedMessageIdRef.current.set(
          numericConversationId,
          Math.max(lastMarkedId, ...newIds)
        );
      } catch {
      }
    },
    [
      dispatch,
      markConversationAsReadMutation,
      numericConversationId,
      userIdNumeric,
    ]
  );

  const createConversation = useCallback(
    async (payload: CreateConversationArgs) => {
      const response = await createConversationMutation(payload).unwrap();
      if (response.status && response.data?.conversation) {
        handleConversationUpsert(response.data.conversation);
        const createdId = Number(response.data.conversation.id);
        if (!Number.isNaN(createdId) && socketRef.current) {
          socketRef.current.emit("join_conversation", {
            conversationId: createdId,
          });
        }
      }
      return response;
    },
    [createConversationMutation, handleConversationUpsert]
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
