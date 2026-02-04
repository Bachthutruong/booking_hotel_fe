import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Loader2, 
  Plus, 
  Pencil, 
  Trash2, 
  Building2, 
  ChevronLeft, 
  ChevronRight, 
  Image as ImageIcon,
  Search,
  Filter
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { Combobox, type ComboboxItem } from '@/components/ui/combobox';
import { hotelService } from '@/services/hotelService';
import { categoryService } from '@/services/categoryService';
import { toast } from '@/hooks/use-toast';
import type { Room, Hotel, RoomCategory } from '@/types';

export default function RoomsManagePage() {
  const queryClient = useQueryClient();
  const [selectedHotel, setSelectedHotel] = useState<string>('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const [editRoom, setEditRoom] = useState<Room | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteRoom, setDeleteRoom] = useState<Room | null>(null);
  
  // Fetch Hotels for Filter
  const { data: hotelsData } = useQuery({
    queryKey: ['hotels-list'],
    queryFn: () => hotelService.getHotels({ limit: 100 }),
  });

  // Fetch Categories for Filter
  const { data: categoriesData } = useQuery({
    queryKey: ['categories-list'],
    queryFn: () => categoryService.getAllCategories({ limit: 100 }),
  });

  const hotels = hotelsData?.data || [];
  const categories = categoriesData?.data || [];

  // Fetch Rooms (depends on filters)
  const { data: roomsData, isLoading } = useQuery({
    queryKey: ['admin-rooms', selectedHotel, page, limit, search, categoryFilter, statusFilter],
    queryFn: () => selectedHotel ? hotelService.getRooms(selectedHotel, { 
      page, 
      limit,
      search,
      category: categoryFilter,
      isActive: statusFilter
    }) : Promise.resolve({ data: [], success: true, pagination: { page:1, limit:10, total:0, totalPages:0 } }),
    enabled: !!selectedHotel
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => hotelService.deleteRoom(id),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['admin-rooms'] });
        setDeleteRoom(null);
        toast({ title: 'Thành công', description: 'Đã xóa phòng' });
    },
    onError: () => {
        toast({ title: 'Lỗi', description: 'Không thể xóa phòng', variant: 'destructive' });
    }
  });

  const rooms = roomsData?.data || [];
  const pagination = roomsData?.pagination;

  const hotelItems: ComboboxItem[] = hotels.map(h => ({
    value: h._id,
    label: h.name,
  }));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
           <h1 className="text-2xl font-bold">Quản lý phòng</h1>
           <p className="text-muted-foreground">
             {selectedHotel ? `${pagination?.total || 0} phòng` : 'Vui lòng chọn khách sạn để xem danh sách phòng'}
           </p>
        </div>
        {selectedHotel && (
            <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Thêm phòng
            </Button>
        )}
      </div>

      <div className="flex flex-col gap-4">
        {/* Hotel Selection - Combobox */}
        <div className="w-full max-w-sm">
          <Combobox
            items={hotelItems}
            value={selectedHotel}
            onChange={(val) => { setSelectedHotel(val); setPage(1); }}
            placeholder="Chọn khách sạn..."
            searchPlaceholder="Tìm kiếm khách sạn..."
            emptyText="Không tìm thấy khách sạn."
          />
        </div>

        {selectedHotel && (
          <div className="flex flex-wrap gap-4 items-center bg-white p-4 rounded-lg border shadow-sm">
            {/* Search */}
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm tên phòng..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-8"
              />
            </div>

            {/* Category Filter */}
            <div className="w-full md:w-48">
              <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setPage(1); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Loại phòng" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả loại phòng</SelectItem>
                  {categories.map((cat: RoomCategory) => (
                    <SelectItem key={cat._id} value={cat._id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div className="w-full md:w-40">
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  <SelectItem value="true">Đang hoạt động</SelectItem>
                  <SelectItem value="false">Đã ẩn</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Limit Filter */}
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-sm text-muted-foreground hidden md:inline">Hiển thị:</span>
              <Select value={limit.toString()} onValueChange={(v) => { setLimit(Number(v)); setPage(1); }}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>

      {!selectedHotel ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 border rounded-xl border-dashed">
              <Building2 className="w-16 h-16 mb-4 opacity-50" />
              <p>Chọn một khách sạn để bắt đầu quản lý phòng</p>
          </div>
      ) : isLoading ? (
        <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
      ) : (
        <>
          <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="w-[80px]">Ảnh</TableHead>
                  <TableHead>Tên phòng</TableHead>
                  <TableHead>Loại</TableHead>
                  <TableHead>Giá (VND)</TableHead>
                  <TableHead>Số lượng</TableHead>
                  <TableHead>Sức chứa</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rooms.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                            Không tìm thấy phòng nào phù hợp.
                        </TableCell>
                    </TableRow>
                ) : (
                    rooms.map((room: Room) => (
                      <TableRow key={room._id}>
                      <TableCell>
                          <div className="w-16 h-12 bg-gray-100 rounded overflow-hidden grid grid-cols-2 gap-[1px]">
                              {room.images && room.images.length > 0 ? (
                                  <>
                                      <img src={room.images[0]} className={`w-full h-full object-cover ${room.images.length === 1 ? 'col-span-2' : ''}`} alt="" />
                                      {room.images.length > 1 && <img src={room.images[1]} className="w-full h-full object-cover" alt="" />}
                                  </>
                              ) : (
                                  <div className="col-span-2 flex items-center justify-center text-xs text-gray-400">No img</div>
                              )}
                          </div>
                      </TableCell>
                      <TableCell className="font-medium">{room.name}</TableCell>
                      <TableCell className="capitalize">
                          {typeof room.category === 'object' && room.category?.name ? room.category.name : room.type}
                      </TableCell>
                      <TableCell>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(room.price)}</TableCell>
                      <TableCell>{room.quantity}</TableCell>
                      <TableCell>
                          {room.capacity.adults} lớn, {room.capacity.children} trẻ
                      </TableCell>
                      <TableCell>
                          <Badge variant={room.isActive ? 'default' : 'secondary'} className={room.isActive ? 'bg-green-600' : 'bg-gray-400'}>
                              {room.isActive ? 'Hoạt động' : 'Ẩn'}
                          </Badge>
                      </TableCell>
                      <TableCell>
                          <div className="flex gap-2">
                             <Button variant="ghost" size="icon" onClick={() => setEditRoom(room)}>
                                <Pencil className="h-4 w-4" />
                             </Button>
                             <Button variant="ghost" size="icon" className="text-red-500" onClick={() => setDeleteRoom(room)}>
                                <Trash2 className="h-4 w-4" />
                             </Button>
                          </div>
                      </TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
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
      )}

      {/* Forms */}
      <RoomFormDialog 
        open={isCreateOpen || !!editRoom}
        onOpenChange={(open) => {
            if (!open) {
                setIsCreateOpen(false);
                setEditRoom(null);
            }
        }}
        hotelId={selectedHotel}
        room={editRoom}
        onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['admin-rooms'] });
            setIsCreateOpen(false);
            setEditRoom(null);
        }}
      />

        <AlertDialog open={!!deleteRoom} onOpenChange={() => setDeleteRoom(null)}>
            <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Xác nhận xóa?</AlertDialogTitle>
                <AlertDialogDescription>
                Bạn có chắc chắn muốn xóa phòng "{deleteRoom?.name}"? Hành động này không thể hoàn tác.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Hủy</AlertDialogCancel>
                <AlertDialogAction
                className="bg-red-600 hover:bg-red-700"
                onClick={() => deleteRoom && deleteMutation.mutate(deleteRoom._id)}
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

function RoomFormDialog({
    open, onOpenChange, hotelId, room, onSuccess
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    hotelId: string;
    room: Room | null;
    onSuccess: () => void;
}) {
    // Fetch room categories
    const { data: categoriesData } = useQuery({
        queryKey: ['room-categories'],
        queryFn: () => categoryService.getCategories(),
    });
    
    const categories = categoriesData?.data || [];

    const getRoomCategoryId = (room: Room | null): string => {
        if (!room?.category) return '';
        if (typeof room.category === 'string') return room.category;
        return room.category._id || '';
    };

    const [formData, setFormData] = useState({
        name: room?.name || '',
        description: room?.description || '',
        price: room?.price || 0,
        category: getRoomCategoryId(room),
        quantity: room?.quantity || 1,
        adults: room?.capacity.adults || 2,
        children: room?.capacity.children || 0,
        amenities: room?.amenities?.join(', ') || ''
    });
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Initialize when room changes
    useState(() => {
        if (room) {
            setFormData({
                name: room.name,
                description: room.description,
                price: room.price,
                category: getRoomCategoryId(room),
                quantity: room.quantity,
                adults: room.capacity.adults,
                children: room.capacity.children,
                amenities: room.amenities.join(', ')
            });
        }
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            setSelectedFiles(prev => [...prev, ...files]);
            const newPreviews = files.map(file => URL.createObjectURL(file));
            setPreviewUrls(prev => [...prev, ...newPreviews]);
        }
    };

    const removeFile = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
        setPreviewUrls(prev => {
            URL.revokeObjectURL(prev[index]);
            return prev.filter((_, i) => i !== index);
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const data = {
                ...formData,
                amenities: formData.amenities.split(',').map(a => a.trim()).filter(Boolean),
                capacity: {
                    adults: Number(formData.adults),
                    children: Number(formData.children)
                },
                price: Number(formData.price),
                quantity: Number(formData.quantity)
            };

            let result;
            if (room) {
                // Update
                result = await hotelService.updateRoom(room._id, data);
                 if (selectedFiles.length > 0) {
                   await hotelService.uploadRoomImages(room._id, selectedFiles);
                }
            } else {
                // Create
                const response = await hotelService.createRoom(hotelId, data);
                if (response.data && selectedFiles.length > 0) {
                    await hotelService.uploadRoomImages(response.data._id, selectedFiles);
                }
            }
            setSelectedFiles([]);
            setPreviewUrls([]);
            toast({ 
                title: 'Thành công', 
                description: room ? 'Đã cập nhật phòng' : 'Đã tạo phòng mới' 
            });
            onSuccess();
        } catch (error) {
            console.error(error);
            toast({ 
                title: 'Lỗi', 
                description: 'Không thể lưu phòng', 
                variant: 'destructive' 
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{room ? 'Sửa thông tin phòng' : 'Thêm phòng mới'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                             <Label>Tên phòng</Label>
                             <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                        </div>
                        <div className="space-y-2">
                             <Label>Loại phòng</Label>
                             <Select value={formData.category} onValueChange={v => setFormData({...formData, category: v})}>
                                 <SelectTrigger>
                                     <SelectValue placeholder="Chọn loại phòng..." />
                                 </SelectTrigger>
                                 <SelectContent>
                                     {categories.length > 0 ? (
                                         categories.map((cat: RoomCategory) => (
                                             <SelectItem key={cat._id} value={cat._id}>
                                                 {cat.name}
                                             </SelectItem>
                                         ))
                                     ) : (
                                         <SelectItem value="none" disabled>
                                             Chưa có danh mục phòng
                                         </SelectItem>
                                     )}
                                 </SelectContent>
                             </Select>
                             {categories.length === 0 && (
                                 <p className="text-xs text-amber-600">
                                     Vui lòng tạo danh mục phòng trước khi thêm phòng mới.
                                 </p>
                             )}
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                             <Label>Giá (VND)</Label>
                             <Input type="number" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} required />
                        </div>
                        <div className="space-y-2">
                             <Label>Số lượng phòng</Label>
                             <Input type="number" value={formData.quantity} onChange={e => setFormData({...formData, quantity: Number(e.target.value)})} required />
                        </div>
                         <div className="space-y-2">
                             <Label>Sức chứa (Người lớn / Trẻ em)</Label>
                             <div className="flex gap-2">
                                <Input type="number" placeholder="Lớn" value={formData.adults} onChange={e => setFormData({...formData, adults: Number(e.target.value)})} required />
                                <Input type="number" placeholder="Trẻ" value={formData.children} onChange={e => setFormData({...formData, children: Number(e.target.value)})} required />
                             </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Mô tả</Label>
                        <RichTextEditor
                            value={formData.description}
                            onChange={(value) => setFormData({...formData, description: value})}
                            placeholder="Nhập mô tả phòng..."
                            height={200}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Tiện nghi (phân cách dấu phẩy)</Label>
                        <Input value={formData.amenities} onChange={e => setFormData({...formData, amenities: e.target.value})} placeholder="TV, Máy lạnh, Tủ lạnh..." />
                    </div>

                    <div className="space-y-2">
                        <Label>Hình ảnh</Label>
                        <div className="grid grid-cols-4 gap-2">
                            {room?.images?.map((img, i) => (
                                <div key={`old-${i}`} className="aspect-square relative rounded border overflow-hidden">
                                    <img src={img} className="w-full h-full object-cover" />
                                </div>
                            ))}
                            {previewUrls.map((url, i) => (
                                <div key={`new-${i}`} className="aspect-square relative rounded border overflow-hidden group">
                                    <img src={url} className="w-full h-full object-cover" />
                                    <button type="button" onClick={() => removeFile(i)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                            <label className="aspect-square border-2 border-dashed rounded flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50">
                                <ImageIcon className="w-6 h-6 text-gray-400" />
                                <span className="text-xs text-gray-500 mt-1">Thêm ảnh</span>
                                <input type="file" multiple className="hidden" accept="image/*" onChange={handleFileChange} />
                            </label>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
                        <Button type="submit" disabled={isLoading || categories.length === 0}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {room ? 'Cập nhật' : 'Tạo mới'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
