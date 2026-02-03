import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { HtmlContent } from '@/components/ui/HtmlContent';
import { hotelService } from '@/services/hotelService';
import { BookingForm } from '@/components/booking/BookingForm';

export function BookingPage() {
  const { hotelId, roomId } = useParams<{ hotelId: string; roomId: string }>();
  const navigate = useNavigate();

  const { data: hotelData, isLoading: loadingHotel } = useQuery({
    queryKey: ['hotel', hotelId],
    queryFn: () => hotelService.getHotel(hotelId!),
    enabled: !!hotelId,
  });

  const { data: roomData, isLoading: loadingRoom } = useQuery({
    queryKey: ['room', roomId],
    queryFn: () => hotelService.getRoom(roomId!),
    enabled: !!roomId,
  });

  const hotel = hotelData?.data;
  const room = roomData?.data;

  if (loadingHotel || loadingRoom) {
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

  if (!hotel || !room) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Không tìm thấy thông tin</h1>
        <Button onClick={() => navigate(-1)}>Quay lại</Button>
      </div>
    );
  }

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

        <div className="flex flex-col md:flex-row gap-8">
            <div className="w-full md:w-1/3 space-y-4">
                <div className="rounded-lg overflow-hidden border bg-card text-card-foreground shadow-sm">
                    <img 
                        src={room.images?.[0] || hotel.images?.[0] || "https://placehold.co/600x400"} 
                        alt={room.name} 
                        className="w-full h-48 object-cover"
                    />
                    <div className="p-4 space-y-2">
                        <h3 className="font-bold text-lg">{hotel.name}</h3>
                        <p className="text-sm text-gray-500">{hotel.address}</p>
                        <div className="h-px bg-gray-200 my-2" />
                        <h4 className="font-semibold">{room.name}</h4>
                        <HtmlContent html={room.description} compact className="text-sm" />
                        <p className="font-bold text-primary mt-2">
                             {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(room.price)} / đêm
                        </p>
                    </div>
                </div>
            </div>

            <div className="w-full md:w-2/3">
                {hotelId && room && (
                    <BookingForm 
                        hotelId={hotelId} 
                        room={room} 
                    />
                )}
            </div>
        </div>
      </div>
    </div>
  );
}