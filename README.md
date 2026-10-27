# Click Comércio — MVP

Marketplace + portal de conteúdo que conecta síndicos, administradoras e moradores a prestadores de serviço para condomínios.

**Stack:** React 19 + Vite + Tailwind v4 + wouter · Express + tRPC + Zod · Drizzle ORM + SQLite (better-sqlite3) · Auth com JWT em cookie httpOnly.

## Rodando

```bash
pnpm install
cp .env.example .env      # ajuste AUTH_SECRET
pnpm db:seed              # cria o banco e popula com dados de exemplo
pnpm dev                  # web em http://localhost:5173 (API na 3001)
```

Produção: `pnpm build && pnpm start` (um único servidor entrega API + front na porta `PORT`).
As migrações em `drizzle/` são aplicadas automaticamente na inicialização. Após alterar `server/schema.ts`, rode `npx drizzle-kit generate`.

### Contas de exemplo (senha `senha1234`)
| E-mail | Perfil |
|---|---|
| admin@clickcomercio.com.br | Admin (aprova empresas, blog, anúncios) |
| sindico@exemplo.com | Síndico |
| prestador1@exemplo.com | Prestador (Ascende Elevadores, com leads) |
| pendente@exemplo.com | Prestador com empresa aguardando aprovação |

## Estrutura
```
server/   schema.ts (tabelas do PRD) · routers.ts (API tRPC) · auth.ts · seed.ts · index.ts
shared/   validacao.ts (schemas Zod usados no front e no back, planos, link do WhatsApp)
client/   src/pages (Home, Servicos, Empresa, Auth, Dashboard, MeusPedidos, Blog, Artigo, Admin)
          src/components (Layout, EmpresaCard, LeadModal, Chat, Estrelas, Anuncio…)
drizzle/  migrações SQL
```

## Rotas
`/` · `/servicos?query=&categoria=&cidade=&nota=` · `/empresa/:id` · `/login` · `/cadastro` · `/dashboard` · `/meus-pedidos` · `/blog` · `/blog/:id` · `/admin`

## Decisões e desvios do PRD
- `usuarios.tipo` ganhou o valor `admin` para moderação.
- `leads.usuario_id` é opcional e o lead guarda nome/e-mail/telefone de contato, permitindo orçamento sem conta. O chat só fica disponível quando o cliente tem conta.
- Campos extras: `empresas.logo_url`, `artigos_blog.resumo/categoria/imagem_url/destaque`, tabela `anuncios`.
- Avaliação: 1 por usuário por empresa (reenviar atualiza); o dono não avalia a própria empresa.
- Ordenação da busca: Destaque > Premium > Free, depois nota média.
- Chat por polling (5 s) — trocar por WebSocket/SSE se necessário.

## Pendências (fora do MVP)
- **Pagamento dos planos:** hoje o upgrade é imediato e sem cobrança (`painel.alterarPlano`). Integrar gateway (Stripe, Mercado Pago, Asaas).
- Upload de logo/imagens (hoje é por URL).
- Recuperação de senha e verificação de e-mail.
- App mobile (React Native/Flutter) com push de novos leads — a API tRPC já serve de backend.
- Para MySQL em produção: trocar `sqlite-core` por `mysql-core` em `schema.ts` e o driver em `db.ts`.
