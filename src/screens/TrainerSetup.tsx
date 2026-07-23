import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, DIMENSIONS } from "../config/constants";
import FontWeight from "../hooks/useInterFonts";
import TrainerSetupStep1 from "../components/TrainerSetupStep1";
import TrainerSetupStep2 from "../components/TrainerSetupStep2";
import { useUser } from "../store/hooks";
import { useUpdateMyProfileMutation } from "../services/api/userApi";
import BasicTopBar from "../components/BasicTopBar";

const TrainerSetup: React.FC = ({ navigation }: any) => {
  const user = useUser();
  const [step, setStep] = useState(1);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [updateMyProfile] = useUpdateMyProfileMutation();

  useEffect(() => {
    if (user?.trainerOnboardingStep && user.trainerOnboardingStep > 0 && user.trainerOnboardingStep <= 2) {
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
    alert("Draft saved. Your availability has been saved as draft.");
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
          title="Trainer Setup"
          subtitle="Manage your sessions and charges"
          containerStyle={{
            paddingTop: DIMENSIONS.spacing.xxl,
            paddingBottom: DIMENSIONS.spacing.lg,
          }}
        />

        <View style={styles.progressSection}>
          <Text style={styles.progressStep}>Step {step} of 2</Text>
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
          <TrainerSetupStep1 onNext={handleNext} />
        ) : (
          <TrainerSetupStep2
            onSaveDraft={handleSaveDraft}
            onConfirm={handleConfirm}
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
