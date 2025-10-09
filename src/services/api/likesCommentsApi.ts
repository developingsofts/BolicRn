import { baseApi } from './baseApi';
import type { ApiResponse } from './types';

interface LikeResponse {
  liked: boolean;
  likeCount: number;
}

interface LikeUserInfo {
  id: number;
  userName: string;
  displayName: string;
  imageUrl: string | null;
}

interface Like {
  id: number;
  userId: number;
  postId: number;
  createdAt: string;
  updatedAt: string;
  user: LikeUserInfo;
}

interface GetLikesResponse {
  likes: Like[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalLikes: number;
    limit: number;
  };
}

interface Comment {
  id: number;
  userId: number;
  postId: number;
  content: string;
  parentCommentId: number | null;
  createdAt: string;
  updatedAt: string;
  user: LikeUserInfo;
  replies?: Comment[];
}

interface GetCommentsResponse {
  comments: Comment[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalComments: number;
    limit: number;
  };
}

interface CreateCommentPayload {
  postId: string;
  content: string;
  parentCommentId?: number;
}

interface UpdateCommentPayload {
  commentId: string;
  content: string;
}

export const likesCommentsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Toggle like on a post
    toggleLike: builder.mutation<ApiResponse<LikeResponse>, string>({
      query: (postId) => ({
        url: `/post/${postId}/like`,
        method: 'POST',
      }),
      invalidatesTags: ['Posts'],
    }),

    // Get likes for a post
    getPostLikes: builder.query<
      ApiResponse<GetLikesResponse>,
      { postId: string; page?: number; limit?: number }
    >({
      query: ({ postId, page = 1, limit = 20 }) => ({
        url: `/post/${postId}/likes?page=${page}&limit=${limit}`,
        method: 'GET',
      }),
      providesTags: ['Posts'],
    }),

    // Check if user liked a post
    checkUserLiked: builder.query<ApiResponse<{ liked: boolean }>, string>({
      query: (postId) => ({
        url: `/post/${postId}/liked`,
        method: 'GET',
      }),
      providesTags: ['Posts'],
    }),

    // Create a comment
    createComment: builder.mutation<ApiResponse<Comment>, CreateCommentPayload>({
      query: ({ postId, content, parentCommentId }) => ({
        url: `/post/${postId}/comments`,
        method: 'POST',
        body: { content, parentCommentId },
      }),
      invalidatesTags: ['Posts'],
    }),

    // Get comments for a post
    getPostComments: builder.query<
      ApiResponse<GetCommentsResponse>,
      { postId: string; page?: number; limit?: number }
    >({
      query: ({ postId, page = 1, limit = 20 }) => ({
        url: `/post/${postId}/comments?page=${page}&limit=${limit}`,
        method: 'GET',
      }),
      providesTags: ['Posts'],
      keepUnusedDataFor: 0, // Don't cache - always fetch fresh data
    }),

    // Update a comment
    updateComment: builder.mutation<ApiResponse<Comment>, UpdateCommentPayload>({
      query: ({ commentId, content }) => ({
        url: `/post/comments/${commentId}`,
        method: 'PUT',
        body: { content },
      }),
      invalidatesTags: ['Posts'],
    }),

    // Delete a comment
    deleteComment: builder.mutation<ApiResponse<void>, string>({
      query: (commentId) => ({
        url: `/post/comments/${commentId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Posts'],
    }),
  }),
});

export const {
  useToggleLikeMutation,
  useGetPostLikesQuery,
  useCheckUserLikedQuery,
  useCreateCommentMutation,
  useGetPostCommentsQuery,
  useUpdateCommentMutation,
  useDeleteCommentMutation,
} = likesCommentsApi;
