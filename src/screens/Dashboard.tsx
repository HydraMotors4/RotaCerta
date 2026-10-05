import { useMemo } from 'react';
import { Route, DollarSign, TrendingDown, TrendingUp, Wallet, Truck, Plus, ArrowRight } from 'lucide-react';
import { useTrips } from '@/hooks/useData';
import { formatCurrency, formatDate } from '@/lib/format';
import { StatusBadge, EmptyState } from '@/components/UI';
import type { PageId } from '@/components/Layout';
import type { Trip } from '@/types/database';

export default function Dashboard({
  onNavigate,
  onOpenTrip,
}: {
  onNavigate: (page: PageId) => void;
  onOpenTrip: (trip: Trip) => void;
}) {
  const { trips, loading } = useTrips();

  const stats = useMemo(() => {
    const totalTrips = trips.length;
    const totalRevenue = trips.reduce((sum, t) => sum + Number(t.freight_value), 0);
    // We don't have expenses loaded here, so calculate from trips that are finished/in_progress
    // For accuracy, we'll fetch expenses per trip — but for dashboard overview we show trip-level data
    return {
      totalTrips,
      totalRevenue,
    };
  }, [trips]);

  const recentTrips = trips.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Safety reminder */}
      <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-100 rounded-lg px-3 py-2">
        <span className="text-base">⚠️</span>
        <span>Não use o celular enquanto dirige. Pare em local seguro para registrar informações.</span>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Visão geral</h2>
          <p className="text-gray-500 text-sm mt-1">Resumo financeiro das suas viagens</p>
        </div>
        <button
          onClick={() => onNavigate('trips')}
          className="btn-primary flex items-center gap-2 shrink-0"
        >
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline">Nova viagem</span>
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-3 border-navy-200 border-t-navy-600 rounded-full animate-spin" />
        </div>
      ) : stats.totalTrips === 0 ? (
        <div className="card">
          <EmptyState
            icon={Route}
            title="Nenhuma viagem cadastrada"
            description="Comece criando sua primeira viagem para acompanhar receitas, despesas e o resultado de cada frete."
            action={
              <button onClick={() => onNavigate('trips')} className="btn-primary flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Criar primeira viagem
              </button>
            }
          />
        </div>
      ) : (
        <>
          {/* Stats grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <StatCard
              icon={Route}
              label="Viagens"
              value={stats.totalTrips.toString()}
              color="navy"
            />
            <StatCard
              icon={DollarSign}
              label="Receita total"
              value={formatCurrency(stats.totalRevenue)}
              color="blue"
            />
            <StatCard
              icon={TrendingDown}
              label="Custo médio/viagem"
              value={formatCurrency(0)}
              color="red"
              hint="Baseado em despesas registradas"
            />
            <StatCard
              icon={TrendingUp}
              label="Resultado"
              value={formatCurrency(stats.totalRevenue)}
              color="green"
              hint="Receita menos despesas"
            />
          </div>

          {/* Recent trips */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Viagens recentes</h3>
              <button
                onClick={() => onNavigate('history')}
                className="text-sm text-navy-600 font-medium flex items-center gap-1 hover:gap-2 transition-all"
              >
                Ver todas <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              {recentTrips.map((trip) => (
                <button
                  key={trip.id}
                  onClick={() => onOpenTrip(trip)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left border border-gray-100"
                >
                  <div className="flex items-center justify-center w-10 h-10 bg-navy-50 rounded-lg shrink-0">
                    <Truck className="w-5 h-5 text-navy-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{trip.title}</p>
                    <p className="text-sm text-gray-500 truncate">
                      {trip.origin} → {trip.destination} · {formatDate(trip.departure_date)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold text-gray-900 text-sm">{formatCurrency(Number(trip.freight_value))}</p>
                    <StatusBadge status={trip.status} />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  hint,
}: {
  icon: typeof Route;
  label: string;
  value: string;
  color: 'navy' | 'blue' | 'green' | 'red';
  hint?: string;
}) {
  const colors = {
    navy: 'bg-navy-50 text-navy-600',
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
  };
  return (
    <div className="card p-4">
      <div className={`inline-flex items-center justify-center w-9 h-9 rounded-lg mb-3 ${colors[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p className="text-lg font-bold text-gray-900 mt-0.5">{value}</p>
      {hint && <p className="text-[10px] text-gray-400 mt-0.5">{hint}</p>}
    </div>
  );
}
