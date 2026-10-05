import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import AuthScreen from '@/screens/AuthScreen';
import Layout, { type PageId } from '@/components/Layout';
import Dashboard from '@/screens/Dashboard';
import TripsPage from '@/screens/TripsPage';
import TripDetail from '@/screens/TripDetail';
import QuickExpense from '@/screens/QuickExpense';
import History from '@/screens/History';
import VehiclesPage from '@/screens/VehiclesPage';
import Profile from '@/screens/Profile';
import { useTrips } from '@/hooks/useData';
import type { Trip } from '@/types/database';

function AppContent() {
  const { user, loading } = useAuth();
  const [page, setPage] = useState<PageId>('dashboard');
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const { trips, reload: reloadTrips } = useTrips();

  // Refresh trip data when returning to dashboard/history
  useEffect(() => {
    if (user && (page === 'dashboard' || page === 'history')) {
      reloadTrips();
    }
  }, [page, user, reloadTrips]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy-900">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  const handleNavigate = (p: PageId) => {
    setSelectedTrip(null);
    setPage(p);
  };

  const handleOpenTrip = (trip: Trip) => {
    setSelectedTrip(trip);
    setPage('trips');
  };

  const handleTripCreated = (trip: Trip) => {
    reloadTrips();
    setSelectedTrip(trip);
    setPage('trips');
  };

  const handleTripUpdated = (updated: Trip) => {
    setSelectedTrip(updated);
    reloadTrips();
  };

  // If a trip is selected, show its detail page
  if (selectedTrip && page === 'trips') {
    return (
      <Layout currentPage={page} onNavigate={handleNavigate}>
        <TripDetail
          trip={selectedTrip}
          onBack={() => { setSelectedTrip(null); reloadTrips(); }}
          onTripUpdated={handleTripUpdated}
        />
      </Layout>
    );
  }

  let content;
  switch (page) {
    case 'dashboard':
      content = <Dashboard onNavigate={handleNavigate} onOpenTrip={handleOpenTrip} />;
      break;
    case 'trips':
      content = <TripsPage onTripCreated={handleTripCreated} onOpenTrip={handleOpenTrip} />;
      break;
    case 'new-expense':
      content = <QuickExpense onExpenseAdded={reloadTrips} />;
      break;
    case 'history':
      content = <History onOpenTrip={handleOpenTrip} />;
      break;
    case 'vehicles':
      content = <VehiclesPage />;
      break;
    case 'profile':
      content = <Profile onNavigate={handleNavigate} />;
      break;
    default:
      content = <Dashboard onNavigate={handleNavigate} onOpenTrip={handleOpenTrip} />;
  }

  return (
    <Layout currentPage={page} onNavigate={handleNavigate}>
      {content}
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
