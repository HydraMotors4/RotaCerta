import { useState, useMemo, type FormEvent } from 'react';
import { Plus, Route, Loader2, AlertCircle, Play, Truck, MapPin, DollarSign, Fuel, Calendar } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useTrips, useVehicles } from '@/hooks/useData';
import { todayISO, formatCurrency, formatDate, formatNumber, parseDecimal } from '@/lib/format';
import { EmptyState, StatusBadge, Modal, Toast } from '@/components/UI';
import type { Trip, TripStatus, Vehicle } from '@/types/database';

type Tab = 'planned' | 'in_progress' | 'finished';

export default function TripsPage({
  onTripCreated,
  onOpenTrip,
}: {
  onTripCreated: (trip: Trip) => void;
  onOpenTrip: (trip: Trip) => void;
}) {
  const { trips, loading, reload } = useTrips();
  const { vehicles } = useVehicles();
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('planned');
  const [startTrip, setStartTrip] = useState<Trip | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const tabTrips = useMemo(() => {
    return trips.filter((t) => t.status === activeTab);
  }, [trips, activeTab]);

  const tabCounts = useMemo(() => ({
    planned: trips.filter((t) => t.status === 'planned').length,
    in_progress: trips.filter((t) => t.status === 'in_progress').length,
    finished: trips.filter((t) => t.status === 'finished').length,
  }), [trips]);

  const handleCreated = (trip: Trip) => {
    setShowForm(false);
    reload();
    onTripCreated(trip);
  };

  const handleStartTrip = async (trip: Trip, initialFuel: number) => {
    const { data, error } = await supabase
      .from('trips')
      .update({
        status: 'in_progress' as TripStatus,
        started_at: new Date().toISOString(),
        combustivel_inicial: initialFuel,
      })
      .eq('id', trip.id)
      .select('*, vehicle:vehicles(*)')
      .single();

    if (error || !data) {
      setToast({ message: 'Erro ao iniciar viagem.', type: 'error' });
      return;
    }

    setStartTrip(null);
    reload();
    setToast({ message: 'Viagem iniciada!', type: 'success' });
    onOpenTrip(data as Trip);
  };

  if (showForm) {
    return <TripForm vehicles={vehicles} onCreated={handleCreated} onCancel={() => setShowForm(false)} />;
  }

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: 'planned', label: 'Planejadas', count: tabCounts.planned },
    { id: 'in_progress', label: 'Em andamento', count: tabCounts.in_progress },
    { id: 'finished', label: 'Concluídas', count: tabCounts.finished },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Viagens</h2>
          <p className="text-gray-500 text-sm mt-1">Gerencie suas viagens por status</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline">Nova viagem</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-lg overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 min-w-fit py-2 px-3 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.id ? 'bg-white text-navy-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Trip list */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-3 border-navy-200 border-t-navy-600 rounded-full animate-spin" />
        </div>
      ) : tabTrips.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Route}
            title={activeTab === 'planned' ? 'Nenhuma viagem planejada' : activeTab === 'in_progress' ? 'Nenhuma viagem em andamento' : 'Nenhuma viagem concluída'}
            description={activeTab === 'planned' ? 'Crie uma nova viagem para começar a acompanhar fretes e despesas.' : 'As viagens aparecerão aqui conforme o status for alterado.'}
            action={activeTab === 'planned' ? (
              <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Nova viagem
              </button>
            ) : undefined}
          />
        </div>
      ) : (
        <div className="space-y-2">
          {tabTrips.map((trip) => (
            <TripCard
              key={trip.id}
              trip={trip}
              vehicle={trip.vehicle || vehicles.find((v) => v.id === trip.vehicle_id) || null}
              onOpen={() => onOpenTrip(trip)}
              onStart={() => setStartTrip(trip)}
            />
          ))}
        </div>
      )}

      {/* Start trip modal */}
      {startTrip && (
        <StartTripModal
          trip={startTrip}
          onConfirm={(fuel) => handleStartTrip(startTrip, fuel)}
          onCancel={() => setStartTrip(null)}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

function TripCard({
  trip,
  vehicle,
  onOpen,
  onStart,
}: {
  trip: Trip;
  vehicle: Vehicle | null;
  onOpen: () => void;
  onStart: () => void;
}) {
  const consumoMedio = vehicle?.consumo_medio ? Number(vehicle.consumo_medio) : null;
  const distancia = trip.distance_km ? Number(trip.distance_km) : null;
  const litrosEstimados = consumoMedio && distancia && consumoMedio > 0 ? distancia / consumoMedio : null;

  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-3">
        <button onClick={onOpen} className="flex items-center gap-3 min-w-0 flex-1 text-left">
          <div className="flex items-center justify-center w-10 h-10 bg-navy-50 rounded-lg shrink-0">
            <Truck className="w-5 h-5 text-navy-600" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-gray-900 truncate">{trip.title}</p>
            <p className="text-sm text-gray-500 truncate flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {trip.origin} → {trip.destination}
            </p>
            <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDate(trip.departure_date)}
            </p>
          </div>
        </button>
        <div className="text-right shrink-0 flex flex-col items-end gap-1">
          <p className="font-semibold text-gray-900 text-sm flex items-center gap-1">
            <DollarSign className="w-3.5 h-3.5 text-gray-400" />
            {formatCurrency(Number(trip.freight_value))}
          </p>
          <StatusBadge status={trip.status} />
        </div>
      </div>

      {/* Fuel estimate */}
      {litrosEstimados !== null && (
        <div className="flex items-center gap-2 mt-3 p-2 bg-blue-50 rounded text-xs">
          <Fuel className="w-4 h-4 text-blue-600" />
          <span className="text-blue-700">
            Estimativa: <strong>{formatNumber(litrosEstimados, 1)} L</strong>
            <span className="text-blue-500 ml-1">({formatNumber(distancia!, 0)} km ÷ {formatNumber(consumoMedio!, 1)} km/L)</span>
          </span>
        </div>
      )}

      {/* Start button for planned trips */}
      {trip.status === 'planned' && (
        <button
          onClick={onStart}
          className="w-full mt-3 bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
        >
          <Play className="w-4 h-4" />
          Iniciar viagem
        </button>
      )}
    </div>
  );
}

function StartTripModal({
  trip,
  onConfirm,
  onCancel,
}: {
  trip: Trip;
  onConfirm: (initialFuel: number) => void;
  onCancel: () => void;
}) {
  const [fuel, setFuel] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const liters = parseDecimal(fuel);
    if (liters === null || liters < 0) {
      setError('Informe um valor válido (maior ou igual a zero).');
      return;
    }
    setLoading(true);
    onConfirm(liters);
  };

  return (
    <Modal open={true} title="Iniciar viagem" onClose={onCancel}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3 bg-gray-50 rounded-lg text-sm">
          <p className="font-medium text-gray-900">{trip.title}</p>
          <p className="text-gray-500">{trip.origin} → {trip.destination}</p>
        </div>
        <div>
          <label className="label-text" htmlFor="initialFuel">Combustível inicial (L) *</label>
          <input
            id="initialFuel"
            type="text"
            inputMode="decimal"
            required
            value={fuel}
            onChange={(e) => setFuel(e.target.value)}
            className="input-field"
            placeholder="Ex: 100"
            autoFocus
          />
          <p className="text-xs text-gray-400 mt-1">Quantos litros de combustível há no tanque agora?</p>
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
            <Play className="w-4 h-4" />
            Iniciar
          </button>
        </div>
      </form>
    </Modal>
  );
}

function TripForm({
  vehicles,
  onCreated,
  onCancel,
}: {
  vehicles: { id: string; name: string; consumo_medio: number | null }[];
  onCreated: (trip: Trip) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState('');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [departureDate, setDepartureDate] = useState(todayISO());
  const [arrivalDate, setArrivalDate] = useState('');
  const [distanceKm, setDistanceKm] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [freightValue, setFreightValue] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const selectedVehicle = vehicles.find((v) => v.id === vehicleId);
  const consumoMedio = selectedVehicle?.consumo_medio ? Number(selectedVehicle.consumo_medio) : null;
  const distancia = distanceKm ? parseDecimal(distanceKm) : null;
  const litrosEstimados = consumoMedio && distancia && consumoMedio > 0 ? distancia / consumoMedio : null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim() || !origin.trim() || !destination.trim() || !departureDate || !freightValue) {
      setError('Preencha todos os campos obrigatórios.');
      return;
    }

    const freight = parseDecimal(freightValue);
    if (freight === null || freight < 0) {
      setError('Valor do frete inválido.');
      return;
    }

    const dist = distanceKm ? parseDecimal(distanceKm) : null;
    if (dist !== null && dist < 0) {
      setError('Distância inválida.');
      return;
    }

    setLoading(true);
    const { data, error: dbError } = await supabase
      .from('trips')
      .insert({
        title: title.trim(),
        origin: origin.trim(),
        destination: destination.trim(),
        departure_date: departureDate,
        arrival_date: arrivalDate || null,
        distance_km: dist,
        vehicle_id: vehicleId || null,
        freight_value: freight,
        notes: notes.trim() || null,
        status: 'planned' as TripStatus,
      })
      .select('*, vehicle:vehicles(*)')
      .single();

    setLoading(false);

    if (dbError || !data) {
      setError('Erro ao salvar viagem. Tente novamente.');
      return;
    }

    onCreated(data as Trip);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Nova viagem</h2>
        <p className="text-gray-500 text-sm mt-1">Preencha as informações do frete</p>
      </div>

      <form onSubmit={handleSubmit} className="card p-5 sm:p-6 space-y-4">
        <div>
          <label className="label-text" htmlFor="title">Identificação da viagem *</label>
          <input id="title" type="text" required value={title} onChange={(e) => setTitle(e.target.value)} className="input-field" placeholder="Ex: Frete SP → RJ" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label-text" htmlFor="origin">Origem *</label>
            <input id="origin" type="text" required value={origin} onChange={(e) => setOrigin(e.target.value)} className="input-field" placeholder="Cidade/UF" />
          </div>
          <div>
            <label className="label-text" htmlFor="destination">Destino *</label>
            <input id="destination" type="text" required value={destination} onChange={(e) => setDestination(e.target.value)} className="input-field" placeholder="Cidade/UF" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label-text" htmlFor="departure">Data de saída *</label>
            <input id="departure" type="date" required value={departureDate} onChange={(e) => setDepartureDate(e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="label-text" htmlFor="arrival">Data de chegada (opcional)</label>
            <input id="arrival" type="date" value={arrivalDate} onChange={(e) => setArrivalDate(e.target.value)} className="input-field" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label-text" htmlFor="distance">Distância estimada (km)</label>
            <input id="distance" type="text" inputMode="decimal" value={distanceKm} onChange={(e) => setDistanceKm(e.target.value)} className="input-field" placeholder="Ex: 450" />
          </div>
          <div>
            <label className="label-text" htmlFor="vehicle">Veículo</label>
            <select id="vehicle" value={vehicleId} onChange={(e) => setVehicleId(e.target.value)} className="input-field">
              <option value="">Selecione...</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Fuel estimate */}
        {litrosEstimados !== null ? (
          <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg text-sm">
            <Fuel className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-blue-700 font-medium">Estimativa de combustível</p>
              <p className="text-blue-600 text-xs">
                {formatNumber(distancia!, 0)} km ÷ {formatNumber(consumoMedio!, 1)} km/L = <strong>{formatNumber(litrosEstimados, 1)} L</strong>
              </p>
            </div>
          </div>
        ) : (vehicleId && distancia && distancia > 0 && !consumoMedio) ? (
          <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg text-sm text-amber-700">
            <Fuel className="w-5 h-5 text-amber-600" />
            <span>Cadastre o consumo médio do veículo para calcular a estimativa de combustível.</span>
          </div>
        ) : null}

        <div>
          <label className="label-text" htmlFor="freight">Valor do frete (R$) *</label>
          <input id="freight" type="text" inputMode="decimal" required value={freightValue} onChange={(e) => setFreightValue(e.target.value)} className="input-field" placeholder="Ex: 2500,00" />
        </div>

        <div>
          <label className="label-text" htmlFor="notes">Observações</label>
          <textarea id="notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} className="input-field resize-none" placeholder="Informações adicionais..." />
        </div>

        {error && (
          <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex gap-3 justify-end pt-2">
          <button type="button" onClick={onCancel} className="btn-secondary">Cancelar</button>
          <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Salvar como planejada
          </button>
        </div>
      </form>
    </div>
  );
}
