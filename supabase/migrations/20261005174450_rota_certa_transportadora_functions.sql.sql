/*
# ROTA Certa - Funções do Painel da Transportadora

## Descrição
Cria funções SECURITY DEFINER que permitem à transportadora visualizar dados
dos motoristas vinculados a ela. Sem essas funções, o painel da transportadora
não consegue acessar viagens, despesas, veículos e abastecimentos dos motoristas,
pois o RLS limita cada usuário a ver apenas seus próprios registros.

## Funções criadas
1. `get_motoristas_by_transportadora()` — lista motoristas vinculados
2. `get_viagens_by_transportadora()` — lista viagens dos motoristas vinculados
3. `get_veiculos_by_transportadora()` — lista veículos dos motoristas vinculados
4. `get_despesas_by_transportadora()` — lista despesas dos motoristas vinculados
5. `get_abastecimentos_by_transportadora()` — lista abastecimentos dos motoristas vinculados

## Segurança
- Todas as funções são SECURITY DEFINER (executam com privilégios do dono)
- Cada função filtra por `t.user_id = auth.uid()`, garantindo que a transportadora
  só veja dados dos motoristas vinculados a ELA, não de outras transportadoras
- `search_path` definido como `public` para evitar ataques de search_path
- EXECUTE concedido apenas para `authenticated`
*/

-- Função: buscar motoristas vinculados à transportadora do usuário logado
CREATE OR REPLACE FUNCTION get_motoristas_by_transportadora()
RETURNS TABLE (
  profile_id uuid,
  user_id uuid,
  nome_motorista text,
  apelido text,
  email text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    up.id AS profile_id,
    up.user_id,
    up.nome_motorista,
    up.apelido,
    au.email,
    up.created_at,
    up.updated_at
  FROM user_profiles up
  JOIN auth.users au ON au.id = up.user_id
  JOIN transportadoras t ON t.id = up.transportadora_id
  WHERE t.user_id = auth.uid()
$$;

-- Função: buscar viagens dos motoristas vinculados à transportadora
CREATE OR REPLACE FUNCTION get_viagens_by_transportadora()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  company_id uuid,
  vehicle_id uuid,
  title text,
  origin text,
  destination text,
  departure_date date,
  arrival_date date,
  distance_km numeric,
  freight_value numeric,
  notes text,
  status text,
  combustivel_inicial numeric,
  combustivel_final numeric,
  distancia_real numeric,
  started_at timestamptz,
  created_at timestamptz,
  motorista_nome text,
  motorista_apelido text,
  vehicle_name text,
  vehicle_plate text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    tr.id,
    tr.user_id,
    tr.company_id,
    tr.vehicle_id,
    tr.title,
    tr.origin,
    tr.destination,
    tr.departure_date,
    tr.arrival_date,
    tr.distance_km,
    tr.freight_value,
    tr.notes,
    tr.status,
    tr.combustivel_inicial,
    tr.combustivel_final,
    tr.distancia_real,
    tr.started_at,
    tr.created_at,
    up.nome_motorista,
    up.apelido,
    v.name AS vehicle_name,
    v.plate AS vehicle_plate
  FROM trips tr
  JOIN user_profiles up ON up.user_id = tr.user_id
  JOIN transportadoras t ON t.id = up.transportadora_id
  LEFT JOIN vehicles v ON v.id = tr.vehicle_id
  WHERE t.user_id = auth.uid()
$$;

-- Função: buscar veículos dos motoristas vinculados à transportadora
CREATE OR REPLACE FUNCTION get_veiculos_by_transportadora()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  company_id uuid,
  name text,
  plate text,
  notes text,
  consumo_medio numeric,
  created_at timestamptz,
  motorista_nome text,
  motorista_apelido text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    v.id,
    v.user_id,
    v.company_id,
    v.name,
    v.plate,
    v.notes,
    v.consumo_medio,
    v.created_at,
    up.nome_motorista,
    up.apelido
  FROM vehicles v
  JOIN user_profiles up ON up.user_id = v.user_id
  JOIN transportadoras t ON t.id = up.transportadora_id
  WHERE t.user_id = auth.uid()
$$;

-- Função: buscar despesas das viagens dos motoristas vinculados
CREATE OR REPLACE FUNCTION get_despesas_by_transportadora()
RETURNS TABLE (
  id uuid,
  trip_id uuid,
  user_id uuid,
  category text,
  amount numeric,
  expense_date timestamptz,
  description text,
  refueling_id uuid,
  created_at timestamptz,
  trip_title text,
  motorista_nome text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    e.id,
    e.trip_id,
    e.user_id,
    e.category,
    e.amount,
    e.expense_date,
    e.description,
    e.refueling_id,
    e.created_at,
    tr.title AS trip_title,
    up.nome_motorista
  FROM expenses e
  JOIN trips tr ON tr.id = e.trip_id
  JOIN user_profiles up ON up.user_id = e.user_id
  JOIN transportadoras t ON t.id = up.transportadora_id
  WHERE t.user_id = auth.uid()
$$;

-- Função: buscar abastecimentos das viagens dos motoristas vinculados
CREATE OR REPLACE FUNCTION get_abastecimentos_by_transportadora()
RETURNS TABLE (
  id uuid,
  trip_id uuid,
  user_id uuid,
  liters numeric,
  price_per_liter numeric,
  total_amount numeric,
  refuel_date timestamptz,
  expense_id uuid,
  description text,
  created_at timestamptz,
  trip_title text,
  motorista_nome text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    r.id,
    r.trip_id,
    r.user_id,
    r.liters,
    r.price_per_liter,
    r.total_amount,
    r.refuel_date,
    r.expense_id,
    r.description,
    r.created_at,
    tr.title AS trip_title,
    up.nome_motorista
  FROM refuelings r
  JOIN trips tr ON tr.id = r.trip_id
  JOIN user_profiles up ON up.user_id = r.user_id
  JOIN transportadoras t ON t.id = up.transportadora_id
  WHERE t.user_id = auth.uid()
$$;

-- Conceder acesso às funções para usuários autenticados
GRANT EXECUTE ON FUNCTION get_motoristas_by_transportadora() TO authenticated;
GRANT EXECUTE ON FUNCTION get_viagens_by_transportadora() TO authenticated;
GRANT EXECUTE ON FUNCTION get_veiculos_by_transportadora() TO authenticated;
GRANT EXECUTE ON FUNCTION get_despesas_by_transportadora() TO authenticated;
GRANT EXECUTE ON FUNCTION get_abastecimentos_by_transportadora() TO authenticated;
