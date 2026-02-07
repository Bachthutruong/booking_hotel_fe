import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Loader2, UserPlus, Users } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Combobox, type ComboboxItem } from '@/components/ui/combobox';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

import { userService } from '@/services/userService';
import { hotelService } from '@/services/hotelService';
import { serviceService } from '@/services/serviceService';
import { serviceCategoryService } from '@/services/serviceCategoryService';
import { bookingService } from '@/services/bookingService';
import type { User, Hotel, Room, Service, ServiceCategory, AdminBookingFormData } from '@/types';

import { toast } from '@/hooks/use-toast';
import { formatPrice } from '@/lib/utils';

export default function CreateBookingPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedServices, setSelectedServices] = useState<{ [key: string]: number }>({});
  const [customerMode, setCustomerMode] = useState<'existing' | 'new'>('existing');

  const { register, handleSubmit, control, watch, setValue } = useForm<AdminBookingFormData>({
    defaultValues: {
      guests: { adults: 1, children: 0 },
      status: 'confirmed',
      paymentStatus: 'paid'
    }
  });

  const selectedHotelId = watch('hotelId');
  const checkIn = watch('checkIn');
  const checkOut = watch('checkOut');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, hotelsRes, servicesRes, categoriesRes] = await Promise.all([
          userService.getUsers({ limit: 1000 }),
          hotelService.getHotels({ limit: 1000 }),
          serviceService.getAdminServices({ limit: 500 }),
          serviceCategoryService.getServiceCategories(),
        ]);
        if (usersRes.success && usersRes.data) setUsers(usersRes.data);
        if (hotelsRes.success && hotelsRes.data) setHotels(hotelsRes.data);
        if (servicesRes.success && servicesRes.data) setServices(servicesRes.data);
        if (categoriesRes.success && categoriesRes.data) setCategories(categoriesRes.data);
      } catch (error) {
        console.error('Failed to fetch initial data');
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchRooms = async () => {
        if (!selectedHotelId) {
            setRooms([]);
            return;
        }

        try {
            if (checkIn && checkOut) {
                // Fetch available rooms with availability status
                const res = await hotelService.getAvailableRooms(
                    selectedHotelId,
                    checkIn,
                    checkOut
                );
                if (res.success && res.data) setRooms(res.data);
            } else {
                // Just fetch all rooms if dates not selected (fallback, though validation should prevent this)
                // Or maybe clear rooms until dates are picked?
                // Let's fetch basic list but without availability info they might not be select-able if we enforce logic
                // But for admin, maybe we show all but mark availability unknown?
                // Better UX: Show all rooms from getRooms but availability is unknown
                const res = await hotelService.getRooms(selectedHotelId, { limit: 100 });
                if (res.success && res.data) setRooms(res.data);
            }
        } catch (error) {
            console.error('Failed to fetch rooms');
        }
    };
    fetchRooms();
  }, [selectedHotelId, checkIn, checkOut]);

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
    if (new Date(data.checkIn) >= new Date(data.checkOut)) {
        toast({
            title: 'Lỗi',
            description: 'Ngày check-out phải sau ngày check-in',
            variant: 'destructive'
        });
        return;
    }

    if (customerMode === 'existing' && !data.userId) {
      toast({ title: 'Lỗi', description: 'Vui lòng chọn khách hàng', variant: 'destructive' });
      return;
    }

    if (customerMode === 'new' && (!data.contactInfo?.fullName || !data.contactInfo?.email || !data.contactInfo?.phone)) {
      toast({ title: 'Lỗi', description: 'Vui lòng nhập đầy đủ Họ tên, Email và Số điện thoại', variant: 'destructive' });
      return;
    }

    try {
      setLoading(true);
      const formattedServices = Object.entries(selectedServices).map(([serviceId, quantity]) => ({
        serviceId,
        quantity
      }));

      const payload: AdminBookingFormData & { services?: { serviceId: string; quantity: number }[] } = {
        ...data,
        services: formattedServices
      };
      if (customerMode === 'new') {
        delete payload.userId; // Backend sẽ tìm/tạo user theo contactInfo
      }

      const res = await bookingService.createAdminBooking(payload);
      if (res.success) {
        toast({ title: 'Thành công', description: customerMode === 'new' ? 'Đã tạo đặt phòng và tài khoản khách hàng (nếu mới).' : 'Đã tạo đặt phòng.' });
        navigate('/admin/bookings');
      }
    } catch (error) {
      console.error('Booking failed');
    } finally {
      setLoading(false);
    }
  };

  const userItems: ComboboxItem[] = users.map(u => ({
    value: u._id,
    label: `${u.fullName} (${u.email})`,
  }));

  const hotelItems: ComboboxItem[] = hotels.map(h => ({
    value: h._id,
    label: h.name,
  }));

  const roomItems: ComboboxItem[] = rooms.map(r => {
      const isAvailable = r.isAvailable !== false; // Default to true if undefined (e.g. initial load without dates)
      // Actually getAvailableRooms returns isAvailable boolean. 
      // If we use getRooms, isAvailable is undefined.
      // We should disable if isAvailable is specifically false.
      
      // If dates are not selected, we can't really know availability.
      // But let's assume if we fetched via getAvailableRooms, we rely on that.
      
      const disabled = !checkIn || !checkOut ? false : !isAvailable;
      const note = disabled ? 'Đã hết phòng' : `${formatPrice(r.price)} - Còn ${r.availableQuantity !== undefined ? r.availableQuantity : '?'} phòng`;

      return {
        value: r._id,
        label: r.name,
        disabled: disabled,
        note: note
      };
  });

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold tracking-tight">Tạo đặt phòng mới (Admin)</h2>
      
      <Card>
        <CardHeader>
           <CardTitle>Thông tin đặt phòng</CardTitle>
        </CardHeader>
        <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                
                {/* Khách hàng: Chọn có sẵn hoặc nhập mới */}
                <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
                    <Label>Khách hàng</Label>
                    <RadioGroup
                        value={customerMode}
                        onValueChange={(v: 'existing' | 'new') => {
                          setCustomerMode(v);
                          if (v === 'new') {
                            setValue('userId', '');
                          } else {
                            setValue('contactInfo.fullName', '');
                            setValue('contactInfo.email', '');
                            setValue('contactInfo.phone', '');
                          }
                        }}
                        className="flex flex-wrap gap-4"
                    >
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="existing" id="customer-existing" />
                            <Label htmlFor="customer-existing" className="flex items-center gap-1.5 cursor-pointer font-normal">
                                <Users className="h-4 w-4" /> Chọn từ danh sách khách hàng
                            </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="new" id="customer-new" />
                            <Label htmlFor="customer-new" className="flex items-center gap-1.5 cursor-pointer font-normal">
                                <UserPlus className="h-4 w-4" /> Nhập thông tin khách mới (tự tạo tài khoản nếu chưa có)
                            </Label>
                        </div>
                    </RadioGroup>

                    {customerMode === 'existing' && (
                        <div className="space-y-2">
                            <Label>Chọn khách hàng</Label>
                            <Controller
                                name="userId"
                                control={control}
                                render={({ field }) => (
                                    <Combobox
                                        items={userItems}
                                        value={field.value}
                                        onChange={(val) => {
                                          field.onChange(val);
                                          const u = users.find(us => us._id === val);
                                          if (u) {
                                            setValue('contactInfo.fullName', u.fullName);
                                            setValue('contactInfo.email', u.email || '');
                                            setValue('contactInfo.phone', u.phone || '');
                                          }
                                        }}
                                        placeholder="Tìm kiếm và chọn khách hàng..."
                                        searchPlaceholder="Nhập tên hoặc email..."
                                        emptyText="Không tìm thấy khách hàng."
                                    />
                                )}
                            />
                        </div>
                    )}

                    {customerMode === 'new' && (
                        <p className="text-sm text-muted-foreground">
                            Nhập thông tin bên dưới (Họ tên, Email, SĐT). Nếu khách chưa có tài khoản, hệ thống sẽ tự tạo tài khoản cho khách sau khi tạo đặt phòng thành công.
                        </p>
                    )}
                </div>

                {/* Hotel Select - Combobox */}
                <div className="space-y-2">
                    <Label>Khách sạn</Label>
                    <Controller
                        name="hotelId"
                        control={control}
                        rules={{ required: true }}
                        render={({ field }) => (
                            <Combobox
                                items={hotelItems}
                                value={field.value}
                                onChange={(val) => {
                                    field.onChange(val);
                                    setValue('roomId', ''); // Reset room when hotel changes
                                }}
                                placeholder="Tìm kiếm và chọn khách sạn..."
                                searchPlaceholder="Nhập tên khách sạn..."
                                emptyText="Không tìm thấy khách sạn."
                            />
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

                {/* Room Select - Combobox */}
                <div className="space-y-2">
                    <Label>Phòng</Label>
                    <div className="text-xs text-muted-foreground mb-2">
                        {!selectedHotelId ? "Vui lòng chọn khách sạn trước." : (!checkIn || !checkOut ? "Vui lòng chọn ngày để kiểm tra phòng trống." : "")}
                    </div>
                    <Controller
                        name="roomId"
                        control={control}
                        rules={{ required: true }}
                        render={({ field }) => (
                            <Combobox
                                items={roomItems}
                                value={field.value}
                                onChange={field.onChange}
                                placeholder="Chọn phòng..."
                                searchPlaceholder="Tìm tên phòng..."
                                emptyText="Không tìm thấy phòng phù hợp."
                                disabled={!selectedHotelId}
                                renderItem={(item) => (
                                    <div className="flex justify-between w-full items-center">
                                        <div className="flex flex-col">
                                            <span>{item.label}</span>
                                            <span className="text-xs text-muted-foreground">{item.note}</span>
                                        </div>
                                        {item.disabled && <Badge variant="destructive" className="ml-2 h-5">Hết phòng</Badge>}
                                        {!item.disabled && item.note?.includes('Còn') && <Badge variant="secondary" className="ml-2 h-5 bg-green-100 text-green-700 hover:bg-green-100">Còn trống</Badge>}
                                    </div>
                                )}
                            />
                        )}
                    />
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
                    {categories.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
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
                    <div className="grid gap-2 border p-4 rounded-md">
                        {services
                          .filter((s) => {
                            const catId = typeof s.category === 'string' ? s.category : (s.category as ServiceCategory)?._id;
                            if (!selectedCategoryId) return true;
                            return catId === selectedCategoryId;
                          })
                          .map(s => (
                             <div key={s._id} className="flex items-center space-x-2">
                                <Checkbox 
                                    id={`s-${s._id}`} 
                                    onCheckedChange={(c: boolean | 'indeterminate') => handleServiceToggle(s._id, c as boolean)} 
                                />
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Label htmlFor={`s-${s._id}`}>{s.name} ({formatPrice(s.price)})</Label>
                                  {typeof s.category === 'object' && s.category && (
                                    <Badge variant="secondary" className="text-xs">{(s.category as ServiceCategory).name}</Badge>
                                  )}
                                </div>
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