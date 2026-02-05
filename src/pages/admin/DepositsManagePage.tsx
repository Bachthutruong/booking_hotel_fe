import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, X, Eye, Filter, Plus, PenTool, AlertCircle, Search, UserPlus, ChevronsUpDown, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { walletService } from '@/services/walletService';
import { promotionService } from '@/services/promotionService';
import { useToast } from '@/hooks/use-toast';
import type { DepositRequest, User } from '@/types';
import SignatureCanvas from 'react-signature-canvas';

const formatCurrency = (amount: number) => amount.toLocaleString('vi-VN') + 'đ';

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: 'Chờ duyệt', color: 'bg-yellow-100 text-yellow-700' },
  approved: { label: 'Đã duyệt', color: 'bg-green-100 text-green-700' },
  rejected: { label: 'Từ chối', color: 'bg-red-100 text-red-700' },
};

export default function DepositsManagePage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const signatureRef = useRef<SignatureCanvas>(null);
  
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedDeposit, setSelectedDeposit] = useState<DepositRequest | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [processDialogOpen, setProcessDialogOpen] = useState(false);
  const [processAction, setProcessAction] = useState<'approve' | 'reject'>('approve');
  const [adminNote, setAdminNote] = useState('');
  const [page, setPage] = useState(1);
  
  // New deposit dialog - Single user selection with Command
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [openCombobox, setOpenCombobox] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositNote, setDepositNote] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['adminDeposits', statusFilter, page],
    queryFn: () => walletService.getAllDeposits({
      status: statusFilter !== 'all' ? statusFilter : undefined,
      page,
      limit: 10,
    }),
  });

  const { data: usersData } = useQuery({
    queryKey: ['adminUsers', userSearch],
    queryFn: () => walletService.getAllUsersWallet({ search: userSearch, limit: 100 }),
    enabled: createDialogOpen,
  });

  const { data: bonusPreview } = useQuery({
    queryKey: ['bonusPreview', depositAmount],
    queryFn: () => promotionService.calculatePromotion(Number(depositAmount)),
    enabled: !!depositAmount && Number(depositAmount) >= 10000 && createDialogOpen,
  });

  const processMutation = useMutation({
    mutationFn: ({ id, action, note }: { id: string; action: 'approve' | 'reject'; note?: string }) =>
      walletService.processDeposit(id, action, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminDeposits'] });
      toast({
        title: 'Thành công',
        description: processAction === 'approve' ? 'Đã duyệt yêu cầu nạp tiền' : 'Đã từ chối yêu cầu nạp tiền',
      });
      setProcessDialogOpen(false);
      setSelectedDeposit(null);
      setAdminNote('');
    },
    onError: () => {
      toast({ title: 'Lỗi', description: 'Không thể xử lý yêu cầu', variant: 'destructive' });
    },
  });

  const resetCreateForm = () => {
    setSelectedUser(null);
    setDepositAmount('');
    setDepositNote('');
    setUserSearch('');
    signatureRef.current?.clear();
  };

  const handleProcess = () => {
    if (!selectedDeposit) return;
    processMutation.mutate({
      id: selectedDeposit._id,
      action: processAction,
      note: adminNote,
    });
  };

  const handleCreateDeposit = async () => {
    if (!selectedUser || !depositAmount || Number(depositAmount) < 1000) {
      toast({ title: 'Lỗi', description: 'Vui lòng chọn người dùng và nhập số tiền >= 1,000đ', variant: 'destructive' });
      return;
    }

    if (signatureRef.current?.isEmpty()) {
      toast({ title: 'Lỗi', description: 'Vui lòng ký xác nhận trước khi nạp tiền', variant: 'destructive' });
      return;
    }

    const signature = signatureRef.current?.toDataURL() || '';
    setIsProcessing(true);

    try {
      await walletService.adminCreateDeposit({
        userId: selectedUser._id,
        amount: Number(depositAmount),
        note: depositNote,
        signature,
      });

      toast({
        title: 'Thành công',
        description: `Đã nạp ${formatCurrency(Number(depositAmount))} cho ${selectedUser.fullName}`,
      });

      queryClient.invalidateQueries({ queryKey: ['adminDeposits'] });
      setCreateDialogOpen(false);
      resetCreateForm();
    } catch (error: any) {
      toast({ 
        title: 'Lỗi', 
        description: error.response?.data?.message || 'Không thể nạp tiền', 
        variant: 'destructive' 
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const deposits = data?.data || [];
  const pagination = data?.pagination;
  const users = usersData?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Quản lý nạp tiền</h1>
          <p className="text-muted-foreground">Duyệt và quản lý các yêu cầu nạp tiền từ khách hàng</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} className="bg-green-600 hover:bg-green-700">
          <Plus className="h-4 w-4 mr-2" />
          Nạp tiền cho người dùng
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Lọc theo:</span>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="pending">Chờ duyệt</SelectItem>
                <SelectItem value="approved">Đã duyệt</SelectItem>
                <SelectItem value="rejected">Từ chối</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="text-center py-8">Đang tải...</div>
          ) : deposits.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Không có yêu cầu nạp tiền nào</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Khách hàng</TableHead>
                    <TableHead>Số tiền</TableHead>
                    <TableHead>Khuyến mãi</TableHead>
                    <TableHead>Ngày tạo</TableHead>
                    <TableHead>Nguồn</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deposits.map((deposit: DepositRequest & { isAdminCreated?: boolean }) => {
                    const user = deposit.user as User;
                    const statusInfo = statusLabels[deposit.status];
                    return (
                      <TableRow key={deposit._id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{user?.fullName}</p>
                            <p className="text-sm text-muted-foreground">{user?.email}</p>
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold">{formatCurrency(deposit.amount)}</TableCell>
                        <TableCell>
                          {deposit.bonusAmount > 0 ? (
                            <span className="text-amber-600">+{formatCurrency(deposit.bonusAmount)}</span>
                          ) : '-'}
                        </TableCell>
                        <TableCell>{formatDate(deposit.createdAt)}</TableCell>
                        <TableCell>
                          {deposit.isAdminCreated ? (
                            <Badge className="bg-blue-100 text-blue-700">Admin</Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-700">Người dùng</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedDeposit(deposit);
                                setViewDialogOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {deposit.status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="default"
                                  className="bg-green-600 hover:bg-green-700"
                                  onClick={() => {
                                    setSelectedDeposit(deposit);
                                    setProcessAction('approve');
                                    setProcessDialogOpen(true);
                                  }}
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => {
                                    setSelectedDeposit(deposit);
                                    setProcessAction('reject');
                                    setProcessDialogOpen(true);
                                  }}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                  >
                    Trước
                  </Button>
                  <span className="px-4 py-2 text-sm">
                    Trang {page} / {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === pagination.totalPages}
                    onClick={() => setPage(page + 1)}
                  >
                    Sau
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Chi tiết yêu cầu nạp tiền</DialogTitle>
          </DialogHeader>
          {selectedDeposit && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Khách hàng</Label>
                  <p className="font-medium">{(selectedDeposit.user as User)?.fullName}</p>
                  <p className="text-sm text-muted-foreground">{(selectedDeposit.user as User)?.email}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Số tiền</Label>
                  <p className="font-semibold text-lg">{formatCurrency(selectedDeposit.amount)}</p>
                  {selectedDeposit.bonusAmount > 0 && (
                    <p className="text-amber-600">+{formatCurrency(selectedDeposit.bonusAmount)} khuyến mãi</p>
                  )}
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground">Thông tin chuyển khoản</Label>
                <div className="p-3 bg-gray-50 rounded-lg mt-1 text-sm">
                  <p>Ngân hàng: {selectedDeposit.bankInfo.bankName}</p>
                  <p>STK: {selectedDeposit.bankInfo.accountNumber}</p>
                  <p>Chủ TK: {selectedDeposit.bankInfo.accountName}</p>
                  <p>Nội dung: {selectedDeposit.bankInfo.transferContent}</p>
                </div>
              </div>

              {selectedDeposit.proofImage && (
                <div>
                  <Label className="text-muted-foreground">Ảnh minh chứng</Label>
                  <img
                    src={selectedDeposit.proofImage}
                    alt="Proof"
                    className="mt-2 w-full max-h-64 object-contain rounded-lg border"
                  />
                </div>
              )}

              {(selectedDeposit as any).adminSignature && (
                <div>
                  <Label className="text-muted-foreground">Chữ ký Admin</Label>
                  <img
                    src={(selectedDeposit as any).adminSignature}
                    alt="Admin Signature"
                    className="mt-2 max-h-24 object-contain rounded-lg border bg-white"
                  />
                </div>
              )}

              {selectedDeposit.adminNote && (
                <div>
                  <Label className="text-muted-foreground">Ghi chú admin</Label>
                  <p className="p-3 bg-gray-50 rounded-lg mt-1">{selectedDeposit.adminNote}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Process Dialog */}
      <Dialog open={processDialogOpen} onOpenChange={setProcessDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {processAction === 'approve' ? 'Duyệt yêu cầu nạp tiền' : 'Từ chối yêu cầu nạp tiền'}
            </DialogTitle>
            <DialogDescription>
              {processAction === 'approve'
                ? 'Xác nhận duyệt yêu cầu nạp tiền này? Số tiền sẽ được cộng vào ví của khách hàng.'
                : 'Xác nhận từ chối yêu cầu nạp tiền này?'}
            </DialogDescription>
          </DialogHeader>

          {selectedDeposit && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-muted-foreground">Khách hàng</p>
                <p className="font-medium">{(selectedDeposit.user as User)?.fullName}</p>
                <p className="text-sm text-muted-foreground mt-2">Số tiền</p>
                <p className="font-semibold text-lg">{formatCurrency(selectedDeposit.amount)}</p>
                {selectedDeposit.bonusAmount > 0 && (
                  <p className="text-amber-600">+{formatCurrency(selectedDeposit.bonusAmount)} khuyến mãi</p>
                )}
              </div>

              <div>
                <Label>Ghi chú (không bắt buộc)</Label>
                <Textarea
                  placeholder="Nhập ghi chú..."
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setProcessDialogOpen(false)}>Hủy</Button>
            <Button
              onClick={handleProcess}
              disabled={processMutation.isPending}
              className={processAction === 'approve' ? 'bg-green-600 hover:bg-green-700' : ''}
              variant={processAction === 'reject' ? 'destructive' : 'default'}
            >
              {processMutation.isPending ? 'Đang xử lý...' : processAction === 'approve' ? 'Duyệt' : 'Từ chối'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Deposit Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={(open) => { setCreateDialogOpen(open); if (!open) resetCreateForm(); }}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-green-600" />
              Nạp tiền cho người dùng
            </DialogTitle>
            <DialogDescription>
              Chọn người dùng và nhập số tiền cần nạp. Yêu cầu chữ ký số để xác nhận.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            {/* User Selection with Command + Popover */}
            <div className="space-y-2">
              <Label>Chọn người dùng *</Label>
              <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openCombobox}
                    className="w-full justify-between"
                  >
                    {selectedUser ? (
                      <span className="flex items-center gap-2 truncate">
                        {selectedUser.fullName} ({selectedUser.email})
                      </span>
                    ) : (
                      "Tìm kiếm người dùng..."
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0">
                  <Command shouldFilter={false}>
                    <CommandInput 
                      placeholder="Tìm kiếm theo tên, email, sđt..." 
                      value={userSearch}
                      onValueChange={setUserSearch}
                    />
                    <CommandList>
                      <CommandEmpty>Không tìm thấy người dùng.</CommandEmpty>
                      <CommandGroup heading="Người dùng">
                        {users.map((user) => (
                          <CommandItem
                            key={user._id}
                            value={user._id}
                            onSelect={() => {
                              setSelectedUser(user);
                              setOpenCombobox(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedUser?._id === user._id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <div className="flex flex-col">
                              <span>{user.fullName}</span>
                              <span className="text-xs text-muted-foreground">{user.email} - {user.phone}</span>
                            </div>
                            <span className="ml-auto text-xs text-muted-foreground">
                              {formatCurrency(user.walletBalance)}
                            </span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {selectedUser && (
              <div className="bg-green-50 p-3 rounded-lg flex justify-between items-center text-sm border border-green-200">
                <div>
                  <p className="font-semibold text-green-800">{selectedUser.fullName}</p>
                  <p className="text-green-700">{selectedUser.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-green-600">Số dư hiện tại</p>
                  <p className="font-bold text-green-800">{formatCurrency(selectedUser.walletBalance)}</p>
                </div>
              </div>
            )}

            {/* Amount */}
            <div className="space-y-2">
              <Label>Số tiền nạp (VND) *</Label>
              <Input
                type="number"
                placeholder="Nhập số tiền (tối thiểu 1,000đ)"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                min={1000}
              />
               {bonusPreview?.data && bonusPreview.data.bonusAmount > 0 && (
                  <div className="bg-amber-50 p-2 rounded-lg border border-amber-100 flex items-center justify-between text-sm mt-2">
                    <span className="text-amber-700 flex items-center gap-1 font-medium">
                        <Sparkles className="h-4 w-4" /> 
                        Khuyến mãi: +{formatCurrency(bonusPreview.data.bonusAmount)}
                    </span>
                    <span className="text-amber-900 font-bold">
                        Tổng nhận: {formatCurrency(bonusPreview.data.totalReceive)}
                    </span>
                  </div>
                )}
            </div>

            {/* Note */}
            <div className="space-y-2">
              <Label>Ghi chú</Label>
              <Textarea
                placeholder="Nhập ghi chú về giao dịch..."
                value={depositNote}
                onChange={(e) => setDepositNote(e.target.value)}
              />
            </div>

            {/* Digital Signature */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <PenTool className="h-4 w-4" />
                Chữ ký xác nhận *
              </Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-2 bg-white">
                <SignatureCanvas
                  ref={signatureRef}
                  canvasProps={{
                    className: 'w-full h-32 border rounded',
                    style: { width: '100%', height: '128px' }
                  }}
                  backgroundColor="white"
                />
              </div>
              <div className="flex justify-between">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Vui lòng ký vào ô trên để xác nhận giao dịch
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => signatureRef.current?.clear()}
                >
                  Xóa chữ ký
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-4 pt-4 border-t">
            <Button variant="outline" onClick={() => { setCreateDialogOpen(false); resetCreateForm(); }}>
              Hủy
            </Button>
            <Button
              onClick={handleCreateDeposit}
              disabled={isProcessing || !selectedUser || !depositAmount}
              className="bg-green-600 hover:bg-green-700"
            >
              {isProcessing ? 'Đang xử lý...' : 'Xác nhận nạp tiền'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
