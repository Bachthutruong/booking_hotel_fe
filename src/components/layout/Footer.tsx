import { Link } from 'react-router-dom';
import { Building2, Mail, Phone, MapPin, Facebook, Youtube, Instagram, Twitter } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export function Footer() {
  return (
    <footer className="bg-gradient-to-br from-white via-orange-50/30 to-rose-50/20 backdrop-blur-md border-t border-orange-100/40 pt-16 pb-8 relative overflow-hidden">
      {/* Subtle animated background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute bottom-[20%] right-[10%] w-[300px] h-[300px] rounded-full bg-gradient-to-r from-orange-100/20 to-amber-100/15 blur-[80px] animate-float-slow" />
        <div className="absolute top-[30%] left-[10%] w-[250px] h-[250px] rounded-full bg-gradient-to-r from-rose-100/15 to-pink-100/10 blur-[70px] animate-float-medium" />
      </div>
      
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand & Description */}
          <div className="space-y-6">
            <Link to="/" className="flex items-center gap-2">
              <div className="bg-gradient-to-br from-primary/20 to-orange-200/30 p-2 rounded-xl">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <span className="text-xl font-bold tracking-tight text-foreground">
                Jiudi<span className="text-primary">Booking</span>
              </span>
            </Link>
            <p className="text-muted-foreground leading-relaxed text-sm">
              Trải nghiệm đặt phòng khách sạn đẳng cấp với Jiudi. 
              Chúng tôi cam kết mang đến dịch vụ tốt nhất, giá cả minh bạch và hỗ trợ 24/7.
            </p>
            <div className="flex gap-4">
              {[Facebook, Instagram, Twitter, Youtube].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="h-10 w-10 flex items-center justify-center rounded-full bg-white/80 text-muted-foreground hover:bg-primary hover:text-white transition-all duration-300 shadow-sm hover:shadow-lg border border-orange-100/50"
                >
                  <Icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-foreground mb-6">Khám phá</h3>
            <ul className="space-y-4">
              {[
                { label: 'Trang chủ', href: '/' },
                { label: 'Khách sạn nổi bật', href: '/hotels' },
                { label: 'Ưu đãi đặc biệt', href: '/deals' },
                { label: 'Bài viết du lịch', href: '/blog' },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-muted-foreground hover:text-primary hover:pl-2 transition-all duration-200 text-sm block"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Policies */}
          <div>
            <h3 className="font-semibold text-foreground mb-6">Chính sách</h3>
            <ul className="space-y-4">
              {[
                { label: 'Điều khoản sử dụng', href: '/terms' },
                { label: 'Chính sách bảo mật', href: '/privacy' },
                { label: 'Chính sách hoàn tiền', href: '/refund' },
                { label: 'Hỗ trợ khách hàng', href: '/support' },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-muted-foreground hover:text-primary hover:pl-2 transition-all duration-200 text-sm block"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-foreground mb-6">Liên hệ</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span className="text-sm text-muted-foreground leading-relaxed">
                  Tầng 12, Tòa nhà Bitexco, Quận 1, TP. Hồ Chí Minh, Việt Nam
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-primary shrink-0" />
                <a href="tel:+84123456789" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  +84 123 456 789
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-primary shrink-0" />
                <a href="mailto:contact@jiudi.vn" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  contact@jiudi.vn
                </a>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="bg-border/60 mb-8" />

        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground text-center md:text-left">
            © 2024 Jiudi Booking. All rights reserved.
          </p>
          <div className="flex items-center gap-6 grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-500">
             {/* Simple placeholders for card logos */}
             <div className="h-6 w-10 bg-gray-200 rounded animate-pulse" title="Visa"></div>
             <div className="h-6 w-10 bg-gray-200 rounded animate-pulse" title="Mastercard"></div>
             <div className="h-6 w-10 bg-gray-200 rounded animate-pulse" title="Paypal"></div>
          </div>
        </div>
      </div>
    </footer>
  );
}