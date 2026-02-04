import { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Calendar, Users, Layers, Check, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { HtmlContent } from '@/components/ui/HtmlContent';
import { hotelService } from '@/services/hotelService';
import { categoryService } from '@/services/categoryService';
import { BookingForm } from '@/components/booking/BookingForm';
import type { Room, RoomCategory } from '@/types';

const formatPrice = (price: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

export function BookingPage() {
  const { hotelId, roomId } = useParams<{ hotelId: string; roomId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  // Get dates from navigation state (from HotelDetailPage)
  const stateCheckIn = (location.state as { checkIn?: string; checkOut?: string })?.checkIn || '';
  const stateCheckOut = (location.state as { checkIn?: string; checkOut?: string })?.checkOut || '';

  // State for room selection flow
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [checkInDate, setCheckInDate] = useState<string>(stateCheckIn);
  const [checkOutDate, setCheckOutDate] = useState<string>(stateCheckOut);
  const [showAvailableRooms, setShowAvailableRooms] = useState(false);

  // Fetch hotel data
  const { data: hotelData, isLoading: loadingHotel } = useQuery({
    queryKey: ['hotel', hotelId],
    queryFn: () => hotelService.getHotel(hotelId!),
    enabled: !!hotelId,
  });

  // Fetch room if roomId is provided (direct booking link)
  const { data: roomData, isLoading: loadingRoom } = useQuery({
    queryKey: ['room', roomId],
    queryFn: () => hotelService.getRoom(roomId!),
    enabled: !!roomId,
  });

  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryService.getCategories(),
    enabled: !roomId, // Only fetch if no roomId (room selection mode)
  });

  // Fetch available rooms when dates are selected
  const { data: availableRoomsData, isLoading: loadingAvailableRooms, refetch: refetchAvailableRooms } = useQuery({
    queryKey: ['availableRooms', hotelId, checkInDate, checkOutDate],
    queryFn: () => hotelService.getAvailableRooms(hotelId!, checkInDate, checkOutDate),
    enabled: false, // Manual trigger
  });

  const hotel = hotelData?.data;
  const room = roomData?.data;
  const categories = categoriesData?.data || [];
  const availableRooms = availableRoomsData?.data || [];

  // Filter rooms by category
  const filteredRooms = selectedCategory
    ? availableRooms.filter((r: Room) => (r.category as any)?._id === selectedCategory || r.category === selectedCategory)
    : availableRooms;

  const handleSearchRooms = () => {
    if (checkInDate && checkOutDate) {
      setShowAvailableRooms(true);
      refetchAvailableRooms();
    }
  };

  const handleSelectRoom = (room: Room) => {
    setSelectedRoom(room);
  };

  // Loading state
  if (loadingHotel || (roomId && loadingRoom)) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Skeleton className="h-96" />
          </div>
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!hotel) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Không tìm thấy khách sạn</h1>
        <Button onClick={() => navigate(-1)}>Quay lại</Button>
      </div>
    );
  }

  // If roomId is provided OR a room is selected, show booking form
  const bookingRoom = room || selectedRoom;
  if (bookingRoom) {
    return (
      <div className="min-h-screen bg-muted/30 py-8">
        <div className="container mx-auto px-4">
          <Button
            variant="ghost"
            className="mb-6"
            onClick={() => {
              if (selectedRoom) {
                setSelectedRoom(null);
              } else {
                navigate(-1);
              }
            }}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {selectedRoom ? 'Chọn phòng khác' : 'Quay lại'}
          </Button>

          <div className="flex flex-col md:flex-row gap-8">
            <div className="w-full md:w-1/3 space-y-4">
              <div className="rounded-lg overflow-hidden border bg-card text-card-foreground shadow-sm">
                <img
                  src={bookingRoom.images?.[0] || hotel.images?.[0] || "https://placehold.co/600x400"}
                  alt={bookingRoom.name}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4 space-y-2">
                  <h3 className="font-bold text-lg">{hotel.name}</h3>
                  <p className="text-sm text-gray-500">{hotel.address}</p>
                  <div className="h-px bg-gray-200 my-2" />
                  <h4 className="font-semibold">{bookingRoom.name}</h4>
                  <HtmlContent html={bookingRoom.description} compact className="text-sm" />
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{bookingRoom.capacity?.adults || 2} người lớn, {bookingRoom.capacity?.children || 0} trẻ em</span>
                  </div>
                  <p className="font-bold text-primary mt-2">
                    {formatPrice(bookingRoom.price)} / đêm
                  </p>
                </div>
              </div>
            </div>

            <div className="w-full md:w-2/3">
              {hotelId && bookingRoom && (
                <BookingForm
                  hotelId={hotelId}
                  room={bookingRoom}
                  initialCheckIn={checkInDate || stateCheckIn}
                  initialCheckOut={checkOutDate || stateCheckOut}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Room selection mode (no roomId provided)
  return (
    <div className="min-h-screen bg-muted/30 py-8">
      <div className="container mx-auto px-4">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Quay lại
        </Button>

        {/* Hotel Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">Đặt phòng tại {hotel.name}</h1>
          <p className="text-muted-foreground">{hotel.address}, {hotel.city}</p>
        </div>

        {/* Step 1: Select Dates */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5 text-primary" />
              Bước 1: Chọn ngày lưu trú
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div className="space-y-2">
                <Label>Ngày nhận phòng</Label>
                <Input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={checkInDate}
                  onChange={(e) => {
                    setCheckInDate(e.target.value);
                    setShowAvailableRooms(false);
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>Ngày trả phòng</Label>
                <Input
                  type="date"
                  min={checkInDate || new Date().toISOString().split('T')[0]}
                  value={checkOutDate}
                  onChange={(e) => {
                    setCheckOutDate(e.target.value);
                    setShowAvailableRooms(false);
                  }}
                />
              </div>
              <Button
                onClick={handleSearchRooms}
                disabled={!checkInDate || !checkOutDate || checkInDate >= checkOutDate}
              >
                Tìm phòng trống
              </Button>
            </div>
            {checkInDate && checkOutDate && checkInDate >= checkOutDate && (
              <p className="text-sm text-red-500 mt-2 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                Ngày trả phòng phải sau ngày nhận phòng
              </p>
            )}
          </CardContent>
        </Card>

        {/* Step 2: Select Category (Optional) */}
        {showAvailableRooms && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Layers className="h-5 w-5 text-primary" />
                Bước 2: Chọn loại phòng (tùy chọn)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedCategory === '' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory('')}
                >
                  Tất cả
                </Button>
                {categories.map((category: RoomCategory) => (
                  <Button
                    key={category._id}
                    variant={selectedCategory === category._id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory(category._id)}
                  >
                    {category.icon && <span className="mr-1">{category.icon}</span>}
                    {category.name}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Select Room */}
        {showAvailableRooms && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Check className="h-5 w-5 text-primary" />
                Bước 3: Chọn phòng
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingAvailableRooms ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2">Đang tìm phòng...</span>
                </div>
              ) : filteredRooms.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Không có phòng trống</p>
                  <p className="text-sm">Vui lòng chọn ngày khác hoặc thử loại phòng khác</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredRooms.map((availableRoom: Room) => (
                    <div
                      key={availableRoom._id}
                      className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => handleSelectRoom(availableRoom)}
                    >
                      <img
                        src={availableRoom.images?.[0] || hotel.images?.[0] || "https://placehold.co/400x300"}
                        alt={availableRoom.name}
                        className="w-full h-40 object-cover"
                      />
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold">{availableRoom.name}</h3>
                          {availableRoom.availableQuantity !== undefined && (
                            <Badge variant="secondary" className="text-xs">
                              Còn {availableRoom.availableQuantity} phòng
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                          <Users className="h-4 w-4" />
                          <span>{availableRoom.capacity?.adults || 2} người lớn, {availableRoom.capacity?.children || 0} trẻ em</span>
                        </div>
                        {(availableRoom.category as any)?.name && (
                          <Badge variant="outline" className="mb-2">
                            {(availableRoom.category as any).icon} {(availableRoom.category as any).name}
                          </Badge>
                        )}
                        <p className="font-bold text-primary text-lg">
                          {formatPrice(availableRoom.price)}
                          <span className="text-sm font-normal text-muted-foreground"> / đêm</span>
                        </p>
                        <Button className="w-full mt-3" size="sm">
                          Chọn phòng này
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
