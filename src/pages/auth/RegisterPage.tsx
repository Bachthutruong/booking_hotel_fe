import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Building2, Loader2, Mail, ArrowLeft, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/store/authStore';

const registerSchema = z
  .object({
    fullName: z.string().min(2, 'Họ tên phải có ít nhất 2 ký tự'),
    email: z.string().email('Email không hợp lệ'),
    phone: z.string().optional(),
    password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  });

type RegisterForm = z.infer<typeof registerSchema>;

export function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'register' | 'verify'>('register');
  const [pendingEmail, setPendingEmail] = useState('');
  const [pendingFullName, setPendingFullName] = useState('');
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(600);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  // Countdown timer
  useEffect(() => {
    if (step === 'verify' && countdown > 0) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [step, countdown]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const onSubmit = async (data: RegisterForm) => {
    try {
      setIsLoading(true);
      setError('');
      const response = await authService.register({
        email: data.email,
        password: data.password,
        fullName: data.fullName,
        phone: data.phone,
      });
      
      if (response.success) {
        setPendingEmail(data.email);
        setPendingFullName(data.fullName);
        setStep('verify');
        setCountdown(response.data?.expiresIn || 600);
        setCanResend(false);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Đăng ký thất bại');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste
      const digits = value.replace(/\D/g, '').slice(0, 6).split('');
      const newCode = [...verificationCode];
      digits.forEach((digit, i) => {
        if (index + i < 6) {
          newCode[index + i] = digit;
        }
      });
      setVerificationCode(newCode);
      const nextIndex = Math.min(index + digits.length, 5);
      inputRefs.current[nextIndex]?.focus();
    } else {
      const newCode = [...verificationCode];
      newCode[index] = value.replace(/\D/g, '');
      setVerificationCode(newCode);
      
      if (value && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = verificationCode.join('');
    if (code.length !== 6) {
      setError('Vui lòng nhập đầy đủ mã xác thực');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      const response = await authService.verifyEmail({
        email: pendingEmail,
        code,
      });
      
      if (response.success && response.data && response.token) {
        login(response.data, response.token);
        navigate('/');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Xác thực thất bại');
      setVerificationCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await authService.resendVerificationCode(pendingEmail);
      
      if (response.success) {
        setCountdown(response.data?.expiresIn || 600);
        setCanResend(false);
        setVerificationCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể gửi lại mã');
    } finally {
      setIsLoading(false);
    }
  };

  // Verification Step UI
  if (step === 'verify') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white md:bg-gradient-to-br md:from-orange-50 md:via-white md:to-rose-50 px-4 py-12 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="fixed inset-0 -z-10 overflow-hidden md:block hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-white to-rose-50" />
          <div className="absolute top-[10%] left-[15%] w-[400px] h-[400px] rounded-full bg-gradient-to-r from-orange-200/40 to-amber-200/40 blur-[100px] animate-float-slow" />
          <div className="absolute bottom-[15%] right-[10%] w-[350px] h-[350px] rounded-full bg-gradient-to-r from-rose-200/30 to-pink-200/30 blur-[80px] animate-float-medium" />
        </div>
        
        <div className="w-full max-w-[448px] md:bg-white/90 md:backdrop-blur-xl md:p-10 md:rounded-[28px] md:shadow-xl md:border md:border-orange-100/50 animate-fade-in transition-all relative z-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-orange-200/30 mb-6">
              <Mail className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-2xl font-semibold text-foreground mb-2">Xác thực email</h1>
            <p className="text-base text-muted-foreground">
              Chúng tôi đã gửi mã xác thực đến
            </p>
            <p className="text-base font-medium text-foreground mt-1">{pendingEmail}</p>
          </div>

          <div className="space-y-6">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg flex items-center justify-center">
                {error}
              </div>
            )}

            {/* Code Input */}
            <div className="flex justify-center gap-2">
              {verificationCode.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => { inputRefs.current[index] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={digit}
                  onChange={(e) => handleCodeChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                  disabled={isLoading}
                />
              ))}
            </div>

            {/* Countdown */}
            <div className="text-center">
              {countdown > 0 ? (
                <p className="text-sm text-muted-foreground">
                  Mã có hiệu lực trong <span className="font-semibold text-primary">{formatTime(countdown)}</span>
                </p>
              ) : (
                <p className="text-sm text-amber-600">
                  Mã đã hết hạn. Vui lòng gửi lại.
                </p>
              )}
            </div>

            <Button
              onClick={handleVerify}
              className="w-full h-12 rounded-full text-base font-medium shadow-none hover:shadow-md transition-all"
              disabled={isLoading || verificationCode.some(d => !d)}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Xác thực
            </Button>

            <div className="flex items-center justify-center gap-4">
              <Button
                variant="ghost"
                onClick={handleResendCode}
                disabled={!canResend || isLoading}
                className="text-sm"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Gửi lại mã
              </Button>
            </div>

            <Button
              variant="ghost"
              onClick={() => {
                setStep('register');
                setVerificationCode(['', '', '', '', '', '']);
                setError('');
              }}
              className="w-full text-muted-foreground"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Quay lại đăng ký
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Registration Form UI
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
          <h1 className="text-2xl font-normal text-foreground mb-2">Tạo tài khoản</h1>
          <p className="text-base text-muted-foreground">
            Tiếp tục đến với Jiudi Booking
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
                  {...register('fullName')}
                  disabled={isLoading}
                />
                {errors.fullName && (
                  <p className="text-sm text-red-500">{errors.fullName.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="email" className="text-base text-muted-foreground font-normal">Email</Label>
                <Input
                  id="email"
                  type="email"
                  className="h-12 px-4 rounded-lg border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary transition-all text-base"
                  {...register('email')}
                  disabled={isLoading}
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="phone" className="text-base text-muted-foreground font-normal">Số điện thoại (tùy chọn)</Label>
                <Input
                  id="phone"
                  type="tel"
                  className="h-12 px-4 rounded-lg border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary transition-all text-base"
                  {...register('phone')}
                  disabled={isLoading}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="password" className="text-base text-muted-foreground font-normal">Mật khẩu</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        className="h-12 px-4 rounded-lg border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary transition-all text-base pr-10"
                        {...register('password')}
                        disabled={isLoading}
                      />
                    </div>
                     {errors.password && (
                      <p className="text-sm text-red-500">{errors.password.message}</p>
                    )}
                  </div>
                  
                   <div className="space-y-1">
                    <Label htmlFor="confirmPassword" className="text-base text-muted-foreground font-normal">Xác nhận</Label>
                     <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showPassword ? 'text' : 'password'}
                         className="h-12 px-4 rounded-lg border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary transition-all text-base pr-10"
                        {...register('confirmPassword')}
                        disabled={isLoading}
                      />
                       <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-1/2 -translate-y-1/2 h-10 w-10 text-muted-foreground rounded-full hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                     {errors.confirmPassword && (
                      <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
                    )}
                  </div>
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