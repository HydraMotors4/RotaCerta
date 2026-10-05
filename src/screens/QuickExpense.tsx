import { useState, type FormEvent } from 'react';
import { Loader2, AlertCircle, PlusCircle, CheckCircle2, Fuel } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useTrips, useTripRefuelings } from '@/hooks/useData';
import { nowISOLocal, formatNumber, formatCurrency, parseDecimal } from '@/lib/format';
import { EmptyState, Modal, Toast } from '@/components/UI';
import { EXPENSE_CATEGORIES, type ExpenseCategory, type Trip, type Refueling } from '@/types/database';
import { useMemo } from 'react';

export default function QuickExpense({
  onExpenseAdded,
}: {
  onExpenseAdded: () => void;
}) {
  const { trips, reload: reloadTrips } = useTrips();
  const activeTrips = trips.filter((t) => t.status === 'in_progress');

  const [mode, setMode] = useState<'expense' | 'refuel'>('expense');
  const [tripId, setTripId] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('pedagio');
  const [amount, setAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState(nowISOLocal());
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Refuel fields
  const [liters, setLiters] = useState('');
  const [pricePerLiter, setPricePerLiter] = useState('');
  const [autoCalc, setAutoCalc] = useState(true);

  const { refuelings, reload: reloadRefuelings } = useTripRefuelings(tripId || null);

  const selectedTrip = activeTrips.find((t) => t.id === tripId);
  const combustivelInicial = selectedTrip?.combustivel_inicial !== null && selectedTrip?.combustivel_inicial !== undefined ? Number(selectedTrip.combustivel_inicial) : 0;
  const totalRefueled = useMemo(() => refuelings.reduce((sum, r) => sum + Number(r.liters), 0), [refuelings]);
  const combustivelDisp = combustivelInicial + totalRefueled;

  const lit = parseDecimal(liters);
  const price = parseDecimal(pricePerLiter);
  const calculatedTotal = lit !== null && price !== null ? lit * price : null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!tripId) {
      setError('Selecione uma viagem em andamento.');
      return;
    }

    if (mode === 'refuel') {
      if (lit === null || lit <= 0) {
        setError('Litros deve ser maior que zero.');
        return;
      }
      if (price === null || price < 0) {
        setError('Preço por litro inválido.');
        return;
      }
      const total = calculatedTotal ?? 0;
      if (total < 0) {
        setError('Valor total inválido.');
        return;
      }

      setLoading(true);
      try {
        const { data: expData, error: expErr } = await supabase.from('expenses').insert({
          trip_id: tripId,
          category: 'combustivel' as ExpenseCategory,
          amount: total,
          expense_date: new Date(expenseDate).toISOString(),
          description: description.trim() || `Abastecimento: ${formatNumber(lit, 1)}L × ${formatCurrency(price)}/L`,
        }).select().single();

        if (expErr || !expData) throw expErr || new Error('Erro');

        const { error: rErr } = await supabase.from('refuelings').insert({
          trip_id: tripId,
          liters: lit,
          price_per_liter: price,
          total_amount: total,
          refuel_date: new Date(expenseDate).toISOString(),
          expense_id: expData.id,
          description: description.trim() || null,
        });
        if (rErr) throw rErr;
      } catch {
        setLoading(false);
        setError('Erro ao registrar abastecimento.');
        return;
      }
    } else {
      const amt = parseDecimal(amount);
      if (amt === null || amt < 0) {
        setError('Valor inválido.');
        return;
      }

      setLoading(true);
      const { error: dbError } = await supabase.from('expenses').insert({
        trip_id: tripId,
        category,
        amount: amt,
        expense_date: new Date(expenseDate).toISOString(),
        description: description.trim() || null,
      });
      setLoading(false);

      if (dbError) {
        setError('Erro ao salvar despesa.');
        return;
      }
    }

    setSuccess(true);
    setAmount('');
    setDescription('');
    setLiters('');
    setPricePerLiter('');
    setTimeout(() => setSuccess(false), 2000);
    setLoading(false);
    reloadTrips();
    reloadRefuelings();
    onExpenseAdded();
  };

  if (activeTrips.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Nova despesa</h2>
          <p className="text-gray-500 text-sm mt-1">Registre uma despesa ou abastecimento em uma viagem ativa</p>
        </div>
        <div className="card">
          <EmptyState
            icon={PlusCircle}
            title="Nenhuma viagem em andamento"
            description="Para registrar uma despesa rápida, você precisa ter uma viagem em andamento. Inicie uma viagem primeiro."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Nova despesa</h2>
        <p className="text-gray-500 text-sm mt-1">Registre uma despesa ou abastecimento em uma viagem ativa</p>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
        <button
          onClick={() => setMode('expense')}
          className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${mode === 'expense' ? 'bg-white text-navy-700 shadow-sm' : 'text-gray-500'}`}
        >
          Despesa
        </button>
        <button
          onClick={() => setMode('refuel')}
          className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${mode === 'refuel' ? 'bg-white text-navy-700 shadow-sm' : 'text-gray-500'}`}
        >
          Abastecimento
        </button>
      </div>

      <form onSubmit={handleSubmit} className="card p-5 sm:p-6 space-y-4">
        <div>
          <label className="label-text" htmlFor="trip">Viagem em andamento</label>
          <select id="trip" value={tripId} onChange={(e) => setTripId(e.target.value)} className="input-field">
            <option value="">Selecione uma viagem...</option>
            {activeTrips.map((t: Trip) => (
              <option key={t.id} value={t.id}>{t.title} ({t.origin} → {t.destination})</option>
            ))}
          </select>
        </div>

        {/* Fuel info for refuel mode */}
        {mode === 'refuel' && tripId && (
          <div className="p-3 bg-blue-50 rounded-lg text-sm space-y-1">
            <div className="flex items-center gap-2 text-blue-700 font-medium">
              <Fuel className="w-4 h-4" />
              Combustível disponível: {formatNumber(combustivelDisp, 1)} L
            </div>
            <p className="text-xs text-blue-500">
              Inicial: {formatNumber(combustivelInicial, 1)} L + Abastecido: {formatNumber(totalRefueled, 1)} L
            </p>
          </div>
        )}

        {mode === 'expense' ? (
          <>
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
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label-text" htmlFor="liters">Litros *</label>
                <input id="liters" type="text" inputMode="decimal" required value={liters} onChange={(e) => setLiters(e.target.value)} className="input-field" placeholder="Ex: 200" />
              </div>
              <div>
                <label className="label-text" htmlFor="price">Preço/L (R$) *</label>
                <input id="price" type="text" inputMode="decimal" required value={pricePerLiter} onChange={(e) => setPricePerLiter(e.target.value)} className="input-field" placeholder="Ex: 6,00" />
              </div>
            </div>
            {autoCalc && calculatedTotal !== null && (
              <div className="p-2 bg-blue-50 rounded text-sm text-blue-700">
                Total: <strong>{formatCurrency(calculatedTotal)}</strong>
              </div>
            )}
          </>
        )}

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

        {success && (
          <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg p-3">
            <CheckCircle2 className="w-4 h-4" />
            <span>Registrado com sucesso!</span>
          </div>
        )}

        <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlusCircle className="w-5 h-5" />}
          {mode === 'refuel' ? 'Registrar abastecimento' : 'Registrar despesa'}
        </button>
      </form>
    </div>
  );
}
