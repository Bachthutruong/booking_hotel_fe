import api from './api';
import type { ApiResponse } from '@/types';

export const uploadService = {
  async uploadImage(file: File): Promise<ApiResponse<{ url: string; filename: string }>> {
    const formData = new FormData();
    formData.append('image', file);

    // Không set Content-Type thủ công — axios tự set multipart/form-data với boundary
    const { data } = await api.post<ApiResponse<{ url: string; filename: string }>>(
      '/upload',
      formData
    );
    return data;
  },
};
