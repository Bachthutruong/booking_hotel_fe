import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import {
  Calendar,
  MapPin,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  Star,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { bookingService } from '@/services/bookingService';
import { hotelService } from '@/services/hotelService';
import { formatPrice, getStatusText, getStatusColor, getRoomTypeText } from '@/lib/utils';
import type { Booking, Hotel, Room } from '@/types';

export function BookingsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [status, setStatus] = useState<string>('');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [cancelBooking, setCancelBooking] = useState<Booking | null>(null);
  const [reviewBooking, setReviewBooking] = useState<Booking | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['myBookings', { status, page, limit }],
    queryFn: () => bookingService.getBookings({ status: status || undefined, page, limit }),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => bookingService.cancelBooking(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myBookings'] });
      setCancelBooking(null);
    },
  });

  const reviewMutation = useMutation({
    mutationFn: ({ hotelId, bookingId, rating, comment }: {
      hotelId: string;
      bookingId: string;
      rating: number;
      comment: string;
    }) => hotelService.createReview(hotelId, { bookingId, rating, comment }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myBookings'] });
      setReviewBooking(null);
      setReviewRating(5);
      setReviewComment('');
    },
  });

  const bookings = data?.data || [];
  const pagination = data?.pagination;

  const handleSubmitReview = () => {
    if (!reviewBooking || !reviewComment.trim()) return;
    const hotel = reviewBooking.hotel as Hotel;
    reviewMutation.mutate({
      hotelId: hotel._id,
      bookingId: reviewBooking._id,
      rating: reviewRating,
      comment: reviewComment,
    });
  };

  return (
    <div className="min-h-screen animate-gradient bg-fixed">
      <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Đơn đặt phòng của tôi</h1>

      <Tabs value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <TabsList>
            <TabsTrigger value="">Tất cả</TabsTrigger>
            <TabsTrigger value="pending">Chờ xác nhận</TabsTrigger>
            <TabsTrigger value="confirmed">Đã xác nhận</TabsTrigger>
            <TabsTrigger value="completed">Hoàn thành</TabsTrigger>
            <TabsTrigger value="cancelled">Đã hủy</TabsTrigger>
          </TabsList>
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
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">mục</span>
          </div>
        </div>

        <TabsContent value={status} className="mt-0">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-40" />
              ))}
            </div>
          ) : bookings.length > 0 ? (
            <>
              <div className="space-y-4">
                {bookings.map((booking: Booking) => {
                  const hotel = booking.hotel as Hotel;
                  const room = booking.room as Room;
                  return (
                    <Card key={booking._id}>
                      <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row gap-4">
                          <img
                            src={hotel?.images?.[0] || 'https://via.placeholder.com/150'}
                            alt={hotel?.name}
                            className="w-full md:w-40 h-32 object-cover rounded-lg"
                          />
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h3 className="font-semibold text-lg">{hotel?.name}</h3>
                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {hotel?.city}
                                </p>
                              </div>
                              <Badge className={getStatusColor(booking.status)}>
                                {getStatusText(booking.status)}
                              </Badge>
                            </div>

                            <p className="text-sm mb-2">
                              {room?.name} - {getRoomTypeText(room?.type || 'standard')}
                            </p>

                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-3">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {format(new Date(booking.checkIn), 'dd/MM/yyyy')} -{' '}
                                {format(new Date(booking.checkOut), 'dd/MM/yyyy')}
                              </span>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-lg font-bold text-primary">
                                {formatPrice(booking.totalPrice)}
                              </span>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSelectedBooking(booking)}
                                >
                                  <Eye className="mr-1 h-4 w-4" />
                                  Chi tiết
                                </Button>
                                {booking.status === 'pending' && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-red-600 hover:text-red-600"
                                    onClick={() => setCancelBooking(booking)}
                                  >
                                    <X className="mr-1 h-4 w-4" />
                                    Hủy
                                  </Button>
                                )}
                                {booking.status === 'completed' && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setReviewBooking(booking)}
                                  >
                                    <Star className="mr-1 h-4 w-4" />
                                    Đánh giá
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
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
            <Card className="p-12 text-center">
              <p className="text-muted-foreground mb-4">
                Bạn chưa có đơn đặt phòng nào
              </p>
              <Button asChild>
                <Link to="/hotels">Tìm khách sạn</Link>
              </Button>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Booking Detail Dialog */}
      <Dialog open={!!selectedBooking} onOpenChange={() => setSelectedBooking(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Chi tiết đặt phòng</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Mã đặt phòng</span>
                <span className="font-medium">
                  {selectedBooking._id.slice(-8).toUpperCase()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Trạng thái</span>
                <Badge className={getStatusColor(selectedBooking.status)}>
                  {getStatusText(selectedBooking.status)}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Thanh toán</span>
                <Badge className={getStatusColor(selectedBooking.paymentStatus)}>
                  {getStatusText(selectedBooking.paymentStatus)}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Nhận phòng</span>
                <span>{format(new Date(selectedBooking.checkIn), 'dd/MM/yyyy')}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Trả phòng</span>
                <span>{format(new Date(selectedBooking.checkOut), 'dd/MM/yyyy')}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Số khách</span>
                <span>
                  {selectedBooking.guests.adults} người lớn
                  {selectedBooking.guests.children > 0 &&
                    `, ${selectedBooking.guests.children} trẻ em`}
                </span>
              </div>
              <div className="flex items-center justify-between font-semibold">
                <span>Tổng tiền</span>
                <span className="text-primary">
                  {formatPrice(selectedBooking.totalPrice)}
                </span>
              </div>
              {selectedBooking.specialRequests && (
                <div>
                  <span className="text-muted-foreground text-sm">Yêu cầu đặc biệt:</span>
                  <p className="text-sm mt-1">{selectedBooking.specialRequests}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation */}
      <AlertDialog open={!!cancelBooking} onOpenChange={() => setCancelBooking(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận hủy đặt phòng?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn hủy đơn đặt phòng này? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Không</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => cancelBooking && cancelMutation.mutate(cancelBooking._id)}
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Hủy đặt phòng
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Review Dialog */}
      <Dialog open={!!reviewBooking} onOpenChange={() => setReviewBooking(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Đánh giá khách sạn</DialogTitle>
            <DialogDescription>
              Chia sẻ trải nghiệm của bạn về chuyến đi
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Đánh giá</Label>
              <div className="flex gap-1 mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewRating(star)}
                    className="focus:outline-none"
                  >
                    <Star
                      className={`h-8 w-8 ${
                        star <= reviewRating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="comment">Nhận xét</Label>
              <Textarea
                id="comment"
                placeholder="Chia sẻ trải nghiệm của bạn..."
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                className="mt-2"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewBooking(null)}>
              Hủy
            </Button>
            <Button
              onClick={handleSubmitReview}
              disabled={!reviewComment.trim() || reviewMutation.isPending}
            >
              {reviewMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Gửi đánh giá
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}
