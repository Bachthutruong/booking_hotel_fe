import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  Eye,
  Wallet,
  User,
  Plus,
  Check,
  X,
  Filter,
  UserPlus,
  ChevronsUpDown,
  PenTool,
  AlertCircle,
  Sparkles,
  Copy,
  ExternalLink,
  CreditCard,
  ArrowDownToLine,
  ArrowUpFromLine,
  List,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
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
import { cn, formatPrice, formatPriceInput, parsePriceInput } from '@/lib/utils';
import { walletService } from '@/services/walletService';
import { promotionService } from '@/services/promotionService';
import { useToast } from '@/hooks/use-toast';
import SignatureCanvas from 'react-signature-canvas';
import QRCode from 'react-qr-code';
import type {
  User as UserType,
  WalletTransaction,
  DepositRequest,
  WithdrawalRequest,
} from '@/types';

type DepositRequestWithMeta = DepositRequest & { adminSignature?: string; isAdminCreated?: boolean };
type WithdrawalRequestWithMeta = WithdrawalRequest & {
  confirmationToken?: string;
  userSignature?: string;
  confirmedAt?: string;
  isAdminCreated?: boolean;
};

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const transactionTypeLabels: Record<string, string> = {
  deposit: 'Nạp tiền',
  withdrawal: 'Hoàn tiền',
  payment: 'Thanh toán',
  refund: 'Hoàn tiền',
  bonus: 'Khuyến mãi',
};

const depositStatusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: 'Chờ duyệt', color: 'bg-yellow-100 text-yellow-700' },
  approved: { label: 'Đã duyệt', color: 'bg-green-100 text-green-700' },
  rejected: { label: 'Từ chối', color: 'bg-red-100 text-red-700' },
};

const withdrawalStatusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: 'Chờ xử lý', color: 'bg-yellow-100 text-yellow-700' },
  pending_confirmation: { label: 'Chờ KH xác nhận', color: 'bg-orange-100 text-orange-700' },
  approved: { label: 'Đã duyệt', color: 'bg-blue-100 text-blue-700' },
  completed: { label: 'Hoàn thành', color: 'bg-green-100 text-green-700' },
  rejected: { label: 'Từ chối', color: 'bg-red-100 text-red-700' },
};

export default function WalletsManagePage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const signatureRef = useRef<SignatureCanvas>(null);

  const [activeTab, setActiveTab] = useState<string>('wallets');

  // --- Danh sách ví ---
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [txPage, setTxPage] = useState(1);
  const [txDetailDialog, setTxDetailDialog] = useState<{
    type: 'deposit' | 'withdrawal';
    id: string;
  } | null>(null);

  // --- Nạp tiền ---
  const [depositStatusFilter, setDepositStatusFilter] = useState<string>('all');
  const [depositPage, setDepositPage] = useState(1);
  const [selectedDeposit, setSelectedDeposit] = useState<DepositRequest | null>(null);
  const [viewDepositOpen, setViewDepositOpen] = useState(false);
  const [processDepositOpen, setProcessDepositOpen] = useState(false);
  const [processDepositAction, setProcessDepositAction] = useState<'approve' | 'reject'>('approve');
  const [adminNoteDeposit, setAdminNoteDeposit] = useState('');
  const [createDepositOpen, setCreateDepositOpen] = useState(false);
  const [selectedUserDeposit, setSelectedUserDeposit] = useState<UserType | null>(null);
  const [openComboboxDeposit, setOpenComboboxDeposit] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositNote, setDepositNote] = useState('');
  const [userSearchDeposit, setUserSearchDeposit] = useState('');
  const [isProcessingDeposit, setIsProcessingDeposit] = useState(false);

  // --- Hoàn tiền ---
  const [withdrawalStatusFilter, setWithdrawalStatusFilter] = useState<string>('all');
  const [withdrawalPage, setWithdrawalPage] = useState(1);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalRequest | null>(null);
  const [viewWithdrawalOpen, setViewWithdrawalOpen] = useState(false);
  const [processWithdrawalOpen, setProcessWithdrawalOpen] = useState(false);
  const [processWithdrawalAction, setProcessWithdrawalAction] = useState<'approve' | 'reject' | 'complete'>('approve');
  const [adminNoteWithdrawal, setAdminNoteWithdrawal] = useState('');
  const [createWithdrawalOpen, setCreateWithdrawalOpen] = useState(false);
  const [selectedUserWithdrawal, setSelectedUserWithdrawal] = useState<UserType | null>(null);
  const [openComboboxWithdrawal, setOpenComboboxWithdrawal] = useState(false);
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [withdrawalNote, setWithdrawalNote] = useState('');
  const [userSearchWithdrawal, setUserSearchWithdrawal] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [isProcessingWithdrawal, setIsProcessingWithdrawal] = useState(false);
  const [resultDialogOpen, setResultDialogOpen] = useState(false);
  const [createdResult, setCreatedResult] = useState<{ confirmationUrl: string; user: UserType } | null>(null);

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['adminUsersWallet', search, page],
    queryFn: () => walletService.getAllUsersWallet({ search, page, limit: 10 }),
    enabled: activeTab === 'wallets',
  });

  const { data: userDetailsData, isLoading: detailsLoading } = useQuery({
    queryKey: ['adminUserWalletDetails', selectedUser?._id, txPage],
    queryFn: () => walletService.getUserWalletDetails(selectedUser!._id, { page: txPage, limit: 10 }),
    enabled: !!selectedUser && detailsDialogOpen,
  });

  const { data: depositDetailData } = useQuery({
    queryKey: ['adminDepositDetail', txDetailDialog?.id],
    queryFn: () => walletService.getDepositDetail(txDetailDialog!.id),
    enabled: !!txDetailDialog && txDetailDialog.type === 'deposit',
  });

  const { data: withdrawalDetailData } = useQuery({
    queryKey: ['adminWithdrawalDetail', txDetailDialog?.id],
    queryFn: () => walletService.getWithdrawalDetail(txDetailDialog!.id),
    enabled: !!txDetailDialog && txDetailDialog.type === 'withdrawal',
  });

  const { data: depositsData, isLoading: depositsLoading } = useQuery({
    queryKey: ['adminDeposits', depositStatusFilter, depositPage],
    queryFn: () =>
      walletService.getAllDeposits({
        status: depositStatusFilter !== 'all' ? depositStatusFilter : undefined,
        page: depositPage,
        limit: 10,
      }),
    enabled: activeTab === 'deposits',
  });

  const { data: withdrawalsData, isLoading: withdrawalsLoading } = useQuery({
    queryKey: ['adminWithdrawals', withdrawalStatusFilter, withdrawalPage],
    queryFn: () =>
      walletService.getAllWithdrawals({
        status: withdrawalStatusFilter !== 'all' ? withdrawalStatusFilter : undefined,
        page: withdrawalPage,
        limit: 10,
      }),
    enabled: activeTab === 'withdrawals',
  });

  const { data: usersForDeposit } = useQuery({
    queryKey: ['adminUsers', userSearchDeposit],
    queryFn: () => walletService.getAllUsersWallet({ search: userSearchDeposit, limit: 100 }),
    enabled: createDepositOpen,
  });

  const { data: usersForWithdrawal } = useQuery({
    queryKey: ['adminUsersW', userSearchWithdrawal],
    queryFn: () => walletService.getAllUsersWallet({ search: userSearchWithdrawal, limit: 100 }),
    enabled: createWithdrawalOpen,
  });

  const { data: bonusPreview } = useQuery({
    queryKey: ['bonusPreview', depositAmount],
    queryFn: () => promotionService.calculatePromotion(Number(depositAmount)),
    enabled: !!depositAmount && Number(depositAmount) >= 10000 && createDepositOpen,
  });

  useEffect(() => {
    if (selectedUserWithdrawal) setAccountName(selectedUserWithdrawal.fullName);
  }, [selectedUserWithdrawal]);

  const processDepositMutation = useMutation({
    mutationFn: ({ id, action, note }: { id: string; action: 'approve' | 'reject'; note?: string }) =>
      walletService.processDeposit(id, action, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminDeposits'] });
      queryClient.invalidateQueries({ queryKey: ['adminUserWalletDetails'] });
      toast({
        title: 'Thành công',
        description: processDepositAction === 'approve' ? 'Đã duyệt yêu cầu nạp tiền' : 'Đã từ chối',
      });
      setProcessDepositOpen(false);
      setSelectedDeposit(null);
      setAdminNoteDeposit('');
    },
    onError: () => toast({ title: 'Lỗi', description: 'Không thể xử lý', variant: 'destructive' }),
  });

  const processWithdrawalMutation = useMutation({
    mutationFn: ({ id, action, note }: { id: string; action: 'approve' | 'reject' | 'complete'; note?: string }) =>
      walletService.processWithdrawal(id, action, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminWithdrawals'] });
      queryClient.invalidateQueries({ queryKey: ['adminUserWalletDetails'] });
      toast({ title: 'Thành công', description: 'Đã cập nhật trạng thái' });
      setProcessWithdrawalOpen(false);
      setSelectedWithdrawal(null);
      setAdminNoteWithdrawal('');
    },
    onError: () => toast({ title: 'Lỗi', description: 'Không thể xử lý', variant: 'destructive' }),
  });

  const users = usersData?.data || [];
  const pagination = usersData?.pagination;
  const userDetails = userDetailsData?.data;
  const txPagination = userDetailsData?.pagination;
  const deposits = depositsData?.data || [];
  const depositsPagination = depositsData?.pagination;
  const withdrawals = withdrawalsData?.data || [];
  const withdrawalsPagination = withdrawalsData?.pagination;
  const usersDeposit = usersForDeposit?.data || [];
  const usersWithdrawal = usersForWithdrawal?.data || [];

  const resetCreateDepositForm = () => {
    setSelectedUserDeposit(null);
    setDepositAmount('');
    setDepositNote('');
    setUserSearchDeposit('');
    signatureRef.current?.clear();
  };

  const resetCreateWithdrawalForm = () => {
    setSelectedUserWithdrawal(null);
    setWithdrawalAmount('');
    setWithdrawalNote('');
    setUserSearchWithdrawal('');
    setBankName('');
    setAccountNumber('');
    setAccountName('');
  };

  const handleCreateDeposit = async () => {
    if (!selectedUserDeposit || !depositAmount || Number(depositAmount) < 1000) {
      toast({ title: 'Lỗi', description: 'Chọn người dùng và nhập số tiền >= 1,000đ', variant: 'destructive' });
      return;
    }
    if (signatureRef.current?.isEmpty()) {
      toast({ title: 'Lỗi', description: 'Vui lòng ký xác nhận', variant: 'destructive' });
      return;
    }
    setIsProcessingDeposit(true);
    try {
      await walletService.adminCreateDeposit({
        userId: selectedUserDeposit._id,
        amount: Number(depositAmount),
        note: depositNote,
        signature: signatureRef.current?.toDataURL() || '',
      });
      toast({ title: 'Thành công', description: `Đã nạp ${formatPrice(Number(depositAmount))} cho ${selectedUserDeposit.fullName}` });
      queryClient.invalidateQueries({ queryKey: ['adminDeposits'] });
      queryClient.invalidateQueries({ queryKey: ['adminUserWalletDetails'] });
      setCreateDepositOpen(false);
      resetCreateDepositForm();
    } catch (e: unknown) {
      const msg = e && typeof e === 'object' && 'response' in e && typeof (e as { response?: { data?: { message?: string } } }).response?.data?.message === 'string'
        ? (e as { response: { data: { message: string } } }).response.data.message
        : 'Không thể nạp tiền';
      toast({ title: 'Lỗi', description: msg, variant: 'destructive' });
    } finally {
      setIsProcessingDeposit(false);
    }
  };

  const handleCreateWithdrawal = async () => {
    const amount = Number(withdrawalAmount);
    if (!selectedUserWithdrawal || !withdrawalAmount || amount < 1000) {
      toast({ title: 'Lỗi', description: 'Chọn người dùng và nhập số tiền >= 1,000đ', variant: 'destructive' });
      return;
    }
    if (!bankName || !accountNumber || !accountName) {
      toast({ title: 'Lỗi', description: 'Nhập đầy đủ thông tin tài khoản', variant: 'destructive' });
      return;
    }
    if ((selectedUserWithdrawal.walletBalance || 0) < amount) {
      toast({ title: 'Số dư không đủ', variant: 'destructive' });
      return;
    }
    setIsProcessingWithdrawal(true);
    try {
      const res = await walletService.adminCreateWithdrawal({
        userId: selectedUserWithdrawal._id,
        amount,
        note: withdrawalNote,
        bankInfo: { bankName, accountNumber, accountName },
      });
      queryClient.invalidateQueries({ queryKey: ['adminWithdrawals'] });
      queryClient.invalidateQueries({ queryKey: ['adminUserWalletDetails'] });
      setCreatedResult({
        confirmationUrl: (res.data as unknown as { confirmationUrl: string }).confirmationUrl,
        user: selectedUserWithdrawal,
      });
      setCreateWithdrawalOpen(false);
      setResultDialogOpen(true);
      resetCreateWithdrawalForm();
    } catch (e: unknown) {
      const msg = e && typeof e === 'object' && 'response' in e && typeof (e as { response?: { data?: { message?: string } } }).response?.data?.message === 'string'
        ? (e as { response: { data: { message: string } } }).response.data.message
        : 'Không thể tạo lệnh';
      toast({ title: 'Lỗi', description: msg, variant: 'destructive' });
    } finally {
      setIsProcessingWithdrawal(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Đã sao chép' });
  };

  const openTxDetail = (tx: WalletTransaction) => {
    if (tx.referenceModel === 'DepositRequest' && tx.reference) {
      setTxDetailDialog({ type: 'deposit', id: tx.reference });
    } else if ((tx.referenceModel === 'WithdrawalRequest' || tx.type === 'withdrawal') && tx.reference) {
      setTxDetailDialog({ type: 'withdrawal', id: tx.reference });
    }
  };

  const displayDepositDetail = txDetailDialog?.type === 'deposit' ? depositDetailData?.data : null;
  const displayWithdrawalDetail = txDetailDialog?.type === 'withdrawal' ? withdrawalDetailData?.data : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Quản lý ví</h1>
        <p className="text-muted-foreground">Danh sách ví, nạp tiền, hoàn tiền và lịch sử giao dịch</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-lg grid-cols-3">
          <TabsTrigger value="wallets" className="gap-2">
            <List className="h-4 w-4" />
            Danh sách ví
          </TabsTrigger>
          <TabsTrigger value="deposits" className="gap-2">
            <ArrowDownToLine className="h-4 w-4" />
            Nạp tiền
          </TabsTrigger>
          <TabsTrigger value="withdrawals" className="gap-2">
            <ArrowUpFromLine className="h-4 w-4" />
            Hoàn tiền
          </TabsTrigger>
        </TabsList>

        {/* Tab: Danh sách ví */}
        <TabsContent value="wallets" className="space-y-4 mt-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4 mb-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Tìm theo tên, email, SĐT..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                    className="pl-10"
                  />
                </div>
              </div>
              {usersLoading ? (
                <div className="text-center py-8">Đang tải...</div>
              ) : users.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">Không tìm thấy người dùng</div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Người dùng</TableHead>
                        <TableHead>Số dư chính</TableHead>
                        <TableHead>Tiền khuyến mãi</TableHead>
                        <TableHead>Tổng số dư</TableHead>
                        <TableHead>Trạng thái</TableHead>
                        <TableHead className="text-right">Thao tác</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user: UserType) => (
                        <TableRow key={user._id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                {user.avatar ? (
                                  <img src={user.avatar} alt="" className="h-10 w-10 rounded-full object-cover" />
                                ) : (
                                  <User className="h-5 w-5 text-primary" />
                                )}
                              </div>
                              <div>
                                <p className="font-medium">{user.fullName}</p>
                                <p className="text-sm text-muted-foreground">{user.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="font-semibold">{formatPrice(user.walletBalance || 0)}</TableCell>
                          <TableCell className="text-amber-600">{formatPrice(user.bonusBalance || 0)}</TableCell>
                          <TableCell className="font-bold text-green-600">
                            {formatPrice((user.walletBalance || 0) + (user.bonusBalance || 0))}
                          </TableCell>
                          <TableCell>
                            <Badge className={user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                              {user.isActive ? 'Hoạt động' : 'Khóa'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedUser(user);
                                setTxPage(1);
                                setDetailsDialogOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4 mr-1" /> Chi tiết
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {pagination && pagination.totalPages > 1 && (
                    <div className="flex justify-center gap-2 mt-4">
                      <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="px-4 py-2 text-sm">Trang {page} / {pagination.totalPages}</span>
                      <Button variant="outline" size="sm" disabled={page === pagination.totalPages} onClick={() => setPage(page + 1)}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Nạp tiền */}
        <TabsContent value="deposits" className="space-y-4 mt-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Yêu cầu nạp tiền</h2>
              <p className="text-sm text-muted-foreground">Duyệt và tạo nạp tiền cho người dùng</p>
            </div>
            <Button onClick={() => setCreateDepositOpen(true)} className="bg-green-600 hover:bg-green-700">
              <Plus className="h-4 w-4 mr-2" /> Nạp tiền cho người dùng
            </Button>
          </div>
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4 items-center mb-4">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={depositStatusFilter} onValueChange={setDepositStatusFilter}>
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
              {depositsLoading ? (
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
                      {deposits.map((deposit: DepositRequestWithMeta) => {
                        const user = deposit.user as UserType;
                        const statusInfo = depositStatusLabels[deposit.status];
                        return (
                          <TableRow key={deposit._id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{user?.fullName}</p>
                                <p className="text-sm text-muted-foreground">{user?.email}</p>
                              </div>
                            </TableCell>
                            <TableCell className="font-semibold">{formatPrice(deposit.amount)}</TableCell>
                            <TableCell>
                              {deposit.bonusAmount > 0 ? (
                                <span className="text-amber-600">+{formatPrice(deposit.bonusAmount)}</span>
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
                              <Badge className={statusInfo?.color}>{statusInfo?.label}</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button size="sm" variant="outline" onClick={() => { setSelectedDeposit(deposit); setViewDepositOpen(true); }}>
                                  <Eye className="h-4 w-4" />
                                </Button>
                                {deposit.status === 'pending' && (
                                  <>
                                    <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => { setSelectedDeposit(deposit); setProcessDepositAction('approve'); setProcessDepositOpen(true); }}>
                                      <Check className="h-4 w-4" />
                                    </Button>
                                    <Button size="sm" variant="destructive" onClick={() => { setSelectedDeposit(deposit); setProcessDepositAction('reject'); setProcessDepositOpen(true); }}>
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
                  {depositsPagination && depositsPagination.totalPages > 1 && (
                    <div className="flex justify-center gap-2 mt-4">
                      <Button variant="outline" size="sm" disabled={depositPage === 1} onClick={() => setDepositPage(depositPage - 1)}>Trước</Button>
                      <span className="px-4 py-2 text-sm">Trang {depositPage} / {depositsPagination.totalPages}</span>
                      <Button variant="outline" size="sm" disabled={depositPage === depositsPagination.totalPages} onClick={() => setDepositPage(depositPage + 1)}>Sau</Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Hoàn tiền */}
        <TabsContent value="withdrawals" className="space-y-4 mt-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Yêu cầu hoàn tiền</h2>
              <p className="text-sm text-muted-foreground">Xử lý và tạo lệnh hoàn tiền</p>
            </div>
            <Button onClick={() => setCreateWithdrawalOpen(true)} className="bg-orange-600 hover:bg-orange-700">
              <Plus className="h-4 w-4 mr-2" /> Hoàn tiền cho người dùng
            </Button>
          </div>
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4 items-center mb-4">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={withdrawalStatusFilter} onValueChange={setWithdrawalStatusFilter}>
                  <SelectTrigger className="w-44">
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
              {withdrawalsLoading ? (
                <div className="text-center py-8">Đang tải...</div>
              ) : withdrawals.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">Không có yêu cầu hoàn tiền nào</div>
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
                      {withdrawals.map((withdrawal: WithdrawalRequestWithMeta) => {
                        const user = withdrawal.user as UserType;
                        const statusInfo = withdrawalStatusLabels[withdrawal.status] || { label: withdrawal.status, color: 'bg-gray-100' };
                        return (
                          <TableRow key={withdrawal._id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{user?.fullName}</p>
                                <p className="text-sm text-muted-foreground">{user?.email}</p>
                              </div>
                            </TableCell>
                            <TableCell className="font-semibold text-red-600">-{formatPrice(withdrawal.amount)}</TableCell>
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
                                <Button size="sm" variant="outline" onClick={() => { setSelectedWithdrawal(withdrawal); setViewWithdrawalOpen(true); }}>
                                  <Eye className="h-4 w-4" />
                                </Button>
                                {withdrawal.status === 'pending' && (
                                  <>
                                    <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => { setSelectedWithdrawal(withdrawal); setProcessWithdrawalAction('approve'); setProcessWithdrawalOpen(true); }}>
                                      <Check className="h-4 w-4" />
                                    </Button>
                                    <Button size="sm" variant="destructive" onClick={() => { setSelectedWithdrawal(withdrawal); setProcessWithdrawalAction('reject'); setProcessWithdrawalOpen(true); }}>
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                                {withdrawal.status === 'approved' && (
                                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => { setSelectedWithdrawal(withdrawal); setProcessWithdrawalAction('complete'); setProcessWithdrawalOpen(true); }}>
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
                  {withdrawalsPagination && withdrawalsPagination.totalPages > 1 && (
                    <div className="flex justify-center gap-2 mt-4">
                      <Button variant="outline" size="sm" disabled={withdrawalPage === 1} onClick={() => setWithdrawalPage(withdrawalPage - 1)}>Trước</Button>
                      <span className="px-4 py-2 text-sm">Trang {withdrawalPage} / {withdrawalsPagination.totalPages}</span>
                      <Button variant="outline" size="sm" disabled={withdrawalPage === withdrawalsPagination.totalPages} onClick={() => setWithdrawalPage(withdrawalPage + 1)}>Sau</Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog: Chi tiết ví (user balance + transaction history) */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" /> Chi tiết ví
            </DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6">
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  {selectedUser.avatar ? (
                    <img src={selectedUser.avatar} alt="" className="h-16 w-16 rounded-full object-cover" />
                  ) : (
                    <User className="h-8 w-8 text-primary" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-lg">{selectedUser.fullName}</p>
                  <p className="text-muted-foreground">{selectedUser.email}</p>
                  <p className="text-muted-foreground">{selectedUser.phone}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground">Số dư chính</p>
                    <p className="text-xl font-bold">{formatPrice(userDetails?.user?.walletBalance || 0)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground">Tiền khuyến mãi</p>
                    <p className="text-xl font-bold text-amber-600">{formatPrice(userDetails?.user?.bonusBalance || 0)}</p>
                  </CardContent>
                </Card>
                <Card className="bg-green-50">
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground">Tổng cộng</p>
                    <p className="text-xl font-bold text-green-600">
                      {formatPrice((userDetails?.user?.walletBalance || 0) + (userDetails?.user?.bonusBalance || 0))}
                    </p>
                  </CardContent>
                </Card>
              </div>
              <div>
                <h3 className="font-semibold mb-3">Lịch sử nạp / rút / trừ tiền</h3>
                {detailsLoading ? (
                  <div className="text-center py-4">Đang tải...</div>
                ) : !userDetails?.transactions?.length ? (
                  <div className="text-center py-4 text-muted-foreground">Chưa có giao dịch</div>
                ) : (
                  <>
                    <div className="space-y-2">
                      {userDetails.transactions.map((tx: WalletTransaction) => {
                        const isPositive = ['deposit', 'refund', 'bonus'].includes(tx.type);
                        const canViewDetail =
                          (tx.referenceModel === 'DepositRequest' || tx.referenceModel === 'WithdrawalRequest') && tx.reference;
                        return (
                          <div
                            key={tx._id}
                            className={cn(
                              'flex items-center justify-between p-3 rounded-lg',
                              canViewDetail ? 'bg-gray-50 hover:bg-gray-100 cursor-pointer' : 'bg-gray-50'
                            )}
                            onClick={() => canViewDetail && openTxDetail(tx)}
                          >
                            <div>
                              <p className="font-medium">{transactionTypeLabels[tx.type]}</p>
                              <p className="text-sm text-muted-foreground">{tx.description}</p>
                              <p className="text-xs text-muted-foreground">{formatDate(tx.createdAt)}</p>
                            </div>
                            <div className="text-right flex items-center gap-2">
                              <p className={`font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                                {isPositive ? '+' : '-'}{formatPrice(tx.amount)}
                              </p>
                              <p className="text-xs text-muted-foreground">Sau: {formatPrice(tx.balanceAfter)}</p>
                              {canViewDetail && (
                                <Button size="sm" variant="ghost" className="h-8">Chi tiết</Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {txPagination && txPagination.totalPages > 1 && (
                      <div className="flex justify-center gap-2 mt-4">
                        <Button variant="outline" size="sm" disabled={txPage === 1} onClick={() => setTxPage(txPage - 1)}>Trước</Button>
                        <span className="px-4 py-2 text-sm">Trang {txPage} / {txPagination.totalPages}</span>
                        <Button variant="outline" size="sm" disabled={txPage === txPagination.totalPages} onClick={() => setTxPage(txPage + 1)}>Sau</Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog: Chi tiết nạp / hoàn (khi click 1 dòng trong lịch sử) */}
      <Dialog open={!!txDetailDialog} onOpenChange={(open) => !open && setTxDetailDialog(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {txDetailDialog?.type === 'deposit' ? 'Chi tiết yêu cầu nạp tiền' : 'Chi tiết yêu cầu hoàn tiền'}
            </DialogTitle>
          </DialogHeader>
          {txDetailDialog?.type === 'deposit' && displayDepositDetail && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Khách hàng</Label>
                  <p className="font-medium">{(displayDepositDetail.user as UserType)?.fullName}</p>
                  <p className="text-sm text-muted-foreground">{(displayDepositDetail.user as UserType)?.email}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Số tiền</Label>
                  <p className="font-semibold text-lg">{formatPrice(displayDepositDetail.amount)}</p>
                  {displayDepositDetail.bonusAmount > 0 && (
                    <p className="text-amber-600">+{formatPrice(displayDepositDetail.bonusAmount)} khuyến mãi</p>
                  )}
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Thông tin chuyển khoản</Label>
                <div className="p-3 bg-gray-50 rounded-lg mt-1 text-sm">
                  <p>Ngân hàng: {displayDepositDetail.bankInfo.bankName}</p>
                  <p>STK: {displayDepositDetail.bankInfo.accountNumber}</p>
                  <p>Chủ TK: {displayDepositDetail.bankInfo.accountName}</p>
                  <p>Nội dung: {displayDepositDetail.bankInfo.transferContent}</p>
                </div>
              </div>
              {displayDepositDetail.proofImage && (
                <div>
                  <Label className="text-muted-foreground">Ảnh minh chứng</Label>
                  <img src={displayDepositDetail.proofImage} alt="Proof" className="mt-2 w-full max-h-64 object-contain rounded-lg border" />
                </div>
              )}
              {(displayDepositDetail as DepositRequestWithMeta).adminSignature && (
                <div>
                  <Label className="text-muted-foreground">Chữ ký Admin</Label>
                  <img src={(displayDepositDetail as DepositRequestWithMeta).adminSignature} alt="Admin Signature" className="mt-2 max-h-24 object-contain rounded-lg border bg-white" />
                </div>
              )}
              {displayDepositDetail.adminNote && (
                <div>
                  <Label className="text-muted-foreground">Ghi chú admin</Label>
                  <p className="p-3 bg-gray-50 rounded-lg mt-1">{displayDepositDetail.adminNote}</p>
                </div>
              )}
              <div>
                <Label className="text-muted-foreground">Trạng thái</Label>
                <Badge className={depositStatusLabels[displayDepositDetail.status]?.color}>{depositStatusLabels[displayDepositDetail.status]?.label}</Badge>
              </div>
            </div>
          )}
          {txDetailDialog?.type === 'withdrawal' && displayWithdrawalDetail && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Khách hàng</Label>
                  <p className="font-medium">{(displayWithdrawalDetail.user as UserType)?.fullName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Số tiền hoàn</Label>
                  <p className="font-semibold text-lg text-red-600">{formatPrice(displayWithdrawalDetail.amount)}</p>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Thông tin tài khoản</Label>
                <div className="p-3 bg-gray-50 rounded-lg mt-1 text-sm">
                  <p>Tên ngân hàng: {displayWithdrawalDetail.bankInfo.bankName}</p>
                  <p>STK: {displayWithdrawalDetail.bankInfo.accountNumber}</p>
                  <p>Chủ TK: {displayWithdrawalDetail.bankInfo.accountName}</p>
                </div>
              </div>
              {(displayWithdrawalDetail as WithdrawalRequestWithMeta).confirmationToken && displayWithdrawalDetail.status === 'pending_confirmation' && (
                <div className="flex flex-col items-center p-4 border rounded-lg bg-orange-50">
                  <Label className="mb-2 text-orange-700 font-semibold">Đang chờ khách hàng xác nhận</Label>
                  <div className="bg-white p-2 rounded">
                    <QRCode value={`${window.location.origin}/withdraw/confirm/${(displayWithdrawalDetail as WithdrawalRequestWithMeta).confirmationToken}`} size={100} />
                  </div>
                </div>
              )}
              {(displayWithdrawalDetail as WithdrawalRequestWithMeta).userSignature && (
                <div>
                  <Label className="text-muted-foreground">Chữ ký Khách hàng</Label>
                  <img src={(displayWithdrawalDetail as WithdrawalRequestWithMeta).userSignature} alt="User Signature" className="mt-2 h-24 object-contain rounded-lg border bg-white" />
                </div>
              )}
              {displayWithdrawalDetail.adminNote && (
                <div>
                  <Label className="text-muted-foreground">Ghi chú admin</Label>
                  <p className="p-3 bg-gray-50 rounded-lg mt-1">{displayWithdrawalDetail.adminNote}</p>
                </div>
              )}
              <div>
                <Label className="text-muted-foreground">Trạng thái</Label>
                <Badge className={withdrawalStatusLabels[displayWithdrawalDetail.status]?.color}>{withdrawalStatusLabels[displayWithdrawalDetail.status]?.label}</Badge>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* View Deposit Dialog (từ tab Nạp tiền) */}
      <Dialog open={viewDepositOpen} onOpenChange={setViewDepositOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Chi tiết yêu cầu nạp tiền</DialogTitle>
          </DialogHeader>
          {selectedDeposit && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Khách hàng</Label>
                  <p className="font-medium">{(selectedDeposit.user as UserType)?.fullName}</p>
                  <p className="text-sm text-muted-foreground">{(selectedDeposit.user as UserType)?.email}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Số tiền</Label>
                  <p className="font-semibold text-lg">{formatPrice(selectedDeposit.amount)}</p>
                  {selectedDeposit.bonusAmount > 0 && <p className="text-amber-600">+{formatPrice(selectedDeposit.bonusAmount)} khuyến mãi</p>}
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
                  <img src={selectedDeposit.proofImage} alt="Proof" className="mt-2 w-full max-h-64 object-contain rounded-lg border" />
                </div>
              )}
              {(selectedDeposit as DepositRequestWithMeta).adminSignature && (
                <div>
                  <Label className="text-muted-foreground">Chữ ký Admin</Label>
                  <img src={(selectedDeposit as DepositRequestWithMeta).adminSignature} alt="Admin Signature" className="mt-2 max-h-24 object-contain rounded-lg border bg-white" />
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

      {/* Process Deposit Dialog */}
      <Dialog open={processDepositOpen} onOpenChange={setProcessDepositOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{processDepositAction === 'approve' ? 'Duyệt yêu cầu nạp tiền' : 'Từ chối yêu cầu nạp tiền'}</DialogTitle>
            <DialogDescription>
              {processDepositAction === 'approve' ? 'Xác nhận duyệt? Số tiền sẽ được cộng vào ví.' : 'Xác nhận từ chối?'}
            </DialogDescription>
          </DialogHeader>
          {selectedDeposit && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-muted-foreground">Khách hàng</p>
                <p className="font-medium">{(selectedDeposit.user as UserType)?.fullName}</p>
                <p className="text-sm text-muted-foreground mt-2">Số tiền</p>
                <p className="font-semibold text-lg">{formatPrice(selectedDeposit.amount)}</p>
                {selectedDeposit.bonusAmount > 0 && <p className="text-amber-600">+{formatPrice(selectedDeposit.bonusAmount)} khuyến mãi</p>}
              </div>
              <div>
                <Label>Ghi chú (không bắt buộc)</Label>
                <Textarea placeholder="Nhập ghi chú..." value={adminNoteDeposit} onChange={(e) => setAdminNoteDeposit(e.target.value)} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setProcessDepositOpen(false)}>Hủy</Button>
            <Button
              onClick={() => selectedDeposit && processDepositMutation.mutate({ id: selectedDeposit._id, action: processDepositAction, note: adminNoteDeposit })}
              disabled={processDepositMutation.isPending}
              className={processDepositAction === 'approve' ? 'bg-green-600 hover:bg-green-700' : ''}
              variant={processDepositAction === 'reject' ? 'destructive' : 'default'}
            >
              {processDepositMutation.isPending ? 'Đang xử lý...' : processDepositAction === 'approve' ? 'Duyệt' : 'Từ chối'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Deposit Dialog */}
      <Dialog open={createDepositOpen} onOpenChange={(o) => { setCreateDepositOpen(o); if (!o) resetCreateDepositForm(); }}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-green-600" /> Nạp tiền cho người dùng
            </DialogTitle>
            <DialogDescription>Chọn người dùng và nhập số tiền. Yêu cầu chữ ký xác nhận.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Chọn người dùng *</Label>
              <Popover open={openComboboxDeposit} onOpenChange={setOpenComboboxDeposit}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" aria-expanded={openComboboxDeposit} className="w-full justify-between">
                    {selectedUserDeposit ? <span className="truncate">{selectedUserDeposit.fullName} ({selectedUserDeposit.email})</span> : 'Tìm kiếm người dùng...'}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0">
                  <Command shouldFilter={false}>
                    <CommandInput placeholder="Tìm theo tên, email, sđt..." value={userSearchDeposit} onValueChange={setUserSearchDeposit} />
                    <CommandList>
                      <CommandEmpty>Không tìm thấy.</CommandEmpty>
                      <CommandGroup>
                        {usersDeposit.map((user) => (
                          <CommandItem
                            key={user._id}
                            value={user._id}
                            onSelect={() => { setSelectedUserDeposit(user); setOpenComboboxDeposit(false); }}
                          >
                            <Check className={cn('mr-2 h-4 w-4', selectedUserDeposit?._id === user._id ? 'opacity-100' : 'opacity-0')} />
                            <div className="flex flex-col">
                              <span>{user.fullName}</span>
                              <span className="text-xs text-muted-foreground">{user.email} - {user.phone}</span>
                            </div>
                            <span className="ml-auto text-xs text-muted-foreground">{formatPrice(user.walletBalance || 0)}</span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            {selectedUserDeposit && (
              <div className="bg-green-50 p-3 rounded-lg flex justify-between items-center text-sm border border-green-200">
                <div>
                  <p className="font-semibold text-green-800">{selectedUserDeposit.fullName}</p>
                  <p className="text-green-700">{selectedUserDeposit.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-green-600">Số dư hiện tại</p>
                  <p className="font-bold text-green-800">{formatPrice(selectedUserDeposit.walletBalance || 0)}</p>
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label>Số tiền nạp (VND) *</Label>
              <Input
                type="text"
                inputMode="numeric"
                placeholder="Tối thiểu 1.000đ"
                value={formatPriceInput(depositAmount)}
                onChange={(e) => setDepositAmount(parsePriceInput(e.target.value))}
              />
              {bonusPreview?.data && bonusPreview.data.bonusAmount > 0 && (
                <div className="bg-amber-50 p-2 rounded-lg border border-amber-100 flex items-center justify-between text-sm mt-2">
                  <span className="text-amber-700 flex items-center gap-1 font-medium">
                    <Sparkles className="h-4 w-4" /> Khuyến mãi: +{formatPrice(bonusPreview.data.bonusAmount)}
                  </span>
                  <span className="text-amber-900 font-bold">Tổng nhận: {formatPrice(bonusPreview.data.totalReceive)}</span>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>Ghi chú</Label>
              <Textarea placeholder="Ghi chú..." value={depositNote} onChange={(e) => setDepositNote(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><PenTool className="h-4 w-4" /> Chữ ký xác nhận *</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-2 bg-white">
                <SignatureCanvas ref={signatureRef} canvasProps={{ className: 'w-full h-32 border rounded', style: { width: '100%', height: '128px' } }} backgroundColor="white" />
              </div>
              <div className="flex justify-between">
                <p className="text-xs text-muted-foreground flex items-center gap-1"><AlertCircle className="h-3 w-3" /> Ký vào ô trên để xác nhận</p>
                <Button type="button" variant="ghost" size="sm" onClick={() => signatureRef.current?.clear()}>Xóa chữ ký</Button>
              </div>
            </div>
          </div>
          <DialogFooter className="mt-4 pt-4 border-t">
            <Button variant="outline" onClick={() => { setCreateDepositOpen(false); resetCreateDepositForm(); }}>Hủy</Button>
            <Button onClick={handleCreateDeposit} disabled={isProcessingDeposit || !selectedUserDeposit || !depositAmount} className="bg-green-600 hover:bg-green-700">
              {isProcessingDeposit ? 'Đang xử lý...' : 'Xác nhận nạp tiền'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Withdrawal Dialog */}
      <Dialog open={viewWithdrawalOpen} onOpenChange={setViewWithdrawalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Chi tiết yêu cầu hoàn tiền</DialogTitle>
          </DialogHeader>
          {selectedWithdrawal && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Khách hàng</Label>
                  <p className="font-medium">{(selectedWithdrawal.user as UserType)?.fullName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Số tiền hoàn</Label>
                  <p className="font-semibold text-lg text-red-600">{formatPrice(selectedWithdrawal.amount)}</p>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Thông tin tài khoản</Label>
                <div className="p-3 bg-gray-50 rounded-lg mt-1 text-sm">
                  <p>Tên ngân hàng: {selectedWithdrawal.bankInfo.bankName}</p>
                  <p>STK: {selectedWithdrawal.bankInfo.accountNumber}</p>
                  <p>Chủ TK: {selectedWithdrawal.bankInfo.accountName}</p>
                </div>
              </div>
              {(selectedWithdrawal as WithdrawalRequestWithMeta).confirmationToken && selectedWithdrawal.status === 'pending_confirmation' && (
                <div className="flex flex-col items-center p-4 border rounded-lg bg-orange-50">
                  <Label className="mb-2 text-orange-700 font-semibold">Đang chờ khách hàng xác nhận</Label>
                  <div className="bg-white p-2 rounded">
                    <QRCode value={`${window.location.origin}/withdraw/confirm/${(selectedWithdrawal as WithdrawalRequestWithMeta).confirmationToken}`} size={100} />
                  </div>
                  <div className="w-full mt-3 flex items-center gap-2">
                    <Input readOnly value={`${window.location.origin}/withdraw/confirm/${(selectedWithdrawal as WithdrawalRequestWithMeta).confirmationToken}`} className="h-8 text-xs font-mono" />
                    <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => copyToClipboard(`${window.location.origin}/withdraw/confirm/${(selectedWithdrawal as WithdrawalRequestWithMeta).confirmationToken}`)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0" asChild>
                      <a href={`${window.location.origin}/withdraw/confirm/${(selectedWithdrawal as WithdrawalRequestWithMeta).confirmationToken}`} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </div>
              )}
              {(selectedWithdrawal as WithdrawalRequestWithMeta).userSignature && (
                <div>
                  <Label className="text-muted-foreground">Chữ ký KH</Label>
                  <img src={(selectedWithdrawal as WithdrawalRequestWithMeta).userSignature} alt="User Signature" className="mt-2 h-24 object-contain rounded-lg border bg-white" />
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

      {/* Process Withdrawal Dialog */}
      <Dialog open={processWithdrawalOpen} onOpenChange={setProcessWithdrawalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {processWithdrawalAction === 'approve' ? 'Duyệt yêu cầu' : processWithdrawalAction === 'complete' ? 'Hoàn tất hoàn tiền' : 'Từ chối yêu cầu'}
            </DialogTitle>
            <DialogDescription>
              {processWithdrawalAction === 'approve' ? 'Duyệt để chuyển sang chờ xử lý thanh toán.' :
                processWithdrawalAction === 'complete' ? 'Xác nhận đã chuyển tiền? Trạng thái sẽ là Hoàn thành.' :
                'Từ chối? Số tiền sẽ hoàn lại ví khách.'}
            </DialogDescription>
          </DialogHeader>
          {selectedWithdrawal && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="font-medium">{(selectedWithdrawal.user as UserType)?.fullName}</p>
                <p className="font-semibold text-red-600 mt-1">Hoàn: {formatPrice(selectedWithdrawal.amount)}</p>
                <div className="text-sm text-muted-foreground mt-2">
                  {selectedWithdrawal.bankInfo.bankName} - {selectedWithdrawal.bankInfo.accountNumber}
                </div>
              </div>
              <div>
                <Label>Ghi chú</Label>
                <Textarea placeholder="Ghi chú / Mã giao dịch..." value={adminNoteWithdrawal} onChange={(e) => setAdminNoteWithdrawal(e.target.value)} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setProcessWithdrawalOpen(false)}>Hủy</Button>
            <Button
              onClick={() => selectedWithdrawal && processWithdrawalMutation.mutate({ id: selectedWithdrawal._id, action: processWithdrawalAction, note: adminNoteWithdrawal })}
              disabled={processWithdrawalMutation.isPending}
              variant={processWithdrawalAction === 'reject' ? 'destructive' : 'default'}
              className={processWithdrawalAction === 'complete' ? 'bg-green-600 hover:bg-green-700' : ''}
            >
              {processWithdrawalMutation.isPending ? 'Đang xử lý...' : 'Xác nhận'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Withdrawal Dialog */}
      <Dialog open={createWithdrawalOpen} onOpenChange={(o) => { setCreateWithdrawalOpen(o); if (!o) resetCreateWithdrawalForm(); }}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-orange-600" /> Hoàn tiền cho người dùng
            </DialogTitle>
            <DialogDescription>Tạo lệnh hoàn tiền. Lệnh tạo sẽ chờ người dùng xác nhận.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Chọn người dùng *</Label>
              <Popover open={openComboboxWithdrawal} onOpenChange={setOpenComboboxWithdrawal}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" aria-expanded={openComboboxWithdrawal} className="w-full justify-between">
                    {selectedUserWithdrawal ? <span className="truncate">{selectedUserWithdrawal.fullName} ({selectedUserWithdrawal.email})</span> : 'Tìm kiếm người dùng...'}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0">
                  <Command shouldFilter={false}>
                    <CommandInput placeholder="Tìm theo tên, email, sđt..." value={userSearchWithdrawal} onValueChange={setUserSearchWithdrawal} />
                    <CommandList>
                      <CommandEmpty>Không tìm thấy.</CommandEmpty>
                      <CommandGroup>
                        {usersWithdrawal.map((user) => (
                          <CommandItem
                            key={user._id}
                            value={user._id}
                            onSelect={() => { setSelectedUserWithdrawal(user); setOpenComboboxWithdrawal(false); }}
                          >
                            <Check className={cn('mr-2 h-4 w-4', selectedUserWithdrawal?._id === user._id ? 'opacity-100' : 'opacity-0')} />
                            <div className="flex flex-col">
                              <span>{user.fullName}</span>
                              <span className="text-xs text-muted-foreground">{user.email} - {user.phone}</span>
                            </div>
                            <span className="ml-auto text-xs text-muted-foreground">{formatPrice(user.walletBalance || 0)}</span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            {selectedUserWithdrawal && (
              <div className="bg-orange-50 p-3 rounded-lg flex justify-between items-center text-sm border border-orange-200">
                <div>
                  <p className="font-semibold text-orange-800">{selectedUserWithdrawal.fullName}</p>
                  <p className="text-orange-700">{selectedUserWithdrawal.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-orange-600">Số dư hiện tại</p>
                  <p className="font-bold text-orange-800">{formatPrice(selectedUserWithdrawal.walletBalance || 0)}</p>
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label>Số tiền hoàn (VND) *</Label>
              <Input
                type="text"
                inputMode="numeric"
                placeholder="Tối thiểu 1.000đ"
                value={formatPriceInput(withdrawalAmount)}
                onChange={(e) => setWithdrawalAmount(parsePriceInput(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">Người dùng sẽ xác nhận và số tiền sẽ trừ sau khi họ ký.</p>
            </div>
            <div className="space-y-3 border-t pt-3">
              <h4 className="text-sm font-semibold flex items-center gap-2"><CreditCard className="h-4 w-4" /> Thông tin nhận tiền</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2 col-span-2">
                  <Label>Ngân hàng *</Label>
                  <Input placeholder="VD: Vietcombank..." value={bankName} onChange={(e) => setBankName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Số tài khoản *</Label>
                  <Input placeholder="Số tài khoản..." value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Chủ tài khoản *</Label>
                  <Input placeholder="Tên chủ TK..." value={accountName} onChange={(e) => setAccountName(e.target.value)} />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Ghi chú</Label>
              <Textarea placeholder="Ghi chú..." value={withdrawalNote} onChange={(e) => setWithdrawalNote(e.target.value)} />
            </div>
          </div>
          <DialogFooter className="mt-4 pt-4 border-t">
            <Button variant="outline" onClick={() => { setCreateWithdrawalOpen(false); resetCreateWithdrawalForm(); }}>Hủy</Button>
            <Button
              onClick={handleCreateWithdrawal}
              disabled={isProcessingWithdrawal || !selectedUserWithdrawal || !withdrawalAmount || !bankName || !accountNumber || !accountName}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {isProcessingWithdrawal ? 'Đang tạo...' : 'Tạo lệnh rút'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Creation Result Dialog (Hoàn tiền) */}
      <Dialog open={resultDialogOpen} onOpenChange={setResultDialogOpen}>
        <DialogContent className="max-w-md flex flex-col items-center">
          <DialogHeader>
            <DialogTitle className="text-center text-green-600">Tạo lệnh rút thành công!</DialogTitle>
            <DialogDescription className="text-center">Khách hàng cần quét mã hoặc truy cập liên kết để xác nhận.</DialogDescription>
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
                  <Input readOnly value={`${window.location.origin}${createdResult.confirmationUrl}`} className="h-9 text-xs font-mono" />
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
