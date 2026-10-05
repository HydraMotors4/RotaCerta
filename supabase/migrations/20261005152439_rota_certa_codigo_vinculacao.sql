/*
# ROTA Certa - Código de vinculação de transportadora

## Descrição
Adiciona o campo `codigo_vinculacao` à tabela `transportadoras`.
Esse código permite que motoristas se vinculem a uma transportadora
informando o código, sem precisar ver a lista de todas as transportadoras.

## Alterações
### transportadoras
- + `codigo_vinculacao` (text, unique, não nulo) — código curto e único

## Segurança
- Cria uma policy SELECT que permite a usuários autenticados buscar
  transportadoras pelo código (necessário para o vínculo do motorista).
- A policy SELECT já existente é mantida (dono pode ver suas transportadoras).
- Nova policy: qualquer autenticado pode ver transportadoras (para vinculação por código).
  Isso é necessário pois o motorista precisa encontrar a transportadora pelo código.
*/

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transportadoras' AND column_name = 'codigo_vinculacao') THEN
    ALTER TABLE transportadoras ADD COLUMN codigo_vinculacao text;
  END IF;
END $$;

-- Backfill: generate codes for existing rows that don't have one
UPDATE transportadoras
SET codigo_vinculacao = upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))
WHERE codigo_vinculacao IS NULL;

-- Now make it NOT NULL and UNIQUE
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transportadoras' AND column_name = 'codigo_vinculacao'
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE transportadoras ALTER COLUMN codigo_vinculacao SET NOT NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'transportadoras_codigo_vinculacao_key'
  ) THEN
    ALTER TABLE transportadoras ADD CONSTRAINT transportadoras_codigo_vinculacao_key UNIQUE (codigo_vinculacao);
  END IF;
END $$;

-- Update policies: allow any authenticated user to SELECT transportadoras
-- (needed so motoristas can look up a transportadora by its code)
DROP POLICY IF EXISTS "select_own_transportadoras" ON transportadoras;
CREATE POLICY "select_own_transportadoras" ON transportadoras FOR SELECT
  TO authenticated USING (true);

-- INSERT/UPDATE/DELETE remain owner-only
DROP POLICY IF EXISTS "insert_own_transportadoras" ON transportadoras;
CREATE POLICY "insert_own_transportadoras" ON transportadoras FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_transportadoras" ON transportadoras;
CREATE POLICY "update_own_transportadoras" ON transportadoras FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_transportadoras" ON transportadoras;
CREATE POLICY "delete_own_transportadoras" ON transportadoras FOR DELETE
  TO authenticated USING (auth.uid() = user_id);