## Configuração do Supabase

Este projeto usa **Supabase** como backend (autenticação, banco de dados, etc).

No código React, o cliente está centralizado em:

- `src/lib/supabaseClient.ts`

Esse arquivo **não deve** conter URL ou chaves sensíveis diretamente. Em vez disso, ele lê as variáveis de ambiente expostas pelo Vite:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

---

## Como configurar em ambiente local (fora do Lovable)

1. Copie o arquivo `.env.example` da raiz do projeto para `.env`:

```bash
cp .env.example .env
```

2. Edite o arquivo `.env` e preencha com os valores do seu projeto Supabase:

```bash
VITE_SUPABASE_URL="https://SEU-PROJETO.supabase.co"
VITE_SUPABASE_ANON_KEY="SEU_ANON_KEY_AQUI"
```

3. Rode o app normalmente (por exemplo, com Vite):

```bash
npm run dev
```

O Vite vai carregar automaticamente essas variáveis e o cliente definido em `src/lib/supabaseClient.ts` ficará configurado.

---

## Como configurar em produção / outros hosts

Em qualquer plataforma de deploy (Vercel, Netlify, Render, etc.), crie **variáveis de ambiente** com os mesmos nomes:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Não committe a chave secreta no código. Sempre use o painel de variáveis de ambiente da plataforma de hospedagem.

---

## Resumo da estrutura relacionada ao Supabase

- `supabase/README.md` → este guia de configuração.
- `src/lib/supabaseClient.ts` → cliente Supabase usado pelo app (auth, queries, etc.).
- `src/contexts/AuthContext.tsx` → contexto de autenticação usando o Supabase Auth.
- `src/lib/userProfilesApi.ts` → acesso à tabela `user_profiles` no Supabase.

Se você acrescentar migrations SQL, functions, etc., pode organizar aqui dentro da pasta `supabase/` (por exemplo: `supabase/sql/`, `supabase/functions/`).
