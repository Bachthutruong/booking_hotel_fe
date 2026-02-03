import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { format, differenceInDays } from 'date-fns';
import { Loader2 } from 'lucide-react';

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
import type { Room, Service, BookingFormData } from '@/types';
import { toast } from '@/hooks/use-toast'; // Assuming this exists, or I'll use simple alert

interface BookingFormProps {
  hotelId: string;
  room: Room;
  onSuccess?: (bookingId: string) => void;
}

export function BookingForm({ hotelId, room, onSuccess }: BookingFormProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedServices, setSelectedServices] = useState<{ [key: string]: number }>({});
  
  const { register, handleSubmit, watch, formState: { errors } } = useForm<BookingFormData>({
    defaultValues: {
      guests: { adults: 1, children: 0 }
    }
  });

  const checkIn = watch('checkIn');
  const checkOut = watch('checkOut');

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await serviceService.getServices();
        if (response.success && response.data) {
          setServices(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch services');
      }
    };
    fetchServices();
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
      
      const formattedServices = Object.entries(selectedServices).map(([serviceId, quantity]) => ({
        serviceId,
        quantity
      }));

      const payload = {
        ...data,
        hotelId,
        roomId: room._id,
        services: formattedServices
      };

      const response = await bookingService.createBooking(payload);

      if (response.success && response.data) {
        if (onSuccess) {
            onSuccess(response.data._id);
        } else {
            // Default behavior: navigate to payment page
             navigate(`/booking/${response.data._id}/payment`);
        }
      }
    } catch (error: any) {
      console.error(error);
      // alert(error.response?.data?.message || 'Booking failed');
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
          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
              <Label htmlFor="adults">Người lớn</Label>
              <Input
                id="adults"
                type="number"
                min={1}
                max={room.capacity.adults}
                {...register('guests.adults', { required: true, min: 1 })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="children">Trẻ em</Label>
              <Input
                id="children"
                type="number"
                min={0}
                max={room.capacity.children}
                {...register('guests.children', { min: 0 })}
              />
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
                <div className="space-y-3">
                    {services.map((service) => (
                        <div key={service._id} className="flex items-center justify-between border p-3 rounded-lg">
                            <div className="flex items-center space-x-3">
                                <Checkbox 
                                    id={`service-${service._id}`} 
                                    onCheckedChange={(checked: boolean | 'indeterminate') => handleServiceToggle(service._id, checked as boolean)}
                                />
                                <div className="space-y-0.5">
                                    <Label htmlFor={`service-${service._id}`} className="text-base">{service.name}</Label>
                                    <p className="text-xs text-muted-foreground">{service.description}</p>
                                    <p className="text-sm font-medium text-primary">
                                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(service.price)}
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
                <span>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(total)}</span>
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
