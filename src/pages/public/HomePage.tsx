import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, MapPin, Calendar, Users, Star, ArrowRight, Sparkles, Building, Globe } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { hotelService } from '@/services/hotelService';
import { formatPrice } from '@/lib/utils';
import type { Hotel } from '@/types';
import { Badge } from '@/components/ui/badge';

export function HomePage() {
  const navigate = useNavigate();
  const [destination, setDestination] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState('2');

  const { data: featuredHotels, isLoading: loadingFeatured } = useQuery({
    queryKey: ['featuredHotels'],
    queryFn: () => hotelService.getFeaturedHotels(),
  });

  const { data: popularCities, isLoading: loadingCities } = useQuery({
    queryKey: ['popularCities'],
    queryFn: () => hotelService.getPopularCities(),
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (destination) params.set('search', destination);
    if (checkIn) params.set('checkIn', checkIn);
    if (checkOut) params.set('checkOut', checkOut);
    if (guests) params.set('guests', guests);
    navigate(`/hotels?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-transparent font-sans">
      {/* Hero Section */}
      <section className="relative pt-12 pb-24 md:pt-24 md:pb-32 overflow-hidden">
        {/* Enhanced Animated Background Elements - Warm & Luxurious */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          {/* Base warm gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-orange-50/80 via-white to-rose-50/50" />
          
          {/* Animated floating orbs with warm colors */}
          <div className="absolute top-[5%] right-[10%] w-[500px] h-[500px] rounded-full bg-gradient-to-r from-orange-200/50 to-amber-200/40 blur-[100px] animate-float-slow" />
          <div className="absolute bottom-[10%] left-[5%] w-[450px] h-[450px] rounded-full bg-gradient-to-r from-rose-200/40 to-pink-200/30 blur-[90px] animate-float-medium" />
          <div className="absolute top-[40%] left-[25%] w-[350px] h-[350px] rounded-full bg-gradient-to-r from-amber-200/30 to-yellow-200/25 blur-[80px] animate-float-fast" />
          <div className="absolute top-[20%] right-[30%] w-[300px] h-[300px] rounded-full bg-gradient-to-r from-coral-200/20 to-orange-200/20 blur-[70px] animate-float-reverse" />
          
          {/* Sparkle effects with warm colors */}
          <div className="absolute top-[15%] left-[20%] w-2 h-2 bg-orange-400 rounded-full animate-sparkle opacity-60" />
          <div className="absolute top-[30%] right-[25%] w-1.5 h-1.5 bg-amber-400 rounded-full animate-sparkle-delay-1 opacity-50" />
          <div className="absolute top-[60%] left-[15%] w-1 h-1 bg-rose-400 rounded-full animate-sparkle-delay-2 opacity-40" />
          <div className="absolute top-[70%] right-[20%] w-2 h-2 bg-yellow-400 rounded-full animate-sparkle-delay-3 opacity-50" />
          <div className="absolute top-[25%] left-[60%] w-1.5 h-1.5 bg-pink-400 rounded-full animate-sparkle-delay-4 opacity-40" />
        </div>

        <div className="container mx-auto px-4 text-center relative z-10">
          <Badge className="mb-6 bg-gradient-to-r from-orange-100 to-amber-100 text-orange-700 hover:from-orange-200 hover:to-amber-200 px-4 py-1.5 text-sm font-medium border-none shadow-sm">
            <Sparkles className="w-3 h-3 mr-2" /> Khám phá thế giới mới
          </Badge>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground mb-6 max-w-4xl mx-auto leading-tight">
            Tìm nơi dừng chân <br/>
            <span className="text-primary">lý tưởng</span> cho bạn
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12">
            Hàng ngàn khách sạn, resort và homestay đẳng cấp đang chờ đón bạn. 
            Đặt phòng ngay hôm nay với giá tốt nhất.
          </p>

          {/* Search Bar - Google Travel Style */}
          <div className="max-w-4xl mx-auto">
            <form
              onSubmit={handleSearch}
              className="bg-white p-2 rounded-full shadow-lg shadow-black/5 border border-border/50 flex flex-col md:flex-row items-center gap-2"
            >
              <div className="flex-1 w-full md:w-auto relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                  <Search className="h-5 w-5" />
                </div>
                <Input
                  type="text"
                  placeholder="Bạn muốn đi đâu?"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="pl-12 border-none shadow-none bg-transparent h-12 rounded-full focus-visible:ring-0 text-base"
                />
              </div>

              <div className="hidden md:block w-px h-8 bg-gray-200" />

              {/* Check-in Date */}
              <div className="flex-1 w-full md:w-auto relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                  <Calendar className="h-5 w-5" />
                </div>
                <Input
                  type="date"
                  placeholder="Ngày đến"
                  value={checkIn}
                  min={format(new Date(), 'yyyy-MM-dd')}
                  onChange={(e) => {
                    setCheckIn(e.target.value);
                    // If check-out is before check-in, reset it
                    if (checkOut && e.target.value > checkOut) {
                      setCheckOut('');
                    }
                  }}
                  className="pl-12 border-none shadow-none bg-transparent h-12 rounded-full focus-visible:ring-0 text-base cursor-pointer"
                />
              </div>

              <div className="hidden md:block w-px h-8 bg-gray-200" />

              {/* Check-out Date */}
              <div className="flex-1 w-full md:w-auto relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                  <Calendar className="h-5 w-5" />
                </div>
                <Input
                  type="date"
                  placeholder="Ngày đi"
                  value={checkOut}
                  min={checkIn || format(new Date(), 'yyyy-MM-dd')}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="pl-12 border-none shadow-none bg-transparent h-12 rounded-full focus-visible:ring-0 text-base cursor-pointer"
                />
              </div>

              <div className="hidden md:block w-px h-8 bg-gray-200" />

              <div className="w-full md:w-36 relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                  <Users className="h-5 w-5" />
                </div>
                <Input
                  type="number"
                  min="1"
                  max="20"
                  placeholder="2 Khách"
                  value={guests}
                  onChange={(e) => setGuests(e.target.value)}
                  className="pl-12 border-none shadow-none bg-transparent h-12 rounded-full focus-visible:ring-0 text-base"
                />
              </div>

              <Button type="submit" size="lg" className="w-full md:w-auto rounded-full h-12 px-8 text-base shadow-md hover:shadow-lg transition-all">
                Tìm kiếm
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* Popular Destinations */}
      <section className="py-20 bg-gradient-to-b from-white to-orange-50/30 backdrop-blur-sm relative overflow-hidden">
        {/* Section animated background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-[50%] right-[10%] w-[300px] h-[300px] rounded-full bg-gradient-to-r from-amber-100/40 to-orange-100/30 blur-[80px] animate-float-slow" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Điểm đến phổ biến</h2>
              <p className="text-muted-foreground mt-2">Được nhiều du khách lựa chọn nhất</p>
            </div>
             <Button variant="ghost" className="hidden md:flex rounded-full">
              Xem tất cả <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          {loadingCities ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-48 rounded-3xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {popularCities?.data?.slice(0, 5).map((city) => (
                <div
                  key={city.city}
                  className="group relative h-64 rounded-3xl overflow-hidden cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300"
                  onClick={() => navigate(`/hotels?city=${encodeURIComponent(city.city)}`)}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent z-10" />
                  {/* Placeholder image generation based on city name hash or generic */}
                  <img
                    src={`https://source.unsplash.com/800x600/?${city.city},landmark`}
                    onError={(e) => (e.currentTarget.src = 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800')}
                    alt={city.city}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute bottom-0 left-0 p-6 z-20 text-white">
                    <h3 className="text-xl font-bold mb-1">{city.city}</h3>
                    <p className="text-white/80 text-sm flex items-center gap-1">
                      <Building className="h-3 w-3" /> {city.count} khách sạn
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Featured Hotels */}
      <section className="py-20 bg-gradient-to-br from-rose-50/50 via-white to-amber-50/30 relative overflow-hidden">
        {/* Section animated background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute bottom-[20%] left-[10%] w-[350px] h-[350px] rounded-full bg-gradient-to-r from-rose-100/30 to-orange-100/25 blur-[90px] animate-float-medium" />
          <div className="absolute top-[30%] right-[15%] w-[250px] h-[250px] rounded-full bg-gradient-to-r from-amber-100/35 to-yellow-100/30 blur-[70px] animate-float-reverse" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Khách sạn nổi bật</h2>
              <p className="text-muted-foreground mt-2">Trải nghiệm nghỉ dưỡng tuyệt vời</p>
            </div>
            <Button variant="outline" asChild className="rounded-full">
              <a href="/hotels">
                Xem tất cả <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>

          {loadingFeatured ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="h-64 rounded-2xl w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {featuredHotels?.data?.slice(0, 4).map((hotel: Hotel) => (
                <HotelCard key={hotel._id} hotel={hotel} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Features / Benefits */}
      <section className="py-24 bg-gradient-to-b from-white to-rose-50/40 backdrop-blur-sm relative overflow-hidden">
        {/* Section animated background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-[20%] left-[20%] w-[400px] h-[400px] rounded-full bg-gradient-to-r from-amber-100/30 to-orange-100/25 blur-[100px] animate-float-fast" />
          <div className="absolute bottom-[10%] right-[20%] w-[300px] h-[300px] rounded-full bg-gradient-to-r from-rose-100/20 to-pink-100/20 blur-[80px] animate-float-slow" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="flex flex-col items-center text-center p-8 rounded-3xl bg-white/80 backdrop-blur-sm border border-orange-100/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center mb-6 text-orange-600">
                <Globe className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-foreground">Đa dạng lựa chọn</h3>
              <p className="text-muted-foreground leading-relaxed">
                Hơn 1000+ khách sạn và resort tại các điểm đến hàng đầu Việt Nam.
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-8 rounded-3xl bg-white/80 backdrop-blur-sm border border-amber-100/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-emerald-100 to-green-100 flex items-center justify-center mb-6 text-emerald-600">
                <Sparkles className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-foreground">Giá tốt nhất</h3>
              <p className="text-muted-foreground leading-relaxed">
                Cam kết giá tốt nhất thị trường cùng nhiều ưu đãi độc quyền cho thành viên.
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-8 rounded-3xl bg-white/80 backdrop-blur-sm border border-rose-100/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-rose-100 to-pink-100 flex items-center justify-center mb-6 text-rose-600">
                <Users className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-foreground">Hỗ trợ 24/7</h3>
              <p className="text-muted-foreground leading-relaxed">
                Đội ngũ chăm sóc khách hàng chuyên nghiệp luôn sẵn sàng hỗ trợ bạn mọi lúc.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// Modern Hotel Card
function HotelCard({ hotel }: { hotel: Hotel }) {
  const navigate = useNavigate();

  return (
    <div
      className="group cursor-pointer flex flex-col gap-3"
      onClick={() => navigate(`/hotels/${hotel._id}`)}
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-gray-100">
        <img
          src={hotel.images[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600'}
          alt={hotel.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <Button
          size="icon"
          variant="ghost"
          className="absolute top-3 right-3 rounded-full bg-white/50 hover:bg-white text-gray-700 hover:text-red-500 backdrop-blur-md transition-all"
        >
          <div className="sr-only">Like</div>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
          >
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
          </svg>
        </Button>
      </div>
      
      <div>
        <div className="flex justify-between items-start">
          <h3 className="font-bold text-lg leading-tight text-foreground group-hover:text-primary transition-colors">
            {hotel.name}
          </h3>
          <div className="flex items-center gap-1 text-sm font-medium">
             <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
             <span>{hotel.rating}</span>
          </div>
        </div>
        
        <p className="text-muted-foreground text-sm mt-1 truncate">{hotel.address}</p>
        
        <div className="mt-2 flex items-baseline gap-1">
          <span className="font-bold text-lg">{formatPrice(hotel.priceRange.min)}</span>
          <span className="text-muted-foreground text-sm">/ đêm</span>
        </div>
      </div>
    </div>
  );
}