import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  Search,
  Eye,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Loader2,
  Check,
  X,
  CreditCard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { bookingService } from '@/services/bookingService';
import { toast } from '@/hooks/use-toast';
import { formatPrice, getStatusText, getStatusColor } from '@/lib/utils';
import type { Booking, Hotel, Room, User } from '@/types';

export function BookingsManagePage() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [updateDialog, setUpdateDialog] = useState<Booking | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [newPaymentStatus, setNewPaymentStatus] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['adminBookings', { status, page, limit }],
    queryFn: () => bookingService.getBookings({ status: status === 'all' ? undefined : status, page, limit }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status, paymentStatus }: { id: string; status?: string; paymentStatus?: string }) =>
      bookingService.updateBookingStatus(id, status, paymentStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminBookings'] });
      setUpdateDialog(null);
      toast({ title: 'Thành công', description: 'Đã cập nhật trạng thái đơn hàng' });
    },
    onError: () => {
      toast({ title: 'Lỗi', description: 'Không thể cập nhật trạng thái', variant: 'destructive' });
    },
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'approve' | 'reject' }) =>
      bookingService.approveBooking(id, action),
    onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ['adminBookings'] });
        setSelectedBooking(null);
        toast({ 
            title: 'Thành công', 
            description: variables.action === 'approve' ? 'Đã duyệt thanh toán' : 'Đã từ chối thanh toán' 
        });
    },
    onError: () => {
        toast({ title: 'Lỗi', description: 'Không thể xử lý yêu cầu', variant: 'destructive' });
    }
  });

  const bookings = data?.data || [];
  const pagination = data?.pagination;

  const handleUpdate = () => {
    if (!updateDialog) return;
    updateMutation.mutate({
      id: updateDialog._id,
      status: newStatus || undefined,
      paymentStatus: newPaymentStatus || undefined,
    });
  };

  const handleApprove = (action: 'approve' | 'reject') => {
      if (!selectedBooking) return;
      approveMutation.mutate({ id: selectedBooking._id, action });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Quản lý đặt phòng</h1>
        <p className="text-muted-foreground">{pagination?.total || 0} đơn đặt phòng</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-4">
          <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="pending_deposit">Chờ đặt cọc</SelectItem>
              <SelectItem value="awaiting_approval">Chờ duyệt</SelectItem>
              <SelectItem value="confirmed">Đã xác nhận</SelectItem>
              <SelectItem value="completed">Hoàn thành</SelectItem>
              <SelectItem value="cancelled">Đã hủy</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Hiển thị:</span>
          <Select value={limit.toString()} onValueChange={(v) => { setLimit(Number(v)); setPage(1); }}>
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

      {/* Table */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : bookings.length > 0 ? (
        <>
          <div className="rounded-lg border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã đơn</TableHead>
                  <TableHead>Khách hàng</TableHead>
                  <TableHead>Khách sạn</TableHead>
                  <TableHead>Ngày</TableHead>
                  <TableHead>Tổng tiền</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Thanh toán</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((booking: Booking) => {
                  const user = booking.user as User;
                  const hotel = booking.hotel as Hotel;
                  return (
                    <TableRow key={booking._id}>
                      <TableCell className="font-medium">
                        {booking._id.slice(-8).toUpperCase()}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{user?.fullName}</p>
                          <p className="text-sm text-muted-foreground">{user?.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>{hotel?.name}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{format(new Date(booking.checkIn), 'dd/MM/yyyy')}</p>
                          <p className="text-muted-foreground">
                            - {format(new Date(booking.checkOut), 'dd/MM/yyyy')}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatPrice(booking.totalPrice)}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(booking.status)}>
                          {getStatusText(booking.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(booking.paymentStatus)}>
                          {getStatusText(booking.paymentStatus)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setSelectedBooking(booking)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Xem chi tiết
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setUpdateDialog(booking);
                                setNewStatus(booking.status);
                                setNewPaymentStatus(booking.paymentStatus);
                              }}
                            >
                              <Calendar className="mr-2 h-4 w-4" />
                              Cập nhật trạng thái
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
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
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          Không có đơn đặt phòng nào
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selectedBooking} onOpenChange={() => setSelectedBooking(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chi tiết đặt phòng</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Mã đơn</p>
                  <p className="font-medium">{selectedBooking._id.slice(-8).toUpperCase()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Ngày tạo</p>
                  <p className="font-medium">
                    {format(new Date(selectedBooking.createdAt), 'dd/MM/yyyy HH:mm')}
                  </p>
                </div>
                <div>
                    <p className="text-muted-foreground">Trạng thái</p>
                     <Badge className={getStatusColor(selectedBooking.status)}>
                          {getStatusText(selectedBooking.status)}
                    </Badge>
                </div>
                 <div>
                    <p className="text-muted-foreground">Thanh toán</p>
                     <Badge className={getStatusColor(selectedBooking.paymentStatus)}>
                          {getStatusText(selectedBooking.paymentStatus)}
                    </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Check-in</p>
                  <p className="font-medium">
                    {format(new Date(selectedBooking.checkIn), 'dd/MM/yyyy')}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Check-out</p>
                  <p className="font-medium">
                    {format(new Date(selectedBooking.checkOut), 'dd/MM/yyyy')}
                  </p>
                </div>
              </div>
              
              <div className="border-t pt-2">
                <p className="text-muted-foreground text-sm mb-1">Dịch vụ đi kèm</p>
                {selectedBooking.services && selectedBooking.services.length > 0 ? (
                    <ul className="text-sm list-disc pl-4">
                        {selectedBooking.services.map((s: any, idx) => (
                             <li key={idx}>
                                {s.service.name} (x{s.quantity}) - {formatPrice(s.price * s.quantity)}
                             </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-sm">Không có</p>
                )}
              </div>

              <div className="border-t pt-2">
                  <div className="flex justify-between items-center font-bold">
                    <span>Tổng tiền</span>
                    <span className="text-primary text-lg">{formatPrice(selectedBooking.totalPrice)}</span>
                  </div>
              </div>

              <div className="border-t pt-2">
                <p className="text-muted-foreground text-sm mb-1">Liên hệ</p>
                <p className="font-medium">{selectedBooking.contactInfo.fullName}</p>
                <p className="text-sm">{selectedBooking.contactInfo.email}</p>
                <p className="text-sm">{selectedBooking.contactInfo.phone}</p>
              </div>

              {selectedBooking.proofImage && (
                  <div className="border-t pt-2">
                    <p className="text-muted-foreground text-sm mb-2">Minh chứng thanh toán</p>
                    <img src={selectedBooking.proofImage} alt="Proof" className="w-full rounded border" />
                  </div>
              )}

              {selectedBooking.status === 'awaiting_approval' && (
                  <div className="flex gap-2 pt-4">
                      <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => handleApprove('approve')} disabled={approveMutation.isPending}>
                          {approveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                          Duyệt thanh toán
                      </Button>
                       <Button className="flex-1" variant="destructive" onClick={() => handleApprove('reject')} disabled={approveMutation.isPending}>
                          {approveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4 mr-2" />}
                          Từ chối
                      </Button>
                  </div>
              )}

            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog open={!!updateDialog} onOpenChange={() => setUpdateDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cập nhật trạng thái</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Trạng thái đơn hàng</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Chờ xác nhận (Cũ)</SelectItem>
                  <SelectItem value="pending_deposit">Chờ đặt cọc</SelectItem>
                  <SelectItem value="awaiting_approval">Chờ duyệt</SelectItem>
                  <SelectItem value="confirmed">Đã xác nhận</SelectItem>
                  <SelectItem value="completed">Hoàn thành</SelectItem>
                  <SelectItem value="cancelled">Đã hủy</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Trạng thái thanh toán</Label>
              <Select value={newPaymentStatus} onValueChange={setNewPaymentStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Chờ thanh toán</SelectItem>
                  <SelectItem value="paid">Đã thanh toán</SelectItem>
                  <SelectItem value="refunded">Đã hoàn tiền</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUpdateDialog(null)}>
              Hủy
            </Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Cập nhật
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}