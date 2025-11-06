import { API_END_POINTS } from '../endPoints';
import type { Post } from '../../types';
import { baseApi } from './baseApi';
import type { ApiResponse, PaginationParams } from './types';

interface PostActionPayload {
  postId: string;
}

interface CreatePostPayload {
  title: string;
  groupId?: number;
  achievementId?: number;
  type?: 'normal' | 'workout_share';
  workoutId?: string;
  mediaFile?: {
    uri: string;
    type: string;
    name: string;
  };
}

interface CommentPayload {
  postId: string;
  comment: string;
}

export const postsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get all posts with pagination
    getPosts: builder.query<
      ApiResponse<{ posts: Post[]; pagination: any }>,
      { page?: number; limit?: number }
    >({
      query: (params = {}) => {
        const page = params?.page || 1;
        const limit = params?.limit || 10;
        return {
          url: `/post/all?page=${page}&limit=${limit}`,
          method: 'GET',
        };
      },
      providesTags: ['Posts'],
      // Support for infinite scroll - merge results
      serializeQueryArgs: ({ endpointName }) => {
        return endpointName;
      },
      merge: (currentCache, newItems, { arg }) => {
        // If page 1 or no arg, return fresh data
        if (!arg || arg.page === 1) {
          return newItems;
        }
        
        // Merge results for page > 1
        if ('data' in currentCache && 'data' in newItems && currentCache.status && newItems.status) {
          return {
            ...newItems,
            data: {
              posts: [
                ...(currentCache.data?.posts || []),
                ...(newItems.data?.posts || [])
              ],
              pagination: newItems.data?.pagination
            }
          };
        }
        
        return newItems;
      },
      forceRefetch({ currentArg, previousArg }) {
        return (currentArg?.page || 1) !== (previousArg?.page || 1);
      },
    }),
    
    // Get user posts
    getUserPosts: builder.query<
      ApiResponse<{ posts: Post[]; pagination: any }>,
      { userId: string; page?: number; limit?: number }
    >({
      query: ({ userId, page = 1, limit = 10 }) => ({
        url: `/post/user?userId=${userId}&page=${page}&limit=${limit}`,
        method: 'GET',
      }),
      providesTags: ['Posts'],
    }),
    
    // Create post with FormData
    createPost: builder.mutation<ApiResponse<Post>, CreatePostPayload>({
      query: (payload) => {
        const formData = new FormData();
        
        // Add text fields
        formData.append('title', payload.title);
        if (payload.groupId) formData.append('groupId', payload.groupId.toString());
        if (payload.achievementId) formData.append('achievementId', payload.achievementId.toString());
        formData.append('type', payload.type || 'normal');
        if (payload.workoutId) formData.append('workoutId', payload.workoutId);
        
        // Add media file if present
        if (payload.mediaFile) {
          const mediaFile = payload.mediaFile as any;
          formData.append('media', {
            uri: mediaFile.uri,
            type: mediaFile.type || 'image/jpeg',
            name: mediaFile.name || `post_${Date.now()}.jpg`,
          } as any);
        }
        
        return {
          url: '/post/create',
          method: 'POST',
          body: formData,
        };
      },
      invalidatesTags: ['Posts'],
    }),
    
    // Delete post
    deletePost: builder.mutation<
      ApiResponse<{ success: boolean }>,
      { postId: string }
    >({
      query: ({ postId }) => ({
        url: `/post/delete/${postId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Posts'],
    }),
    
    // Update post
    updatePost: builder.mutation<
      ApiResponse<Post>,
      { postId: string; title?: string; mediaFile?: any }
    >({
      query: ({ postId, title, mediaFile }) => {
        const formData = new FormData();
        
        if (title) formData.append('title', title);
        
        if (mediaFile) {
          formData.append('media', {
            uri: mediaFile.uri,
            type: mediaFile.type || 'image/jpeg',
            name: mediaFile.name || `post_${Date.now()}.jpg`,
          } as any);
        }
        
        return {
          url: `/post/update/${postId}`,
          method: 'PUT',
          body: formData,
        };
      },
      invalidatesTags: ['Posts'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetPostsQuery,
  useLazyGetPostsQuery,
  useGetUserPostsQuery,
  useCreatePostMutation,
  useDeletePostMutation,
  useUpdatePostMutation,
} = postsApi;
