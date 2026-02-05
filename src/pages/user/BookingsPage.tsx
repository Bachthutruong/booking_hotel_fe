import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import QRCode from 'react-qr-code';
import {
  Calendar,
  MapPin,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  Star,
  Loader2,
  Plus,
  QrCode,
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
import { serviceService } from '@/services/serviceService';
import { hotelService } from '@/services/hotelService';
import { formatPrice, getStatusText, getStatusColor, getRoomTypeText } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import type { Booking, Hotel, Room, Service } from '@/types';

export function BookingsPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [status, setStatus] = useState<string>('confirmed'); // Default to confirmed
  const [cancelBooking, setCancelBooking] = useState<Booking | null>(null);
  const [reviewBooking, setReviewBooking] = useState<Booking | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [showQRDialog, setShowQRDialog] = useState<Booking | null>(null);
  const [showAddServiceDialog, setShowAddServiceDialog] = useState<Booking | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [serviceQuantity, setServiceQuantity] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['myBookings', { status, page, limit }],
    queryFn: () => bookingService.getBookings({ status: status || undefined, page, limit }),
  });

  const { data: servicesData } = useQuery({
    queryKey: ['services'],
    queryFn: () => serviceService.getServices(),
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

  const addServiceMutation = useMutation({
    mutationFn: ({ bookingId, serviceId, quantity }: { bookingId: string; serviceId: string; quantity: number }) =>
      bookingService.addService(bookingId, serviceId, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myBookings'] });
      setShowAddServiceDialog(null);
      setSelectedService(null);
      setServiceQuantity(1);
      toast({
        title: 'Thêm dịch vụ thành công',
        description: 'Dịch vụ đã được thêm vào đơn đặt phòng',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Lỗi',
        description: error.response?.data?.message || 'Không thể thêm dịch vụ',
        variant: 'destructive',
      });
    },
  });

  const bookings = data?.data || [];
  const pagination = data?.pagination;
  const services = servicesData?.data || [];

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

  const handleAddService = () => {
    if (!selectedService || !showAddServiceDialog) return;
    addServiceMutation.mutate({
      bookingId: showAddServiceDialog._id,
      serviceId: selectedService._id,
      quantity: serviceQuantity,
    });
  };

  const getQRCodeUrl = (booking: Booking) => {
    return `${window.location.origin}/my-bookings/${booking._id}`;
  };

  return (
    <div className="min-h-screen animate-gradient bg-fixed">
      <div className="container mx-auto px-4 py-8 pb-24 md:pb-8">
      <h1 className="text-2xl font-bold mb-6">Đơn đặt phòng của tôi</h1>

      <Tabs value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
        {/* Desktop Layout */}
        <div className="hidden md:flex flex-wrap items-center justify-between gap-4 mb-6">
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

        {/* Mobile Layout - Fixed Bottom Navigation */}
        <div className="md:hidden mb-4">
          <div className="flex items-center justify-between">
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
          </div>
        </div>

        {/* Mobile Bottom Navigation Bar - Fixed at bottom */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shadow-lg z-50">
          <div className="flex justify-around items-center py-2">
            <button
              onClick={() => { setStatus(''); setPage(1); }}
              className={`flex flex-col items-center justify-center px-3 py-2 min-w-[60px] transition-colors ${
                status === '' ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              <span className="text-xs font-medium">Tất cả</span>
            </button>
            
            <button
              onClick={() => { setStatus('pending'); setPage(1); }}
              className={`flex flex-col items-center justify-center px-3 py-2 min-w-[60px] transition-colors ${
                status === 'pending' ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs font-medium">Chờ</span>
            </button>
            
            <button
              onClick={() => { setStatus('confirmed'); setPage(1); }}
              className={`flex flex-col items-center justify-center px-4 py-2 min-w-[70px] transition-colors relative ${
                status === 'confirmed' ? 'text-white' : 'text-muted-foreground'
              }`}
            >
              <div className={`absolute -top-5 w-14 h-14 rounded-full flex items-center justify-center shadow-lg ${
                status === 'confirmed' ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'
              }`}>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${status === 'confirmed' ? 'text-white' : 'text-muted-foreground'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className={`text-xs font-medium mt-6 ${status === 'confirmed' ? 'text-primary' : ''}`}>Xác nhận</span>
            </button>
            
            <button
              onClick={() => { setStatus('completed'); setPage(1); }}
              className={`flex flex-col items-center justify-center px-3 py-2 min-w-[60px] transition-colors ${
                status === 'completed' ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs font-medium">Xong</span>
            </button>
            
            <button
              onClick={() => { setStatus('cancelled'); setPage(1); }}
              className={`flex flex-col items-center justify-center px-3 py-2 min-w-[60px] transition-colors ${
                status === 'cancelled' ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span className="text-xs font-medium">Đã hủy</span>
            </button>
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

                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                              <span className="text-lg font-bold text-primary">
                                {formatPrice(booking.totalPrice)}
                              </span>
                              <div className="flex flex-wrap gap-2">
                                {/* QR Code Button for confirmed bookings */}
                                {booking.status === 'confirmed' && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowQRDialog(booking)}
                                  >
                                    <QrCode className="mr-1 h-4 w-4" />
                                    <span className="hidden sm:inline">Mã QR</span>
                                  </Button>
                                )}
                                {/* Add Service Button for confirmed bookings */}
                                {booking.status === 'confirmed' && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowAddServiceDialog(booking)}
                                  >
                                    <Plus className="mr-1 h-4 w-4" />
                                    <span className="hidden sm:inline">Thêm dịch vụ</span>
                                  </Button>
                                )}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => navigate(`/my-bookings/${booking._id}`)}
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

      {/* QR Code Dialog */}
      <Dialog open={!!showQRDialog} onOpenChange={() => setShowQRDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center">Mã QR đơn hàng</DialogTitle>
            <DialogDescription className="text-center">
              Quét mã QR để xem chi tiết đơn hàng
            </DialogDescription>
          </DialogHeader>
          {showQRDialog && (
            <div className="flex flex-col items-center py-4">
              <div className="bg-white p-6 rounded-lg">
                <QRCode value={getQRCodeUrl(showQRDialog)} size={200} />
              </div>
              <p className="text-sm text-muted-foreground text-center mt-4">
                Mã đơn: #{showQRDialog._id.slice(-8).toUpperCase()}
              </p>
              <Button
                className="mt-4"
                onClick={() => {
                  navigate(`/my-bookings/${showQRDialog._id}`);
                  setShowQRDialog(null);
                }}
              >
                Xem chi tiết
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Service Dialog */}
      <Dialog open={!!showAddServiceDialog} onOpenChange={() => setShowAddServiceDialog(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Thêm dịch vụ</DialogTitle>
            <DialogDescription>
              Chọn dịch vụ bạn muốn thêm vào đơn đặt phòng
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[400px] overflow-y-auto">
            {services.map((service) => (
              <div
                key={service._id}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  selectedService?._id === service._id
                    ? 'border-primary bg-primary/5'
                    : 'hover:border-primary/50'
                }`}
                onClick={() => setSelectedService(service)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{service.name}</h4>
                    <p className="text-sm text-muted-foreground">{service.description}</p>
                  </div>
                  <p className="font-semibold text-primary">{formatPrice(service.price)}</p>
                </div>
              </div>
            ))}
          </div>
          {selectedService && (
            <div className="flex items-center justify-center gap-4 py-4 border-t">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setServiceQuantity(Math.max(1, serviceQuantity - 1))}
              >
                -
              </Button>
              <span className="text-xl font-bold w-12 text-center">{serviceQuantity}</span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setServiceQuantity(serviceQuantity + 1)}
              >
                +
              </Button>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddServiceDialog(null)}>
              Hủy
            </Button>
            <Button
              onClick={handleAddService}
              disabled={!selectedService || addServiceMutation.isPending}
            >
              {addServiceMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Thêm ({selectedService ? formatPrice(selectedService.price * serviceQuantity) : ''})
            </Button>
          </DialogFooter>
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
