import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { AnimatedBackground } from '@/components/ui/AnimatedBackground';

export function MainLayout() {
  return (
    <AnimatedBackground variant="default">
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />
      </div>
    </AnimatedBackground>
  );
}
