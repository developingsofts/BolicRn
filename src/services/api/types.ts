import type { User } from '../../types';

export interface ApiSuccessResponse<T> {
  status: true;
  data: T;
  message?: string;
  statusCode?: number;
}

export interface ApiErrorResponse {
  status: false;
  message: string;
  statusCode?: number;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  role?: 'user' | 'trainer';
  displayName?: string;
  phoneNumber?: string;
  age?: string;
  trainingTypes?: string[];
  genderPreference?: string;
  userGender?: string;
  currentPRs?: string;
  onboardingStep?: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}
