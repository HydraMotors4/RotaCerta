import { type ReactNode } from 'react';
import { Home, Route, PlusCircle, History, User, Truck, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export type PageId = 'dashboard' | 'trips' | 'new-expense' | 'history' | 'profile' | 'vehicles';

interface NavItem {
  id: PageId;
  label: string;
  icon: typeof Home;
}

const MOBILE_NAV: NavItem[] = [
  { id: 'dashboard', label: 'Início', icon: Home },
  { id: 'trips', label: 'Viagens', icon: Route },
  { id: 'new-expense', label: 'Despesa', icon: PlusCircle },
  { id: 'history', label: 'Histórico', icon: History },
  { id: 'vehicles', label: 'Veículos', icon: Truck },
  { id: 'profile', label: 'Perfil', icon: User },
];

const DESKTOP_NAV: NavItem[] = [
  { id: 'dashboard', label: 'Início', icon: Home },
  { id: 'trips', label: 'Viagens', icon: Route },
  { id: 'new-expense', label: 'Despesa', icon: PlusCircle },
  { id: 'history', label: 'Histórico', icon: History },
  { id: 'vehicles', label: 'Veículos', icon: Truck },
  { id: 'profile', label: 'Perfil', icon: User },
];

interface LayoutProps {
  children: ReactNode;
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
}

export default function Layout({ children, currentPage, onNavigate }: LayoutProps) {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-64 bg-navy-800 flex-col z-30">
        <div className="flex items-center gap-3 px-6 py-5 border-b border-navy-700">
          <div className="flex items-center justify-center w-10 h-10 bg-navy-600 rounded-xl">
            <Truck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg leading-tight">ROTA Certa</h1>
            <p className="text-navy-300 text-xs">Controle financeiro</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {DESKTOP_NAV.map((item) => {
            const Icon = item.icon;
            const active = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-navy-600 text-white'
                    : 'text-navy-200 hover:bg-navy-700 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-navy-700">
          <div className="px-4 py-2 mb-2">
            <p className="text-navy-300 text-xs">Conectado como</p>
            <p className="text-white text-sm font-medium truncate">{user?.email}</p>
          </div>
          <button
            onClick={signOut}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-navy-200 hover:bg-navy-700 hover:text-white transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sair
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="md:pl-64">
        {/* Mobile header */}
        <header className="md:hidden sticky top-0 z-20 bg-navy-800 px-4 py-3 flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 bg-navy-600 rounded-lg">
            <Truck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-base leading-tight">ROTA Certa</h1>
          </div>
        </header>

        <main className="pb-20 md:pb-8 px-4 sm:px-6 lg:px-8 py-4 md:py-8 max-w-5xl mx-auto">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 z-30">
        <div className="flex items-center justify-around">
          {MOBILE_NAV.map((item) => {
            const Icon = item.icon;
            const active = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex flex-col items-center gap-1 px-2 py-2.5 flex-1 transition-colors ${
                  active ? 'text-navy-600' : 'text-gray-400'
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? 'scale-110' : ''} transition-transform`} />
                <span className="text-[10px] font-medium leading-none">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
