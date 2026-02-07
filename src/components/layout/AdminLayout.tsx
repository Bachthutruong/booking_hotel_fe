import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  LayoutDashboard,
  Building2,
  BedDouble,
  CalendarDays,
  Users,
  Star,
  Menu,
  X,
  LogOut,
  ChevronLeft,
  ConciergeBell,
  Settings,
  PlusCircle,
  Wallet,
  ArrowDownToLine,
  ArrowUpFromLine,
  Gift,
  Layers,
  Bell,
  CheckCheck,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/authService';
import { notificationService } from '@/services/notificationService';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Notification } from '@/types';

const sidebarItems = [
  {
    title: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    title: 'Khách sạn',
    href: '/admin/hotels',
    icon: Building2,
  },
  {
    title: 'Danh mục phòng',
    href: '/admin/categories',
    icon: Layers,
  },
  {
    title: 'Phòng',
    href: '/admin/rooms',
    icon: BedDouble,
  },
  {
    title: 'Đặt phòng',
    href: '/admin/bookings',
    icon: CalendarDays,
  },
  {
    title: 'Tạo đặt phòng',
    href: '/admin/bookings/create',
    icon: PlusCircle,
  },
  {
    title: 'Dịch vụ',
    href: '/admin/services',
    icon: ConciergeBell,
  },
  {
    title: 'Nạp tiền',
    href: '/admin/deposits',
    icon: ArrowDownToLine,
  },
  {
    title: 'Hoàn tiền',
    href: '/admin/withdrawals',
    icon: ArrowUpFromLine,
  },
  {
    title: 'Quản lý ví',
    href: '/admin/wallets',
    icon: Wallet,
  },
  {
    title: 'Khuyến mãi',
    href: '/admin/promotions',
    icon: Gift,
  },
  {
    title: 'Cấu hình',
    href: '/admin/config/payment',
    icon: Settings,
  },
  {
    title: 'Người dùng',
    href: '/admin/users',
    icon: Users,
  },
  {
    title: 'Đánh giá',
    href: '/admin/reviews',
    icon: Star,
  },
];

export function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, logout } = useAuthStore();

  const { data: notificationsData } = useQuery({
    queryKey: ['adminNotifications'],
    queryFn: () => notificationService.getNotifications({ limit: 30 }),
    refetchInterval: 60000,
  });
  const notifications = (notificationsData?.data || []) as Notification[];
  const unreadCount = (notificationsData as { unreadCount?: number })?.unreadCount ?? 0;

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationService.markAsRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminNotifications'] }),
  });
  const markAllReadMutation = useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminNotifications'] }),
  });

  const handleLogout = async () => {
    try {
      await authService.logout();
      logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      logout();
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-orange-50/30 via-white to-rose-50/20 relative overflow-hidden">
      {/* Animated Background Elements for Admin - Warm */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50/30 via-white to-rose-50/20" />
        <div className="absolute top-[5%] right-[10%] w-[400px] h-[400px] rounded-full bg-gradient-to-r from-orange-100/30 to-amber-100/25 blur-[100px] animate-float-slow" />
        <div className="absolute bottom-[20%] left-[5%] w-[300px] h-[300px] rounded-full bg-gradient-to-r from-rose-100/20 to-pink-100/15 blur-[80px] animate-float-medium" />
        <div className="absolute top-[50%] left-[30%] w-[250px] h-[250px] rounded-full bg-gradient-to-r from-amber-100/20 to-yellow-100/15 blur-[70px] animate-float-reverse" />
      </div>
      
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-72 bg-white border-r transform transition-transform duration-200 ease-in-out lg:relative lg:transform-none shadow-sm lg:shadow-none',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center h-20 px-6 border-b">
            <Link to="/admin" className="flex items-center gap-2">
              <div className="bg-primary/10 p-2 rounded-xl">
                 <Building2 className="h-6 w-6 text-primary" />
              </div>
              <span className="text-xl font-bold tracking-tight">Admin<span className="text-primary">Panel</span></span>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden ml-auto rounded-full"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 py-6 px-4">
            <nav className="space-y-1">
              {sidebarItems.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-full text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    <item.icon className={cn("h-5 w-5", isActive ? "text-primary" : "text-muted-foreground")} />
                    {item.title}
                  </Link>
                );
              })}
            </nav>
          </ScrollArea>

          {/* User info & Logout */}
          <div className="p-4 border-t bg-gray-50/50 m-2 rounded-2xl">
            <div className="flex items-center gap-3 mb-4">
              <Avatar className="h-10 w-10 border border-white shadow-sm">
                  <AvatarImage src={user?.avatar} />
                  <AvatarFallback className="bg-primary text-white">
                      {user?.fullName?.charAt(0).toUpperCase()}
                  </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{user?.fullName}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start rounded-full border-none shadow-none hover:bg-white"
                asChild
              >
                <Link to="/hotels">
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Về trang khách sạn
                </Link>
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Đăng xuất
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex items-center h-16 px-4 bg-white/80 backdrop-blur border-b lg:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden rounded-full mr-2"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold text-foreground">
            {sidebarItems.find((item) => item.href === location.pathname)?.title || 'Admin Dashboard'}
          </h1>
          <div className="ml-auto flex items-center gap-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative rounded-full">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-red-500 text-[10px] font-medium text-white flex items-center justify-center">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 max-h-[70vh] overflow-hidden flex flex-col">
                  <div className="flex items-center justify-between px-3 py-2 border-b">
                    <span className="font-semibold text-sm">Thông báo</span>
                    {unreadCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs h-7"
                        onClick={() => markAllReadMutation.mutate()}
                        disabled={markAllReadMutation.isPending}
                      >
                        {markAllReadMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCheck className="h-3 w-3 mr-1" />}
                        Đã đọc tất cả
                      </Button>
                    )}
                  </div>
                  <ScrollArea className="flex-1">
                    {notifications.length === 0 ? (
                      <p className="p-4 text-sm text-muted-foreground text-center">Chưa có thông báo</p>
                    ) : (
                      <div className="p-2">
                        {notifications.map((n) => (
                          <DropdownMenuItem
                            key={n._id}
                            className={cn(
                              'flex flex-col items-start gap-0.5 p-3 cursor-pointer rounded-md',
                              !n.read && 'bg-primary/5'
                            )}
                            onSelect={(e) => {
                              e.preventDefault();
                              if (!n.read) markReadMutation.mutate(n._id);
                              if (n.referenceId && n.referenceType === 'Booking') {
                                navigate(`/admin/bookings?open=${n.referenceId}`);
                              }
                            }}
                          >
                            <span className="font-medium text-sm">{n.title}</span>
                            <span className="text-xs text-muted-foreground line-clamp-2">{n.message}</span>
                            <span className="text-[10px] text-muted-foreground mt-0.5">
                              {new Date(n.createdAt).toLocaleString('vi-VN')}
                            </span>
                          </DropdownMenuItem>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </DropdownMenuContent>
              </DropdownMenu>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-8 overflow-auto">
           <div className="max-w-7xl mx-auto">
             <Outlet />
           </div>
        </main>
      </div>
    </div>
  );
}