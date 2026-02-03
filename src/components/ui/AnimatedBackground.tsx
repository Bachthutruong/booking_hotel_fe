import React from 'react';

interface AnimatedBackgroundProps {
  children?: React.ReactNode;
  variant?: 'default' | 'admin' | 'auth';
  className?: string;
}

export function AnimatedBackground({ 
  children, 
  variant = 'default',
  className = ''
}: AnimatedBackgroundProps) {
  return (
    <div className={`relative min-h-screen overflow-hidden bg-background ${className}`}>
      {/* Defines animations */}
      <style>{`
        @keyframes flow-animation {
          from {
            stroke-dashoffset: 3000;
          }
          to {
            stroke-dashoffset: 0;
          }
        }
        @keyframes flow-animation-reverse {
          from {
            stroke-dashoffset: 0;
          }
          to {
            stroke-dashoffset: 3000;
          }
        }
        .animate-flow-slow {
          animation: flow-animation 30s linear infinite;
        }
        .animate-flow-medium {
          animation: flow-animation 20s linear infinite;
        }
        .animate-flow-fast {
          animation: flow-animation 15s linear infinite;
        }
        .animate-flow-reverse {
          animation: flow-animation-reverse 35s linear infinite;
        }
        
        @keyframes blob-pulse {
          0%, 100% { transform: scale(1) translate(0, 0); opacity: 0.3; }
          50% { transform: scale(1.1) translate(20px, -20px); opacity: 0.4; }
        }
        .animate-blob {
          animation: blob-pulse 10s ease-in-out infinite;
        }
      `}</style>
      
      {/* Background Container */}
      <div className="fixed inset-0 -z-50 bg-[#FDFBF7]">
        
        {/* 1. Base Gradient - Vibrant but soft */}
        <div className={`absolute inset-0 transition-opacity duration-500 ease-in-out ${
          variant === 'admin' 
            ? 'bg-gradient-to-br from-blue-50/40 via-white to-purple-50/30' 
            : 'bg-gradient-to-br from-orange-50/50 via-white to-rose-50/30'
        }`} />

        {/* 2. Soft Glowing Orbs - Ambient Light */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-orange-200/20 rounded-full blur-[120px] mix-blend-multiply animate-blob" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[800px] h-[800px] bg-rose-200/20 rounded-full blur-[120px] mix-blend-multiply animate-blob" style={{ animationDelay: '5s' }} />
            <div className="absolute top-[30%] left-[40%] w-[600px] h-[600px] bg-amber-100/30 rounded-full blur-[100px] mix-blend-multiply animate-blob" style={{ animationDelay: '2s' }} />
        </div>

        {/* 3. ELEGANT FLOWING LINES - The "Running" Effect */}
        <div className="absolute inset-0 opacity-60 overflow-hidden pointer-events-none">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
            <defs>
              <linearGradient id="grad-warm" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#F97316" stopOpacity="0" />
                <stop offset="50%" stopColor="#F97316" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#F97316" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="grad-cool" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#E11D48" stopOpacity="0" />
                <stop offset="50%" stopColor="#E11D48" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#E11D48" stopOpacity="0" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>

            {/* Vệt chạy 1: Đường cong lớn trên cùng */}
            {/* strokeDasharray="1000 2000": Vệt sáng dài 1000px, khoảng trống 2000px */}
            <path 
              d="M-200,100 C400,300 1000,-100 1600,100 S2800,300 3400,100" 
              fill="none" 
              stroke="url(#grad-warm)" 
              strokeWidth="1.5"
              strokeDasharray="1000 2000" 
              strokeLinecap="round"
              className="animate-flow-slow"
              filter="url(#glow)"
            />

             {/* Vệt chạy 2: Đường uốn lượn giữa - Chạy ngược chiều */}
             <path 
              d="M-200,500 C500,300 1100,700 1700,500 S2900,300 3500,500" 
              fill="none" 
              stroke="url(#grad-cool)" 
              strokeWidth="1.5"
              strokeDasharray="800 1500"
              strokeLinecap="round"
              className="animate-flow-reverse"
              opacity="0.7"
            />
            
            {/* Vệt chạy 3: Đường cong dưới đáy */}
            <path 
              d="M-200,900 C600,700 1200,1100 1800,900 S3000,700 3600,900" 
              fill="none" 
              stroke="url(#grad-warm)" 
              strokeWidth="2"
              strokeDasharray="1200 2000"
              strokeLinecap="round"
              className="animate-flow-medium"
            />

            {/* Vệt chạy phụ: Nét mảnh hơn, chạy nhanh hơn */}
            <path 
              d="M-100,200 Q1500,1200 3000,200" 
              fill="none" 
              stroke="#F59E0B" 
              strokeWidth="0.5"
              strokeDasharray="500 1000"
              strokeLinecap="round"
              className="animate-flow-fast"
              opacity="0.5"
            />
          </svg>
        </div>
      </div>
      
      {/* Content */}
      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </div>
  );
}
