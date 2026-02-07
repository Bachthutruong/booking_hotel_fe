import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Gift, Percent, Calendar, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { promotionService } from '@/services/promotionService';
import { hotelService } from '@/services/hotelService';
import { useToast } from '@/hooks/use-toast';
import { formatPrice } from '@/lib/utils';
import type { PromotionConfig, Hotel, Room } from '@/types';

const formatDate = (date?: string) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('vi-VN');
};

export default function PromotionsManagePage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<PromotionConfig | null>(null);
  const [deletePromotion, setDeletePromotion] = useState<PromotionConfig | null>(null);
  const [page, setPage] = useState(1);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    hotel: '',
    room: '',
    depositAmount: '',
    bonusAmount: '',
    bonusPercent: '',
    maxBonus: '',
    startDate: '',
    endDate: '',
    isActive: true,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['adminPromotions', page],
    queryFn: () => promotionService.getAllPromotions({ page, limit: 10 }),
  });

  const { data: hotelsData } = useQuery({
    queryKey: ['hotelsForPromotion'],
    queryFn: () => hotelService.getHotels({ limit: 100 }),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => promotionService.createPromotion(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminPromotions'] });
      toast({ title: 'Thành công', description: 'Đã tạo khuyến mãi mới' });
      closeDialog();
    },
    onError: () => {
      toast({ title: 'Lỗi', description: 'Không thể tạo khuyến mãi', variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => promotionService.updatePromotion(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminPromotions'] });
      toast({ title: 'Thành công', description: 'Đã cập nhật khuyến mãi' });
      closeDialog();
    },
    onError: () => {
      toast({ title: 'Lỗi', description: 'Không thể cập nhật khuyến mãi', variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => promotionService.deletePromotion(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminPromotions'] });
      toast({ title: 'Thành công', description: 'Đã xóa khuyến mãi' });
      setDeletePromotion(null);
    },
    onError: () => {
      toast({ title: 'Lỗi', description: 'Không thể xóa khuyến mãi', variant: 'destructive' });
    },
  });

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingPromotion(null);
    setFormData({
      name: '',
      description: '',
      hotel: '',
      room: '',
      depositAmount: '',
      bonusAmount: '',
      bonusPercent: '',
      maxBonus: '',
      startDate: '',
      endDate: '',
      isActive: true,
    });
  };

  const openEditDialog = (promotion: PromotionConfig) => {
    setEditingPromotion(promotion);
    setFormData({
      name: promotion.name,
      description: promotion.description || '',
      hotel: typeof promotion.hotel === 'object' ? promotion.hotel?._id : promotion.hotel || '',
      room: typeof promotion.room === 'object' ? promotion.room?._id : promotion.room || '',
      depositAmount: promotion.depositAmount.toString(),
      bonusAmount: promotion.bonusAmount?.toString() || '',
      bonusPercent: promotion.bonusPercent?.toString() || '',
      maxBonus: promotion.maxBonus?.toString() || '',
      startDate: promotion.startDate ? new Date(promotion.startDate).toISOString().split('T')[0] : '',
      endDate: promotion.endDate ? new Date(promotion.endDate).toISOString().split('T')[0] : '',
      isActive: promotion.isActive,
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.depositAmount) {
      toast({ title: 'Lỗi', description: 'Vui lòng nhập tên và mức nạp tối thiểu', variant: 'destructive' });
      return;
    }

    if (!formData.bonusAmount && !formData.bonusPercent) {
      toast({ title: 'Lỗi', description: 'Vui lòng nhập số tiền hoặc % khuyến mãi', variant: 'destructive' });
      return;
    }

    const submitData = {
      name: formData.name,
      description: formData.description,
      hotel: formData.hotel || undefined,
      room: formData.room || undefined,
      depositAmount: Number(formData.depositAmount),
      bonusAmount: formData.bonusAmount ? Number(formData.bonusAmount) : 0,
      bonusPercent: formData.bonusPercent ? Number(formData.bonusPercent) : undefined,
      maxBonus: formData.maxBonus ? Number(formData.maxBonus) : undefined,
      startDate: formData.startDate || undefined,
      endDate: formData.endDate || undefined,
      isActive: formData.isActive,
    };

    if (editingPromotion) {
      updateMutation.mutate({ id: editingPromotion._id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const promotions = data?.data || [];
  const pagination = data?.pagination;
  const hotels = hotelsData?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Cấu hình khuyến mãi nạp tiền</h1>
          <p className="text-muted-foreground">Quản lý các chương trình khuyến mãi khi nạp tiền</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Thêm khuyến mãi
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="text-center py-8">Đang tải...</div>
          ) : promotions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Chưa có khuyến mãi nào</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tên</TableHead>
                    <TableHead>Mức nạp tối thiểu</TableHead>
                    <TableHead>Khuyến mãi</TableHead>
                    <TableHead>Thời gian</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {promotions.map((promo: PromotionConfig) => (
                    <TableRow key={promo._id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{promo.name}</p>
                          {promo.description && (
                            <p className="text-sm text-muted-foreground truncate max-w-[200px]">{promo.description}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">{formatPrice(promo.depositAmount)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {promo.bonusPercent ? (
                            <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                              <Percent className="h-3 w-3 mr-1" /> {promo.bonusPercent}%
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-green-100 text-green-700">
                              <Gift className="h-3 w-3 mr-1" /> +{formatPrice(promo.bonusAmount)}
                            </Badge>
                          )}
                          {promo.maxBonus && (
                            <span className="text-xs text-muted-foreground">(tối đa {formatPrice(promo.maxBonus)})</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {promo.startDate || promo.endDate ? (
                          <div className="text-sm">
                            {formatDate(promo.startDate)} - {formatDate(promo.endDate)}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Không giới hạn</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={promo.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                          {promo.isActive ? 'Hoạt động' : 'Tắt'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => openEditDialog(promo)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setDeletePromotion(promo)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {pagination && pagination.totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                  <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>
                    Trước
                  </Button>
                  <span className="px-4 py-2 text-sm">Trang {page} / {pagination.totalPages}</span>
                  <Button variant="outline" size="sm" disabled={page === pagination.totalPages} onClick={() => setPage(page + 1)}>
                    Sau
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingPromotion ? 'Sửa khuyến mãi' : 'Thêm khuyến mãi mới'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <div>
              <Label>Tên khuyến mãi *</Label>
              <Input
                placeholder="VD: Nạp 500k tặng 50k"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div>
              <Label>Mô tả</Label>
              <Textarea
                placeholder="Mô tả chi tiết..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div>
              <Label>Mức nạp tối thiểu *</Label>
              <Input
                type="number"
                placeholder="VD: 500000"
                value={formData.depositAmount}
                onChange={(e) => setFormData({ ...formData, depositAmount: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Số tiền khuyến mãi cố định</Label>
                <Input
                  type="number"
                  placeholder="VD: 50000"
                  value={formData.bonusAmount}
                  onChange={(e) => setFormData({ ...formData, bonusAmount: e.target.value })}
                />
              </div>
              <div>
                <Label>Hoặc % khuyến mãi</Label>
                <Input
                  type="number"
                  placeholder="VD: 10"
                  value={formData.bonusPercent}
                  onChange={(e) => setFormData({ ...formData, bonusPercent: e.target.value })}
                />
              </div>
            </div>

            {formData.bonusPercent && (
              <div>
                <Label>Khuyến mãi tối đa (nếu dùng %)</Label>
                <Input
                  type="number"
                  placeholder="VD: 100000"
                  value={formData.maxBonus}
                  onChange={(e) => setFormData({ ...formData, maxBonus: e.target.value })}
                />
              </div>
            )}

            <div>
              <Label>Áp dụng cho khách sạn (không bắt buộc)</Label>
              <Select value={formData.hotel || 'all'} onValueChange={(v) => setFormData({ ...formData, hotel: v === 'all' ? '' : v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Tất cả khách sạn" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả khách sạn</SelectItem>
                  {hotels.map((hotel: Hotel) => (
                    <SelectItem key={hotel._id} value={hotel._id}>{hotel.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Ngày bắt đầu</Label>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div>
                <Label>Ngày kết thúc</Label>
                <Input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label>Trạng thái hoạt động</Label>
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Hủy</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
              {createMutation.isPending || updateMutation.isPending ? 'Đang lưu...' : editingPromotion ? 'Cập nhật' : 'Tạo mới'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletePromotion} onOpenChange={() => setDeletePromotion(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa khuyến mãi "{deletePromotion?.name}"? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletePromotion && deleteMutation.mutate(deletePromotion._id)}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
