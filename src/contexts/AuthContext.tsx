import React, { createContext, useContext, useReducer, useEffect, ReactNode, useState, useMemo } from 'react';
import { Toast } from '../components/ToastManager';
import { User } from '../types';
import { useAppDispatch, useUser, useToken, useIsAuthenticated } from '../store/hooks';
import { setUser, clearUser, updateUser } from '../store/userSlice';
import { useLoginMutation, useRegisterMutation } from '../services/api/authApi';
import { useLazyGetMyProfileQuery } from '../services/api/userApi';
import { storageService } from '../services/storage';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../config/constants';

// Auth Context Interface
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
  dispatch: React.Dispatch<any>; // Keep for compatibility
}

// Create Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth Provider Props
interface AuthProviderProps {
  children: ReactNode;
}

// Auth Provider Component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const dispatch = useAppDispatch();
  const user = useUser();
  const token = useToken();
  const isAuthenticated = useIsAuthenticated();
  const [triggerLogin, { isLoading: isLoginLoading }] = useLoginMutation();
  const [triggerRegister, { isLoading: isRegisterLoading }] = useRegisterMutation();
  const [fetchProfile, { isLoading: isProfileLoading }] = useLazyGetMyProfileQuery();
  const [error, setError] = useState<string | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  const isLoading = useMemo(() => isLoginLoading || isRegisterLoading || isProfileLoading, [isLoginLoading, isRegisterLoading, isProfileLoading]);

  // Check for existing token on app start and fetch fresh profile
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = await storageService.getAuthToken();

        if (storedToken) {
          console.log('🔑 Token found, fetching fresh profile...');
          
          // Fetch fresh profile from API
          const profileResponse = await fetchProfile().unwrap();
          
          if (profileResponse.status && profileResponse.data) {
            console.log('✅ Profile fetched successfully');
            dispatch(setUser({ user: profileResponse.data, token: storedToken }));
          } else {
            console.log('❌ Profile fetch failed, clearing auth');
            await storageService.clearUserData();
            dispatch(clearUser());
          }
        } else {
          console.log('ℹ️ No token found, user not authenticated');
          dispatch(clearUser());
        }
      } catch (bootstrapError) {
        console.error('❌ Error during auth initialization:', bootstrapError);
        await storageService.clearUserData();
        dispatch(clearUser());
      } finally {
        setIsBootstrapping(false);
      }
    };

    initializeAuth();
  }, [dispatch, fetchProfile]);

  // Login function - Only save token, user profile comes from the response
  const login = async (email: string, password: string): Promise<boolean> => {
    setError(null);

    try {
      const response = await triggerLogin({ email, password }).unwrap();

      if (!response.status || !response.data) {
        throw new Error(response.message || ERROR_MESSAGES.authenticationError);
      }

      const { token: rawToken, password: _password, ...rest } = response.data as Record<string, unknown> & {
        token?: string;
        password?: string;
      };

      if (!rawToken || typeof rawToken !== 'string') {
        throw new Error(ERROR_MESSAGES.authenticationError);
      }

      const sanitizedUser = rest as unknown as User;

      // Only save token to storage, not user profile
      await storageService.setAuthToken(rawToken);
      dispatch(setUser({ user: sanitizedUser, token: rawToken }));

      console.log('✅ Login successful, token saved');
      Toast.success(response.message || SUCCESS_MESSAGES.loginSuccess);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : ERROR_MESSAGES.authenticationError;
      setError(message);
      Toast.error(message);
      return false;
    }
  };

  // Register function
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
        throw new Error(registerResponse.message || ERROR_MESSAGES.authenticationError);
      }

      Toast.success(registerResponse.message || SUCCESS_MESSAGES.registrationSuccess);

      return await login(userData.email, userData.password);
    } catch (err) {
      const message = err instanceof Error ? err.message : ERROR_MESSAGES.authenticationError;
      setError(message);
      Toast.error(message);
      return false;
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    await storageService.clearUserData();
    dispatch(clearUser());
    Toast.success(SUCCESS_MESSAGES.logoutSuccess);
  };

  // Clear error function
  const clearErrorHandler = (): void => {
    setError(null);
  };

  // Update user function
  const updateUserHandler = (userUpdate: Partial<User>): void => {
    dispatch(updateUser(userUpdate));
    const mergedUser = user ? { ...user, ...userUpdate } : userUpdate;
    if (mergedUser) {
      storageService.setUserProfile(mergedUser);
    }
  };

  // Context value
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
    dispatch, // Keep for compatibility
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Export for convenience
export default AuthContext;

