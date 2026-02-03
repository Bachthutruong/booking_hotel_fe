import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  MapPin,
  Star,
  Filter,
  SlidersHorizontal,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { HtmlContent } from '@/components/ui/HtmlContent';
import { hotelService } from '@/services/hotelService';
import { formatPrice } from '@/lib/utils';
import type { Hotel, HotelSearchParams } from '@/types';

export function HotelsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filterOpen, setFilterOpen] = useState(false);

  // Search state
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [city, setCity] = useState(searchParams.get('city') || '');
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [rating, setRating] = useState(searchParams.get('rating') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || '');
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'));

  // Build query params
  const queryParams: HotelSearchParams = {
    search: search || city || undefined,
    city: city || undefined,
    minPrice: minPrice ? parseInt(minPrice) : undefined,
    maxPrice: maxPrice ? parseInt(maxPrice) : undefined,
    rating: rating ? parseFloat(rating) : undefined,
    sortBy: (sortBy as HotelSearchParams['sortBy']) || undefined,
    page,
    limit: 12,
  };

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['hotels', queryParams],
    queryFn: () => hotelService.getHotels(queryParams),
  });

  const { data: citiesData } = useQuery({
    queryKey: ['popularCities'],
    queryFn: () => hotelService.getPopularCities(),
  });

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (city) params.set('city', city);
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);
    if (rating) params.set('rating', rating);
    if (sortBy) params.set('sortBy', sortBy);
    if (page > 1) params.set('page', page.toString());
    setSearchParams(params);
  }, [search, city, minPrice, maxPrice, rating, sortBy, page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    refetch();
  };

  const clearFilters = () => {
    setSearch('');
    setCity('');
    setMinPrice('');
    setMaxPrice('');
    setRating('');
    setSortBy('');
    setPage(1);
  };

  const hasFilters = search || city || minPrice || maxPrice || rating;

  const totalPages = data?.pagination?.totalPages || 1;

  return (
    <div className="min-h-screen bg-transparent relative overflow-hidden">
      {/* Animated Background Elements - Warm */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50/50 via-white to-rose-50/30" />
        <div className="absolute top-[15%] right-[10%] w-[400px] h-[400px] rounded-full bg-gradient-to-r from-orange-200/35 to-amber-200/30 blur-[100px] animate-float-slow" />
        <div className="absolute bottom-[10%] left-[5%] w-[350px] h-[350px] rounded-full bg-gradient-to-r from-rose-200/30 to-pink-200/25 blur-[90px] animate-float-medium" />
        <div className="absolute top-[60%] left-[30%] w-[300px] h-[300px] rounded-full bg-gradient-to-r from-amber-200/25 to-yellow-200/20 blur-[80px] animate-float-reverse" />
      </div>
      
      {/* Search Bar */}
      <div className="bg-gradient-to-r from-primary/90 to-orange-500/90 backdrop-blur-sm py-6 relative z-10">
        <div className="container mx-auto px-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Tìm theo tên khách sạn hoặc địa điểm..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-white"
              />
            </div>
            <Button type="submit" variant="secondary">
              Tìm kiếm
            </Button>
          </form>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filters Sidebar - Desktop */}
          <aside className="hidden lg:block w-64 shrink-0">
            <Card className="sticky top-20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Bộ lọc</h3>
                  {hasFilters && (
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                      Xóa tất cả
                    </Button>
                  )}
                </div>

                <Separator className="mb-4" />

                {/* City Filter */}
                <div className="space-y-2 mb-4">
                  <Label>Thành phố</Label>
                  <Select value={city || 'all'} onValueChange={(v) => setCity(v === 'all' ? '' : v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn thành phố" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả</SelectItem>
                      {citiesData?.data?.map((c) => (
                        <SelectItem key={c.city} value={c.city}>
                          {c.city} ({c.count})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Price Range */}
                <div className="space-y-2 mb-4">
                  <Label>Khoảng giá (VNĐ)</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Từ"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                    />
                    <Input
                      type="number"
                      placeholder="Đến"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                    />
                  </div>
                </div>

                {/* Rating Filter */}
                <div className="space-y-2 mb-4">
                  <Label>Đánh giá tối thiểu</Label>
                  <Select value={rating || 'all'} onValueChange={(v) => setRating(v === 'all' ? '' : v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn đánh giá" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả</SelectItem>
                      <SelectItem value="4.5">4.5+ sao</SelectItem>
                      <SelectItem value="4">4+ sao</SelectItem>
                      <SelectItem value="3.5">3.5+ sao</SelectItem>
                      <SelectItem value="3">3+ sao</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={() => refetch()} className="w-full">
                  Áp dụng
                </Button>
              </CardContent>
            </Card>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {/* Results Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-bold">Khách sạn</h1>
                <p className="text-muted-foreground">
                  {data?.pagination?.total || 0} kết quả được tìm thấy
                </p>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                {/* Mobile Filter Button */}
                <Dialog open={filterOpen} onOpenChange={setFilterOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="lg:hidden">
                      <Filter className="mr-2 h-4 w-4" />
                      Bộ lọc
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Bộ lọc</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      {/* Mobile filters - same as desktop */}
                      <div className="space-y-2">
                        <Label>Thành phố</Label>
                        <Select value={city || 'all'} onValueChange={(v) => setCity(v === 'all' ? '' : v)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn thành phố" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Tất cả</SelectItem>
                            {citiesData?.data?.map((c) => (
                              <SelectItem key={c.city} value={c.city}>
                                {c.city}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Khoảng giá</Label>
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            placeholder="Từ"
                            value={minPrice}
                            onChange={(e) => setMinPrice(e.target.value)}
                          />
                          <Input
                            type="number"
                            placeholder="Đến"
                            value={maxPrice}
                            onChange={(e) => setMaxPrice(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Đánh giá</Label>
                        <Select value={rating || 'all'} onValueChange={(v) => setRating(v === 'all' ? '' : v)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn đánh giá" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Tất cả</SelectItem>
                            <SelectItem value="4.5">4.5+ sao</SelectItem>
                            <SelectItem value="4">4+ sao</SelectItem>
                            <SelectItem value="3">3+ sao</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        className="w-full"
                        onClick={() => {
                          refetch();
                          setFilterOpen(false);
                        }}
                      >
                        Áp dụng
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Sort */}
                <Select value={sortBy || 'default'} onValueChange={(v) => setSortBy(v === 'default' ? '' : v)}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SlidersHorizontal className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Sắp xếp" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Mặc định</SelectItem>
                    <SelectItem value="price_asc">Giá thấp đến cao</SelectItem>
                    <SelectItem value="price_desc">Giá cao đến thấp</SelectItem>
                    <SelectItem value="rating">Đánh giá cao nhất</SelectItem>
                    <SelectItem value="popular">Phổ biến nhất</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Active Filters */}
            {hasFilters && (
              <div className="flex flex-wrap gap-2 mb-4">
                {city && (
                  <Badge variant="secondary" className="gap-1">
                    {city}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => setCity('')}
                    />
                  </Badge>
                )}
                {minPrice && (
                  <Badge variant="secondary" className="gap-1">
                    Từ {formatPrice(parseInt(minPrice))}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => setMinPrice('')}
                    />
                  </Badge>
                )}
                {maxPrice && (
                  <Badge variant="secondary" className="gap-1">
                    Đến {formatPrice(parseInt(maxPrice))}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => setMaxPrice('')}
                    />
                  </Badge>
                )}
                {rating && (
                  <Badge variant="secondary" className="gap-1">
                    {rating}+ sao
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => setRating('')}
                    />
                  </Badge>
                )}
              </div>
            )}

            {/* Hotels Grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i}>
                    <Skeleton className="h-48" />
                    <CardContent className="p-4">
                      <Skeleton className="h-5 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/2 mb-4" />
                      <Skeleton className="h-6 w-1/3" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : data?.data && data.data.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {data.data.map((hotel: Hotel) => (
                    <HotelCard key={hotel._id} hotel={hotel} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <Button
                      variant="outline"
                      size="icon"
                      disabled={page === 1}
                      onClick={() => setPage(page - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm">
                      Trang {page} / {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      disabled={page === totalPages}
                      onClick={() => setPage(page + 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <Card className="p-12 text-center">
                <p className="text-muted-foreground mb-4">
                  Không tìm thấy khách sạn nào phù hợp
                </p>
                <Button variant="outline" onClick={clearFilters}>
                  Xóa bộ lọc
                </Button>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function HotelCard({ hotel }: { hotel: Hotel }) {
  const navigate = useNavigate();

  return (
    <Card
      className="overflow-hidden cursor-pointer hover:shadow-lg transition-all group"
      onClick={() => navigate(`/hotels/${hotel._id}`)}
    >
      <div className="relative h-48 overflow-hidden">
        {hotel.images && hotel.images.length > 2 ? (
            <div className="grid grid-cols-2 h-full gap-[1px]">
                <img src={hotel.images[0]} alt={hotel.name} className="w-full h-full object-cover" />
                <div className="grid grid-rows-2 h-full gap-[1px]">
                    <img src={hotel.images[1]} alt={hotel.name} className="w-full h-full object-cover" />
                    <div className="relative">
                        <img src={hotel.images[2]} alt={hotel.name} className="w-full h-full object-cover" />
                        {hotel.images.length > 3 && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-xs font-bold">
                                +{hotel.images.length - 3}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        ) : (
            <img
            src={hotel.images[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400'}
            alt={hotel.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
        )}
        {hotel.rating > 0 && (
          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1 shadow-sm z-10">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-medium">{hotel.rating.toFixed(1)}</span>
          </div>
        )}
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg mb-1 line-clamp-1 group-hover:text-primary transition-colors">
          {hotel.name}
        </h3>
        <p className="text-sm text-muted-foreground flex items-center gap-1 mb-2">
          <MapPin className="h-4 w-4" />
          {hotel.city}
        </p>
        <HtmlContent html={hotel.description} className="line-clamp-2 mb-3" compact />
        <div className="flex items-center justify-between">
          <div>
            <span className="text-lg font-bold text-primary">
              {formatPrice(hotel.priceRange.min)}
            </span>
            <span className="text-sm text-muted-foreground">/đêm</span>
          </div>
          <span className="text-xs text-muted-foreground">
            {hotel.totalReviews} đánh giá
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
