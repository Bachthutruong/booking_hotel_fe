import api from './api';
import type {
  ApiResponse,
  Pagination,
  WalletBalance,
  WalletTransaction,
  DepositRequest,
  WithdrawalRequest,
  User,
} from '@/types';

interface TransactionsResponse extends ApiResponse<WalletTransaction[]> {
  pagination: Pagination;
}

interface DepositRequestsResponse extends ApiResponse<DepositRequest[]> {
  pagination: Pagination;
}

interface WithdrawalRequestsResponse extends ApiResponse<WithdrawalRequest[]> {
  pagination: Pagination;
}

interface UsersWalletResponse extends ApiResponse<User[]> {
  pagination: Pagination;
}

interface UserWalletDetailsResponse extends ApiResponse<{
  user: User;
  transactions: WalletTransaction[];
}> {
  pagination: Pagination;
}

export const walletService = {
  // User endpoints
  async getBalance(): Promise<ApiResponse<WalletBalance>> {
    const { data } = await api.get<ApiResponse<WalletBalance>>('/wallet/balance');
    return data;
  },

  async getTransactions(params?: {
    type?: string;
    page?: number;
    limit?: number;
  }): Promise<TransactionsResponse> {
    const { data } = await api.get<TransactionsResponse>('/wallet/transactions', { params });
    return data;
  },

  async createDeposit(depositData: {
    amount: number;
    proofImage: string;
    bankInfo: {
      bankName: string;
      accountNumber: string;
      accountName: string;
      transferContent: string;
    };
  }): Promise<ApiResponse<DepositRequest>> {
    const { data } = await api.post<ApiResponse<DepositRequest>>('/wallet/deposit', depositData);
    return data;
  },

  async getMyDeposits(params?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<DepositRequestsResponse> {
    const { data } = await api.get<DepositRequestsResponse>('/wallet/deposit/my', { params });
    return data;
  },

  async createWithdrawal(withdrawalData: {
    amount: number;
    bankInfo: {
      bankName: string;
      accountNumber: string;
      accountName: string;
    };
  }): Promise<ApiResponse<WithdrawalRequest>> {
    const { data } = await api.post<ApiResponse<WithdrawalRequest>>('/wallet/withdrawal', withdrawalData);
    return data;
  },

  async getMyWithdrawals(params?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<WithdrawalRequestsResponse> {
    const { data } = await api.get<WithdrawalRequestsResponse>('/wallet/withdrawal/my', { params });
    return data;
  },

  // Admin endpoints
  async getAllDeposits(params?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<DepositRequestsResponse> {
    const { data } = await api.get<DepositRequestsResponse>('/wallet/admin/deposits', { params });
    return data;
  },

  async processDeposit(id: string, action: 'approve' | 'reject', adminNote?: string): Promise<ApiResponse<DepositRequest>> {
    const { data } = await api.put<ApiResponse<DepositRequest>>(`/wallet/admin/deposits/${id}`, {
      action,
      adminNote,
    });
    return data;
  },

  async getAllWithdrawals(params?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<WithdrawalRequestsResponse> {
    const { data } = await api.get<WithdrawalRequestsResponse>('/wallet/admin/withdrawals', { params });
    return data;
  },

  async processWithdrawal(
    id: string,
    action: 'approve' | 'reject' | 'complete',
    adminNote?: string
  ): Promise<ApiResponse<WithdrawalRequest>> {
    const { data } = await api.put<ApiResponse<WithdrawalRequest>>(`/wallet/admin/withdrawals/${id}`, {
      action,
      adminNote,
    });
    return data;
  },

  async getAllUsersWallet(params?: {
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<UsersWalletResponse> {
    const { data } = await api.get<UsersWalletResponse>('/wallet/admin/users', { params });
    return data;
  },

  async getUserWalletDetails(userId: string, params?: {
    page?: number;
    limit?: number;
  }): Promise<UserWalletDetailsResponse> {
    const { data } = await api.get<UserWalletDetailsResponse>(`/wallet/admin/users/${userId}`, { params });
    return data;
  },

  async getAllTransactions(params?: {
    type?: string;
    userId?: string;
    page?: number;
    limit?: number;
  }): Promise<TransactionsResponse> {
    const { data } = await api.get<TransactionsResponse>('/wallet/admin/transactions', { params });
    return data;
  },
};
