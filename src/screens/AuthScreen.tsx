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
import { useUpdateMyProfileMutation } from "../services/api/userApi";
import { useAppDispatch } from "../store/hooks";
import { setUser } from "../store/userSlice";
import { storageService } from "../services/storage";
import { User } from "../types";
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from "../config/constants";
import {
  loginSchema,
  signUpSchema,
} from "../validation/authSchemas";

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
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const [triggerLogin, { isLoading: isLoginLoading }] = useLoginMutation();
  const [triggerRegister, { isLoading: isRegisterLoading }] = useRegisterMutation();
  const [updateProfile, { isLoading: isUpdatingProfile }] = useUpdateMyProfileMutation();
  const isMutating = isLoginLoading || isRegisterLoading || isUpdatingProfile;

  // Form state
  const [isSignUp, setIsSignUp] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [expectedVerificationCode, setExpectedVerificationCode] = useState<string | null>(null);
  const [verifiedPhoneNumber, setVerifiedPhoneNumber] = useState<string | null>(null); // Track which number was sent code
  const [authToken, setAuthToken] = useState<string | null>(null); // Store token after step 1
  const FINAL_SIGN_UP_STEP = 6;
  const [signUpStep, setSignUpStep] = useState(0);

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
  });

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
    });
    setIsPhoneVerified(false);
    setExpectedVerificationCode(null);
    setVerifiedPhoneNumber(null);
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

  const hydrateUser = async (payload: { user: User; token: string }, successMessage?: string) => {
    console.log('🔐 hydrateUser called with:', { hasUser: !!payload.user, hasToken: !!payload.token });
    // Only save token, not user profile
    await storageService.setAuthToken(payload.token);
    dispatch(setUser(payload));
    console.log('✅ User dispatched to Redux, isAuthenticated should now be true');
    Toast.success(successMessage ?? SUCCESS_MESSAGES.loginSuccess);
  };

  const handleLogin = async (values: LoginFormValues) => {
    try {
      const response = await triggerLogin(values).unwrap();

      if (response.status && response.data) {
        const { token, password: _password, ...rest } = response.data as Record<string, unknown> & {
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
        
        if (onboardingStep > 0 && onboardingStep < 7) {
          // User has incomplete onboarding - switch to signup mode and resume
          console.log('🔄 Resuming onboarding from step:', onboardingStep);
          setIsSignUp(true);
          setSignUpStep(onboardingStep);
          setAuthToken(token);
          await storageService.setAuthToken(token);
          
          // Pre-fill form values from user data
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
          });
          
          // If phone was already verified, set that state
          if (sanitizedUser.phoneVerified) {
            setIsPhoneVerified(true);
            setVerifiedPhoneNumber(sanitizedUser.phoneNumber || null);
          }
          
          Toast.success("Welcome back! Please complete your profile setup.");
          return;
        }
        
        // User has completed onboarding - proceed with normal login
        await hydrateUser({ user: sanitizedUser, token }, response.message || STRINGS.AUTH.success.loggedIn);
      } else {
        throw new Error(response.message || ERROR_MESSAGES.authenticationError);
      }
    } catch (error: any) {
      // Handle RTK Query errors
      let message = "Authentication failed";
      
      console.error('Login error:', error);
      
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
      } else if (typeof error === 'string') {
        message = error;
      }
      
      Toast.error(message);
      console.log('Error toast shown:', message);
    }
  };

  const handleSignUp = async (values: SignUpFormValues) => {
    try {
      // Step 0: Create account with only email and password
      if (!authToken) {
        const registrationResponse = await triggerRegister({
          email: values.email,
          password: values.password,
        }).unwrap();

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
      
      // console.error('Signup error:', error);
      
      // RTK Query error structure
      if (error?.data?.message) {
        // Backend error response (e.g., "Email already exists")
        message = error.data.message;
      } else if (error?.data?.error) {
        // Alternative backend error format
        message = error.data.error;
      } else if (error?.message) {
        // Standard Error object
        message = error.message;
      } else if (error?.status) {
        // HTTP status code errors
        if (error.status === 409 || error.status === 400) {
          message = "This email is already registered. Please use a different email or sign in.";
        } else if (error.status === 500) {
          message = "Server error. Please try again later.";
        }
      } else if (typeof error === 'string') {
        message = error;
      }
      
      Toast.error(message);
      // console.log('Error toast shown:', message);
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
      // Reset verification states when going back to phone number step
      if (signUpStep === 2) {
        setVerifiedPhoneNumber(null);
        setExpectedVerificationCode(null);
        setIsPhoneVerified(false);
      }
      setSignUpStep(signUpStep - 1);
    }
  };

  const sendVerificationCode = async (phoneNumber: string) => {
    const trimmedValue = phoneNumber.trim();
    if (!/^\+?\d{10,15}$/.test(trimmedValue)) {
      Toast.error("Please enter a valid phone number");
      return;
    }

    setIsSendingCode(true);
    try {
      const demoCode = "123456";
      setExpectedVerificationCode(demoCode);
      setVerifiedPhoneNumber(trimmedValue); // Save the phone number that received the code
      setIsPhoneVerified(false);

      // Don't show toast here - only show on final step
      console.log(`Verification code sent: ${demoCode}`);
    } catch (error) {
      Toast.error(STRINGS.AUTH.errors.failedToSend);
    } finally {
      setIsSendingCode(false);
    }
  };

  const verifyCode = async (verificationCode: string) => {
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
        // Don't show toast here - only show on final step
        console.log('Phone verified successfully');
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

  const getStepSchema = (step: number) => {
    // We use the full signUpSchema but validate only specific fields per step
    return signUpSchema;
  };

  const renderSignUpStep = (
    values: SignUpFormValues,
    errors: any,
    touched: any,
    handleChange: any,
    handleBlur: any,
    setFieldValue: any,
    validateForm: any
  ) => {
    // Helper function to convert gender preference UI value to backend value
    const convertGenderPreference = (preference: string, userGender: string): string => {
      if (preference === 'All') return 'all';
      if (preference === 'Same Gender Only') {
        // Convert user's gender to lowercase
        return userGender.toLowerCase();
      }
      if (preference === 'Opposite Gender Only') {
        // Return opposite gender(s)
        const gender = userGender.toLowerCase();
        if (gender === 'male') return 'female';
        if (gender === 'female') return 'male';
        if (gender === 'non-binary' || gender === 'prefer not to say') return 'all'; // Non-binary and prefer not to say sees all
        return 'all';
      }
      return preference.toLowerCase();
    };

    const handleNextWithValidation = async () => {
      const validationErrors = await validateForm();
      
      // Get field names for current step
      let fieldsToValidate: string[] = [];
      switch (signUpStep) {
        case 0:
          fieldsToValidate = ["email", "password"];
          break;
        case 1:
          fieldsToValidate = ["phoneNumber"];
          break;
        case 2:
          fieldsToValidate = ["verificationCode"];
          // Check if phone is verified
          if (!isPhoneVerified) {
            Toast.error("Please verify your phone number first");
            return;
          }
          break;
        case 3:
          fieldsToValidate = ["displayName"];
          break;
        case 4:
          fieldsToValidate = ["age"];
          break;
        case 5:
          fieldsToValidate = ["trainingTypes"];
          break;
        case 6:
          fieldsToValidate = ["userGender", "genderPreference"];
          break;
      }

      const hasErrors = fieldsToValidate.some(field => validationErrors[field]);
      
      if (hasErrors) {
        // Show first error
        const firstError = fieldsToValidate.find(field => validationErrors[field]);
        if (firstError) {
          Toast.error(validationErrors[firstError]);
        }
        return;
      }

      // Step 0: Create account with email/password
      if (signUpStep === 0) {
        // Call handleSignUp which will create account and move to next step
        await handleSignUp(values);
        return;
      }

      // Steps 1-6: Update profile with current step data
      try {
        const updateData: any = {};
        
        // Always update onboarding step to track progress
        updateData.onboardingStep = signUpStep;
        
        switch (signUpStep) {
          case 1: // Phone Number
            // Check if verification code was sent to this phone number
            if (!verifiedPhoneNumber || values.phoneNumber.trim() !== verifiedPhoneNumber) {
              Toast.error("Please send verification code to this phone number first");
              return;
            }
            updateData.phoneNumber = values.phoneNumber;
            break;
          case 2: // Phone Verification
            updateData.phoneVerified = true;
            break;
          case 3: // Display Name
            updateData.userName = values.displayName;
            break;
          case 4: // Age
            updateData.age = parseInt(values.age);
            break;
          case 5: // Training Types
            updateData.trainingTypes = values.trainingTypes;
            break;
          case 6: // Gender & Preferences
            updateData.userGender = values.userGender.toLowerCase();
            updateData.genderPreference = convertGenderPreference(values.genderPreference, values.userGender);
            if (values.currentPRs) updateData.currentPRs = values.currentPRs;
            // Mark onboarding as complete
            updateData.onboardingStep = 7;
            break;
        }

        console.log(`📤 Step ${signUpStep}: Updating profile with:`, Object.keys(updateData));

        const updateResponse = await updateProfile(updateData).unwrap();

        if (!updateResponse.status) {
          throw new Error(updateResponse.message || ERROR_MESSAGES.authenticationError);
        }

        // Don't show toast for intermediate steps - only on final step
        if (signUpStep !== FINAL_SIGN_UP_STEP) {
          console.log(`✅ Step ${signUpStep} completed`);
        }

        // If this is the final step, hydrate user and navigate
        if (signUpStep === FINAL_SIGN_UP_STEP) {
          const sanitizedUser = updateResponse.data as User;
          await hydrateUser({ user: sanitizedUser, token: authToken! }, "Account created successfully!");
        } else {
          // Move to next step
          setSignUpFormValues({ ...signUpFormValues, ...values });
          nextStep();
        }
      } catch (error: any) {
        let message = "Failed to update profile";
        
        if (error?.data?.message) {
          message = error.data.message;
        } else if (error?.message) {
          message = error.message;
        }
        
        Toast.error(message);
      }
    };

    switch (signUpStep) {
      case 0: // Email/Password
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>{STRINGS.AUTH.createAccount}</Text>
            <Text style={styles.stepSubtitle}>{STRINGS.AUTH.steps.step1}</Text>

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

      case 1: // Phone Number
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>{STRINGS.AUTH.phoneNumber}</Text>
            <Text style={styles.stepSubtitle}>{STRINGS.AUTH.steps.step2}</Text>

            <Text style={styles.fieldLabel}>
              {STRINGS.AUTH.labels.verificationMessage}
            </Text>

            <TextInput
              style={[styles.input, errors.phoneNumber && touched.phoneNumber && styles.inputError]}
              placeholder={STRINGS.AUTH.phoneNumber}
              value={values.phoneNumber}
              onChangeText={(text) => {
                handleChange("phoneNumber")(text);
                // If phone number changes, clear the verification status
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
              onPress={() => sendVerificationCode(values.phoneNumber)}
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

      case 2: // Phone Verification
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>{STRINGS.AUTH.verifyCode}</Text>
            <Text style={styles.stepSubtitle}>{STRINGS.AUTH.steps.step3}</Text>

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
              onPress={() => verifyCode(values.verificationCode)}
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
              onPress={() => sendVerificationCode(values.phoneNumber)}
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

      case 3: // Display Name
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>{STRINGS.AUTH.yourName}</Text>
            <Text style={styles.stepSubtitle}>{STRINGS.AUTH.steps.step4}</Text>

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

      case 4: // Age
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>{STRINGS.AUTH.yourAge}</Text>
            <Text style={styles.stepSubtitle}>{STRINGS.AUTH.steps.step5}</Text>

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

  const renderLoginForm = () => (
    <Formik
      key="login-form"
      initialValues={{ email: "", password: "" }}
      validationSchema={loginSchema}
      onSubmit={handleLogin}
      validateOnChange={true}
      validateOnBlur={true}
    >
      {({ values, errors, touched, handleChange, handleBlur, handleSubmit }) => (
        <View style={styles.formContainer}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to continue</Text>

          <TextInput
            style={[styles.input, errors.email && touched.email && styles.inputError]}
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
            style={[styles.input, errors.password && touched.password && styles.inputError]}
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
            style={[styles.submitButton, isMutating && styles.submitButtonDisabled]}
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

  const renderSignUpForm = () => (
    <Formik
      key={`signup-form-${signUpStep}`}
      initialValues={signUpFormValues}
      validationSchema={getStepSchema(signUpStep)}
      onSubmit={handleSignUp}
      validateOnChange={true}
      validateOnBlur={true}
      enableReinitialize
    >
      {({ values, errors, touched, handleChange, handleBlur, setFieldValue, validateForm }) =>
        renderSignUpStep(values, errors, touched, handleChange, handleBlur, setFieldValue, validateForm)
      }
    </Formik>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
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
            maskElement={
              <Text style={styles.brandName}>BolicBuddy</Text>
            }
          >
            <LinearGradient
              colors={[COLORS.gradient1, COLORS.gradient2, COLORS.gradient3]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 0 }}
            >
              <Text style={[styles.brandName, { opacity: 0 }]}>BolicBuddy</Text>
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
            <Text style={[styles.modeText, !isSignUp && styles.modeTextActive]}>
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
            <Text style={[styles.modeText, isSignUp && styles.modeTextActive]}>
              Sign Up
            </Text>
          </TouchableOpacity>
        </View>

        {/* Form */}
        {isSignUp ? renderSignUpForm() : renderLoginForm()}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {isSignUp ? "Already have an account?" : "Don't have an account?"}
          </Text>
          <TouchableOpacity onPress={() => {
            resetFormStates();
            setIsSignUp(!isSignUp);
          }}>
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
