export type TripStatus = 'planned' | 'in_progress' | 'finished';

export type ExpenseCategory =
  | 'combustivel'
  | 'pedagio'
  | 'alimentacao'
  | 'hospedagem'
  | 'manutencao'
  | 'estacionamento'
  | 'outros';

export interface Transportadora {
  id: string;
  user_id: string;
  name: string;
  cnpj: string | null;
  created_at: string;
}

export interface Vehicle {
  id: string;
  user_id: string;
  company_id: string | null;
  name: string;
  plate: string | null;
  notes: string | null;
  consumo_medio: number | null;
  created_at: string;
}

export interface Trip {
  id: string;
  user_id: string;
  company_id: string | null;
  vehicle_id: string | null;
  title: string;
  origin: string;
  destination: string;
  departure_date: string;
  arrival_date: string | null;
  distance_km: number | null;
  freight_value: number;
  notes: string | null;
  status: TripStatus;
  combustivel_inicial: number | null;
  combustivel_final: number | null;
  distancia_real: number | null;
  started_at: string | null;
  created_at: string;
  vehicle?: Vehicle | null;
}

export interface Expense {
  id: string;
  trip_id: string;
  user_id: string;
  category: ExpenseCategory;
  amount: number;
  expense_date: string;
  description: string | null;
  refueling_id: string | null;
  created_at: string;
}

export interface Refueling {
  id: string;
  trip_id: string;
  user_id: string;
  liters: number;
  price_per_liter: number;
  total_amount: number;
  refuel_date: string;
  expense_id: string | null;
  description: string | null;
  created_at: string;
}

export interface TripWithExpenses extends Trip {
  expenses: Expense[];
}

export const EXPENSE_CATEGORIES: { value: ExpenseCategory; label: string }[] = [
  { value: 'pedagio', label: 'Pedágio' },
  { value: 'alimentacao', label: 'Alimentação' },
  { value: 'hospedagem', label: 'Hospedagem' },
  { value: 'manutencao', label: 'Manutenção' },
  { value: 'estacionamento', label: 'Estacionamento' },
  { value: 'outros', label: 'Outros' },
];

export const ALL_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  combustivel: 'Combustível',
  pedagio: 'Pedágio',
  alimentacao: 'Alimentação',
  hospedagem: 'Hospedagem',
  manutencao: 'Manutenção',
  estacionamento: 'Estacionamento',
  outros: 'Outros',
};

export const CATEGORY_LABELS: Record<ExpenseCategory, string> = ALL_CATEGORY_LABELS;

export const STATUS_LABELS: Record<TripStatus, string> = {
  planned: 'Planejada',
  in_progress: 'Em andamento',
  finished: 'Finalizada',
};

export const STATUS_COLORS: Record<TripStatus, string> = {
  planned: 'bg-blue-100 text-blue-700 border-blue-200',
  in_progress: 'bg-amber-100 text-amber-700 border-amber-200',
  finished: 'bg-green-100 text-green-700 border-green-200',
};
