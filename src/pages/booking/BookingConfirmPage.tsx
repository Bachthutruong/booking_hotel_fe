import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  CheckCircle,
  CreditCard,
  Calendar,
  MapPin,
  Users,
  Loader2,
  Home,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { bookingService } from '@/services/bookingService';
import { formatPrice, getStatusText, getStatusColor, getRoomTypeText } from '@/lib/utils';
import type { Hotel, Room } from '@/types';

export function BookingConfirmPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['booking', id],
    queryFn: () => bookingService.getBooking(id!),
    enabled: !!id,
  });

  const paymentMutation = useMutation({
    mutationFn: () => bookingService.processPayment(id!),
    onSuccess: () => {
      setPaymentSuccess(true);
      refetch();
    },
  });

  const booking = data?.data;
  const hotel = booking?.hotel as Hotel;
  const room = booking?.room as Room;

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-64 mb-6" />
        <div className="max-w-2xl mx-auto">
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Không tìm thấy đơn đặt phòng</h1>
        <Button asChild>
          <Link to="/">Về trang chủ</Link>
        </Button>
      </div>
    );
  }

  if (paymentSuccess || booking.paymentStatus === 'paid') {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-6">
            <CheckCircle className="h-20 w-20 text-green-500 mx-auto" />
          </div>
          <h1 className="text-3xl font-bold mb-4">Đặt phòng thành công!</h1>
          <p className="text-muted-foreground mb-8">
            Cảm ơn bạn đã đặt phòng. Chúng tôi đã gửi email xác nhận đến{' '}
            <strong>{booking.contactInfo.email}</strong>
          </p>

          <Card className="text-left mb-8">
            <CardHeader>
              <CardTitle>Chi tiết đặt phòng</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <img
                  src={hotel?.images?.[0] || 'https://via.placeholder.com/100'}
                  alt={hotel?.name}
                  className="w-24 h-24 rounded-lg object-cover"
                />
                <div>
                  <h3 className="font-semibold text-lg">{hotel?.name}</h3>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {hotel?.city}
                  </p>
                  <p className="text-sm mt-1">{room?.name}</p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Mã đặt phòng</p>
                  <p className="font-medium">{booking._id.slice(-8).toUpperCase()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Trạng thái</p>
                  <Badge className={getStatusColor(booking.status)}>
                    {getStatusText(booking.status)}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Nhận phòng</p>
                  <p className="font-medium">{format(new Date(booking.checkIn), 'dd/MM/yyyy')}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Trả phòng</p>
                  <p className="font-medium">{format(new Date(booking.checkOut), 'dd/MM/yyyy')}</p>
                </div>
              </div>

              <Separator />

              <div className="flex justify-between font-semibold">
                <span>Tổng thanh toán</span>
                <span className="text-primary">{formatPrice(booking.totalPrice)}</span>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild variant="outline">
              <Link to="/bookings">
                <Calendar className="mr-2 h-4 w-4" />
                Xem đơn đặt phòng
              </Link>
            </Button>
            <Button asChild>
              <Link to="/">
                <Home className="mr-2 h-4 w-4" />
                Về trang chủ
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Xác nhận thanh toán</h1>

      <div className="max-w-2xl mx-auto">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Thông tin đặt phòng</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <img
                src={hotel?.images?.[0] || 'https://via.placeholder.com/100'}
                alt={hotel?.name}
                className="w-24 h-24 rounded-lg object-cover"
              />
              <div>
                <h3 className="font-semibold text-lg">{hotel?.name}</h3>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {hotel?.city}
                </p>
                <p className="text-sm mt-1">
                  {room?.name} - {getRoomTypeText(room?.type || 'standard')}
                </p>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">Nhận phòng</p>
                  <p className="font-medium">{format(new Date(booking.checkIn), 'dd/MM/yyyy')}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">Trả phòng</p>
                  <p className="font-medium">{format(new Date(booking.checkOut), 'dd/MM/yyyy')}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">Số khách</p>
                  <p className="font-medium">
                    {booking.guests.adults} người lớn
                    {booking.guests.children > 0 ? `, ${booking.guests.children} trẻ em` : ''}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            <div className="flex justify-between text-lg font-semibold">
              <span>Tổng thanh toán</span>
              <span className="text-primary">{formatPrice(booking.totalPrice)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Mock Payment */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Thanh toán (Giả lập)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Đây là thanh toán giả lập. Trong môi trường thực tế, bạn sẽ được
              chuyển đến cổng thanh toán an toàn.
            </p>

            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-2">Thông tin thẻ (giả lập)</p>
              <p className="text-sm text-muted-foreground">
                Số thẻ: **** **** **** 4242
              </p>
              <p className="text-sm text-muted-foreground">Hạn: 12/25</p>
            </div>

            <Button
              className="w-full"
              size="lg"
              onClick={() => paymentMutation.mutate()}
              disabled={paymentMutation.isPending}
            >
              {paymentMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  Thanh toán {formatPrice(booking.totalPrice)}
                </>
              )}
            </Button>

            {paymentMutation.isError && (
              <p className="text-sm text-red-500 text-center">
                Thanh toán thất bại. Vui lòng thử lại.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
