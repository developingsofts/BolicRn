import React from "react";
import { Modal, View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { REACTION_OPTIONS, type ReactionType } from "../constants/reactions";
import { COLORS, DIMENSIONS } from "../config/constants";
import FontWeight from "../hooks/useInterFonts";

interface ReactionPickerProps {
  visible: boolean;
  onSelect: (reaction: ReactionType) => void;
  onClose: () => void;
  onRemoveReaction?: () => void;
  currentReaction?: ReactionType | null;
}

const ReactionPicker: React.FC<ReactionPickerProps> = ({
  visible,
  onSelect,
  onClose,
  onRemoveReaction,
  currentReaction,
}) => {
  if (!visible) {
    return null;
  }

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.container}>
          <Text style={styles.heading}>React to post</Text>
          <View style={styles.reactionRow}>
            {REACTION_OPTIONS.filter((option) => option.type !== "like").map(
              (option) => {
                const isSelected = currentReaction === option.type;
                return (
                  <TouchableOpacity
                    key={option.type}
                    style={[
                      styles.reactionButton,
                      isSelected && styles.reactionButtonSelected,
                    ]}
                    onPress={() => {
                      onSelect(option.type);
                      onClose();
                    }}
                  >
                    <Text style={styles.reactionEmoji}>{option.emoji}</Text>
                    <Text style={styles.reactionLabel}>{option.label}</Text>
                  </TouchableOpacity>
                );
              },
            )}
          </View>
          {currentReaction ? (
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => {
                onClose();
                onRemoveReaction?.();
              }}
            >
              <Text style={styles.removeButtonText}>Remove reaction</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: DIMENSIONS.spacing.lg,
  },
  container: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: COLORS.surface,
    borderRadius: DIMENSIONS.borderRadius,
    padding: DIMENSIONS.spacing.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  heading: {
    fontFamily: FontWeight.SemiBold,
    fontSize: 16,
    color: COLORS.text,
    marginBottom: DIMENSIONS.spacing.md,
    textAlign: "center",
  },
  reactionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: DIMENSIONS.spacing.sm,
  },
  reactionButton: {
    flexBasis: "48%",
    backgroundColor: COLORS.surface,
    borderRadius: DIMENSIONS.borderRadius,
    paddingVertical: DIMENSIONS.spacing.md,
    paddingHorizontal: DIMENSIONS.spacing.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  reactionButtonSelected: {
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  reactionEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  reactionLabel: {
    fontFamily: FontWeight.Medium,
    fontSize: 14,
    color: COLORS.text,
  },
  removeButton: {
    marginTop: DIMENSIONS.spacing.lg,
    borderRadius: DIMENSIONS.borderRadius,
    paddingVertical: DIMENSIONS.spacing.md,
    backgroundColor: COLORS.border,
  },
  removeButtonText: {
    fontFamily: FontWeight.Medium,
    color: COLORS.text,
    textAlign: "center",
  },
});

export default ReactionPicker;
