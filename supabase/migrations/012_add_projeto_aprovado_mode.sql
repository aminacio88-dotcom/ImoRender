-- Adicionar modo projeto_aprovado ao CHECK constraint da coluna modo
ALTER TABLE public.videos
  DROP CONSTRAINT IF EXISTS videos_modo_check;

ALTER TABLE public.videos
  ADD CONSTRAINT videos_modo_check
  CHECK (modo IN ('standard', 'pro', 'antes_depois', 'video_video', 'projeto_aprovado'));
