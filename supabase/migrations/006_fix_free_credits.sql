-- Corrigir trigger para novos utilizadores free (5 créditos)
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
    5,
    5
  );
  RETURN NEW;
END;
$$;

-- Corrigir utilizadores free existentes que ainda têm creditos_total = 10
UPDATE public.profiles
  SET creditos_total = 5,
      creditos = LEAST(creditos, 5)
  WHERE plano = 'free' AND creditos_total = 10;
