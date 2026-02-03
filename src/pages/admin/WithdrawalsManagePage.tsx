import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, X, Eye, Filter, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  pending: { label: 'Chờ duyệt', color: 'bg-yellow-100 text-yellow-700' },
  approved: { label: 'Đã duyệt', color: 'bg-blue-100 text-blue-700' },
  rejected: { label: 'Từ chối', color: 'bg-red-100 text-red-700' },
  completed: { label: 'Hoàn thành', color: 'bg-green-100 text-green-700' },
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

  const { data, isLoading } = useQuery({
    queryKey: ['adminWithdrawals', statusFilter, page],
    queryFn: () => walletService.getAllWithdrawals({
      status: statusFilter !== 'all' ? statusFilter : undefined,
      page,
      limit: 10,
    }),
  });

  const processMutation = useMutation({
    mutationFn: ({ id, action, note }: { id: string; action: 'approve' | 'reject' | 'complete'; note?: string }) =>
      walletService.processWithdrawal(id, action, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminWithdrawals'] });
      const messages = {
        approve: 'Đã duyệt yêu cầu rút tiền',
        reject: 'Đã từ chối yêu cầu rút tiền',
        complete: 'Đã hoàn thành yêu cầu rút tiền',
      };
      toast({ title: 'Thành công', description: messages[processAction] });
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

  const withdrawals = data?.data || [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Quản lý rút tiền</h1>
        <p className="text-muted-foreground">Duyệt và quản lý các yêu cầu rút tiền từ khách hàng</p>
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
                    <TableHead>Ngân hàng</TableHead>
                    <TableHead>Ngày tạo</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {withdrawals.map((withdrawal: WithdrawalRequest) => {
                    const user = withdrawal.user as User;
                    const statusInfo = statusLabels[withdrawal.status];
                    return (
                      <TableRow key={withdrawal._id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{user?.fullName}</p>
                            <p className="text-sm text-muted-foreground">{user?.email}</p>
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold">{formatCurrency(withdrawal.amount)}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p>{withdrawal.bankInfo.bankName}</p>
                            <p className="text-muted-foreground">{withdrawal.bankInfo.accountNumber}</p>
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(withdrawal.createdAt)}</TableCell>
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
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
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

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Chi tiết yêu cầu rút tiền</DialogTitle>
          </DialogHeader>
          {selectedWithdrawal && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Khách hàng</Label>
                  <p className="font-medium">{(selectedWithdrawal.user as User)?.fullName}</p>
                  <p className="text-sm text-muted-foreground">{(selectedWithdrawal.user as User)?.email}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Số tiền</Label>
                  <p className="font-semibold text-lg">{formatCurrency(selectedWithdrawal.amount)}</p>
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
              {processAction === 'approve' && 'Duyệt yêu cầu rút tiền'}
              {processAction === 'reject' && 'Từ chối yêu cầu rút tiền'}
              {processAction === 'complete' && 'Hoàn thành yêu cầu rút tiền'}
            </DialogTitle>
            <DialogDescription>
              {processAction === 'approve' && 'Xác nhận duyệt? Tiền sẽ được trừ từ ví khách hàng.'}
              {processAction === 'reject' && 'Xác nhận từ chối? Nếu đã duyệt, tiền sẽ được hoàn lại cho khách.'}
              {processAction === 'complete' && 'Xác nhận đã chuyển tiền thành công cho khách hàng?'}
            </DialogDescription>
          </DialogHeader>

          {selectedWithdrawal && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-muted-foreground">Khách hàng</p>
                <p className="font-medium">{(selectedWithdrawal.user as User)?.fullName}</p>
                <p className="text-sm text-muted-foreground mt-2">Số tiền</p>
                <p className="font-semibold text-lg">{formatCurrency(selectedWithdrawal.amount)}</p>
                <p className="text-sm text-muted-foreground mt-2">Ngân hàng</p>
                <p>{selectedWithdrawal.bankInfo.bankName} - {selectedWithdrawal.bankInfo.accountNumber}</p>
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
              className={processAction === 'approve' || processAction === 'complete' ? 'bg-green-600 hover:bg-green-700' : ''}
              variant={processAction === 'reject' ? 'destructive' : 'default'}
            >
              {processMutation.isPending ? 'Đang xử lý...' :
                processAction === 'approve' ? 'Duyệt' :
                processAction === 'complete' ? 'Hoàn thành' : 'Từ chối'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
