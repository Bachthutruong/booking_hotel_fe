import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Loader2,
  Search,
  Trash2,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  History,
  List,
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { userService, type CreateUserPayload, type UserAuditLogItem } from '@/services/userService';
import { useCanDelete } from '@/hooks/useCanDelete';
import type { User } from '@/types';

const ROLE_LABELS: Record<string, string> = {
  user: 'Người dùng',
  admin: 'Quản trị viên',
  staff: 'Nhân viên',
};

const ACTION_LABELS: Record<string, string> = {
  created: 'Thêm mới',
  updated: 'Cập nhật',
  deleted: 'Xóa / Vô hiệu hóa',
};

export default function UsersManagePage() {
  const queryClient = useQueryClient();
  const canDelete = useCanDelete();

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [deleteUser, setDeleteUser] = useState<User | null>(null);
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [addForm, setAddForm] = useState<CreateUserPayload>({
    email: '',
    fullName: '',
    phone: '',
    role: 'user',
    password: '',
  });

  // Audit logs state
  const [auditPage, setAuditPage] = useState(1);
  const [auditLimit] = useState(15);
  const [auditActionFilter, setAuditActionFilter] = useState<'all' | 'created' | 'updated' | 'deleted'>('all');

  const usersParams = {
    search: search || undefined,
    role: roleFilter === 'all' ? undefined : roleFilter,
    page,
    limit,
  };

  const { data, isLoading } = useQuery({
    queryKey: ['users', usersParams],
    queryFn: () => userService.getUsers(usersParams),
  });

  const auditParams: { page: number; limit: number; action?: 'created' | 'updated' | 'deleted' } = {
    page: auditPage,
    limit: auditLimit,
    action: auditActionFilter === 'all' ? undefined : auditActionFilter,
  };

  const { data: auditData, isLoading: auditLoading } = useQuery({
    queryKey: ['userAuditLogs', auditParams],
    queryFn: () => userService.getUserAuditLogs(auditParams),
    enabled: canDelete,
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreateUserPayload) =>
      userService.createUser({
        ...payload,
        password: payload.password && payload.password.length >= 6 ? payload.password : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['userAuditLogs'] });
      setAddUserOpen(false);
      setAddForm({ email: '', fullName: '', phone: '', role: 'user', password: '' });
      toast({ title: 'Thành công', description: 'Đã tạo tài khoản thành công' });
    },
    onError: (err: any) => {
      toast({
        title: 'Lỗi',
        description: err?.response?.data?.message || 'Không thể tạo tài khoản',
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: userService.deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['userAuditLogs'] });
      setDeleteUser(null);
      toast({ title: 'Thành công', description: 'Đã vô hiệu hóa người dùng' });
    },
    onError: () => {
      toast({ title: 'Lỗi', description: 'Không thể xóa người dùng', variant: 'destructive' });
    },
  });

  const users = data?.data || [];
  const pagination = data?.pagination;
  const auditLogs = (auditData?.data || []) as UserAuditLogItem[];
  const auditPagination = auditData?.pagination;

  const handleDelete = () => {
    if (deleteUser) deleteMutation.mutate(deleteUser._id);
  };

  const handleCreateUser = () => {
    if (!addForm.email?.trim() || !addForm.fullName?.trim() || !addForm.phone?.trim()) {
      toast({ title: 'Lỗi', description: 'Vui lòng nhập đầy đủ Email, Họ tên và Số điện thoại', variant: 'destructive' });
      return;
    }
    createMutation.mutate(addForm);
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="list" className="w-full">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <TabsList>
            <TabsTrigger value="list" className="gap-2">
              <List className="h-4 w-4" />
              Danh sách
            </TabsTrigger>
            {canDelete && (
              <TabsTrigger value="history" className="gap-2">
                <History className="h-4 w-4" />
                Lịch sử thêm / sửa / xóa
              </TabsTrigger>
            )}
          </TabsList>
        </div>

        <TabsContent value="list" className="space-y-4 mt-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">Quản lý người dùng</h1>
              <p className="text-muted-foreground">Tổng số: {pagination?.total ?? 0}</p>
            </div>
            {canDelete && (
              <Button onClick={() => setAddUserOpen(true)} className="gap-2">
                <UserPlus className="h-4 w-4" />
                Thêm tài khoản
              </Button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2 bg-white p-2 rounded-lg border shadow-sm max-w-sm">
              <Search className="h-4 w-4 text-gray-500" />
              <Input
                placeholder="Tìm theo tên hoặc email..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="border-none shadow-none focus-visible:ring-0"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Vai trò:</span>
              <Select
                value={roleFilter}
                onValueChange={(v) => {
                  setRoleFilter(v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="user">Người dùng</SelectItem>
                  <SelectItem value="staff">Nhân viên</SelectItem>
                  <SelectItem value="admin">Quản trị viên</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Hiển thị:</span>
              <Select
                value={limit.toString()}
                onValueChange={(v) => {
                  setLimit(Number(v));
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">mục</span>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead>Người dùng</TableHead>
                      <TableHead>Vai trò</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Ngày tham gia</TableHead>
                      {canDelete && <TableHead className="w-[50px]"></TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={canDelete ? 5 : 4}
                          className="text-center py-8 text-muted-foreground"
                        >
                          Không có người dùng nào
                        </TableCell>
                      </TableRow>
                    ) : (
                      users.map((user: User) => (
                        <TableRow key={user._id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarImage src={user.avatar} />
                                <AvatarFallback>{user.fullName?.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{user.fullName}</div>
                                <div className="text-xs text-muted-foreground">{user.email}</div>
                                <div className="text-xs text-muted-foreground">{user.phone}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                user.role === 'admin'
                                  ? 'default'
                                  : user.role === 'staff'
                                    ? 'secondary'
                                    : 'outline'
                              }
                            >
                              {ROLE_LABELS[user.role] ?? user.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span
                              className={`inline-flex h-2 w-2 rounded-full mr-2 ${
                                user.isActive ? 'bg-green-500' : 'bg-red-500'
                              }`}
                            />
                            {user.isActive ? 'Hoạt động' : 'Đã khóa'}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                          </TableCell>
                          {canDelete && (
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    className="text-red-600"
                                    onClick={() => setDeleteUser(user)}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" /> Vô hiệu hóa
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          )}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

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
        </TabsContent>

        {canDelete && (
          <TabsContent value="history" className="space-y-4 mt-4">
            <div>
              <h1 className="text-2xl font-bold">Lịch sử thêm / sửa / xóa người dùng</h1>
              <p className="text-muted-foreground">
                Ghi nhận mọi thao tác tạo, cập nhật và vô hiệu hóa tài khoản.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Hành động:</span>
              <Select
                value={auditActionFilter}
                onValueChange={(v) => {
                  setAuditActionFilter(v as 'all' | 'created' | 'updated' | 'deleted');
                  setAuditPage(1);
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="created">Thêm mới</SelectItem>
                  <SelectItem value="updated">Cập nhật</SelectItem>
                  <SelectItem value="deleted">Xóa / Vô hiệu hóa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {auditLoading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
                  <Table>
                    <TableHeader className="bg-gray-50">
                      <TableRow>
                        <TableHead>Thời gian</TableHead>
                        <TableHead>Hành động</TableHead>
                        <TableHead>Đối tượng</TableHead>
                        <TableHead>Thực hiện bởi</TableHead>
                        <TableHead>Chi tiết</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {auditLogs.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            Chưa có lịch sử
                          </TableCell>
                        </TableRow>
                      ) : (
                        auditLogs.map((log) => (
                          <TableRow key={log._id}>
                            <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                              {new Date(log.createdAt).toLocaleString('vi-VN')}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  log.action === 'deleted'
                                    ? 'destructive'
                                    : log.action === 'created'
                                      ? 'default'
                                      : 'secondary'
                                }
                              >
                                {ACTION_LABELS[log.action] ?? log.action}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <span className="font-medium">{log.targetUserFullName ?? '—'}</span>
                                {log.targetUserEmail && (
                                  <div className="text-xs text-muted-foreground">
                                    {log.targetUserEmail}
                                  </div>
                                )}
                                {log.targetUserRole && (
                                  <Badge variant="outline" className="mt-0.5 text-xs">
                                    {ROLE_LABELS[log.targetUserRole] ?? log.targetUserRole}
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {log.performedByFullName ?? '—'}
                                {log.performedByEmail && (
                                  <div className="text-xs text-muted-foreground">
                                    {log.performedByEmail}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                              {log.details ?? '—'}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {auditPagination && auditPagination.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      disabled={auditPage === 1}
                      onClick={() => setAuditPage(auditPage - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm">
                      Trang {auditPage} / {auditPagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      disabled={auditPage === auditPagination.totalPages}
                      onClick={() => setAuditPage(auditPage + 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </TabsContent>
        )}
      </Tabs>

      {/* Dialog thêm tài khoản */}
      <Dialog open={addUserOpen} onOpenChange={setAddUserOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Thêm tài khoản</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Họ tên *</Label>
              <Input
                value={addForm.fullName}
                onChange={(e) => setAddForm((p) => ({ ...p, fullName: e.target.value }))}
                placeholder="Nguyễn Văn A"
              />
            </div>
            <div className="grid gap-2">
              <Label>Email *</Label>
              <Input
                type="email"
                value={addForm.email}
                onChange={(e) => setAddForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="email@example.com"
              />
            </div>
            <div className="grid gap-2">
              <Label>Số điện thoại *</Label>
              <Input
                value={addForm.phone}
                onChange={(e) => setAddForm((p) => ({ ...p, phone: e.target.value }))}
                placeholder="0901234567"
              />
            </div>
            <div className="grid gap-2">
              <Label>Vai trò</Label>
              <Select
                value={addForm.role}
                onValueChange={(v: 'user' | 'admin' | 'staff') =>
                  setAddForm((p) => ({ ...p, role: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Người dùng</SelectItem>
                  <SelectItem value="staff">Nhân viên</SelectItem>
                  <SelectItem value="admin">Quản trị viên</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Mật khẩu (tùy chọn, tối thiểu 6 ký tự)</Label>
              <Input
                type="password"
                value={addForm.password || ''}
                onChange={(e) => setAddForm((p) => ({ ...p, password: e.target.value }))}
                placeholder="Để trống nếu đăng nhập bằng email + SĐT"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddUserOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleCreateUser} disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Tạo tài khoản
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Xác nhận vô hiệu hóa */}
      <AlertDialog open={!!deleteUser} onOpenChange={() => setDeleteUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận vô hiệu hóa?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn vô hiệu hóa người dùng &quot;{deleteUser?.fullName}&quot;? Tài khoản sẽ
              không thể đăng nhập.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Vô hiệu hóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
