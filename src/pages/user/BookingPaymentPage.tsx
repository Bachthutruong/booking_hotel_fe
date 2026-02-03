import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, Upload, CheckCircle, Clock, AlertCircle, Banknote } from 'lucide-react';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

import { bookingService } from '@/services/bookingService';
import { configService } from '@/services/configService';
import { uploadService } from '@/services/uploadService';
import type { Booking, SystemConfig } from '@/types';

interface DepositConfig {
  type: 'percentage' | 'fixed';
  value: number;
}

export default function BookingPaymentPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [bankConfig, setBankConfig] = useState<any>(null);
  const [depositConfig, setDepositConfig] = useState<DepositConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const [bookingRes, bankConfigRes, depositConfigRes] = await Promise.all([
          bookingService.getBooking(id),
          configService.getConfig('bank_info').catch(() => ({ data: null })),
          configService.getConfig('deposit_config').catch(() => ({ data: null }))
        ]);

        if (bookingRes.success && bookingRes.data) {
          setBooking(bookingRes.data);
        }
        
        // Bank config
        if (bankConfigRes && (bankConfigRes as any).success && (bankConfigRes as any).data) {
          setBankConfig((bankConfigRes as any).data.value);
        }

        // Deposit config
        if (depositConfigRes && (depositConfigRes as any).success && (depositConfigRes as any).data) {
          setDepositConfig((depositConfigRes as any).data.value);
        }
      } catch (error) {
        console.error('Failed to fetch data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // Calculate deposit amount
  const calculateDepositAmount = () => {
    if (!booking) return 0;
    if (!depositConfig) {
      // Default: 100% (full payment required)
      return booking.totalPrice;
    }

    if (depositConfig.type === 'percentage') {
      return Math.round((booking.totalPrice * depositConfig.value) / 100);
    } else {
      // Fixed amount - but don't exceed total price
      return Math.min(depositConfig.value, booking.totalPrice);
    }
  };

  const depositAmount = calculateDepositAmount();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file || !id) return;

    try {
      setUploading(true);
      // 1. Upload image
      const uploadRes = await uploadService.uploadImage(file);
      
      if (uploadRes.success && uploadRes.data) {
        // 2. Update booking with proof
        const bookingRes = await bookingService.uploadProof(id, uploadRes.data.url);
        if (bookingRes.success && bookingRes.data) {
           setBooking(bookingRes.data);
           setFile(null);
        }
      }
    } catch (error) {
      console.error('Upload failed', error);
      // alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!booking) {
    return <div className="container py-10">Booking not found</div>;
  }

  const renderStatus = () => {
    switch (booking.status) {
      case 'pending_deposit':
        return (
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertTitle>Chờ thanh toán</AlertTitle>
            <AlertDescription>
              Vui lòng chuyển khoản đặt cọc để giữ phòng.
            </AlertDescription>
          </Alert>
        );
      case 'awaiting_approval':
        return (
          <Alert className="border-yellow-500 text-yellow-600">
            <Clock className="h-4 w-4" />
            <AlertTitle>Đang chờ duyệt</AlertTitle>
            <AlertDescription>
              Chúng tôi đã nhận được minh chứng thanh toán và đang kiểm tra.
            </AlertDescription>
          </Alert>
        );
      case 'confirmed':
        return (
          <Alert className="border-green-500 text-green-600">
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>Đã xác nhận</AlertTitle>
            <AlertDescription>
              Đặt phòng của bạn đã thành công!
            </AlertDescription>
          </Alert>
        );
      case 'cancelled':
        return (
           <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Đã hủy</AlertTitle>
            <AlertDescription>
              Đặt phòng này đã bị hủy.
            </AlertDescription>
          </Alert>
        );
      default:
        return null;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <div className="min-h-screen animate-gradient bg-fixed pb-12">
      <div className="container max-w-4xl py-10 mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Booking Details */}
        <Card>
          <CardHeader>
            <CardTitle>Chi tiết đặt phòng</CardTitle>
            <CardDescription>Mã: #{booking._id.slice(-6).toUpperCase()}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div>
                <h3 className="font-semibold text-lg">{(booking.hotel as any).name}</h3>
                <p className="text-gray-500">{(booking.room as any).name}</p>
             </div>
             
             <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                    <span className="block text-gray-500">Nhận phòng</span>
                    <span className="font-medium">{format(new Date(booking.checkIn), 'dd/MM/yyyy')}</span>
                </div>
                 <div>
                    <span className="block text-gray-500">Trả phòng</span>
                    <span className="font-medium">{format(new Date(booking.checkOut), 'dd/MM/yyyy')}</span>
                </div>
             </div>

             <Separator />

             <div className="space-y-2">
                <span className="block font-medium">Dịch vụ đi kèm:</span>
                {booking.services && booking.services.length > 0 ? (
                    <ul className="list-disc list-inside text-sm text-gray-600">
                        {booking.services.map((s, idx) => (
                            <li key={idx}>
                                {(s.service as any).name} (x{s.quantity}) - {formatCurrency(s.price * s.quantity)}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-sm text-gray-500">Không có</p>
                )}
             </div>

             <Separator />
             
             <div className="space-y-3">
                <div className="flex justify-between items-center text-lg">
                  <span>Tổng giá trị đơn hàng</span>
                  <span className="font-medium">{formatCurrency(booking.totalPrice)}</span>
                </div>
                
                {/* Deposit Amount Display */}
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2 text-primary">
                    <Banknote className="h-5 w-5" />
                    <span className="font-semibold">Số tiền cần đặt cọc</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      {depositConfig ? (
                        depositConfig.type === 'percentage' 
                          ? `${depositConfig.value}% tổng giá trị`
                          : 'Số tiền cố định'
                      ) : 'Thanh toán toàn bộ'}
                    </span>
                    <span className="text-2xl font-bold text-primary">
                      {formatCurrency(depositAmount)}
                    </span>
                  </div>
                  {depositAmount < booking.totalPrice && (
                    <p className="text-xs text-muted-foreground">
                      Số tiền còn lại ({formatCurrency(booking.totalPrice - depositAmount)}) sẽ thanh toán khi nhận phòng.
                    </p>
                  )}
                </div>
             </div>

             <div className="pt-4">
                {renderStatus()}
             </div>

          </CardContent>
        </Card>

        {/* Payment / Proof Section */}
        <div className="space-y-6">
            {booking.status === 'pending_deposit' && (
                <Card>
                    <CardHeader>
                        <CardTitle>Thông tin chuyển khoản</CardTitle>
                        <CardDescription>
                          Vui lòng chuyển đúng số tiền <span className="font-bold text-primary">{formatCurrency(depositAmount)}</span>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {bankConfig ? (
                            <div className="space-y-4">
                                {bankConfig.qrCode && (
                                    <div className="flex justify-center">
                                        <img src={bankConfig.qrCode} alt="QR Code" className="w-48 h-48 object-contain border rounded-lg" />
                                    </div>
                                )}
                                <div className="space-y-2 text-sm bg-gray-50 p-4 rounded-lg">
                                    <p><span className="font-semibold">Ngân hàng:</span> {bankConfig.bankName}</p>
                                    <p><span className="font-semibold">Số tài khoản:</span> {bankConfig.accountNumber}</p>
                                    <p><span className="font-semibold">Chủ tài khoản:</span> {bankConfig.accountName}</p>
                                    <p><span className="font-semibold">Nội dung:</span> {booking._id.slice(-6).toUpperCase()}</p>
                                    <Separator className="my-3" />
                                    <div className="flex justify-between items-center bg-primary/10 p-3 rounded-md">
                                      <span className="font-semibold">Số tiền cần chuyển:</span>
                                      <span className="text-lg font-bold text-primary">{formatCurrency(depositAmount)}</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center text-gray-500 py-4">
                                Vui lòng liên hệ admin để lấy thông tin chuyển khoản.
                            </div>
                        )}

                        <Separator />

                        <div className="space-y-4">
                            <Label>Tải lên minh chứng thanh toán</Label>
                            <Input type="file" onChange={handleFileChange} accept="image/*" />
                            <p className="text-xs text-gray-500">Chụp màn hình giao dịch chuyển khoản thành công và tải lên.</p>
                            
                            <Button 
                                className="w-full" 
                                onClick={handleUpload} 
                                disabled={!file || uploading}
                            >
                                {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Xác nhận đã chuyển khoản
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {booking.proofImage && (
                <Card>
                    <CardHeader>
                        <CardTitle>Minh chứng đã gửi</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <img src={booking.proofImage} alt="Proof" className="w-full rounded-lg border" />
                    </CardContent>
                </Card>
            )}
        </div>

      </div>
      </div>
    </div>
  );
}

