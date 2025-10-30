import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { API_CONFIG } from '../../config/constants';
import { storageService } from '../storage';

const baseQuery = fetchBaseQuery({
  baseUrl: API_CONFIG.baseUrl,
  prepareHeaders: async (headers, { endpoint }) => {
    const token = await storageService.getAuthToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    
    // Don't set Content-Type for FormData endpoints - let the browser handle it
    const formDataEndpoints = ['updateMyProfileWithImage', 'createPost', 'updatePost'];
    if (!formDataEndpoints.includes(endpoint as string)) {
      if (!headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
      }
    }
    
    return headers;
  },
});

// Allows us to hook in cross-cutting concerns like refresh-token flows later
const baseQueryWithErrorHandling: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  // Log request details
  const url = typeof args === 'string' ? args : args.url;
  const method = typeof args === 'string' ? 'GET' : args.method || 'GET';
  const body = typeof args === 'string' ? undefined : (args as FetchArgs).body;

  console.log('🌐 API Request:', {
    url: `${API_CONFIG.baseUrl}${url}`,
    method,
    body: body instanceof FormData 
      ? '[FormData]' 
      : body 
        ? (typeof body === 'string' ? body : JSON.stringify(body, null, 2)) 
        : undefined,
    timestamp: new Date().toISOString(),
  });

  const startTime = Date.now();
  const result = await baseQuery(args, api, extraOptions);
  const duration = Date.now() - startTime;

  // Log response details
  if (result.error) {
    console.error('❌ API Error:', {
      url: `${API_CONFIG.baseUrl}${url}`,
      method,
      status: result.error.status,
      error: result.error.data || result.error,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    });
  } else {
    console.log('✅ API Response:', {
      url: `${API_CONFIG.baseUrl}${url}`,
      method,
      data: result.data,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    });
  }

  // Placeholder for future global error handling / token refresh flow
  // if (result.error && result.error.status === 401) { ... }

  return result;
};

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithErrorHandling,
  tagTypes: [
    'Auth',
    'User',
    'Workout',
    'Exercise',
    'WorkoutSession',
    'UserWorkout',
    'Matching',
    'Messaging',
    'Groups',
    'Posts',
    'Ratings',
    'Notifications',
    'TrainingTypes',
    'SelectedTrainingTypes',
    'Achievements',
  ],
  endpoints: () => ({}),
});

export type BaseApi = typeof baseApi;
