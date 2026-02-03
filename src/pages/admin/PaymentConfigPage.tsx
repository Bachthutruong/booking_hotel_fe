import { useState, useEffect } from 'react';
import { Loader2, Save, Percent, DollarSign } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { uploadService } from '@/services/uploadService';
import { configService } from '@/services/configService';
import { toast } from '@/hooks/use-toast';

export default function PaymentConfigPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Bank config
  const [bankConfig, setBankConfig] = useState({
    bankName: '',
    accountNumber: '',
    accountName: '',
    qrCode: ''
  });

  // Deposit config
  const [depositConfig, setDepositConfig] = useState({
    type: 'percentage' as 'percentage' | 'fixed',
    value: 30 // 30% hoặc 30000 VND tùy type
  });

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const [bankRes, depositRes] = await Promise.all([
          configService.getConfig('bank_info').catch(() => null),
          configService.getConfig('deposit_config').catch(() => null)
        ]);
        
        if (bankRes?.success && bankRes.data) {
          setBankConfig(bankRes.data.value);
        }
        
        if (depositRes?.success && depositRes.data) {
          setDepositConfig(depositRes.data.value);
        }
      } catch (error) {
        console.log('No config found, using defaults');
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  const handleBankChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setBankConfig(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        setSaving(true);
        const res = await uploadService.uploadImage(e.target.files[0]);
        if (res.success && res.data) {
          setBankConfig(prev => ({ ...prev, qrCode: res.data!.url }));
        }
      } catch (error) {
        console.error('Upload failed');
      } finally {
        setSaving(false);
      }
    }
  };

  const handleSaveBankConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await configService.updateConfig('bank_info', bankConfig);
      toast({
        title: 'Thành công',
        description: 'Đã lưu thông tin ngân hàng',
      });
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể lưu cấu hình',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDepositConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await configService.updateConfig('deposit_config', depositConfig);
      toast({
        title: 'Thành công',
        description: 'Đã lưu cấu hình đặt cọc',
      });
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể lưu cấu hình',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center py-10"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Cấu hình thanh toán</h2>
      
      <div className="grid gap-6 md:grid-cols-2">
        {/* Bank Config Card */}
        <Card>
          <CardHeader>
            <CardTitle>Thông tin ngân hàng & QR Code</CardTitle>
            <CardDescription>Thông tin này sẽ hiển thị cho khách hàng khi thanh toán.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveBankConfig} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bankName">Tên ngân hàng</Label>
                <Input id="bankName" name="bankName" value={bankConfig.bankName} onChange={handleBankChange} placeholder="VD: Vietcombank" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="accountNumber">Số tài khoản</Label>
                <Input id="accountNumber" name="accountNumber" value={bankConfig.accountNumber} onChange={handleBankChange} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="accountName">Chủ tài khoản</Label>
                <Input id="accountName" name="accountName" value={bankConfig.accountName} onChange={handleBankChange} />
              </div>

              <div className="space-y-2">
                <Label>Mã QR</Label>
                <div className="flex items-start gap-4">
                  {bankConfig.qrCode && (
                    <img src={bankConfig.qrCode} alt="QR Code" className="w-32 h-32 object-cover border rounded" />
                  )}
                  <Input type="file" accept="image/*" onChange={handleImageUpload} />
                </div>
              </div>

              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                Lưu thông tin ngân hàng
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Deposit Config Card */}
        <Card>
          <CardHeader>
            <CardTitle>Cấu hình đặt cọc</CardTitle>
            <CardDescription>Số tiền khách hàng cần đặt cọc trước khi xác nhận booking.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveDepositConfig} className="space-y-6">
              <div className="space-y-4">
                <Label>Loại đặt cọc</Label>
                <RadioGroup 
                  value={depositConfig.type} 
                  onValueChange={(value: 'percentage' | 'fixed') => setDepositConfig(prev => ({ ...prev, type: value }))}
                  className="flex flex-col space-y-2"
                >
                  <div className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="percentage" id="percentage" />
                    <Label htmlFor="percentage" className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <Percent className="h-4 w-4 text-primary" />
                        <span className="font-medium">Theo phần trăm</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Tính đặt cọc dựa trên % tổng giá trị đơn hàng
                      </p>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="fixed" id="fixed" />
                    <Label htmlFor="fixed" className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-primary" />
                        <span className="font-medium">Số tiền cố định</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Đặt cọc một số tiền cố định cho mọi đơn hàng
                      </p>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="depositValue">
                  {depositConfig.type === 'percentage' ? 'Phần trăm đặt cọc (%)' : 'Số tiền đặt cọc (VNĐ)'}
                </Label>
                <div className="relative">
                  <Input 
                    id="depositValue"
                    type="number" 
                    min={0}
                    max={depositConfig.type === 'percentage' ? 100 : undefined}
                    value={depositConfig.value} 
                    onChange={(e) => setDepositConfig(prev => ({ ...prev, value: Number(e.target.value) }))}
                    className="pr-12"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {depositConfig.type === 'percentage' ? '%' : 'VNĐ'}
                  </span>
                </div>
                {depositConfig.type === 'percentage' && (
                  <p className="text-sm text-muted-foreground">
                    VD: Nếu đặt 30%, khách hàng cần chuyển {depositConfig.value}% tổng giá trị đơn hàng.
                  </p>
                )}
                {depositConfig.type === 'fixed' && (
                  <p className="text-sm text-muted-foreground">
                    VD: Khách hàng cần chuyển {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(depositConfig.value)} cho mọi đơn hàng.
                  </p>
                )}
              </div>

              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                Lưu cấu hình đặt cọc
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

