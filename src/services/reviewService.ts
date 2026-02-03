import api from './api';
import type { Review, ApiResponse, Pagination } from '@/types';

interface ReviewsResponse extends ApiResponse<Review[]> {
  pagination: Pagination;
}

export const reviewService = {
  // Admin: Get all reviews
  async getAllReviews(params?: {
    page?: number;
    limit?: number;
    isApproved?: boolean;
    rating?: number;
  }): Promise<ReviewsResponse> {
    const { data } = await api.get<ReviewsResponse>('/reviews', { params });
    return data;
  },

  // Admin: Approve/Reject review
  async approveReview(id: string, isApproved: boolean): Promise<ApiResponse<Review>> {
    const { data } = await api.put<ApiResponse<Review>>(`/reviews/${id}/approve`, { isApproved });
    return data;
  },

  // Delete review
  async deleteReview(id: string): Promise<ApiResponse> {
    const { data } = await api.delete<ApiResponse>(`/reviews/${id}`);
    return data;
  },
};
