import { API_END_POINTS } from '../endPoints';
import { baseApi } from './baseApi';
import type { ApiResponse } from './types';

export const leaveGroupApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    leaveGroup: builder.mutation<ApiResponse<any>, string>({
      query: (groupId) => ({
        url: API_END_POINTS.groups.leave(groupId),
        method: 'POST',
      }),
      invalidatesTags: ['Groups'],
    }),
  }),
  overrideExisting: false,
});

export const { useLeaveGroupMutation } = leaveGroupApi;

