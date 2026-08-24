import { API_END_POINTS } from '../endPoints';
import type { Group } from '../../types';
import { baseApi } from './baseApi';
import type { ApiResponse } from './types';

type GroupDetailsResponse = Group;

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

type GroupListResponse = ApiResponse<{ groups: Group[]; pagination: any }>;

/**
 * Pages of `/group/all` and `/group/my-groups` accumulate into a single cache
 * entry. RTK Query re-runs the *current* page arg whenever the `Groups` tag is
 * invalidated (join / leave / create / delete), so a plain concat duplicated
 * every group on the last-loaded page. Merge by id: refresh entries we already
 * hold, append the ones we don't.
 */
const mergeGroupPages = (
  currentCache: GroupListResponse,
  newItems: GroupListResponse,
  page?: number
): GroupListResponse => {
  if (!page || page === 1) {
    return newItems;
  }

  if (!currentCache.status || !newItems.status) {
    return newItems;
  }

  const existing = currentCache.data?.groups ?? [];
  const incoming = newItems.data?.groups ?? [];
  const incomingById = new Map(incoming.map((g) => [String(g.id), g]));
  const seen = new Set<string>();

  const merged: Group[] = [];
  existing.forEach((group) => {
    const key = String(group.id);
    if (seen.has(key)) return;
    seen.add(key);
    merged.push(incomingById.get(key) ?? group);
  });
  incoming.forEach((group) => {
    const key = String(group.id);
    if (seen.has(key)) return;
    seen.add(key);
    merged.push(group);
  });

  return {
    ...newItems,
    data: {
      groups: merged,
      pagination: newItems.data?.pagination,
    },
  };
};

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

        let url = `${API_END_POINTS.groups.all}?page=${page}&limit=${limit}`;
        if (type && type !== 'All') {
          url += `&type=${encodeURIComponent(type)}`;
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
      merge: (currentCache, newItems, { arg }) =>
        mergeGroupPages(currentCache, newItems, arg?.page),
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

        let url = `${API_END_POINTS.groups.myGroups}?page=${page}&limit=${limit}`;
        if (type && type !== 'All') {
          url += `&type=${encodeURIComponent(type)}`;
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
      merge: (currentCache, newItems, { arg }) =>
        mergeGroupPages(currentCache, newItems, arg?.page),
      forceRefetch({ currentArg, previousArg }) {
        return currentArg?.page !== previousArg?.page || currentArg?.type !== previousArg?.type;
      },
    }),

    getGroupById: builder.query<
      ApiResponse<GroupDetailsResponse>,
      { groupId: string }
    >({
      query: ({ groupId }) => ({
        url: API_END_POINTS.groups.details(groupId),
        method: 'GET',
      }),
      providesTags: ['Groups'],
    }),

    getGroupMembers: builder.query<
      ApiResponse<{ members: any[]; pagination: any }>,
      GetGroupMembersPayload
    >({
      query: ({ groupId, page = 1, limit = 20 }) => ({
        url: `${API_END_POINTS.groups.members(groupId)}?page=${page}&limit=${limit}`,
        method: 'GET',
      }),
      providesTags: ['Groups'],
    }),

    getGroupPosts: builder.query<
      ApiResponse<{ posts: any[]; pagination: any }>,
      GetGroupPostsPayload
    >({
      query: ({ groupId, page = 1, limit = 10 }) => ({
        url: `${API_END_POINTS.groups.posts(groupId)}?page=${page}&limit=${limit}`,
        method: 'GET',
      }),
      providesTags: ['Groups', 'Posts'],
    }),

    createGroup: builder.mutation<
      ApiResponse<Group>,
      CreateGroupPayload
    >({
      query: (body) => ({
        url: API_END_POINTS.groups.create,
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
        url: API_END_POINTS.groups.update(groupId),
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
        url: API_END_POINTS.groups.delete(groupId),
        method: 'DELETE',
      }),
      invalidatesTags: ['Groups'],
    }),

    joinGroup: builder.mutation<
      ApiResponse<Group>,
      { groupId: string }
    >({
      query: ({ groupId }) => ({
        url: API_END_POINTS.groups.join(groupId),
        method: 'POST',
      }),
      invalidatesTags: ['Groups'],
    }),

    requestJoinGroup: builder.mutation<
      ApiResponse<{ id: number; status: string }>,
      { groupId: string }
    >({
      query: ({ groupId }) => ({
        url: API_END_POINTS.groups.requestJoin(groupId),
        method: 'POST',
      }),
      invalidatesTags: ['Groups'],
    }),

    getGroupJoinRequests: builder.query<
      ApiResponse<any[]>,
      GetGroupJoinRequestsPayload
    >({
      query: ({ groupId, status }) => ({
        url: `${API_END_POINTS.groups.joinRequests(groupId)}${
          status ? `?status=${encodeURIComponent(status)}` : ''
        }`,
        method: 'GET',
      }),
      providesTags: ['Groups'],
    }),

    respondToJoinRequest: builder.mutation<
      ApiResponse<any>,
      RespondToJoinRequestPayload
    >({
      query: ({ requestId, action }) => ({
        url: API_END_POINTS.groups.respondToJoinRequest(requestId),
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
