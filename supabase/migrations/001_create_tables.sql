-- Tabela profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email text,
  nome text,
  plano text DEFAULT 'free' CHECK (plano IN ('free', 'starter', 'pro', 'agency')),
  creditos integer DEFAULT 10,
  creditos_total integer DEFAULT 10,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela videos
CREATE TABLE IF NOT EXISTS public.videos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  prompt_original text,
  prompt_otimizado text,
  duracao integer DEFAULT 5 CHECK (duracao >= 1 AND duracao <= 20),
  creditos_gastos integer,
  qualidade text DEFAULT 'std' CHECK (qualidade IN ('std', 'pro')),
  video_url text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela planos
CREATE TABLE IF NOT EXISTS public.planos (
  id text PRIMARY KEY,
  nome text NOT NULL,
  preco numeric(10,2) NOT NULL,
  creditos_mensais integer NOT NULL,
  qualidade text NOT NULL
);

-- Activar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planos ENABLE ROW LEVEL SECURITY;

-- Policies para profiles
CREATE POLICY "Utilizador vê o seu próprio perfil"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Utilizador edita o seu próprio perfil"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Policies para videos
CREATE POLICY "Utilizador vê os seus próprios vídeos"
  ON public.videos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Utilizador insere os seus próprios vídeos"
  ON public.videos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Utilizador atualiza os seus próprios vídeos"
  ON public.videos FOR UPDATE
  USING (auth.uid() = user_id);

-- Planos são públicos (leitura)
CREATE POLICY "Planos são públicos"
  ON public.planos FOR SELECT
  USING (true);

-- Índices
CREATE INDEX IF NOT EXISTS videos_user_id_idx ON public.videos(user_id);
CREATE INDEX IF NOT EXISTS videos_status_idx ON public.videos(status);
CREATE INDEX IF NOT EXISTS videos_created_at_idx ON public.videos(created_at DESC);
