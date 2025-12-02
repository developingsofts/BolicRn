import { API_END_POINTS } from '../endPoints';
import { baseApi } from './baseApi';
import type { ApiResponse } from './types';

// Interface for a training price session
export interface TrainingPriceSession {
  id: number | string;
  userId: number | string;
  session_name: string;
  description: string;
  price: string;
  createdAt: string;
  updatedAt: string;
}

export const pricesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createTrainingPrice: builder.mutation<any, Array<{ price: string; session_name: string; description: string }>>({
      query: (body) => {
        console.log('createTrainingPrice direct array:', body);
        return {
          url: API_END_POINTS.trainingPrice.create,
          method: 'POST',
          body,
        };
      },
      invalidatesTags: ['TrainerPricing','BookTrainer'],
    }),
    updateTrainingPrice: builder.mutation<any, { id: string; price?: string | string; session_name?: string; description?: string }>({
      query: (body) => ({
        url: API_END_POINTS.trainingPrice.update,
        method: 'POST',
        body: [body],
      }),
      invalidatesTags: ['TrainerPricing','BookTrainer'],
    }),
    getTrainingPrices: builder.query<
      ApiResponse<TrainingPriceSession[]>,
    { trainerId: string }
    >({
      query: ({ trainerId }) => ({
        url: API_END_POINTS.trainingPrice.list,
        method: 'POST',
        body: { trainerId },
      }),
      providesTags: ['TrainerPricing','BookTrainer'],
    }),
    deleteTrainingPrices: builder.mutation<any, { id: string } | { ids: string[] }>({
      query: (body) => {
        let ids: string[] = [];
        if (Array.isArray((body as any).ids)) {
          ids = (body as any).ids;
        } else if ((body as any).id) {
          ids = [(body as any).id];
        }
        return {
          url: API_END_POINTS.trainingPrice.delete,
          method: 'POST',
          body: { ids },
        };
      },
      invalidatesTags: ['TrainerPricing','BookTrainer'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useCreateTrainingPriceMutation,
  useUpdateTrainingPriceMutation,
  useGetTrainingPricesQuery,
  useDeleteTrainingPricesMutation,
} = pricesApi;
