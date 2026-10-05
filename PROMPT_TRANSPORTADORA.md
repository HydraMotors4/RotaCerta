# PROMPT — Painel Administrativo da Transportadora (ROTA Certa)

## CONTEXTO GERAL

Crie um site separado (novo projeto) chamado **"ROTA Certa — Painel da Transportadora"**. Este será o painel administrativo onde transportadoras gerenciam seus motoristas, veículos, viagens e despesas.

O site deve ser uma aplicação web responsiva em **React + TypeScript + Vite + Tailwind CSS**, usando **lucide-react** para ícones.

O sistema já possui um banco de dados Supabase com todas as tabelas criadas. O painel deve se conectar ao **mesmo banco de dados** do app dos motoristas.

---

## CONEXÃO COM O BANCO DE DADOS

O painel deve se conectar ao mesmo Supabase do app dos motoristas. Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```
VITE_SUPABASE_URL=https://dsuwpidalywavxsiflcg.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzdXdwaWRhbHl3YXZ4c2lmbGNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA5NDIyODUsImV4cCI6MjEwNjUxODI4NX0.7V1i-kXK8MS2xJso-IY6spyLFVeqQyULSoAIh9YEYJI
```

E crie um arquivo `src/lib/supabase.ts` com:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

Instale a dependência: `npm install @supabase/supabase-js`

---

## ESTRUTURA DO BANCO DE DADOS (já existente)

O banco já tem as seguintes tabelas. **NÃO crie novas tabelas nem altere as existentes.** Apenas leia e escreva nelas.

### Tabela: `transportadoras`
| Campo | Tipo | Descrição |
|---|---|---|
| `id` | uuid (PK) | Identificador único |
| `user_id` | uuid (FK → auth.users) | Dono da transportadora |
| `name` | text | Nome da transportadora |
| `cnpj` | text (nullable) | CNPJ |
| `codigo_vinculacao` | text (único, não nulo) | Código que motoristas usam para se vincular |
| `created_at` | timestamptz | Data de criação |

**RLS:** Qualquer usuário autenticado pode fazer SELECT (para busca por código). INSERT/UPDATE/DELETE apenas pelo dono (`auth.uid() = user_id`).

### Tabela: `user_profiles`
| Campo | Tipo | Descrição |
|---|---|---|
| `id` | uuid (PK) | Identificador único |
| `user_id` | uuid (FK → auth.users, único) | Usuário vinculado |
| `nome_motorista` | text (nullable) | Nome completo do motorista |
| `apelido` | text (nullable) | Apelido |
| `transportadora_id` | uuid (FK → transportadoras, nullable) | Transportadora à qual está vinculado |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

**RLS:** Cada usuário acessa apenas seu próprio perfil.

### Tabela: `vehicles`
| Campo | Tipo | Descrição |
|---|---|---|
| `id` | uuid (PK) | |
| `user_id` | uuid (FK → auth.users) | Dono do veículo |
| `company_id` | uuid (FK → transportadoras, nullable) | Transportadora vinculada |
| `name` | text | Nome/identificação do veículo |
| `plate` | text (nullable) | Placa |
| `notes` | text (nullable) | Observações |
| `consumo_medio` | numeric (nullable, > 0) | Consumo médio em km/L |
| `created_at` | timestamptz | |

**RLS:** Cada usuário acessa apenas seus próprios veículos.

### Tabela: `trips`
| Campo | Tipo | Descrição |
|---|---|---|
| `id` | uuid (PK) | |
| `user_id` | uuid (FK → auth.users) | Dono da viagem |
| `company_id` | uuid (FK → transportadoras, nullable) | Transportadora vinculada |
| `vehicle_id` | uuid (FK → vehicles, nullable) | Veículo utilizado |
| `title` | text | Título da viagem |
| `origin` | text | Origem |
| `destination` | text | Destino |
| `departure_date` | date | Data de saída |
| `arrival_date` | date (nullable) | Data de chegada |
| `distance_km` | numeric (nullable, ≥ 0) | Distância estimada em km |
| `freight_value` | numeric (≥ 0) | Valor do frete em R$ |
| `notes` | text (nullable) | Observações |
| `status` | text | `planned` / `in_progress` / `finished` |
| `combustivel_inicial` | numeric (nullable, ≥ 0) | Litros no início da viagem |
| `combustivel_final` | numeric (nullable, ≥ 0) | Litros no final da viagem |
| `distancia_real` | numeric (nullable, ≥ 0) | Distância real percorrida |
| `started_at` | timestamptz (nullable) | Momento em que a viagem foi iniciada |
| `created_at` | timestamptz | |

**RLS:** Cada usuário acessa apenas suas próprias viagens.

### Tabela: `expenses`
| Campo | Tipo | Descrição |
|---|---|---|
| `id` | uuid (PK) | |
| `trip_id` | uuid (FK → trips) | Viagem vinculada |
| `user_id` | uuid (FK → auth.users) | Dono da despesa |
| `category` | text | `combustivel` / `pedagio` / `alimentacao` / `hospedagem` / `manutencao` / `estacionamento` / `outros` |
| `amount` | numeric (≥ 0) | Valor em R$ |
| `expense_date` | timestamptz | Data e hora |
| `description` | text (nullable) | Descrição |
| `refueling_id` | uuid (FK → refuelings, nullable) | Abastecimento vinculado |
| `created_at` | timestamptz | |

**RLS:** Cada usuário acessa apenas suas próprias despesas.

### Tabela: `refuelings`
| Campo | Tipo | Descrição |
|---|---|---|
| `id` | uuid (PK) | |
| `trip_id` | uuid (FK → trips) | Viagem vinculada |
| `user_id` | uuid (FK → auth.users) | Dono do abastecimento |
| `liters` | numeric (> 0) | Litros abastecidos |
| `price_per_liter` | numeric (≥ 0) | Preço por litro |
| `total_amount` | numeric (≥ 0) | Valor total pago |
| `refuel_date` | timestamptz | Data e hora |
| `expense_id` | uuid (FK → expenses, nullable) | Despesa vinculada |
| `description` | text (nullable) | |
| `created_at` | timestamptz | |

**RLS:** Cada usuário acessa apenas seus próprios abastecimentos.

---

## AUTENTICAÇÃO

Use **Supabase Auth com email e senha** (sem confirmação por email).

- Tela de login com email e senha.
- Tela de cadastro para novas transportadoras.
- Após o cadastro, criar automaticamente um registro na tabela `transportadoras` com:
  - `user_id` = ID do usuário recém-criado
  - `name` = Nome da transportadora informado no cadastro
  - `cnpj` = CNPJ informado (opcional)
  - `codigo_vinculacao` = gerar automaticamente um código único de 8 caracteres (maiúsculas e números)
- Manter sessão ativa com `onAuthStateChange`.
- Logout disponível.

---

## IMPORTANTE — FUNÇÕES DO BANCO JÁ CRIADAS

As funções SECURITY DEFINER abaixo **já foram criadas no banco de dados**. **NÃO crie novas migrations nem tente recriar estas funções** — apenas chame-as via RPC no código frontend.

Estas funções permitem que a transportadora veja os dados dos motoristas vinculados a ela, contornando o RLS que normalmente limita cada usuário a ver apenas seus próprios registros:

```sql
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
    tr.*,
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
    v.*,
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
    e.*,
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
    r.*,
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
```

No código frontend, chame estas funções via Supabase RPC:

```typescript
// Exemplo: buscar motoristas vinculados
const { data, error } = await supabase.rpc('get_motoristas_by_transportadora');

// Exemplo: buscar viagens dos motoristas
const { data, error } = await supabase.rpc('get_viagens_by_transportadora');

// Exemplo: buscar veículos dos motoristas
const { data, error } = await supabase.rpc('get_veiculos_by_transportadora');

// Exemplo: buscar despesas
const { data, error } = await supabase.rpc('get_despesas_by_transportadora');

// Exemplo: buscar abastecimentos
const { data, error } = await supabase.rpc('get_abastecimentos_by_transportadora');
```

Para buscar os dados da própria transportadora (registro que pertence ao usuário logado), use uma query direta:

```typescript
const { data } = await supabase
  .from('transportadoras')
  .select('*')
  .eq('user_id', user.id)
  .single();
```

---

## TELAS DO PAINEL

### 1. Tela de Login / Cadastro
- Login com email e senha.
- Cadastro de nova transportadora: nome, CNPJ (opcional), email, senha.
- Após cadastro, criar registro em `transportadoras` com `codigo_vinculacao` gerado automaticamente.

### 2. Dashboard (Visão Geral)
- Total de motoristas vinculados.
- Total de viagens (por status: planejadas, em andamento, concluídas).
- Total de veículos cadastrados pelos motoristas.
- Faturamento total (soma de `freight_value` das viagens concluídas).
- Total de despesas (soma de todas as despesas).
- Resultado financeiro total (faturamento − despesas).
- Total gasto com combustível (soma dos abastecimentos).
- Cards com indicadores visuais e gráficos simples.

### 3. Gestão de Motoristas
- Lista de motoristas vinculados à transportadora (nome, apelido, email).
- Mostrar o **código de vinculação** da transportadora em destaque para compartilhar com novos motoristas.
- Botão para copiar o código.
- Estatísticas por motorista: número de viagens, resultado financeiro.
- Não permitir editar ou remover motoristas (apenas visualizar).

### 4. Gestão de Veículos
- Lista de veículos cadastrados pelos motoristas vinculados.
- Mostrar: nome, placa, consumo médio (km/L), motorista responsável.
- Apenas visualização (não editar nem remover).

### 5. Gestão de Viagens
- Lista de viagens dos motoristas vinculados.
- Filtros por status (Planejadas, Em andamento, Concluídas) e por motorista.
- Mostrar: título, origem → destino, motorista, veículo, frete, status, distância, data.
- Detalhe da viagem: despesas, abastecimentos, combustível (inicial, abastecido, final, consumido), consumo real, resultado financeiro.
- Apenas visualização (não editar nem remover).

### 6. Relatórios Financeiros
- Filtro por período (data inicial e data final).
- Filtro por motorista.
- Resumo financeiro: faturamento, despesas por categoria, resultado.
- Despesas divididas por categoria (combustível, pedágio, alimentação, hospedagem, manutenção, estacionamento, outros).
- Total gasto com combustível (via abastecimentos).
- Comparação de consumo estimado vs real por viagem.
- Gráficos simples (barras ou pizza) para visualização.

### 7. Perfil da Transportadora
- Mostrar nome, CNPJ, código de vinculação.
- Editar nome e CNPJ.
- Mostrar o código de vinculação em destaque com botão de copiar.
- Botão para regenerar o código de vinculação (gerar novo código e atualizar no banco).

---

## IDENTIDADE VISUAL

- **Fonte:** Inter (Google Fonts).
- **Cores principais:** tons de azul-marinho (navy), cinzas neutros e branco.
- Paleta navy sugerida (Tailwind):
  - navy-50: `#f0f4fa`
  - navy-100: `#d9e2f0`
  - navy-200: `#b3c5e1`
  - navy-300: `#7d9bcb`
  - navy-400: `#4869ab`
  - navy-500: `#2b4a87`
  - navy-600: `#1e3868`
  - navy-700: `#16294d`
  - navy-800: `#101f3a`
  - navy-900: `#0a1528`
- **NÃO usar roxo, índigo ou tons de violeta.**
- Design responsivo (mobile e desktop).
- Layout com sidebar no desktop e navegação inferior no mobile.
- Interface em **português do Brasil**.
- Valores monetários em **R$** (Real brasileiro).
- Combustível em **litros (L)**.
- Consumo em **km/L**.
- Datas no formato brasileiro (dd/mm/aaaa).

---

## REGRAS GERAIS

- O painel é **apenas para visualização e relatórios**. A transportadora não edita nem remove viagens, despesas ou veículos dos motoristas.
- A transportadora pode editar apenas seu próprio perfil (nome, CNPJ) e regenerar seu código de vinculação.
- Usar Supabase para autenticação e acesso a dados.
- Não criar novas tabelas no banco — usar as funções SECURITY DEFINER fornecidas para ler dados dos motoristas.
- Preservar compatibilidade com o app dos motoristas (não alterar dados existentes).
- Sistema em português do Brasil.
- Layout responsivo.
- Valores monetários em R$.
- Tratar corretamente números decimais (vírgula como separador decimal na exibição).

---

## FLUXO PRINCIPAL DO PAINEL

1. **Transportadora faz cadastro** → informa nome, CNPJ, email e senha.
2. **Sistema cria a transportadora** → gera código de vinculação automaticamente.
3. **Transportadora compartilha o código** com seus motoristas.
4. **Motoristas usam o código no app deles** para se vincular à transportadora.
5. **Transportadora acessa o painel** → vê motoristas vinculados, viagens, veículos, despesas e relatórios.
6. **Transportadora consulta relatórios** → filtra por período e motorista, vê resultados financeiros e indicadores de consumo.
