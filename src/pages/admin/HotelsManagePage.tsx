import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  MoreHorizontal,
  MapPin,
  Star,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Image as ImageIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { hotelService } from '@/services/hotelService';
import { formatPrice } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import type { Hotel } from '@/types';

export function HotelsManagePage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [editHotel, setEditHotel] = useState<Hotel | null>(null);
  const [deleteHotel, setDeleteHotel] = useState<Hotel | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['adminHotels', { search, page, limit }],
    queryFn: () => hotelService.getHotels({ search: search || undefined, page, limit }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => hotelService.deleteHotel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminHotels'] });
      setDeleteHotel(null);
      toast({ title: 'Thành công', description: 'Đã xóa khách sạn' });
    },
    onError: () => {
      toast({ title: 'Lỗi', description: 'Không thể xóa khách sạn', variant: 'destructive' });
    },
  });

  const hotels = data?.data || [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Quản lý khách sạn</h1>
          <p className="text-muted-foreground">
            {pagination?.total || 0} khách sạn
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Thêm khách sạn
        </Button>
      </div>

      {/* Search */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm khách sạn..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Hiển thị:</span>
          <Select value={limit.toString()} onValueChange={(v) => { setLimit(Number(v)); setPage(1); }}>
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="6">6</SelectItem>
              <SelectItem value="12">12</SelectItem>
              <SelectItem value="24">24</SelectItem>
              <SelectItem value="48">48</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">mục</span>
        </div>
      </div>

      {/* Hotels List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <Skeleton className="h-40" />
              <CardContent className="p-4">
                <Skeleton className="h-5 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : hotels.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {hotels.map((hotel: Hotel) => (
              <Card key={hotel._id} className="group overflow-hidden hover:shadow-lg transition-all duration-300 border-border/50">
                {/* Image Gallery Grid */}
                <div className="relative h-56 bg-gray-100">
                  {hotel.images && hotel.images.length > 0 ? (
                    <div className="w-full h-full grid grid-cols-4 grid-rows-2 gap-1 p-1">
                      {/* Main Image - Large (Left) */}
                      <div className={`relative ${hotel.images.length === 1 ? 'col-span-4 row-span-2' : 'col-span-3 row-span-2'} rounded-l-md overflow-hidden`}>
                        <img
                          src={hotel.images[0]}
                          alt={hotel.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                      
                      {/* Secondary Images (Right Column) */}
                      {hotel.images.length > 1 && (
                        <div className="col-span-1 row-span-2 flex flex-col gap-1">
                             <div className="relative h-full rounded-tr-md overflow-hidden">
                                <img
                                  src={hotel.images[1]}
                                  alt={hotel.name}
                                  className="w-full h-full object-cover"
                                />
                             </div>
                             {hotel.images.length > 2 && (
                                <div className="relative h-full rounded-br-md overflow-hidden">
                                    <img
                                      src={hotel.images[2]}
                                      alt={hotel.name}
                                      className="w-full h-full object-cover"
                                    />
                                    {hotel.images.length > 3 && (
                                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                        <span className="text-white text-xs font-bold">+{hotel.images.length - 3}</span>
                                      </div>
                                    )}
                                </div>
                             )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-full h-full bg-secondary/50 flex items-center justify-center">
                      <ImageIcon className="h-12 w-12 text-muted-foreground/30" />
                    </div>
                  )}
                  
                  {/* Status Badge */}
                  <Badge
                    className={`absolute top-3 left-3 shadow-sm ${
                      hotel.isActive 
                        ? 'bg-green-500 hover:bg-green-600' 
                        : 'bg-zinc-500 hover:bg-zinc-600'
                    }`}
                  >
                    {hotel.isActive ? 'Hoạt động' : 'Đã ẩn'}
                  </Badge>
                </div>

                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="space-y-1 min-w-0">
                      <h3 className="font-bold text-lg leading-tight truncate" title={hotel.name}>
                        {hotel.name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{hotel.city || 'Chưa cập nhật'}</span>
                      </div>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="-mr-2 h-8 w-8 text-muted-foreground hover:text-foreground">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditHotel(hotel)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Chỉnh sửa
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setDeleteHotel(hotel)}
                          className="text-red-600 focus:text-red-600 focus:bg-red-50"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Xóa
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="flex items-end justify-between pt-3 border-t border-border/50">
                    <div className="flex items-center gap-1.5 bg-secondary/50 px-2 py-1 rounded-md">
                      <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-semibold">{hotel.rating.toFixed(1)}</span>
                      <span className="text-xs text-muted-foreground">({hotel.totalReviews})</span>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground mb-0.5">Giá từ</div>
                      <div className="font-bold text-lg text-primary">
                        {formatPrice(hotel.priceRange.min)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="icon"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm">
                Trang {page} / {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                disabled={page === pagination.totalPages}
                onClick={() => setPage(page + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      ) : (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">Không tìm thấy khách sạn nào</p>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <HotelFormDialog
        open={isCreateOpen || !!editHotel}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateOpen(false);
            setEditHotel(null);
          }
        }}
        hotel={editHotel}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['adminHotels'] });
          setIsCreateOpen(false);
          setEditHotel(null);
        }}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteHotel} onOpenChange={() => setDeleteHotel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa khách sạn "{deleteHotel?.name}"? Hành động
              này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deleteHotel && deleteMutation.mutate(deleteHotel._id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Hotel Form Dialog Component
function HotelFormDialog({
  open,
  onOpenChange,
  hotel,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hotel: Hotel | null;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    name: hotel?.name || '',
    description: hotel?.description || '',
    address: hotel?.address || '',
    city: hotel?.city || '',
    amenities: hotel?.amenities?.join(', ') || '',
  });
  const [currentImages, setCurrentImages] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize form when hotel changes
  useEffect(() => {
    if (open) {
      if (hotel) {
        setFormData({
          name: hotel.name,
          description: hotel.description,
          address: hotel.address,
          city: hotel.city,
          amenities: hotel.amenities.join(', '),
        });
        setCurrentImages(hotel.images || []);
      } else {
        setFormData({
          name: '',
          description: '',
          address: '',
          city: '',
          amenities: '',
        });
        setCurrentImages([]);
      }
      setSelectedFiles([]);
      setPreviewUrls([]);
    }
  }, [hotel, open]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...files]);
      
      const newPreviews = files.map(file => URL.createObjectURL(file));
      setPreviewUrls((prev) => [...prev, ...newPreviews]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => {
      // Revoke old url to memory leak
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const removeExistingImage = (index: number) => {
    setCurrentImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const data = {
        ...formData,
        amenities: formData.amenities.split(',').map((a) => a.trim()).filter(Boolean),
        images: currentImages,
      };

      let result;
      if (hotel) {
        // Update hotel with existing (potentially removed) images first
        result = await hotelService.updateHotel(hotel._id, data);
        // Then upload new images if any
        if (selectedFiles.length > 0) {
           await hotelService.uploadHotelImages(hotel._id, selectedFiles);
        }
      } else {
        // Create hotel
        const response = await hotelService.createHotel(data);
        // Upload images for new hotel
        if (response.data && selectedFiles.length > 0) {
          await hotelService.uploadHotelImages(response.data._id, selectedFiles);
        }
      }
      
      // Clear selections
      setSelectedFiles([]);
      setPreviewUrls([]);
      toast({ 
        title: 'Thành công', 
        description: hotel ? 'Đã cập nhật khách sạn' : 'Đã tạo khách sạn mới' 
      });
      onSuccess();
    } catch (error) {
      console.error('Error saving hotel:', error);
      toast({ 
        title: 'Lỗi', 
        description: 'Không thể lưu khách sạn', 
        variant: 'destructive' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {hotel ? 'Sửa khách sạn' : 'Thêm khách sạn mới'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Tên khách sạn</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">Thành phố</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Địa chỉ</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Mô tả</Label>
            <RichTextEditor
              value={formData.description}
              onChange={(value) => setFormData({ ...formData, description: value })}
              placeholder="Nhập mô tả khách sạn..."
              height={250}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amenities">Tiện nghi (phân cách bằng dấu phẩy)</Label>
            <Input
              id="amenities"
              value={formData.amenities}
              onChange={(e) => setFormData({ ...formData, amenities: e.target.value })}
              placeholder="Wifi miễn phí, Hồ bơi, Spa, Nhà hàng"
            />
          </div>

          <div className="space-y-2">
             <Label>Hình ảnh</Label>
             <div className="grid grid-cols-4 gap-2 mb-2">
                {/* Existing Images (Edit Mode) */}
                {currentImages.map((img, i) => (
                  <div key={`existing-${i}`} className="relative group aspect-square rounded-md overflow-hidden border">
                    <img src={img} alt={`Existing ${i}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeExistingImage(i)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Xóa ảnh này"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                    <Badge className="absolute bottom-1 left-1 px-1 py-0 text-[10px] bg-black/50 hover:bg-black/70">
                        Cũ
                    </Badge>
                  </div>
                ))}
                
                {/* New Images Preview */}
                {previewUrls.map((url, i) => (
                  <div key={`new-${i}`} className="relative group aspect-square rounded-md overflow-hidden border">
                    <img src={url} alt={`Preview ${i}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Xóa ảnh này"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                    <Badge className="absolute bottom-1 left-1 px-1 py-0 text-[10px] bg-green-500 hover:bg-green-600">
                        Mới
                    </Badge>
                  </div>
                ))}
                
                <label className="flex flex-col items-center justify-center border-2 border-dashed rounded-md aspect-square cursor-pointer hover:bg-muted/50 transition-colors">
                  <ImageIcon className="h-6 w-6 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground mt-1">Thêm ảnh</span>
                  <input
                    type="file"
                    className="hidden"
                    multiple
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </label>
             </div>
             <p className="text-xs text-muted-foreground">
                * Upload ảnh mới để thêm vào danh sách. Nhấn nút xóa để loại bỏ ảnh không mong muốn.
             </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {hotel ? 'Cập nhật' : 'Tạo mới'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
