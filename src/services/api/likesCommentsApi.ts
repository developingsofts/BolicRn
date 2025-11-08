import { baseApi } from './baseApi';
import type { ApiResponse } from './types';

export const REACTION_TYPES = [
  'like',
  'love',
  'celebrate',
  'insightful',
  'support',
] as const;

export type ReactionType = (typeof REACTION_TYPES)[number];

interface ReactionSummary {
  reactionSummary: Record<ReactionType, number>;
  totalReactions: number;
  currentReaction: ReactionType | null;
}

interface ReactionResponse extends ReactionSummary {
  reacted: boolean;
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
    // React to a post
    reactToPost: builder.mutation<ApiResponse<ReactionResponse>, { postId: string; reactionType?: ReactionType }>({
      query: ({ postId, reactionType }) => ({
        url: `/post/${postId}/like`,
        method: 'POST',
        body: {
          reactionType,
        },
      }),
      invalidatesTags: ['Posts'],
    }),

    // Get reactions for a post
    getPostReactions: builder.query<
      ApiResponse<GetLikesResponse & { reactionSummary: Record<ReactionType, number> }>,
      { postId: string; page?: number; limit?: number }
    >({
      query: ({ postId, page = 1, limit = 20 }) => ({
        url: `/post/${postId}/likes?page=${page}&limit=${limit}`,
        method: 'GET',
      }),
      providesTags: ['Posts'],
    }),

    // Check the current user's reaction to a post
    checkUserReaction: builder.query<ApiResponse<{ reacted: boolean; currentReaction: ReactionType | null }>, string>({
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

const {
  useReactToPostMutation,
  useGetPostReactionsQuery,
  useCheckUserReactionQuery,
  useCreateCommentMutation,
  useGetPostCommentsQuery,
  useUpdateCommentMutation,
  useDeleteCommentMutation,
} = likesCommentsApi;

export {
  useReactToPostMutation,
  useGetPostReactionsQuery,
  useCheckUserReactionQuery,
  useCreateCommentMutation,
  useGetPostCommentsQuery,
  useUpdateCommentMutation,
  useDeleteCommentMutation,
};

export const useToggleLikeMutation = useReactToPostMutation;
export const useGetPostLikesQuery = useGetPostReactionsQuery;
export const useCheckUserLikedQuery = useCheckUserReactionQuery;
