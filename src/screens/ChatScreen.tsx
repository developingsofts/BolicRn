import React, {
  useRef,
  useEffect,
  useState,
  useMemo,
  useCallback,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
  FlatList,
  Keyboard,
  ActivityIndicator,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { COLORS, DIMENSIONS } from "../config/constants";
import STRINGS from "../config/strings";
import { useAuth } from "../contexts/AuthContext";
import FontWeight from "../hooks/useInterFonts";
import { ImageFile, Send, Close, Like } from "../../assets";
import { TextInput } from "react-native-gesture-handler";
import { LinearGradient } from "expo-linear-gradient";
import BasicTopBar from "../components/BasicTopBar";
import { useChat } from "../hooks/useChat";
import { Toast } from "../components/ToastManager";

interface ChatScreenProps {
  navigation: any;
  route: any;
}

interface MessageListItem {
  id: string;
  text: string;
  isMe: boolean;
  timestamp: Date;
  showDateSeparator?: boolean;
  dateSeparator?: string;
  attachmentUrl?: string | null;
  messageType?: string;
  reactionCount: number;
  hasLiked: boolean;
}

const isSameDay = (first: Date, second: Date) =>
  first.getFullYear() === second.getFullYear() &&
  first.getMonth() === second.getMonth() &&
  first.getDate() === second.getDate();

const formatDateSeparator = (date: Date) => {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (isSameDay(date, today)) {
    return STRINGS.CHAT.dateSeparators.today;
  }
  if (isSameDay(date, yesterday)) {
    return STRINGS.CHAT.dateSeparators.yesterday;
  }
  return date.toLocaleDateString();
};

const ChatScreen: React.FC<ChatScreenProps> = ({ navigation, route }) => {
  const {
    conversationId,
    conversationName,
    partnerName,
    partnerId,
    initialMessage,
    from,
  } = route.params || {};
  const resolvedConversationId =
    conversationId !== undefined && conversationId !== null
      ? Number(conversationId)
      : undefined;
  const { user } = useAuth();
  const userIdNumeric = user?.id ? Number(user.id) : null;
  const {
    messages,
    sendMessage,
    emitTyping,
    toggleMessageReaction,
    typingUsers,
    markConversationAsRead,
    isFetchingMessages,
    createConversation,
    isLoadingOlderMessages,
    isSocketConnected,
    hasMoreMessages,
    loadOlderMessages,
    chatError,
  } = useChat({ conversationId: resolvedConversationId });

  // `useChat` records send failures in `chatError`; nothing rendered it, so a
  // failed send — an image upload in particular — was completely silent.
  useEffect(() => {
    if (chatError) {
      Toast.error(chatError);
    }
  }, [chatError]);

  const [messageInput, setMessageInput] = useState(initialMessage ?? "");
  const flatListRef = useRef<FlatList<MessageListItem>>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasRequestedConversationRef = useRef(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const partnerIdNumeric = useMemo(() => {
    if (partnerId === undefined || partnerId === null) {
      return undefined;
    }
    const numeric = Number(partnerId);
    return Number.isNaN(numeric) ? undefined : numeric;
  }, [partnerId]);
  const [isPreparingConversation, setIsPreparingConversation] = useState(
    resolvedConversationId === undefined && partnerIdNumeric !== undefined
  );
  const suppressAutoScrollRef = useRef(false);
  const isUserNearBottomRef = useRef(true);
  const isUserScrollingRef = useRef(false);
  const lastScrollOffsetRef = useRef(0);

  const chatTitle =
    conversationName ?? partnerName ?? STRINGS.CHAT.defaultTitle;
  const avatarInitial =
    chatTitle?.charAt(0)?.toUpperCase() ?? STRINGS.CHAT.defaultTitle.charAt(0);

  useEffect(() => {
    console.log("Socket connected:", isSocketConnected);
  }, [isSocketConnected]);

  useEffect(() => {
    if (
      resolvedConversationId !== undefined ||
      partnerIdNumeric === undefined ||
      hasRequestedConversationRef.current
    ) {
      return;
    }

    hasRequestedConversationRef.current = true;
    setIsPreparingConversation(true);

    (async () => {
      try {
        const response = await createConversation({
          type: "private",
          participantIds: [partnerIdNumeric],
          initialMessage: initialMessage ?? undefined,
        });

        if (response.status && response.data?.conversation?.id) {
          navigation.setParams({
            conversationId: response.data.conversation.id,
            conversationName:
              response.data.conversation.name ??
              conversationName ??
              partnerName ??
              chatTitle,
          });
        } else {
          hasRequestedConversationRef.current = false;
        }
      } catch {
        hasRequestedConversationRef.current = false;
      } finally {
        setIsPreparingConversation(false);
      }
    })();
  }, [
    resolvedConversationId,
    partnerIdNumeric,
    createConversation,
    navigation,
    conversationName,
    partnerName,
    chatTitle,
    initialMessage,
  ]);

  const shouldShowInitialLoader = isPreparingConversation || isFetchingMessages;

  const scrollToBottom = useCallback((animated: boolean = true) => {
    if (!flatListRef.current) {
      return;
    }
    requestAnimationFrame(() => {
      flatListRef.current?.scrollToEnd({ animated });
    });
  }, []);

  const handleLoadOlder = useCallback(() => {
    if (!hasMoreMessages || isLoadingOlderMessages || shouldShowInitialLoader) {
      return;
    }
    suppressAutoScrollRef.current = true;
    void loadOlderMessages();
  }, [
    hasMoreMessages,
    isLoadingOlderMessages,
    shouldShowInitialLoader,
    loadOlderMessages,
  ]);

  const handleScrollBeginDrag = useCallback(() => {
    isUserScrollingRef.current = true;
  }, []);

  const handleScrollEndDrag = useCallback(() => {
    isUserScrollingRef.current = false;
  }, []);

  const handleListScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, contentSize, layoutMeasurement } =
        event.nativeEvent;

      const offsetY = contentOffset.y;
      const previousOffset = lastScrollOffsetRef.current;
      const isScrollingUp = offsetY < previousOffset - 8;

      if (isUserScrollingRef.current && isScrollingUp && offsetY <= 40) {
        handleLoadOlder();
      }

      lastScrollOffsetRef.current = offsetY;

      const distanceFromBottom =
        contentSize.height - (layoutMeasurement.height + offsetY);
      isUserNearBottomRef.current = distanceFromBottom <= 40;
    },
    [handleLoadOlder]
  );

  useEffect(() => {
    if (isLoadingOlderMessages) {
      suppressAutoScrollRef.current = true;
      return;
    }

    if (suppressAutoScrollRef.current) {
      const timeout = setTimeout(() => {
        suppressAutoScrollRef.current = false;
      }, 200);
      return () => clearTimeout(timeout);
    }

    return undefined;
  }, [isLoadingOlderMessages]);

  const messageItems = useMemo(() => {
    return messages.map((message, index, array) => {
      const timestamp = new Date(message.createdAt);
      const previous = index > 0 ? array[index - 1] : undefined;
      const previousTimestamp = previous
        ? new Date(previous.createdAt)
        : undefined;
      const showDateSeparator =
        !previousTimestamp || !isSameDay(timestamp, previousTimestamp);

      const reactions = message.reactions ?? [];
      const reactionCount = reactions.length;
      const hasLiked =
        userIdNumeric != null
          ? reactions.some((reaction) => reaction.userId === userIdNumeric)
          : false;

      const text = message.content?.trim().length
        ? message.content
        : message.attachmentUrl
        ? STRINGS.MESSAGES.attachmentPlaceholder
        : STRINGS.MESSAGES.noMessagesYet;

      if (message.messageType === "image" || message.attachmentUrl) {
        console.log("Image message:", {
          id: message.id,
          messageType: message.messageType,
          attachmentUrl: message.attachmentUrl,
          content: message.content,
        });
      }

      return {
        id: message.id.toString(),
        text,
        isMe:
          userIdNumeric != null ? message.senderId === userIdNumeric : false,
        timestamp,
        showDateSeparator,
        dateSeparator: showDateSeparator
          ? formatDateSeparator(timestamp)
          : undefined,
        attachmentUrl: message.attachmentUrl ?? null,
        messageType: message.messageType,
        reactionCount,
        hasLiked,
      } satisfies MessageListItem;
    });
  }, [messages, userIdNumeric]);

  useEffect(() => {
    if (!messageItems.length || suppressAutoScrollRef.current) {
      return;
    }
    if (!isUserNearBottomRef.current) {
      return;
    }

    const timeout = setTimeout(() => {
      scrollToBottom();
    }, 120);

    return () => clearTimeout(timeout);
  }, [messageItems.length, scrollToBottom]);

  useEffect(() => {
    if (!typingUsers.length) {
      return;
    }

    const timeout = setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 150);

    return () => clearTimeout(timeout);
  }, [typingUsers.length]);

  useFocusEffect(
    useCallback(() => {
      if (resolvedConversationId !== undefined) {
        void markConversationAsRead();
      }
      return () => {
        emitTyping(false);
      };
    }, [resolvedConversationId, markConversationAsRead, emitTyping])
  );

  const handleInputChange = useCallback(
    (value: string) => {
      setMessageInput(value);
      if (resolvedConversationId === undefined) {
        return;
      }
      emitTyping(true);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        emitTyping(false);
        typingTimeoutRef.current = null;
      }, 1500);
    },
    [emitTyping]
  );

  const handleSend = useCallback(async () => {
    const trimmed = messageInput.trim();
    console.log("Sending message:", trimmed, resolvedConversationId);
    if (!trimmed || resolvedConversationId === undefined) {
      return;
    }
    isUserNearBottomRef.current = true;
    await sendMessage({
      conversationId: resolvedConversationId,
      content: trimmed,
    });
    setMessageInput("");
    emitTyping(false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, [messageInput, resolvedConversationId, sendMessage, emitTyping]);

  const handleSelectImage = useCallback(async () => {
    if (resolvedConversationId === undefined) {
      Toast.error("Please wait for conversation to load");
      return;
    }

    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please grant permission to access your photos to send images.",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        isUserNearBottomRef.current = true;

        const imageUri = asset.uri.startsWith("file://")
          ? asset.uri
          : `file://${asset.uri}`;

        console.log("Image selected - Original URI:", asset.uri);
        console.log("Image selected - Formatted URI:", imageUri);

        Toast.info("Sending image...");

        await sendMessage({
          conversationId: resolvedConversationId,
          messageType: "image",
          attachmentUrl: {
            uri: imageUri,
            type: "image/jpeg",
            name: `image_${Date.now()}.jpg`,
          },
        });
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Toast.error("Failed to send image");
    }
  }, [resolvedConversationId, sendMessage]);

  useEffect(
    () => () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      emitTyping(false);
    },
    [emitTyping]
  );

  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
      }
    );
    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  return (
    <LinearGradient
      colors={[COLORS.gradient1, COLORS.gradient2, COLORS.gradient3]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.container}
    >
      <SafeAreaView edges={["left", "right"]} style={styles.container}>
        <View style={styles.mainContent}>
          <BasicTopBar
            contentStyle={{ alignItems: "center" }}
            showBackButton={false}
            containerStyle={styles.header}
            title={chatTitle}
            titleStyle={styles.title}
            startView={
              <View style={styles.avatarContainer}>
                <View style={[styles.avatar]}>
                  <Text style={styles.avatarText}>{avatarInitial}</Text>
                </View>
              </View>
            }
            endView={
              <TouchableOpacity
                onPress={() => {
                  if (from == "bookingSuccess") {
                    navigation.reset({
                      index: 0,
                      routes: [{ name: "Main" }],
                    });
                  } else {
                    navigation.goBack();
                  }
                }}
              >
                <Image source={Close} style={styles.headerIcon} />
              </TouchableOpacity>
            }
          />

          <View
            style={[
              styles.messagesWrapper,
              { paddingBottom: 120 + keyboardHeight },
            ]}
          >
            <FlatList
              ref={flatListRef}
              data={messageItems}
              keyExtractor={(item) => item.id}
              style={styles.flatList}
              contentContainerStyle={styles.flatListContent}
              showsVerticalScrollIndicator={false}
              scrollEnabled={true}
              directionalLockEnabled={true}
              scrollEventThrottle={16}
              maintainVisibleContentPosition={{
                minIndexForVisible: 0,
                autoscrollToTopThreshold: 20,
              }}
              removeClippedSubviews={false}
              maxToRenderPerBatch={20}
              updateCellsBatchingPeriod={30}
              initialNumToRender={20}
              windowSize={10}
              decelerationRate={0.98}
              bounces={true}
              alwaysBounceVertical={true}
              overScrollMode="always"
              disableScrollViewPanResponder={false}
              keyboardShouldPersistTaps="handled"
              onScrollBeginDrag={handleScrollBeginDrag}
              onScrollEndDrag={handleScrollEndDrag}
              onMomentumScrollEnd={handleScrollEndDrag}
              onScroll={handleListScroll}
              onContentSizeChange={() => {
                if (suppressAutoScrollRef.current) {
                  return;
                }
                if (!isUserNearBottomRef.current) {
                  return;
                }
                scrollToBottom();
              }}
              ListHeaderComponent={
                messageItems.length > 0 && isLoadingOlderMessages ? (
                  <View style={styles.paginationLoader}>
                    <ActivityIndicator color={COLORS.primary} size="small" />
                  </View>
                ) : null
              }
              ListFooterComponent={
                typingUsers.length > 0 ? (
                  <View style={styles.typingContainer}>
                    <Text style={styles.typingText}>
                      {`${partnerName ?? STRINGS.MESSAGES.partnerFallback} ${
                        STRINGS.MESSAGES.typing
                      }`}
                    </Text>
                  </View>
                ) : (
                  <View style={{ height: 20 }} />
                )
              }
              ListEmptyComponent={
                shouldShowInitialLoader ? (
                  <View style={styles.emptyMessagesContainer}>
                    <ActivityIndicator color={COLORS.primary} />
                  </View>
                ) : (
                  <View style={styles.emptyMessagesContainer}>
                    <Text style={styles.emptyMessagesTitle}>
                      {STRINGS.MESSAGES.noMessages}
                    </Text>
                    <Text style={styles.emptyMessagesSubtitle}>
                      {STRINGS.MESSAGES.startConversation}
                    </Text>
                  </View>
                )
              }
              renderItem={({ item }) => (
                <View>
                  {item.showDateSeparator && item.dateSeparator && (
                    <View style={styles.dateSeparator}>
                      <View style={styles.dateSeparatorLine} />
                      <Text style={styles.dateSeparatorText}>
                        {item.dateSeparator}
                      </Text>
                      <View style={styles.dateSeparatorLine} />
                    </View>
                  )}
                  <View
                    style={[
                      styles.messageRow,
                      item.isMe ? styles.myMessageRow : styles.theirMessageRow,
                    ]}
                  >
                    <View
                      style={[
                        styles.messageContent,
                        item.isMe
                          ? item.reactionCount > 0
                            ? styles.myMessageContentWithReaction
                            : styles.myMessageContent
                          : item.reactionCount > 0
                          ? styles.theirMessageContentWithReaction
                          : styles.theirMessageContent,
                      ]}
                    >
                      {item.reactionCount > 0 && item.isMe ? (
                        <View
                          style={[
                            styles.reactionBadge,
                            styles.reactionBadgeMine,
                          ]}
                        >
                          <Image source={Like} style={styles.reactionIcon} />
                        </View>
                      ) : null}
                      <TouchableOpacity
                        activeOpacity={item.isMe ? 1 : 0.85}
                        delayLongPress={250}
                        disabled={item.isMe}
                        onLongPress={() => {
                          if (!item.isMe) {
                            toggleMessageReaction(Number(item.id));
                          }
                        }}
                        style={[
                          styles.messagePressable,
                          item.isMe
                            ? styles.myMessagePressable
                            : styles.theirMessagePressable,
                        ]}
                      >
                        <View
                          style={[
                            styles.messageContainer,
                            item.isMe ? styles.myMessage : styles.theirMessage,
                            item.messageType === "image" && styles.imageMessageContainer,
                          ]}
                        >
                          {item.messageType === "image" && item.attachmentUrl ? (
                            <>
                              {console.log("Rendering image:", {
                                messageType: item.messageType,
                                attachmentUrl: item.attachmentUrl,
                                isConditionMet:
                                  item.messageType === "image" &&
                                  item.attachmentUrl,
                              })}
                              <Image
                                source={{ uri: item.attachmentUrl }}
                                style={styles.messageImage}
                                onError={(error) =>
                                  console.log("Image load error:", error)
                                }
                                onLoad={() =>
                                  console.log(
                                    "Image loaded successfully:",
                                    item.attachmentUrl
                                  )
                                }
                              />
                            </>
                          ) : (
                            <>
                              {console.log("Rendering text:", {
                                messageType: item.messageType,
                                attachmentUrl: item.attachmentUrl,
                                text: item.text,
                              })}
                              <Text
                                style={[
                                  styles.messageText,
                                  item.isMe
                                    ? styles.myMessageText
                                    : styles.theirMessageText,
                                ]}
                              >
                                {item.text}
                              </Text>
                            </>
                          )}
                        </View>
                      </TouchableOpacity>
                      {item.reactionCount > 0 && !item.isMe ? (
                        <View
                          style={[
                            styles.reactionBadge,
                            styles.reactionBadgeTheirs,
                          ]}
                        >
                          <Image source={Like} style={styles.reactionIcon} />
                        </View>
                      ) : null}
                    </View>
                  </View>
                </View>
              )}
            />
          </View>
          <View style={[styles.inputContainer, { bottom: keyboardHeight }]}>
            <View style={styles.inputRow}>
              <View style={styles.inputWrapper}>
                <TextInput
                  placeholder={STRINGS.CHAT.placeholder}
                  placeholderTextColor={COLORS.placeholder}
                  style={styles.textInput}
                  value={messageInput}
                  onChangeText={handleInputChange}
                  onSubmitEditing={handleSend}
                />
                <TouchableOpacity
                  onPress={handleSelectImage}
                  style={styles.imageButton}
                >
                  <Image source={ImageFile} style={styles.imageIcon} />
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                disabled={
                  !messageInput.trim() || resolvedConversationId === undefined
                }
                onPress={handleSend}
                style={styles.sendButton}
              >
                <Image source={Send} style={styles.sendIcon} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  mainContent: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: DIMENSIONS.spacing.lg,
  },
  avatar: {
    width: 50,
    height: 50,
    borderWidth: 2,
    borderColor: COLORS.white,
    borderRadius: 100,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  avatarText: {
    fontFamily: FontWeight.SemiBold,
    fontSize: 18,
    color: COLORS.black,
  },
  title: {
    fontSize: 24,
    color: COLORS.white,
    fontFamily: FontWeight.SemiBold,
    marginBottom: DIMENSIONS.spacing.sm,
    textAlign: "left",
    textAlignVertical: "center",
    justifyContent: "center",
    alignContent: "center",
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: DIMENSIONS.spacing.lg,
    textAlign: "center",
  },
  comingSoon: {
    fontSize: 32,
    fontWeight: "bold",
    color: COLORS.primary,
    marginBottom: DIMENSIONS.spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: DIMENSIONS.spacing.lg,
    paddingTop: DIMENSIONS.spacing.xxl,
    paddingBottom: DIMENSIONS.spacing.sm,
    backgroundColor: COLORS.gradient3,
  },
  headerLeft: {
    flexDirection: "row",
    gap: DIMENSIONS.spacing.md,
    alignItems: "center",
  },
  avatarContainer: {
    borderRadius: 100,
    height: 52,
    width: 52,
    borderColor: COLORS.white,
  },
  headerIcon: {
    width: 24,
    height: 24,
    marginTop: -10,
    alignContent: "center",
    justifyContent: "center",
    tintColor: COLORS.white,
  },
  backButton: {
    fontSize: 24,
    color: COLORS.primary,
  },
  messagesContainer: {
    flex: 1,
    alignItems: "center",
  },
  messagesWrapper: {
    flex: 1,
    paddingHorizontal: DIMENSIONS.spacing.lg,
    backgroundColor: COLORS.surface,
    paddingTop: DIMENSIONS.spacing.lg,
  },
  flatList: {
    flex: 1,
    backgroundColor: COLORS.chatMessageListBg,
    borderRadius: 20,
    marginBottom: 20,
    paddingBottom: DIMENSIONS.spacing.md,
    overflow: "hidden",
  },
  flatListContent: {
    padding: DIMENSIONS.spacing.md,
    paddingBottom: 30,

    flexGrow: 1,
  },
  paginationLoader: {
    paddingVertical: DIMENSIONS.spacing.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  placeholder: {
    fontSize: 16,

    color: COLORS.textSecondary,
    fontStyle: "italic",
  },
  dateSeparator: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: DIMENSIONS.spacing.md,
  },
  dateSeparatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.chatDateSeparatorLine,
  },
  dateSeparatorText: {
    marginHorizontal: DIMENSIONS.spacing.md,
    fontSize: 14,
    color: COLORS.chatDateSeparatorText,
    fontWeight: "500",
    fontFamily: FontWeight.Medium,
  },
  messageContainer: {
    maxWidth: 300,
    minHeight: 33,
    paddingTop: 5.5,

    paddingRight: 12,
    paddingBottom: 5.5,
    paddingLeft: 12,
    borderRadius: 9,
  },
  messageContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },
  myMessageContent: {
    alignItems: "center",
    alignSelf: "flex-end",
    justifyContent: "flex-end",
    width: "100%",
  },
  myMessageContentWithReaction: {
    alignItems: "center",
    alignSelf: "flex-end",
    justifyContent: "space-between",
    width: "100%",
  },
  theirMessageContent: {
    alignItems: "center",
    alignSelf: "flex-start",
    justifyContent: "flex-start",
    width: "100%",
  },
  theirMessageContentWithReaction: {
    alignItems: "center",
    alignSelf: "flex-start",
    justifyContent: "space-between",
    width: "100%",
  },
  messagePressable: {
    maxWidth: 300,
    flexShrink: 1,
  },
  myMessagePressable: {
    alignSelf: "flex-end",
  },
  theirMessagePressable: {
    alignSelf: "flex-start",
  },
  messageRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginTop: DIMENSIONS.spacing.lg,
    width: "100%",
  },
  myMessageRow: {
    justifyContent: "flex-end",
  },
  theirMessageRow: {
    justifyContent: "flex-start",
  },

  typingContainer: {
    paddingHorizontal: DIMENSIONS.spacing.md,
    paddingVertical: DIMENSIONS.spacing.sm,
  },
  typingText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: FontWeight.Regular,
  },

  emptyMessagesContainer: {
    alignItems: "center",
    paddingVertical: DIMENSIONS.spacing.xl,
  },
  emptyMessagesTitle: {
    fontSize: 16,
    fontFamily: FontWeight.SemiBold,
    color: COLORS.text,
    marginBottom: DIMENSIONS.spacing.xs,
  },
  emptyMessagesSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    paddingHorizontal: DIMENSIONS.spacing.lg,
  },

  likeIcon: {
    width: 16,
    height: 16,
    tintColor: COLORS.text,
  },
  myMessage: {
    alignSelf: "flex-end",
    backgroundColor: COLORS.primary,
  },
  theirMessage: {
    alignSelf: "flex-start",
    backgroundColor: COLORS.chatReceiverBg,
  },
  messageText: {
    fontSize: 16,
    fontWeight: "400",
    fontFamily: FontWeight.Regular,
    lineHeight: 20,
  },
  myMessageText: {
    color: COLORS.black,
  },
  theirMessageText: {
    color: COLORS.text,
  },
  reactionBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  reactionBadgeMine: {
    marginRight: 4,
  },
  reactionBadgeTheirs: {
    marginLeft: 4,
  },
  reactionIcon: {
    width: 14,
    height: 14,
    tintColor: COLORS.text,
  },
  inputContainer: {
    backgroundColor: COLORS.gradient3,
    paddingHorizontal: DIMENSIONS.spacing.md,
    paddingTop: 20,
    paddingBottom: 55,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: DIMENSIONS.spacing.sm,
  },
  inputWrapper: {
    position: "relative",
    flex: 1,
  },
  textInput: {
    flex: 1,
    backgroundColor: COLORS.surface,
    color: COLORS.text,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    borderBottomLeftRadius: 8,
    paddingTop: 5.5,
    paddingRight: 40,
    paddingBottom: 5.5,
    paddingLeft: 12,
    height: 45,
  },
  imageButton: {
    position: "absolute",
    right: 10,
    top: 10,
  },
  imageIcon: {
    width: 24,
    height: 24,
    tintColor: COLORS.text,
  },
  sendButton: {
    width: 45,
    height: 45,
    backgroundColor: COLORS.surface,
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  sendIcon: {
    width: 20,
    height: 20,
    tintColor: COLORS.text,
  },
  imageMessageContainer: {
    maxWidth: 250,
    minHeight: 200,
    padding: 0,
    borderRadius: 9,
    overflow: "hidden",
  },
  messageImage: {
    width: 220,
    height: 220,
    borderRadius: 9,
    resizeMode: "contain",
  },
});

export default ChatScreen;
