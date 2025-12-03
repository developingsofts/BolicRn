import { API_END_POINTS } from '../endPoints';
import { baseApi } from './baseApi';
import type { ApiResponse } from './types';

export interface UserConnection {
  id: number;
  displayName: string;
  email: string;
  location: string;
  imageUrl?: string;
  role: string;
  [key: string]: any;
}

export interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ConnectionsListResponse {
  users: UserConnection[];
  pagination: PaginationInfo;
}

export interface UserConnectionsRequest {
  userId: number | string;
  page?: number;
  limit?: number;
}

export const connectionsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getUserConnections: builder.query<ApiResponse<ConnectionsListResponse>, UserConnectionsRequest>({
      query: (body) => ({
        url: API_END_POINTS.connections.userConnections,
        method: 'POST',
        body,
      }),
      providesTags: ['Connections'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetUserConnectionsQuery,
} = connectionsApi;
