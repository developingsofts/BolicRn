import { API_END_POINTS } from '../endPoints';
import type { Group } from '../../types';
import { baseApi } from './baseApi';
import type { ApiResponse } from './types';

interface GroupDetailsResponse extends Group {
  members?: number;
  upcomingEvents?: number;
}

interface GroupActionPayload {
  groupId: string;
}

interface CreateGroupPayload {
  name: string;
  description: string;
  trainingTypes: string[];
  location?: string;
  photo?: string;
}

export const groupsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getGroups: builder.query<ApiResponse<Group[]>, void>({
      query: () => ({
        url: API_END_POINTS.groups.list,
        method: 'GET',
      }),
      providesTags: ['Groups'],
    }),
    getGroupDetails: builder.query<
      ApiResponse<GroupDetailsResponse>,
      GroupActionPayload
    >({
      query: ({ groupId }) => ({
        url: API_END_POINTS.groups.details(groupId),
        method: 'GET',
      }),
      providesTags: ['Groups'],
    }),
    joinGroup: builder.mutation<ApiResponse<{ success: boolean }>, GroupActionPayload>({
      query: ({ groupId }) => ({
        url: API_END_POINTS.groups.join(groupId),
        method: 'POST',
        body: {},
      }),
      invalidatesTags: ['Groups'],
    }),
    leaveGroup: builder.mutation<
      ApiResponse<{ success: boolean }>,
      GroupActionPayload
    >({
      query: ({ groupId }) => ({
        url: API_END_POINTS.groups.leave(groupId),
        method: 'POST',
        body: {},
      }),
      invalidatesTags: ['Groups'],
    }),
    createGroup: builder.mutation<
      ApiResponse<Group>,
      CreateGroupPayload
    >({
      query: (body) => ({
        url: API_END_POINTS.groups.list,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Groups'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetGroupsQuery,
  useGetGroupDetailsQuery,
  useJoinGroupMutation,
  useLeaveGroupMutation,
  useCreateGroupMutation,
} = groupsApi;
