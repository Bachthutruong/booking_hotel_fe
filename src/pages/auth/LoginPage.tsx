import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Building2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/store/authStore';

const loginSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
});

type LoginForm = z.infer<typeof loginSchema>;

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const from = (location.state as any)?.from || '/';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      setIsLoading(true);
      setError('');
      const response = await authService.login(data);
      login(response.data, response.token);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Đăng nhập thất bại');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white md:bg-gradient-to-br md:from-orange-50 md:via-white md:to-rose-50 px-4 py-12 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden md:block hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-white to-rose-50" />
        <div className="absolute top-[10%] left-[15%] w-[400px] h-[400px] rounded-full bg-gradient-to-r from-orange-200/40 to-amber-200/40 blur-[100px] animate-float-slow" />
        <div className="absolute bottom-[15%] right-[10%] w-[350px] h-[350px] rounded-full bg-gradient-to-r from-rose-200/30 to-pink-200/30 blur-[80px] animate-float-medium" />
        <div className="absolute top-[50%] right-[30%] w-[300px] h-[300px] rounded-full bg-gradient-to-r from-amber-200/25 to-yellow-200/25 blur-[70px] animate-float-reverse" />
      </div>
      
      <div className="w-full max-w-[448px] md:bg-white/90 md:backdrop-blur-xl md:p-10 md:rounded-[28px] md:shadow-xl md:border md:border-orange-100/50 animate-fade-in transition-all relative z-10">
        <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2 mb-6 group">
                <div className="bg-primary/10 p-3 rounded-xl group-hover:bg-primary/20 transition-colors">
                    <Building2 className="h-8 w-8 text-primary" />
                </div>
            </Link>
          <h1 className="text-2xl font-normal text-foreground mb-2">Đăng nhập</h1>
          <p className="text-base text-muted-foreground">
            Sử dụng tài khoản Jiudi Booking
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg flex items-center justify-center">
                {error}
              </div>
            )}

            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-base text-muted-foreground font-normal">Email</Label>
                <Input
                  id="email"
                  type="email"
                  className="h-14 px-4 rounded-lg border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary transition-all text-base"
                  {...register('email')}
                  disabled={isLoading}
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                 <div className="flex justify-between items-center">
                    <Label htmlFor="password" className="text-base text-muted-foreground font-normal">Mật khẩu</Label>
                 </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    className="h-14 px-4 rounded-lg border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary transition-all text-base pr-12"
                    {...register('password')}
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 text-muted-foreground rounded-full hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </Button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-500">{errors.password.message}</p>
                )}
                 <div className="flex justify-end pt-1">
                     <Link
                      to="/forgot-password"
                      className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                    >
                      Quên mật khẩu?
                    </Link>
                 </div>
              </div>
            </div>

            <div className="pt-4 flex flex-col gap-4">
                 <Button type="submit" className="w-full h-12 rounded-full text-base font-medium shadow-none hover:shadow-md transition-all" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Tiếp theo
                </Button>
                 <div className="text-center">
                    <Link to="/auth/register" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">
                        Tạo tài khoản
                    </Link>
                </div>
            </div>
        </form>
      </div>
      
      {/* Footer links similar to Google */}
      <div className="mt-8 flex gap-6 text-xs text-muted-foreground">
        <a href="#" className="hover:text-foreground">Trợ giúp</a>
        <a href="#" className="hover:text-foreground">Bảo mật</a>
        <a href="#" className="hover:text-foreground">Điều khoản</a>
      </div>
    </div>
  );
}