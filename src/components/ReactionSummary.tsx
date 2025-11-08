import React, { useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { REACTION_OPTIONS, type ReactionType, getReactionDisplay } from "../constants/reactions";
import { COLORS, DIMENSIONS } from "../config/constants";
import FontWeight from "../hooks/useInterFonts";

interface ReactionSummaryProps {
  summary?: Record<ReactionType, number>;
  total?: number;
  currentReaction?: ReactionType | null;
  onPress?: () => void;
}

const ReactionSummary: React.FC<ReactionSummaryProps> = ({
  summary,
  total,
  currentReaction,
  onPress,
}) => {
  const baseSummary = useMemo(() => {
    return REACTION_OPTIONS.reduce((acc, option) => {
      acc[option.type] = 0;
      return acc;
    }, {} as Record<ReactionType, number>);
  }, []);

  const activeSummary = useMemo(() => {
    if (!summary) {
      return baseSummary;
    }
    return {
      ...baseSummary,
      ...summary,
    };
  }, [baseSummary, summary]);

  const totalReactions = total ?? Object.values(activeSummary).reduce<number>((acc, count) => acc + count, 0);

  const topReactions = useMemo(() => {
    const entries = REACTION_OPTIONS.map(({ type }) => ({
      type,
      count: activeSummary[type] ?? 0,
    }))
      .filter((entry) => entry.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    if (entries.length === 0 && currentReaction) {
      entries.push({ type: currentReaction, count: 1 });
    }

    return entries;
  }, [activeSummary, currentReaction]);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={onPress ? 0.8 : 1}
      style={[styles.container, onPress && styles.containerInteractive]}
    >
      <View style={styles.reactionIcons}>
        {topReactions.length > 0 ? (
          topReactions.map(({ type }) => {
            const { emoji } = getReactionDisplay(type);
            const isUserReaction = currentReaction === type;
            return (
              <View key={type} style={[styles.reactionIcon, isUserReaction && styles.userReactionIcon]}>
                <Text style={styles.reactionEmoji}>{emoji}</Text>
              </View>
            );
          })
        ) : (
          <Text style={styles.placeholderText}>React</Text>
        )}
      </View>
      <Text style={styles.totalText}>
        {totalReactions > 0 ? `${totalReactions} ${totalReactions === 1 ? '' : 's'}` : '0'}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: DIMENSIONS.spacing.sm,
  },
  containerInteractive: {
    paddingVertical: DIMENSIONS.spacing.xs,
    paddingHorizontal: DIMENSIONS.spacing.sm,
    borderRadius: DIMENSIONS.borderRadius,
    backgroundColor: COLORS.surface,
  },
  reactionIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: DIMENSIONS.spacing.xs,
  },
  reactionIcon: {
    justifyContent: "center",
    alignItems: "center",
    // shadowColor: "#000",
    // shadowOffset: { width: 0, height: 1 },
    // shadowOpacity: 0.1,
    // shadowRadius: 2,
    // elevation: 2,
  },
  userReactionIcon: {
    // borderWidth: 2,
    // borderColor: COLORS.primary,
  },
  reactionEmoji: {
    fontSize: 18,
  },
  totalText: {
    fontFamily: FontWeight.Medium,
    color: COLORS.text,
    fontSize: 14,
  },
  placeholderText: {
    fontFamily: FontWeight.Regular,
    color: COLORS.text,
    opacity: 0.6,
    fontSize: 14,
  },
});

export default ReactionSummary;
