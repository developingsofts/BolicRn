import { API_END_POINTS } from '../endPoints';
import type { Group } from '../../types';
import { baseApi } from './baseApi';
import type { ApiResponse } from './types';

// ...existing code...

// Leave group (exit as a member)
export const leaveGroup = async (groupId: string) => {
  return baseApi.fetchBaseQuery({
    url: `/groups/${groupId}/leave`,
    method: 'POST',
  });
};

// ...existing code...
