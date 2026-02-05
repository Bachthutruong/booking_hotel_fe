import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, X, Eye, Filter, Plus, UserPlus, Search, Copy, ExternalLink, ChevronsUpDown, CreditCard } from 'lucide-react';
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
import QRCode from 'react-qr-code';
import { walletService } from '@/services/walletService';
import { useToast } from '@/hooks/use-toast';
import type { WithdrawalRequest, User } from '@/types';

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
  pending: { label: 'Chờ xử lý', color: 'bg-yellow-100 text-yellow-700' },
  pending_confirmation: { label: 'Chờ KH xác nhận', color: 'bg-orange-100 text-orange-700' },
  approved: { label: 'Đã duyệt', color: 'bg-blue-100 text-blue-700' },
  completed: { label: 'Hoàn thành', color: 'bg-green-100 text-green-700' },
  rejected: { label: 'Từ chối', color: 'bg-red-100 text-red-700' },
};

export default function WithdrawalsManagePage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalRequest | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [processDialogOpen, setProcessDialogOpen] = useState(false);
  const [processAction, setProcessAction] = useState<'approve' | 'reject' | 'complete'>('approve');
  const [adminNote, setAdminNote] = useState('');
  const [page, setPage] = useState(1);
  
  // New withdrawal dialog - Single user
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [openCombobox, setOpenCombobox] = useState(false);
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [withdrawalNote, setWithdrawalNote] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Bank Info States
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');

  // Results dialog
  const [resultDialogOpen, setResultDialogOpen] = useState(false);
  const [createdResult, setCreatedResult] = useState<{ confirmationUrl: string, user: User } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['adminWithdrawals', statusFilter, page],
    queryFn: () => walletService.getAllWithdrawals({
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

  // Update account name when user is selected
  useEffect(() => {
    if (selectedUser) {
      setAccountName(selectedUser.fullName);
    }
  }, [selectedUser]);

  const processMutation = useMutation({
    mutationFn: ({ id, action, note }: { id: string; action: 'approve' | 'reject' | 'complete'; note?: string }) =>
      walletService.processWithdrawal(id, action, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminWithdrawals'] });
      toast({
        title: 'Thành công',
        description: 'Đã cập nhật trạng thái yêu cầu rút tiền',
      });
      setProcessDialogOpen(false);
      setSelectedWithdrawal(null);
      setAdminNote('');
    },
    onError: () => {
      toast({ title: 'Lỗi', description: 'Không thể xử lý yêu cầu', variant: 'destructive' });
    },
  });

  const handleProcess = () => {
    if (!selectedWithdrawal) return;
    processMutation.mutate({
      id: selectedWithdrawal._id,
      action: processAction,
      note: adminNote,
    });
  };

  const resetCreateForm = () => {
    setSelectedUser(null);
    setWithdrawalAmount('');
    setWithdrawalNote('');
    setUserSearch('');
    setBankName('');
    setAccountNumber('');
    setAccountName('');
  };

  const handleCreateWithdrawal = async () => {
    const amount = Number(withdrawalAmount);
    if (!selectedUser || !withdrawalAmount || amount < 1000) {
      toast({ title: 'Lỗi', description: 'Vui lòng chọn người dùng và nhập số tiền >= 1,000đ', variant: 'destructive' });
      return;
    }

    if (!bankName || !accountNumber || !accountName) {
      toast({ title: 'Lỗi', description: 'Vui lòng nhập đầy đủ thông tin ngân hàng', variant: 'destructive' });
      return;
    }

    if (selectedUser.walletBalance < amount) {
      toast({ 
        title: 'Số dư không đủ', 
        description: `Người dùng ${selectedUser.fullName} chỉ có ${formatCurrency(selectedUser.walletBalance)}`, 
        variant: 'destructive' 
      });
      return;
    }

    setIsProcessing(true);

    try {
      const res = await walletService.adminCreateWithdrawal({
        userId: selectedUser._id,
        amount: amount,
        note: withdrawalNote,
        bankInfo: {
          bankName,
          accountNumber,
          accountName
        }
      });

      queryClient.invalidateQueries({ queryKey: ['adminWithdrawals'] });
      
      setCreatedResult({
        confirmationUrl: (res.data as any).confirmationUrl,
        user: selectedUser
      });
      
      setCreateDialogOpen(false);
      setResultDialogOpen(true);
      resetCreateForm();
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.response?.data?.message || 'Không thể tạo lệnh rút tiền',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Đã sao chép', description: 'Đã sao chép liên kết vào bộ nhớ tạm' });
  };

  const withdrawals = data?.data || [];
  const pagination = data?.pagination;
  const users = usersData?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Quản lý rút tiền</h1>
          <p className="text-muted-foreground">Xử lý các yêu cầu rút tiền từ ví khách hàng</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} className="bg-orange-600 hover:bg-orange-700">
          <Plus className="h-4 w-4 mr-2" />
          Rút tiền cho người dùng
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
                <SelectItem value="pending">Chờ xử lý</SelectItem>
                <SelectItem value="pending_confirmation">Chờ KH xác nhận</SelectItem>
                <SelectItem value="approved">Đã duyệt</SelectItem>
                <SelectItem value="completed">Hoàn thành</SelectItem>
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
          ) : withdrawals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Không có yêu cầu rút tiền nào</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Khách hàng</TableHead>
                    <TableHead>Số tiền</TableHead>
                    <TableHead>Ngân hàng nhận</TableHead>
                    <TableHead>Ngày tạo</TableHead>
                    <TableHead>Nguồn</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {withdrawals.map((withdrawal: WithdrawalRequest & { isAdminCreated?: boolean }) => {
                    const user = withdrawal.user as User;
                    const statusInfo = statusLabels[withdrawal.status] || { label: withdrawal.status, color: 'bg-gray-100' };
                    return (
                      <TableRow key={withdrawal._id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{user?.fullName}</p>
                            <p className="text-sm text-muted-foreground">{user?.email}</p>
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold text-red-600">
                          -{formatCurrency(withdrawal.amount)}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p className="font-medium">{withdrawal.bankInfo.bankName}</p>
                            <p className="text-muted-foreground">{withdrawal.bankInfo.accountNumber}</p>
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(withdrawal.createdAt)}</TableCell>
                        <TableCell>
                          {withdrawal.isAdminCreated ? (
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
                                setSelectedWithdrawal(withdrawal);
                                setViewDialogOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {withdrawal.status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="default"
                                  className="bg-green-600 hover:bg-green-700"
                                  onClick={() => {
                                    setSelectedWithdrawal(withdrawal);
                                    setProcessAction('approve'); // Or complete directly depending on flow
                                    setProcessDialogOpen(true);
                                  }}
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => {
                                    setSelectedWithdrawal(withdrawal);
                                    setProcessAction('reject');
                                    setProcessDialogOpen(true);
                                  }}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            {withdrawal.status === 'approved' && (
                              <Button
                                size="sm"
                                variant="default"
                                className="bg-blue-600 hover:bg-blue-700"
                                onClick={() => {
                                  setSelectedWithdrawal(withdrawal);
                                  setProcessAction('complete');
                                  setProcessDialogOpen(true);
                                }}
                              >
                                Hoàn tất
                              </Button>
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Chi tiết yêu cầu rút tiền</DialogTitle>
          </DialogHeader>
          {selectedWithdrawal && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Khách hàng</Label>
                  <p className="font-medium">{(selectedWithdrawal.user as User)?.fullName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Số tiền rút</Label>
                  <p className="font-semibold text-lg text-red-600">{formatCurrency(selectedWithdrawal.amount)}</p>
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground">Thông tin ngân hàng</Label>
                <div className="p-3 bg-gray-50 rounded-lg mt-1 text-sm">
                  <p>Ngân hàng: {selectedWithdrawal.bankInfo.bankName}</p>
                  <p>STK: {selectedWithdrawal.bankInfo.accountNumber}</p>
                  <p>Chủ TK: {selectedWithdrawal.bankInfo.accountName}</p>
                </div>
              </div>

              {(selectedWithdrawal as any).confirmationToken && selectedWithdrawal.status === 'pending_confirmation' && (
                <div className="flex flex-col items-center p-4 border rounded-lg bg-orange-50">
                   <Label className="mb-2 text-orange-700 font-semibold">Đang chờ khách hàng xác nhận</Label>
                   <div className="bg-white p-2 rounded">
                     <QRCode value={`${window.location.origin}/withdraw/confirm/${(selectedWithdrawal as any).confirmationToken}`} size={100} />
                   </div>
                   <div className="w-full mt-3 flex items-center gap-2">
                     <Input 
                       readOnly 
                       value={`${window.location.origin}/withdraw/confirm/${(selectedWithdrawal as any).confirmationToken}`} 
                       className="h-8 text-xs font-mono"
                     />
                     <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => copyToClipboard(`${window.location.origin}/withdraw/confirm/${(selectedWithdrawal as any).confirmationToken}`)}>
                        <Copy className="h-4 w-4" />
                     </Button>
                     <Button size="sm" variant="ghost" className="h-8 w-8 p-0" asChild>
                       <a href={`${window.location.origin}/withdraw/confirm/${(selectedWithdrawal as any).confirmationToken}`} target="_blank" rel="noopener noreferrer">
                         <ExternalLink className="h-4 w-4" />
                       </a>
                     </Button>
                   </div>
                </div>
              )}

              {(selectedWithdrawal as any).userSignature && (
                <div>
                  <Label className="text-muted-foreground">Chữ ký Khách hàng</Label>
                  <img
                    src={(selectedWithdrawal as any).userSignature}
                    alt="User Signature"
                    className="mt-2 h-24 object-contain rounded-lg border bg-white"
                  />
                  {(selectedWithdrawal as any).confirmedAt && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Ký lúc: {formatDate((selectedWithdrawal as any).confirmedAt)}
                    </p>
                  )}
                </div>
              )}

              {selectedWithdrawal.adminNote && (
                 <div>
                  <Label className="text-muted-foreground">Ghi chú admin</Label>
                  <p className="p-3 bg-gray-50 rounded-lg mt-1">{selectedWithdrawal.adminNote}</p>
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
              {processAction === 'approve' ? 'Duyệt yêu cầu' : processAction === 'complete' ? 'Hoàn tất rút tiền' : 'Từ chối yêu cầu'}
            </DialogTitle>
            <DialogDescription>
              {processAction === 'approve' ? 'Duyệt yêu cầu này để chuyển sang trạng thái chờ xử lý thanh toán.' :
               processAction === 'complete' ? 'Xác nhận đã chuyển tiền cho khách? Trạng thái sẽ chuyển thành Hoàn thành.' :
               'Từ chối yêu cầu rút tiền này? Số tiền sẽ được hoàn lại vào ví khách hàng.'}
            </DialogDescription>
          </DialogHeader>

          {selectedWithdrawal && (
             <div className="space-y-4">
               <div className="p-4 bg-gray-50 rounded-lg">
                 <p className="font-medium">{(selectedWithdrawal.user as User)?.fullName}</p>
                 <p className="font-semibold text-red-600 mt-1">Rút: {formatCurrency(selectedWithdrawal.amount)}</p>
                 <div className="text-sm text-muted-foreground mt-2">
                   {selectedWithdrawal.bankInfo.bankName} - {selectedWithdrawal.bankInfo.accountNumber}
                 </div>
               </div>
               
               <div>
                <Label>Ghi chú</Label>
                <Textarea
                  placeholder="Nhập ghi chú / Mã giao dịch ngân hàng..."
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
              variant={processAction === 'reject' ? 'destructive' : 'default'}
              className={processAction === 'complete' ? 'bg-green-600 hover:bg-green-700' : ''}
            >
              {processMutation.isPending ? 'Đang xử lý...' : 'Xác nhận'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Withdrawal Dialog - Single User */}
      <Dialog open={createDialogOpen} onOpenChange={(open) => { setCreateDialogOpen(open); if(!open) resetCreateForm(); }}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-orange-600" />
              Rút tiền cho người dùng
            </DialogTitle>
            <DialogDescription>
              Tạo lệnh rút tiền cho người dùng. Lệnh tạo sẽ ở trạng thái chờ người dùng xác nhận.
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
              <div className="bg-orange-50 p-3 rounded-lg flex justify-between items-center text-sm border border-orange-200">
                <div>
                  <p className="font-semibold text-orange-800">{selectedUser.fullName}</p>
                  <p className="text-orange-700">{selectedUser.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-orange-600">Số dư hiện tại</p>
                  <p className="font-bold text-orange-800">{formatCurrency(selectedUser.walletBalance)}</p>
                </div>
              </div>
            )}

            {/* Amount */}
             <div className="space-y-2">
               <Label>Số tiền rút (VND) *</Label>
               <Input
                type="number"
                placeholder="Nhập số tiền..."
                value={withdrawalAmount}
                onChange={(e) => setWithdrawalAmount(e.target.value)}
                min={1000}
               />
               <p className="text-xs text-muted-foreground">Người dùng sẽ xác nhận và số tiền sẽ được trừ sau khi họ ký tên.</p>
             </div>

             {/* Bank Info */}
             <div className="space-y-3 border-t pt-3">
               <h4 className="text-sm font-semibold flex items-center gap-2">
                 <CreditCard className="h-4 w-4" />
                 Thông tin nhận tiền
               </h4>
               <div className="grid grid-cols-2 gap-3">
                 <div className="space-y-2 col-span-2">
                    <Label>Ngân hàng *</Label>
                    <Input 
                      placeholder="VD: Vietcombank, Techcombank..." 
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                    />
                 </div>
                 <div className="space-y-2">
                    <Label>Số tài khoản *</Label>
                    <Input 
                      placeholder="Số tài khoản..." 
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                    />
                 </div>
                 <div className="space-y-2">
                    <Label>Chủ tài khoản *</Label>
                    <Input 
                      placeholder="Tên chủ tài khoản..." 
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                    />
                 </div>
               </div>
             </div>

             <div className="space-y-2">
               <Label>Ghi chú</Label>
               <Textarea
                placeholder="Ghi chú cho lệnh rút..."
                value={withdrawalNote}
                onChange={(e) => setWithdrawalNote(e.target.value)}
               />
             </div>
          </div>

          <DialogFooter className="mt-4 pt-4 border-t">
            <Button variant="outline" onClick={() => { setCreateDialogOpen(false); resetCreateForm(); }}>
              Hủy
            </Button>
            <Button
              onClick={handleCreateWithdrawal}
              disabled={isProcessing || !selectedUser || !withdrawalAmount || !bankName || !accountNumber || !accountName}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {isProcessing ? 'Đang tạo...' : 'Tạo lệnh rút'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Creation Result Dialog */}
      <Dialog open={resultDialogOpen} onOpenChange={setResultDialogOpen}>
        <DialogContent className="max-w-md flex flex-col items-center">
          <DialogHeader>
            <DialogTitle className="text-center text-green-600">Tạo lệnh rút thành công!</DialogTitle>
            <DialogDescription className="text-center">
              Khách hàng cần quét mã hoặc truy cập liên kết để xác nhận.
            </DialogDescription>
          </DialogHeader>

          {createdResult && (
             <div className="w-full space-y-4">
                 <div className="bg-orange-50 p-3 rounded-lg text-center">
                   <p className="font-medium text-orange-900">{createdResult.user.fullName}</p>
                   <p className="text-sm text-orange-700">{createdResult.user.email}</p>
                 </div>

                 <div className="flex flex-col items-center gap-3">
                    <div className="bg-white p-3 rounded shadow-sm border">
                      <QRCode value={`${window.location.origin}${createdResult.confirmationUrl}`} size={180} />
                    </div>
                 </div>

                 <div className="space-y-2">
                    <p className="text-xs text-center font-medium">Sao chép liên kết xác nhận</p>
                    <div className="flex gap-2">
                       <Input 
                         readOnly 
                         value={`${window.location.origin}${createdResult.confirmationUrl}`} 
                         className="h-9 text-xs font-mono"
                       />
                       <Button size="sm" variant="outline" className="h-9 w-9 p-0" onClick={() => copyToClipboard(`${window.location.origin}${createdResult.confirmationUrl}`)}>
                         <Copy className="h-4 w-4" />
                       </Button>
                    </div>
                    <div className="flex justify-center mt-2">
                      <Button variant="link" size="sm" asChild>
                         <a href={`${window.location.origin}${createdResult.confirmationUrl}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                           Mở trong tab mới <ExternalLink className="h-3 w-3" />
                         </a>
                      </Button>
                    </div>
                 </div>
             </div>
          )}

          <DialogFooter className="w-full">
             <Button onClick={() => setResultDialogOpen(false)} className="w-full">Hoàn tất</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
