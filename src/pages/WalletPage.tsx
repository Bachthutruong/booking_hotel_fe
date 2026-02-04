import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Wallet, Plus, ArrowUpRight, ArrowDownLeft, History, Gift, CreditCard, Upload, Building2, Loader2, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { walletService } from '@/services/walletService';
import { promotionService } from '@/services/promotionService';
import { configService } from '@/services/configService';
import { uploadService } from '@/services/uploadService';
import { toast } from '@/hooks/use-toast';
import type { WalletTransaction, DepositRequest, WithdrawalRequest, PromotionConfig } from '@/types';

const formatCurrency = (amount: number) => {
  return amount.toLocaleString('vi-VN') + 'đ';
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const transactionTypeLabels: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  deposit: { label: 'Nạp tiền', color: 'bg-green-100 text-green-700', icon: <Plus className="h-4 w-4" /> },
  withdrawal: { label: 'Rút tiền', color: 'bg-orange-100 text-orange-700', icon: <ArrowUpRight className="h-4 w-4" /> },
  payment: { label: 'Thanh toán', color: 'bg-blue-100 text-blue-700', icon: <CreditCard className="h-4 w-4" /> },
  refund: { label: 'Hoàn tiền', color: 'bg-purple-100 text-purple-700', icon: <ArrowDownLeft className="h-4 w-4" /> },
  bonus: { label: 'Khuyến mãi', color: 'bg-amber-100 text-amber-700', icon: <Gift className="h-4 w-4" /> },
};

const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: 'Chờ duyệt', color: 'bg-yellow-100 text-yellow-700' },
  approved: { label: 'Đã duyệt', color: 'bg-green-100 text-green-700' },
  rejected: { label: 'Từ chối', color: 'bg-red-100 text-red-700' },
  completed: { label: 'Hoàn thành', color: 'bg-blue-100 text-blue-700' },
};

export default function WalletPage() {
  const queryClient = useQueryClient();
  const [depositDialogOpen, setDepositDialogOpen] = useState(false);
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [proofImage, setProofImage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [withdrawBankInfo, setWithdrawBankInfo] = useState({
    bankName: '',
    accountNumber: '',
    accountName: '',
  });

  // Pagination states
  const [txPage, setTxPage] = useState(1);
  const [txLimit, setTxLimit] = useState(10);
  
  const [depPage, setDepPage] = useState(1);
  const [depLimit, setDepLimit] = useState(10);
  
  const [wdPage, setWdPage] = useState(1);
  const [wdLimit, setWdLimit] = useState(10);

  // Queries
  const { data: balanceData, isLoading: balanceLoading } = useQuery({
    queryKey: ['walletBalance'],
    queryFn: () => walletService.getBalance(),
  });

  const { data: transactionsData, isLoading: transactionsLoading } = useQuery({
    queryKey: ['walletTransactions', txPage, txLimit],
    queryFn: () => walletService.getTransactions({ page: txPage, limit: txLimit }),
  });

  const { data: depositsData, isLoading: depositsLoading } = useQuery({
    queryKey: ['myDeposits', depPage, depLimit],
    queryFn: () => walletService.getMyDeposits({ page: depPage, limit: depLimit }),
  });

  const { data: withdrawalsData, isLoading: withdrawalsLoading } = useQuery({
    queryKey: ['myWithdrawals', wdPage, wdLimit],
    queryFn: () => walletService.getMyWithdrawals({ page: wdPage, limit: wdLimit }),
  });

  const { data: promotionsData } = useQuery({
    queryKey: ['activePromotions'],
    queryFn: () => promotionService.getActivePromotions(),
  });

  const { data: configData } = useQuery({
    queryKey: ['bankInfo'],
    queryFn: () => configService.getConfig('bank_info'),
  });

  const { data: bonusPreview } = useQuery({
    queryKey: ['bonusPreview', depositAmount],
    queryFn: () => promotionService.calculatePromotion(Number(depositAmount)),
    enabled: !!depositAmount && Number(depositAmount) >= 10000,
  });

  // Mutations
  const depositMutation = useMutation({
    mutationFn: (data: { amount: number; proofImage: string; bankInfo: any }) =>
      walletService.createDeposit(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myDeposits'] });
      queryClient.invalidateQueries({ queryKey: ['walletBalance'] });
      toast({ title: 'Thành công', description: 'Yêu cầu nạp tiền đã được gửi. Vui lòng chờ admin duyệt.' });
      setDepositDialogOpen(false);
      setDepositAmount('');
      setProofImage('');
    },
    onError: () => {
      toast({ title: 'Lỗi', description: 'Không thể gửi yêu cầu nạp tiền', variant: 'destructive' });
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: (data: { amount: number; bankInfo: any }) =>
      walletService.createWithdrawal(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myWithdrawals'] });
      queryClient.invalidateQueries({ queryKey: ['walletBalance'] });
      toast({ title: 'Thành công', description: 'Yêu cầu rút tiền đã được gửi. Vui lòng chờ admin duyệt.' });
      setWithdrawDialogOpen(false);
      setWithdrawAmount('');
      setWithdrawBankInfo({ bankName: '', accountNumber: '', accountName: '' });
    },
    onError: (error: any) => {
      toast({
        title: 'Lỗi',
        description: error?.response?.data?.message || 'Không thể gửi yêu cầu rút tiền',
        variant: 'destructive',
      });
    },
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const result = await uploadService.uploadImage(file);
      if (result.success && result.data) {
        setProofImage(result.data.url);
        toast({ title: 'Tải lên thành công' });
      }
    } catch {
      toast({ title: 'Lỗi', description: 'Không thể tải lên ảnh', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleDeposit = () => {
    if (!depositAmount || Number(depositAmount) < 10000) {
      toast({ title: 'Lỗi', description: 'Số tiền nạp tối thiểu là 10,000đ', variant: 'destructive' });
      return;
    }
    if (!proofImage) {
      toast({ title: 'Lỗi', description: 'Vui lòng tải lên ảnh minh chứng chuyển khoản', variant: 'destructive' });
      return;
    }

    const bankInfoValue = configData?.data?.value;
    depositMutation.mutate({
      amount: Number(depositAmount),
      proofImage,
      bankInfo: {
        bankName: bankInfoValue?.bankName || '',
        accountNumber: bankInfoValue?.accountNumber || '',
        accountName: bankInfoValue?.accountName || '',
        transferContent: `NAP ${Date.now()}`,
      },
    });
  };

  const handleWithdraw = () => {
    if (!withdrawAmount || Number(withdrawAmount) < 10000) {
      toast({ title: 'Lỗi', description: 'Số tiền rút tối thiểu là 10,000đ', variant: 'destructive' });
      return;
    }
    if (!withdrawBankInfo.bankName || !withdrawBankInfo.accountNumber || !withdrawBankInfo.accountName) {
      toast({ title: 'Lỗi', description: 'Vui lòng nhập đầy đủ thông tin ngân hàng', variant: 'destructive' });
      return;
    }

    withdrawMutation.mutate({
      amount: Number(withdrawAmount),
      bankInfo: withdrawBankInfo,
    });
  };

  const balance = balanceData?.data;
  const transactions = transactionsData?.data || [];
  const txPagination = transactionsData?.pagination;
  
  const deposits = depositsData?.data || [];
  const depPagination = depositsData?.pagination;
  
  const withdrawals = withdrawalsData?.data || [];
  const wdPagination = withdrawalsData?.pagination;
  
  const promotions = promotionsData?.data || [];
  const bankInfo = configData?.data?.value;

  if (balanceLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 rounded-2xl" />
          <div className="h-64 bg-gray-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen animate-gradient bg-fixed pb-12">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="flex items-center gap-2 mb-6">
            <h1 className="text-2xl font-bold">Ví tiền của tôi</h1>
        </div>

        {/* Balance Card */}
        <Card className="mb-8 bg-gradient-to-br from-primary to-blue-700 text-white border-0 shadow-xl rounded-3xl overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-10">
              <Wallet className="h-32 w-32" />
          </div>
          <CardContent className="p-8 relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                <Wallet className="h-8 w-8" />
              </div>
              <div>
                <p className="text-blue-100 text-sm font-medium">Tổng số dư</p>
                <h2 className="text-4xl font-bold">{formatCurrency(balance?.totalBalance || 0)}</h2>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              <div className="bg-white/10 rounded-2xl p-5 backdrop-blur-sm border border-white/10">
                <p className="text-blue-100 text-xs mb-1 uppercase tracking-wider font-semibold">Số dư chính</p>
                <p className="text-2xl font-bold">{formatCurrency(balance?.walletBalance || 0)}</p>
              </div>
              <div className="bg-white/10 rounded-2xl p-5 backdrop-blur-sm border border-white/10">
                <p className="text-blue-100 text-xs mb-1 flex items-center gap-1 uppercase tracking-wider font-semibold">
                  <Gift className="h-3.5 w-3.5" /> Tiền khuyến mãi
                </p>
                <p className="text-2xl font-bold">{formatCurrency(balance?.bonusBalance || 0)}</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => setDepositDialogOpen(true)}
                className="flex-1 h-12 rounded-full bg-white text-primary hover:bg-blue-50 font-bold shadow-lg"
              >
                <Plus className="h-5 w-5 mr-2" /> Nạp tiền vào ví
              </Button>
              <Button
                onClick={() => setWithdrawDialogOpen(true)}
                variant="outline"
                className="flex-1 h-12 rounded-full border-white/30 text-black hover:bg-white/10 font-bold"
              >
                <ArrowUpRight className="h-5 w-5 mr-2" /> Rút tiền về ngân hàng
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Promotions Banner */}
        {promotions.length > 0 && (
          <Card className="mb-8 border-none bg-amber-50 shadow-sm rounded-3xl overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2 text-amber-700">
                <Sparkles className="h-5 w-5 text-amber-500 animate-pulse" /> Ưu đãi nạp tiền cực khủng
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {promotions.slice(0, 3).map((promo: PromotionConfig) => (
                  <div key={promo._id} className="flex flex-col justify-between p-4 bg-white rounded-2xl border border-amber-100 hover:shadow-md transition-all">
                    <div>
                      <p className="font-bold text-gray-900 line-clamp-1">{promo.name}</p>
                      <p className="text-xs text-gray-500 mt-1">Nạp từ {formatCurrency(promo.depositAmount)}</p>
                    </div>
                    <div className="mt-3">
                        <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 border-none px-3 py-1 rounded-full text-sm font-bold">
                        +{promo.bonusPercent ? `${promo.bonusPercent}%` : formatCurrency(promo.bonusAmount || 0)}
                        </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs defaultValue="transactions" className="space-y-6">
          <TabsList className="bg-white/50 backdrop-blur-md p-1 rounded-full border border-gray-200 inline-flex w-auto">
            <TabsTrigger value="transactions" className="rounded-full px-6 py-2 data-[state=active]:bg-primary data-[state=active]:text-white">
              Lịch sử
            </TabsTrigger>
            <TabsTrigger value="deposits" className="rounded-full px-6 py-2 data-[state=active]:bg-primary data-[state=active]:text-white">
              Nạp tiền
            </TabsTrigger>
            <TabsTrigger value="withdrawals" className="rounded-full px-6 py-2 data-[state=active]:bg-primary data-[state=active]:text-white">
              Rút tiền
            </TabsTrigger>
          </TabsList>

          <TabsContent value="transactions" className="animate-fade-in space-y-4">
            <Card className="rounded-3xl border-none shadow-sm overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Giao dịch gần đây</CardTitle>
                    <CardDescription>Theo dõi các hoạt động thu chi trong ví của bạn</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Hiển thị:</span>
                    <Select value={txLimit.toString()} onValueChange={(v) => { setTxLimit(Number(v)); setTxPage(1); }}>
                        <SelectTrigger className="w-20 h-8 rounded-full border-gray-200">
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
              </CardHeader>
              <CardContent className="p-0 sm:p-6 sm:pt-0">
                {transactionsLoading ? (
                    <div className="flex justify-center py-12"><Loader2 className="animate-spin" /></div>
                ) : transactions.length === 0 ? (
                  <div className="text-center py-12">
                      <History className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-muted-foreground">Chưa có giao dịch nào</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {transactions.map((tx: WalletTransaction) => {
                      let typeInfo = transactionTypeLabels[tx.type] || { label: 'Khác', color: 'bg-gray-100 text-gray-700', icon: <History className="h-4 w-4" /> };
                      
                      // Custom label for booking payment
                      if (tx.type === 'payment' && tx.referenceModel === 'Booking') {
                        typeInfo = { 
                          label: 'Thanh toán phòng', 
                          color: 'bg-blue-100 text-blue-700', 
                          icon: <Building2 className="h-4 w-4" /> 
                        };
                      }

                      const isPositive = ['deposit', 'refund', 'bonus'].includes(tx.type);
                      return (
                        <div key={tx._id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-2xl ${typeInfo.color}`}>
                              {typeInfo.icon}
                            </div>
                            <div>
                              <p className="font-bold text-gray-900">{typeInfo.label}</p>
                              <p className="text-sm text-gray-500 line-clamp-1">{tx.description}</p>
                              <p className="text-[10px] text-gray-400 mt-0.5">{formatDate(tx.createdAt)}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`font-bold text-lg ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                              {isPositive ? '+' : '-'}{formatCurrency(tx.amount)}
                            </p>
                            <p className="text-xs text-gray-400">
                              Số dư: {formatCurrency(tx.balanceAfter)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Transaction Pagination */}
            {txPagination && txPagination.totalPages > 1 && (
                <div className="flex justify-center items-center gap-4">
                    <Button variant="outline" size="sm" className="rounded-full h-9" disabled={txPage === 1} onClick={() => setTxPage(txPage - 1)}>
                        <ChevronLeft className="h-4 w-4 mr-1" /> Trước
                    </Button>
                    <span className="text-sm font-bold text-gray-500">Trang {txPage} / {txPagination.totalPages}</span>
                    <Button variant="outline" size="sm" className="rounded-full h-9" disabled={txPage === txPagination.totalPages} onClick={() => setTxPage(txPage + 1)}>
                        Sau <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                </div>
            )}
          </TabsContent>

          <TabsContent value="deposits" className="animate-fade-in space-y-4">
            <Card className="rounded-3xl border-none shadow-sm overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Yêu cầu nạp tiền</CardTitle>
                    <CardDescription>Trạng thái các yêu cầu nạp tiền đang xử lý</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Hiển thị:</span>
                    <Select value={depLimit.toString()} onValueChange={(v) => { setDepLimit(Number(v)); setDepPage(1); }}>
                        <SelectTrigger className="w-20 h-8 rounded-full border-gray-200">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="5">5</SelectItem>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="20">20</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
              </CardHeader>
              <CardContent className="p-0 sm:p-6 sm:pt-0">
                {depositsLoading ? (
                    <div className="flex justify-center py-12"><Loader2 className="animate-spin" /></div>
                ) : deposits.length === 0 ? (
                  <div className="text-center py-12">
                      <Plus className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-muted-foreground">Chưa có yêu cầu nạp tiền nào</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {deposits.map((deposit: DepositRequest) => {
                      const statusInfo = statusLabels[deposit.status] || { label: deposit.status, color: 'bg-gray-100 text-gray-700' };
                      return (
                        <div key={deposit._id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="p-3 rounded-2xl bg-green-50">
                              <Plus className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                              <p className="font-bold text-lg">{formatCurrency(deposit.amount)}</p>
                              {deposit.bonusAmount > 0 && (
                                <p className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full inline-block">+{formatCurrency(deposit.bonusAmount)} quà tặng</p>
                              )}
                              <p className="text-[10px] text-gray-400 mt-1">{formatDate(deposit.createdAt)}</p>
                              {deposit.adminNote && (
                                <p className={`text-xs mt-1 italic ${deposit.status === 'rejected' ? 'text-red-500' : 'text-blue-500'}`}>
                                  Ghi chú: {deposit.adminNote}
                                </p>
                              )}
                            </div>
                          </div>
                          <Badge className={`${statusInfo.color} border-none px-3 py-1 rounded-full text-xs font-bold`}>{statusInfo.label}</Badge>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Deposit Pagination */}
            {depPagination && depPagination.totalPages > 1 && (
                <div className="flex justify-center items-center gap-4">
                    <Button variant="outline" size="sm" className="rounded-full h-9" disabled={depPage === 1} onClick={() => setDepPage(depPage - 1)}>
                        <ChevronLeft className="h-4 w-4 mr-1" /> Trước
                    </Button>
                    <span className="text-sm font-bold text-gray-500">Trang {depPage} / {depPagination.totalPages}</span>
                    <Button variant="outline" size="sm" className="rounded-full h-9" disabled={depPage === depPagination.totalPages} onClick={() => setDepPage(depPage + 1)}>
                        Sau <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                </div>
            )}
          </TabsContent>

          <TabsContent value="withdrawals" className="animate-fade-in space-y-4">
            <Card className="rounded-3xl border-none shadow-sm overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Yêu cầu rút tiền</CardTitle>
                    <CardDescription>Danh sách các yêu cầu rút tiền về ngân hàng</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Hiển thị:</span>
                    <Select value={wdLimit.toString()} onValueChange={(v) => { setWdLimit(Number(v)); setWdPage(1); }}>
                        <SelectTrigger className="w-20 h-8 rounded-full border-gray-200">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="5">5</SelectItem>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="20">20</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
              </CardHeader>
              <CardContent className="p-0 sm:p-6 sm:pt-0">
                {withdrawalsLoading ? (
                    <div className="flex justify-center py-12"><Loader2 className="animate-spin" /></div>
                ) : withdrawals.length === 0 ? (
                  <div className="text-center py-12">
                      <ArrowUpRight className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-muted-foreground">Chưa có yêu cầu rút tiền nào</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {withdrawals.map((withdrawal: WithdrawalRequest) => {
                      const statusInfo = statusLabels[withdrawal.status] || { label: withdrawal.status, color: 'bg-gray-100 text-gray-700' };
                      return (
                        <div key={withdrawal._id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="p-3 rounded-2xl bg-orange-50">
                              <ArrowUpRight className="h-5 w-5 text-orange-600" />
                            </div>
                            <div>
                              <p className="font-bold text-lg">{formatCurrency(withdrawal.amount)}</p>
                              <p className="text-xs text-gray-500">
                                {withdrawal.bankInfo.bankName} • {withdrawal.bankInfo.accountNumber}
                              </p>
                              <p className="text-[10px] text-gray-400 mt-1">{formatDate(withdrawal.createdAt)}</p>
                              {withdrawal.adminNote && (
                                <p className={`text-xs mt-1 italic ${withdrawal.status === 'rejected' ? 'text-red-500' : 'text-blue-500'}`}>
                                  Ghi chú: {withdrawal.adminNote}
                                </p>
                              )}
                            </div>
                          </div>
                          <Badge className={`${statusInfo.color} border-none px-3 py-1 rounded-full text-xs font-bold`}>{statusInfo.label}</Badge>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Withdrawal Pagination */}
            {wdPagination && wdPagination.totalPages > 1 && (
                <div className="flex justify-center items-center gap-4">
                    <Button variant="outline" size="sm" className="rounded-full h-9" disabled={wdPage === 1} onClick={() => setWdPage(wdPage - 1)}>
                        <ChevronLeft className="h-4 w-4 mr-1" /> Trước
                    </Button>
                    <span className="text-sm font-bold text-gray-500">Trang {wdPage} / {wdPagination.totalPages}</span>
                    <Button variant="outline" size="sm" className="rounded-full h-9" disabled={wdPage === wdPagination.totalPages} onClick={() => setWdPage(wdPage + 1)}>
                        Sau <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Deposit Dialog */}
        <Dialog open={depositDialogOpen} onOpenChange={setDepositDialogOpen}>
          <DialogContent className="max-w-md rounded-[32px] p-6 border-none overflow-hidden">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Nạp tiền vào ví</DialogTitle>
              <DialogDescription>
                Chuyển khoản chính xác số tiền và tải ảnh minh chứng để được duyệt nhanh nhất
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 py-4">
              {/* Bank Info */}
              {bankInfo && (
                <div className="p-5 bg-blue-50 rounded-3xl border border-blue-100 relative overflow-hidden">
                  <div className="absolute -top-4 -right-4 bg-blue-100/50 h-20 w-20 rounded-full blur-xl" />
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 bg-blue-100 rounded-xl">
                        <Building2 className="h-5 w-5 text-blue-600" />
                    </div>
                    <span className="font-bold text-blue-900">Tài khoản đích</span>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                        <span className="text-blue-700/70">Ngân hàng</span>
                        <span className="font-bold text-blue-900">{bankInfo.bankName}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-blue-700/70">Số tài khoản</span>
                        <span className="font-bold text-blue-900 text-lg">{bankInfo.accountNumber}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-blue-700/70">Chủ tài khoản</span>
                        <span className="font-bold text-blue-900 uppercase">{bankInfo.accountName}</span>
                    </div>
                  </div>
                  {bankInfo.qrCode && (
                    <div className="mt-5 p-2 bg-white rounded-2xl shadow-sm border border-blue-100 max-w-[180px] mx-auto group">
                        <img src={bankInfo.qrCode} alt="QR Code" className="w-full h-full object-contain rounded-xl group-hover:scale-105 transition-transform" />
                    </div>
                  )}
                </div>
              )}

              {/* Amount Input */}
              <div className="space-y-2">
                <Label className="text-sm font-bold text-gray-700 ml-1">Số tiền nạp (VND)</Label>
                <div className="relative">
                    <Input
                    type="number"
                    placeholder="Nhập số tiền (tối thiểu 10,000đ)"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    min={10000}
                    className="h-14 rounded-2xl border-gray-200 focus:border-primary focus:ring-primary pl-4 text-lg font-bold"
                    />
                </div>
                {bonusPreview?.data && bonusPreview.data.bonusAmount > 0 && (
                  <div className="bg-amber-50 p-3 rounded-2xl border border-amber-100 animate-slide-up">
                    <p className="text-sm text-amber-700 font-bold flex items-center gap-2">
                        <Sparkles className="h-4 w-4" /> Bạn sẽ nhận thêm: +{formatCurrency(bonusPreview.data.bonusAmount)}
                    </p>
                    <p className="text-xs text-amber-600 mt-0.5">Tổng số dư sẽ nhận: {formatCurrency(bonusPreview.data.totalReceive)}</p>
                  </div>
                )}
              </div>

              {/* Proof Upload */}
              <div className="space-y-2">
                <Label className="text-sm font-bold text-gray-700 ml-1">Xác nhận chuyển khoản</Label>
                <div className="mt-1">
                  {proofImage ? (
                    <div className="relative group rounded-3xl overflow-hidden border-2 border-primary/20">
                      <img src={proofImage} alt="Proof" className="w-full h-48 object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button
                            size="sm"
                            variant="destructive"
                            className="rounded-full px-6 font-bold"
                            onClick={() => setProofImage('')}
                        >
                            Thay đổi ảnh
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-200 rounded-3xl cursor-pointer hover:bg-gray-50 hover:border-primary/50 transition-all">
                      <div className="p-3 bg-gray-100 rounded-full mb-2">
                        <Upload className="h-6 w-6 text-gray-400" />
                      </div>
                      <span className="text-xs font-bold text-gray-500">
                        {uploading ? 'Đang tải lên...' : 'Tải ảnh minh chứng giao dịch'}
                      </span>
                      <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                    </label>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter className="sm:justify-between gap-3 pt-2">
              <Button variant="ghost" className="rounded-full px-6 font-bold flex-1" onClick={() => setDepositDialogOpen(false)}>Hủy bỏ</Button>
              <Button onClick={handleDeposit} disabled={depositMutation.isPending || !depositAmount || !proofImage} className="rounded-full px-10 font-bold flex-1 h-12 shadow-lg shadow-primary/20">
                {depositMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
                Xác nhận nạp
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Withdraw Dialog */}
        <Dialog open={withdrawDialogOpen} onOpenChange={setWithdrawDialogOpen}>
          <DialogContent className="max-w-md rounded-[32px] p-6 border-none">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Rút tiền về ngân hàng</DialogTitle>
              <DialogDescription>
                Tiền sẽ được chuyển về tài khoản của bạn sau khi admin duyệt yêu cầu
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 py-4">
              <div className="p-4 bg-amber-50 rounded-3xl border border-amber-100 border-dashed">
                <p className="text-xs text-amber-700 font-bold uppercase tracking-wide mb-1">Số dư khả dụng</p>
                <p className="text-2xl font-bold text-amber-900">{formatCurrency(balance?.walletBalance || 0)}</p>
                <p className="text-[10px] text-amber-600 mt-2 italic">* Chỉ có thể rút tiền từ số dư chính, không bao gồm tiền khuyến mãi.</p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-bold text-gray-700 ml-1">Số tiền muốn rút</Label>
                <Input
                  type="number"
                  placeholder="Nhập số tiền (tối thiểu 10,000đ)"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  min={10000}
                  max={balance?.walletBalance || 0}
                  className="h-14 rounded-2xl border-gray-200 focus:border-primary focus:ring-primary pl-4 text-lg font-bold"
                />
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                    <Label className="text-sm font-bold text-gray-700 ml-1">Ngân hàng</Label>
                    <Input
                        placeholder="VD: Vietcombank, MB Bank..."
                        value={withdrawBankInfo.bankName}
                        onChange={(e) => setWithdrawBankInfo({ ...withdrawBankInfo, bankName: e.target.value })}
                        className="h-12 rounded-2xl"
                    />
                </div>

                <div className="space-y-2">
                    <Label className="text-sm font-bold text-gray-700 ml-1">Số tài khoản</Label>
                    <Input
                        placeholder="Nhập chính xác số tài khoản"
                        value={withdrawBankInfo.accountNumber}
                        onChange={(e) => setWithdrawBankInfo({ ...withdrawBankInfo, accountNumber: e.target.value })}
                        className="h-12 rounded-2xl font-mono"
                    />
                </div>

                <div className="space-y-2">
                    <Label className="text-sm font-bold text-gray-700 ml-1">Tên chủ tài khoản</Label>
                    <Input
                        placeholder="Nhập tên không dấu (VD: NGUYEN VAN A)"
                        value={withdrawBankInfo.accountName}
                        onChange={(e) => setWithdrawBankInfo({ ...withdrawBankInfo, accountName: e.target.value.toUpperCase() })}
                        className="h-12 rounded-2xl uppercase"
                    />
                </div>
              </div>
            </div>

            <DialogFooter className="sm:justify-between gap-3 pt-2">
              <Button variant="ghost" className="rounded-full px-6 font-bold flex-1" onClick={() => setWithdrawDialogOpen(false)}>Hủy bỏ</Button>
              <Button onClick={handleWithdraw} disabled={withdrawMutation.isPending || !withdrawAmount || !withdrawBankInfo.bankName} className="rounded-full px-10 font-bold flex-1 h-12 shadow-lg shadow-primary/20">
                {withdrawMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
                Gửi yêu cầu rút
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
