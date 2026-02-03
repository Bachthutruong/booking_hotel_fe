import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Check, X, Eye, Filter } from 'lucide-react';
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
import { walletService } from '@/services/walletService';
import { useToast } from '@/hooks/use-toast';
import type { DepositRequest, User } from '@/types';

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
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedDeposit, setSelectedDeposit] = useState<DepositRequest | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [processDialogOpen, setProcessDialogOpen] = useState(false);
  const [processAction, setProcessAction] = useState<'approve' | 'reject'>('approve');
  const [adminNote, setAdminNote] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['adminDeposits', statusFilter, page],
    queryFn: () => walletService.getAllDeposits({
      status: statusFilter !== 'all' ? statusFilter : undefined,
      page,
      limit: 10,
    }),
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

  const handleProcess = () => {
    if (!selectedDeposit) return;
    processMutation.mutate({
      id: selectedDeposit._id,
      action: processAction,
      note: adminNote,
    });
  };

  const deposits = data?.data || [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Quản lý nạp tiền</h1>
        <p className="text-muted-foreground">Duyệt và quản lý các yêu cầu nạp tiền từ khách hàng</p>
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
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deposits.map((deposit: DepositRequest) => {
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

              <div>
                <Label className="text-muted-foreground">Ảnh minh chứng</Label>
                <img
                  src={selectedDeposit.proofImage}
                  alt="Proof"
                  className="mt-2 w-full max-h-64 object-contain rounded-lg border"
                />
              </div>

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
    </div>
  );
}
