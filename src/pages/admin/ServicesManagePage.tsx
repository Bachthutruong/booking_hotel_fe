import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Loader2, ChevronLeft, ChevronRight, Layers, ConciergeBell } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { formatPrice } from '@/lib/utils';
import { serviceService } from '@/services/serviceService';
import { serviceCategoryService } from '@/services/serviceCategoryService';
import type { Service, ServiceCategory } from '@/types';

type TabValue = 'categories' | 'services';

export default function ServicesManagePage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabValue>('services');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Quản lý dịch vụ</h1>
        <p className="text-muted-foreground">Danh mục dịch vụ và danh sách dịch vụ</p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Danh mục dịch vụ
          </TabsTrigger>
          <TabsTrigger value="services" className="flex items-center gap-2">
            <ConciergeBell className="h-4 w-4" />
            Dịch vụ
          </TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="mt-6">
          <ServiceCategoriesTab />
        </TabsContent>

        <TabsContent value="services" className="mt-6">
          <ServicesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// --- Service Categories Tab ---
function ServiceCategoriesTab() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ServiceCategory | null>(null);
  const [deleteCategory, setDeleteCategory] = useState<ServiceCategory | null>(null);
  const [page, setPage] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '',
    order: 0,
    isActive: true,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['adminServiceCategories', page],
    queryFn: () => serviceCategoryService.getAllServiceCategories({ page, limit: 20 }),
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<ServiceCategory>) => serviceCategoryService.createServiceCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminServiceCategories'] });
      queryClient.invalidateQueries({ queryKey: ['serviceCategories'] });
      toast({ title: 'Thành công', description: 'Đã tạo danh mục dịch vụ' });
      closeDialog();
    },
    onError: (e: any) => {
      toast({ title: 'Lỗi', description: e?.response?.data?.message || 'Không thể tạo danh mục', variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ServiceCategory> }) =>
      serviceCategoryService.updateServiceCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminServiceCategories'] });
      queryClient.invalidateQueries({ queryKey: ['serviceCategories'] });
      toast({ title: 'Thành công', description: 'Đã cập nhật danh mục' });
      closeDialog();
    },
    onError: (e: any) => {
      toast({ title: 'Lỗi', description: e?.response?.data?.message || 'Không thể cập nhật', variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => serviceCategoryService.deleteServiceCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminServiceCategories'] });
      queryClient.invalidateQueries({ queryKey: ['serviceCategories'] });
      setDeleteCategory(null);
      toast({ title: 'Thành công', description: 'Đã xóa danh mục' });
    },
    onError: (e: any) => {
      toast({ title: 'Lỗi', description: e?.response?.data?.message || 'Không thể xóa', variant: 'destructive' });
    },
  });

  const closeDialog = () => {
    setIsOpen(false);
    setEditingCategory(null);
    setFormData({ name: '', description: '', icon: '', order: 0, isActive: true });
  };

  const openEdit = (cat: ServiceCategory) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name,
      description: cat.description || '',
      icon: cat.icon || '',
      order: cat.order ?? 0,
      isActive: cat.isActive ?? true,
    });
    setIsOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast({ title: 'Lỗi', description: 'Vui lòng nhập tên danh mục', variant: 'destructive' });
      return;
    }
    const payload = {
      name: formData.name.trim(),
      description: formData.description || '',
      icon: formData.icon || undefined,
      order: formData.order,
      isActive: formData.isActive,
    };
    if (editingCategory) updateMutation.mutate({ id: editingCategory._id, data: payload });
    else createMutation.mutate(payload);
  };

  const categories = (data?.data || []) as (ServiceCategory & { serviceCount?: number })[];
  const pagination = data?.pagination;

  return (
    <>
      <div className="flex justify-between items-center">
        <p className="text-muted-foreground">Tổng: {pagination?.total ?? categories.length} danh mục</p>
        <Button onClick={() => { setEditingCategory(null); setFormData({ name: '', description: '', icon: '', order: 0, isActive: true }); setIsOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" /> Thêm danh mục
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên</TableHead>
                <TableHead>Mô tả</TableHead>
                <TableHead>Thứ tự</TableHead>
                <TableHead>Số dịch vụ</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="w-[100px]">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Chưa có danh mục. Tạo danh mục (VD: Đồ ăn, Đồ uống, Dịch vụ khác) trước khi thêm dịch vụ.
                  </TableCell>
                </TableRow>
              ) : (
                categories.map((cat) => (
                  <TableRow key={cat._id}>
                    <TableCell className="font-medium">{cat.name}</TableCell>
                    <TableCell>{cat.description || '-'}</TableCell>
                    <TableCell>{cat.order}</TableCell>
                    <TableCell>{cat.serviceCount ?? 0}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${cat.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                        {cat.isActive ? 'Bật' : 'Tắt'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(cat)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="text-red-500" onClick={() => setDeleteCategory(cat)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="icon" disabled={page === 1} onClick={() => setPage((p) => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
          <span className="text-sm">Trang {page} / {pagination.totalPages}</span>
          <Button variant="outline" size="icon" disabled={page === pagination.totalPages} onClick={() => setPage((p) => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? 'Cập nhật danh mục' : 'Thêm danh mục dịch vụ'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tên danh mục</Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="VD: Đồ ăn, Đồ uống, Dịch vụ khác" />
            </div>
            <div className="space-y-2">
              <Label>Mô tả</Label>
              <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
            </div>
            <div className="flex gap-4">
              <div className="space-y-2 flex-1">
                <Label>Thứ tự</Label>
                <Input type="number" value={formData.order} onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) })} />
              </div>
              {editingCategory && (
                <div className="flex items-center gap-2">
                  <Checkbox checked={formData.isActive} onCheckedChange={(c) => setFormData({ ...formData, isActive: c as boolean })} />
                  <Label>Bật</Label>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Hủy</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
              {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Lưu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteCategory} onOpenChange={() => setDeleteCategory(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xóa danh mục "{deleteCategory?.name}"? Nếu có dịch vụ thuộc danh mục này sẽ không thể xóa.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => deleteCategory && deleteMutation.mutate(deleteCategory._id)} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// --- Services Tab ---
function ServicesTab() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [deleteService, setDeleteService] = useState<Service | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    category: '',
    isActive: true,
    requiresConfirmation: true,
  });

  const { data: categoriesRes } = useQuery({
    queryKey: ['serviceCategories'],
    queryFn: () => serviceCategoryService.getServiceCategories(),
  });
  const categories = categoriesRes?.data || [];

  const { data: servicesResponse, isLoading } = useQuery({
    queryKey: ['adminServices', page, limit, categoryFilter],
    queryFn: () =>
      serviceService.getAdminServices({
        page,
        limit,
        category: categoryFilter === 'all' ? undefined : categoryFilter,
      }),
  });

  const services = servicesResponse?.data || [];
  const pagination = servicesResponse?.pagination;

  const createMutation = useMutation({
    mutationFn: (data: Partial<Service>) => serviceService.createService(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminServices'] });
      setIsOpen(false);
      resetForm();
      toast({ title: 'Thành công', description: 'Đã tạo dịch vụ mới' });
    },
    onError: () => toast({ title: 'Lỗi', description: 'Không thể tạo dịch vụ', variant: 'destructive' }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Service> }) => serviceService.updateService(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminServices'] });
      setIsOpen(false);
      resetForm();
      toast({ title: 'Thành công', description: 'Đã cập nhật dịch vụ' });
    },
    onError: () => toast({ title: 'Lỗi', description: 'Không thể cập nhật dịch vụ', variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => serviceService.deleteService(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminServices'] });
      setDeleteService(null);
      toast({ title: 'Thành công', description: 'Đã xóa dịch vụ' });
    },
    onError: () => toast({ title: 'Lỗi', description: 'Không thể xóa dịch vụ', variant: 'destructive' }),
  });

  const resetForm = () => {
    setFormData({ name: '', description: '', price: 0, category: '', isActive: true, requiresConfirmation: true });
    setEditingService(null);
  };

  const getCategoryId = (service: Service): string => {
    if (!service.category) return '';
    return typeof service.category === 'string' ? service.category : (service.category as ServiceCategory)._id;
  };

  useEffect(() => {
    if (isOpen && editingService) {
      setFormData({
        name: editingService.name,
        description: editingService.description || '',
        price: editingService.price,
        category: getCategoryId(editingService),
        isActive: editingService.isActive,
        requiresConfirmation: editingService.requiresConfirmation !== false,
      });
    } else if (isOpen && !editingService) {
      setFormData({ name: '', description: '', price: 0, category: categoryFilter !== 'all' ? categoryFilter : '', isActive: true, requiresConfirmation: true });
    }
  }, [isOpen, editingService]);

  const handleOpenCreate = () => {
    resetForm();
    if (categoryFilter !== 'all') setFormData((f) => ({ ...f, category: categoryFilter }));
    setIsOpen(true);
  };

  const handleOpenEdit = (service: Service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description || '',
      price: service.price,
      category: getCategoryId(service),
      isActive: service.isActive,
      requiresConfirmation: service.requiresConfirmation !== false,
    });
    setIsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.category) {
      toast({ title: 'Lỗi', description: 'Vui lòng chọn danh mục dịch vụ', variant: 'destructive' });
      return;
    }
    const payload = {
      name: formData.name,
      description: formData.description,
      price: formData.price,
      category: formData.category,
      isActive: formData.isActive,
      requiresConfirmation: formData.requiresConfirmation,
    };
    if (editingService) updateMutation.mutate({ id: editingService._id, data: payload });
    else createMutation.mutate(payload);
  };

  const getCategoryName = (service: Service): string => {
    const cat = service.category;
    if (!cat) return '-';
    return typeof cat === 'string' ? (categories.find((c) => c._id === cat)?.name || '-') : (cat as ServiceCategory).name;
  };

  return (
    <>
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setPage(1); }}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Danh mục" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả danh mục</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
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
        <Button onClick={handleOpenCreate} disabled={categories.length === 0}>
          <Plus className="mr-2 h-4 w-4" /> Thêm dịch vụ
        </Button>
      </div>
      {categories.length === 0 && (
        <p className="text-sm text-amber-600">Vui lòng tạo ít nhất một danh mục dịch vụ (tab Danh mục dịch vụ) trước khi thêm dịch vụ.</p>
      )}

      {isLoading ? (
        <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên dịch vụ</TableHead>
                  <TableHead>Danh mục</TableHead>
                  <TableHead>Mô tả</TableHead>
                  <TableHead>Giá</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="w-24">Cần xác nhận</TableHead>
                  <TableHead className="w-[100px]">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Chưa có dịch vụ nào
                    </TableCell>
                  </TableRow>
                ) : (
                  services.map((service) => (
                    <TableRow key={service._id}>
                      <TableCell className="font-medium">{service.name}</TableCell>
                      <TableCell>{getCategoryName(service)}</TableCell>
                      <TableCell>{service.description || '-'}</TableCell>
                      <TableCell>{formatPrice(service.price)}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${service.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {service.isActive ? 'Hoạt động' : 'Tạm ẩn'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs">{service.requiresConfirmation !== false ? 'Có' : 'Không'}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(service)}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="text-red-500" onClick={() => setDeleteService(service)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <Button variant="outline" size="icon" disabled={page === 1} onClick={() => setPage((p) => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
              <span className="text-sm">Trang {page} / {pagination.totalPages}</span>
              <Button variant="outline" size="icon" disabled={page === pagination.totalPages} onClick={() => setPage((p) => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          )}
        </>
      )}

      <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { setIsOpen(false); resetForm(); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingService ? 'Cập nhật dịch vụ' : 'Thêm dịch vụ mới'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Danh mục dịch vụ *</Label>
              <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })} required>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn danh mục..." />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tên dịch vụ</Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Mô tả</Label>
              <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Giá (VND)</Label>
              <Input type="number" min={0} value={formData.price} onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })} required />
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={formData.isActive}
                  onCheckedChange={(c: boolean | 'indeterminate') => setFormData({ ...formData, isActive: c as boolean })}
                />
                <Label>Kích hoạt</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={formData.requiresConfirmation}
                  onCheckedChange={(c: boolean | 'indeterminate') => setFormData({ ...formData, requiresConfirmation: c as boolean })}
                />
                <Label>Cần xác nhận bàn giao</Label>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Nếu bật, khi khách đặt dịch vụ admin sẽ thấy và cần tích &quot;Đã bàn giao&quot; sau khi giao cho khách.</p>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Hủy</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending || categories.length === 0}>
                {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Lưu
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteService} onOpenChange={() => setDeleteService(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa dịch vụ "{deleteService?.name}"? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => deleteService && deleteMutation.mutate(deleteService._id)} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
