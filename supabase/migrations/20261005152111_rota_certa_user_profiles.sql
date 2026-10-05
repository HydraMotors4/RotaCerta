/*
# ROTA Certa - Perfil do motorista + vínculo com transportadora

## Descrição
Cria a tabela `user_profiles` para armazenar dados adicionais do motorista:
- Nome completo
- Apelido
- Vínculo opcional com transportadora

## Tabela

### user_profiles (nova)
- `id` (uuid, PK, mesmo ID do auth.users)
- `user_id` (uuid, FK -> auth.users, único)
- `nome_motorista` (text, nome completo do motorista)
- `apelido` (text, apelido opcional)
- `transportadora_id` (uuid, FK -> transportadoras, nullable — vínculo opcional)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

## Segurança
- RLS habilitado
- Cada usuário acessa apenas seu próprio perfil
- INSERT/UPDATE/DELETE com ownership via auth.uid()
*/

CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  nome_motorista text,
  apelido text,
  transportadora_id uuid REFERENCES transportadoras(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON user_profiles;
CREATE POLICY "select_own_profile" ON user_profiles FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_profile" ON user_profiles;
CREATE POLICY "insert_own_profile" ON user_profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_profile" ON user_profiles;
CREATE POLICY "update_own_profile" ON user_profiles FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_profile" ON user_profiles;
CREATE POLICY "delete_own_profile" ON user_profiles FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);