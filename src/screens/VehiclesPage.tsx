import { useState, type FormEvent } from 'react';
import { Truck, Plus, Pencil, Trash2, Loader2, AlertCircle, Fuel } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useVehicles } from '@/hooks/useData';
import { EmptyState, ConfirmDialog, Modal, Toast } from '@/components/UI';
import { formatNumber, parseDecimal } from '@/lib/format';
import type { Vehicle } from '@/types/database';

export default function VehiclesPage() {
  const { vehicles, loading, reload } = useVehicles();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Vehicle | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await supabase.from('vehicles').delete().eq('id', deleteTarget.id);
    setDeleteTarget(null);
    if (error) {
      setToast({ message: 'Erro ao excluir veículo.', type: 'error' });
    } else {
      reload();
      setToast({ message: 'Veículo excluído.', type: 'success' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Veículos</h2>
          <p className="text-gray-500 text-sm mt-1">Cadastre e gerencie seus veículos</p>
        </div>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline">Novo veículo</span>
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-3 border-navy-200 border-t-navy-600 rounded-full animate-spin" />
        </div>
      ) : vehicles.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Truck}
            title="Nenhum veículo cadastrado"
            description="Cadastre seus veículos com consumo médio para associá-los às viagens e calcular estimativas de combustível."
            action={
              <button onClick={() => { setEditing(null); setShowForm(true); }} className="btn-primary flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Cadastrar veículo
              </button>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {vehicles.map((v) => (
            <div key={v.id} className="card p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex items-center justify-center w-10 h-10 bg-navy-50 rounded-lg shrink-0">
                    <Truck className="w-5 h-5 text-navy-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate">{v.name}</p>
                    {v.plate && <p className="text-sm text-gray-500">Placa: {v.plate}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => { setEditing(v); setShowForm(true); }}
                    className="p-1.5 text-gray-400 hover:text-navy-600 hover:bg-navy-50 rounded transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(v)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {v.consumo_medio !== null && v.consumo_medio > 0 && (
                <div className="flex items-center gap-2 mt-3 p-2 bg-blue-50 rounded">
                  <Fuel className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-blue-700">
                    Consumo médio: <strong>{formatNumber(Number(v.consumo_medio), 1)} km/L</strong>
                  </span>
                </div>
              )}
              {v.notes && (
                <p className="text-sm text-gray-500 mt-3 p-2 bg-gray-50 rounded">{v.notes}</p>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal
        open={showForm}
        title={editing ? 'Editar veículo' : 'Novo veículo'}
        onClose={() => { setShowForm(false); setEditing(null); }}
      >
        <VehicleForm
          vehicle={editing}
          onSaved={() => { setShowForm(false); setEditing(null); reload(); setToast({ message: 'Veículo salvo!', type: 'success' }); }}
          onCancel={() => { setShowForm(false); setEditing(null); }}
        />
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Excluir veículo"
        message="Tem certeza que deseja excluir este veículo? As viagens associadas não serão removidas."
        confirmLabel="Excluir"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

function VehicleForm({
  vehicle,
  onSaved,
  onCancel,
}: {
  vehicle: Vehicle | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(vehicle?.name || '');
  const [plate, setPlate] = useState(vehicle?.plate || '');
  const [consumoMedio, setConsumoMedio] = useState(
    vehicle?.consumo_medio ? String(vehicle.consumo_medio) : ''
  );
  const [notes, setNotes] = useState(vehicle?.notes || '');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError('Nome é obrigatório.');
      return;
    }

    const consumo = parseDecimal(consumoMedio);
    if (consumo !== null && consumo <= 0) {
      setError('Consumo médio deve ser maior que zero.');
      return;
    }

    setLoading(true);
    const payload = {
      name: name.trim(),
      plate: plate.trim() || null,
      consumo_medio: consumo,
      notes: notes.trim() || null,
    };
    const result = vehicle
      ? await supabase.from('vehicles').update(payload).eq('id', vehicle.id)
      : await supabase.from('vehicles').insert(payload);
    setLoading(false);
    if (result.error) {
      setError('Erro ao salvar veículo.');
      return;
    }
    onSaved();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label-text" htmlFor="vname">Nome / Identificação *</label>
        <input id="vname" type="text" required value={name} onChange={(e) => setName(e.target.value)} className="input-field" placeholder="Ex: Scania R450" />
      </div>
      <div>
        <label className="label-text" htmlFor="vplate">Placa (opcional)</label>
        <input id="vplate" type="text" value={plate} onChange={(e) => setPlate(e.target.value)} className="input-field" placeholder="Ex: ABC1D23" />
      </div>
      <div>
        <label className="label-text" htmlFor="vconsumo">Consumo médio (km/L)</label>
        <input
          id="vconsumo"
          type="text"
          inputMode="decimal"
          value={consumoMedio}
          onChange={(e) => setConsumoMedio(e.target.value)}
          className="input-field"
          placeholder="Ex: 2,5"
        />
        <p className="text-xs text-gray-400 mt-1">Quilômetros por litro. Usado para estimar combustível nas viagens.</p>
      </div>
      <div>
        <label className="label-text" htmlFor="vnotes">Observações (opcional)</label>
        <textarea id="vnotes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} className="input-field resize-none" placeholder="Informações sobre o veículo..." />
      </div>
      {error && (
        <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      <div className="flex gap-3 justify-end">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancelar</button>
        <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          Salvar
        </button>
      </div>
    </form>
  );
}
