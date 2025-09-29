import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { storageService } from '../services/storage';
import { AuthService } from '../services/api';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../config/constants';

// Auth State Interface
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Auth Action Types
type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'UPDATE_USER'; payload: User };

// Initial State
const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

// Auth Reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case 'AUTH_FAILURE':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
    case 'AUTH_LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: action.payload,
      };
    default:
      return state;
  }
};

// Auth Context Interface
interface AuthContextType extends AuthState {
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
  updateUser: (user: User) => void;
  dispatch: React.Dispatch<AuthAction>;
}

// Create Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth Provider Props
interface AuthProviderProps {
  children: ReactNode;
}

// Auth Provider Component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check for existing token on app start
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // First, validate and clean any corrupted storage data
        await storageService.validateStorageData();
        
        const token = await storageService.getAuthToken();
        if (token) {
          // Validate token with backend (optional)
          // For now, we'll assume the token is valid
          const user = await storageService.getUserProfile();
          if (user) {
            dispatch({
              type: 'AUTH_SUCCESS',
              payload: { user, token },
            });
          } else {
            // Token exists but no user profile - clear token
            await storageService.removeAuthToken();
            dispatch({ type: 'AUTH_LOGOUT' });
          }
        } else {
          // DEVELOPMENT MODE: Auto-login for easier testing
          // Remove this in production
          const devUser: User = {
            id: 'dev-user-1',
            email: 'dev@example.com',
            displayName: 'Development User',
            phoneNumber: '+1234567890',
            phoneVerified: true,
            age: 25,
            trainingTypes: ['Strength Training', 'Cardio'],
            genderPreference: 'Any',
            userGender: 'Male',
            currentPRs: 'Bench: 225lbs, Squat: 315lbs',
            profilePicture: undefined,
            bio: 'Development user for testing',
            location: 'San Francisco, CA',
            experienceLevel: 'Intermediate',
            availability: 'Weekends',
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          
          const devToken = 'dev-token-123';
          
          // Store dev user data
          await storageService.setAuthToken(devToken);
          await storageService.setUserProfile(devUser);
          
          dispatch({
            type: 'AUTH_SUCCESS',
            payload: { user: devUser, token: devToken },
          });
          
          console.log('Development mode: Auto-logged in as dev user');
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
        
        // If there's a storage error, clear all data and start fresh
        try {
          await storageService.clearCorruptedData();
        } catch (clearError) {
          console.error('Error clearing corrupted data:', clearError);
        }
        
        dispatch({ type: 'AUTH_LOGOUT' });
      }
    };

    checkAuthStatus();
  }, []);

  // Login function
  const login = async (email: string, password: string): Promise<boolean> => {
    dispatch({ type: 'AUTH_START' });

    try {
      const response = await AuthService.login(email, password);
      
      if (response.success && response.data) {
        const { user, token } = response.data;
        
        // Store token and user data
        await storageService.setAuthToken(token);
        await storageService.setUserProfile(user);
        
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: { user, token },
        });
        
        return true;
      } else {
        dispatch({
          type: 'AUTH_FAILURE',
          payload: response.error || ERROR_MESSAGES.authenticationError,
        });
        return false;
      }
    } catch (error) {
      dispatch({
        type: 'AUTH_FAILURE',
        payload: error instanceof Error ? error.message : ERROR_MESSAGES.authenticationError,
      });
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
    dispatch({ type: 'AUTH_START' });

    try {
      const response = await AuthService.register(userData);
      
      if (response.success && response.data) {
        const { user, token } = response.data;
        
        // Store token and user data
        await storageService.setAuthToken(token);
        await storageService.setUserProfile(user);
        
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: { user, token },
        });
        
        return true;
      } else {
        dispatch({
          type: 'AUTH_FAILURE',
          payload: response.error || ERROR_MESSAGES.authenticationError,
        });
        return false;
      }
    } catch (error) {
      dispatch({
        type: 'AUTH_FAILURE',
        payload: error instanceof Error ? error.message : ERROR_MESSAGES.authenticationError,
      });
      return false;
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    try {
      if (state.token) {
        // Call logout API
        await AuthService.logout(state.token);
      }
    } catch (error) {
      console.error('Error calling logout API:', error);
    } finally {
      // Clear local storage
      await storageService.clearUserData();
      
      dispatch({ type: 'AUTH_LOGOUT' });
    }
  };

  // Clear error function
  const clearError = (): void => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  // Update user function
  const updateUser = (user: User): void => {
    dispatch({ type: 'UPDATE_USER', payload: user });
    // Also update in storage
    storageService.setUserProfile(user);
  };

  // Context value
  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    clearError,
    updateUser,
    dispatch,
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

