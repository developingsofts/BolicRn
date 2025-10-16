import { API_END_POINTS } from '../endPoints';
import type { Group } from '../../types';
import { baseApi } from './baseApi';
import type { ApiResponse } from './types';

// ...existing code...


// Leave group (exit as a member) - RTK Query endpoint
export const leaveGroupApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    leaveGroup: builder.mutation<ApiResponse<any>, string>({
      query: (groupId) => ({
        url: `/groups/${groupId}/leave`,
        method: 'POST',
      }),
      invalidatesTags: ['Groups'],
    }),
  }),
  overrideExisting: false,
});

export const { useLeaveGroupMutation } = leaveGroupApi;

// ...existing code...
