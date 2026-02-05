import api from './api';
import type { AuthResponse, LoginCredentials, RegisterData, User, ApiResponse } from '@/types';

interface RegisterResponse {
  success: boolean;
  message: string;
  requiresEmailVerification?: boolean;
  token?: string;
  data?: User | {
    email: string;
    expiresIn: number;
  };
}

interface VerifyEmailData {
  email: string;
  code: string;
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/login', credentials);
    if (data.token) {
      localStorage.setItem('token', data.token);
    }
    return data;
  },

  async register(userData: RegisterData): Promise<RegisterResponse> {
    const { data } = await api.post<RegisterResponse>('/auth/register', userData);
    return data;
  },

  async verifyEmail(verifyData: VerifyEmailData): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/verify-email', verifyData);
    if (data.token) {
      localStorage.setItem('token', data.token);
    }
    return data;
  },

  async resendVerificationCode(email: string): Promise<RegisterResponse> {
    const { data } = await api.post<RegisterResponse>('/auth/resend-code', { email });
    return data;
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout');
    localStorage.removeItem('token');
  },

  async getMe(): Promise<ApiResponse<User>> {
    const { data } = await api.get<ApiResponse<User>>('/auth/me');
    return data;
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<ApiResponse> {
    const { data } = await api.put<ApiResponse>('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    return data;
  },
};
