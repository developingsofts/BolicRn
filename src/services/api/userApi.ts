import { API_END_POINTS } from '../endPoints';
import type { UserProfile, UserStats, User } from '../../types';
import { baseApi } from './baseApi';
import type { ApiResponse } from './types';
import { updateUser } from '../../store/userSlice';

interface UpdateProfilePayload {
  userId: string;
  profile: Partial<UserProfile>;
}

interface UpdateStatsPayload {
  userId: string;
  stats: Partial<UserStats>;
}

interface UpdateProfileWithImagePayload {
  displayName?: string;
  bio?: string;
  location?: string;
  imageFile?: File | { uri: string; type: string; name: string };
  videoFile?: File | { uri: string; type: string; name: string };
  age?: number;
  trainingTypes?: string[];
  userGender?: string;
  genderPreference?: string;
  currentPRs?: string;
  workExperience?: string;
  onboardingStep?: number;
}

export const userApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get current user profile (requires auth token)
    getMyProfile: builder.query<ApiResponse<User>, void>({
      query: () => ({
        url: '/user/get',
        method: 'GET',
      }),
      providesTags: ['User'],
    }),
    // Update current user profile (requires auth token)
    updateMyProfile: builder.mutation<ApiResponse<User>, Partial<User> & { trainingTypes?: string[] }>({
      query: (userData) => ({
        url: '/user/update',
        method: 'PUT',
        body: userData,
      }),
      invalidatesTags: ['User',"FindMain"],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data.status && data.data) {
            // Update the Redux store with new user data
            dispatch(updateUser(data.data));
          }
        } catch (error) {
          // Error already handled by the mutation
        }
      },
    }),
    // Update profile with image upload
    updateMyProfileWithImage: builder.mutation<ApiResponse<User>, UpdateProfileWithImagePayload>({
      query: (payload) => {
        const formData = new FormData();
        
        // Add text fields
        if (payload.displayName) formData.append('displayName', payload.displayName);
        if (payload.bio) formData.append('bio', payload.bio);
        if (payload.location) formData.append('location', payload.location);
        if (payload.age) formData.append('age', payload.age.toString());
        if (payload.userGender) formData.append('userGender', payload.userGender);
        if (payload.genderPreference) formData.append('genderPreference', payload.genderPreference);
        if (payload.currentPRs) formData.append('currentPRs', payload.currentPRs);
        if (payload.workExperience) formData.append('workExperience', payload.workExperience);

        if (payload.onboardingStep !== undefined) formData.append('onboardingStep', payload.onboardingStep.toString());
        
        // Add training types array
        if (payload.trainingTypes && payload.trainingTypes.length > 0) {
          payload.trainingTypes.forEach((type) => {
            formData.append('trainingTypes[]', type);
          });
        }
        
        // Add image file
        if (payload.imageFile) {
          const imageFile = payload.imageFile as any;
          if (imageFile.uri) {
            // React Native format
            formData.append('image', {
              uri: imageFile.uri,
              type: imageFile.type || 'image/jpeg',
              name: imageFile.name || 'profile.jpg',
            } as any);
          } else {
            // Web format
            formData.append('image', imageFile);
          }
        }

        if (payload.videoFile) {
          const videoFile = payload.videoFile as any;
          if (videoFile.uri) {
            // React Native format
            formData.append('introVideo', {
              uri: videoFile.uri,
              type: videoFile.type || 'video/mp4',
              name: videoFile.name || 'intro.mp4',
            } as any);
          } else {
            // Web format
            formData.append('video', videoFile);
          }
        }

        console.log("FormData entries:");
        formData.forEach((value, key) => {
          console.log(key, value);
        });
        
        return {
          url: '/user/update',
          method: 'PUT',
          body: formData,
        };
      },
      invalidatesTags: ['User',"UserProfile"],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data.status && data.data) {
            // Update the Redux store with new user data (including new imageUrl)
            dispatch(updateUser(data.data));
          }
        } catch (error) {
          // Error already handled by the mutation
        }
      },
    }),
    deleteMyAccount: builder.mutation<ApiResponse<null>, void>({
      query: () => ({
        url: '/user/delete',
        method: 'DELETE',
      }),
      invalidatesTags: ['User', 'Auth'],
    }),
    getUserProfile: builder.query<ApiResponse<UserProfile>, string>({
      query: (userId) => ({
        url: API_END_POINTS.users.profile(userId),
        method: 'GET',
      }),
      providesTags: ['User'],
    }),
    updateUserProfile: builder.mutation<ApiResponse<UserProfile>, UpdateProfilePayload>({
      query: ({ userId, profile }) => ({
        url: API_END_POINTS.users.profile(userId),
        method: 'PUT',
        body: profile,
      }),
      invalidatesTags: ['User'],
    }),
    getUserStats: builder.query<ApiResponse<UserStats>, string>({
      query: (userId) => ({
        url: API_END_POINTS.users.stats(userId),
        method: 'GET',
      }),
      providesTags: ['User'],
    }),
    updateUserStats: builder.mutation<ApiResponse<UserStats>, UpdateStatsPayload>({
      query: ({ userId, stats }) => ({
        url: API_END_POINTS.users.stats(userId),
        method: 'PUT',
        body: stats,
      }),
      invalidatesTags: ['User'],
    }),
    // Training Types
    getTrainingTypes: builder.query<ApiResponse<any[]>, void>({
      query: () => ({
        url: API_END_POINTS.trainingTypes.all,
        method: 'GET',
      }),
      providesTags: ['TrainingTypes'],
    }),
    // Selected Training Types
    getSelectedTrainingTypes: builder.query<ApiResponse<any[]>, void>({
      query: () => ({
        url: API_END_POINTS.selectedTrainingTypes.all,
        method: 'GET',
      }),
      providesTags: ['SelectedTrainingTypes'],
    }),
    addSelectedTrainingTypes: builder.mutation<ApiResponse<any>, { trainingTypeIds: string[] }>({
      query: (data) => ({
        url: API_END_POINTS.selectedTrainingTypes.add,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['SelectedTrainingTypes', 'User'],
    }),
    updateSelectedTrainingTypes: builder.mutation<ApiResponse<any>, { removeIds: string[], addIds: string[] }>({
      query: (data) => ({
        url: API_END_POINTS.selectedTrainingTypes.update,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['SelectedTrainingTypes', 'User'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetMyProfileQuery,
  useLazyGetMyProfileQuery,
  useUpdateMyProfileMutation,
  useUpdateMyProfileWithImageMutation,
  useDeleteMyAccountMutation,
  useGetUserProfileQuery,
  useUpdateUserProfileMutation,
  useGetUserStatsQuery,
  useUpdateUserStatsMutation,
  useGetTrainingTypesQuery,
  useGetSelectedTrainingTypesQuery,
  useAddSelectedTrainingTypesMutation,
  useUpdateSelectedTrainingTypesMutation,
} = userApi;
