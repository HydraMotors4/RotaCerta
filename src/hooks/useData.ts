import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Trip, Expense, Vehicle, Refueling, UserProfile, Transportadora } from '@/types/database';

export function useTrips() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('trips')
      .select('*, vehicle:vehicles(*)')
      .order('created_at', { ascending: false });
    if (!error && data) setTrips(data as Trip[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return { trips, loading, reload: load, setTrips };
}

export function useTripExpenses(tripId: string | null) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!tripId) { setExpenses([]); setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('trip_id', tripId)
      .order('expense_date', { ascending: false });
    if (!error && data) setExpenses(data as Expense[]);
    setLoading(false);
  }, [tripId]);

  useEffect(() => { load(); }, [load]);

  return { expenses, loading, reload: load, setExpenses };
}

export function useTripRefuelings(tripId: string | null) {
  const [refuelings, setRefuelings] = useState<Refueling[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!tripId) { setRefuelings([]); setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('refuelings')
      .select('*')
      .eq('trip_id', tripId)
      .order('refuel_date', { ascending: false });
    if (!error && data) setRefuelings(data as Refueling[]);
    setLoading(false);
  }, [tripId]);

  useEffect(() => { load(); }, [load]);

  return { refuelings, loading, reload: load, setRefuelings };
}

export function useVehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setVehicles(data as Vehicle[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return { vehicles, loading, reload: load, setVehicles };
}

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .maybeSingle();
    if (!error && data) setProfile(data as UserProfile);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return { profile, loading, reload: load, setProfile };
}

export function useTransportadoras() {
  const [transportadoras, setTransportadoras] = useState<Transportadora[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('transportadoras')
      .select('*')
      .order('name', { ascending: true });
    if (!error && data) setTransportadoras(data as Transportadora[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return { transportadoras, loading, reload: load };
}
