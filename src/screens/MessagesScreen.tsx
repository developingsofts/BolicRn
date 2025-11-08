import React, { useMemo, useState, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import RefreshableScrollView from '../components/RefreshableScrollView';
import { COLORS, DIMENSIONS } from "../config/constants";
import STRINGS from "../config/strings";
import { SafeAreaView } from "react-native-safe-area-context";
import FontWeight from "../hooks/useInterFonts";
import BasicTopBar from "../components/BasicTopBar";
import { useAuth } from "../contexts/AuthContext";
import { useChat } from "../hooks/useChat";
import type { ConversationListItem } from "../types";

interface MessagesScreenProps {
  navigation: any;
}

const MessagesScreen: React.FC<MessagesScreenProps> = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();
  const currentUserId = user?.id ? Number(user.id) : null;
  const {
    conversations,
    isFetchingConversations,
    refreshConversations,
  } = useChat();

  const formatRelativeTime = useCallback((isoDate?: string | null) => {
    if (!isoDate) {
      return "";
    }
    const target = new Date(isoDate).getTime();
    if (Number.isNaN(target)) {
      return "";
    }
    const diffMs = Date.now() - target;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes < 1) {
      return "Just now";
    }
    if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    }
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) {
      return `${diffHours}h ago`;
    }
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) {
      return "1d ago";
    }
    if (diffDays < 7) {
      return `${diffDays}d ago`;
    }
    return new Date(isoDate).toLocaleDateString();
  }, []);

  const conversationItems = useMemo(() => {
    return (conversations ?? []).map((conversation: ConversationListItem) => {
      const latestMessage = conversation.latestMessage ?? conversation.messages?.[0] ?? null;
      const partner = conversation.type === "group"
        ? null
        : conversation.members?.find((member) => (currentUserId != null ? member.userId !== currentUserId : true));

      const displayName = conversation.type === "group"
        ? conversation.name ?? STRINGS.MESSAGES.groupFallback
        : partner?.user?.displayName ?? partner?.user?.userName ?? STRINGS.MESSAGES.partnerFallback;

      const lastMessagePreview = latestMessage?.content
        ?? (latestMessage?.attachmentUrl ? STRINGS.MESSAGES.attachmentPlaceholder : STRINGS.MESSAGES.noMessagesYet);

      const unreadCount = conversation.unreadCount ?? 0;
      const lastMessageTime = latestMessage?.createdAt ?? conversation.updatedAt;

      return {
        id: conversation.id,
        displayName,
        latestMessageText: latestMessage?.senderId === currentUserId
          ? `${STRINGS.MESSAGES.youLabel} ${lastMessagePreview}`
          : lastMessagePreview,
        time: formatRelativeTime(lastMessageTime),
        unread: unreadCount ?? 0,
        partnerId: partner?.userId,
        partnerName: partner?.user?.displayName ?? partner?.user?.userName ?? displayName,
        conversationName: conversation.name ?? displayName,
        conversationType: conversation.type,
      };
    });
  }, [conversations, currentUserId, formatRelativeTime]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshConversations();
    } finally {
      setRefreshing(false);
    }
  };

  const isEmptyState = !isFetchingConversations && conversationItems.length === 0;

  return (
    <SafeAreaView edges={[]} style={styles.container}>

       <BasicTopBar
          showBackButton={false}
          containerStyle={styles.header}
          title={STRINGS.MESSAGES.title}
          subtitle={STRINGS.MESSAGES.subtitle}
          titleStyle={styles.title}
          subtitleStyle={styles.subtitle}
        />


      <RefreshableScrollView
        style={styles.conversationsContainer}
        refreshing={refreshing}
        onRefresh={handleRefresh}
      >
        {isFetchingConversations && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={COLORS.primary} />
          </View>
        ) : null}

        {isEmptyState ? (
          <View style={styles.emptyStateContainer}>
            <Text style={styles.emptyStateTitle}>{STRINGS.MESSAGES.emptyTitle}</Text>
            <Text style={styles.emptyStateSubtitle}>{STRINGS.MESSAGES.emptySubtitle}</Text>
          </View>
        ) : (
          conversationItems.map((conversation) => (
            <TouchableOpacity
              key={conversation.id}
              style={styles.conversationCard}
              onPress={() =>
                navigation.navigate("Chat", {
                  conversationId: conversation.id,
                  conversationName: conversation.displayName,
                  partnerId: conversation.partnerId,
                  partnerName: conversation.partnerName ?? conversation.conversationName,
                })
              }
            >
              <View style={styles.conversationHeader}>
                <Text style={styles.conversationName}>{conversation.displayName}</Text>
                <Text style={styles.conversationTime}>{conversation.time}</Text>
              </View>
              <View style={styles.conversationContent}>
                <Text style={styles.lastMessage} numberOfLines={1}>
                  {conversation.latestMessageText}
                </Text>
                {conversation.unread > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadText}>{conversation.unread}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))
        )}
  </RefreshableScrollView>

    
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gradient3,
  },
  header: {
    paddingHorizontal: DIMENSIONS.spacing.lg,
    paddingBottom: DIMENSIONS.spacing.md,
    paddingTop: DIMENSIONS.spacing.xxl,
  },
  title: {
    fontSize: 24,
    fontFamily: FontWeight.SemiBold,
    color: COLORS.white,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: FontWeight.Regular,
    color: COLORS.white,
  },
  conversationsContainer: {
    flex: 1,
    paddingHorizontal: DIMENSIONS.spacing.lg,
    backgroundColor: COLORS.background,
    paddingTop: 20,
  },
  conversationCard: {
    backgroundColor: COLORS.surface,
    borderRadius: DIMENSIONS.borderRadius,
    padding: DIMENSIONS.spacing.md,
    marginBottom: DIMENSIONS.spacing.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  conversationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: DIMENSIONS.spacing.sm,
  },
  conversationName: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text,
  },
  conversationTime: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  conversationContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  loadingContainer: {
    paddingVertical: DIMENSIONS.spacing.xl,
    alignItems: "center",
  },
  emptyStateContainer: {
    alignItems: "center",
    paddingVertical: DIMENSIONS.spacing.xl,
    gap: DIMENSIONS.spacing.sm,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontFamily: FontWeight.SemiBold,
    color: COLORS.text,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    paddingHorizontal: DIMENSIONS.spacing.md,
  },
  lastMessage: {
    fontSize: 14,
    color: COLORS.textSecondary,
    flex: 1,
  },
  unreadBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: DIMENSIONS.spacing.sm,
  },
  unreadText: {
    fontSize: 12,
    color: COLORS.surface,
    fontWeight: "600",
  },
  footer: {
    paddingHorizontal: DIMENSIONS.spacing.lg,
    paddingBottom: DIMENSIONS.spacing.lg,
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  footerText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontStyle: "italic",
  },
});

export default MessagesScreen;
