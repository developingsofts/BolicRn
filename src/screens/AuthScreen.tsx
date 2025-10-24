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
  TRAINING_TYPES,
  GENDER_OPTIONS,
  GENDER_PREFERENCE_OPTIONS,
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
import { loginSchema, signUpSchema } from "../validation/authSchemas";
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
  displayName: string;
  phoneNumber: string;
  verificationCode: string;
  age: string;
  trainingTypes: string[];
  genderPreference: string;
  userGender: string;
  currentPRs: string;
  role?: "user" | "trainer" | null;
  location: string;
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
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [expectedVerificationCode, setExpectedVerificationCode] = useState<string | null>(null);
  const [verifiedPhoneNumber, setVerifiedPhoneNumber] = useState<string | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [signUpStep, setSignUpStep] = useState(0);
  const [isTrainerFlow, setIsTrainerFlow] = useState(false);

  // Refs for form components
  const createAccountFormRef = React.useRef<{ submit: () => void }>(null);
  const userProfileFormRef = React.useRef<{ submit: () => void }>(null);
  const avatarUploadFormRef = React.useRef<{ submit: () => void; getData: () => { avatar: string | null; name: string; description: string } }>(null);

  // Combined form values for multi-step signup
  const [signUpFormValues, setSignUpFormValues] = useState<SignUpFormValues>({
    email: "",
    password: "",
    displayName: "",
    phoneNumber: "",
    verificationCode: "",
    age: "",
    trainingTypes: [],
    genderPreference: "",
    userGender: "",
    currentPRs: "",
    role: null,
    location: "",
    bio: "",
  });

  // Function to get step title based on flow and step
  const getStepTitle = (step: number, isTrainer: boolean) => {
    if (step === 0) {
      return "Join as a...";
    }
    if (isTrainer) {
      switch (step) {
        case 1:
          return "Create Account";
        case 2:
          return "Tell us about yourself";
        case 3:
          return "Setup Profile";
        default:
          return "Setup Profile";
      }
    } else {
      switch (step) {
        case 1:
          return "Create Account";
        case 2:
          return "Phone Number";
        case 3:
          return "Verify Code";
        case 4:
          return "Your Name";
        case 5:
          return "Your Age";
        case 6:
          return "Training Types";
        case 7:
          return "Gender Preferences";
        default:
          return "Create Account";
      }
    }
  };

  // Function to reset all form states
  const resetFormStates = () => {
    setSignUpFormValues({
      email: "",
      password: "",
      displayName: "",
      phoneNumber: "",
      verificationCode: "",
      age: "",
      trainingTypes: [],
      genderPreference: "",
      userGender: "",
      currentPRs: "",
      role: null,
      location: "",
      bio: "",
    });
    setIsPhoneVerified(false);
    setExpectedVerificationCode(null);
    setVerifiedPhoneNumber(null);
    setAuthToken(null);
    setSignUpStep(0);
    setIsTrainerFlow(false);
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

  const handleSignUp = async (values: SignUpFormValues) => {

   
    try {
      // Step 0: Create account with only email and password
      if (!authToken) {
        const registrationResponse = await triggerRegister({
          email: values.email,
          password: values.password,
        }).unwrap();
console.log('Registration response:', registrationResponse);
        if (!registrationResponse.status) {
          throw new Error(registrationResponse.message || ERROR_MESSAGES.authenticationError);
        }

        const { token, password: _password, ...rest } = registrationResponse.data as Record<string, unknown> & {
          token?: string;
          password?: string;
        };

        if (!token || typeof token !== "string") {
          throw new Error(ERROR_MESSAGES.authenticationError);
        }

        // Store token for subsequent updates
        setAuthToken(token);
        await storageService.setAuthToken(token);

        console.log('✅ Account created, token saved. Now collecting additional info...');
        // Don't show toast here - only show on final step
        
        // Move to next step after successful account creation
        nextStep();
        return;
      }
      
    } catch (error: any) {
      // Handle RTK Query errors
      let message = "Authentication failed";
      
      console.error('Signup error:', error);
      console.log('Error data:', error.data);
      console.log('Error status:', error.status);
      console.log('Error message:', error.message);
      console.log('Full error object:', JSON.stringify(error, null, 2));
      
      // RTK Query error structure
      if (error?.data?.message) {
        // Backend error response
        message = error.data.message;
        console.log('✅ Using backend message from error.data.message:', message);
      } else if (error?.data?.error) {
        // Alternative backend error format
        message = error.data.error;
        console.log('✅ Using alternative backend error from error.data.error:', message);
      } else if (error?.message) {
        // Standard Error object
        message = error.message;
        console.log('✅ Using error.message:', message);
      } else if (error?.status) {
        // HTTP status code errors
        console.log('Checking status:', error.status);
        if (error.status === 409 || error.status === 400) {
          message = error?.data?.message || error?.data?.error || "Email already exists. Please use a different email or sign in.";
          console.log('✅ Using status-based message for 409/400:', message);
        } else if (error.status === 500) {
          message = "Server error. Please try again later.";
          console.log('✅ Using status-based message for 500:', message);
        } else {
          console.log('Status not 409/400/500, status:', error.status);
        }
      } else if (typeof error === 'string') {
        message = error;
        console.log('✅ Using string error:', message);
      } else {
        console.log('No matching error condition found');
      }
      
      console.log('Final message to display:', message);
      Toast.error(message);
      console.log('Error toast shown:', message);
    }
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
          role?: string;
        };

        if (!token || typeof token !== "string") {
          throw new Error(ERROR_MESSAGES.authenticationError);
        }

        const sanitizedUser = rest as unknown as User;

        // Check if user needs to complete onboarding
        const onboardingStep = sanitizedUser.onboardingStep || 0;
        const userRole = sanitizedUser.role;

        // Determine flow based on role
        const isTrainer = userRole === 'trainer';
        setIsTrainerFlow(isTrainer);

        // Check if user has data that suggests incomplete onboarding
        const hasLocation = sanitizedUser.location && sanitizedUser.location.trim();
        const hasTrainingTypes = sanitizedUser.trainingTypes && sanitizedUser.trainingTypes.length > 0;
        const hasDisplayName = sanitizedUser.displayName && sanitizedUser.displayName.trim();
        const hasBio = sanitizedUser.bio && sanitizedUser.bio.trim();
        const hasPhone = sanitizedUser.phoneNumber && sanitizedUser.phoneVerified;
        const hasAge = sanitizedUser.age;
        const hasGender = sanitizedUser.userGender && sanitizedUser.genderPreference;

        console.log("🔍 Login: onboarding analysis", {
          onboardingStep,
          userRole,
          isTrainer,
          hasLocation,
          hasTrainingTypes,
          hasDisplayName,
          hasBio,
          hasPhone,
          hasAge,
          hasGender,
        });

        if (isTrainer) {
          // Trainer flow logic
          if (onboardingStep === 1) {
            // Completed registration, resume from profile
            console.log("🔄 Resuming trainer onboarding from profile step");
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
              phoneNumber: "",
              verificationCode: "",
              age: "",
              genderPreference: "",
              userGender: "",
              currentPRs: "",
            });

            Toast.success("Welcome back! Please complete your profile setup.");
            return;
          } else if (onboardingStep === 2) {
            // Completed profile, resume from avatar
            console.log("🔄 Resuming trainer onboarding from avatar step");
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
              phoneNumber: "",
              verificationCode: "",
              age: "",
              genderPreference: "",
              userGender: "",
              currentPRs: "",
            });

            Toast.success("Welcome back! Please upload your profile picture.");
            return;
          } else if (onboardingStep === 0 && (hasLocation || hasTrainingTypes)) {
            // Has some profile data but onboardingStep is 0
            if (hasDisplayName && hasBio) {
              // Resume from avatar
              console.log("🔄 Detected incomplete trainer onboarding - resuming from avatar step");
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
                phoneNumber: "",
                verificationCode: "",
                age: "",
                genderPreference: "",
                userGender: "",
                currentPRs: "",
              });

              Toast.success("Welcome back! Please upload your profile picture.");
              return;
            } else {
              // Resume from profile
              console.log("🔄 Detected incomplete trainer onboarding - resuming from profile step");
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
                phoneNumber: "",
                verificationCode: "",
                age: "",
                genderPreference: "",
                userGender: "",
                currentPRs: "",
              });

              Toast.success("Welcome back! Please complete your profile setup.");
              return;
            }
          }
        } else {
          // User flow logic (old 7-step)
          const finalStep = 7;
          if (onboardingStep > 0 && onboardingStep < finalStep) {
            console.log('🔄 Resuming user onboarding from step:', onboardingStep);
            setIsSignUp(true);
            setSignUpStep(onboardingStep);
            setAuthToken(token);
            await storageService.setAuthToken(token);

            setSignUpFormValues({
              email: sanitizedUser.email || '',
              password: '',
              displayName: sanitizedUser.displayName || '',
              phoneNumber: sanitizedUser.phoneNumber || '',
              verificationCode: '',
              age: sanitizedUser.age?.toString() || '',
              trainingTypes: sanitizedUser.trainingTypes || [],
              genderPreference: sanitizedUser.genderPreference || '',
              userGender: sanitizedUser.userGender || '',
              currentPRs: sanitizedUser.currentPRs || '',
              role: sanitizedUser.role || null,
              location: "",
              bio: "",
            });

            if (sanitizedUser.phoneVerified) {
              setIsPhoneVerified(true);
              setVerifiedPhoneNumber(sanitizedUser.phoneNumber || null);
            }

            Toast.success("Welcome back! Please complete your profile setup.");
            return;
          }
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
    const finalStep = isTrainerFlow ? 3 : 7;
    if (signUpStep < finalStep) {
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

  // Trainer flow rendering
  const renderTrainerSignUpStep = () => {
    switch (signUpStep) {
      case 0:
        return <RoleSelection onNext={(role) => {
          setSignUpFormValues(prev => ({ ...prev, role }));
          setIsTrainerFlow(role === 'trainer');
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
                  const registerResponse = await triggerRegister({
                    email: data.email,
                    password: data.password,
                    role: signUpFormValues.role || 'trainer',
                    onboardingStep: 1,
                  }).unwrap();

                  if (!registerResponse.status) {
                    throw new Error(registerResponse.message || 'Registration failed');
                  }

                  const token = registerResponse.data.token;
                  setAuthToken(token);
                  await storageService.setAuthToken(token);

                  setSignUpFormValues(prev => ({ ...prev, email: data.email, password: data.password }));
                  setSignUpStep(2);
                } catch (error: any) {
                  console.error('Trainer signup step 1 error:', error);
                  console.log('Error data:', error.data);
                  console.log('Error status:', error.status);
                  console.log('Error message:', error.message);
                  console.log('Full error object:', JSON.stringify(error, null, 2));
                  
                  let message = 'Registration failed';
                  if (error?.data?.message) {
                    message = error.data.message;
                    console.log('✅ Using backend message from error.data.message:', message);
                  } else if (error?.data?.error) {
                    message = error.data.error;
                    console.log('✅ Using alternative backend error from error.data.error:', message);
                  } else if (error?.message) {
                    message = error.message;
                    console.log('✅ Using error.message:', message);
                  } else if (error?.status) {
                    console.log('Checking status:', error.status);
                    if (error.status === 409 || error.status === 400) {
                      message = error?.data?.message || error?.data?.error || "Email already exists. Please use a different email or sign in.";
                      console.log('✅ Using status-based message for 409/400:', message);
                    } else if (error.status === 500) {
                      message = "Server error. Please try again later.";
                      console.log('✅ Using status-based message for 500:', message);
                    }
                  } else if (typeof error === 'string') {
                    message = error;
                    console.log('✅ Using string error:', message);
                  }
                  
                  console.log('Final message to display:', message);
                  Toast.error(message);
                  console.log('Error toast shown:', message);
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
                  const updateResponse = await updateProfile({
                    location: data.location,
                    trainingTypes: data.specialties,
                    onboardingStep: 2,
                  }).unwrap();

                  if (!updateResponse.status) {
                    throw new Error(updateResponse.message || 'Profile update failed');
                  }

                  setSignUpFormValues(prev => ({ ...prev, location: data.location, trainingTypes: data.specialties }));
                  setSignUpStep(3);
                } catch (error: any) {
                  console.error('Trainer signup step 2 error:', error);
                  console.log('Error data:', error.data);
                  console.log('Error status:', error.status);
                  console.log('Error message:', error.message);
                  console.log('Full error object:', JSON.stringify(error, null, 2));
                  
                  let message = 'Profile update failed';
                  if (error?.data?.message) {
                    message = error.data.message;
                    console.log('✅ Using backend message from error.data.message:', message);
                  } else if (error?.data?.error) {
                    message = error.data.error;
                    console.log('✅ Using alternative backend error from error.data.error:', message);
                  } else if (error?.message) {
                    message = error.message;
                    console.log('✅ Using error.message:', message);
                  } else if (error?.status) {
                    console.log('Checking status:', error.status);
                    if (error.status === 409 || error.status === 400) {
                      message = error?.data?.message || error?.data?.error || "Email already exists. Please use a different email or sign in.";
                      console.log('✅ Using status-based message for 409/400:', message);
                    } else if (error.status === 500) {
                      message = "Server error. Please try again later.";
                      console.log('✅ Using status-based message for 500:', message);
                    }
                  } else if (typeof error === 'string') {
                    message = error;
                    console.log('✅ Using string error:', message);
                  }
                  
                  console.log('Final message to display:', message);
                  Toast.error(message);
                  console.log('Error toast shown:', message);
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
                  const updateData: any = {
                    displayName: data.name,
                    bio: data.description,
                  };

                  const imageFile = data.avatar ? { uri: data.avatar, type: 'image/jpeg', name: 'profile.jpg' } : null;

                  let updateResponse;
                  
                  if (data.avatar) {
                    updateResponse = await updateProfileWithImage({
                      ...updateData,
                      imageFile,
                      onboardingStep: 3,
                    }).unwrap();
                  } else {
                    updateResponse = await updateProfile({
                      ...updateData,
                      onboardingStep: 3,
                    }).unwrap();
                  }
                  
                  await hydrateUser(
                    { user: (updateResponse as any).data, token: authToken! },
                    "Account created successfully!"
                  );
                  navigation.navigate('Main');
                } catch (error: any) {
                  console.error('Trainer signup step 3 error:', error);
                  console.log('Error data:', error.data);
                  console.log('Error status:', error.status);
                  console.log('Error message:', error.message);
                  console.log('Full error object:', JSON.stringify(error, null, 2));
                  
                  let message = 'Profile update failed';
                  if (error?.data?.message) {
                    message = error.data.message;
                    console.log('✅ Using backend message from error.data.message:', message);
                  } else if (error?.data?.error) {
                    message = error.data.error;
                    console.log('✅ Using alternative backend error from error.data.error:', message);
                  } else if (error?.message) {
                    message = error.message;
                    console.log('✅ Using error.message:', message);
                  } else if (error?.status) {
                    console.log('Checking status:', error.status);
                    if (error.status === 409 || error.status === 400) {
                      message = error?.data?.message || error?.data?.error || "Email already exists. Please use a different email or sign in.";
                      console.log('✅ Using status-based message for 409/400:', message);
                    } else if (error.status === 500) {
                      message = "Server error. Please try again later.";
                      console.log('✅ Using status-based message for 500:', message);
                    }
                  } else if (typeof error === 'string') {
                    message = error;
                    console.log('✅ Using string error:', message);
                  }
                  
                  console.log('Final message to display:', message);
                  Toast.error(message);
                  console.log('Error toast shown:', message);
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

  const renderSignUpForm = () => {
    if (isTrainerFlow) {
      return renderTrainerSignUpStep();
    } else {
      // For user flow, start with role selection
      if (signUpStep === 0) {
        return <RoleSelection onNext={(role) => {
          setSignUpFormValues(prev => ({ ...prev, role }));
          setIsTrainerFlow(role === 'trainer');
          setSignUpStep(1);
        }} />;
      } else {
        return (
          <Formik
            key={`user-signup-form-${signUpStep}`}
            initialValues={signUpFormValues}
            validationSchema={signUpSchema}
            onSubmit={handleSignUp}
            validateOnChange={true}
            validateOnBlur={true}
            enableReinitialize
          >
            {({ values, errors, touched, handleChange, handleBlur, setFieldValue, validateForm }) =>
              renderUserSignUpStep(values, errors, touched, handleChange, handleBlur, setFieldValue, validateForm, setExpectedVerificationCode, setVerifiedPhoneNumber, setIsPhoneVerified, setIsSendingCode, setIsVerifyingCode, nextStep)
            }
          </Formik>
        );
      }
    }
  };

  // User flow rendering (old 7-step)
  const renderUserSignUpStep = (
    values: SignUpFormValues,
    errors: any,
    touched: any,
    handleChange: any,
    handleBlur: any,
    setFieldValue: any,
    validateForm: any,
    setExpectedVerificationCode: (code: string | null) => void,
    setVerifiedPhoneNumber: (phone: string | null) => void,
    setIsPhoneVerified: (verified: boolean) => void,
    setIsSendingCode: (sending: boolean) => void,
    setIsVerifyingCode: (verifying: boolean) => void,
    nextStep: () => void
  ) => {
    const convertGenderPreference = (preference: string, userGender: string): string => {
      if (preference === 'All') return 'all';
      if (preference === 'Same Gender Only') {
        return userGender.toLowerCase();
      }
      if (preference === 'Opposite Gender Only') {
        const gender = userGender.toLowerCase();
        if (gender === 'male') return 'female';
        if (gender === 'female') return 'male';
        if (gender === 'non-binary' || gender === 'prefer not to say') return 'all';
        return 'all';
      }
      return preference.toLowerCase();
    };

    const handleNextWithValidation = async () => {
      const validationErrors = await validateForm();
      
      let fieldsToValidate: string[] = [];
      switch (signUpStep) {
        case 1:
          fieldsToValidate = ["email", "password"];
          break;
        case 2:
          fieldsToValidate = ["phoneNumber"];
          break;
        case 3:
          fieldsToValidate = ["verificationCode"];
          if (!isPhoneVerified) {
            Toast.error("Please verify your phone number first");
            return;
          }
          break;
        case 4:
          fieldsToValidate = ["displayName"];
          break;
        case 5:
          fieldsToValidate = ["age"];
          break;
        case 6:
          fieldsToValidate = ["trainingTypes"];
          break;
        case 7:
          fieldsToValidate = ["userGender", "genderPreference"];
          break;
      }

      const hasErrors = fieldsToValidate.some(field => validationErrors[field]);
      
      if (hasErrors) {
        const firstError = fieldsToValidate.find(field => validationErrors[field]);
        if (firstError) {
          Toast.error(validationErrors[firstError]);
        }
        return;
      }

      if (signUpStep === 1) {
        const registrationResponse = await triggerRegister({
          email: values.email,
          password: values.password,
          role: signUpFormValues.role || 'user',
          onboardingStep: 1,
        }).unwrap();

        if (!registrationResponse.status) {
          throw new Error(registrationResponse.message || ERROR_MESSAGES.authenticationError);
        }

        const { token } = registrationResponse.data;
        setAuthToken(token);
        await storageService.setAuthToken(token);

        nextStep();
        return;
      }

      try {
        const updateData: any = { onboardingStep: signUpStep };
        
        switch (signUpStep) {
          case 2:
            if (!verifiedPhoneNumber || values.phoneNumber.trim() !== verifiedPhoneNumber) {
              Toast.error("Please send verification code to this phone number first");
              return;
            }
            updateData.phoneNumber = values.phoneNumber;
            break;
          case 3:
            updateData.phoneVerified = true;
            break;
          case 4:
            updateData.userName = values.displayName;
            break;
          case 5:
            updateData.age = parseInt(values.age);
            break;
          case 6:
            updateData.trainingTypes = values.trainingTypes;
            break;
          case 7:
            updateData.userGender = values.userGender.toLowerCase();
            updateData.genderPreference = convertGenderPreference(values.genderPreference, values.userGender);
            if (values.currentPRs) updateData.currentPRs = values.currentPRs;
            updateData.onboardingStep = 7;
            break;
        }

        const updateResponse = await updateProfile(updateData).unwrap();

        if (!updateResponse.status) {
          throw new Error(updateResponse.message || ERROR_MESSAGES.authenticationError);
        }

        if (signUpStep !== 7) {
          setSignUpFormValues({ ...signUpFormValues, ...values });
          nextStep();
        } else {
          const sanitizedUser = updateResponse.data as User;
          await hydrateUser({ user: sanitizedUser, token: authToken! }, "Account created successfully!");
        }
      } catch (error: any) {
        // Handle RTK Query errors
        let message = "Failed to update profile";
        
        console.error(signUpStep === 1 ? 'Signup error:' : 'Profile update error:', error);
        console.log('Error data:', error.data);
        console.log('Error status:', error.status);
        console.log('Error message:', error.message);
        console.log('Full error object:', JSON.stringify(error, null, 2));
        
        // RTK Query error structure
        if (error?.data?.message) {
          // Backend error response
          message = error.data.message;
          console.log('✅ Using backend message from error.data.message:', message);
        } else if (error?.data?.error) {
          // Alternative backend error format
          message = error.data.error;
          console.log('✅ Using alternative backend error from error.data.error:', message);
        } else if (error?.message) {
          // Standard Error object
          message = error.message;
          console.log('✅ Using error.message:', message);
        } else if (error?.status) {
          // HTTP status code errors
          console.log('Checking status:', error.status);
          if (error.status === 409 || error.status === 400) {
            message = error?.data?.message || error?.data?.error || "Email already exists. Please use a different email or sign in.";
            console.log('✅ Using status-based message for 409/400:', message);
          } else if (error.status === 500) {
            message = "Server error. Please try again later.";
            console.log('✅ Using status-based message for 500:', message);
          } else {
            console.log('Status not 409/400/500, status:', error.status);
          }
        } else if (typeof error === 'string') {
          message = error;
          console.log('✅ Using string error:', message);
        } else {
          console.log('No matching error condition found');
        }
        
        console.log('Final message to display:', message);
        Toast.error(message);
        alert('Error: ' + message); // Temporary debug
        console.log('Error toast shown:', message);
      }
    };

    switch (signUpStep) {
      case 1: // Email/Password
        return (
          <View style={styles.stepContainer}>

            <TextInput
              style={[styles.input, errors.email && touched.email && styles.inputError]}
              placeholder={STRINGS.AUTH.email}
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
              style={[styles.input, errors.password && touched.password && styles.inputError]}
              placeholder={STRINGS.AUTH.password}
              value={values.password}
              onChangeText={handleChange("password")}
              onBlur={handleBlur("password")}
              secureTextEntry
            />
            {errors.password && touched.password && (
              <Text style={styles.errorText}>{errors.password}</Text>
            )}

            <TouchableOpacity style={styles.nextButton} onPress={handleNextWithValidation}>
              <Text style={styles.nextButtonText}>{STRINGS.AUTH.next}</Text>
            </TouchableOpacity>
          </View>
        );

      case 2: // Phone Number
        return (
          <View style={styles.stepContainer}>

            <Text style={styles.fieldLabel}>
              {STRINGS.AUTH.labels.verificationMessage}
            </Text>

            <TextInput
              style={[styles.input, errors.phoneNumber && touched.phoneNumber && styles.inputError]}
              placeholder={STRINGS.AUTH.phoneNumber}
              value={values.phoneNumber}
              onChangeText={(text) => {
                handleChange("phoneNumber")(text);
                if (text.trim() !== verifiedPhoneNumber) {
                  setExpectedVerificationCode(null);
                  setVerifiedPhoneNumber(null);
                }
              }}
              onBlur={handleBlur("phoneNumber")}
              keyboardType="phone-pad"
            />
            {errors.phoneNumber && touched.phoneNumber && (
              <Text style={styles.errorText}>{errors.phoneNumber}</Text>
            )}

            <TouchableOpacity
              style={[
                styles.sendCodeButton,
                isSendingCode && styles.sendCodeButtonDisabled,
              ]}
              onPress={() => sendVerificationCode(values.phoneNumber, setExpectedVerificationCode, setVerifiedPhoneNumber, setIsPhoneVerified, setIsSendingCode)}
              disabled={isSendingCode}
            >
              {isSendingCode ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color={COLORS.primary} size="small" />
                  <Text style={[styles.sendCodeButtonText, { marginLeft: 8 }]}>
                    {STRINGS.AUTH.sending}
                  </Text>
                </View>
              ) : (
                <Text style={styles.sendCodeButtonText}>
                  {STRINGS.AUTH.sendCode}
                </Text>
              )}
            </TouchableOpacity>

            <View style={styles.stepButtons}>
              <TouchableOpacity style={styles.backButton} onPress={prevStep}>
                <Text style={styles.backButtonText}>{STRINGS.AUTH.back}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.nextButton,
                  (!verifiedPhoneNumber || values.phoneNumber.trim() !== verifiedPhoneNumber) && styles.nextButtonDisabled
                ]}
                onPress={handleNextWithValidation}
                disabled={!verifiedPhoneNumber || values.phoneNumber.trim() !== verifiedPhoneNumber}
              >
                <Text style={styles.nextButtonText}>{STRINGS.AUTH.next}</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 3: 
        return (
          <View style={styles.stepContainer}>

            <Text style={styles.fieldLabel}>
              {STRINGS.AUTH.labels.enterCodeMessage} {values.phoneNumber}
            </Text>

            <TextInput
              style={[styles.input, errors.verificationCode && touched.verificationCode && styles.inputError]}
              placeholder={STRINGS.AUTH.verificationCode}
              value={values.verificationCode}
              onChangeText={handleChange("verificationCode")}
              onBlur={handleBlur("verificationCode")}
              keyboardType="numeric"
              maxLength={6}
            />
            {errors.verificationCode && touched.verificationCode && (
              <Text style={styles.errorText}>{errors.verificationCode}</Text>
            )}

            <TouchableOpacity
              style={[
                styles.verifyButton,
                isVerifyingCode && styles.verifyButtonDisabled,
              ]}
              onPress={() => verifyCode(values.verificationCode, expectedVerificationCode, setIsPhoneVerified, setIsVerifyingCode, nextStep)}
              disabled={isVerifyingCode}
            >
              {isVerifyingCode ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color={COLORS.white} size="small" />
                  <Text style={[styles.verifyButtonText, { marginLeft: 8 }]}>
                    {STRINGS.AUTH.verifying}
                  </Text>
                </View>
              ) : (
                <Text style={styles.verifyButtonText}>
                  {STRINGS.AUTH.verifyCode}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.resendButton}
              onPress={() => sendVerificationCode(values.phoneNumber, setExpectedVerificationCode, setVerifiedPhoneNumber, setIsPhoneVerified, setIsSendingCode)}
              disabled={isSendingCode}
            >
              {isSendingCode ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color={COLORS.primary} size="small" />
                  <Text style={[styles.resendButtonText, { marginLeft: 8 }]}>
                    Resending...
                  </Text>
                </View>
              ) : (
                <Text style={styles.resendButtonText}>{STRINGS.AUTH.resendCode}</Text>
              )}
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
                onPress={handleNextWithValidation}
                disabled={!isPhoneVerified}
              >
                <Text style={styles.nextButtonText}>{STRINGS.AUTH.next}</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 4: // Display Name
        return (
          <View style={styles.stepContainer}>

            <TextInput
              style={[styles.input, errors.displayName && touched.displayName && styles.inputError]}
              placeholder={STRINGS.AUTH.displayName}
              value={values.displayName}
              onChangeText={handleChange("displayName")}
              onBlur={handleBlur("displayName")}
            />
            {errors.displayName && touched.displayName && (
              <Text style={styles.errorText}>{errors.displayName}</Text>
            )}

            <View style={styles.stepButtons}>
              <TouchableOpacity style={styles.backButton} onPress={prevStep}>
                <Text style={styles.backButtonText}>{STRINGS.AUTH.back}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.nextButton} onPress={handleNextWithValidation}>
                <Text style={styles.nextButtonText}>{STRINGS.AUTH.next}</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 5: // Age
        return (
          <View style={styles.stepContainer}>

            <TextInput
              style={[styles.input, errors.age && touched.age && styles.inputError]}
              placeholder={STRINGS.AUTH.age}
              value={values.age}
              onChangeText={handleChange("age")}
              onBlur={handleBlur("age")}
              keyboardType="numeric"
            />
            {errors.age && touched.age && (
              <Text style={styles.errorText}>{errors.age}</Text>
            )}

            <View style={styles.stepButtons}>
              <TouchableOpacity style={styles.backButton} onPress={prevStep}>
                <Text style={styles.backButtonText}>{STRINGS.AUTH.back}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.nextButton} onPress={handleNextWithValidation}>
                <Text style={styles.nextButtonText}>{STRINGS.AUTH.next}</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 6: // Training Types
        return (
          <View style={styles.stepContainer}>

            <ScrollView style={styles.trainingTypesContainer}>
              {TRAINING_TYPES.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.trainingTypeButton,
                    values.trainingTypes.includes(type) &&
                      styles.trainingTypeButtonActive,
                  ]}
                  onPress={() => {
                    const newTypes = values.trainingTypes.includes(type)
                      ? values.trainingTypes.filter((t) => t !== type)
                      : [...values.trainingTypes, type];
                    setFieldValue("trainingTypes", newTypes);
                  }}
                >
                  <Text
                    style={[
                      styles.trainingTypeText,
                      values.trainingTypes.includes(type) &&
                        styles.trainingTypeTextActive,
                    ]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {errors.trainingTypes && touched.trainingTypes && (
              <Text style={styles.errorText}>{errors.trainingTypes}</Text>
            )}

            <View style={styles.stepButtons}>
              <TouchableOpacity style={styles.backButton} onPress={prevStep}>
                <Text style={styles.backButtonText}>{STRINGS.AUTH.back}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.nextButton} onPress={handleNextWithValidation}>
                <Text style={styles.nextButtonText}>{STRINGS.AUTH.next}</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 7: // Gender Preferences
        return (
          <View style={styles.stepContainer}>

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
                    values.userGender === gender && styles.optionButtonActive,
                  ]}
                  onPress={() => setFieldValue("userGender", gender)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      values.userGender === gender && styles.optionTextActive,
                    ]}
                  >
                    {gender}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {errors.userGender && touched.userGender && (
              <Text style={styles.errorText}>{errors.userGender}</Text>
            )}

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
                    values.genderPreference === pref && styles.optionButtonActive,
                  ]}
                  onPress={() => setFieldValue("genderPreference", pref)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      values.genderPreference === pref && styles.optionTextActive,
                    ]}
                  >
                    {pref}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {errors.genderPreference && touched.genderPreference && (
              <Text style={styles.errorText}>{errors.genderPreference}</Text>
            )}

            <View style={styles.stepButtons}>
              <TouchableOpacity style={styles.backButton} onPress={prevStep}>
                <Text style={styles.backButtonText}>{STRINGS.AUTH.back}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.nextButton,
                  isMutating && styles.nextButtonDisabled,
                ]}
                onPress={handleNextWithValidation}
                disabled={isMutating}
              >
                {isMutating ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator color={COLORS.white} size="small" />
                    <Text style={[styles.nextButtonText, { marginLeft: 8 }]}>
                      {STRINGS.AUTH.sending}
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.nextButtonText}>
                    {STRINGS.AUTH.createAccount}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        );

      default:
        return null;
    }
  };



  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "position" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
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
          {isSignUp && signUpStep === 0 && (
            <View style={styles.stepTitleContainer}>
              <Text style={styles.stepTitle}>{getStepTitle(signUpStep, isTrainerFlow)}</Text>
            </View>
          )}
          {isSignUp && signUpStep !== 0 && (
            <OnboardingStepHeader
              title={getStepTitle(signUpStep, isTrainerFlow)}
              stepText={`Step ${signUpStep} of ${isTrainerFlow ? 4 : 7}`}
              progress={signUpStep / (isTrainerFlow ? 4 : 7)}
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
    paddingTop: height * 0.15,
    paddingHorizontal: DIMENSIONS.spacing.lg,
    paddingBottom: DIMENSIONS.spacing.lg,
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
    borderRadius: 999,
    padding: DIMENSIONS.spacing.xs,
    marginBottom: DIMENSIONS.spacing.lg,
  },
  modeButton: {
    flex: 1,
    paddingVertical: DIMENSIONS.spacing.md,
    alignItems: "center",
    borderRadius: 999,
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
    maxHeight: 250
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
    maxHeight: 320,
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
  stepTitleContainer: {
    alignItems: 'flex-start',
    marginBottom: DIMENSIONS.spacing.md,
  },
 
});

export default AuthScreen;

// Helper functions for user flow
const sendVerificationCode = async (phoneNumber: string, setExpectedVerificationCode: (code: string) => void, setVerifiedPhoneNumber: (phone: string) => void, setIsPhoneVerified: (verified: boolean) => void, setIsSendingCode: (sending: boolean) => void) => {
  const trimmedValue = phoneNumber.trim();
  if (!/^\+?\d{10,15}$/.test(trimmedValue)) {
    Toast.error("Please enter a valid phone number");
    return;
  }

  setIsSendingCode(true);
  try {
    const demoCode = "123456";
    setExpectedVerificationCode(demoCode);
    setVerifiedPhoneNumber(trimmedValue);
    setIsPhoneVerified(false);
  } catch (error) {
    Toast.error(STRINGS.AUTH.errors.failedToSend);
  } finally {
    setIsSendingCode(false);
  }
};

const verifyCode = async (verificationCode: string, expectedVerificationCode: string | null, setIsPhoneVerified: (verified: boolean) => void, setIsVerifyingCode: (verifying: boolean) => void, nextStep: () => void) => {
  if (!verificationCode || verificationCode.length !== 6) {
    Toast.error(STRINGS.AUTH.errors.enterCode);
    return;
  }

  setIsVerifyingCode(true);
  try {
    if (!expectedVerificationCode) {
      Toast.error("Please request a new verification code first.");
      return;
    }

    if (verificationCode.trim() === expectedVerificationCode) {
      setIsPhoneVerified(true);
      nextStep();
    } else {
      Toast.error(STRINGS.AUTH.errors.invalidCode);
    }
  } catch (error) {
    Toast.error(STRINGS.AUTH.errors.failedToVerify);
  } finally {
    setIsVerifyingCode(false);
  }
};
