import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import {
  Users,
  Building2,
  CalendarDays,
  DollarSign,
  TrendingUp,
  Star,
  BedDouble,
  Eye,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { dashboardService } from '@/services/dashboardService';
import { formatPrice, getStatusText, getStatusColor } from '@/lib/utils';
import type { Booking, Hotel, User } from '@/types';

export function DashboardPage() {
  const { data: statsData, isLoading: loadingStats } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: () => dashboardService.getStats(),
  });

  const { data: revenueData, isLoading: loadingRevenue } = useQuery({
    queryKey: ['dashboardRevenue'],
    queryFn: () => dashboardService.getRevenue(),
  });

  const { data: recentBookingsData, isLoading: loadingBookings } = useQuery({
    queryKey: ['recentBookings'],
    queryFn: () => dashboardService.getRecentBookings(5),
  });

  const { data: topHotelsData, isLoading: loadingTopHotels } = useQuery({
    queryKey: ['topHotels'],
    queryFn: () => dashboardService.getTopHotels(),
  });

  const stats = statsData?.data;
  const recentBookings = recentBookingsData?.data || [];
  const topHotels = topHotelsData?.data || [];

  const statCards = [
    {
      title: 'Tổng người dùng',
      value: stats?.users || 0,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Khách sạn',
      value: stats?.hotels || 0,
      icon: Building2,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Phòng',
      value: stats?.rooms || 0,
      icon: BedDouble,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Đơn đặt phòng',
      value: stats?.bookings?.total || 0,
      icon: CalendarDays,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
    {
      title: 'Doanh thu',
      value: formatPrice(stats?.revenue || 0),
      icon: DollarSign,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100',
      isPrice: true,
    },
    {
      title: 'Đánh giá',
      value: stats?.reviews || 0,
      icon: Star,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {loadingStats
          ? [...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="h-10 w-10 rounded-lg mb-3" />
                  <Skeleton className="h-6 w-20 mb-1" />
                  <Skeleton className="h-4 w-16" />
                </CardContent>
              </Card>
            ))
          : statCards.map((stat) => (
              <Card key={stat.title}>
                <CardContent className="p-4">
                  <div
                    className={`h-10 w-10 rounded-lg ${stat.bgColor} flex items-center justify-center mb-3`}
                  >
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <p className="text-2xl font-bold">
                    {stat.isPrice ? stat.value : stat.value.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                </CardContent>
              </Card>
            ))}
      </div>

      {/* Booking Stats */}
      {stats?.bookings && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Trạng thái đơn đặt phòng
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <p className="text-2xl font-bold text-yellow-600">
                  {stats.bookings.pending}
                </p>
                <p className="text-sm text-muted-foreground">Chờ xác nhận</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">
                  {stats.bookings.confirmed}
                </p>
                <p className="text-sm text-muted-foreground">Đã xác nhận</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">
                  {stats.bookings.completed}
                </p>
                <p className="text-sm text-muted-foreground">Hoàn thành</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <p className="text-2xl font-bold text-red-600">
                  {stats.bookings.cancelled}
                </p>
                <p className="text-sm text-muted-foreground">Đã hủy</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Bookings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Đơn đặt phòng gần đây</CardTitle>
            <Button variant="outline" size="sm" asChild>
              <Link to="/admin/bookings">Xem tất cả</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {loadingBookings ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16" />
                ))}
              </div>
            ) : recentBookings.length > 0 ? (
              <div className="space-y-4">
                {recentBookings.map((booking: Booking) => {
                  const user = booking.user as User;
                  const hotel = booking.hotel as Hotel;
                  return (
                    <div
                      key={booking._id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{user?.fullName}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {hotel?.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(booking.createdAt), 'dd/MM/yyyy HH:mm')}
                        </p>
                      </div>
                      <div className="text-right ml-4">
                        <Badge className={getStatusColor(booking.status)}>
                          {getStatusText(booking.status)}
                        </Badge>
                        <p className="text-sm font-medium mt-1">
                          {formatPrice(booking.totalPrice)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Chưa có đơn đặt phòng nào
              </p>
            )}
          </CardContent>
        </Card>

        {/* Top Hotels */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Khách sạn hàng đầu</CardTitle>
            <Button variant="outline" size="sm" asChild>
              <Link to="/admin/hotels">Xem tất cả</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {loadingTopHotels ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16" />
                ))}
              </div>
            ) : topHotels.length > 0 ? (
              <div className="space-y-4">
                {topHotels.map((hotel: Hotel & { totalBookings: number; totalRevenue: number }) => (
                  <div
                    key={hotel._id}
                    className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg"
                  >
                    <img
                      src={hotel.images?.[0] || 'https://via.placeholder.com/60'}
                      alt={hotel.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{hotel.name}</p>
                      <p className="text-sm text-muted-foreground">{hotel.city}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {hotel.totalBookings} đơn
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatPrice(hotel.totalRevenue)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Chưa có dữ liệu
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
