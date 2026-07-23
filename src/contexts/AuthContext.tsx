import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
  useState,
  useMemo,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CommonActions } from "@react-navigation/native";
import { Toast } from "../components/ToastManager";
import { User } from "../types";
import {
  useAppDispatch,
  useUser,
  useToken,
  useIsAuthenticated,
} from "../store/hooks";
import { setUser, clearUser, updateUser } from "../store/userSlice";
import { store } from "../store/store";
import { useLoginMutation, useRegisterMutation } from "../services/api/authApi";
import { useLazyGetMyProfileQuery } from "../services/api/userApi";
import { baseApi } from "../services/api/baseApi";
import { storageService } from "../services/storage";
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from "../config/constants";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isBootstrapping: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: {
    email: string;
    password: string;
    displayName: string;
    phoneNumber: string;
    age: string;
    trainingTypes: string[];
    genderPreference: string;
    userGender: string;
    currentPRs: string;
  }) => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
  updateUser: (user: Partial<User>) => void;
  dispatch: React.Dispatch<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const dispatch = useAppDispatch();
  const user = useUser();
  const token = useToken();
  const isAuthenticated = useIsAuthenticated();
  const [triggerLogin, { isLoading: isLoginLoading }] = useLoginMutation();
  const [triggerRegister, { isLoading: isRegisterLoading }] =
    useRegisterMutation();
  const [fetchProfile, { isLoading: isProfileLoading }] =
    useLazyGetMyProfileQuery();
  const [error, setError] = useState<string | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  const isLoading = useMemo(
    () => isLoginLoading || isRegisterLoading || isProfileLoading,
    [isLoginLoading, isRegisterLoading, isProfileLoading],
  );

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = await storageService.getAuthToken();

        if (storedToken) {
          console.log("🔑 Token found, fetching fresh profile...",storedToken);

          const profileResponse = await fetchProfile().unwrap();

          if (profileResponse.status && profileResponse.data) {
            console.log("✅ Profile fetched successfully");
            dispatch(
              setUser({ user: profileResponse.data, token: storedToken }),
            );
          } else {
            console.log("❌ Profile fetch failed, clearing auth");
            await storageService.clearUserData();
            dispatch(clearUser());
          }
        } else {
          console.log("ℹ️ No token found, user not authenticated");
          dispatch(clearUser());
        }
      } catch (bootstrapError) {
        console.error("❌ Error during auth initialization:", bootstrapError);
        await storageService.clearUserData();
        dispatch(clearUser());
      } finally {
        setIsBootstrapping(false);
      }
    };

    initializeAuth();
  }, [dispatch, fetchProfile]);

  const login = async (email: string, password: string): Promise<boolean> => {
    setError(null);

    try {
      const response = await triggerLogin({ email, password }).unwrap();

      if (!response.status || !response.data) {
        throw new Error(response.message || ERROR_MESSAGES.authenticationError);
      }

      const {
        token: rawToken,
        password: _password,
        ...rest
      } = response.data as Record<string, unknown> & {
        token?: string;
        password?: string;
      };

      if (!rawToken || typeof rawToken !== "string") {
        throw new Error(ERROR_MESSAGES.authenticationError);
      }

      const sanitizedUser = rest as unknown as User;

      await storageService.setAuthToken(rawToken);
      dispatch(setUser({ user: sanitizedUser, token: rawToken }));

      console.log("✅ Login successful, token saved");
      Toast.success(response.message || SUCCESS_MESSAGES.loginSuccess);
      return true;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : ERROR_MESSAGES.authenticationError;
      setError(message);
      Toast.error(message);
      return false;
    }
  };

  const register = async (userData: {
    email: string;
    password: string;
    displayName: string;
    phoneNumber: string;
    age: string;
    trainingTypes: string[];
    genderPreference: string;
    userGender: string;
    currentPRs: string;
  }): Promise<boolean> => {
    setError(null);

    try {
      const registerResponse = await triggerRegister(userData).unwrap();

      if (!registerResponse.status) {
        throw new Error(
          registerResponse.message || ERROR_MESSAGES.authenticationError,
        );
      }

      Toast.success(
        registerResponse.message || SUCCESS_MESSAGES.registrationSuccess,
      );

      return await login(userData.email, userData.password);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : ERROR_MESSAGES.authenticationError;
      setError(message);
      Toast.error(message);
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      console.log("🚪 Starting comprehensive logout process...");

      console.log("👤 Clearing user state first...");
      dispatch(clearUser());

      console.log("🔄 Clearing API cache...");
      dispatch(baseApi.util.resetApiState());

      console.log("🗑️ Clearing all stored user data...");
      const allKeys = await AsyncStorage.getAllKeys();
      const userDataKeys = allKeys.filter(
        (key) =>
          key.includes("authToken") ||
          key.includes("userProfile") ||
          key.includes("userStats") ||
          key.includes("notificationSettings") ||
          key.includes("workoutSessions") ||
          key.includes("progressGoals") ||
          key.includes("trainingPartners") ||
          key.includes("messages") ||
          key.includes("groups") ||
          key.includes("notifications") ||
          key.includes("posts") ||
          key.includes("ratings") ||
          key.includes("achievements") ||
          key.includes("notepadNotes"),
      );

      if (userDataKeys.length > 0) {
        await AsyncStorage.multiRemove(userDataKeys);
        console.log(`✅ Cleared ${userDataKeys.length} stored data items`);
      }
      await storageService.clearUserData();

      setError(null);

      console.log("✅ Logout completed successfully");
      Toast.success(SUCCESS_MESSAGES.logoutSuccess);
    } catch (error) {
      console.error("❌ Error during logout:", error);
      try {
        dispatch(clearUser());
        dispatch(baseApi.util.resetApiState());
        await storageService.clearUserData();
      } catch (fallbackError) {
        console.error("❌ Fallback logout failed:", fallbackError);
      }
      Toast.error("Logout completed with some issues");
    }
  };

  const clearErrorHandler = (): void => {
    setError(null);
  };

  const updateUserHandler = (userUpdate: Partial<User>): void => {
    dispatch(updateUser(userUpdate));
    const mergedUser = user ? { ...user, ...userUpdate } : userUpdate;
    if (mergedUser) {
      storageService.setUserProfile(mergedUser);
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated,
    isLoading,
    isBootstrapping,
    error,
    login,
    register,
    logout,
    clearError: clearErrorHandler,
    updateUser: updateUserHandler,
    dispatch,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
