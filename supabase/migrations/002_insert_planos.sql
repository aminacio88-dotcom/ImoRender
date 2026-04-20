INSERT INTO public.planos (id, nome, preco, creditos_mensais, qualidade) VALUES
  ('free',    'Free',    0.00,  10,  'std'),
  ('starter', 'Starter', 19.99, 150, 'std'),
  ('pro',     'Pro',     39.99, 400, 'pro'),
  ('agency',  'Agency',  79.99, 900, 'pro')
ON CONFLICT (id) DO UPDATE SET
  nome = EXCLUDED.nome,
  preco = EXCLUDED.preco,
  creditos_mensais = EXCLUDED.creditos_mensais,
  qualidade = EXCLUDED.qualidade;
