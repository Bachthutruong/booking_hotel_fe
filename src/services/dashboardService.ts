import api from './api';
import type { DashboardStats, RevenueData, Booking, Hotel, ApiResponse } from '@/types';

export const dashboardService = {
  async getStats(): Promise<ApiResponse<DashboardStats>> {
    const { data } = await api.get<ApiResponse<DashboardStats>>('/dashboard/stats');
    return data;
  },

  async getRevenue(year?: number): Promise<ApiResponse<RevenueData[]>> {
    const { data } = await api.get<ApiResponse<RevenueData[]>>('/dashboard/revenue', {
      params: { year },
    });
    return data;
  },

  async getBookingsChart(days?: number): Promise<ApiResponse<{ _id: string; count: number; revenue: number }[]>> {
    const { data } = await api.get<ApiResponse<{ _id: string; count: number; revenue: number }[]>>(
      '/dashboard/bookings-chart',
      { params: { days } }
    );
    return data;
  },

  async getRecentBookings(limit?: number): Promise<ApiResponse<Booking[]>> {
    const { data } = await api.get<ApiResponse<Booking[]>>('/dashboard/recent-bookings', {
      params: { limit },
    });
    return data;
  },

  async getTopHotels(): Promise<ApiResponse<(Hotel & { totalBookings: number; totalRevenue: number })[]>> {
    const { data } = await api.get<ApiResponse<(Hotel & { totalBookings: number; totalRevenue: number })[]>>(
      '/dashboard/top-hotels'
    );
    return data;
  },
};
