import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS, DIMENSIONS } from "../config/constants";
import FontWeight from "../hooks/useInterFonts";
import TrainerSetupStep1, {
  createEmptySession,
} from "../components/TrainerSetupStep1";
import type { SessionDraft } from "../components/TrainerSetupStep1";
import TrainerSetupStep2 from "../components/TrainerSetupStep2";
import type { DaySchedule } from "../components/TrainerSetupStep2";
import { useUser } from "../store/hooks";
import { useUpdateMyProfileMutation } from "../services/api/userApi";
import BasicTopBar from "../components/BasicTopBar";
import { Toast } from "../components/ToastManager";

/**
 * LOCAL COPY — this belongs in `src/config/strings.ts`
 * (e.g. `STRINGS.TRAINER_SETUP`). It lives here only because strings.ts is
 * being edited concurrently. TODO: move into STRINGS and import from there.
 */
const SETUP_COPY = {
  title: "Trainer Setup",
  subtitle: "Manage your sessions and charges",
  stepLabel: (step: number, total: number) => `Step ${step} of ${total}`,
  draftSaved:
    "Draft saved. Your availability only goes live once you confirm it.",
};

const TOTAL_STEPS = 2;

const TrainerSetup: React.FC = ({ navigation }: any) => {
  const user = useUser();
  const [step, setStep] = useState(1);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [updateMyProfile] = useUpdateMyProfileMutation();

  // Both steps' drafts live here so moving between step 1 and step 2 (in either
  // direction) keeps whatever the trainer entered. `schedule === null` means
  // step 2 has not hydrated from the server yet.
  const [sessions, setSessions] = useState<SessionDraft[]>(() => [
    createEmptySession(),
  ]);
  const [schedule, setSchedule] = useState<DaySchedule[] | null>(null);

  useEffect(() => {
    if (
      user?.trainerOnboardingStep &&
      user.trainerOnboardingStep > 0 &&
      user.trainerOnboardingStep <= TOTAL_STEPS
    ) {
      setStep(user.trainerOnboardingStep);
    }
  }, [user?.trainerOnboardingStep]);

  const handleNext = async () => {
    const nextStep = step + 1;
    setStep(nextStep);
    if (user?.trainerOnboardingStep !== nextStep) {
      await updateMyProfile({ trainerOnboardingStep: nextStep });
    }
  };

  const handleSaveDraft = async () => {
    await updateMyProfile({ trainerOnboardingStep: 2 });
    Toast.info(SETUP_COPY.draftSaved);
  };

  const handleConfirm = async () => {
    await updateMyProfile({ trainerOnboardingStep: 3 });
    navigation.navigate("Main", { screen: "Profile" });
  };

  useEffect(() => {
    const showSubscription = Keyboard.addListener("keyboardDidShow", () => {
      setIsKeyboardVisible(true);
    });
    const hideSubscription = Keyboard.addListener("keyboardDidHide", () => {
      setIsKeyboardVisible(false);
    });
    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      navigation.goBack();
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: COLORS.background }}
      behavior={isKeyboardVisible ? "height" : undefined}
    >
      <SafeAreaView edges={[]} style={{ flex: 1 }}>
        <BasicTopBar
          onBackPress={() => handleBack()}
          title={SETUP_COPY.title}
          subtitle={SETUP_COPY.subtitle}
          containerStyle={{
            paddingTop: DIMENSIONS.spacing.xxl,
            paddingBottom: DIMENSIONS.spacing.lg,
          }}
        />

        <View style={styles.progressSection}>
          <Text style={styles.progressStep}>
            {SETUP_COPY.stepLabel(step, TOTAL_STEPS)}
          </Text>
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                { width: step === 1 ? "50%" : "100%" },
              ]}
            />
          </View>
        </View>

        {step === 1 ? (
          <TrainerSetupStep1
            onNext={handleNext}
            sessions={sessions}
            setSessions={setSessions}
          />
        ) : (
          <TrainerSetupStep2
            onSaveDraft={handleSaveDraft}
            onConfirm={handleConfirm}
            schedule={schedule}
            setSchedule={setSchedule}
          />
        )}
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  profileHeader: {
    backgroundColor: COLORS.gradient3,
    paddingBottom: 40,
    paddingTop: DIMENSIONS.spacing.xl,
    alignItems: "center",
    position: "relative",
    zIndex: 1,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 10,
    paddingTop: 10,
    marginBottom: 16,
  },
  headerIconBtn: {},
  headerTitle: {
    fontFamily: FontWeight.SemiBold,
    fontSize: 24,
    fontWeight: "600",
    color: COLORS.white,
    textAlign: "center",
    flex: 1,
  },
  headerSubtitle: {
    color: COLORS.white,
    fontSize: 14,
    opacity: 0.8,
    textAlign: "center",
    marginTop: 4,
    marginBottom: 8,
  },
  progressSection: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  progressStep: {
    fontSize: 14,
    color: COLORS._5E5E5E,
    fontFamily: FontWeight.Medium,
    marginBottom: 6,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: COLORS._E2E2E2,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
});

export default TrainerSetup;
