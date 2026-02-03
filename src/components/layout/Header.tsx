import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, User, LogOut, Settings, Calendar, Building2, Search, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/authService';
import { walletService } from '@/services/walletService';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  // Fetch wallet balance
  const { data: walletData } = useQuery({
    queryKey: ['walletBalance'],
    queryFn: () => walletService.getBalance(),
    enabled: isAuthenticated && user?.role === 'user',
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const walletBalance = walletData?.data;

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      await authService.logout();
      logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      logout();
      navigate('/');
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const navItems = [
    { label: 'Trang chủ', href: '/' },
    { label: 'Khách sạn', href: '/hotels' },
    // { label: 'Về chúng tôi', href: '/about' },
  ];

  return (
    <header 
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-200 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80",
        scrolled ? "shadow-md py-2" : "py-4 border-b border-transparent"
      )}
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between">
          {/* Left: Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="bg-primary/10 p-2 rounded-xl group-hover:bg-primary/20 transition-colors">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <span className="text-xl font-medium tracking-tight text-foreground group-hover:text-primary transition-colors">
              Jiudi<span className="font-bold">Booking</span>
            </span>
          </Link>

          {/* Center: Navigation (Desktop) */}
          <nav className="hidden md:flex items-center gap-1 bg-secondary/50 p-1 rounded-full border border-border/50">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "px-6 py-2 rounded-full text-sm font-medium transition-all duration-200",
                    isActive 
                      ? "bg-white text-primary shadow-sm" 
                      : "text-muted-foreground hover:text-foreground hover:bg-white/50"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right: User / Auth */}
          <div className="flex items-center gap-3">
            {/* Search Icon (Mobile/Desktop) */}
            {/* <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary rounded-full">
              <Search className="h-5 w-5" />
            </Button> */}

            {isAuthenticated && user ? (
              <>
                {/* Wallet Balance Display */}
                {user.role === 'user' && walletBalance && (
                  <Link
                    to="/wallet"
                    className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-full hover:from-amber-100 hover:to-orange-100 transition-all"
                  >
                    <Wallet className="h-4 w-4 text-amber-600" />
                    <span className="text-sm font-semibold text-amber-700">
                      {walletBalance.totalBalance.toLocaleString('vi-VN')}đ
                    </span>
                  </Link>
                )}

                <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full border border-border p-0 overflow-hidden hover:ring-2 hover:ring-primary/20 transition-all">
                    <Avatar className="h-full w-full">
                      <AvatarImage src={user.avatar} alt={user.fullName} className="object-cover" />
                      <AvatarFallback className="bg-primary/10 text-primary font-bold">
                        {getInitials(user.fullName)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64 p-2 rounded-2xl shadow-xl border-border/50" align="end" forceMount>
                  <div className="px-2 py-3 flex items-center gap-3 bg-secondary/30 rounded-xl mb-2">
                    <Avatar className="h-10 w-10 border border-white shadow-sm">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback className="bg-primary text-white">
                        {getInitials(user.fullName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col space-y-0.5 overflow-hidden">
                      <p className="text-sm font-semibold truncate">{user.fullName}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                  </div>
                  
                  {user.role === 'admin' && (
                    <DropdownMenuItem asChild className="rounded-lg cursor-pointer focus:bg-primary/10 focus:text-primary">
                      <Link to="/admin">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Quản trị hệ thống</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  
                  <DropdownMenuItem asChild className="rounded-lg cursor-pointer focus:bg-primary/10 focus:text-primary">
                    <Link to="/profile">
                      <User className="mr-2 h-4 w-4" />
                      <span>Thông tin cá nhân</span>
                    </Link>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem asChild className="rounded-lg cursor-pointer focus:bg-primary/10 focus:text-primary">
                    <Link to="/my-bookings">
                      <Calendar className="mr-2 h-4 w-4" />
                      <span>Đơn đặt phòng của tôi</span>
                    </Link>
                  </DropdownMenuItem>

                  {user.role === 'user' && (
                    <DropdownMenuItem asChild className="rounded-lg cursor-pointer focus:bg-amber-50 focus:text-amber-700">
                      <Link to="/wallet">
                        <Wallet className="mr-2 h-4 w-4" />
                        <div className="flex flex-col">
                          <span>Ví của tôi</span>
                          {walletBalance && (
                            <span className="text-xs text-amber-600 font-semibold">
                              {walletBalance.totalBalance.toLocaleString('vi-VN')}đ
                            </span>
                          )}
                        </div>
                      </Link>
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuSeparator className="my-2" />
                  
                  <DropdownMenuItem onClick={handleLogout} className="rounded-lg cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-700">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Đăng xuất</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" className="hidden sm:inline-flex rounded-full text-muted-foreground hover:text-primary hover:bg-primary/5" asChild>
                  <Link to="/auth/login">Đăng nhập</Link>
                </Button>
                <Button className="rounded-full px-6 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all" asChild>
                  <Link to="/auth/register">Đăng ký ngay</Link>
                </Button>
              </div>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden rounded-full"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t mt-2 animate-slide-up">
            <nav className="flex flex-col gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                    location.pathname === item.href
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              
              {!isAuthenticated && (
                <div className="grid grid-cols-2 gap-3 pt-4 mt-2 border-t">
                  <Button variant="outline" asChild className="w-full rounded-full border-primary/20 text-primary hover:bg-primary/5">
                    <Link to="/auth/login" onClick={() => setMobileMenuOpen(false)}>
                      Đăng nhập
                    </Link>
                  </Button>
                  <Button asChild className="w-full rounded-full shadow-lg shadow-primary/20">
                    <Link to="/auth/register" onClick={() => setMobileMenuOpen(false)}>
                      Đăng ký
                    </Link>
                  </Button>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}