# Próximos passos — Click Comércio

Situação em 27/10/2026.

## Feito
- MVP completo do PRD (busca, empresas, avaliações, orçamentos, chat, WhatsApp, painel da empresa, blog, admin).
- Espaços publicitários: banners centrais e laterais na Home, por categoria na busca, lateral na página da empresa, blog; página `/anuncie`; gestão de anúncios no `/admin` com botão "Criar anúncios de exemplo".
- Deploy no Easypanel via Dockerfile (projeto `gestao`, serviço `click-comercio`, fonte Git `git@github.com:Wiisite/click-comercio`, ramo `main`).

## Pendente no Easypanel
- [ ] Trocar as variáveis de Ambiente, que ainda estão com os textos de exemplo:
      `AUTH_SECRET` (valor aleatório longo), `ADMIN_EMAIL` (e-mail real), `ADMIN_SENHA` (senha real, 8+ caracteres) → Salvar → Implantar.
- [ ] Conferir volume montado em `/app/data` (senão o banco é apagado a cada implantação).
- [ ] Conferir domínio apontando para a porta `3000`.
- [ ] Entrar em `/admin` → Anúncios → "Criar anúncios de exemplo" (clicar uma vez só).
- [ ] Opcional: ativar implantação automática ou passar o Deploy Webhook.

## Pendente no código
- [ ] Remover a conta admin de exemplo `seu-email@dominio.com` criada com as variáveis provisórias.
- [ ] Ajustar preços dos formatos de anúncio (`FORMATOS_VENDA` em `shared/validacao.ts`).
- [ ] Ajustar WhatsApp/e-mail comercial (topo de `client/src/pages/Anuncie.tsx`).
- [ ] Pagamento dos planos das empresas (hoje o upgrade é imediato e sem cobrança).
- [ ] Upload de imagens (logo e banners hoje são por URL).
- [ ] Recuperação de senha.
- [ ] App mobile com push de novos leads.
