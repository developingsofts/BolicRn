import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  Animated,
  StyleSheet,
  Dimensions,
} from "react-native";
import { useAuth } from "../contexts/AuthContext";
import { storageService } from "../services/storage";
import { User } from "../types";
import {
  COLORS,
  DIMENSIONS,
  TRAINING_TYPES,
  GENDER_OPTIONS,
  GENDER_PREFERENCE_OPTIONS,
} from "../config/constants";
import STRINGS from "../config/strings";
import { mockPhoneAuthService } from "../services/phoneAuth";

const { width, height } = Dimensions.get("window");

interface AuthScreenProps {
  navigation: any;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ navigation }) => {
  const { login, register, isLoading, error, clearError, dispatch } = useAuth();

  // Form state
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationId, setVerificationId] = useState("");
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [age, setAge] = useState("");
  const [trainingTypes, setTrainingTypes] = useState<string[]>([]);
  const [genderPreference, setGenderPreference] = useState("");
  const [userGender, setUserGender] = useState("");
  const [currentPRs, setCurrentPRs] = useState("");
  const [signUpStep, setSignUpStep] = useState(0);

  // Animation values
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(50)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.9)).current;

  React.useEffect(() => {
    // Animate in
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Clear error when switching modes
  React.useEffect(() => {
    clearError();
  }, [isSignUp]);

  const handleSubmit = async () => {
    if (isSignUp && signUpStep < 7) {
      // In multi-step sign-up, handleSubmit is only called on the final step
      return;
    }

    if (!email || !password || (isSignUp && !displayName)) {
      Alert.alert(STRINGS.COMMON.error, STRINGS.AUTH.errors.fillAllFields);
      return;
    }

    try {
      if (isSignUp) {
        // Registration flow
        const userData = {
          email,
          password,
          displayName,
          phoneNumber,
          age,
          trainingTypes,
          genderPreference,
          userGender,
          currentPRs,
        };

        const success = await register(userData);

        if (success) {
          // Animate out before navigating
          Animated.parallel([
            Animated.timing(fadeAnim, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
              toValue: 0.9,
              duration: 300,
              useNativeDriver: true,
            }),
          ]).start(() => {
            Alert.alert("Success", "Account created successfully!");
          });
        }
      } else {
        // Login flow
        const success = await login(email, password);

        if (success) {
          // Animate out before navigating
          Animated.parallel([
            Animated.timing(fadeAnim, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
              toValue: 0.9,
              duration: 300,
              useNativeDriver: true,
            }),
          ]).start(() => {
            Alert.alert("Success", "Signed in successfully!");
          });
        }
      }
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Authentication failed"
      );
    }
  };

  const handleForgotPassword = async () => {
    navigation.navigate('ForgotPassword');
  };

  const nextStep = () => {
    if (signUpStep < 7) {
      setSignUpStep(signUpStep + 1);
    }
  };

  const prevStep = () => {
    if (signUpStep > 0) {
      setSignUpStep(signUpStep - 1);
    }
  };

  const toggleTrainingType = (type: string) => {
    setTrainingTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const sendVerificationCode = async () => {
    if (!mockPhoneAuthService.isValidPhoneNumber(phoneNumber)) {
      Alert.alert("Error", "Please enter a valid phone number");
      return;
    }

    setIsSendingCode(true);
    try {
      const result = await mockPhoneAuthService.sendVerificationCode(
        phoneNumber
      );

      if (result.success) {
        setVerificationId(result.verificationId || "");
        Alert.alert("Success", "Verification code sent to your phone!");
      } else {
        Alert.alert(
          "Error",
          result.error || "Failed to send verification code. Please try again."
        );
      }
    } catch (error) {
      Alert.alert(
        STRINGS.COMMON.error,
        STRINGS.AUTH.errors.failedToSend
      );
    } finally {
      setIsSendingCode(false);
    }
  };

  const verifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      Alert.alert(STRINGS.COMMON.error, STRINGS.AUTH.errors.enterCode);
      return;
    }

    setIsVerifyingCode(true);
    try {
      const result = await mockPhoneAuthService.verifyCode(verificationCode);

      if (result.success) {
        setIsPhoneVerified(true);
        Alert.alert(STRINGS.COMMON.success, STRINGS.AUTH.success.phoneVerified);
        nextStep();
      } else {
        Alert.alert(
          STRINGS.COMMON.error,
          result.error || STRINGS.AUTH.errors.invalidCode
        );
      }
    } catch (error) {
      Alert.alert(STRINGS.COMMON.error, STRINGS.AUTH.errors.failedToVerify);
    } finally {
      setIsVerifyingCode(false);
    }
  };

  const renderSignUpStep = () => {
    switch (signUpStep) {
      case 0: // Email/Password
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>{STRINGS.AUTH.createAccount}</Text>
            <Text style={styles.stepSubtitle}>{STRINGS.AUTH.steps.step1}</Text>

            <TextInput
              style={styles.input}
              placeholder={STRINGS.AUTH.email}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <TextInput
              style={styles.input}
              placeholder={STRINGS.AUTH.password}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <TouchableOpacity style={styles.nextButton} onPress={nextStep}>
              <Text style={styles.nextButtonText}>{STRINGS.AUTH.next}</Text>
            </TouchableOpacity>
          </View>
        );

      case 1: // Display Name
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>{STRINGS.AUTH.yourName}</Text>
            <Text style={styles.stepSubtitle}>{STRINGS.AUTH.steps.step2}</Text>

            <TextInput
              style={styles.input}
              placeholder={STRINGS.AUTH.displayName}
              value={displayName}
              onChangeText={setDisplayName}
            />

            <View style={styles.stepButtons}>
              <TouchableOpacity style={styles.backButton} onPress={prevStep}>
                <Text style={styles.backButtonText}>{STRINGS.AUTH.back}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.nextButton} onPress={nextStep}>
                <Text style={styles.nextButtonText}>{STRINGS.AUTH.next}</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 2: // Phone Number
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>{STRINGS.AUTH.phoneNumber}</Text>
            <Text style={styles.stepSubtitle}>{STRINGS.AUTH.steps.step3}</Text>

            <Text style={styles.fieldLabel}>
              {STRINGS.AUTH.labels.verificationMessage}
            </Text>

            <TextInput
              style={styles.input}
              placeholder={STRINGS.AUTH.phoneNumber}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
            />

            <TouchableOpacity
              style={[
                styles.sendCodeButton,
                isSendingCode && styles.sendCodeButtonDisabled,
              ]}
              onPress={sendVerificationCode}
              disabled={isSendingCode}
            >
              <Text style={styles.sendCodeButtonText}>
                {isSendingCode ? STRINGS.AUTH.sending : STRINGS.AUTH.sendCode}
              </Text>
            </TouchableOpacity>

            <View style={styles.stepButtons}>
              <TouchableOpacity style={styles.backButton} onPress={prevStep}>
                <Text style={styles.backButtonText}>{STRINGS.AUTH.back}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.nextButton} onPress={nextStep}>
                <Text style={styles.nextButtonText}>{STRINGS.AUTH.next}</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 3: // Phone Verification
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>{STRINGS.AUTH.verifyCode}</Text>
            <Text style={styles.stepSubtitle}>{STRINGS.AUTH.steps.step4}</Text>

            <Text style={styles.fieldLabel}>
              {STRINGS.AUTH.labels.enterCodeMessage} {phoneNumber}
            </Text>

            <TextInput
              style={styles.input}
              placeholder={STRINGS.AUTH.verificationCode}
              value={verificationCode}
              onChangeText={setVerificationCode}
              keyboardType="numeric"
              maxLength={6}
            />

            <TouchableOpacity
              style={[
                styles.verifyButton,
                isVerifyingCode && styles.verifyButtonDisabled,
              ]}
              onPress={verifyCode}
              disabled={isVerifyingCode}
            >
              <Text style={styles.verifyButtonText}>
                {isVerifyingCode ? STRINGS.AUTH.verifying : STRINGS.AUTH.verifyCode}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.resendButton}
              onPress={sendVerificationCode}
            >
              <Text style={styles.resendButtonText}>{STRINGS.AUTH.resendCode}</Text>
            </TouchableOpacity>

            <View style={styles.stepButtons}>
              <TouchableOpacity style={styles.backButton} onPress={prevStep}>
                <Text style={styles.backButtonText}>{STRINGS.AUTH.back}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.nextButton,
                  !isPhoneVerified && styles.nextButtonDisabled,
                ]}
                onPress={nextStep}
                disabled={!isPhoneVerified}
              >
                <Text style={styles.nextButtonText}>{STRINGS.AUTH.next}</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 4: // Age
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>{STRINGS.AUTH.yourAge}</Text>
            <Text style={styles.stepSubtitle}>{STRINGS.AUTH.steps.step5}</Text>

            <TextInput
              style={styles.input}
              placeholder={STRINGS.AUTH.age}
              value={age}
              onChangeText={setAge}
              keyboardType="numeric"
            />

            <View style={styles.stepButtons}>
              <TouchableOpacity style={styles.backButton} onPress={prevStep}>
                <Text style={styles.backButtonText}>{STRINGS.AUTH.back}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.nextButton} onPress={nextStep}>
                <Text style={styles.nextButtonText}>{STRINGS.AUTH.next}</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 5: // Training Types
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>{STRINGS.AUTH.trainingTypes}</Text>
            <Text style={styles.stepSubtitle}>{STRINGS.AUTH.steps.step6}</Text>

            <ScrollView style={styles.trainingTypesContainer}>
              {TRAINING_TYPES.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.trainingTypeButton,
                    trainingTypes.includes(type) &&
                      styles.trainingTypeButtonActive,
                  ]}
                  onPress={() => toggleTrainingType(type)}
                >
                  <Text
                    style={[
                      styles.trainingTypeText,
                      trainingTypes.includes(type) &&
                        styles.trainingTypeTextActive,
                    ]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.stepButtons}>
              <TouchableOpacity style={styles.backButton} onPress={prevStep}>
                <Text style={styles.backButtonText}>{STRINGS.AUTH.back}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.nextButton} onPress={nextStep}>
                <Text style={styles.nextButtonText}>{STRINGS.AUTH.next}</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 6: // Gender Preferences
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>{STRINGS.AUTH.genderPreferences}</Text>
            <Text style={styles.stepSubtitle}>{STRINGS.AUTH.steps.step7}</Text>

            <Text style={styles.fieldLabel}>{STRINGS.AUTH.yourGender}</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.optionsContainer}
            >
              {GENDER_OPTIONS.map((gender) => (
                <TouchableOpacity
                  key={gender}
                  style={[
                    styles.optionButton,
                    userGender === gender && styles.optionButtonActive,
                  ]}
                  onPress={() => setUserGender(gender)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      userGender === gender && styles.optionTextActive,
                    ]}
                  >
                    {gender}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.fieldLabel}>{STRINGS.AUTH.trainingPartnerPreference}</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.optionsContainer}
            >
              {GENDER_PREFERENCE_OPTIONS.map((pref) => (
                <TouchableOpacity
                  key={pref}
                  style={[
                    styles.optionButton,
                    genderPreference === pref && styles.optionButtonActive,
                  ]}
                  onPress={() => setGenderPreference(pref)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      genderPreference === pref && styles.optionTextActive,
                    ]}
                  >
                    {pref}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.stepButtons}>
              <TouchableOpacity style={styles.backButton} onPress={prevStep}>
                <Text style={styles.backButtonText}>{STRINGS.AUTH.back}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmit}
              >
                <Text style={styles.submitButtonText}>{STRINGS.AUTH.createAccount}</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  const renderLoginForm = () => (
    <View style={styles.formContainer}>
      <Text style={styles.title}>Welcome Back</Text>
      <Text style={styles.subtitle}>Sign in to continue</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      {error && <Text style={styles.errorText}>{error}</Text>}

      <TouchableOpacity onPress={handleForgotPassword}>
        <Text style={styles.forgotPassword}>Forgot Password?</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={isLoading}
      >
        <Text style={styles.submitButtonText}>
          {isLoading ? "Signing In..." : "Sign In"}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <Animated.View
        style={[
          styles.animatedContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
          },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.brandName}>BolicBuddy</Text>
          <Text style={styles.brandTagline}>
            Find your perfect training partner
          </Text>
        </View>

        {/* Mode Toggle */}
        <View style={styles.modeToggle}>
          <TouchableOpacity
            style={[styles.modeButton, !isSignUp && styles.modeButtonActive]}
            onPress={() => setIsSignUp(false)}
          >
            <Text style={[styles.modeText, !isSignUp && styles.modeTextActive]}>
              Sign In
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeButton, isSignUp && styles.modeButtonActive]}
            onPress={() => setIsSignUp(true)}
          >
            <Text style={[styles.modeText, isSignUp && styles.modeTextActive]}>
              Sign Up
            </Text>
          </TouchableOpacity>
        </View>

        {/* Form */}
        {isSignUp ? renderSignUpStep() : renderLoginForm()}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {isSignUp ? "Already have an account?" : "Don't have an account?"}
          </Text>
          <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)}>
            <Text style={styles.footerLink}>
              {isSignUp ? "Sign In" : "Sign Up"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Development Bypass */}
        <TouchableOpacity
          style={styles.devBypassButton}
          onPress={async () => {
            const devUser: User = {
              id: "dev-user-1",
              email: "dev@example.com",
              displayName: "Development User",
              phoneNumber: "+1234567890",
              phoneVerified: true,
              age: 25,
              trainingTypes: ["Strength Training", "Cardio"],
              genderPreference: "Any",
              userGender: "Male",
              currentPRs: "Bench: 225lbs, Squat: 315lbs",
              profilePicture: undefined,
              bio: "Development user for testing",
              location: "San Francisco, CA",
              experienceLevel: "Intermediate",
              availability: "Weekends",
              createdAt: new Date(),
              updatedAt: new Date(),
            };

            const devToken = "dev-token-123";

            // Store dev user data
            await storageService.setAuthToken(devToken);
            await storageService.setUserProfile(devUser);

            // Update auth context
            dispatch({
              type: "AUTH_SUCCESS",
              payload: { user: devUser, token: devToken },
            });
          }}
        >
          <Text style={styles.devBypassText}>
            🚀 Development Mode: Skip Login
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: DIMENSIONS.spacing.lg,
  },
  animatedContainer: {
    width: "100%",
  },
  header: {
    alignItems: "center",
    marginBottom: DIMENSIONS.spacing.xl,
  },
  brandName: {
    fontSize: 32,
    fontWeight: "bold",
    color: COLORS.primary,
    marginBottom: DIMENSIONS.spacing.sm,
  },
  brandTagline: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  modeToggle: {
    flexDirection: "row",
    backgroundColor: COLORS.surface,
    borderRadius: DIMENSIONS.borderRadius,
    padding: DIMENSIONS.spacing.xs,
    marginBottom: DIMENSIONS.spacing.lg,
  },
  modeButton: {
    flex: 1,
    paddingVertical: DIMENSIONS.spacing.md,
    alignItems: "center",
    borderRadius: DIMENSIONS.borderRadius - 4,
  },
  modeButtonActive: {
    backgroundColor: COLORS.primary,
  },
  modeText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  modeTextActive: {
    color: COLORS.surface,
  },
  formContainer: {
    marginBottom: DIMENSIONS.spacing.lg,
  },
  stepContainer: {
    marginBottom: DIMENSIONS.spacing.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: DIMENSIONS.spacing.sm,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: DIMENSIONS.spacing.lg,
    textAlign: "center",
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: DIMENSIONS.spacing.xs,
    textAlign: "center",
  },
  stepSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: DIMENSIONS.spacing.lg,
    textAlign: "center",
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: DIMENSIONS.borderRadius,
    paddingHorizontal: DIMENSIONS.spacing.md,
    paddingVertical: DIMENSIONS.spacing.md,
    fontSize: 16,
    color: COLORS.text,
    marginBottom: DIMENSIONS.spacing.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: DIMENSIONS.spacing.sm,
  },
  forgotPassword: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.primary,
    justifyContent: "flex-end",
    alignSelf: "flex-end",
    marginBottom: DIMENSIONS.spacing.sm,
  },
  trainingTypesContainer: {
    maxHeight: 200,
    marginBottom: DIMENSIONS.spacing.md,
  },
  trainingTypeButton: {
    backgroundColor: COLORS.surface,
    borderRadius: DIMENSIONS.borderRadius,
    paddingHorizontal: DIMENSIONS.spacing.md,
    paddingVertical: DIMENSIONS.spacing.sm,
    marginBottom: DIMENSIONS.spacing.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  trainingTypeButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  trainingTypeText: {
    fontSize: 14,
    color: COLORS.text,
    textAlign: "center",
  },
  trainingTypeTextActive: {
    color: COLORS.surface,
    fontWeight: "600",
  },
  optionsContainer: {
    marginBottom: DIMENSIONS.spacing.md,
  },
  optionButton: {
    backgroundColor: COLORS.surface,
    borderRadius: DIMENSIONS.borderRadius,
    paddingHorizontal: DIMENSIONS.spacing.md,
    paddingVertical: DIMENSIONS.spacing.sm,
    marginRight: DIMENSIONS.spacing.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  optionButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  optionText: {
    fontSize: 14,
    color: COLORS.text,
  },
  optionTextActive: {
    color: COLORS.surface,
    fontWeight: "600",
  },
  stepButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  backButton: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: DIMENSIONS.borderRadius,
    paddingVertical: DIMENSIONS.spacing.md,
    alignItems: "center",
    marginRight: DIMENSIONS.spacing.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
  },
  nextButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: DIMENSIONS.borderRadius,
    paddingVertical: DIMENSIONS.spacing.md,
    alignItems: "center",
    marginLeft: DIMENSIONS.spacing.sm,
  },
  nextButtonDisabled: {
    backgroundColor: COLORS.textSecondary,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.surface,
  },
  sendCodeButton: {
    backgroundColor: COLORS.primary,
    borderRadius: DIMENSIONS.borderRadius,
    paddingVertical: DIMENSIONS.spacing.md,
    alignItems: "center",
    marginTop: DIMENSIONS.spacing.md,
  },
  sendCodeButtonDisabled: {
    backgroundColor: COLORS.textSecondary,
  },
  sendCodeButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.surface,
  },
  verifyButton: {
    backgroundColor: COLORS.primary,
    borderRadius: DIMENSIONS.borderRadius,
    paddingVertical: DIMENSIONS.spacing.md,
    alignItems: "center",
    marginTop: DIMENSIONS.spacing.md,
  },
  verifyButtonDisabled: {
    backgroundColor: COLORS.textSecondary,
  },
  verifyButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.surface,
  },
  resendButton: {
    marginTop: DIMENSIONS.spacing.md,
    alignSelf: "center",
  },
  resendButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.primary,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    borderRadius: DIMENSIONS.borderRadius,
    paddingVertical: DIMENSIONS.spacing.md,
    alignItems: "center",
    marginTop: DIMENSIONS.spacing.md,
  },
  submitButtonDisabled: {
    backgroundColor: COLORS.textSecondary,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.surface,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 14,
    textAlign: "center",
    marginBottom: DIMENSIONS.spacing.md,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: DIMENSIONS.spacing.lg,
  },
  footerText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginRight: DIMENSIONS.spacing.xs,
  },
  footerLink: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: "600",
  },
  devBypassButton: {
    backgroundColor: "#FF6B35",
    borderRadius: DIMENSIONS.borderRadius,
    paddingVertical: DIMENSIONS.spacing.md,
    alignItems: "center",
    marginTop: DIMENSIONS.spacing.lg,
    borderWidth: 2,
    borderColor: "#FF6B35",
  },
  devBypassText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.white,
  },
});

export default AuthScreen;
