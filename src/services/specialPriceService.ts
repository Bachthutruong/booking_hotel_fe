import api from './api';
import type {
  RoomSpecialPrice,
  ApiResponse,
  Pagination,
  RoomPriceBreakdownItem,
} from '@/types';

interface SpecialPricesResponse extends ApiResponse<RoomSpecialPrice[]> {
  pagination: Pagination;
}

export interface PricePreviewResponse {
  breakdown: RoomPriceBreakdownItem[];
  totalRoomPrice: number;
  basePrice: number;
}

export const specialPriceService = {
  async getList(params?: {
    page?: number;
    limit?: number;
    type?: string;
    isActive?: string;
    roomId?: string;
  }): Promise<SpecialPricesResponse> {
    const { data } = await api.get<SpecialPricesResponse>('/special-prices', { params });
    return data;
  },

  async getById(id: string): Promise<ApiResponse<RoomSpecialPrice>> {
    const { data } = await api.get<ApiResponse<RoomSpecialPrice>>(`/special-prices/${id}`);
    return data;
  },

  async create(body: {
    name: string;
    rooms: string[];
    type: 'date_range' | 'weekend';
    startDate?: string;
    endDate?: string;
    modifierType: 'percentage' | 'fixed';
    modifierValue: number;
    isActive?: boolean;
  }): Promise<ApiResponse<RoomSpecialPrice>> {
    const { data } = await api.post<ApiResponse<RoomSpecialPrice>>('/special-prices', body);
    return data;
  },

  async update(
    id: string,
    body: Partial<{
      name: string;
      rooms: string[];
      type: 'date_range' | 'weekend';
      startDate: string;
      endDate: string;
      modifierType: 'percentage' | 'fixed';
      modifierValue: number;
      isActive: boolean;
    }>
  ): Promise<ApiResponse<RoomSpecialPrice>> {
    const { data } = await api.put<ApiResponse<RoomSpecialPrice>>(`/special-prices/${id}`, body);
    return data;
  },

  async delete(id: string): Promise<ApiResponse<void>> {
    const { data } = await api.delete<ApiResponse<void>>(`/special-prices/${id}`);
    return data;
  },

  /** Preview giá phòng theo khoảng ngày (public, dùng ở form đặt phòng). */
  async getPricePreview(
    roomId: string,
    checkIn: string,
    checkOut: string
  ): Promise<ApiResponse<PricePreviewResponse>> {
    const { data } = await api.get<ApiResponse<PricePreviewResponse>>('/special-prices/preview', {
      params: { roomId, checkIn, checkOut },
    });
    return data;
  },
};
