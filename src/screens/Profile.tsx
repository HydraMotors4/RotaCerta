import { useState, type FormEvent } from 'react';
import { Truck, LogOut, User, Mail, Shield, Info, Building2, Save, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useUserProfile, useTransportadoras } from '@/hooks/useData';
import type { PageId } from '@/components/Layout';

export default function Profile({ onNavigate }: { onNavigate: (page: PageId) => void }) {
  const { user, signOut } = useAuth();
  const { profile, loading, reload } = useUserProfile();
  const { transportadoras } = useTransportadoras();

  const [nomeMotorista, setNomeMotorista] = useState('');
  const [apelido, setApelido] = useState('');
  const [transportadoraId, setTransportadoraId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  // Initialize form fields when profile loads or editing starts
  const startEditing = () => {
    setNomeMotorista(profile?.nome_motorista || '');
    setApelido(profile?.apelido || '');
    setTransportadoraId(profile?.transportadora_id || '');
    setError(null);
    setSuccess(false);
    setEditing(true);
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const payload = {
      nome_motorista: nomeMotorista.trim() || null,
      apelido: apelido.trim() || null,
      transportadora_id: transportadoraId || null,
      updated_at: new Date().toISOString(),
    };

    if (profile) {
      const { error: dbError } = await supabase
        .from('user_profiles')
        .update(payload)
        .eq('id', profile.id);
      setSaving(false);
      if (dbError) {
        setError('Erro ao salvar perfil.');
        return;
      }
    } else {
      const { error: dbError } = await supabase
        .from('user_profiles')
        .insert({ ...payload, user_id: user?.id });
      setSaving(false);
      if (dbError) {
        setError('Erro ao salvar perfil.');
        return;
      }
    }

    setEditing(false);
    setSuccess(true);
    reload();
    setTimeout(() => setSuccess(false), 3000);
  };

  const linkedTransportadora = transportadoras.find((t) => t.id === profile?.transportadora_id);
  const displayName = profile?.nome_motorista || user?.email;
  const displayApelido = profile?.apelido;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Perfil</h2>
        <p className="text-gray-500 text-sm mt-1">Suas informações de conta</p>
      </div>

      {/* Profile card */}
      <div className="card p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center justify-center w-16 h-16 bg-navy-600 rounded-2xl">
            <User className="w-8 h-8 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-gray-900 text-lg truncate">
              {loading ? 'Carregando...' : displayName}
            </p>
            {displayApelido && (
              <p className="text-sm text-navy-600 font-medium">{displayApelido}</p>
            )}
            <p className="text-sm text-gray-500 truncate">{user?.email}</p>
          </div>
          {!editing && (
            <button
              onClick={startEditing}
              className="btn-secondary text-sm shrink-0"
            >
              Editar
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-6 h-6 text-navy-400 animate-spin" />
          </div>
        ) : editing ? (
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="label-text" htmlFor="nome">Nome do motorista</label>
              <input
                id="nome"
                type="text"
                value={nomeMotorista}
                onChange={(e) => setNomeMotorista(e.target.value)}
                className="input-field"
                placeholder="Ex: João Silva"
              />
            </div>

            <div>
              <label className="label-text" htmlFor="apelido">Apelido</label>
              <input
                id="apelido"
                type="text"
                value={apelido}
                onChange={(e) => setApelido(e.target.value)}
                className="input-field"
                placeholder="Ex: Zé da Estrada"
              />
            </div>

            <div>
              <label className="label-text" htmlFor="transportadora">Vincular-se a uma transportadora</label>
              <select
                id="transportadora"
                value={transportadoraId}
                onChange={(e) => setTransportadoraId(e.target.value)}
                className="input-field"
              >
                <option value="">Nenhuma (motorista autônomo)</option>
                {transportadoras.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-1">
                O vínculo é opcional. Motoristas autônomos podem usar o sistema normalmente.
              </p>
            </div>

            {error && (
              <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => { setEditing(false); setError(null); }}
                className="btn-secondary"
              >
                Cancelar
              </button>
              <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Salvar
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-3">
            <InfoRow icon={User} label="Nome do motorista" value={profile?.nome_motorista || 'Não informado'} />
            <InfoRow icon={User} label="Apelido" value={profile?.apelido || 'Não informado'} />
            <InfoRow icon={Mail} label="E-mail" value={user?.email || ''} />
            <InfoRow
              icon={Building2}
              label="Transportadora"
              value={linkedTransportadora?.name || 'Autônomo (sem vínculo)'}
            />
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Shield className="w-5 h-5 text-gray-400 shrink-0" />
              <div>
                <p className="text-xs text-gray-400">Dados</p>
                <p className="text-sm font-medium text-gray-700">Cada usuário acessa apenas seus próprios registros</p>
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg p-3 mt-4">
            <CheckCircle2 className="w-4 h-4" />
            <span>Perfil atualizado com sucesso!</span>
          </div>
        )}
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

function InfoRow({ icon: Icon, label, value }: { icon: typeof User; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
      <Icon className="w-5 h-5 text-gray-400 shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-sm font-medium text-gray-700 truncate">{value}</p>
      </div>
    </div>
  );
}
