/*
# ROTA Certa - Estrutura para transportadoras + controle de combustível

## Descrição
1. Cria a tabela `transportadoras` para futuro painel administrativo.
2. Adiciona `company_id` opcional em `vehicles` e `trips`.
3. Adiciona `consumo_medio` (km/L) em `vehicles`.
4. Adiciona campos de combustível em `trips`: `combustivel_inicial`, `combustivel_final`, `distancia_real`, `started_at`.
5. Cria tabela `refuelings` para abastecimentos.
6. Adiciona `refueling_id` em `expenses` para vincular despesa a abastecimento.

## Tabelas

### transportadoras (nova)
- id, user_id, name, cnpj, created_at

### vehicles (alterada)
- + company_id, consumo_medio

### trips (alterada)
- + company_id, combustivel_inicial, combustivel_final, distancia_real, started_at

### refuelings (nova)
- id, trip_id, user_id, liters, price_per_liter, total_amount, refuel_date, expense_id, description, created_at

### expenses (alterada)
- + refueling_id

## Segurança
- RLS em transportadoras e refuelings
- Company_id sempre opcional
*/

-- Transportadoras
CREATE TABLE IF NOT EXISTS transportadoras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  cnpj text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE transportadoras ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_transportadoras" ON transportadoras;
CREATE POLICY "select_own_transportadoras" ON transportadoras FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_transportadoras" ON transportadoras;
CREATE POLICY "insert_own_transportadoras" ON transportadoras FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_transportadoras" ON transportadoras;
CREATE POLICY "update_own_transportadoras" ON transportadoras FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_transportadoras" ON transportadoras;
CREATE POLICY "delete_own_transportadoras" ON transportadoras FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Add columns to vehicles
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'company_id') THEN
    ALTER TABLE vehicles ADD COLUMN company_id uuid REFERENCES transportadoras(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'consumo_medio') THEN
    ALTER TABLE vehicles ADD COLUMN consumo_medio numeric CHECK (consumo_medio IS NULL OR consumo_medio > 0);
  END IF;
END $$;

-- Add columns to trips
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trips' AND column_name = 'company_id') THEN
    ALTER TABLE trips ADD COLUMN company_id uuid REFERENCES transportadoras(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trips' AND column_name = 'combustivel_inicial') THEN
    ALTER TABLE trips ADD COLUMN combustivel_inicial numeric CHECK (combustivel_inicial IS NULL OR combustivel_inicial >= 0);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trips' AND column_name = 'combustivel_final') THEN
    ALTER TABLE trips ADD COLUMN combustivel_final numeric CHECK (combustivel_final IS NULL OR combustivel_final >= 0);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trips' AND column_name = 'distancia_real') THEN
    ALTER TABLE trips ADD COLUMN distancia_real numeric CHECK (distancia_real IS NULL OR distancia_real >= 0);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trips' AND column_name = 'started_at') THEN
    ALTER TABLE trips ADD COLUMN started_at timestamptz;
  END IF;
END $$;

-- Refuelings table
CREATE TABLE IF NOT EXISTS refuelings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  liters numeric NOT NULL CHECK (liters > 0),
  price_per_liter numeric NOT NULL CHECK (price_per_liter >= 0),
  total_amount numeric NOT NULL CHECK (total_amount >= 0),
  refuel_date timestamptz NOT NULL DEFAULT now(),
  expense_id uuid REFERENCES expenses(id) ON DELETE SET NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE refuelings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_refuelings" ON refuelings;
CREATE POLICY "select_own_refuelings" ON refuelings FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_refuelings" ON refuelings;
CREATE POLICY "insert_own_refuelings" ON refuelings FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_refuelings" ON refuelings;
CREATE POLICY "update_own_refuelings" ON refuelings FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_refuelings" ON refuelings;
CREATE POLICY "delete_own_refuelings" ON refuelings FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Add refueling_id to expenses
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expenses' AND column_name = 'refueling_id') THEN
    ALTER TABLE expenses ADD COLUMN refueling_id uuid REFERENCES refuelings(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_refuelings_trip_id ON refuelings(trip_id);
CREATE INDEX IF NOT EXISTS idx_refuelings_user_id ON refuelings(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_refueling_id ON expenses(refueling_id);
CREATE INDEX IF NOT EXISTS idx_transportadoras_user_id ON transportadoras(user_id);