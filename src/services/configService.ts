import api from './api';
import type { SystemConfig, ApiResponse } from '@/types';

export const configService = {
  async getConfig(key: string): Promise<ApiResponse<SystemConfig>> {
    const { data } = await api.get<ApiResponse<SystemConfig>>(`/config/${key}`);
    return data;
  },

  async updateConfig(key: string, value: any): Promise<ApiResponse<SystemConfig>> {
    const { data } = await api.post<ApiResponse<SystemConfig>>('/config', { key, value });
    return data;
  },
};
