-- Atualizar planos com novos preços e créditos x10
UPDATE public.planos SET preco = 0,      creditos_mensais = 50    WHERE id = 'free';
UPDATE public.planos SET nome = 'Starter', preco = 24.99, creditos_mensais = 1000  WHERE id = 'starter';
UPDATE public.planos SET nome = 'Agency',  preco = 169.99, creditos_mensais = 12000 WHERE id = 'agency';

-- Inserir plano Team (novo)
INSERT INTO public.planos (id, nome, preco, creditos_mensais, qualidade)
VALUES ('team', 'Team', 59.99, 4000, 'pro')
ON CONFLICT (id) DO UPDATE SET
  nome = 'Team', preco = 59.99, creditos_mensais = 4000, qualidade = 'pro';

-- Remover planos que já não existem
DELETE FROM public.planos WHERE id IN ('pro', 'enterprise');

-- Atualizar constraint de plano para incluir 'team'
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_plano_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_plano_check
  CHECK (plano IN ('free', 'starter', 'team', 'agency', 'pro', 'enterprise'));

-- Atualizar trigger de novo utilizador para 50 créditos
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nome, plano, creditos, creditos_total)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)),
    'free',
    50,
    50
  );
  RETURN NEW;
END;
$$;

-- Escalar créditos dos utilizadores free existentes para x10
-- (5 créditos antigos = 50 novos — mantém poder de compra equivalente)
UPDATE public.profiles
  SET creditos_total = 50,
      creditos = LEAST(creditos * 10, 50)
  WHERE plano = 'free';

-- Atualizar defaults da tabela
ALTER TABLE public.profiles
  ALTER COLUMN creditos       SET DEFAULT 50,
  ALTER COLUMN creditos_total SET DEFAULT 50;

-- Inserir packs com novos valores
INSERT INTO public.packs_creditos (id, nome, creditos, preco) VALUES
  ('small',  'Small',  200,  3.99),
  ('medium', 'Medium', 500,  7.99),
  ('large',  'Large',  1500, 19.99)
ON CONFLICT (id) DO UPDATE SET
  creditos = EXCLUDED.creditos,
  preco    = EXCLUDED.preco;
