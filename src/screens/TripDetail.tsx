import { useState, useMemo } from 'react';
import {
  ArrowLeft, MapPin, DollarSign, TrendingUp, Plus, Pencil, Trash2,
  CheckCircle2, Wallet, Calculator, AlertCircle, Fuel, Droplet,
  Gauge, Loader2,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useTripExpenses, useTripRefuelings } from '@/hooks/useData';
import {
  formatCurrency, formatDate, formatDateTime, formatNumber, nowISOLocal, parseDecimal,
} from '@/lib/format';
import { StatusBadge, EmptyState, ConfirmDialog, Modal, Toast } from '@/components/UI';
import {
  EXPENSE_CATEGORIES, CATEGORY_LABELS, type Trip, type Expense, type ExpenseCategory, type Refueling,
} from '@/types/database';

export default function TripDetail({
  trip,
  onBack,
  onTripUpdated,
}: {
  trip: Trip;
  onBack: () => void;
  onTripUpdated: (trip: Trip) => void;
}) {
  const { expenses, loading, reload: reloadExpenses } = useTripExpenses(trip.id);
  const { refuelings, reload: reloadRefuelings } = useTripRefuelings(trip.id);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null);
  const [showRefuelForm, setShowRefuelForm] = useState(false);
  const [editingRefuel, setEditingRefuel] = useState<Refueling | null>(null);
  const [deleteRefuel, setDeleteRefuel] = useState<Refueling | null>(null);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const reloadAll = () => { reloadExpenses(); reloadRefuelings(); };

  // Non-fuel expenses only (fuel comes from refuelings)
  const nonFuelExpenses = useMemo(
    () => expenses.filter((e) => e.category !== 'combustivel'),
    [expenses]
  );

  const totalRefuelAmount = useMemo(
    () => refuelings.reduce((sum, r) => sum + Number(r.total_amount), 0),
    [refuelings]
  );

  const totalLitersRefueled = useMemo(
    () => refuelings.reduce((sum, r) => sum + Number(r.liters), 0),
    [refuelings]
  );

  const totalNonFuelExpenses = useMemo(
    () => nonFuelExpenses.reduce((sum, e) => sum + Number(e.amount), 0),
    [nonFuelExpenses]
  );

  const totalExpenses = totalRefuelAmount + totalNonFuelExpenses;
  const result = Number(trip.freight_value) - totalExpenses;
  const distancia = trip.distance_km ? Number(trip.distance_km) : null;
  const distanciaReal = trip.distancia_real ? Number(trip.distancia_real) : null;
  const consumoMedio = trip.vehicle?.consumo_medio ? Number(trip.vehicle.consumo_medio) : null;

  const litrosEstimados = consumoMedio && distancia && consumoMedio > 0 ? distancia / consumoMedio : null;

  const combustivelInicial = trip.combustivel_inicial !== null ? Number(trip.combustivel_inicial) : null;
  const combustivelFinal = trip.combustivel_final !== null ? Number(trip.combustivel_final) : null;
  const combustivelDisponivel = combustivelInicial !== null ? combustivelInicial + totalLitersRefueled : null;
  const combustivelConsumido = (combustivelDisponivel !== null && combustivelFinal !== null)
    ? combustivelDisponivel - combustivelFinal : null;
  const consumoReal = (distanciaReal && combustivelConsumido && combustivelConsumido > 0)
    ? distanciaReal / combustivelConsumido : null;

  const expensesByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    nonFuelExpenses.forEach((e) => {
      map[e.category] = (map[e.category] || 0) + Number(e.amount);
    });
    if (totalRefuelAmount > 0) {
      map['combustivel'] = totalRefuelAmount;
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [nonFuelExpenses, totalRefuelAmount]);

  const costPerKm = distanciaReal && distanciaReal > 0 ? totalExpenses / distanciaReal
    : distancia && distancia > 0 ? totalExpenses / distancia : null;

  const isInProgress = trip.status === 'in_progress';
  const isFinished = trip.status === 'finished';

  const handleDeleteExpense = async () => {
    if (!deleteTarget) return;
    const { error } = await supabase.from('expenses').delete().eq('id', deleteTarget.id);
    setDeleteTarget(null);
    if (error) {
      setToast({ message: 'Erro ao excluir despesa.', type: 'error' });
    } else {
      reloadAll();
      setToast({ message: 'Despesa excluída.', type: 'success' });
    }
  };

  const handleDeleteRefuel = async () => {
    if (!deleteRefuel) return;
    // Delete the associated expense first, then the refueling
    if (deleteRefuel.expense_id) {
      await supabase.from('expenses').delete().eq('id', deleteRefuel.expense_id);
    }
    const { error } = await supabase.from('refuelings').delete().eq('id', deleteRefuel.id);
    setDeleteRefuel(null);
    if (error) {
      setToast({ message: 'Erro ao excluir abastecimento.', type: 'error' });
    } else {
      reloadAll();
      setToast({ message: 'Abastecimento excluído.', type: 'success' });
    }
  };

  const handleExpenseSaved = () => {
    setShowExpenseForm(false);
    setEditingExpense(null);
    reloadAll();
    setToast({ message: 'Despesa salva!', type: 'success' });
  };

  const handleRefuelSaved = () => {
    setShowRefuelForm(false);
    setEditingRefuel(null);
    reloadAll();
    setToast({ message: 'Abastecimento salvo!', type: 'success' });
  };

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Voltar
      </button>

      {/* Trip header */}
      <div className="card p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-gray-900">{trip.title}</h2>
            <p className="text-gray-500 text-sm mt-1 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 shrink-0" />
              {trip.origin} → {trip.destination}
            </p>
          </div>
          <StatusBadge status={trip.status} />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          <div>
            <p className="text-gray-400 text-xs">Saída</p>
            <p className="font-medium text-gray-700">{formatDate(trip.departure_date)}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs">Chegada</p>
            <p className="font-medium text-gray-700">{formatDate(trip.arrival_date)}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs">Distância estimada</p>
            <p className="font-medium text-gray-700">{distancia ? `${formatNumber(distancia, 0)} km` : '—'}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs">Veículo</p>
            <p className="font-medium text-gray-700 truncate">{trip.vehicle?.name || '—'}</p>
          </div>
        </div>

        {trip.notes && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">{trip.notes}</div>
        )}
      </div>

      {/* Fuel estimate section */}
      {litrosEstimados !== null && (
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Fuel className="w-5 h-5 text-blue-600" />
            Estimativa de combustível
          </h3>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-2 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-400">Distância</p>
              <p className="font-semibold text-gray-900 text-sm">{formatNumber(distancia!, 0)} km</p>
            </div>
            <div className="p-2 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-400">Consumo médio</p>
              <p className="font-semibold text-gray-900 text-sm">{formatNumber(consumoMedio!, 1)} km/L</p>
            </div>
            <div className="p-2 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-500">Litros estimados</p>
              <p className="font-semibold text-blue-700 text-sm">{formatNumber(litrosEstimados, 1)} L</p>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2">Estimativa baseada no consumo médio do veículo. Não é uma despesa real.</p>
        </div>
      )}

      {/* Fuel control section (in progress or finished) */}
      {isInProgress && combustivelInicial !== null && (
        <div className="card p-5 border-blue-200">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Droplet className="w-5 h-5 text-blue-600" />
            Controle de combustível
          </h3>
          <div className="grid grid-cols-3 gap-3 text-center mb-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-400">Inicial</p>
              <p className="font-bold text-gray-900">{formatNumber(combustivelInicial, 1)} L</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-400">Abastecido</p>
              <p className="font-bold text-gray-900">{formatNumber(totalLitersRefueled, 1)} L</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-500">Disponível</p>
              <p className="font-bold text-blue-700">{formatNumber(combustivelDisponivel!, 1)} L</p>
            </div>
          </div>
          {!isFinished && (
            <button
              onClick={() => { setEditingRefuel(null); setShowRefuelForm(true); }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <Plus className="w-4 h-4" />
              Registrar abastecimento
            </button>
          )}
        </div>
      )}

      {/* Refuelings list */}
      {refuelings.length > 0 && (
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Fuel className="w-5 h-5 text-blue-600" />
            Abastecimentos ({refuelings.length})
          </h3>
          <div className="space-y-2">
            {refuelings.map((r) => (
              <div key={r.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-gray-900">{formatNumber(Number(r.liters), 1)} L</span>
                    <span className="text-xs text-gray-400">× {formatCurrency(Number(r.price_per_liter))}/L</span>
                    <span className="text-xs text-gray-400">{formatDateTime(r.refuel_date)}</span>
                  </div>
                  {r.description && <p className="text-sm text-gray-500 mt-0.5 truncate">{r.description}</p>}
                </div>
                <span className="font-semibold text-gray-900 text-sm shrink-0">{formatCurrency(Number(r.total_amount))}</span>
                {!isFinished && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => { setEditingRefuel(r); setShowRefuelForm(true); }}
                      className="p-1.5 text-gray-400 hover:text-navy-600 hover:bg-navy-50 rounded transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteRefuel(r)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
            <span className="text-sm font-medium text-gray-700">Total gasto com combustível</span>
            <span className="font-bold text-gray-900">{formatCurrency(totalRefuelAmount)}</span>
          </div>
        </div>
      )}

      {/* Financial summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="card p-4">
          <div className="flex items-center gap-2 text-blue-600 mb-2">
            <DollarSign className="w-5 h-5" />
            <span className="text-sm font-medium">Receita do frete</span>
          </div>
          <p className="text-xl font-bold text-gray-900">{formatCurrency(Number(trip.freight_value))}</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 text-red-600 mb-2">
            <TrendingUp className="w-5 h-5 rotate-180" />
            <span className="text-sm font-medium">Despesas totais</span>
          </div>
          <p className="text-xl font-bold text-gray-900">{formatCurrency(totalExpenses)}</p>
          <p className="text-xs text-gray-400 mt-0.5">{nonFuelExpenses.length + refuelings.length} item(s)</p>
        </div>
        <div className={`card p-4 ${result >= 0 ? 'border-green-200' : 'border-red-200'}`}>
          <div className={`flex items-center gap-2 mb-2 ${result >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            <Wallet className="w-5 h-5" />
            <span className="text-sm font-medium">Resultado</span>
          </div>
          <p className={`text-xl font-bold ${result >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(result)}</p>
        </div>
      </div>

      {/* Cost per km */}
      {costPerKm !== null && (
        <div className="card p-4 flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 bg-navy-50 rounded-lg">
            <Calculator className="w-5 h-5 text-navy-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">Custo por quilômetro</p>
            <p className="text-lg font-bold text-navy-700">{formatCurrency(costPerKm)}/km</p>
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <div className="flex items-start gap-2 text-xs text-gray-500 bg-amber-50 border border-amber-200 rounded-lg p-3">
        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-amber-600" />
        <span>O resultado considera apenas as despesas registradas no app e não representa necessariamente o lucro líquido contábil.</span>
      </div>

      {/* Fuel summary (finished trips) */}
      {isFinished && combustivelConsumido !== null && (
        <div className="card p-5 border-blue-200">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Fuel className="w-5 h-5 text-blue-600" />
            Combustível
          </h3>
          <div className="space-y-2">
            <FuelRow label="Combustível inicial" value={`${formatNumber(combustivelInicial!, 1)} L`} />
            <FuelRow label="Total abastecido" value={`${formatNumber(totalLitersRefueled, 1)} L`} />
            <FuelRow label="Combustível final" value={`${formatNumber(combustivelFinal!, 1)} L`} />
            <FuelRow label="Combustível consumido" value={`${formatNumber(combustivelConsumido, 1)} L`} highlight="blue" />
            {litrosEstimados !== null && (
              <FuelRow label="Consumo estimado" value={`${formatNumber(litrosEstimados, 1)} L`} />
            )}
            {consumoReal !== null && (
              <FuelRow label="Consumo real" value={`${formatNumber(consumoReal, 2)} km/L`} highlight="green" />
            )}
            <FuelRow label="Gasto com combustível" value={formatCurrency(totalRefuelAmount)} highlight="green" />
          </div>

          {/* Comparison */}
          {litrosEstimados !== null && consumoReal !== null && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-700 mb-2">Comparação estimado × real</p>
              <div className="grid grid-cols-2 gap-3 text-center">
                <div>
                  <p className="text-xs text-gray-400">Estimado</p>
                  <p className="font-semibold text-gray-900">{formatNumber(litrosEstimados, 1)} L</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Consumido</p>
                  <p className="font-semibold text-blue-700">{formatNumber(combustivelConsumido, 1)} L</p>
                </div>
              </div>
              {consumoMedio && consumoReal && (
                <div className="grid grid-cols-2 gap-3 text-center mt-2 pt-2 border-t border-gray-200">
                  <div>
                    <p className="text-xs text-gray-400">Consumo médio cadastrado</p>
                    <p className="font-semibold text-gray-900">{formatNumber(consumoMedio, 2)} km/L</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Consumo real</p>
                    <p className={`font-semibold ${consumoReal >= consumoMedio ? 'text-green-600' : 'text-amber-600'}`}>
                      {formatNumber(consumoReal, 2)} km/L
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Expenses by category */}
      {expensesByCategory.length > 0 && (
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Despesas por categoria</h3>
          <div className="space-y-2">
            {expensesByCategory.map(([cat, amount]) => (
              <div key={cat} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-700">{CATEGORY_LABELS[cat as ExpenseCategory]}</span>
                <span className="text-sm font-semibold text-gray-900">{formatCurrency(amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Non-fuel expenses list */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Outras despesas</h3>
          {!isFinished && (
            <button
              onClick={() => { setEditingExpense(null); setShowExpenseForm(true); }}
              className="btn-primary flex items-center gap-2 text-sm py-2"
            >
              <Plus className="w-4 h-4" />
              Adicionar
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-navy-200 border-t-navy-600 rounded-full animate-spin" />
          </div>
        ) : nonFuelExpenses.length === 0 ? (
          <EmptyState
            icon={Wallet}
            title="Nenhuma despesa"
            description="Adicione pedágio, alimentação, hospedagem e outras despesas da viagem."
          />
        ) : (
          <div className="space-y-2">
            {nonFuelExpenses.map((exp) => (
              <div key={exp.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-navy-600 bg-navy-50 px-2 py-0.5 rounded">
                      {CATEGORY_LABELS[exp.category]}
                    </span>
                    <span className="text-xs text-gray-400">{formatDateTime(exp.expense_date)}</span>
                  </div>
                  {exp.description && <p className="text-sm text-gray-600 mt-1 truncate">{exp.description}</p>}
                </div>
                <span className="font-semibold text-gray-900 text-sm shrink-0">{formatCurrency(Number(exp.amount))}</span>
                {!isFinished && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => { setEditingExpense(exp); setShowExpenseForm(true); }}
                      className="p-1.5 text-gray-400 hover:text-navy-600 hover:bg-navy-50 rounded transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(exp)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Finish button */}
      {!isFinished && (
        <button
          onClick={() => setShowFinishModal(true)}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <CheckCircle2 className="w-5 h-5" />
          Finalizar viagem
        </button>
      )}

      {/* Expense form modal */}
      <Modal
        open={showExpenseForm}
        title={editingExpense ? 'Editar despesa' : 'Nova despesa'}
        onClose={() => { setShowExpenseForm(false); setEditingExpense(null); }}
      >
        <ExpenseForm
          tripId={trip.id}
          expense={editingExpense}
          onSaved={handleExpenseSaved}
          onCancel={() => { setShowExpenseForm(false); setEditingExpense(null); }}
        />
      </Modal>

      {/* Refueling form modal */}
      <Modal
        open={showRefuelForm}
        title={editingRefuel ? 'Editar abastecimento' : 'Novo abastecimento'}
        onClose={() => { setShowRefuelForm(false); setEditingRefuel(null); }}
      >
        <RefuelForm
          tripId={trip.id}
          refueling={editingRefuel}
          onSaved={handleRefuelSaved}
          onCancel={() => { setShowRefuelForm(false); setEditingRefuel(null); }}
        />
      </Modal>

      {/* Finish modal */}
      {showFinishModal && (
        <FinishTripModal
          trip={trip}
          totalRefueled={totalLitersRefueled}
          combustivelInicial={combustivelInicial}
          onCancel={() => setShowFinishModal(false)}
          onConfirm={async (finalFuel, distanciaRealValue) => {
            const combustivelDisp = (combustivelInicial ?? 0) + totalLitersRefueled;
            if (finalFuel > combustivelDisp) {
              return { error: 'Combustível final maior que o disponível. Revise os dados.' };
            }

            const updateData: Record<string, unknown> = {
              status: 'finished',
              arrival_date: trip.arrival_date || new Date().toISOString().split('T')[0],
              combustivel_final: finalFuel,
            };
            if (distanciaRealValue !== null) {
              updateData.distancia_real = distanciaRealValue;
            }

            const { data, error } = await supabase
              .from('trips')
              .update(updateData)
              .eq('id', trip.id)
              .select('*, vehicle:vehicles(*)')
              .single();

            if (error || !data) {
              return { error: 'Erro ao finalizar viagem.' };
            }

            setShowFinishModal(false);
            onTripUpdated(data as Trip);
            reloadAll();
            return { error: null };
          }}
        />
      )}

      {/* Delete confirmations */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Excluir despesa"
        message="Tem certeza que deseja excluir esta despesa? Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        onConfirm={handleDeleteExpense}
        onCancel={() => setDeleteTarget(null)}
      />

      <ConfirmDialog
        open={!!deleteRefuel}
        title="Excluir abastecimento"
        message="Tem certeza? A despesa de combustível associada também será removida."
        confirmLabel="Excluir"
        onConfirm={handleDeleteRefuel}
        onCancel={() => setDeleteRefuel(null)}
      />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

function FuelRow({ label, value, highlight }: { label: string; value: string; highlight?: 'blue' | 'green' }) {
  const colors = highlight === 'blue' ? 'text-blue-700 font-bold' : highlight === 'green' ? 'text-green-700 font-bold' : 'text-gray-900 font-medium';
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-600">{label}</span>
      <span className={`text-sm ${colors}`}>{value}</span>
    </div>
  );
}

function ExpenseForm({
  tripId,
  expense,
  onSaved,
  onCancel,
}: {
  tripId: string;
  expense: Expense | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [category, setCategory] = useState<ExpenseCategory>(expense?.category && expense.category !== 'combustivel' ? expense.category : 'pedagio');
  const [amount, setAmount] = useState(expense ? String(expense.amount) : '');
  const [expenseDate, setExpenseDate] = useState(expense ? expense.expense_date.slice(0, 16) : nowISOLocal());
  const [description, setDescription] = useState(expense?.description || '');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const amt = parseDecimal(amount);
    if (amt === null || amt < 0) {
      setError('Valor inválido.');
      return;
    }

    setLoading(true);
    const payload = {
      trip_id: tripId,
      category,
      amount: amt,
      expense_date: new Date(expenseDate).toISOString(),
      description: description.trim() || null,
    };

    let result;
    if (expense) {
      result = await supabase.from('expenses').update(payload).eq('id', expense.id).select().single();
    } else {
      result = await supabase.from('expenses').insert(payload).select().single();
    }
    setLoading(false);

    if (result.error || !result.data) {
      setError('Erro ao salvar despesa.');
      return;
    }
    onSaved();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label-text" htmlFor="cat">Categoria</label>
        <select id="cat" value={category} onChange={(e) => setCategory(e.target.value as ExpenseCategory)} className="input-field">
          {EXPENSE_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
        <p className="text-xs text-gray-400 mt-1">Combustível é registrado via abastecimentos.</p>
      </div>
      <div>
        <label className="label-text" htmlFor="amt">Valor (R$) *</label>
        <input id="amt" type="text" inputMode="decimal" required value={amount} onChange={(e) => setAmount(e.target.value)} className="input-field" placeholder="Ex: 150,00" />
      </div>
      <div>
        <label className="label-text" htmlFor="date">Data e hora</label>
        <input id="date" type="datetime-local" required value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} className="input-field" />
      </div>
      <div>
        <label className="label-text" htmlFor="desc">Descrição (opcional)</label>
        <input id="desc" type="text" value={description} onChange={(e) => setDescription(e.target.value)} className="input-field" placeholder="Ex: Pedágio km 120" />
      </div>
      {error && (
        <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      <div className="flex gap-3 justify-end">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancelar</button>
        <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Salvando...' : 'Salvar'}</button>
      </div>
    </form>
  );
}

function RefuelForm({
  tripId,
  refueling,
  onSaved,
  onCancel,
}: {
  tripId: string;
  refueling: Refueling | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [liters, setLiters] = useState(refueling ? String(refueling.liters) : '');
  const [pricePerLiter, setPricePerLiter] = useState(refueling ? String(refueling.price_per_liter) : '');
  const [totalAmount, setTotalAmount] = useState(refueling ? String(refueling.total_amount) : '');
  const [refuelDate, setRefuelDate] = useState(refueling ? refueling.refuel_date.slice(0, 16) : nowISOLocal());
  const [description, setDescription] = useState(refueling?.description || '');
  const [autoCalc, setAutoCalc] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Auto-calculate total from liters × price
  const lit = parseDecimal(liters);
  const price = parseDecimal(pricePerLiter);
  const calculatedTotal = lit !== null && price !== null ? lit * price : null;

  const effectiveTotal = autoCalc ? calculatedTotal : parseDecimal(totalAmount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (lit === null || lit <= 0) {
      setError('Litros deve ser maior que zero.');
      return;
    }
    if (price === null || price < 0) {
      setError('Preço por litro inválido.');
      return;
    }
    if (effectiveTotal === null || effectiveTotal < 0) {
      setError('Valor total inválido.');
      return;
    }

    setLoading(true);

    const refuelPayload = {
      trip_id: tripId,
      liters: lit,
      price_per_liter: price,
      total_amount: effectiveTotal,
      refuel_date: new Date(refuelDate).toISOString(),
      description: description.trim() || null,
    };

    try {
      if (refueling) {
        // Update refueling
        const { error: rErr } = await supabase.from('refuelings').update(refuelPayload).eq('id', refueling.id);
        if (rErr) throw rErr;

        // Update associated expense
        if (refueling.expense_id) {
          await supabase.from('expenses').update({
            amount: effectiveTotal,
            expense_date: new Date(refuelDate).toISOString(),
            description: description.trim() || `Abastecimento: ${formatNumber(lit, 1)}L × ${formatCurrency(price)}/L`,
          }).eq('id', refueling.expense_id);
        }
      } else {
        // Create expense first
        const { data: expData, error: expErr } = await supabase.from('expenses').insert({
          trip_id: tripId,
          category: 'combustivel' as ExpenseCategory,
          amount: effectiveTotal,
          expense_date: new Date(refuelDate).toISOString(),
          description: description.trim() || `Abastecimento: ${formatNumber(lit, 1)}L × ${formatCurrency(price)}/L`,
        }).select().single();

        if (expErr || !expData) throw expErr || new Error('Erro ao criar despesa');

        // Create refueling with expense_id
        const { error: rErr } = await supabase.from('refuelings').insert({
          ...refuelPayload,
          expense_id: expData.id,
        });
        if (rErr) throw rErr;
      }

      setLoading(false);
      onSaved();
    } catch {
      setLoading(false);
      setError('Erro ao salvar abastecimento.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label-text" htmlFor="liters">Litros *</label>
          <input id="liters" type="text" inputMode="decimal" required value={liters} onChange={(e) => setLiters(e.target.value)} className="input-field" placeholder="Ex: 200" />
        </div>
        <div>
          <label className="label-text" htmlFor="price">Preço por litro (R$) *</label>
          <input id="price" type="text" inputMode="decimal" required value={pricePerLiter} onChange={(e) => setPricePerLiter(e.target.value)} className="input-field" placeholder="Ex: 6,00" />
        </div>
      </div>

      {/* Auto-calc toggle */}
      <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
        <input
          id="autoCalc"
          type="checkbox"
          checked={autoCalc}
          onChange={(e) => setAutoCalc(e.target.checked)}
          className="w-4 h-4 rounded border-gray-300 text-navy-600 focus:ring-navy-500"
        />
        <label htmlFor="autoCalc" className="text-sm font-medium text-gray-700">
          Calcular valor total automaticamente (Litros × Preço/L)
        </label>
      </div>

      {autoCalc && calculatedTotal !== null && (
        <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-700 flex items-center gap-2">
          <Calculator className="w-4 h-4" />
          <span>{formatNumber(lit!, 1)} L × {formatCurrency(price!)} = <strong>{formatCurrency(calculatedTotal)}</strong></span>
        </div>
      )}

      {!autoCalc && (
        <div>
          <label className="label-text" htmlFor="total">Valor total (R$) *</label>
          <input id="total" type="text" inputMode="decimal" required value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)} className="input-field" placeholder="Ex: 1200,00" />
        </div>
      )}

      <div>
        <label className="label-text" htmlFor="rdate">Data e hora</label>
        <input id="rdate" type="datetime-local" required value={refuelDate} onChange={(e) => setRefuelDate(e.target.value)} className="input-field" />
      </div>

      <div>
        <label className="label-text" htmlFor="rdesc">Descrição (opcional)</label>
        <input id="rdesc" type="text" value={description} onChange={(e) => setDescription(e.target.value)} className="input-field" placeholder="Ex: Posto BR - km 250" />
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

function FinishTripModal({
  trip,
  totalRefueled,
  combustivelInicial,
  onCancel,
  onConfirm,
}: {
  trip: Trip;
  totalRefueled: number;
  combustivelInicial: number | null;
  onCancel: () => void;
  onConfirm: (finalFuel: number, distanciaReal: number | null) => Promise<{ error: string | null }>;
}) {
  const [finalFuel, setFinalFuel] = useState('');
  const [distanciaReal, setDistanciaReal] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const combustivelDisp = (combustivelInicial ?? 0) + totalRefueled;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const fuel = parseDecimal(finalFuel);
    if (fuel === null || fuel < 0) {
      setError('Combustível final inválido. Informe um valor maior ou igual a zero.');
      return;
    }

    if (fuel > combustivelDisp) {
      setError(
        `Combustível final (${formatNumber(fuel, 1)} L) é maior que o disponível (${formatNumber(combustivelDisp, 1)} L). Revise os dados.`
      );
      return;
    }

    const distReal = distanciaReal ? parseDecimal(distanciaReal) : null;
    if (distReal !== null && distReal < 0) {
      setError('Distância real inválida.');
      return;
    }

    setLoading(true);
    const { error: confirmError } = await onConfirm(fuel, distReal);
    setLoading(false);

    if (confirmError) {
      setError(confirmError);
    }
  };

  return (
    <Modal open={true} title="Finalizar viagem" onClose={onCancel}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3 bg-gray-50 rounded-lg text-sm">
          <p className="font-medium text-gray-900">{trip.title}</p>
          <p className="text-gray-500">{trip.origin} → {trip.destination}</p>
        </div>

        {/* Fuel summary */}
        <div className="p-3 bg-blue-50 rounded-lg space-y-1.5 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Combustível inicial</span>
            <span className="font-medium text-gray-900">{formatNumber(combustivelInicial ?? 0, 1)} L</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Total abastecido</span>
            <span className="font-medium text-gray-900">{formatNumber(totalRefueled, 1)} L</span>
          </div>
          <div className="flex items-center justify-between pt-1.5 border-t border-blue-200">
            <span className="text-blue-700 font-medium">Total disponível</span>
            <span className="font-bold text-blue-700">{formatNumber(combustivelDisp, 1)} L</span>
          </div>
        </div>

        <div>
          <label className="label-text" htmlFor="finalFuel">Combustível final no tanque (L) *</label>
          <input
            id="finalFuel"
            type="text"
            inputMode="decimal"
            required
            value={finalFuel}
            onChange={(e) => setFinalFuel(e.target.value)}
            className="input-field"
            placeholder="Ex: 80"
            autoFocus
          />
          <p className="text-xs text-gray-400 mt-1">Quantos litros há no tanque agora?</p>
        </div>

        <div>
          <label className="label-text" htmlFor="distReal">Distância real percorrida (km) (opcional)</label>
          <input
            id="distReal"
            type="text"
            inputMode="decimal"
            value={distanciaReal}
            onChange={(e) => setDistanciaReal(e.target.value)}
            className="input-field"
            placeholder="Ex: 480"
          />
          <p className="text-xs text-gray-400 mt-1">Para calcular o consumo real (km/L)</p>
        </div>

        {error && (
          <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex gap-3 justify-end">
          <button type="button" onClick={onCancel} className="btn-secondary">Cancelar</button>
          <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2 bg-green-600 hover:bg-green-700">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            <CheckCircle2 className="w-4 h-4" />
            Finalizar
          </button>
        </div>
      </form>
    </Modal>
  );
}
