import api from './api';
import type { ApiResponse, Pagination, PromotionConfig } from '@/types';

interface PromotionsResponse extends ApiResponse<PromotionConfig[]> {
  pagination?: Pagination;
}

interface PromotionCalculateResponse extends ApiResponse<{
  promotion?: PromotionConfig;
  bonusAmount: number;
  totalReceive: number;
  message?: string;
}> {}

export const promotionService = {
  // Public endpoints
  async getActivePromotions(): Promise<ApiResponse<PromotionConfig[]>> {
    const { data } = await api.get<ApiResponse<PromotionConfig[]>>('/promotions/active');
    return data;
  },

  async calculatePromotion(amount: number): Promise<PromotionCalculateResponse> {
    const { data } = await api.get<PromotionCalculateResponse>('/promotions/calculate', {
      params: { amount },
    });
    return data;
  },

  // Admin endpoints
  async getAllPromotions(params?: {
    hotelId?: string;
    roomId?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }): Promise<PromotionsResponse> {
    const { data } = await api.get<PromotionsResponse>('/promotions', { params });
    return data;
  },

  async getPromotionById(id: string): Promise<ApiResponse<PromotionConfig>> {
    const { data } = await api.get<ApiResponse<PromotionConfig>>(`/promotions/${id}`);
    return data;
  },

  async createPromotion(promotionData: {
    hotel?: string;
    room?: string;
    name: string;
    description?: string;
    depositAmount: number;
    bonusAmount?: number;
    bonusPercent?: number;
    minDeposit?: number;
    maxBonus?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<PromotionConfig>> {
    const { data } = await api.post<ApiResponse<PromotionConfig>>('/promotions', promotionData);
    return data;
  },

  async updatePromotion(id: string, promotionData: {
    hotel?: string;
    room?: string;
    name?: string;
    description?: string;
    depositAmount?: number;
    bonusAmount?: number;
    bonusPercent?: number;
    minDeposit?: number;
    maxBonus?: number;
    isActive?: boolean;
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<PromotionConfig>> {
    const { data } = await api.put<ApiResponse<PromotionConfig>>(`/promotions/${id}`, promotionData);
    return data;
  },

  async deletePromotion(id: string): Promise<ApiResponse<void>> {
    const { data } = await api.delete<ApiResponse<void>>(`/promotions/${id}`);
    return data;
  },
};
