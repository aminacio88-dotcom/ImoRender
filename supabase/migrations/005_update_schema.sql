-- Adicionar campos à tabela videos
ALTER TABLE public.videos
  ADD COLUMN IF NOT EXISTS modo text DEFAULT 'standard' CHECK (modo IN ('standard', 'pro', 'antes_depois', 'video_video')),
  ADD COLUMN IF NOT EXISTS tail_image_url text,
  ADD COLUMN IF NOT EXISTS video_input_url text,
  ADD COLUMN IF NOT EXISTS aspect_ratio text DEFAULT '16:9' CHECK (aspect_ratio IN ('16:9', '9:16', '1:1')),
  ADD COLUMN IF NOT EXISTS modelo_usado text;

-- Atualizar planos existentes
UPDATE public.planos SET creditos_mensais = 5    WHERE id = 'free';
UPDATE public.planos SET creditos_mensais = 120  WHERE id = 'starter';
UPDATE public.planos SET creditos_mensais = 300  WHERE id = 'pro';
UPDATE public.planos SET creditos_mensais = 700  WHERE id = 'agency';

-- Inserir plano Enterprise
INSERT INTO public.planos (id, nome, preco, creditos_mensais, qualidade)
VALUES ('enterprise', 'Enterprise', 299.00, 3500, 'pro')
ON CONFLICT (id) DO UPDATE SET
  nome = EXCLUDED.nome,
  preco = EXCLUDED.preco,
  creditos_mensais = EXCLUDED.creditos_mensais,
  qualidade = EXCLUDED.qualidade;

-- Tabela creditos_extra
CREATE TABLE IF NOT EXISTS public.creditos_extra (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  pack text CHECK (pack IN ('small', 'medium', 'large')),
  creditos integer,
  preco numeric(10,2),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.creditos_extra ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Utilizador vê as suas compras"
  ON public.creditos_extra FOR SELECT
  USING (auth.uid() = user_id);

-- Tabela packs_creditos
CREATE TABLE IF NOT EXISTS public.packs_creditos (
  id text PRIMARY KEY,
  nome text NOT NULL,
  creditos integer NOT NULL,
  preco numeric(10,2) NOT NULL
);

ALTER TABLE public.packs_creditos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Packs são públicos"
  ON public.packs_creditos FOR SELECT
  USING (true);

INSERT INTO public.packs_creditos (id, nome, creditos, preco) VALUES
  ('small',  'Small',  20,  3.99),
  ('medium', 'Medium', 50,  7.99),
  ('large',  'Large',  150, 19.99)
ON CONFLICT (id) DO UPDATE SET
  nome = EXCLUDED.nome,
  creditos = EXCLUDED.creditos,
  preco = EXCLUDED.preco;
