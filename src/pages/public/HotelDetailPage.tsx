import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  MapPin,
  Star,
  Wifi,
  Car,
  Coffee,
  Dumbbell,
  Waves,
  ChevronLeft,
  ChevronRight,
  Users,
  BedDouble,
  Maximize,
  Calendar,
  Check,
  Share,
  Heart,
  Layers,
  ChevronDown
} from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { HtmlContent } from '@/components/ui/HtmlContent';
import { hotelService } from '@/services/hotelService';
import { categoryService } from '@/services/categoryService';
import { formatPrice, getRoomTypeText } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import type { Room, Review, RoomCategory } from '@/types';

const amenityIcons: Record<string, React.ReactNode> = {
  'Wifi miễn phí': <Wifi className="h-5 w-5" />,
  'Hồ bơi': <Waves className="h-5 w-5" />,
  'Phòng gym': <Dumbbell className="h-5 w-5" />,
  'Bãi đậu xe': <Car className="h-5 w-5" />,
  'Nhà hàng': <Coffee className="h-5 w-5" />,
};

const ROOMS_PER_PAGE = 3;

export function HotelDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [currentImage, setCurrentImage] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  // Category filter and load more state
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [visibleRoomsCount, setVisibleRoomsCount] = useState(ROOMS_PER_PAGE);

  // Function to check availability and switch to rooms tab
  const handleCheckAvailability = () => {
    if (!checkIn || !checkOut) {
      return;
    }
    // Switch to rooms tab
    setActiveTab('rooms');
    // Wait for tab to render, then scroll
    setTimeout(() => {
      document.getElementById('rooms-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const { data: hotelData, isLoading: loadingHotel } = useQuery({
    queryKey: ['hotel', id],
    queryFn: () => hotelService.getHotel(id!),
    enabled: !!id,
  });

  const { data: roomsData, isLoading: loadingRooms } = useQuery({
    queryKey: ['rooms', id, checkIn, checkOut],
    queryFn: () =>
      checkIn && checkOut
        ? hotelService.getAvailableRooms(id!, checkIn, checkOut)
        : hotelService.getRooms(id!, { limit: 100 }),
    enabled: !!id,
  });

  const { data: reviewsData } = useQuery({
    queryKey: ['reviews', id],
    queryFn: () => hotelService.getReviews(id!),
    enabled: !!id,
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryService.getCategories(),
  });

  const hotel = hotelData?.data;
  const allRooms = roomsData?.data || [];
  const reviews = reviewsData?.data || [];
  const categories = categoriesData?.data || [];

  // Filter rooms by category
  const filteredRooms = selectedCategory
    ? allRooms.filter((r: Room) => (r.category as any)?._id === selectedCategory || r.category === selectedCategory)
    : allRooms;

  // Visible rooms (for load more)
  const visibleRooms = filteredRooms.slice(0, visibleRoomsCount);
  const hasMoreRooms = filteredRooms.length > visibleRoomsCount;

  // Reset visible count when category changes
  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setVisibleRoomsCount(ROOMS_PER_PAGE);
  };

  const handleLoadMore = () => {
    setVisibleRoomsCount((prev) => prev + ROOMS_PER_PAGE);
  };

  const handleBookRoom = (room: Room) => {
    if (!checkIn || !checkOut) {
        // Scroll to date selection or show prompt
        setActiveTab('rooms');
        setTimeout(() => {
            document.getElementById('rooms-section')?.scrollIntoView({ behavior: 'smooth' });
             // Optionally focus date inputs
             const dateInput = document.getElementById('checkIn-inline');
             if (dateInput) dateInput.focus();
        }, 100);
        // You could add a toast here: toast.error("Vui lòng chọn ngày nhận/trả phòng")
        return;
    }

    if (!isAuthenticated) {
      navigate('/auth/login', { state: { from: `/hotels/${id}` } });
      return;
    }
    navigate(`/booking/${id}/${room._id}`, {
      state: { checkIn, checkOut },
    });
  };

  if (loadingHotel) {
    return <HotelSkeleton />;
  }

  if (!hotel) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Không tìm thấy khách sạn</h1>
        <Button onClick={() => navigate('/hotels')} className="rounded-full">Quay lại danh sách</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent pb-12 relative overflow-hidden">
      {/* Animated Background Elements - Warm & Luxurious */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50/50 via-white to-rose-50/30" />
        <div className="absolute top-[10%] right-[5%] w-[400px] h-[400px] rounded-full bg-gradient-to-r from-orange-200/30 to-amber-200/25 blur-[100px] animate-float-slow" />
        <div className="absolute bottom-[20%] left-[10%] w-[350px] h-[350px] rounded-full bg-gradient-to-r from-rose-200/25 to-pink-200/20 blur-[90px] animate-float-medium" />
        <div className="absolute top-[50%] left-[40%] w-[300px] h-[300px] rounded-full bg-gradient-to-r from-amber-200/20 to-yellow-200/15 blur-[80px] animate-float-reverse" />
      </div>

      {/* Header Info */}
      <div className="bg-white/90 backdrop-blur-md border-b border-orange-100/40 pb-6 pt-6 sticky top-0 z-20">
        <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">{hotel.name}</h1>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4 text-primary" />
                            {hotel.address}, {hotel.city}
                        </span>
                        {hotel.rating > 0 && (
                            <>
                            <span className="w-1 h-1 rounded-full bg-gray-300 hidden md:block"></span>
                            <span className="flex items-center gap-1 font-medium text-foreground">
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                {hotel.rating.toFixed(1)} <span className="text-muted-foreground font-normal">({hotel.totalReviews} đánh giá)</span>
                            </span>
                            </>
                        )}
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="icon" className="rounded-full h-10 w-10">
                        <Share className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="rounded-full h-10 w-10">
                        <Heart className="h-4 w-4" />
                    </Button>
                    <Button onClick={() => { setActiveTab('rooms'); setTimeout(() => document.getElementById('rooms-section')?.scrollIntoView({ behavior: 'smooth' }), 100); }} className="rounded-full px-6">
                        Đặt phòng
                    </Button>
                </div>
            </div>
        </div>
      </div>

      <div className="container mx-auto px-4 mt-6">
        {/* Gallery Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 h-[300px] md:h-[400px] lg:h-[500px] rounded-3xl overflow-hidden shadow-sm mb-8 relative group cursor-pointer" onClick={() => setLightboxOpen(true)}>
           <div className="md:col-span-2 md:row-span-2 relative h-full">
                <img src={hotel.images[0] || 'https://placehold.co/800x600'} className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" alt="Main" />
           </div>
           <div className="hidden md:block relative h-full">
                <img src={hotel.images[1] || 'https://placehold.co/400x300'} className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" alt="Sub 1" />
           </div>
           <div className="hidden md:block relative h-full">
                <img src={hotel.images[2] || 'https://placehold.co/400x300'} className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" alt="Sub 2" />
           </div>
           <div className="hidden md:block relative h-full">
                <img src={hotel.images[3] || 'https://placehold.co/400x300'} className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" alt="Sub 3" />
           </div>
           <div className="hidden md:block relative h-full">
                <img src={hotel.images[4] || 'https://placehold.co/400x300'} className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" alt="Sub 4" />
                 {hotel.images.length > 5 && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white font-medium text-lg">
                        +{hotel.images.length - 5} ảnh
                    </div>
                )}
           </div>
           <Button variant="secondary" size="sm" className="absolute bottom-4 right-4 rounded-full shadow-lg opacity-90 hover:opacity-100 font-medium">
                Xem tất cả ảnh
           </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Overview Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full justify-start bg-transparent border-b rounded-none h-12 p-0 space-x-6">
                <TabsTrigger 
                    value="overview" 
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary px-0 text-base font-normal text-muted-foreground"
                >
                    Tổng quan
                </TabsTrigger>
                <TabsTrigger 
                    value="rooms" 
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary px-0 text-base font-normal text-muted-foreground"
                >
                    Phòng nghỉ
                </TabsTrigger>
                <TabsTrigger 
                    value="reviews" 
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary px-0 text-base font-normal text-muted-foreground"
                >
                    Đánh giá
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-8 py-6 animate-fade-in">
                {/* Description */}
                <div>
                  <h2 className="text-xl font-semibold mb-4 text-foreground">Giới thiệu</h2>
                  <HtmlContent html={hotel.description} className="text-base" />
                </div>

                <Separator />

                {/* Amenities */}
                <div>
                  <h2 className="text-xl font-semibold mb-4 text-foreground">Tiện nghi nổi bật</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {hotel.amenities.map((amenity) => (
                      <div key={amenity} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50">
                        <div className="text-primary">
                             {amenityIcons[amenity] || <Check className="h-5 w-5" />}
                        </div>
                        <span className="text-sm font-medium text-foreground">{amenity}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Policies */}
                <div>
                  <h2 className="text-xl font-semibold mb-4 text-foreground">Chính sách lưu trú</h2>
                  <Card className="bg-white/50 border-none shadow-sm">
                    <CardContent className="p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Nhận phòng</span>
                        <span className="font-medium">Từ {hotel.policies.checkIn}</span>
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Trả phòng</span>
                        <span className="font-medium">Trước {hotel.policies.checkOut}</span>
                      </div>
                      <Separator />
                      <div>
                        <span className="text-muted-foreground block mb-1">Chính sách hủy phòng</span>
                        <p className="font-medium text-sm leading-relaxed">{hotel.policies.cancellation}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="rooms" id="rooms-section" className="space-y-6 py-6 animate-fade-in">
                {/* Date Selection Inline */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-border/50 flex flex-col sm:flex-row gap-4 items-end">
                    <div className="flex-1 w-full">
                        <Label className="mb-2 block text-sm">Ngày nhận phòng</Label>
                        <Input
                          id="checkIn-inline"
                          type="date"
                          value={checkIn}
                          onChange={(e) => setCheckIn(e.target.value)}
                          min={format(new Date(), 'yyyy-MM-dd')}
                          className="h-12 rounded-xl"
                        />
                    </div>
                    <div className="flex-1 w-full">
                        <Label className="mb-2 block text-sm">Ngày trả phòng</Label>
                         <Input
                          type="date"
                          value={checkOut}
                          onChange={(e) => setCheckOut(e.target.value)}
                          min={checkIn || format(new Date(), 'yyyy-MM-dd')}
                          className="h-12 rounded-xl"
                        />
                    </div>
                </div>

                {/* Category Filter */}
                {categories.length > 0 && (
                  <div className="bg-white p-4 rounded-2xl shadow-sm border border-border/50">
                    <div className="flex items-center gap-2 mb-3">
                      <Layers className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">Lọc theo loại phòng:</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant={selectedCategory === '' ? 'default' : 'outline'}
                        size="sm"
                        className="rounded-full"
                        onClick={() => handleCategoryChange('')}
                      >
                        Tất cả ({allRooms.length})
                      </Button>
                      {categories.map((category: RoomCategory) => {
                        const count = allRooms.filter((r: Room) =>
                          (r.category as any)?._id === category._id || r.category === category._id
                        ).length;
                        if (count === 0) return null;
                        return (
                          <Button
                            key={category._id}
                            variant={selectedCategory === category._id ? 'default' : 'outline'}
                            size="sm"
                            className="rounded-full"
                            onClick={() => handleCategoryChange(category._id)}
                          >
                            {category.icon && <span className="mr-1">{category.icon}</span>}
                            {category.name} ({count})
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Rooms List */}
                {loadingRooms ? (
                  <div className="space-y-4">
                    {[1, 2].map((i) => (
                      <Skeleton key={i} className="h-64 rounded-2xl" />
                    ))}
                  </div>
                ) : filteredRooms.length > 0 ? (
                  <div className="space-y-6">
                    {visibleRooms.map((room: Room) => (
                      <RoomCard
                        key={room._id}
                        room={room}
                        onBook={() => handleBookRoom(room)}
                        disabled={room.isAvailable === false}
                      />
                    ))}

                    {/* Load More Button */}
                    {hasMoreRooms && (
                      <div className="text-center pt-4">
                        <Button
                          variant="outline"
                          onClick={handleLoadMore}
                          className="rounded-full px-8"
                        >
                          <ChevronDown className="mr-2 h-4 w-4" />
                          Xem thêm {Math.min(ROOMS_PER_PAGE, filteredRooms.length - visibleRoomsCount)} phòng
                          <span className="ml-2 text-muted-foreground">
                            ({visibleRoomsCount}/{filteredRooms.length})
                          </span>
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-gray-300">
                    <Calendar className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                    <p className="text-muted-foreground font-medium">
                      {selectedCategory ? 'Không có phòng nào trong danh mục này.' : 'Không tìm thấy phòng trống cho ngày bạn chọn.'}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {selectedCategory ? 'Vui lòng chọn danh mục khác.' : 'Vui lòng thử thay đổi ngày hoặc liên hệ khách sạn.'}
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="reviews" className="py-6 animate-fade-in">
                {reviews.length > 0 ? (
                  <div className="space-y-4">
                    {reviews.map((review: Review) => (
                      <ReviewCard key={review._id} review={review} />
                    ))}
                  </div>
                ) : (
                  <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-gray-300">
                    <Star className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                    <p className="text-muted-foreground">Chưa có đánh giá nào</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Booking Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
                <Card className="rounded-[24px] shadow-lg border-none overflow-hidden">
                    <CardHeader className="bg-primary/5 pb-4">
                         <div className="flex justify-between items-baseline">
                             <div>
                                 <span className="text-sm text-muted-foreground">Giá chỉ từ</span>
                                 <div className="flex items-baseline gap-1">
                                    <span className="text-2xl font-bold text-primary">{formatPrice(hotel.priceRange.min)}</span>
                                    <span className="text-sm text-muted-foreground">/đêm</span>
                                 </div>
                             </div>
                             <Badge variant="secondary" className="bg-white text-foreground font-normal shadow-sm">
                                 <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 mr-1" />
                                 {hotel.rating.toFixed(1)}
                             </Badge>
                         </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                         <div className="space-y-4">
                             <div className="grid grid-cols-2 gap-3">
                                 <div className="space-y-1.5">
                                     <Label className="text-xs uppercase text-muted-foreground font-semibold tracking-wider">Nhận phòng</Label>
                                     <div className="relative">
                                         <input 
                                            id="checkIn-sidebar"
                                            type="date" 
                                            className="w-full bg-secondary/50 rounded-lg p-2.5 text-sm border-none focus:ring-2 focus:ring-primary outline-none"
                                            value={checkIn}
                                            onChange={(e) => setCheckIn(e.target.value)}
                                            min={format(new Date(), 'yyyy-MM-dd')}
                                         />
                                     </div>
                                 </div>
                                 <div className="space-y-1.5">
                                     <Label className="text-xs uppercase text-muted-foreground font-semibold tracking-wider">Trả phòng</Label>
                                     <div className="relative">
                                         <input 
                                            type="date" 
                                            className="w-full bg-secondary/50 rounded-lg p-2.5 text-sm border-none focus:ring-2 focus:ring-primary outline-none"
                                            value={checkOut}
                                            onChange={(e) => setCheckOut(e.target.value)}
                                            min={checkIn || format(new Date(), 'yyyy-MM-dd')}
                                         />
                                     </div>
                                 </div>
                             </div>
                         </div>

                         <Button 
                            className="w-full h-12 rounded-full text-base font-medium shadow-md hover:shadow-lg transition-all" 
                            size="lg" 
                            onClick={() => {
                                if (!checkIn || !checkOut) {
                                    document.getElementById('checkIn-sidebar')?.focus();
                                    return;
                                }
                                handleCheckAvailability();
                            }}
                        >
                             Kiểm tra phòng trống
                         </Button>

                         <div className="text-center">
                             <span className="text-xs text-muted-foreground">Bạn sẽ chưa bị trừ tiền ngay đâu</span>
                         </div>
                    </CardContent>
                </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox Dialog */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-6xl w-full p-0 overflow-hidden bg-transparent border-none shadow-none h-[80vh] flex flex-col">
            <div className="relative flex-1 bg-black rounded-lg overflow-hidden flex items-center justify-center">
                 <img
                  src={hotel.images[currentImage]}
                  alt="Gallery"
                  className="max-w-full max-h-full object-contain"
                />
                 {hotel.images.length > 1 && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 rounded-full h-12 w-12"
                      onClick={(e) => { e.stopPropagation(); setCurrentImage((prev) => (prev === 0 ? hotel.images.length - 1 : prev - 1)); }}
                    >
                      <ChevronLeft className="h-8 w-8" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 rounded-full h-12 w-12"
                      onClick={(e) => { e.stopPropagation(); setCurrentImage((prev) => (prev === hotel.images.length - 1 ? 0 : prev + 1)); }}
                    >
                      <ChevronRight className="h-8 w-8" />
                    </Button>
                  </>
                )}
            </div>
            <div className="flex gap-2 overflow-x-auto py-4 justify-center">
                {hotel.images.map((img, idx) => (
                  <img
                    key={idx}
                    src={img}
                    alt={`Thumbnail ${idx + 1}`}
                    className={`h-16 w-24 object-cover rounded-lg cursor-pointer transition-all border-2 ${
                      idx === currentImage ? 'border-primary opacity-100 scale-105' : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                    onClick={() => setCurrentImage(idx)}
                  />
                ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RoomCard({ room, onBook, disabled }: { room: Room; onBook: () => void; disabled: boolean }) {
  return (
    <Card className="rounded-[24px] overflow-hidden border-none shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-0">
        <div className="flex flex-col md:flex-row">
          <div className="md:w-[320px] shrink-0">
            <div className="w-full h-56 md:h-full overflow-hidden relative">
                 {room.images && room.images.length > 2 ? (
                    <div className="grid grid-cols-2 h-full gap-[1px]">
                        <img src={room.images[0]} alt={room.name} className="w-full h-full object-cover" />
                        <div className="grid grid-rows-2 h-full gap-[1px]">
                            <img src={room.images[1]} alt={room.name} className="w-full h-full object-cover" />
                            <div className="relative h-full">
                                <img src={room.images[2]} alt={room.name} className="w-full h-full object-cover" />
                                {room.images.length > 3 && (
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white font-bold text-sm">
                                        +{room.images.length - 3}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                 ) : (
                    <img
                        src={room.images[0] || 'https://placehold.co/400x300'}
                        alt={room.name}
                        className="w-full h-full object-cover"
                    />
                 )}
            </div>
          </div>
          <div className="flex-1 p-6 flex flex-col justify-between">
            <div>
                <div className="flex items-start justify-between mb-2">
                  <div className="space-y-1">
                    <h3 className="font-bold text-xl text-foreground">{room.name}</h3>
                    <Badge variant="secondary" className="rounded-md font-normal bg-secondary text-secondary-foreground">{getRoomTypeText(room.type)}</Badge>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground my-4">
                  <span className="flex items-center gap-1.5 bg-secondary/30 px-2 py-1 rounded-md">
                    <Users className="h-4 w-4" />
                    {room.capacity.adults} người lớn
                    {room.capacity.children > 0 && `, ${room.capacity.children} trẻ`}
                  </span>
                  <span className="flex items-center gap-1.5 bg-secondary/30 px-2 py-1 rounded-md">
                    <Maximize className="h-4 w-4" />
                    {room.size} m²
                  </span>
                  <span className="flex items-center gap-1.5 bg-secondary/30 px-2 py-1 rounded-md">
                    <BedDouble className="h-4 w-4" />
                    {room.bedType}
                  </span>
                </div>
                
                <HtmlContent html={room.description} className="line-clamp-2" compact />
            </div>

            <div className="flex items-end justify-between mt-6 pt-4 border-t border-border/50">
               <div>
                    <span className="block text-xs text-muted-foreground mb-1">Giá mỗi đêm từ</span>
                    <span className="text-2xl font-bold text-primary">
                      {formatPrice(room.price)}
                    </span>
               </div>
              <div className="flex flex-col items-end gap-2">
                 {'availableQuantity' in room && (
                     <span className={`text-xs font-medium ${room.isAvailable ? 'text-green-600' : 'text-red-600'}`}>
                        {room.isAvailable ? `Còn ${room.availableQuantity} phòng` : 'Hết phòng'}
                    </span>
                  )}
                  <Button onClick={onBook} disabled={disabled} className="rounded-full px-6 shadow-md hover:shadow-lg transition-all">
                    Chọn phòng
                  </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ReviewCard({ review }: { review: Review }) {
  const user = typeof review.user === 'object' ? review.user : null;

  return (
    <Card className="rounded-[20px] border-none shadow-sm bg-white">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center shrink-0 border border-white shadow-sm">
            <span className="text-lg font-bold text-primary">
              {user?.fullName?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-base text-foreground">{user?.fullName || 'Khách'}</span>
              <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-full">
                {format(new Date(review.createdAt), 'dd/MM/yyyy')}
              </span>
            </div>
            <div className="flex items-center gap-0.5 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'
                    }`}
                  />
                ))}
            </div>
            <p className="text-sm text-foreground/80 leading-relaxed bg-secondary/30 p-4 rounded-xl rounded-tl-none">
                {review.comment}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function HotelSkeleton() {
    return (
      <div className="container mx-auto px-4 py-8 space-y-8">
        <div className="space-y-4">
            <Skeleton className="h-8 w-1/3 rounded-lg" />
            <Skeleton className="h-4 w-1/4 rounded-lg" />
        </div>
        <div className="grid grid-cols-4 gap-2 h-[400px]">
             <Skeleton className="col-span-2 row-span-2 rounded-2xl" />
             <Skeleton className="rounded-2xl" />
             <Skeleton className="rounded-2xl" />
             <Skeleton className="rounded-2xl" />
             <Skeleton className="rounded-2xl" />
        </div>
        <div className="grid grid-cols-3 gap-8">
            <div className="col-span-2 space-y-6">
                 <Skeleton className="h-12 w-full rounded-xl" />
                 <Skeleton className="h-64 w-full rounded-2xl" />
            </div>
            <Skeleton className="h-96 rounded-2xl" />
        </div>
      </div>
    )
}