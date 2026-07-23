import { API_END_POINTS } from '../endPoints';
import type { Group } from '../../types';
import { baseApi } from './baseApi';
import type { ApiResponse } from './types';

type GroupDetailsResponse = Group;

interface GroupActionPayload {
  groupId: string;
}

interface CreateGroupPayload {
  name: string;
  description: string;
  type: string;
  location: string;
  privacy: string;
  memberIds: number[];
}

interface UpdateGroupPayload {
  groupId: string;
  name?: string;
  description?: string;
  type?: string;
  location?: string;
  privacy?: string;
  addIds?: number[];
  removeIds?: number[];
}

interface GetGroupMembersPayload {
  groupId: string;
  page?: number;
  limit?: number;
}

interface GetGroupPostsPayload {
  groupId: string;
  page?: number;
  limit?: number;
}

interface GetGroupJoinRequestsPayload {
  groupId: string;
  status?: string;
}

interface RespondToJoinRequestPayload {
  requestId: string;
  action: "approve" | "reject";
}

export const groupsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllGroups: builder.query<
      ApiResponse<{ groups: Group[]; pagination: any }>,
      { page?: number; limit?: number; type?: string } | void
    >({
      query: (params) => {
        const page = params?.page || 1;
        const limit = params?.limit || 10;
        const type = params?.type;

        let url = `/group/all?page=${page}&limit=${limit}`;
        if (type && type !== 'All') {
          url += `&type=${type}`;
        }

        return {
          url,
          method: 'GET',
        };
      },
      providesTags: ['Groups'],
      serializeQueryArgs: ({ endpointName, queryArgs }) => {
        return `${endpointName}-${queryArgs?.type || 'All'}`;
      },
      merge: (currentCache, newItems, { arg }) => {
        if (!arg || arg.page === 1) {
          return newItems;
        }

        if ('data' in currentCache && 'data' in newItems && currentCache.status && newItems.status) {
          return {
            ...newItems,
            data: {
              groups: [
                ...(currentCache.data?.groups || []),
                ...(newItems.data?.groups || [])
              ],
              pagination: newItems.data?.pagination
            }
          };
        }

        return newItems;
      },
      forceRefetch({ currentArg, previousArg }) {
        return currentArg?.page !== previousArg?.page || currentArg?.type !== previousArg?.type;
      },
    }),

    getUserGroups: builder.query<
      ApiResponse<{ groups: Group[]; pagination: any }>,
      { page?: number; limit?: number; type?: string } | void
    >({
      query: (params) => {
        const page = params?.page || 1;
        const limit = params?.limit || 10;
        const type = params?.type;

        let url = `/group/my-groups?page=${page}&limit=${limit}`;
        if (type && type !== 'All') {
          url += `&type=${type}`;
        }

        return {
          url,
          method: 'GET',
        };
      },
      providesTags: ['Groups'],
      serializeQueryArgs: ({ endpointName, queryArgs }) => {
        return `${endpointName}-${queryArgs?.type || 'All'}`;
      },
      merge: (currentCache, newItems, { arg }) => {
        if (!arg || arg.page === 1) {
          return newItems;
        }

        if ('data' in currentCache && 'data' in newItems && currentCache.status && newItems.status) {
          return {
            ...newItems,
            data: {
              groups: [
                ...(currentCache.data?.groups || []),
                ...(newItems.data?.groups || [])
              ],
              pagination: newItems.data?.pagination
            }
          };
        }

        return newItems;
      },
      forceRefetch({ currentArg, previousArg }) {
        return currentArg?.page !== previousArg?.page || currentArg?.type !== previousArg?.type;
      },
    }),

    getGroupById: builder.query<
      ApiResponse<GroupDetailsResponse>,
      { groupId: string }
    >({
      query: ({ groupId }) => ({
        url: `/group/${groupId}`,
        method: 'GET',
      }),
      providesTags: ['Groups'],
    }),

    getGroupMembers: builder.query<
      ApiResponse<{ members: any[]; pagination: any }>,
      GetGroupMembersPayload
    >({
      query: ({ groupId, page = 1, limit = 20 }) => ({
        url: `/group/members/${groupId}?page=${page}&limit=${limit}`,
        method: 'GET',
      }),
      providesTags: ['Groups'],
    }),

    getGroupPosts: builder.query<
      ApiResponse<{ posts: any[]; pagination: any }>,
      GetGroupPostsPayload
    >({
      query: ({ groupId, page = 1, limit = 10 }) => ({
        url: `/group/posts/${groupId}?page=${page}&limit=${limit}`,
        method: 'GET',
      }),
      providesTags: ['Groups', 'Posts'],
    }),

    createGroup: builder.mutation<
      ApiResponse<Group>,
      CreateGroupPayload
    >({
      query: (body) => ({
        url: '/group/create',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Groups'],
    }),

    updateGroup: builder.mutation<
      ApiResponse<Group>,
      UpdateGroupPayload
    >({
      query: ({ groupId, ...body }) => ({
        url: `/group/update/${groupId}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Groups'],
    }),

    deleteGroup: builder.mutation<
      ApiResponse<{ success: boolean }>,
      { groupId: string }
    >({
      query: ({ groupId }) => ({
        url: `/group/delete/${groupId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Groups'],
    }),

    joinGroup: builder.mutation<
      ApiResponse<Group>,
      { groupId: string }
    >({
      query: ({ groupId }) => ({
        url: `/group/join/${groupId}`,
        method: 'POST',
      }),
      invalidatesTags: ['Groups'],
    }),

    requestJoinGroup: builder.mutation<
      ApiResponse<{ id: number; status: string }>,
      { groupId: string }
    >({
      query: ({ groupId }) => ({
        url: `/group/request/${groupId}`,
        method: 'POST',
      }),
      invalidatesTags: ['Groups'],
    }),

    getGroupJoinRequests: builder.query<
      ApiResponse<any[]>,
      GetGroupJoinRequestsPayload
    >({
      query: ({ groupId, status }) => ({
        url: `/group/${groupId}/requests${status ? `?status=${status}` : ''}`,
        method: 'GET',
      }),
  providesTags: ['Groups'],
    }),

    respondToJoinRequest: builder.mutation<
      ApiResponse<any>,
      RespondToJoinRequestPayload
    >({
      query: ({ requestId, action }) => ({
        url: `/group/requests/${requestId}/respond`,
        method: 'POST',
        body: { action },
      }),
  invalidatesTags: ['Groups'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetAllGroupsQuery,
  useGetUserGroupsQuery,
  useGetGroupByIdQuery,
  useGetGroupMembersQuery,
  useGetGroupPostsQuery,
  useCreateGroupMutation,
  useUpdateGroupMutation,
  useDeleteGroupMutation,
  useJoinGroupMutation,
  useRequestJoinGroupMutation,
  useGetGroupJoinRequestsQuery,
  useRespondToJoinRequestMutation,
} = groupsApi;
