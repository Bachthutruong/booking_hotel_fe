import api from './api';
import type { User, ApiResponse, Pagination } from '@/types';

interface UsersResponse extends ApiResponse<User[]> {
  pagination: Pagination;
}

export interface CreateUserPayload {
  email: string;
  fullName: string;
  phone: string;
  role: 'user' | 'admin' | 'staff';
  password?: string;
}

export interface UserAuditLogItem {
  _id: string;
  action: 'created' | 'updated' | 'deleted';
  targetUser: string;
  targetUserEmail?: string;
  targetUserFullName?: string;
  targetUserRole?: string;
  performedBy: string;
  performedByEmail?: string;
  performedByFullName?: string;
  details?: string;
  oldData?: Record<string, unknown>;
  newData?: Record<string, unknown>;
  createdAt: string;
}

interface UserAuditLogsResponse extends ApiResponse<UserAuditLogItem[]> {
  pagination: Pagination;
}

export const userService = {
  async getUsers(params?: {
    search?: string;
    role?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }): Promise<UsersResponse> {
    const { data } = await api.get<UsersResponse>('/users', { params });
    return data;
  },

  async createUser(payload: CreateUserPayload): Promise<ApiResponse<User>> {
    const { data } = await api.post<ApiResponse<User>>('/users', payload);
    return data;
  },

  async getUserAuditLogs(params?: {
    page?: number;
    limit?: number;
    action?: 'created' | 'updated' | 'deleted';
    targetUserId?: string;
  }): Promise<UserAuditLogsResponse> {
    const { data } = await api.get<UserAuditLogsResponse>('/users/audit-logs', { params });
    return data;
  },

  async getUser(id: string): Promise<ApiResponse<User>> {
    const { data } = await api.get<ApiResponse<User>>(`/users/${id}`);
    return data;
  },

  async updateUser(id: string, userData: Partial<User>): Promise<ApiResponse<User>> {
    const { data } = await api.put<ApiResponse<User>>(`/users/${id}`, userData);
    return data;
  },

  async deleteUser(id: string): Promise<ApiResponse> {
    const { data } = await api.delete<ApiResponse>(`/users/${id}`);
    return data;
  },

  async uploadAvatar(id: string, file: File): Promise<ApiResponse<User>> {
    const formData = new FormData();
    formData.append('avatar', file);
    const { data } = await api.put<ApiResponse<User>>(`/users/${id}/avatar`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
};
