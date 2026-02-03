import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

import { userService } from '@/services/userService';
import { hotelService } from '@/services/hotelService';
import { serviceService } from '@/services/serviceService';
import { bookingService } from '@/services/bookingService';
import type { User, Hotel, Room, Service, AdminBookingFormData } from '@/types';

export default function CreateBookingPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedServices, setSelectedServices] = useState<{ [key: string]: number }>({});

  const { register, handleSubmit, control, watch, setValue } = useForm<AdminBookingFormData>({
    defaultValues: {
      guests: { adults: 1, children: 0 },
      status: 'confirmed',
      paymentStatus: 'paid'
    }
  });

  const selectedHotelId = watch('hotelId');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, hotelsRes, servicesRes] = await Promise.all([
          userService.getUsers({ limit: 100 }), // Limit for MVP
          hotelService.getHotels({ limit: 100 }),
          serviceService.getAdminServices()
        ]);
        if (usersRes.success && usersRes.data) setUsers(usersRes.data);
        if (hotelsRes.success && hotelsRes.data) setHotels(hotelsRes.data);
        if (servicesRes.success && servicesRes.data) setServices(servicesRes.data);
      } catch (error) {
        console.error('Failed to fetch initial data');
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedHotelId) {
      const fetchRooms = async () => {
        try {
          const res = await hotelService.getRooms(selectedHotelId, { limit: 100 });
          if (res.success && res.data) setRooms(res.data);
        } catch (error) {
            console.error('Failed to fetch rooms');
        }
      };
      fetchRooms();
    } else {
        setRooms([]);
    }
  }, [selectedHotelId]);

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

  const onSubmit = async (data: AdminBookingFormData) => {
    try {
      setLoading(true);
      const formattedServices = Object.entries(selectedServices).map(([serviceId, quantity]) => ({
        serviceId,
        quantity
      }));

      const payload = {
        ...data,
        services: formattedServices
      };

      const res = await bookingService.createAdminBooking(payload);
      if (res.success) {
        navigate('/admin/bookings');
      }
    } catch (error) {
      console.error('Booking failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold tracking-tight">Tạo đặt phòng mới (Admin)</h2>
      
      <Card>
        <CardHeader>
           <CardTitle>Thông tin đặt phòng</CardTitle>
        </CardHeader>
        <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                
                {/* User Select */}
                <div className="space-y-2">
                    <Label>Khách hàng</Label>
                    <Controller
                        name="userId"
                        control={control}
                        rules={{ required: true }}
                        render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Chọn khách hàng" />
                                </SelectTrigger>
                                <SelectContent>
                                    {users.map(u => (
                                        <SelectItem key={u._id} value={u._id}>{u.fullName} ({u.email})</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    />
                </div>

                {/* Hotel Select */}
                <div className="space-y-2">
                    <Label>Khách sạn</Label>
                    <Controller
                        name="hotelId"
                        control={control}
                        rules={{ required: true }}
                        render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Chọn khách sạn" />
                                </SelectTrigger>
                                <SelectContent>
                                    {hotels.map(h => (
                                        <SelectItem key={h._id} value={h._id}>{h.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    />
                </div>

                {/* Room Select */}
                <div className="space-y-2">
                    <Label>Phòng</Label>
                    <Controller
                        name="roomId"
                        control={control}
                        rules={{ required: true }}
                        render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value} disabled={!selectedHotelId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Chọn phòng" />
                                </SelectTrigger>
                                <SelectContent>
                                    {rooms.map(r => (
                                        <SelectItem key={r._id} value={r._id}>{r.name} - {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(r.price)}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    />
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Check In</Label>
                        <Input type="date" {...register('checkIn', { required: true })} />
                    </div>
                    <div className="space-y-2">
                        <Label>Check Out</Label>
                        <Input type="date" {...register('checkOut', { required: true })} />
                    </div>
                </div>

                {/* Guests */}
                <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <Label>Người lớn</Label>
                        <Input type="number" min={1} {...register('guests.adults', { required: true, min: 1 })} />
                     </div>
                     <div className="space-y-2">
                        <Label>Trẻ em</Label>
                        <Input type="number" min={0} {...register('guests.children')} />
                     </div>
                </div>

                 {/* Contact Info (Prefilled usually but customizable) */}
                <div className="space-y-4 border p-4 rounded-md">
                    <h4 className="font-medium">Thông tin liên hệ (trên vé)</h4>
                    <div className="space-y-2">
                        <Label>Họ tên</Label>
                        <Input {...register('contactInfo.fullName', { required: true })} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input {...register('contactInfo.email', { required: true })} />
                        </div>
                         <div className="space-y-2">
                            <Label>SĐT</Label>
                            <Input {...register('contactInfo.phone', { required: true })} />
                        </div>
                    </div>
                </div>

                {/* Services */}
                <div className="space-y-2">
                    <Label>Dịch vụ</Label>
                    <div className="grid gap-2 border p-4 rounded-md">
                        {services.map(s => (
                             <div key={s._id} className="flex items-center space-x-2">
                                <Checkbox 
                                    id={`s-${s._id}`} 
                                    onCheckedChange={(c: boolean | 'indeterminate') => handleServiceToggle(s._id, c as boolean)} 
                                />
                                <Label htmlFor={`s-${s._id}`}>{s.name} ({new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(s.price)})</Label>
                             </div>
                        ))}
                    </div>
                </div>

                {/* Status */}
                <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <Label>Trạng thái</Label>
                         <Controller
                            name="status"
                            control={control}
                            render={({ field }) => (
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="confirmed">Đã xác nhận</SelectItem>
                                        <SelectItem value="pending">Chờ xử lý</SelectItem>
                                        <SelectItem value="completed">Hoàn thành</SelectItem>
                                        <SelectItem value="cancelled">Đã hủy</SelectItem>
                                    </SelectContent>
                                </Select>
                            )}
                        />
                     </div>
                     <div className="space-y-2">
                        <Label>Thanh toán</Label>
                         <Controller
                            name="paymentStatus"
                            control={control}
                            render={({ field }) => (
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="paid">Đã thanh toán</SelectItem>
                                        <SelectItem value="pending">Chưa thanh toán</SelectItem>
                                    </SelectContent>
                                </Select>
                            )}
                        />
                     </div>
                </div>
                
                <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Tạo đặt phòng
                </Button>

            </form>
        </CardContent>
      </Card>
    </div>
  );
}
