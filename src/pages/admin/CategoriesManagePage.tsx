import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Layers, GripVertical, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { categoryService } from '@/services/categoryService';
import { toast } from '@/hooks/use-toast';
import type { RoomCategory } from '@/types';

export default function CategoriesManagePage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<RoomCategory | null>(null);
  const [deleteCategory, setDeleteCategory] = useState<RoomCategory | null>(null);
  const [page, setPage] = useState(1);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '',
    order: 0,
    isActive: true,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['adminCategories', page],
    queryFn: () => categoryService.getAllCategories({ page, limit: 20 }),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => categoryService.createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCategories'] });
      toast({ title: 'Thành công', description: 'Đã tạo danh mục mới' });
      closeDialog();
    },
    onError: (error: any) => {
      toast({
        title: 'Lỗi',
        description: error?.response?.data?.message || 'Không thể tạo danh mục',
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => categoryService.updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCategories'] });
      toast({ title: 'Thành công', description: 'Đã cập nhật danh mục' });
      closeDialog();
    },
    onError: () => {
      toast({ title: 'Lỗi', description: 'Không thể cập nhật danh mục', variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => categoryService.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCategories'] });
      toast({ title: 'Thành công', description: 'Đã xóa danh mục' });
      setDeleteCategory(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Lỗi',
        description: error?.response?.data?.message || 'Không thể xóa danh mục',
        variant: 'destructive',
      });
    },
  });

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingCategory(null);
    setFormData({
      name: '',
      description: '',
      icon: '',
      order: 0,
      isActive: true,
    });
  };

  const openEditDialog = (category: RoomCategory) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      icon: category.icon || '',
      order: category.order,
      isActive: category.isActive,
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name) {
      toast({ title: 'Lỗi', description: 'Vui lòng nhập tên danh mục', variant: 'destructive' });
      return;
    }

    const submitData = {
      name: formData.name,
      description: formData.description,
      icon: formData.icon || undefined,
      order: formData.order,
      isActive: formData.isActive,
    };

    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory._id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const categories = data?.data || [];
  const pagination = data?.pagination;

  return (
    <div className="min-h-screen animate-gradient bg-fixed pb-12">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Quản lý danh mục phòng</h1>
            <p className="text-muted-foreground mt-1">Phân loại và tổ chức các loại phòng nghỉ trong hệ thống</p>
          </div>
          <Button onClick={() => setDialogOpen(true)} className="rounded-full px-6 shadow-lg shadow-primary/20">
            <Plus className="h-5 w-5 mr-2" /> Thêm danh mục
          </Button>
        </div>

        <Card className="rounded-[32px] border-none shadow-xl overflow-hidden bg-white/80 backdrop-blur-md">
          <CardHeader className="bg-white/50 border-b border-gray-100">
            <div className="flex items-center gap-2">
                <div className="p-2 bg-primary/10 rounded-xl">
                    <Layers className="h-5 w-5 text-primary" />
                </div>
                <CardTitle>Danh sách danh mục</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0 sm:p-6 sm:pt-0">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
                  <p className="text-muted-foreground animate-pulse">Đang tải dữ liệu...</p>
              </div>
            ) : categories.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                <Layers className="h-16 w-16 mx-auto mb-4 opacity-20" />
                <p className="text-lg font-medium">Chưa có danh mục nào</p>
                <p className="text-sm mb-6">Hãy tạo danh mục đầu tiên để bắt đầu phân loại phòng</p>
                <Button className="rounded-full px-8" onClick={() => setDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" /> Tạo danh mục ngay
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-16 text-center">Thứ tự</TableHead>
                      <TableHead>Thông tin danh mục</TableHead>
                      <TableHead className="hidden md:table-cell">Mô tả</TableHead>
                      <TableHead className="text-center">Số phòng</TableHead>
                      <TableHead className="text-center">Trạng thái</TableHead>
                      <TableHead className="text-right px-6">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map((category: RoomCategory, index: number) => (
                      <TableRow key={category._id} className="group hover:bg-gray-50/50 transition-colors">
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <GripVertical className="h-4 w-4 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <span className="font-mono text-gray-500">{category.order || index + 1}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-2xl bg-secondary/50 flex items-center justify-center text-xl shadow-sm border border-white">
                                {category.icon || '🏠'}
                            </div>
                            <span className="font-bold text-gray-900">{category.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell max-w-[300px]">
                          <p className="truncate text-sm text-gray-500">{category.description || '-'}</p>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className="rounded-full bg-blue-50 text-blue-700 border-none px-3 font-bold">
                            {category.roomCount || 0} phòng
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className={`${category.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'} border-none rounded-full px-3 font-bold`}>
                            {category.isActive ? 'Đang hoạt động' : 'Tạm ẩn'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right px-6">
                          <div className="flex justify-end gap-2">
                            <Button size="icon" variant="ghost" className="h-9 w-9 rounded-xl hover:bg-white hover:shadow-md transition-all" onClick={() => openEditDialog(category)}>
                              <Edit className="h-4 w-4 text-gray-600" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-9 w-9 rounded-xl hover:bg-red-50 hover:text-red-600 transition-all"
                              onClick={() => setDeleteCategory(category)}
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
                  <div className="flex justify-center items-center gap-4 py-6 border-t border-gray-100">
                    <Button variant="ghost" size="sm" className="rounded-full" disabled={page === 1} onClick={() => setPage(page - 1)}>
                      Trước
                    </Button>
                    <span className="text-sm font-bold text-gray-500">Trang {page} / {pagination.totalPages}</span>
                    <Button variant="ghost" size="sm" className="rounded-full" disabled={page === pagination.totalPages} onClick={() => setPage(page + 1)}>
                      Sau
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={(open) => !open && closeDialog()}>
          <DialogContent className="max-w-md rounded-[32px] p-6 border-none overflow-hidden">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">
                {editingCategory ? 'Cập nhật danh mục' : 'Thêm danh mục mới'}
              </DialogTitle>
              <CardDescription>
                Thông tin danh mục dùng để phân loại các loại phòng của khách sạn
              </CardDescription>
            </DialogHeader>

            <div className="space-y-5 py-4">
              <div className="space-y-2">
                <Label className="font-bold text-gray-700 ml-1">Tên danh mục *</Label>
                <Input
                  placeholder="VD: Phòng VIP, Suite, Villa..."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="h-12 rounded-2xl border-gray-200 focus:border-primary focus:ring-primary"
                />
              </div>

              <div className="space-y-2">
                <Label className="font-bold text-gray-700 ml-1">Mô tả</Label>
                <Textarea
                  placeholder="Mô tả ngắn gọn về đặc điểm của danh mục này..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="rounded-2xl border-gray-200 focus:border-primary focus:ring-primary min-h-[100px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label className="font-bold text-gray-700 ml-1">Biểu tượng (Emoji)</Label>
                    <Input
                    placeholder="VD: 🏠, ✨, 💎..."
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    className="h-12 rounded-2xl border-gray-200 text-center text-xl"
                    />
                </div>

                <div className="space-y-2">
                    <Label className="font-bold text-gray-700 ml-1">Thứ tự hiển thị</Label>
                    <Input
                    type="number"
                    placeholder="0"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) })}
                    className="h-12 rounded-2xl border-gray-200"
                    />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="space-y-0.5">
                    <Label className="font-bold text-gray-700">Trạng thái hoạt động</Label>
                    <p className="text-xs text-muted-foreground">Cho phép sử dụng danh mục này</p>
                </div>
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
              </div>
            </div>

            <DialogFooter className="sm:justify-between gap-3 pt-2">
              <Button variant="ghost" className="rounded-full px-6 font-bold flex-1" onClick={closeDialog}>Bỏ qua</Button>
              <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending} className="rounded-full px-10 font-bold flex-1 h-12 shadow-lg shadow-primary/20">
                {createMutation.isPending || updateMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
                {editingCategory ? 'Lưu thay đổi' : 'Tạo danh mục'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteCategory} onOpenChange={() => setDeleteCategory(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Xác nhận xóa?</AlertDialogTitle>
              <AlertDialogDescription>
                Bạn có chắc chắn muốn xóa danh mục "{deleteCategory?.name}"? Hành động này không thể hoàn tác.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Hủy</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteCategory && deleteMutation.mutate(deleteCategory._id)}
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
    </div>
  );
}