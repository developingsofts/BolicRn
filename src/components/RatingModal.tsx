import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  TextInput,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";

import { COLORS, DIMENSIONS } from "../config/constants";
import STRINGS from "../config/strings";
import FontWeight from "../hooks/useInterFonts";
import { useAndroidNavBar } from "../hooks/useAndroidNavBar";
import { r } from "../designing/responsiveDesigns";
import { Close } from "../../assets";
import RatingStars from "./RatingStars";
import { Toast } from "./ToastManager";
import { useSubmitRatingMutation } from "../services/api/ratingsApi";
import type { Rating, RatingScore, SubmitRatingResponse } from "../types";

export type RatedRole = "trainer" | "partner";

interface RatingModalProps {
  visible: boolean;
  onClose: () => void;
  rateeId: string | number;
  name: string;
  imageUrl?: string | null;
  role?: RatedRole;
  existingRating?: Rating | null;
  onSubmitted?: (result: SubmitRatingResponse) => void;
}

const MAX_COMMENT = 500;

const RatingModal: React.FC<RatingModalProps> = ({
  visible,
  onClose,
  rateeId,
  name,
  imageUrl,
  role,
  existingRating,
  onSubmitted,
}) => {
  const { height: navBarHeight } = useAndroidNavBar();
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState("");
  const [imageFailed, setImageFailed] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  const [submitRating, { isLoading }] = useSubmitRatingMutation();

  useEffect(() => {
    const show = Keyboard.addListener(
      Platform.OS === "android" ? "keyboardDidShow" : "keyboardWillShow",
      () => setIsKeyboardVisible(true),
    );
    const hide = Keyboard.addListener(
      Platform.OS === "android" ? "keyboardDidHide" : "keyboardWillHide",
      () => setIsKeyboardVisible(false),
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  useEffect(() => {
    if (visible) {
      setStars(existingRating?.score ?? 0);
      setComment(existingRating?.review ?? "");
      setImageFailed(false);
    }
  }, [visible, existingRating]);

  const isEditing = Boolean(existingRating);

  const subtitle =
    role === "trainer"
      ? STRINGS.RATING.trainerSubtitle
      : role === "partner"
        ? STRINGS.RATING.partnerSubtitle
        : STRINGS.RATING.genericSubtitle;

  const starLabel = stars
    ? STRINGS.RATING.starLabels[stars as 1 | 2 | 3 | 4 | 5]
    : STRINGS.RATING.tapToRate;

  const initial = (name?.trim()?.charAt(0) || "?").toUpperCase();
  const showPhoto = Boolean(imageUrl) && !imageFailed;

  const handleClose = () => {
    if (isLoading) return;
    Keyboard.dismiss();
    onClose();
  };

  const handleSubmit = async () => {
    if (stars < 1) {
      Toast.error(STRINGS.RATING.errors.noStars);
      return;
    }

    Keyboard.dismiss();

    const trimmed = comment.trim();

    try {
      const response = await submitRating({
        rateeId: Number(rateeId),
        score: stars as RatingScore,
        ...(trimmed ? { review: trimmed } : {}),
      }).unwrap();

      if (!response?.status) {
        Toast.error(response?.message || STRINGS.RATING.errors.failed);
        return;
      }

      const result = response.data;
      Toast.success(
        result?.created === false
          ? STRINGS.RATING.updated
          : `${STRINGS.RATING.success} ${name}`.trim(),
      );
      if (result) onSubmitted?.(result);
      onClose();
    } catch (error: any) {
      Toast.error(error?.data?.message || STRINGS.RATING.errors.failed);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={
          isKeyboardVisible
            ? Platform.OS === "ios"
              ? "padding"
              : "height"
            : undefined
        }
        enabled={isKeyboardVisible}
      >
        <TouchableWithoutFeedback onPress={handleClose}>
          <View style={styles.overlay}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View
                style={[
                  styles.sheet,
                  {
                    paddingBottom: isKeyboardVisible
                      ? DIMENSIONS.spacing.lg
                      : DIMENSIONS.spacing.lg + navBarHeight,
                  },
                ]}
              >
                <View style={styles.header}>
                  <Text style={styles.title}>
                    {isEditing
                      ? STRINGS.RATING.modalTitleEdit
                      : STRINGS.RATING.modalTitle}
                  </Text>
                  <TouchableOpacity
                    onPress={handleClose}
                    disabled={isLoading}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Image
                      source={Close}
                      resizeMode="contain"
                      style={styles.closeIcon}
                    />
                  </TouchableOpacity>
                </View>

                <View style={styles.person}>
                  {showPhoto ? (
                    <Image
                      source={{ uri: imageUrl as string }}
                      style={styles.avatar}
                      onError={() => setImageFailed(true)}
                    />
                  ) : (
                    <View style={[styles.avatar, styles.avatarFallback]}>
                      <Text style={styles.avatarText}>{initial}</Text>
                    </View>
                  )}
                  <Text style={styles.personName} numberOfLines={1}>
                    {name}
                  </Text>
                  <Text style={styles.personSubtitle}>{subtitle}</Text>
                </View>

                <View style={styles.starsBlock}>
                  <RatingStars
                    rating={stars}
                    size="xlarge"
                    showRating={false}
                    onRatingChange={setStars}
                  />
                  <Text
                    style={[
                      styles.starLabel,
                      stars > 0 && styles.starLabelActive,
                    ]}
                  >
                    {starLabel}
                  </Text>
                </View>

                <Text style={styles.commentLabel}>
                  {STRINGS.RATING.commentLabel}
                </Text>
                <TextInput
                  style={styles.commentInput}
                  value={comment}
                  onChangeText={setComment}
                  placeholder={STRINGS.RATING.commentPlaceholder}
                  placeholderTextColor={COLORS.textSecondary}
                  multiline
                  maxLength={MAX_COMMENT}
                  editable={!isLoading}
                  textAlignVertical="top"
                />
                <Text style={styles.counter}>
                  {comment.length}/{MAX_COMMENT}
                </Text>

                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    (stars < 1 || isLoading) && styles.submitButtonDisabled,
                  ]}
                  onPress={handleSubmit}
                  disabled={stars < 1 || isLoading}
                  activeOpacity={0.85}
                >
                  {isLoading ? (
                    <View style={styles.submitLoadingRow}>
                      <ActivityIndicator size="small" color={COLORS.black} />
                      <Text style={styles.submitText}>
                        {STRINGS.RATING.submitting}
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.submitText}>
                      {isEditing
                        ? STRINGS.RATING.submitEdit
                        : STRINGS.RATING.submit}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: r(20),
    borderTopRightRadius: r(20),
    borderTopWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: DIMENSIONS.spacing.lg,
    paddingTop: DIMENSIONS.spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: DIMENSIONS.spacing.lg,
  },
  title: {
    fontSize: r(18, "font"),
    fontFamily: FontWeight.SemiBold,
    color: COLORS.text,
  },
  closeIcon: {
    width: r(20),
    height: r(20),
    tintColor: COLORS.white,
  },
  person: {
    alignItems: "center",
    marginBottom: DIMENSIONS.spacing.lg,
  },
  avatar: {
    width: r(72),
    height: r(72),
    borderRadius: r(36),
    marginBottom: DIMENSIONS.spacing.sm,
  },
  avatarFallback: {
    backgroundColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: r(26, "font"),
    fontFamily: FontWeight.SemiBold,
    color: COLORS.text,
  },
  personName: {
    fontSize: r(18, "font"),
    fontFamily: FontWeight.SemiBold,
    color: COLORS.text,
    maxWidth: "90%",
    textAlign: "center",
  },
  personSubtitle: {
    fontSize: r(13, "font"),
    fontFamily: FontWeight.Regular,
    color: COLORS.textSecondary,
    marginTop: DIMENSIONS.spacing.xs,
    textAlign: "center",
  },
  starsBlock: {
    alignItems: "center",
    paddingVertical: DIMENSIONS.spacing.md,
    marginBottom: DIMENSIONS.spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  starLabel: {
    marginTop: DIMENSIONS.spacing.sm,
    fontSize: r(13, "font"),
    fontFamily: FontWeight.Regular,
    color: COLORS.textSecondary,
  },
  starLabelActive: {
    fontFamily: FontWeight.SemiBold,
    color: COLORS.text,
  },
  commentLabel: {
    fontSize: r(13, "font"),
    fontFamily: FontWeight.Medium,
    color: COLORS.textSecondary,
    marginBottom: DIMENSIONS.spacing.sm,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: r(12),
    backgroundColor: COLORS.background,
    padding: DIMENSIONS.spacing.md,
    fontSize: r(15, "font"),
    fontFamily: FontWeight.Regular,
    color: COLORS.text,
    minHeight: r(96),
    maxHeight: r(160),
  },
  counter: {
    alignSelf: "flex-end",
    marginTop: DIMENSIONS.spacing.xs,
    fontSize: r(11, "font"),
    fontFamily: FontWeight.Regular,
    color: COLORS.textSecondary,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    borderRadius: r(12),
    height: r(DIMENSIONS.buttonHeight + 6),
    alignItems: "center",
    justifyContent: "center",
    marginTop: DIMENSIONS.spacing.lg,
  },
  submitButtonDisabled: {
    backgroundColor: COLORS.border,
  },
  submitLoadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: DIMENSIONS.spacing.sm,
  },
  submitText: {
    fontSize: r(16, "font"),
    fontFamily: FontWeight.SemiBold,
    color: COLORS.black,
  },
});

export default RatingModal;
