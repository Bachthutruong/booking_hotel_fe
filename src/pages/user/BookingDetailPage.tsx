import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import QRCode from 'react-qr-code';
import {
  Calendar,
  MapPin,
  User,
  Phone,
  Mail,
  CreditCard,
  ArrowLeft,
  Plus,
  Minus,
  ShoppingBag,
  Star,
  X,
  Loader2,
  Check,
  Clock,
  Building2,
  Bed,
  Users,
  FileText,
  QrCode,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
import { bookingService } from '@/services/bookingService';
import { serviceService } from '@/services/serviceService';
import { hotelService } from '@/services/hotelService';
import { formatPrice, getStatusText, getStatusColor, getRoomTypeText } from '@/lib/utils';
import type { Booking, Hotel, Room, Service } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface ServiceItem {
  service: Service | string;
  quantity: number;
  price: number;
  _id?: string;
}

export default function BookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [showAddServiceDialog, setShowAddServiceDialog] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [serviceQuantity, setServiceQuantity] = useState(1);
  const [cancelBooking, setCancelBooking] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [showQRDialog, setShowQRDialog] = useState(false);

  // Fetch booking detail
  const { data: bookingData, isLoading } = useQuery({
    queryKey: ['booking', id],
    queryFn: () => bookingService.getBooking(id!),
    enabled: !!id,
  });

  // Fetch available services
  const { data: servicesData } = useQuery({
    queryKey: ['services'],
    queryFn: () => serviceService.getServices(),
  });

  const booking = bookingData?.data;
  const services = servicesData?.data || [];
  const hotel = booking?.hotel as Hotel;
  const room = booking?.room as Room;

  // Add service mutation
  const addServiceMutation = useMutation({
    mutationFn: ({ serviceId, quantity }: { serviceId: string; quantity: number }) =>
      bookingService.addService(id!, serviceId, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking', id] });
      setShowAddServiceDialog(false);
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

  // Cancel booking mutation
  const cancelMutation = useMutation({
    mutationFn: () => bookingService.cancelBooking(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking', id] });
      setCancelBooking(false);
      toast({
        title: 'Hủy đơn thành công',
        description: 'Đơn đặt phòng đã được hủy',
      });
    },
  });

  // Review mutation
  const reviewMutation = useMutation({
    mutationFn: ({ hotelId, rating, comment }: { hotelId: string; rating: number; comment: string }) =>
      hotelService.createReview(hotelId, { bookingId: id!, rating, comment }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking', id] });
      setReviewOpen(false);
      setReviewRating(5);
      setReviewComment('');
      toast({
        title: 'Đánh giá thành công',
        description: 'Cảm ơn bạn đã chia sẻ trải nghiệm',
      });
    },
  });

  const handleAddService = () => {
    if (!selectedService) return;
    addServiceMutation.mutate({
      serviceId: selectedService._id,
      quantity: serviceQuantity,
    });
  };

  const handleSubmitReview = () => {
    if (!reviewComment.trim() || !hotel) return;
    reviewMutation.mutate({
      hotelId: hotel._id,
      rating: reviewRating,
      comment: reviewComment,
    });
  };

  // Calculate services total
  const calculateServicesTotal = () => {
    if (!booking?.services) return 0;
    return booking.services.reduce((total: number, item: ServiceItem) => {
      return total + (item.price * item.quantity);
    }, 0);
  };

  // QR Code URL
  const qrCodeUrl = `${window.location.origin}/my-bookings/${id}`;

  if (isLoading) {
    return (
      <div className="min-h-screen animate-gradient bg-fixed">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-10 w-48 mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-64" />
              <Skeleton className="h-48" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-64" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen animate-gradient bg-fixed">
        <div className="container mx-auto px-4 py-8">
          <Card className="p-12 text-center">
            <p className="text-muted-foreground mb-4">Không tìm thấy đơn đặt phòng</p>
            <Button asChild>
              <Link to="/my-bookings">Quay lại danh sách</Link>
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen animate-gradient bg-fixed">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/my-bookings')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Chi tiết đơn đặt phòng</h1>
            <p className="text-muted-foreground">
              Mã đơn: #{booking._id.slice(-8).toUpperCase()}
            </p>
          </div>
          <Badge className={`${getStatusColor(booking.status)} text-base px-4 py-2`}>
            {getStatusText(booking.status)}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hotel Info */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Thông tin khách sạn
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-4">
                  <img
                    src={hotel?.images?.[0] || 'https://via.placeholder.com/200'}
                    alt={hotel?.name}
                    className="w-full md:w-48 h-36 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-2">{hotel?.name}</h3>
                    <p className="text-muted-foreground flex items-center gap-2 mb-2">
                      <MapPin className="h-4 w-4" />
                      {hotel?.address}, {hotel?.city}
                    </p>
                    <div className="flex items-center gap-2 text-sm">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span>{hotel?.rating?.toFixed(1) || 'N/A'}</span>
                      <span className="text-muted-foreground">
                        ({hotel?.totalReviews || 0} đánh giá)
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Room Info */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <Bed className="h-5 w-5" />
                  Thông tin phòng
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Tên phòng</p>
                    <p className="font-medium">{room?.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Loại phòng</p>
                    <p className="font-medium">{getRoomTypeText(room?.type || 'standard')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Sức chứa</p>
                    <p className="font-medium">{(room?.capacity?.adults || 0) + (room?.capacity?.children || 0)} người</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Giá/đêm</p>
                    <p className="font-medium text-primary">{formatPrice(room?.price || 0)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Booking Info */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Thông tin đặt phòng
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                    <div className="bg-green-100 dark:bg-green-900 p-3 rounded-full">
                      <Calendar className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Nhận phòng</p>
                      <p className="font-semibold">
                        {format(new Date(booking.checkIn), 'EEEE, dd/MM/yyyy', { locale: vi })}
                      </p>
                      <p className="text-sm text-muted-foreground">Từ 14:00</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                    <div className="bg-red-100 dark:bg-red-900 p-3 rounded-full">
                      <Calendar className="h-5 w-5 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Trả phòng</p>
                      <p className="font-semibold">
                        {format(new Date(booking.checkOut), 'EEEE, dd/MM/yyyy', { locale: vi })}
                      </p>
                      <p className="text-sm text-muted-foreground">Trước 12:00</p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-sm text-muted-foreground">Số đêm</p>
                    <p className="text-xl font-bold">
                      {Math.ceil(
                        (new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) /
                          (1000 * 60 * 60 * 24)
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Người lớn</p>
                    <p className="text-xl font-bold">{booking.guests.adults}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Trẻ em</p>
                    <p className="text-xl font-bold">{booking.guests.children}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Tổng khách</p>
                    <p className="text-xl font-bold">
                      {booking.guests.adults + booking.guests.children}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Guest Info */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Thông tin khách hàng
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Họ tên</p>
                      <p className="font-medium">{booking.contactInfo?.fullName || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Số điện thoại</p>
                      <p className="font-medium">{booking.contactInfo?.phone || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 md:col-span-2">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{booking.contactInfo?.email || 'N/A'}</p>
                    </div>
                  </div>
                </div>
                {booking.specialRequests && (
                  <>
                    <Separator className="my-4" />
                    <div className="flex items-start gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground mt-1" />
                      <div>
                        <p className="text-sm text-muted-foreground">Yêu cầu đặc biệt</p>
                        <p className="font-medium">{booking.specialRequests}</p>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Services */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5" />
                    Dịch vụ đã sử dụng
                  </CardTitle>
                  {booking.status === 'confirmed' && (
                    <Button size="sm" onClick={() => setShowAddServiceDialog(true)}>
                      <Plus className="h-4 w-4 mr-1" />
                      Thêm dịch vụ
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {booking.services && booking.services.length > 0 ? (
                  <div className="space-y-3">
                    {booking.services.map((item: ServiceItem, index: number) => {
                      const service = item.service as Service;
                      return (
                        <div
                          key={item._id || index}
                          className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div className="bg-primary/10 p-2 rounded-lg">
                              <ShoppingBag className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{service?.name || 'Dịch vụ'}</p>
                              <p className="text-sm text-muted-foreground">
                                {formatPrice(item.price)} x {item.quantity}
                              </p>
                            </div>
                          </div>
                          <p className="font-semibold">
                            {formatPrice(item.price * item.quantity)}
                          </p>
                        </div>
                      );
                    })}
                    <Separator />
                    <div className="flex justify-between font-semibold">
                      <span>Tổng dịch vụ</span>
                      <span className="text-primary">{formatPrice(calculateServicesTotal())}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Chưa có dịch vụ nào được thêm
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* QR Code */}
            {booking.status === 'confirmed' && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <QrCode className="h-5 w-5" />
                    Mã QR đơn hàng
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center">
                  <div className="bg-white p-4 rounded-lg mb-4">
                    <QRCode value={qrCodeUrl} size={180} />
                  </div>
                  <p className="text-sm text-muted-foreground text-center">
                    Quét mã QR để xem chi tiết đơn hàng
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => setShowQRDialog(true)}
                  >
                    Phóng to QR
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Payment Summary */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Thanh toán
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tiền phòng</span>
                  <span>{formatPrice(booking.totalPrice - calculateServicesTotal())}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Dịch vụ</span>
                  <span>{formatPrice(calculateServicesTotal())}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Tổng cộng</span>
                  <span className="text-primary">{formatPrice(booking.totalPrice)}</span>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-muted-foreground">Trạng thái thanh toán</span>
                  <Badge className={getStatusColor(booking.paymentStatus)}>
                    {getStatusText(booking.paymentStatus)}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Status Timeline */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Trạng thái đơn hàng
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { status: 'pending', label: 'Chờ xác nhận', icon: Clock },
                    { status: 'confirmed', label: 'Đã xác nhận', icon: Check },
                    { status: 'completed', label: 'Hoàn thành', icon: Check },
                  ].map((step, index) => {
                    const isActive =
                      booking.status === step.status ||
                      (booking.status === 'confirmed' && step.status === 'pending') ||
                      (booking.status === 'completed' &&
                        (step.status === 'pending' || step.status === 'confirmed'));
                    const isCurrent = booking.status === step.status;
                    const Icon = step.icon;

                    return (
                      <div key={step.status} className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-full ${
                            isActive
                              ? isCurrent
                                ? 'bg-primary text-white'
                                : 'bg-green-500 text-white'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <span
                          className={`${
                            isActive
                              ? isCurrent
                                ? 'font-semibold'
                                : 'text-muted-foreground'
                              : 'text-muted-foreground'
                          }`}
                        >
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                  {booking.status === 'cancelled' && (
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-red-500 text-white">
                        <X className="h-4 w-4" />
                      </div>
                      <span className="font-semibold text-red-500">Đã hủy</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="space-y-3">
              {booking.status === 'confirmed' && (
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => setShowAddServiceDialog(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm dịch vụ
                </Button>
              )}
              {booking.status === 'pending' && (
                <Button
                  className="w-full"
                  variant="destructive"
                  onClick={() => setCancelBooking(true)}
                >
                  <X className="h-4 w-4 mr-2" />
                  Hủy đơn
                </Button>
              )}
              {booking.status === 'completed' && (
                <Button className="w-full" onClick={() => setReviewOpen(true)}>
                  <Star className="h-4 w-4 mr-2" />
                  Đánh giá
                </Button>
              )}
              <Button className="w-full" variant="outline" asChild>
                <Link to="/my-bookings">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Quay lại danh sách
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Add Service Dialog */}
      <Dialog open={showAddServiceDialog} onOpenChange={setShowAddServiceDialog}>
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
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-lg">
                      <ShoppingBag className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium">{service.name}</h4>
                      <p className="text-sm text-muted-foreground">{service.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-primary">{formatPrice(service.price)}</p>
                    {selectedService?._id === service._id && (
                      <Check className="h-5 w-5 text-primary ml-auto mt-1" />
                    )}
                  </div>
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
                <Minus className="h-4 w-4" />
              </Button>
              <span className="text-xl font-bold w-12 text-center">{serviceQuantity}</span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setServiceQuantity(serviceQuantity + 1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddServiceDialog(false)}>
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

      {/* QR Dialog */}
      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center">Mã QR đơn hàng</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center py-4">
            <div className="bg-white p-6 rounded-lg">
              <QRCode value={qrCodeUrl} size={250} />
            </div>
            <p className="text-sm text-muted-foreground text-center mt-4">
              Mã đơn: #{booking._id.slice(-8).toUpperCase()}
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation */}
      <AlertDialog open={cancelBooking} onOpenChange={setCancelBooking}>
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
              onClick={() => cancelMutation.mutate()}
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Hủy đặt phòng
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Review Dialog */}
      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Đánh giá khách sạn</DialogTitle>
            <DialogDescription>Chia sẻ trải nghiệm của bạn về chuyến đi</DialogDescription>
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
            <Button variant="outline" onClick={() => setReviewOpen(false)}>
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
  );
}
