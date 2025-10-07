import { API_END_POINTS } from '../endPoints';
import type { Post } from '../../types';
import { baseApi } from './baseApi';
import type { ApiResponse, PaginationParams } from './types';

interface PostActionPayload {
  postId: string;
}

interface CreatePostPayload {
  content: string;
  type: string;
  media?: string[];
  tags?: string[];
  workoutData?: Post['workoutData'];
  achievementData?: Post['achievementData'];
  progressData?: Post['progressData'];
}

interface CommentPayload {
  postId: string;
  comment: string;
}

export const postsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPosts: builder.query<
      ApiResponse<Post[]>,
      PaginationParams | void
    >({
      query: (params) => ({
        url: API_END_POINTS.posts.list(params?.page, params?.limit),
        method: 'GET',
      }),
      providesTags: ['Posts'],
    }),
    createPost: builder.mutation<ApiResponse<Post>, CreatePostPayload>({
      query: (body) => ({
        url: API_END_POINTS.posts.create,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Posts'],
    }),
    likePost: builder.mutation<ApiResponse<{ success: boolean }>, PostActionPayload>({
      query: ({ postId }) => ({
        url: API_END_POINTS.posts.like(postId),
        method: 'POST',
        body: {},
      }),
      invalidatesTags: ['Posts'],
    }),
    unlikePost: builder.mutation<
      ApiResponse<{ success: boolean }>,
      PostActionPayload
    >({
      query: ({ postId }) => ({
        url: API_END_POINTS.posts.like(postId),
        method: 'DELETE',
      }),
      invalidatesTags: ['Posts'],
    }),
    addComment: builder.mutation<ApiResponse<Post>, CommentPayload>({
      query: ({ postId, comment }) => ({
        url: API_END_POINTS.posts.comments(postId),
        method: 'POST',
        body: { comment },
      }),
      invalidatesTags: ['Posts'],
    }),
    deletePost: builder.mutation<
      ApiResponse<{ success: boolean }>,
      PostActionPayload
    >({
      query: ({ postId }) => ({
        url: API_END_POINTS.posts.delete(postId),
        method: 'DELETE',
      }),
      invalidatesTags: ['Posts'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetPostsQuery,
  useCreatePostMutation,
  useLikePostMutation,
  useUnlikePostMutation,
  useAddCommentMutation,
  useDeletePostMutation,
} = postsApi;
