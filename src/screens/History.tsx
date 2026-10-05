import { useState, useMemo, useEffect } from 'react';
import { Search, Route, Download, Truck, Filter, X } from 'lucide-react';
import { useTrips, useVehicles } from '@/hooks/useData';
import { formatCurrency, formatDate } from '@/lib/format';
import { StatusBadge, EmptyState } from '@/components/UI';
import { STATUS_LABELS, type Trip, type TripStatus } from '@/types/database';

export default function History({
  onOpenTrip,
}: {
  onOpenTrip: (trip: Trip) => void;
}) {
  const { trips, loading } = useTrips();
  const { vehicles } = useVehicles();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<TripStatus | 'all'>('all');
  const [vehicleFilter, setVehicleFilter] = useState<string>('all');
  const [periodFilter, setPeriodFilter] = useState<'all' | 'month' | 'week' | 'quarter'>('all');

  const filtered = useMemo(() => {
    let result = [...trips];

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter((t) =>
        t.title.toLowerCase().includes(q) ||
        t.origin.toLowerCase().includes(q) ||
        t.destination.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter((t) => t.status === statusFilter);
    }

    if (vehicleFilter !== 'all') {
      result = result.filter((t) => t.vehicle_id === vehicleFilter);
    }

    if (periodFilter !== 'all') {
      const now = new Date();
      let cutoff = new Date();
      if (periodFilter === 'week') cutoff.setDate(now.getDate() - 7);
      else if (periodFilter === 'month') cutoff.setMonth(now.getMonth() - 1);
      else if (periodFilter === 'quarter') cutoff.setMonth(now.getMonth() - 3);
      result = result.filter((t) => new Date(t.departure_date) >= cutoff);
    }

    return result;
  }, [trips, search, statusFilter, vehicleFilter, periodFilter]);

  const exportCSV = () => {
    const headers = ['Identificação', 'Origem', 'Destino', 'Saída', 'Chegada', 'Distância (km)', 'Frete (R$)', 'Status', 'Veículo'];
    const rows = filtered.map((t) => [
      t.title,
      t.origin,
      t.destination,
      formatDate(t.departure_date),
      formatDate(t.arrival_date),
      t.distance_km ? String(t.distance_km) : '',
      String(t.freight_value),
      STATUS_LABELS[t.status],
      t.vehicle?.name || '',
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rota-certa-viagens-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const hasFilters = search || statusFilter !== 'all' || vehicleFilter !== 'all' || periodFilter !== 'all';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Histórico</h2>
          <p className="text-gray-500 text-sm mt-1">Todas as suas viagens</p>
        </div>
        {filtered.length > 0 && (
          <button onClick={exportCSV} className="btn-secondary flex items-center gap-2 text-sm">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Exportar CSV</span>
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field pl-10"
          placeholder="Buscar por origem, destino ou identificação..."
        />
      </div>

      {/* Filters */}
      <div className="card p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <Filter className="w-4 h-4" />
          Filtros
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="label-text">Situação</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as TripStatus | 'all')} className="input-field">
              <option value="all">Todas</option>
              <option value="planned">Planejada</option>
              <option value="in_progress">Em andamento</option>
              <option value="finished">Finalizada</option>
            </select>
          </div>
          <div>
            <label className="label-text">Veículo</label>
            <select value={vehicleFilter} onChange={(e) => setVehicleFilter(e.target.value)} className="input-field">
              <option value="all">Todos</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label-text">Período</label>
            <select value={periodFilter} onChange={(e) => setPeriodFilter(e.target.value as 'all' | 'month' | 'week' | 'quarter')} className="input-field">
              <option value="all">Todo o período</option>
              <option value="week">Última semana</option>
              <option value="month">Último mês</option>
              <option value="quarter">Últimos 3 meses</option>
            </select>
          </div>
        </div>
        {hasFilters && (
          <button
            onClick={() => { setSearch(''); setStatusFilter('all'); setVehicleFilter('all'); setPeriodFilter('all'); }}
            className="text-sm text-navy-600 font-medium flex items-center gap-1 hover:underline"
          >
            <X className="w-3.5 h-3.5" />
            Limpar filtros
          </button>
        )}
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-3 border-navy-200 border-t-navy-600 rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Route}
            title={hasFilters ? "Nenhuma viagem encontrada" : "Nenhuma viagem cadastrada"}
            description={hasFilters ? "Tente ajustar os filtros de busca." : "Crie sua primeira viagem para começar a registrar fretes e despesas."}
          />
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-gray-500">{filtered.length} viagem(s) encontrada(s)</p>
          {filtered.map((trip) => (
            <button
              key={trip.id}
              onClick={() => onOpenTrip(trip)}
              className="w-full card p-4 flex items-center gap-3 hover:shadow-md transition-shadow text-left"
            >
              <div className="flex items-center justify-center w-10 h-10 bg-navy-50 rounded-lg shrink-0">
                <Truck className="w-5 h-5 text-navy-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{trip.title}</p>
                <p className="text-sm text-gray-500 truncate">
                  {trip.origin} → {trip.destination} · {formatDate(trip.departure_date)}
                </p>
                {trip.vehicle && (
                  <p className="text-xs text-gray-400 mt-0.5">{trip.vehicle.name}</p>
                )}
              </div>
              <div className="text-right shrink-0">
                <p className="font-semibold text-gray-900 text-sm">{formatCurrency(Number(trip.freight_value))}</p>
                <StatusBadge status={trip.status} />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
