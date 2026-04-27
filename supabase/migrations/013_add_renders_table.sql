-- Tabela de renders IA
CREATE TABLE IF NOT EXISTS public.renders (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  input_image_url text,
  render_url text,
  style text NOT NULL DEFAULT '',
  prompt_original text NOT NULL DEFAULT '',
  prompt_otimizado text NOT NULL DEFAULT '',
  creditos_gastos integer DEFAULT 30,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  fal_request_id text,
  modelo_usado text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.renders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Utilizador vê os seus renders"
  ON public.renders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Utilizador cria renders"
  ON public.renders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Utilizador atualiza renders"
  ON public.renders FOR UPDATE
  USING (auth.uid() = user_id);

-- Bucket para renders (executar manualmente no dashboard Supabase Storage se necessário)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('renders', 'renders', true) ON CONFLICT DO NOTHING;
