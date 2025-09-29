import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import FontWeight from "../hooks/useInterFonts";
import { COLORS } from "../config/constants";
import { useResponsive } from "../hooks/responsiveDesignHook";
import { Colors } from "react-native/Libraries/NewAppScreen";
import { EyeHide } from "../../assets";
import PasswordInput from "../components/PasswordInput";

type ForgotPasswordStep = "email" | "waiting" | "setPassword" | "success";

interface ForgotPasswordProps {
  navigation?: any;
}
const ForgotPassword: React.FC<ForgotPasswordProps> = ({ navigation }) => {
  const styles = useResponsive(baseStyles);
  const [currentStep, setCurrentStep] = useState<ForgotPasswordStep>("email");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSendLink = async () => {
    if (!email.trim()) {
      Alert.alert("Error", "Please enter your email address");
      return;
    }

    if (!email.includes("@")) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setCurrentStep("waiting");
    } catch (error) {
      Alert.alert("Error", "Failed to send reset link. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      Alert.alert("Success", "Reset link sent again to your email");
    } catch (error) {
      Alert.alert("Error", "Failed to resend email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!newPassword.trim()) {
      Alert.alert("Error", "Please enter a new password");
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters long");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setCurrentStep("success");
    } catch (error) {
      Alert.alert("Error", "Failed to update password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigation.goBack();
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
      />

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSendLink}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? "Sending..." : "Send Reset Link"}
        </Text>
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
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        editable={false}
      />

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={() => setCurrentStep("setPassword")}
        disabled={loading}
      >
        <Text style={styles.buttonText}>Wrong Email?</Text>
      </TouchableOpacity>
    </>
  );

  const renderSetPasswordStep = () => (
    <>
      <Text style={[styles.title, { marginBottom: 10 }]}>Set New Password</Text>
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
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleUpdatePassword}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? "Updating..." : "Update"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleBackToLogin}>
        <Text style={styles.linkText}>Back to Login</Text>
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
      case "setPassword":
        return renderSetPasswordStep();
      case "success":
        return renderSuccessStep();
      default:
        return renderEmailStep();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoid}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons
              name="chevron-back"
              size={24}
              style={{ marginTop: 30, marginStart: 20 }}
              color={COLORS.black}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Text style={styles.logo}>BolicBuddy</Text>
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
