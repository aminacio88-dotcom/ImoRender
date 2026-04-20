# ImoRender

Plataforma SaaS para consultores imobiliários portugueses gerarem vídeos com IA a partir de fotos de imóveis.

## Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Next.js API Routes
- **Base de dados + Auth**: Supabase
- **Geração de vídeo**: Fal.ai (kling-video-v2-5-image-to-video)
- **Otimização de prompts**: Anthropic Claude API
- **Deploy**: Netlify

## Instalação local

```bash
git clone https://github.com/SEU_UTILIZADOR/imorender.git
cd imorender
npm install
cp .env.example .env.local
# Editar .env.local com os teus valores
npm run dev
```

## Variáveis de ambiente

Copiar `.env.example` para `.env.local` e preencher:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
FAL_KEY=
ANTHROPIC_API_KEY=
```

## Base de dados Supabase

Executar os ficheiros SQL em `supabase/migrations/` no editor SQL do Supabase:

1. `001_create_tables.sql`
2. `002_insert_planos.sql`
3. `003_create_trigger.sql`

## Deploy no Netlify

1. Push para GitHub
2. Netlify > Add new site > Import an existing project
3. Ligar ao repositório `imorender`
4. Build settings são lidas do `netlify.toml`
5. Adicionar environment variables em Site settings > Environment variables
6. Deploy

## Planos

| Plano   | Preço  | Créditos/mês | Qualidade |
|---------|--------|--------------|-----------|
| Free    | 0      | 10           | STD       |
| Starter | 19.99  | 150          | STD       |
| Pro     | 39.99  | 400          | PRO       |
| Agency  | 79.99  | 900          | PRO       |
