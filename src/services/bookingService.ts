import api from './api';
import type { Booking, BookingFormData, AdminBookingFormData, ApiResponse, Pagination, Invoice, PaymentOption } from '@/types';

interface BookingsResponse extends ApiResponse<Booking[]> {
  pagination: Pagination;
}

interface BookingBillResponse extends ApiResponse<{
  booking: Booking;
  summary: {
    roomPrice: number;
    servicePrice: number;
    estimatedTotal: number;
    nights: number;
    userWalletBalance: number;
    userBonusBalance: number;
  };
}> {}

interface CheckoutResponse extends ApiResponse<{
  booking: Booking;
  payment: {
    totalAmount: number;
    paidFromWallet: number;
    paidFromBonus: number;
    remainingToPay: number;
    invoiceNumber: string;
  };
}> {}

interface PayWalletResponse extends ApiResponse<{
  booking: Booking;
  payment: {
    totalAmount: number;
    paidFromWallet: number;
    paidFromBonus: number;
  };
}> {}

export const bookingService = {
  async getBookings(params?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<BookingsResponse> {
    const { data } = await api.get<BookingsResponse>('/bookings', { params });
    return data;
  },

  async getBooking(id: string): Promise<ApiResponse<Booking>> {
    const { data } = await api.get<ApiResponse<Booking>>(`/bookings/${id}`);
    return data;
  },

  async createBooking(bookingData: BookingFormData): Promise<ApiResponse<Booking>> {
    const { data } = await api.post<ApiResponse<Booking>>('/bookings', bookingData);
    return data;
  },

  async createAdminBooking(bookingData: AdminBookingFormData): Promise<ApiResponse<Booking>> {
    const { data } = await api.post<ApiResponse<Booking>>('/bookings/admin', bookingData);
    return data;
  },

  async cancelBooking(id: string): Promise<ApiResponse<Booking>> {
    const { data } = await api.put<ApiResponse<Booking>>(`/bookings/${id}/cancel`);
    return data;
  },

  async uploadProof(id: string, proofImage: string): Promise<ApiResponse<Booking>> {
    const { data } = await api.put<ApiResponse<Booking>>(`/bookings/${id}/proof`, { proofImage });
    return data;
  },

  async approveBooking(id: string, action: 'approve' | 'reject'): Promise<ApiResponse<Booking>> {
    const { data } = await api.put<ApiResponse<Booking>>(`/bookings/${id}/approve`, { action });
    return data;
  },

  async updateBookingStatus(
    id: string,
    status?: string,
    paymentStatus?: string
  ): Promise<ApiResponse<Booking>> {
    const { data } = await api.put<ApiResponse<Booking>>(`/bookings/${id}/status`, {
      status,
      paymentStatus,
    });
    return data;
  },

  async processPayment(id: string): Promise<ApiResponse<Booking>> {
    const { data } = await api.put<ApiResponse<Booking>>(`/bookings/${id}/pay`);
    return data;
  },

  // New methods for wallet payment and checkout
  async checkIn(id: string): Promise<ApiResponse<Booking>> {
    const { data } = await api.put<ApiResponse<Booking>>(`/bookings/${id}/checkin`);
    return data;
  },

  async addService(id: string, serviceId: string, quantity: number = 1): Promise<ApiResponse<Booking>> {
    const { data } = await api.post<ApiResponse<Booking>>(`/bookings/${id}/services`, {
      serviceId,
      quantity,
    });
    return data;
  },

  async getBill(id: string): Promise<BookingBillResponse> {
    const { data } = await api.get<BookingBillResponse>(`/bookings/${id}/bill`);
    return data;
  },

  async checkout(id: string, paymentOption: PaymentOption, checkoutNote?: string): Promise<CheckoutResponse> {
    const { data } = await api.post<CheckoutResponse>(`/bookings/${id}/checkout`, {
      paymentOption,
      checkoutNote,
    });
    return data;
  },

  async payWithWallet(id: string, paymentOption: PaymentOption): Promise<PayWalletResponse> {
    const { data } = await api.post<PayWalletResponse>(`/bookings/${id}/pay-wallet`, {
      paymentOption,
    });
    return data;
  },

  async getInvoice(id: string): Promise<ApiResponse<Invoice>> {
    const { data } = await api.get<ApiResponse<Invoice>>(`/bookings/${id}/invoice`);
    return data;
  },
};
