import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { differenceInDays } from 'date-fns';
import { Loader2, AlertCircle, Users } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';

import { Badge } from '@/components/ui/badge';
import { bookingService } from '@/services/bookingService';
import { serviceService } from '@/services/serviceService';
import { serviceCategoryService } from '@/services/serviceCategoryService';
import { useAuthStore } from '@/store/authStore';
import { formatPrice } from '@/lib/utils';
import type { Room, Service, ServiceCategory, BookingFormData } from '@/types';

interface BookingFormProps {
  hotelId: string;
  room: Room;
  initialCheckIn?: string;
  initialCheckOut?: string;
  onSuccess?: (bookingId: string) => void;
}

export function BookingForm({ hotelId, room, initialCheckIn, initialCheckOut, onSuccess }: BookingFormProps) {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedServices, setSelectedServices] = useState<{ [key: string]: number }>({});

  const { register, handleSubmit, watch, formState: { errors } } = useForm<BookingFormData>({
    defaultValues: {
      checkIn: initialCheckIn || '',
      checkOut: initialCheckOut || '',
      guests: { adults: 1, children: 0 },
      contactInfo: {
        fullName: user?.fullName || '',
        email: user?.email || '',
        phone: user?.phone || '',
      }
    }
  });

  const checkIn = watch('checkIn');
  const checkOut = watch('checkOut');

  useEffect(() => {
    const fetch = async () => {
      try {
        const [servicesRes, categoriesRes] = await Promise.all([
          serviceService.getServices(),
          serviceCategoryService.getServiceCategories(),
        ]);
        if (servicesRes.success && servicesRes.data) setServices(servicesRes.data);
        if (categoriesRes.success && categoriesRes.data) setCategories(categoriesRes.data);
      } catch (error) {
        console.error('Failed to fetch services/categories');
      }
    };
    fetch();
  }, []);

  const handleServiceToggle = (serviceId: string, checked: boolean) => {
    setSelectedServices(prev => {
      const newServices = { ...prev };
      if (checked) {
        newServices[serviceId] = 1;
      } else {
        delete newServices[serviceId];
      }
      return newServices;
    });
  };

  const handleServiceQuantityChange = (serviceId: string, quantity: number) => {
    if (quantity < 1) return;
    setSelectedServices(prev => ({
      ...prev,
      [serviceId]: quantity
    }));
  };

  const calculateTotal = () => {
    if (!checkIn || !checkOut) return 0;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    if (start >= end) return 0;
    
    const nights = differenceInDays(end, start);
    let total = room.price * nights;

    Object.entries(selectedServices).forEach(([serviceId, quantity]) => {
      const service = services.find(s => s._id === serviceId);
      if (service) {
        total += service.price * quantity;
      }
    });

    return total;
  };

  const onSubmit = async (data: BookingFormData) => {
    try {
      setLoading(true);
      setSubmitError('');

      const formattedServices = Object.entries(selectedServices).map(([serviceId, quantity]) => ({
        serviceId,
        quantity
      }));

      const payload = {
        checkIn: data.checkIn,
        checkOut: data.checkOut,
        guests: data.guests ?? { adults: 1, children: 0 },
        contactInfo: {
          fullName: data.contactInfo?.fullName ?? '',
          email: data.contactInfo?.email ?? '',
          phone: data.contactInfo?.phone ?? '',
        },
        specialRequests: data.specialRequests ?? '',
        hotelId,
        roomId: room._id,
        services: formattedServices
      };

      const response = await bookingService.createBooking(payload) as {
        success: boolean;
        data?: { _id: string };
        token?: string;
        user?: { _id: string; email: string; fullName: string; phone: string; avatar?: string; role: string };
      };

      if (response.success && response.data) {
        const { login: authLogin } = useAuthStore.getState();
        if (response.token && response.user) {
          authLogin(response.user as any, response.token);
          // Đợi token ghi xong vào localStorage trước khi chuyển trang, tránh GET /bookings/:id gửi đi không kèm token → 401
          await new Promise((r) => setTimeout(r, 100));
        }
        if (onSuccess) {
          onSuccess(response.data._id);
        } else {
          navigate(`/booking/${response.data._id}/payment`, {
            state: { booking: response.data },
          });
        }
      } else {
        setSubmitError('Đặt phòng thất bại. Vui lòng thử lại.');
      }
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Đặt phòng thất bại. Vui lòng thử lại.';
      setSubmitError(message);
      console.error('Booking error:', error.response?.data ?? error);
    } finally {
      setLoading(false);
    }
  };

  const total = calculateTotal();

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Đặt phòng: {room.name}</CardTitle>
        <CardDescription>Vui lòng điền thông tin chi tiết</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-6">
          {submitError && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {submitError}
            </div>
          )}
          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="checkIn">Ngày nhận phòng</Label>
              <Input
                id="checkIn"
                type="date"
                min={new Date().toISOString().split('T')[0]}
                {...register('checkIn', { required: true })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="checkOut">Ngày trả phòng</Label>
              <Input
                id="checkOut"
                type="date"
                min={checkIn || new Date().toISOString().split('T')[0]}
                {...register('checkOut', { required: true })}
              />
            </div>
          </div>

          {/* Guests */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>Sức chứa tối đa: {room.capacity.adults} người lớn, {room.capacity.children} trẻ em</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="adults">Người lớn *</Label>
                <Input
                  id="adults"
                  type="number"
                  min={1}
                  max={room.capacity.adults}
                  {...register('guests.adults', {
                    required: 'Vui lòng nhập số người lớn',
                    min: { value: 1, message: 'Tối thiểu 1 người lớn' },
                    max: { value: room.capacity.adults, message: `Tối đa ${room.capacity.adults} người lớn` }
                  })}
                />
                {errors.guests?.adults && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.guests.adults.message}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">Tối đa: {room.capacity.adults}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="children">Trẻ em</Label>
                <Input
                  id="children"
                  type="number"
                  min={0}
                  max={room.capacity.children}
                  {...register('guests.children', {
                    min: { value: 0, message: 'Số trẻ em không hợp lệ' },
                    max: { value: room.capacity.children, message: `Tối đa ${room.capacity.children} trẻ em` }
                  })}
                />
                {errors.guests?.children && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.guests.children.message}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">Tối đa: {room.capacity.children}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="font-semibold">Thông tin liên hệ</h3>
            <div className="space-y-2">
              <Label htmlFor="fullName">Họ tên</Label>
              <Input id="fullName" {...register('contactInfo.fullName', { required: true })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...register('contactInfo.email', { required: true })} />
                </div>
                <div className="space-y-2">
                <Label htmlFor="phone">Số điện thoại</Label>
                <Input id="phone" {...register('contactInfo.phone', { required: true })} />
                </div>
            </div>
          </div>

          <Separator />

          {/* Services */}
          <div className="space-y-4">
            <h3 className="font-semibold">Dịch vụ đi kèm</h3>
            {services.length === 0 ? (
              <p className="text-sm text-gray-500">Không có dịch vụ đi kèm nào.</p>
            ) : (
              <>
                {categories.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    <Badge
                      variant={selectedCategoryId === null ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => setSelectedCategoryId(null)}
                    >
                      Tất cả
                    </Badge>
                    {categories.map((cat) => (
                      <Badge
                        key={cat._id}
                        variant={selectedCategoryId === cat._id ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => setSelectedCategoryId(selectedCategoryId === cat._id ? null : cat._id)}
                      >
                        {cat.name}
                      </Badge>
                    ))}
                  </div>
                )}
                <div className="space-y-3">
                  {services
                    .filter((s) => {
                      const catId = typeof s.category === 'string' ? s.category : (s.category as ServiceCategory)?._id;
                      if (!selectedCategoryId) return true;
                      return catId === selectedCategoryId;
                    })
                    .map((service) => (
                      <div key={service._id} className="flex items-center justify-between border p-3 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            id={`service-${service._id}`}
                            onCheckedChange={(checked: boolean | 'indeterminate') => handleServiceToggle(service._id, checked as boolean)}
                          />
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Label htmlFor={`service-${service._id}`} className="text-base">{service.name}</Label>
                              {typeof service.category === 'object' && service.category && (
                                <Badge variant="secondary" className="text-xs">
                                  {(service.category as ServiceCategory).name}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">{service.description}</p>
                            <p className="text-sm font-medium text-primary">
                              {formatPrice(service.price)}
                            </p>
                          </div>
                        </div>
                        {selectedServices[service._id] && (
                          <div className="flex items-center gap-2">
                            <Label className="text-xs">SL:</Label>
                            <Input
                              type="number"
                              className="w-16 h-8"
                              min={1}
                              value={selectedServices[service._id]}
                              onChange={(e) => handleServiceQuantityChange(service._id, parseInt(e.target.value))}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </>
            )}
          </div>
          
           <div className="space-y-2">
              <Label htmlFor="specialRequests">Yêu cầu đặc biệt</Label>
              <Textarea id="specialRequests" {...register('specialRequests')} />
            </div>

        </CardContent>
        <CardFooter className="flex-col gap-4">
            <div className="w-full flex justify-between items-center text-lg font-bold">
                <span>Tổng cộng (tạm tính):</span>
                <span>{formatPrice(total)}</span>
            </div>
            <Button type="submit" className="w-full" disabled={loading || total === 0}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Đặt phòng ngay
            </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
