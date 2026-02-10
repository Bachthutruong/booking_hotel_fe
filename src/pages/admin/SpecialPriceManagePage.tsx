import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Percent, Calendar, Loader2 } from 'lucide-react';
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
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { specialPriceService } from '@/services/specialPriceService';
import { hotelService } from '@/services/hotelService';
import { useToast } from '@/hooks/use-toast';
import { useCanDelete } from '@/hooks/useCanDelete';
import { formatPrice } from '@/lib/utils';
import type { RoomSpecialPrice, Hotel, Room } from '@/types';

const formatDate = (date?: string) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('vi-VN');
};

export default function SpecialPriceManagePage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const canDelete = useCanDelete();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<RoomSpecialPrice | null>(null);
  const [deleteRule, setDeleteRule] = useState<RoomSpecialPrice | null>(null);
  const [page, setPage] = useState(1);

  const [formData, setFormData] = useState({
    name: '',
    hotelId: '',
    roomIds: [] as string[],
    type: 'weekend' as 'date_range' | 'weekend',
    startDate: '',
    endDate: '',
    modifierType: 'percentage' as 'percentage' | 'fixed',
    modifierValue: '',
    isActive: true,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['adminSpecialPrices', page],
    queryFn: () => specialPriceService.getList({ page, limit: 10 }),
  });

  const { data: hotelsData } = useQuery({
    queryKey: ['hotelsForSpecialPrice'],
    queryFn: () => hotelService.getHotels({ limit: 100 }),
  });

  const { data: roomsData } = useQuery({
    queryKey: ['roomsForSpecialPrice', formData.hotelId],
    queryFn: () => hotelService.getRooms(formData.hotelId, { limit: 100 }),
    enabled: !!formData.hotelId,
  });

  const hotels = hotelsData?.data || [];
  const rooms = roomsData?.data || [];
  const rules = data?.data || [];

  const createMutation = useMutation({
    mutationFn: (body: Parameters<typeof specialPriceService.create>[0]) => specialPriceService.create(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminSpecialPrices'] });
      toast({ title: 'Thành công', description: 'Đã tạo rule giá đặc biệt' });
      closeDialog();
    },
    onError: () => {
      toast({ title: 'Lỗi', description: 'Không thể tạo rule', variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof specialPriceService.update>[1] }) =>
      specialPriceService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminSpecialPrices'] });
      toast({ title: 'Thành công', description: 'Đã cập nhật rule' });
      closeDialog();
    },
    onError: () => {
      toast({ title: 'Lỗi', description: 'Không thể cập nhật', variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => specialPriceService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminSpecialPrices'] });
      toast({ title: 'Thành công', description: 'Đã xóa rule' });
      setDeleteRule(null);
    },
    onError: () => {
      toast({ title: 'Lỗi', description: 'Không thể xóa', variant: 'destructive' });
    },
  });

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingRule(null);
    setFormData({
      name: '',
      hotelId: '',
      roomIds: [],
      type: 'weekend',
      startDate: '',
      endDate: '',
      modifierType: 'percentage',
      modifierValue: '',
      isActive: true,
    });
  };

  const openEditDialog = (rule: RoomSpecialPrice) => {
    const roomIds = Array.isArray(rule.rooms)
      ? rule.rooms.map((r) => (typeof r === 'object' && r && '_id' in r ? r._id : r)).filter(Boolean) as string[]
      : [];
    const firstRoom = rule.rooms?.[0];
    const hotelRef =
      typeof firstRoom === 'object' && firstRoom && 'hotel' in firstRoom
        ? (firstRoom as Room).hotel
        : undefined;
    const hotelId =
      hotelRef == null
        ? ''
        : typeof hotelRef === 'object' && hotelRef && '_id' in hotelRef
          ? (hotelRef as { _id: string })._id
          : typeof hotelRef === 'string'
            ? hotelRef
            : '';
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      hotelId: hotelId || '',
      roomIds,
      type: rule.type,
      startDate: rule.startDate ? new Date(rule.startDate).toISOString().split('T')[0] : '',
      endDate: rule.endDate ? new Date(rule.endDate).toISOString().split('T')[0] : '',
      modifierType: rule.modifierType,
      modifierValue: String(rule.modifierValue),
      isActive: rule.isActive,
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast({ title: 'Lỗi', description: 'Vui lòng nhập tên rule', variant: 'destructive' });
      return;
    }
    if (formData.roomIds.length === 0) {
      toast({ title: 'Lỗi', description: 'Vui lòng chọn ít nhất một phòng', variant: 'destructive' });
      return;
    }
    const modifierValue = Number(formData.modifierValue);
    if (Number.isNaN(modifierValue)) {
      toast({ title: 'Lỗi', description: 'Giá trị điều chỉnh không hợp lệ', variant: 'destructive' });
      return;
    }
    if (formData.type === 'date_range') {
      if (!formData.startDate || !formData.endDate) {
        toast({ title: 'Lỗi', description: 'Chọn khoảng ngày cho rule theo ngày', variant: 'destructive' });
        return;
      }
      if (new Date(formData.startDate) > new Date(formData.endDate)) {
        toast({ title: 'Lỗi', description: 'Ngày bắt đầu phải trước ngày kết thúc', variant: 'destructive' });
        return;
      }
    }

    if (editingRule) {
      updateMutation.mutate({
        id: editingRule._id,
        data: {
          name: formData.name.trim(),
          rooms: formData.roomIds,
          type: formData.type,
          startDate: formData.type === 'date_range' ? formData.startDate : undefined,
          endDate: formData.type === 'date_range' ? formData.endDate : undefined,
          modifierType: formData.modifierType,
          modifierValue,
          isActive: formData.isActive,
        },
      });
    } else {
      createMutation.mutate({
        name: formData.name.trim(),
        rooms: formData.roomIds,
        type: formData.type,
        startDate: formData.type === 'date_range' ? formData.startDate : undefined,
        endDate: formData.type === 'date_range' ? formData.endDate : undefined,
        modifierType: formData.modifierType,
        modifierValue,
        isActive: formData.isActive,
      });
    }
  };

  const toggleRoom = (roomId: string) => {
    setFormData((prev) => ({
      ...prev,
      roomIds: prev.roomIds.includes(roomId)
        ? prev.roomIds.filter((id) => id !== roomId)
        : [...prev.roomIds, roomId],
    }));
  };

  const selectAllRooms = () => {
    if (rooms.length === 0) return;
    const allIds = rooms.map((r) => r._id);
    setFormData((prev) => ({
      ...prev,
      roomIds: prev.roomIds.length === allIds.length ? [] : allIds,
    }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Giá đặc biệt theo phòng</CardTitle>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Thêm rule
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : rules.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Chưa có rule giá đặc biệt nào</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên</TableHead>
                  <TableHead>Loại</TableHead>
                  <TableHead>Số phòng</TableHead>
                  <TableHead>Điều chỉnh</TableHead>
                  <TableHead>Thời gian</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map((rule) => (
                  <TableRow key={rule._id}>
                    <TableCell className="font-medium">{rule.name}</TableCell>
                    <TableCell>
                      <Badge variant={rule.type === 'weekend' ? 'secondary' : 'outline'}>
                        {rule.type === 'weekend' ? 'Cuối tuần' : 'Khoảng ngày'}
                      </Badge>
                    </TableCell>
                    <TableCell>{(rule.rooms || []).length} phòng</TableCell>
                    <TableCell>
                      {rule.modifierType === 'percentage'
                        ? `+${rule.modifierValue}%`
                        : `+${formatPrice(rule.modifierValue)}`}
                    </TableCell>
                    <TableCell>
                      {rule.type === 'date_range' && rule.startDate && rule.endDate
                        ? `${formatDate(rule.startDate)} - ${formatDate(rule.endDate)}`
                        : rule.type === 'weekend'
                          ? 'Tất cả T7, CN'
                          : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={rule.isActive ? 'default' : 'secondary'}>
                        {rule.isActive ? 'Bật' : 'Tắt'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(rule)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      {canDelete && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => setDeleteRule(rule)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingRule ? 'Chỉnh sửa rule giá đặc biệt' : 'Thêm rule giá đặc biệt'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Tên rule</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                placeholder="VD: Giá cuối tuần, Lễ 30/4"
              />
            </div>

            <div>
              <Label>Khách sạn (chọn để load phòng)</Label>
              <Select
                value={formData.hotelId}
                onValueChange={(v) =>
                  setFormData((p) => ({ ...p, hotelId: v, roomIds: [] }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn khách sạn" />
                </SelectTrigger>
                <SelectContent>
                  {hotels.map((h) => (
                    <SelectItem key={h._id} value={h._id}>
                      {h.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.hotelId && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Chọn phòng (áp dụng cho nhiều phòng)</Label>
                  <Button type="button" variant="link" size="sm" onClick={selectAllRooms}>
                    {formData.roomIds.length === rooms.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                  </Button>
                </div>
                <ScrollArea className="h-40 border rounded-md p-2">
                  <div className="space-y-2">
                    {rooms.map((room) => (
                      <div key={room._id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`room-${room._id}`}
                          checked={formData.roomIds.includes(room._id)}
                          onCheckedChange={() => toggleRoom(room._id)}
                        />
                        <label
                          htmlFor={`room-${room._id}`}
                          className="text-sm cursor-pointer flex-1"
                        >
                          {room.name} - {formatPrice(room.price)}/đêm
                        </label>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            <div>
              <Label>Loại rule</Label>
              <Select
                value={formData.type}
                onValueChange={(v: 'date_range' | 'weekend') =>
                  setFormData((p) => ({ ...p, type: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekend">Cuối tuần (T7, CN)</SelectItem>
                  <SelectItem value="date_range">Khoảng ngày cụ thể</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.type === 'date_range' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Từ ngày</Label>
                  <Input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData((p) => ({ ...p, startDate: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Đến ngày</Label>
                  <Input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData((p) => ({ ...p, endDate: e.target.value }))}
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Cách áp dụng</Label>
                <Select
                  value={formData.modifierType}
                  onValueChange={(v: 'percentage' | 'fixed') =>
                    setFormData((p) => ({ ...p, modifierType: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Tăng theo %</SelectItem>
                    <SelectItem value="fixed">Tăng số tiền cố định (VND)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{formData.modifierType === 'percentage' ? 'Phần trăm (%)' : 'Số tiền (VND)'}</Label>
                <Input
                  type="number"
                  min={formData.modifierType === 'percentage' ? 0 : undefined}
                  value={formData.modifierValue}
                  onChange={(e) => setFormData((p) => ({ ...p, modifierValue: e.target.value }))}
                  placeholder={formData.modifierType === 'percentage' ? '10' : '50000'}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(v) => setFormData((p) => ({ ...p, isActive: !!v }))}
              />
              <Label htmlFor="isActive">Kích hoạt</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Hủy
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                createMutation.isPending ||
                updateMutation.isPending ||
                !formData.name ||
                formData.roomIds.length === 0 ||
                !formData.modifierValue
              }
            >
              {(createMutation.isPending || updateMutation.isPending) && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {editingRule ? 'Cập nhật' : 'Tạo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteRule} onOpenChange={() => setDeleteRule(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa rule giá đặc biệt?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xóa rule &quot;{deleteRule?.name}&quot;? Các đơn đặt phòng đã tạo vẫn giữ nguyên giá đã tính.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground"
              onClick={() => deleteRule && deleteMutation.mutate(deleteRule._id)}
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
