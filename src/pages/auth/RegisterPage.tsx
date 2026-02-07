import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Building2, Loader2, Mail, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/store/authStore';

const registerSchema = z.object({
  fullName: z.string().min(2, 'Họ tên phải có ít nhất 2 ký tự'),
  email: z.string().min(1, 'Vui lòng nhập Email').email('Email không hợp lệ'),
  phone: z.string().min(9, 'Số điện thoại không hợp lệ'),
});

type RegisterForm = z.infer<typeof registerSchema>;

export function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    try {
      setIsLoading(true);
      setError('');
      const response = await authService.register({
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
      });
      if (response.success && response.data && response.token) {
        login(response.data as any, response.token);
        navigate('/');
      } else {
        setError(response.message || 'Đăng ký thất bại');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Đăng ký thất bại');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white md:bg-gradient-to-br md:from-orange-50 md:via-white md:to-rose-50 px-4 py-12 relative overflow-hidden">
      <div className="fixed inset-0 -z-10 overflow-hidden md:block hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-white to-rose-50" />
        <div className="absolute top-[10%] left-[15%] w-[400px] h-[400px] rounded-full bg-gradient-to-r from-orange-200/40 to-amber-200/40 blur-[100px] animate-float-slow" />
        <div className="absolute bottom-[15%] right-[10%] w-[350px] h-[350px] rounded-full bg-gradient-to-r from-rose-200/30 to-pink-200/30 blur-[80px] animate-float-medium" />
        <div className="absolute top-[50%] right-[30%] w-[300px] h-[300px] rounded-full bg-gradient-to-r from-amber-200/25 to-yellow-200/25 blur-[70px] animate-float-reverse" />
      </div>

      <div className="w-full max-w-[448px] md:bg-white/90 md:backdrop-blur-xl md:p-10 md:rounded-[28px] md:shadow-xl md:border md:border-orange-100/50 animate-fade-in transition-all relative z-10">
        <div className="text-center mb-8">
          <Link to="/hotels" className="inline-flex items-center gap-2 mb-6 group">
            <div className="bg-primary/10 p-3 rounded-xl group-hover:bg-primary/20 transition-colors">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
          </Link>
          <h1 className="text-2xl font-normal text-foreground mb-2">Tạo tài khoản</h1>
          <p className="text-base text-muted-foreground">
            Chỉ cần nhập Họ tên, Email và Số điện thoại
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg flex items-center justify-center">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="fullName" className="text-base text-muted-foreground font-normal">Họ và tên</Label>
              <Input
                id="fullName"
                className="h-12 px-4 rounded-lg border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary transition-all text-base"
                placeholder="Nguyễn Văn A"
                {...register('fullName')}
                disabled={isLoading}
              />
              {errors.fullName && (
                <p className="text-sm text-red-500">{errors.fullName.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="email" className="text-base text-muted-foreground font-normal">Email</Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  className="h-12 px-4 rounded-lg border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary transition-all text-base pr-10"
                  placeholder="example@gmail.com"
                  {...register('email')}
                  disabled={isLoading}
                />
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-50" />
              </div>
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="phone" className="text-base text-muted-foreground font-normal">Số điện thoại</Label>
              <div className="relative">
                <Input
                  id="phone"
                  type="tel"
                  className="h-12 px-4 rounded-lg border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary transition-all text-base pr-10"
                  placeholder="0987654321"
                  {...register('phone')}
                  disabled={isLoading}
                />
                <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-50" />
              </div>
              {errors.phone && (
                <p className="text-sm text-red-500">{errors.phone.message}</p>
              )}
            </div>
          </div>

          <div className="pt-4 flex flex-col gap-4">
            <Button type="submit" className="w-full h-12 rounded-full text-base font-medium shadow-none hover:shadow-md transition-all" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Đăng ký
            </Button>
            <div className="text-center">
              <Link to="/auth/login" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">
                Đã có tài khoản? Đăng nhập
              </Link>
            </div>
          </div>
        </form>
      </div>
      <div className="mt-8 flex gap-6 text-xs text-muted-foreground">
        <a href="#" className="hover:text-foreground">Trợ giúp</a>
        <a href="#" className="hover:text-foreground">Bảo mật</a>
        <a href="#" className="hover:text-foreground">Điều khoản</a>
      </div>
    </div>
  );
}
