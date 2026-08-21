import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import BasicTopBar from "../components/BasicTopBar";
import { Toast } from "../components/ToastManager";
import ConfirmationDialog from "../components/ConfirmationDialog";
import { COLORS, DIMENSIONS } from "../config/constants";
import STRINGS from "../config/strings";
import FontWeight from "../hooks/useInterFonts";
import { r } from "../designing/responsiveDesigns";
import { storageService } from "../services/storage";
import {
  useSaveWeeklyGoalMutation,
  useDeleteWeeklyGoalMutation,
} from "../services/api/goalsApi";
import type { WeeklyGoal, WeeklyGoalType } from "../types";

interface CreateWeeklyGoalProps {
  navigation: any;
  route?: {
    params?: {
      goal?: WeeklyGoal;
    };
  };
}

const GOAL_TYPE: WeeklyGoalType = "workouts";

const buildTitle = (target: number) => {
  const label = target === 1 ? "Workout" : STRINGS.WEEKLY_GOAL.units.workouts;
  return `Complete ${target} ${label} This Week`;
};

const CreateWeeklyGoal: React.FC<CreateWeeklyGoalProps> = ({
  navigation,
  route,
}) => {
  const existingGoal = route?.params?.goal;
  const isEditing = Boolean(existingGoal);

  const [target, setTarget] = useState(
    existingGoal ? String(existingGoal.target) : "",
  );
  const [customTitle, setCustomTitle] = useState(existingGoal?.title ?? "");
  const [titleEdited, setTitleEdited] = useState(
    Boolean(existingGoal?.title) &&
      existingGoal!.title !== buildTitle(existingGoal!.target),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveToApi] = useSaveWeeklyGoalMutation();
  const [deleteFromApi] = useDeleteWeeklyGoalMutation();
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);

  const parsedTarget = parseInt(target, 10);
  const targetIsValid = Number.isFinite(parsedTarget) && parsedTarget > 0;

  const autoTitle = useMemo(
    () => (targetIsValid ? buildTitle(parsedTarget) : ""),
    [parsedTarget, targetIsValid],
  );
  const effectiveTitle = titleEdited && customTitle.trim() ? customTitle.trim() : autoTitle;

  const handleSave = async () => {
    if (!targetIsValid) {
      Toast.error(STRINGS.WEEKLY_GOAL.errors.invalidTarget);
      return;
    }

    Keyboard.dismiss();
    setIsSaving(true);

    const goal: WeeklyGoal = {
      id: existingGoal?.id ?? `weekly-goal-${Date.now()}`,
      title: effectiveTitle,
      target: parsedTarget,
      unit: STRINGS.WEEKLY_GOAL.units.workouts,
      type: GOAL_TYPE,
      createdAt: existingGoal?.createdAt ?? new Date().toISOString(),
    };

    try {
      const res = await saveToApi({
        type: GOAL_TYPE,
        target: parsedTarget,
        title: effectiveTitle,
      }).unwrap();

      if (!res?.status) throw new Error(res?.message || "save failed");

      await storageService.removeWeeklyGoal().catch(() => {});
      Toast.success(STRINGS.WEEKLY_GOAL.saved);
      navigation.goBack();
      return;
    } catch {
      try {
        await storageService.setWeeklyGoal(goal);
        Toast.success(STRINGS.WEEKLY_GOAL.saved);
        navigation.goBack();
      } catch {
        Toast.error(STRINGS.COMMON.error);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = async () => {
    setShowRemoveDialog(false);
    try {
      await deleteFromApi().unwrap();
    } catch {
    }

    try {
      await storageService.removeWeeklyGoal();
      Toast.success(STRINGS.WEEKLY_GOAL.removed);
      navigation.goBack();
    } catch {
      Toast.error(STRINGS.COMMON.error);
    }
  };

  return (
    <SafeAreaView edges={[]} style={styles.container}>
      <BasicTopBar
        onBackPress={() => navigation.goBack()}
        title={
          isEditing
            ? STRINGS.WEEKLY_GOAL.editTitle
            : STRINGS.WEEKLY_GOAL.createTitle
        }
        subtitle={
          isEditing
            ? STRINGS.WEEKLY_GOAL.editSubtitle
            : STRINGS.WEEKLY_GOAL.createSubtitle
        }
        containerStyle={{
          paddingTop: DIMENSIONS.spacing.xxl,
          paddingBottom: DIMENSIONS.spacing.lg,
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.label}>{STRINGS.WEEKLY_GOAL.targetLabel}</Text>
        <View style={styles.targetRow}>
          <TextInput
            style={styles.targetInput}
            value={target}
            onChangeText={setTarget}
            keyboardType="number-pad"
            maxLength={4}
            placeholder="4"
            placeholderTextColor={COLORS.textSecondary}
          />
          <Text style={styles.targetUnit}>
            {STRINGS.WEEKLY_GOAL.units.workouts} / week
          </Text>
        </View>

        <Text style={styles.label}>{STRINGS.WEEKLY_GOAL.titleLabel}</Text>
        <TextInput
          style={styles.titleInput}
          value={titleEdited ? customTitle : autoTitle}
          onChangeText={(text) => {
            setTitleEdited(true);
            setCustomTitle(text);
          }}
          placeholder={STRINGS.WEEKLY_GOAL.titlePlaceholder}
          placeholderTextColor={COLORS.textSecondary}
          maxLength={80}
        />

        <TouchableOpacity
          style={[
            styles.saveButton,
            (!targetIsValid || isSaving) && styles.saveButtonDisabled,
          ]}
          onPress={handleSave}
          disabled={!targetIsValid || isSaving}
          activeOpacity={0.85}
        >
          {isSaving ? (
            <View style={styles.savingRow}>
              <ActivityIndicator size="small" color={COLORS.black} />
              <Text style={styles.saveButtonText}>
                {STRINGS.WEEKLY_GOAL.saving}
              </Text>
            </View>
          ) : (
            <Text style={styles.saveButtonText}>
              {STRINGS.WEEKLY_GOAL.save}
            </Text>
          )}
        </TouchableOpacity>

        {isEditing && (
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => setShowRemoveDialog(true)}
            activeOpacity={0.85}
          >
            <Text style={styles.removeButtonText}>
              {STRINGS.WEEKLY_GOAL.remove}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <ConfirmationDialog
        visible={showRemoveDialog}
        title={STRINGS.WEEKLY_GOAL.remove}
        message="Your weekly target will be cleared. You can set a new one any time."
        confirmLabel={STRINGS.COMMON.remove}
        cancelLabel={STRINGS.COMMON.cancel}
        confirmButtonColor={COLORS.error}
        confirmTextColor={COLORS.white}
        onConfirm={handleRemove}
        onCancel={() => setShowRemoveDialog(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: DIMENSIONS.spacing.lg,
    paddingTop: DIMENSIONS.spacing.md,
    paddingBottom: DIMENSIONS.spacing.xxl,
  },
  label: {
    fontSize: r(13, "font"),
    fontFamily: FontWeight.Medium,
    color: COLORS.textSecondary,
    marginBottom: DIMENSIONS.spacing.sm,
    marginTop: DIMENSIONS.spacing.lg,
  },
  targetRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: DIMENSIONS.spacing.md,
  },
  targetInput: {
    width: r(96),
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: r(12),
    backgroundColor: COLORS.surface,
    paddingHorizontal: DIMENSIONS.spacing.md,
    paddingVertical: DIMENSIONS.spacing.md,
    fontSize: r(22, "font"),
    fontFamily: FontWeight.SemiBold,
    color: COLORS.text,
    textAlign: "center",
  },
  targetUnit: {
    fontSize: r(15, "font"),
    fontFamily: FontWeight.Regular,
    color: COLORS.textSecondary,
  },
  titleInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: r(12),
    backgroundColor: COLORS.surface,
    paddingHorizontal: DIMENSIONS.spacing.md,
    paddingVertical: DIMENSIONS.spacing.md,
    fontSize: r(15, "font"),
    fontFamily: FontWeight.Regular,
    color: COLORS.text,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: r(12),
    height: r(DIMENSIONS.buttonHeight + 6),
    alignItems: "center",
    justifyContent: "center",
    marginTop: DIMENSIONS.spacing.xl,
  },
  saveButtonDisabled: {
    backgroundColor: COLORS.border,
  },
  savingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: DIMENSIONS.spacing.sm,
  },
  saveButtonText: {
    fontSize: r(16, "font"),
    fontFamily: FontWeight.SemiBold,
    color: COLORS.black,
  },
  removeButton: {
    marginTop: DIMENSIONS.spacing.md,
    height: r(DIMENSIONS.buttonHeight),
    alignItems: "center",
    justifyContent: "center",
  },
  removeButtonText: {
    fontSize: r(15, "font"),
    fontFamily: FontWeight.Medium,
    color: COLORS.error,
  },
});

export default CreateWeeklyGoal;
