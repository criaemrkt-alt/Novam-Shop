# Novam Shop

MicroSaaS B2B para pequenos lojistas criarem catálogos profissionais e receberem pedidos organizados pelo WhatsApp.

## Requisitos

- Node.js 20.9 ou superior
- npm
- Supabase CLI (opcional, para o ambiente local)

## Desenvolvimento

```bash
npm install
cp .env.example .env.local
npm run dev
```

Preencha `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` em `.env.local` antes de usar recursos do Supabase. A URL pública do projeto já está indicada no exemplo.

## Verificações

```bash
npm run lint
npm run typecheck
npm run build
```

## Estrutura

- `src/app`: rotas e estilos globais do App Router.
- `src/lib/supabase`: clientes Supabase para navegador e servidor.
- `supabase`: configuração local, seed e migrations versionadas.
- `docs`: escopo, design system e documentação do banco.

Leia [docs/MVP.md](docs/MVP.md) antes de propor funcionalidades. O SQL em `supabase/migrations` não deve ser aplicado ao ambiente remoto sem revisão prévia.
