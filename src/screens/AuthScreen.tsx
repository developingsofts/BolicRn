import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Animated,
  StyleSheet,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";
import { Formik } from "formik";
import {
  COLORS,
  DIMENSIONS,
} from "../config/constants";
import STRINGS from "../config/strings";
import { Toast } from "../components/ToastManager";
import { useLoginMutation, useRegisterMutation } from "../services/api/authApi";
import { useUpdateMyProfileMutation, useUpdateMyProfileWithImageMutation } from "../services/api/userApi";
import { useAppDispatch } from "../store/hooks";
import { setUser } from "../store/userSlice";
import { storageService } from "../services/storage";
import { User } from "../types";
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from "../config/constants";
import { loginSchema } from "../validation/authSchemas";
import RoleSelection from "../components/RoleSelection";
import OnboardingStepHeader from "../components/OnboardingStepHeader";
import UserProfileForm from "../components/UserProfileForm";
import CreateAccountForm from "../components/CreateAccountForm";
import AvatarUploadForm from "../components/AvatarUploadForm";

const { width, height } = Dimensions.get("window");

interface AuthScreenProps {
  navigation: any;
}

interface LoginFormValues {
  email: string;
  password: string;
}

interface SignUpFormValues {
  email: string;
  password: string;
  role?: "user" | "trainer" | null;
  location: string;
  trainingTypes: string[];
  displayName: string;
  bio: string;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const [triggerLogin, { isLoading: isLoginLoading }] = useLoginMutation();
  const [triggerRegister, { isLoading: isRegisterLoading }] =
    useRegisterMutation();
  const [updateProfile, { isLoading: isUpdatingProfile }] =
    useUpdateMyProfileMutation();
  const [updateProfileWithImage, { isLoading: isUpdatingProfileWithImage }] =
    useUpdateMyProfileWithImageMutation();
  const isMutating = isLoginLoading || isRegisterLoading || isUpdatingProfile || isUpdatingProfileWithImage;

  // Form state
  const [isSignUp, setIsSignUp] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null); // Store token after step 1
  const FINAL_SIGN_UP_STEP = 3;
  const [signUpStep, setSignUpStep] = useState(0);

  // Refs for form components
  const createAccountFormRef = React.useRef<{ submit: () => void }>(null);
  const userProfileFormRef = React.useRef<{ submit: () => void }>(null);
  const avatarUploadFormRef = React.useRef<{ submit: () => void; getData: () => { avatar: string | null; name: string; description: string } }>(null);

  // Combined form values for multi-step signup
  const [signUpFormValues, setSignUpFormValues] = useState<SignUpFormValues>({
    email: "",
    password: "",
    role: null,
    location: "",
    trainingTypes: [],
    displayName: "",
    bio: "",
  });

  // Function to reset all form states
  const resetFormStates = () => {
    setSignUpFormValues({
      email: "",
      password: "",
      role: null,
      location: "",
      trainingTypes: [],
      displayName: "",
      bio: "",
    });
    setAuthToken(null);
    setSignUpStep(0);
  };

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

  const hydrateUser = async (
    payload: { user: User; token: string },
    successMessage?: string
  ) => {
    // Only save token, not user profile
    await storageService.setAuthToken(payload.token);
    dispatch(setUser(payload));
    Toast.success(successMessage ?? SUCCESS_MESSAGES.loginSuccess);
  };

  const handleLogin = async (values: LoginFormValues) => {
    try {
      const response = await triggerLogin(values).unwrap();

      if (response.status && response.data) {
        const {
          token,
          password: _password,
          ...rest
        } = response.data as Record<string, unknown> & {
          token?: string;
          password?: string;
          onboardingStep?: number;
        };

        if (!token || typeof token !== "string") {
          throw new Error(ERROR_MESSAGES.authenticationError);
        }

        const sanitizedUser = rest as unknown as User;

        // Check if user needs to complete onboarding
        const onboardingStep = sanitizedUser.onboardingStep || 0;

        // Also check if user has data that suggests incomplete onboarding
        const hasLocation = sanitizedUser.location && sanitizedUser.location.trim();
        const hasTrainingTypes = sanitizedUser.trainingTypes && sanitizedUser.trainingTypes.length > 0;
        const hasDisplayName = sanitizedUser.displayName && sanitizedUser.displayName.trim();
        const hasBio = sanitizedUser.bio && sanitizedUser.bio.trim();

        console.log("🔍 Login: onboarding analysis", {
          onboardingStep,
          hasLocation,
          hasTrainingTypes,
          hasDisplayName,
          hasBio,
          shouldRedirect: onboardingStep === 1 || onboardingStep === 2 || (onboardingStep === 0 && (hasLocation || hasTrainingTypes))
        });

        if (onboardingStep === 1) {
          // User completed registration but not profile - resume from step 2
          console.log("🔄 Resuming onboarding from profile step");
          setIsSignUp(true);
          setSignUpStep(2);
          setAuthToken(token);
          await storageService.setAuthToken(token);

          // Pre-fill form values from user data
          setSignUpFormValues({
            email: sanitizedUser.email || "",
            password: "",
            role: sanitizedUser.role || null,
            location: sanitizedUser.location || "",
            trainingTypes: sanitizedUser.trainingTypes || [],
            displayName: sanitizedUser.displayName || "",
            bio: sanitizedUser.bio || "",
          });

          Toast.success("Welcome back! Please complete your profile setup.");
          return;
        } else if (onboardingStep === 2) {
          // User completed profile but not avatar - resume from step 3
          console.log("🔄 Resuming onboarding from avatar step");
          setIsSignUp(true);
          setSignUpStep(3);
          setAuthToken(token);
          await storageService.setAuthToken(token);

          // Pre-fill form values from user data
          setSignUpFormValues({
            email: sanitizedUser.email || "",
            password: "",
            role: sanitizedUser.role || null,
            location: sanitizedUser.location || "",
            trainingTypes: sanitizedUser.trainingTypes || [],
            displayName: sanitizedUser.displayName || "",
            bio: sanitizedUser.bio || "",
          });

          Toast.success("Welcome back! Please upload your profile picture.");
          return;
        } else if (onboardingStep === 0 && (hasLocation || hasTrainingTypes)) {
          // User has some profile data but onboardingStep is 0 - likely started but didn't complete
          // Determine which step to resume from based on what data they have
          if (hasDisplayName && hasBio) {
            // Has profile data but no avatar - resume from step 3
            console.log("🔄 Detected incomplete onboarding - resuming from avatar step");
            setIsSignUp(true);
            setSignUpStep(3);
            setAuthToken(token);
            await storageService.setAuthToken(token);

            setSignUpFormValues({
              email: sanitizedUser.email || "",
              password: "",
              role: sanitizedUser.role || null,
              location: sanitizedUser.location || "",
              trainingTypes: sanitizedUser.trainingTypes || [],
              displayName: sanitizedUser.displayName || "",
              bio: sanitizedUser.bio || "",
            });

            Toast.success("Welcome back! Please upload your profile picture.");
            return;
          } else {
            // Has some profile data but not complete - resume from step 2
            console.log("🔄 Detected incomplete onboarding - resuming from profile step");
            setIsSignUp(true);
            setSignUpStep(2);
            setAuthToken(token);
            await storageService.setAuthToken(token);

            setSignUpFormValues({
              email: sanitizedUser.email || "",
              password: "",
              role: sanitizedUser.role || null,
              location: sanitizedUser.location || "",
              trainingTypes: sanitizedUser.trainingTypes || [],
              displayName: sanitizedUser.displayName || "",
              bio: sanitizedUser.bio || "",
            });

            Toast.success("Welcome back! Please complete your profile setup.");
            return;
          }
        }

        if (onboardingStep === 1) {
          // User completed registration but not profile - resume from step 2
          console.log("🔄 Resuming onboarding from profile step");
          setIsSignUp(true);
          setSignUpStep(2);
          setAuthToken(token);
          await storageService.setAuthToken(token);

          // Pre-fill form values from user data
          setSignUpFormValues({
            email: sanitizedUser.email || "",
            password: "",
            role: sanitizedUser.role || null,
            location: sanitizedUser.location || "",
            trainingTypes: sanitizedUser.trainingTypes || [],
            displayName: sanitizedUser.displayName || "",
            bio: sanitizedUser.bio || "",
          });

          Toast.success("Welcome back! Please complete your profile setup.");
          return;
        } else if (onboardingStep === 2) {
          // User completed profile but not avatar - resume from step 3
          console.log("🔄 Resuming onboarding from avatar step");
          setIsSignUp(true);
          setSignUpStep(3);
          setAuthToken(token);
          await storageService.setAuthToken(token);

          // Pre-fill form values from user data
          setSignUpFormValues({
            email: sanitizedUser.email || "",
            password: "",
            role: sanitizedUser.role || null,
            location: sanitizedUser.location || "",
            trainingTypes: sanitizedUser.trainingTypes || [],
            displayName: sanitizedUser.displayName || "",
            bio: sanitizedUser.bio || "",
          });

          Toast.success("Welcome back! Please upload your profile picture.");
          return;
        }

        // User has completed onboarding - proceed with normal login
        await hydrateUser(
          { user: sanitizedUser, token },
          response.message || STRINGS.AUTH.success.loggedIn
        );
      } else {
        throw new Error(response.message || ERROR_MESSAGES.authenticationError);
      }
    } catch (error: any) {
      // Handle RTK Query errors
      let message = "Authentication failed";

      console.error("Login error:", error);

      // RTK Query error structure
      if (error?.data?.message) {
        // Backend error response
        message = error.data.message;
      } else if (error?.data?.error) {
        // Alternative backend error format
        message = error.data.error;
      } else if (error?.message) {
        // Standard Error object
        message = error.message;
      } else if (error?.status) {
        // HTTP status code errors
        if (error.status === 401) {
          message = "Invalid email or password. Please try again.";
        } else if (error.status === 404) {
          message = "Account not found. Please check your email or sign up.";
        } else if (error.status === 500) {
          message = "Server error. Please try again later.";
        }
      } else if (typeof error === "string") {
        message = error;
      }

      Toast.error(message);
      console.log("Error toast shown:", message);
    }
  };

  const handleForgotPassword = async () => {
    navigation.navigate("ForgotPassword");
  };

  const nextStep = () => {
    if (signUpStep < FINAL_SIGN_UP_STEP) {
      setSignUpStep(signUpStep + 1);
    }
  };

  const prevStep = () => {
    if (signUpStep > 0) {
      // Reset auth token when going back to email/password step
      if (signUpStep === 1) {
        setAuthToken(null);
        storageService.removeAuthToken();
      }
      setSignUpStep(signUpStep - 1);
    }
  };

  const renderSignUpStep = () => {
    switch (signUpStep) {
      case 0:
        return <RoleSelection onNext={(role) => {
          setSignUpFormValues(prev => ({ ...prev, role }));
          setSignUpStep(1);
        }} />;

      case 1:
        return (
          <View style={styles.stepContainer}>
            <CreateAccountForm
              ref={createAccountFormRef}
              initialEmail={signUpFormValues.email}
              initialPassword={signUpFormValues.password}
              onNext={async (data) => {
                try {
                  // Call register API with email, password, and role
                  const registerResponse = await triggerRegister({
                    email: data.email,
                    password: data.password,
                    role: signUpFormValues.role || 'user', // Use role from step 0
                    onboardingStep: 1, // Mark step 1 as completed
                  }).unwrap();

                  if (!registerResponse.status) {
                    throw new Error(registerResponse.message || 'Registration failed');
                  }

                  // Store the auth token for subsequent API calls
                  const token = registerResponse.data.token;
                  setAuthToken(token);
                  await storageService.setAuthToken(token);

                  // Store user data and move to next step
                  setSignUpFormValues(prev => ({ ...prev, email: data.email, password: data.password }));
                  setSignUpStep(2);
                } catch (error: any) {
                  let message = 'Registration failed';
                  if (error?.data?.message) {
                    message = error.data.message;
                  } else if (error?.message) {
                    message = error.message;
                  }
                  Toast.error(message);
                }
              }}
            />
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 20 }}>
              <TouchableOpacity style={styles.backButton} onPress={() => setSignUpStep(0)}>
                <Text style={styles.backBtnText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.nextButton} onPress={() => {
                createAccountFormRef.current?.submit();
              }}>
                <Text style={styles.nextButtonText}>Next</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContainer}>
            <UserProfileForm
              ref={userProfileFormRef}
              initialLocation={signUpFormValues.location}
              initialSpecialties={signUpFormValues.trainingTypes}
              onNext={async (data) => {
                try {
                  // Call update API with location and specialties
                  const updateResponse = await updateProfile({
                    location: data.location,
                    trainingTypes: data.specialties,
                    onboardingStep: 2, // Mark step 2 as completed
                  }).unwrap();

                  if (!updateResponse.status) {
                    throw new Error(updateResponse.message || 'Profile update failed');
                  }

                  // Store the profile data and move to next step
                  setSignUpFormValues(prev => ({ ...prev, location: data.location, trainingTypes: data.specialties }));
                  setSignUpStep(3);
                } catch (error: any) {
                  let message = 'Profile update failed';
                  if (error?.data?.message) {
                    message = error.data.message;
                  } else if (error?.message) {
                    message = error.message;
                  }
                  Toast.error(message);
                }
              }}
            />
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 20 }}>
              <TouchableOpacity style={styles.backButton} onPress={() => setSignUpStep(1)}>
                <Text style={styles.backBtnText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.nextButton} onPress={() => {
                userProfileFormRef.current?.submit();
              }}>
                <Text style={styles.nextButtonText}>Next</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContainer}>
            <AvatarUploadForm
              ref={avatarUploadFormRef}
              onDataChange={async (data) => {
                try {
                  // Prepare data for API call
                  const updateData: any = {
                    displayName: data.name,
                    bio: data.description,
                  };

                  const imageFile = data.avatar ? { uri: data.avatar, type: 'image/jpeg', name: 'profile.jpg' } : null;

                  let updateResponse;
                  
                  // If there's an avatar image, use the image upload mutation
                  if (data.avatar) {
                    updateResponse = await updateProfileWithImage({
                      ...updateData,
                      imageFile,
                      onboardingStep: 3, // Mark onboarding as completed
                    }).unwrap();
                  } else {
                    // No image, use regular update
                    updateResponse = await updateProfile({
                      ...updateData,
                      onboardingStep: 3, // Mark onboarding as completed
                    }).unwrap();
                  }
                  
                  // Signup complete - navigate to main screen
                  await hydrateUser(
                    { user: (updateResponse as any).data, token: authToken! },
                    "Account created successfully!"
                  );
                  // Navigate to main screen - adjust this based on your navigation structure
                  navigation.navigate('Main');
                } catch (error: any) {
                  let message = 'Profile update failed';
                  if (error?.data?.message) {
                    message = error.data.message;
                  } else if (error?.message) {
                    message = error.message;
                  }
                  Toast.error(message);
                }
              }}
              initialName={signUpFormValues.displayName || ""}
              initialDescription=""
              initialAvatar={null}
            />
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 20 }}>
              <TouchableOpacity style={styles.backButton} onPress={() => setSignUpStep(2)}>
                <Text style={styles.backBtnText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.nextButton} 
                onPress={() => {
                  avatarUploadFormRef.current?.submit();
                }}
              >
                <Text style={styles.nextButtonText}>Complete</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  const renderLoginForm = () => (
    <Formik
      key="login-form"
      initialValues={{ email: "", password: "" }}
      validationSchema={loginSchema}
      onSubmit={handleLogin}
      validateOnChange={true}
      validateOnBlur={true}
    >
      {({
        values,
        errors,
        touched,
        handleChange,
        handleBlur,
        handleSubmit,
      }) => (
        <View style={styles.formContainer}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to continue</Text>

          <TextInput
            style={[
              styles.input,
              errors.email && touched.email && styles.inputError,
            ]}
            placeholder="Email"
            value={values.email}
            onChangeText={handleChange("email")}
            onBlur={handleBlur("email")}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          {errors.email && touched.email && (
            <Text style={styles.errorText}>{errors.email}</Text>
          )}

          <TextInput
            style={[
              styles.input,
              errors.password && touched.password && styles.inputError,
            ]}
            placeholder="Password"
            value={values.password}
            onChangeText={handleChange("password")}
            onBlur={handleBlur("password")}
            secureTextEntry
          />
          {errors.password && touched.password && (
            <Text style={styles.errorText}>{errors.password}</Text>
          )}

          <TouchableOpacity
            onPress={handleForgotPassword}
            style={styles.forgotPasswordContainer}
          >
            <Text style={styles.forgotPassword}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.submitButton,
              isMutating && styles.submitButtonDisabled,
            ]}
            onPress={() => handleSubmit()}
            disabled={isMutating}
          >
            {isMutating ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color={COLORS.white} size="small" />
                <Text style={[styles.submitButtonText, { marginLeft: 8 }]}>
                  Signing In...
                </Text>
              </View>
            ) : (
              <Text style={styles.submitButtonText}>Sign In</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </Formik>
  );

  const renderSignUpForm = () => {
    return renderSignUpStep();
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
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
            <MaskedView
              maskElement={<Text style={styles.brandName}>BolicBuddy</Text>}
            >
              <LinearGradient
                colors={[COLORS.gradient1, COLORS.gradient2, COLORS.gradient3]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 0 }}
              >
                <Text style={[styles.brandName, { opacity: 0 }]}>
                  BolicBuddy
                </Text>
              </LinearGradient>
            </MaskedView>
            <Text style={styles.brandTagline}>
              Find your perfect training partner
            </Text>
          </View>

          {/* Mode Toggle */}
          <View style={styles.modeToggle}>
            <TouchableOpacity
              style={[styles.modeButton, !isSignUp && styles.modeButtonActive]}
              onPress={() => {
                resetFormStates();
                setIsSignUp(false);
              }}
            >
              <Text
                style={[styles.modeText, !isSignUp && styles.modeTextActive]}
              >
                Sign In
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeButton, isSignUp && styles.modeButtonActive]}
              onPress={() => {
                resetFormStates();
                setIsSignUp(true);
              }}
            >
              <Text
                style={[styles.modeText, isSignUp && styles.modeTextActive]}
              >
                Sign Up
              </Text>
            </TouchableOpacity>
          </View>
          {isSignUp && (
            <OnboardingStepHeader
              title={
                signUpStep === 0 ? "Join as a..." :
                signUpStep === 1 ? "Create Account" :
                signUpStep === 2 ? "Tell us about yourself" :
                "Setup Profile"
              }
              stepText={`Step ${signUpStep + 1} of 4`}
              progress={(signUpStep + 1) / 4}
            />
          )}
          {/* Form */}
          {isSignUp ? renderSignUpForm() : renderLoginForm()}

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              {isSignUp ? "Already have an account?" : "Don't have an account?"}
            </Text>
            <TouchableOpacity
              onPress={() => {
                resetFormStates();
                setIsSignUp(!isSignUp);
              }}
            >
              <Text style={styles.footerLink}>
                {isSignUp ? "Sign In" : "Sign Up"}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  inputError: {
    borderColor: COLORS.error,
    borderWidth: 2,
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
  forgotPasswordContainer: {
    alignSelf: "flex-end",
    marginBottom: DIMENSIONS.spacing.sm,
  },
  forgotPassword: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.primary,
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
    backgroundColor: COLORS.white,
    borderRadius: DIMENSIONS.borderRadius,
    paddingVertical: DIMENSIONS.spacing.md,
    alignItems: "center",
    marginLeft: DIMENSIONS.spacing.sm,
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
  backBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
  },
  sendCodeButton: {
    backgroundColor: COLORS.primary,
    borderRadius: DIMENSIONS.borderRadius,
    paddingVertical: DIMENSIONS.spacing.md,
    alignItems: "center",
    marginVertical: DIMENSIONS.spacing.md,
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
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    color: COLORS.error,
    fontSize: 14,
    marginTop: -DIMENSIONS.spacing.sm,
    marginBottom: DIMENSIONS.spacing.sm,
    marginLeft: DIMENSIONS.spacing.xs,
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
});

export default AuthScreen;
