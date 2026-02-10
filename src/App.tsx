import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore, rehydratedPromise } from '@/store/authStore';

/** Chỉ admin mới vào được; nhân viên (staff) redirect về /admin */
function AdminOnlyRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const location = useLocation();
  if (user?.role !== 'admin') {
    return <Navigate to="/admin" replace state={{ from: location.pathname }} />;
  }
  return <>{children}</>;
}
import { authService } from '@/services/authService';
import { Toaster } from '@/components/ui/toaster';

// Layouts
import { MainLayout } from '@/components/layout/MainLayout';
import { AdminLayout } from '@/components/layout/AdminLayout';

// Pages - Public
import { HotelsPage } from '@/pages/public/HotelsPage';
import { HotelDetailPage } from '@/pages/public/HotelDetailPage';

// Pages - Auth
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';

// Pages - Admin
import { DashboardPage } from '@/pages/admin/DashboardPage';
import { BookingsManagePage } from '@/pages/admin/BookingsManagePage';
import { HotelsManagePage } from '@/pages/admin/HotelsManagePage';

// Pages - User
import { ProfilePage } from '@/pages/user/ProfilePage';
import { BookingsPage } from '@/pages/user/BookingsPage';
import BookingDetailPage from '@/pages/user/BookingDetailPage';
import BookingPaymentPage from '@/pages/user/BookingPaymentPage';
import WalletPage from '@/pages/WalletPage';
import ScanServicePage from '@/pages/ScanServicePage';
import WithdrawalConfirmPage from '@/pages/user/WithdrawalConfirmPage';

// Pages - Booking
import { BookingPage } from '@/pages/booking/BookingPage';
import { BookingConfirmPage } from '@/pages/booking/BookingConfirmPage';

// Admin Pages
import ServicesManagePage from '@/pages/admin/ServicesManagePage';
import PaymentConfigPage from '@/pages/admin/PaymentConfigPage';
import CreateBookingPage from '@/pages/admin/CreateBookingPage';
import UsersManagePage from '@/pages/admin/UsersManagePage';
import RoomsManagePage from '@/pages/admin/RoomsManagePage';
import ReviewsManagePage from '@/pages/admin/ReviewsManagePage';
import WalletsManagePage from '@/pages/admin/WalletsManagePage';
import PromotionsManagePage from '@/pages/admin/PromotionsManagePage';
import CategoriesManagePage from '@/pages/admin/CategoriesManagePage';
import SpecialPriceManagePage from '@/pages/admin/SpecialPriceManagePage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function AppContent() {
  const { token, setUser, setLoading } = useAuthStore();
  const [hydrated, setHydrated] = useState(false);

  // Đợi persist rehydrate xong (đặc biệt quan trọng với ẩn danh/reload) rồi mới initAuth
  useEffect(() => {
    rehydratedPromise.then(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    const initAuth = async () => {
      const currentToken = useAuthStore.getState().token ?? token;
      if (currentToken) {
        try {
          const response = await authService.getMe();
          if (response.data) {
            setUser(response.data);
          }
        } catch (error: unknown) {
          console.error('Failed to fetch user:', error);
          const status = (error as { response?: { status?: number } })?.response?.status;
          if (status === 401) {
            useAuthStore.getState().logout();
          }
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    initAuth();
  }, [hydrated, token, setUser, setLoading]);

  return (
    <Routes>
      {/* Public Routes - mặc định vào /hotels (không dùng trang chủ) */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<Navigate to="/hotels" replace />} />
        <Route path="/hotels" element={<HotelsPage />} />
        <Route path="/hotels/:id" element={<HotelDetailPage />} />
        
        {/* Booking Routes - route có path cụ thể (confirm, payment) phải đặt TRƯỚC :hotelId/:roomId để /booking/<id>/payment không bị match nhầm */}
        <Route path="/booking/:id/confirm" element={<BookingConfirmPage />} />
        <Route path="/booking/:id/payment" element={<BookingPaymentPage />} />
        <Route path="/booking/:hotelId" element={<BookingPage />} />
        <Route path="/booking/:hotelId/:roomId" element={<BookingPage />} />
        
        {/* Protected User Routes */}
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/my-bookings" element={<BookingsPage />} />
        <Route path="/my-bookings/:id" element={<BookingDetailPage />} />
        <Route path="/wallet" element={<WalletPage />} />
        <Route path="/scan-service/:serviceId" element={<ScanServicePage />} />
        <Route path="/withdraw/confirm/:token" element={<WithdrawalConfirmPage />} />
      </Route>

      {/* Auth Routes */}
      <Route path="/auth/login" element={<LoginPage />} />
      <Route path="/auth/register" element={<RegisterPage />} />
      <Route path="/login" element={<Navigate to="/auth/login" replace />} />

      {/* Admin Routes */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="hotels" element={<HotelsManagePage />} />
        <Route path="bookings" element={<BookingsManagePage />} />
        <Route path="bookings/create" element={<CreateBookingPage />} />
        <Route path="services" element={<ServicesManagePage />} />
        <Route path="config/payment" element={<PaymentConfigPage />} />
        
        {/* Full Implementation Routes */}
        <Route path="rooms" element={<RoomsManagePage />} />
        <Route path="reviews" element={<ReviewsManagePage />} />

        {/* Chỉ admin: Người dùng, Quản lý ví (gộp nạp tiền + hoàn tiền + danh sách ví) */}
        <Route path="users" element={<AdminOnlyRoute><UsersManagePage /></AdminOnlyRoute>} />
        <Route path="wallets" element={<AdminOnlyRoute><WalletsManagePage /></AdminOnlyRoute>} />
        <Route path="promotions" element={<PromotionsManagePage />} />
        <Route path="special-prices" element={<SpecialPriceManagePage />} />
        <Route path="categories" element={<CategoriesManagePage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/hotels" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppContent />
        <Toaster />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;