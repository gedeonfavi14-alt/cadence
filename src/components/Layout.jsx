import { Outlet, useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import BottomNav from './BottomNav';
import { useAuth } from '../contexts/AuthContext';

export default function Layout() {
  const { restaurant } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="app-layout">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-primary/95 backdrop-blur-md border-b border-light px-4 py-3 flex items-center justify-between">
        <div className="font-bold text-xl tracking-tight text-primary">CADENCE</div>
        
        <div className="flex items-center gap-3">
          <button 
            className="p-2 -mr-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors relative"
            onClick={() => navigate('/orders')}
          >
            <Bell size={20} className="text-primary" />
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-olive rounded-full border-2 border-primary"></span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="app-content">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
