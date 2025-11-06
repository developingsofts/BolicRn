import { API_END_POINTS } from '../endPoints';
import type { Note } from '../../types';
import { baseApi } from './baseApi';
import type { ApiResponse } from './types';

interface CreateNotePayload {
  text: string;
}

interface UpdateNotePayload {
  noteId: string;
  text: string;
}

export const notesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getNotes: builder.query<ApiResponse<Note[]>, void>({
      query: () => ({
        url: API_END_POINTS.notes.list,
        method: 'GET',
      }),
      providesTags: ['Notes'],
    }),
    createNote: builder.mutation<ApiResponse<Note>, CreateNotePayload>({
      query: (body) => ({
        url: API_END_POINTS.notes.create,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Notes'],
    }),
    updateNote: builder.mutation<ApiResponse<Note>, UpdateNotePayload>({
      query: ({ noteId, text }) => ({
        url: API_END_POINTS.notes.update(noteId),
        method: 'PUT',
        body: { text },
      }),
      invalidatesTags: ['Notes'],
    }),
    deleteNote: builder.mutation<ApiResponse<{ success: boolean }>, { noteId: string }>({
      query: ({ noteId }) => ({
        url: API_END_POINTS.notes.delete(noteId),
        method: 'DELETE',
      }),
      invalidatesTags: ['Notes'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetNotesQuery,
  useCreateNoteMutation,
  useUpdateNoteMutation,
  useDeleteNoteMutation,
} = notesApi;
