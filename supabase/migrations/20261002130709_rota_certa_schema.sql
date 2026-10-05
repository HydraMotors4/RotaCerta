/*
# ROTA Certa - Schema do Banco de Dados

## Descrição
Cria as tabelas para controle financeiro de viagens de caminhoneiros:
- `vehicles`: veículos cadastrados pelo usuário
- `trips`: viagens com origem, destino, frete, status e distância
- `expenses`: despesas vinculadas a cada viagem, categorizadas

## Tabelas

### vehicles
- `id` (uuid, PK)
- `user_id` (uuid, FK -> auth.users, default auth.uid())
- `name` (text, nome/identificação do veículo)
- `plate` (text, placa opcional)
- `notes` (text, observações opcionais)
- `created_at` (timestamptz)

### trips
- `id` (uuid, PK)
- `user_id` (uuid, FK -> auth.users, default auth.uid())
- `vehicle_id` (uuid, FK -> vehicles, nullable)
- `title` (text, identificação da viagem)
- `origin` (text, origem)
- `destination` (text, destino)
- `departure_date` (date, data de saída)
- `arrival_date` (date, data de chegada opcional)
- `distance_km` (numeric, distância em km)
- `freight_value` (numeric, valor do frete em reais)
- `notes` (text, observações)
- `status` (text: 'planned' | 'in_progress' | 'finished')
- `created_at` (timestamptz)

### expenses
- `id` (uuid, PK)
- `trip_id` (uuid, FK -> trips)
- `user_id` (uuid, FK -> auth.users, default auth.uid())
- `category` (text: combustivel|pedagio|alimentacao|hospedagem|manutencao|estacionamento|outros)
- `amount` (numeric, valor em reais)
- `expense_date` (timestamptz, data e hora)
- `description` (text, descrição opcional)
- `created_at` (timestamptz)

## Segurança (RLS)
- RLS habilitado em todas as tabelas
- Cada usuário acessa apenas seus próprios registros
- Policies de SELECT/INSERT/UPDATE/DELETE em todas as tabelas
- Todos user_id com DEFAULT auth.uid()
*/

-- Vehicles
CREATE TABLE IF NOT EXISTS vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  plate text,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_vehicles" ON vehicles;
CREATE POLICY "select_own_vehicles" ON vehicles FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_vehicles" ON vehicles;
CREATE POLICY "insert_own_vehicles" ON vehicles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_vehicles" ON vehicles;
CREATE POLICY "update_own_vehicles" ON vehicles FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_vehicles" ON vehicles;
CREATE POLICY "delete_own_vehicles" ON vehicles FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Trips
CREATE TABLE IF NOT EXISTS trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  vehicle_id uuid REFERENCES vehicles(id) ON DELETE SET NULL,
  title text NOT NULL,
  origin text NOT NULL,
  destination text NOT NULL,
  departure_date date NOT NULL,
  arrival_date date,
  distance_km numeric CHECK (distance_km IS NULL OR distance_km >= 0),
  freight_value numeric NOT NULL CHECK (freight_value >= 0),
  notes text,
  status text NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'finished')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE trips ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_trips" ON trips;
CREATE POLICY "select_own_trips" ON trips FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_trips" ON trips;
CREATE POLICY "insert_own_trips" ON trips FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_trips" ON trips;
CREATE POLICY "update_own_trips" ON trips FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_trips" ON trips;
CREATE POLICY "delete_own_trips" ON trips FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Expenses
CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  category text NOT NULL CHECK (category IN ('combustivel','pedagio','alimentacao','hospedagem','manutencao','estacionamento','outros')),
  amount numeric NOT NULL CHECK (amount >= 0),
  expense_date timestamptz NOT NULL DEFAULT now(),
  description text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_expenses" ON expenses;
CREATE POLICY "select_own_expenses" ON expenses FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_expenses" ON expenses;
CREATE POLICY "insert_own_expenses" ON expenses FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_expenses" ON expenses;
CREATE POLICY "update_own_expenses" ON expenses FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_expenses" ON expenses;
CREATE POLICY "delete_own_expenses" ON expenses FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_trips_user_id ON trips(user_id);
CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(status);
CREATE INDEX IF NOT EXISTS idx_expenses_trip_id ON expenses(trip_id);
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_user_id ON vehicles(user_id);