import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute, CommonActions } from "@react-navigation/native";
import FontWeight from "../hooks/useInterFonts";
import { COLORS } from "../config/constants";
import STRINGS from "../config/strings";
import { useResponsive } from "../hooks/responsiveDesignHook";
import PasswordInput from "../components/PasswordInput";
import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";
import { useForgotPasswordMutation, useResetPasswordMutation } from "../services/api/authApi";
import { Toast } from "../components/ToastManager";

type ForgotPasswordStep = "email" | "waiting" | "resetPassword" | "success";

interface ForgotPasswordProps {
  navigation?: any;
}

const ForgotPassword: React.FC<ForgotPasswordProps> = ({ navigation: navProp }) => {
  const styles = useResponsive(baseStyles);
  const route = useRoute();
  const navigation = useNavigation();
  const [currentStep, setCurrentStep] = useState<ForgotPasswordStep>("email");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetToken, setResetToken] = useState<string>("");
  
  const [forgotPassword, { isLoading: isSendingEmail }] = useForgotPasswordMutation();
  const [resetPassword, { isLoading: isResettingPassword }] = useResetPasswordMutation();

  // Check if there's a token in the route params (from deep link)
  useEffect(() => {
    const params = route.params as any;
    console.log('📱 Route params:', params);
    
    if (params?.token) {
      console.log('✅ Token found in params:', params.token);
      setResetToken(params.token);
      setCurrentStep("resetPassword");
      Toast.success("Please enter your new password");
    }
  }, [route.params]);

  // Also handle deep links via Linking API
  useEffect(() => {
    const handleDeepLink = (event: { url: string }) => {
      console.log('🔗 Deep link received:', event.url);
      
      // Parse URL to extract token
      const url = event.url;
      const tokenMatch = url.match(/[?&]token=([^&]+)/);
      
      if (tokenMatch && tokenMatch[1]) {
        const token = tokenMatch[1];
        console.log('✅ Token extracted from deep link:', token);
        setResetToken(token);
        setCurrentStep("resetPassword");
        Toast.success("Please enter your new password");
      }
    };

    // Handle initial URL (if app was opened from a link)
    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log('🔗 Initial URL:', url);
        handleDeepLink({ url });
      }
    });

    // Handle URL while app is running
    const subscription = Linking.addEventListener('url', handleDeepLink);

    return () => {
      subscription.remove();
    };
  }, []);

  const handleSendResetLink = async () => {
    if (!email.trim()) {
      Toast.error(STRINGS.FORGOT_PASSWORD.errors.enterEmail);
      return;
    }

    if (!email.includes("@")) {
      Toast.error(STRINGS.FORGOT_PASSWORD.errors.validEmail);
      return;
    }

    try {
      const result = await forgotPassword(email).unwrap();
      
      if (result.status) {
        Toast.success("Password reset link sent! Check your email.");
        setCurrentStep("waiting");
      } else {
        Toast.error(result.message || STRINGS.FORGOT_PASSWORD.errors.failedToSend);
      }
    } catch (error: any) {
      console.error("Forgot password error:", error);
      Toast.error(error?.data?.message || STRINGS.FORGOT_PASSWORD.errors.failedToSend);
    }
  };

 

  const handleResetPassword = async () => {
    if (!newPassword.trim()) {
      Toast.error(STRINGS.FORGOT_PASSWORD.errors.enterNewPassword);
      return;
    }

    if (newPassword.length < 6) {
      Toast.error(STRINGS.FORGOT_PASSWORD.errors.passwordLength);
      return;
    }

    if (newPassword !== confirmPassword) {
      Toast.error(STRINGS.FORGOT_PASSWORD.errors.passwordMismatch);
      return;
    }

    if (!resetToken) {
      Toast.error("Invalid reset link. Please request a new one.");
      return;
    }

    try {
      const result = await resetPassword({ token: resetToken, newPassword }).unwrap();
      
      if (result.status) {
        Toast.success("Password reset successfully!");
        setCurrentStep("success");
      } else {
        Toast.error(result.message || STRINGS.FORGOT_PASSWORD.errors.failedToUpdate);
      }
    } catch (error: any) {
      console.error("Reset password error:", error);
      Toast.error(error?.data?.message || STRINGS.FORGOT_PASSWORD.errors.failedToUpdate);
    }
  };

  const handleBackToLogin = () => {
    navigation.dispatch(CommonActions.reset({
      index: 0,
      routes: [{ name: 'Auth' }],
    }));
  };

  const renderEmailStep = () => (
    <>
      <Text style={styles.title}>Forgot Password</Text>
      <Text style={styles.subtitle}>
        Enter your email address and we'll send you a link to reset your
        password.
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Enter your email"
        placeholderTextColor={COLORS._5E5E5E}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        editable={!isSendingEmail}
      />

      <TouchableOpacity
        style={[styles.button, isSendingEmail && styles.buttonDisabled]}
        onPress={handleSendResetLink}
        disabled={isSendingEmail}
      >
        {isSendingEmail ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>Send Reset Link</Text>
        )}
      </TouchableOpacity>
    </>
  );

  const renderWaitingStep = () => (
    <>
      <Text style={styles.title}>Waiting For Confirmation</Text>
      <Text style={styles.subtitle}>
        Please check your email for a password reset link.
      </Text>

      <TextInput
        style={styles.disabledInput}
        placeholder="Enter your email"
        placeholderTextColor={COLORS._5E5E5E}
        value={email}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        editable={false}
      />

      {/* <TouchableOpacity
        style={styles.secondaryButton}
        onPress={handleResendEmail}
      >
        <Text style={styles.secondaryButtonText}>Resend Email</Text>
      </TouchableOpacity> */}

      <TouchableOpacity
        style={[styles.button, { marginTop: 10 }]}
        onPress={() => setCurrentStep("email")}
      >
        <Text style={styles.buttonText}>Wrong email?</Text>
      </TouchableOpacity>
    </>
  );

  const renderResetPasswordStep = () => (
    <>
      <Text style={[styles.title, { marginBottom: 10 }]}>Set New Password</Text>
      <Text style={styles.subtitle}>Please enter your new password below.</Text>

      <Text style={styles.description}>New Password</Text>
      <PasswordInput
        value={newPassword}
        onChangeText={setNewPassword}
        placeholder="New Password"
        isVisible={showNewPassword}
        onToggleVisibility={() => setShowNewPassword(!showNewPassword)}
      />

      <Text style={styles.description}>Confirm New Password</Text>
      <PasswordInput
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        placeholder="Confirm New Password"
        isVisible={showConfirmPassword}
        onToggleVisibility={() => setShowConfirmPassword(!showConfirmPassword)}
      />

      <TouchableOpacity
        style={[styles.button, isResettingPassword && styles.buttonDisabled]}
        onPress={handleResetPassword}
        disabled={isResettingPassword}
      >
        {isResettingPassword ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>Reset Password</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={handleBackToLogin}>
        <Text style={styles.linkText}>Bacfk to Login</Text>
      </TouchableOpacity>
    </>
  );

  const renderSuccessStep = () => (
    <>
      <Text style={styles.title}>Password Saved!</Text>
      <Text style={styles.subtitle}>
        New password has been saved successfully.
      </Text>

      <TouchableOpacity style={styles.button} onPress={handleBackToLogin}>
        <Text style={styles.buttonText}>Back to Login</Text>
      </TouchableOpacity>
    </>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case "email":
        return renderEmailStep();
      case "waiting":
        return renderWaitingStep();
      case "resetPassword":
        return renderResetPasswordStep();
      case "success":
        return renderSuccessStep();
      default:
        return renderEmailStep();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        // behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoid}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.dispatch(CommonActions.reset({
            index: 0,
            routes: [{ name: 'Auth' }],
          }))}>
            <Ionicons
              name="chevron-back"
              size={24}
              style={{ marginTop: 30, marginStart: 20 }}
              color={COLORS.black}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <MaskedView
            maskElement={<Text style={styles.logo}>BolicBuddy</Text>}
          >
            <LinearGradient
              colors={[COLORS.gradient1, COLORS.gradient2, COLORS.gradient3]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 0 }}
            >
              <Text style={[styles.logo, { opacity: 0 }]}>BolicBuddy</Text>
            </LinearGradient>
          </MaskedView>
          <Text style={styles.logoSubtitle}>Reset your password</Text>
          <View style={styles.mainContent}>{renderCurrentStep()}</View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const baseStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardAvoid: {
    flex: 1,
  },
  header: {
    paddingTop: 20,
  },
  mainContent: {
    justifyContent: "center",
    backgroundColor: COLORS.white,
    borderRadius: 10,
    paddingTop: 15,
    paddingBottom: 10,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: COLORS.border_dark,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: "center",
  },
  logo: {
    fontSize: 32,
    fontFamily: FontWeight.Bold,
    color: COLORS.primary,
    textAlign: "center",
    marginBottom: 8,
  },
  logoSubtitle: {
    fontFamily: FontWeight.Medium,
    fontSize: 14,
    color: COLORS._5E5E5E,
    textAlign: "center",
    marginBottom: 40,
  },
  title: {
    fontSize: 20,
    fontFamily: FontWeight.SemiBold,
    color: COLORS.app_black,
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: FontWeight.Medium,
    color: COLORS._5E5E5E,
    marginBottom: 20,
  },
  description: {
    fontSize: 12,
    marginBottom: 2,
    marginLeft: 0.5,
    fontFamily: FontWeight.Medium,
    color: COLORS.app_black,
  },
  input: {
    borderRadius: 5,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: FontWeight.Medium,
    marginBottom: 20,
    backgroundColor: COLORS.background,
  },
  disabledInput: {
    borderRadius: 5,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS._5E5E5E,
    fontFamily: FontWeight.Medium,
    marginBottom: 20,
    backgroundColor: COLORS.background,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 5,
    backgroundColor: COLORS.background,
    marginBottom: 20,
  },
  passwordInput: {
    flex: 1,
    fontFamily: FontWeight.Medium,
    paddingHorizontal: 12,
    color: COLORS.app_black,
    paddingVertical: 12,
    fontSize: 13,
  },
  eyeIcon: {
    paddingHorizontal: 9,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 13,
    borderRadius: 5,
    alignItems: "center",
    marginBottom: 10,
  },
  buttonDisabled: {
    backgroundColor: "#B0B0B0",
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 14,
    fontFamily: FontWeight.Medium,
  },
  linkText: {
    color: COLORS.primary,
    fontSize: 14,
    marginBottom: 10,
    marginTop: 15,
    fontFamily: FontWeight.Medium,
    textAlign: "center",
    textDecorationLine: "underline",
  },
});

export default ForgotPassword;
