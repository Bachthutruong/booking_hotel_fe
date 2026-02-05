// User types
export interface User {
  _id: string;
  email: string;
  fullName: string;
  phone: string;
  avatar: string;
  role: 'user' | 'admin';
  isActive: boolean;
  walletBalance: number;
  bonusBalance: number;
  createdAt: string;
  updatedAt: string;
}

// Hotel types
export interface Hotel {
  _id: string;
  name: string;
  description: string;
  address: string;
  city: string;
  country: string;
  images: string[];
  amenities: string[];
  rating: number;
  totalReviews: number;
  priceRange: {
    min: number;
    max: number;
  };
  policies: {
    checkIn: string;
    checkOut: string;
    cancellation: string;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Room types
export type RoomType = 'standard' | 'deluxe' | 'suite' | 'villa';

export interface Room {
  _id: string;
  hotel: string | Hotel;
  category?: string | RoomCategory;
  name: string;
  description: string;
  type: RoomType;
  price: number;
  capacity: {
    adults: number;
    children: number;
  };
  size: number;
  bedType: string;
  images: string[];
  amenities: string[];
  quantity: number;
  availableQuantity?: number;
  isAvailable?: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Service types
export interface Service {
  _id: string;
  name: string;
  description: string;
  price: number;
  icon?: string;
  qrCode?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Room Category types
export interface RoomCategory {
  _id: string;
  name: string;
  description: string;
  icon?: string;
  order: number;
  isActive: boolean;
  roomCount?: number;
  createdAt: string;
  updatedAt: string;
}

// System Config
export interface SystemConfig {
  _id: string;
  key: string;
  value: any;
  createdAt: string;
  updatedAt: string;
}

// Booking types
export type BookingStatus = 'pending' | 'pending_deposit' | 'awaiting_approval' | 'confirmed' | 'cancelled' | 'completed';
export type PaymentStatus = 'pending' | 'paid' | 'refunded';
export type PaymentMethod = 'bank_transfer' | 'wallet' | 'cash';
export type PaymentOption = 'use_bonus' | 'use_main_only';

export interface BookingServiceItem {
  service: string | Service;
  quantity: number;
  price: number;
}

export interface Booking {
  _id: string;
  user: string | User;
  hotel: string | Hotel;
  room: string | Room;
  checkIn: string;
  checkOut: string;
  actualCheckIn?: string;
  actualCheckOut?: string;
  guests: {
    adults: number;
    children: number;
  };
  roomPrice: number;
  servicePrice: number;
  totalPrice: number;
  estimatedPrice: number;
  finalPrice?: number;
  paidFromWallet?: number;
  paidFromBonus?: number;
  services: BookingServiceItem[];
  proofImage?: string;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  paymentOption?: PaymentOption;
  specialRequests: string;
  contactInfo: {
    fullName: string;
    email: string;
    phone: string;
  };
  invoiceNumber?: string;
  checkoutNote?: string;
  createdAt: string;
  updatedAt: string;
}

// Review types
export interface Review {
  _id: string;
  user: string | User;
  hotel: string | Hotel;
  booking: string | Booking;
  rating: number;
  comment: string;
  images: string[];
  isApproved: boolean;
  createdAt: string;
  updatedAt: string;
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  pagination?: Pagination;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Auth types
export interface LoginCredentials {
  email?: string;
  phone?: string;
  identifier?: string;
  password: string;
}

export interface RegisterData {
  email?: string;
  password: string;
  fullName: string;
  phone?: string;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  data: User;
}

// Search params
export interface HotelSearchParams {
  search?: string;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  amenities?: string;
  sortBy?: 'price_asc' | 'price_desc' | 'rating' | 'popular';
  page?: number;
  limit?: number;
}

// Booking form
export interface BookingFormData {
  hotelId: string;
  roomId: string;
  checkIn: string;
  checkOut: string;
  guests: {
    adults: number;
    children: number;
  };
  contactInfo: {
    fullName: string;
    email: string;
    phone: string;
  };
  specialRequests?: string;
  services?: { serviceId: string; quantity: number }[];
  proofImage?: string;
}

export interface AdminBookingFormData extends BookingFormData {
  userId: string;
  status?: BookingStatus;
  paymentStatus?: PaymentStatus;
}

// Dashboard stats
export interface DashboardStats {
  users: number;
  hotels: number;
  rooms: number;
  bookings: {
    total: number;
    pending: number;
    confirmed: number;
    completed: number;
    cancelled: number;
  };
  revenue: number;
  reviews: number;
}

export interface RevenueData {
  month: number;
  revenue: number;
  count: number;
}

// Wallet types
export type TransactionType = 'deposit' | 'withdrawal' | 'payment' | 'refund' | 'bonus';
export type TransactionStatus = 'pending' | 'approved' | 'rejected' | 'completed';
export type DepositStatus = 'pending' | 'approved' | 'rejected';
export type WithdrawalStatus = 'pending' | 'pending_confirmation' | 'approved' | 'rejected' | 'completed';

export interface WalletBalance {
  walletBalance: number;
  bonusBalance: number;
  totalBalance: number;
  availableBalance: number;
  pendingPayments: number;
  pendingWithdrawalAmount: number;
}

export interface WalletTransaction {
  _id: string;
  user: string | User;
  type: TransactionType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  bonusBalanceBefore: number;
  bonusBalanceAfter: number;
  description: string;
  reference?: string;
  referenceModel?: 'Booking' | 'DepositRequest' | 'WithdrawalRequest';
  status: TransactionStatus;
  createdAt: string;
  updatedAt: string;
}

export interface DepositRequest {
  _id: string;
  user: string | User;
  amount: number;
  bonusAmount: number;
  proofImage: string;
  bankInfo: {
    bankName: string;
    accountNumber: string;
    accountName: string;
    transferContent: string;
  };
  status: DepositStatus;
  adminNote?: string;
  approvedBy?: string | User;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WithdrawalRequest {
  _id: string;
  user: string | User;
  amount: number;
  bankInfo: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
  status: WithdrawalStatus;
  adminNote?: string;
  processedBy?: string | User;
  processedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PromotionConfig {
  _id: string;
  hotel?: string | Hotel;
  room?: string | Room;
  name: string;
  description: string;
  depositAmount: number;
  bonusAmount: number;
  bonusPercent?: number;
  minDeposit?: number;
  maxBonus?: number;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

// Invoice types
export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  invoiceNumber: string;
  createdAt: string;
  hotel: Hotel;
  guest: {
    name: string;
    email: string;
    phone: string;
  };
  room: Room;
  checkIn: string;
  checkOut: string;
  actualCheckIn?: string;
  actualCheckOut?: string;
  nights: number;
  items: InvoiceItem[];
  subtotal: number;
  paidFromWallet: number;
  paidFromBonus: number;
  totalPaid: number;
  finalAmount: number;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
}
