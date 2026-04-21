-- Corrigir constraint de plano para incluir enterprise
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_plano_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_plano_check
  CHECK (plano IN ('free', 'starter', 'pro', 'agency', 'enterprise'));

-- Corrigir constraint de duração para permitir até 30s
ALTER TABLE public.videos
  DROP CONSTRAINT IF EXISTS videos_duracao_check;

ALTER TABLE public.videos
  ADD CONSTRAINT videos_duracao_check
  CHECK (duracao >= 1 AND duracao <= 30);

-- Corrigir defaults da tabela profiles para 5 créditos
ALTER TABLE public.profiles
  ALTER COLUMN creditos SET DEFAULT 5,
  ALTER COLUMN creditos_total SET DEFAULT 5;
