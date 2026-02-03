import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QrCode, Check, AlertCircle, Plus, Minus, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { serviceService } from '@/services/serviceService';
import { bookingService } from '@/services/bookingService';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/store/authStore';
import type { Service, Booking } from '@/types';

const formatCurrency = (amount: number) => amount.toLocaleString('vi-VN') + 'đ';

export default function ScanServicePage() {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuthStore();
  const [quantity, setQuantity] = useState(1);
  const [selectedBookingId, setSelectedBookingId] = useState('');

  // Fetch service details
  const { data: serviceData, isLoading: serviceLoading, error: serviceError } = useQuery({
    queryKey: ['serviceByQR', serviceId],
    queryFn: async () => {
      const response = await serviceService.getServices();
      const service = response.data?.find((s: Service) => s._id === serviceId);
      if (!service) throw new Error('Service not found');
      return service;
    },
    enabled: !!serviceId,
  });

  // Fetch user's active bookings (checked in)
  const { data: bookingsData, isLoading: bookingsLoading } = useQuery({
    queryKey: ['myActiveBookings'],
    queryFn: () => bookingService.getBookings({ status: 'confirmed' }),
    enabled: isAuthenticated,
  });

  const addServiceMutation = useMutation({
    mutationFn: ({ bookingId, serviceId, quantity }: { bookingId: string; serviceId: string; quantity: number }) =>
      bookingService.addService(bookingId, serviceId, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myActiveBookings'] });
      toast({
        title: 'Thành công',
        description: 'Đã thêm dịch vụ vào phòng của bạn',
      });
      navigate('/my-bookings');
    },
    onError: (error: any) => {
      toast({
        title: 'Lỗi',
        description: error?.response?.data?.message || 'Không thể thêm dịch vụ',
        variant: 'destructive',
      });
    },
  });

  const service = serviceData as Service | undefined;
  const activeBookings = (bookingsData?.data || []).filter(
    (b: Booking) => b.status === 'confirmed' && b.actualCheckIn
  );

  const handleAddService = () => {
    if (!selectedBookingId) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng chọn phòng để thêm dịch vụ',
        variant: 'destructive',
      });
      return;
    }

    addServiceMutation.mutate({
      bookingId: selectedBookingId,
      serviceId: serviceId!,
      quantity,
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6">
            <AlertCircle className="h-16 w-16 mx-auto text-amber-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Vui lòng đăng nhập</h2>
            <p className="text-muted-foreground mb-4">
              Bạn cần đăng nhập để thêm dịch vụ vào phòng
            </p>
            <Button onClick={() => navigate('/auth/login')}>Đăng nhập</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (serviceLoading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded-2xl max-w-md mx-auto" />
        </div>
      </div>
    );
  }

  if (serviceError || !service) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6">
            <AlertCircle className="h-16 w-16 mx-auto text-red-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Không tìm thấy dịch vụ</h2>
            <p className="text-muted-foreground mb-4">
              Dịch vụ này không tồn tại hoặc không khả dụng
            </p>
            <Button onClick={() => navigate('/')}>Về trang chủ</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-lg">
      <Button
        variant="ghost"
        className="mb-4"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="h-4 w-4 mr-2" /> Quay lại
      </Button>

      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto p-4 bg-primary/10 rounded-2xl w-fit mb-4">
            <QrCode className="h-12 w-12 text-primary" />
          </div>
          <CardTitle>Thêm dịch vụ</CardTitle>
          <CardDescription>
            Quét mã QR thành công! Xác nhận để thêm dịch vụ vào phòng của bạn
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Service Info */}
          <div className="p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-3 mb-3">
              {service.icon && <span className="text-2xl">{service.icon}</span>}
              <div>
                <h3 className="font-semibold text-lg">{service.name}</h3>
                <p className="text-sm text-muted-foreground">{service.description}</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Giá:</span>
              <span className="font-bold text-lg text-primary">{formatCurrency(service.price)}</span>
            </div>
          </div>

          {/* Select Booking */}
          <div>
            <Label>Chọn phòng đang thuê</Label>
            {bookingsLoading ? (
              <div className="text-center py-4 text-muted-foreground">Đang tải...</div>
            ) : activeBookings.length === 0 ? (
              <div className="p-4 bg-amber-50 rounded-xl text-amber-700 text-sm mt-2">
                <AlertCircle className="h-4 w-4 inline mr-2" />
                Bạn chưa có phòng nào đang thuê (đã check-in). Chỉ có thể thêm dịch vụ vào phòng đã check-in.
              </div>
            ) : (
              <Select value={selectedBookingId} onValueChange={setSelectedBookingId}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Chọn phòng..." />
                </SelectTrigger>
                <SelectContent>
                  {activeBookings.map((booking: Booking) => {
                    const room = booking.room as any;
                    const hotel = booking.hotel as any;
                    return (
                      <SelectItem key={booking._id} value={booking._id}>
                        {room?.name} - {hotel?.name}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Quantity */}
          <div>
            <Label>Số lượng</Label>
            <div className="flex items-center gap-3 mt-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-20 text-center"
                min={1}
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity(quantity + 1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Total */}
          <div className="p-4 bg-primary/5 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="font-medium">Tổng cộng:</span>
              <span className="font-bold text-xl text-primary">
                {formatCurrency(service.price * quantity)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Sẽ được cộng vào hóa đơn khi trả phòng
            </p>
          </div>

          {/* Submit Button */}
          <Button
            className="w-full"
            size="lg"
            onClick={handleAddService}
            disabled={!selectedBookingId || addServiceMutation.isPending}
          >
            {addServiceMutation.isPending ? (
              'Đang xử lý...'
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" /> Xác nhận thêm dịch vụ
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
