import { Truck, LogOut, User, Mail, Shield, Info } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import type { PageId } from '@/components/Layout';

export default function Profile({ onNavigate }: { onNavigate: (page: PageId) => void }) {
  const { user, signOut } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Perfil</h2>
        <p className="text-gray-500 text-sm mt-1">Suas informações de conta</p>
      </div>

      <div className="card p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center justify-center w-16 h-16 bg-navy-600 rounded-2xl">
            <User className="w-8 h-8 text-white" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 text-lg truncate">{user?.email}</p>
            <p className="text-sm text-gray-500">Conta ativa</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Mail className="w-5 h-5 text-gray-400 shrink-0" />
            <div>
              <p className="text-xs text-gray-400">E-mail</p>
              <p className="text-sm font-medium text-gray-700 truncate">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Shield className="w-5 h-5 text-gray-400 shrink-0" />
            <div>
              <p className="text-xs text-gray-400">Dados</p>
              <p className="text-sm font-medium text-gray-700">Cada usuário acessa apenas seus próprios registros</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-5">
        <h3 className="font-semibold text-gray-900 mb-3">Acesso rápido</h3>
        <div className="space-y-2">
          <button
            onClick={() => onNavigate('vehicles')}
            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left border border-gray-100"
          >
            <div className="flex items-center justify-center w-9 h-9 bg-navy-50 rounded-lg">
              <Truck className="w-5 h-5 text-navy-600" />
            </div>
            <span className="font-medium text-gray-700">Gerenciar veículos</span>
          </button>
        </div>
      </div>

      <div className="flex items-start gap-2 text-xs text-gray-500 bg-blue-50 border border-blue-200 rounded-lg p-3">
        <Info className="w-4 h-4 mt-0.5 shrink-0 text-blue-600" />
        <span>ROTA Certa — Controle sua viagem. Conheça seu resultado. Os valores apresentados consideram apenas as despesas registradas e não substituem a contabilidade formal.</span>
      </div>

      <button
        onClick={signOut}
        className="w-full flex items-center justify-center gap-2 text-red-600 font-medium px-4 py-3 rounded-lg border border-red-200 hover:bg-red-50 transition-colors"
      >
        <LogOut className="w-5 h-5" />
        Sair da conta
      </button>
    </div>
  );
}
