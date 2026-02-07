import { useState, useRef } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import SignatureCanvas from 'react-signature-canvas';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, CheckCircle2, AlertCircle, ArrowLeft, PenTool } from 'lucide-react';
import { walletService } from '@/services/walletService';
import { formatPrice } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/store/authStore';

export default function WithdrawalConfirmPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuthStore();
  const signatureRef = useRef<SignatureCanvas>(null);
  
  const [confirmed, setConfirmed] = useState(false);

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: `/withdraw/confirm/${token}` }} replace />;
  }

  // Fetch withdrawal details
  const { data: withdrawalData, isLoading, error } = useQuery({
    queryKey: ['withdrawalConfirm', token],
    queryFn: () => walletService.getWithdrawalByToken(token!),
    enabled: !!token && isAuthenticated,
    retry: false,
  });

  const confirmMutation = useMutation({
    mutationFn: ({ token, signature }: { token: string; signature: string }) =>
      walletService.confirmWithdrawal(token, signature),
    onSuccess: () => {
      setConfirmed(true);
      toast({
        title: 'Xác nhận thành công',
        description: 'Giao dịch hoàn tiền đã được thực hiện thành công.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Lỗi',
        description: error.response?.data?.message || 'Không thể xác nhận giao dịch',
        variant: 'destructive',
      });
    },
  });

  const handleConfirm = () => {
    if (signatureRef.current?.isEmpty()) {
      toast({
        title: 'Thiếu chữ ký',
        description: 'Vui lòng ký tên để xác nhận',
        variant: 'destructive',
      });
      return;
    }

    const signature = signatureRef.current?.toDataURL() || '';
    confirmMutation.mutate({ token: token!, signature });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Đang tải thông tin giao dịch...</p>
      </div>
    );
  }

  if (error || !withdrawalData?.data) {
    return (
      <div className="container max-w-lg mx-auto py-12 px-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Không tìm thấy giao dịch</AlertTitle>
          <AlertDescription>
            Link xác nhận không hợp lệ hoặc giao dịch không tồn tại/đã bị xóa.
            {(error as any)?.response?.status === 403 && " Bạn không có quyền truy cập giao dịch này."}
          </AlertDescription>
        </Alert>
        <div className="mt-4 text-center">
             <Button variant="outline" onClick={() => navigate('/')}>
               Về trang chủ
             </Button>
        </div>
      </div>
    );
  }

  const withdrawal = withdrawalData.data;

  if (confirmed || withdrawal.status !== 'pending_confirmation') {
    return (
      <div className="container max-w-lg mx-auto py-12 px-4">
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="mx-auto bg-green-100 w-16 h-16 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-green-800">Giao dịch đã hoàn thành</h2>
            <p className="text-green-700">
              Yêu cầu hoàn tiền {formatPrice(withdrawal.amount)} đã được xác nhận thành công.
            </p>
            <div className="pt-4">
              <Button onClick={() => navigate('/wallet')}>Kiểm tra ví của tôi</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-lg mx-auto py-12 px-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl text-center">Xác nhận hoàn tiền</CardTitle>
          <CardDescription className="text-center">
             Vui lòng kiểm tra thông tin và ký xác nhận
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-lg space-y-3">
             <div className="flex justify-between">
               <span className="text-muted-foreground">Người thụ hưởng:</span>
               <span className="font-medium">{user?.fullName}</span>
             </div>
             <div className="flex justify-between border-t border-dashed pt-2">
               <span className="text-muted-foreground">Số tiền hoàn:</span>
               <span className="text-xl font-bold text-red-600">
                 {formatPrice(withdrawal.amount)}
               </span>
             </div>
          </div>

          <div className="space-y-2">
            <Label className="text-muted-foreground">Thông tin nhận tiền</Label>
            <div className="p-3 border rounded bg-white text-sm">
               <p><span className="font-semibold">Tên ngân hàng:</span> {withdrawal.bankInfo.bankName}</p>
               <p><span className="font-semibold">STK:</span> {withdrawal.bankInfo.accountNumber}</p>
               <p><span className="font-semibold">Chủ TK:</span> {withdrawal.bankInfo.accountName}</p>
            </div>
          </div>
          
          {withdrawal.adminNote && (
            <div className="space-y-2">
               <Label className="text-muted-foreground">Ghi chú từ Admin</Label>
               <p className="p-3 bg-gray-50 rounded text-sm italic">"{withdrawal.adminNote}"</p>
            </div>
          )}

          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <PenTool className="h-4 w-4" />
              Chữ ký của bạn *
            </Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg bg-white overflow-hidden">
               <SignatureCanvas
                 ref={signatureRef}
                 canvasProps={{
                   className: 'w-full h-40',
                 }}
                 backgroundColor="white"
               />
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Ký tên để xác nhận giao dịch này
              </span>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 text-xs"
                onClick={() => signatureRef.current?.clear()}
              >
                Ký lại
              </Button>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-3">
          <Button 
            className="w-full bg-green-600 hover:bg-green-700 text-lg py-6"
            onClick={handleConfirm}
            disabled={confirmMutation.isPending}
          >
            {confirmMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              'Xác nhận hoàn tiền'
            )}
          </Button>
          <Button variant="outline" className="w-full" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
