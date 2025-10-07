import { API_END_POINTS } from '../endPoints';
import { baseApi } from './baseApi';
import type {
  ApiResponse,
  AuthCredentials,
  RegisterPayload,
} from './types';

interface ResetPasswordPayload {
  token: string;
  newPassword: string;
}

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<ApiResponse<any>, AuthCredentials>({
      query: (credentials) => ({
        url: API_END_POINTS.auth.login,
        method: 'POST',
        body: credentials,
      }),
      invalidatesTags: ['Auth'],
    }),
    register: builder.mutation<ApiResponse<any>, RegisterPayload>({
      query: (payload) => ({
        url: API_END_POINTS.auth.register,
        method: 'POST',
        body: payload,
      }),
      invalidatesTags: ['Auth'],
    }),
    logout: builder.mutation<ApiResponse<any>, void>({
      query: () => ({
        url: API_END_POINTS.auth.logout,
        method: 'POST',
        body: {},
      }),
      invalidatesTags: ['Auth'],
    }),
    forgotPassword: builder.mutation<ApiResponse<any>, string>(
      {
        query: (email) => ({
          url: API_END_POINTS.auth.forgotPassword,
          method: 'POST',
          body: { email },
        }),
      }
    ),
    resetPassword: builder.mutation<ApiResponse<any>, ResetPasswordPayload>({
      query: (payload) => ({
        url: API_END_POINTS.auth.resetPassword,
        method: 'POST',
        body: payload,
      }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
} = authApi;
