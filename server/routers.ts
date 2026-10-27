import { TRPCError } from "@trpc/server";
import { and, asc, count, desc, eq, gte, isNull, like, or, sql, type SQL } from "drizzle-orm";
import { z } from "zod";
import {
  anuncioSchema,
  artigoSchema,
  avaliacaoSchema,
  cadastroSchema,
  empresaSchema,
  leadSchema,
  loginSchema,
} from "../shared/validacao";
import { criarAnunciosExemplo } from "./anunciosExemplo";
import { COOKIE_NAME, conferirSenha, cookieOpcoes, criarToken, hashSenha } from "./auth";
import { db } from "./db";
import {
  anuncios,
  artigosBlog,
  avaliacoes,
  categorias,
  empresas,
  leads,
  mensagensChat,
  PLANOS,
  STATUS_LEAD,
  usuarios,
} from "./schema";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./trpc";

// ─── Consultas de empresas com média de avaliação ────────────────────────────

const mediaNota = sql<number>`coalesce(round(avg(${avaliacoes.nota}), 1), 0)`.mapWith(Number);
const totalAvaliacoes = sql<number>`count(${avaliacoes.id})`.mapWith(Number);
const pesoPlano = sql`case ${empresas.plano} when 'destaque' then 2 when 'premium' then 1 else 0 end`;

function selecionarEmpresas(filtro: SQL | undefined) {
  return db
    .select({
      id: empresas.id,
      nomeEmpresa: empresas.nomeEmpresa,
      descricao: empresas.descricao,
      cidade: empresas.cidade,
      whatsapp: empresas.whatsapp,
      logoUrl: empresas.logoUrl,
      plano: empresas.plano,
      categoriaId: empresas.categoriaId,
      categoriaNome: categorias.nome,
      categoriaIcone: categorias.icone,
      media: mediaNota,
      totalAvaliacoes,
    })
    .from(empresas)
    .innerJoin(categorias, eq(categorias.id, empresas.categoriaId))
    .leftJoin(avaliacoes, eq(avaliacoes.empresaId, empresas.id))
    .where(and(eq(empresas.aprovado, true), filtro))
    .groupBy(empresas.id);
}
export type EmpresaCard = Awaited<ReturnType<typeof selecionarEmpresas>>[number];

async function minhaEmpresaOuErro(usuarioId: string) {
  const empresa = await db.query.empresas.findFirst({ where: eq(empresas.usuarioId, usuarioId) });
  if (!empresa) throw new TRPCError({ code: "NOT_FOUND", message: "Cadastre sua empresa primeiro." });
  return empresa;
}

/** Garante que o usuário é o cliente do lead ou o dono da empresa. */
async function leadDoParticipante(leadId: string, usuarioId: string) {
  const lead = await db.query.leads.findFirst({
    where: eq(leads.id, leadId),
    with: { empresa: { columns: { usuarioId: true, nomeEmpresa: true, whatsapp: true } } },
  });
  if (!lead) throw new TRPCError({ code: "NOT_FOUND" });
  const ehEmpresa = lead.empresa.usuarioId === usuarioId;
  if (!ehEmpresa && lead.usuarioId !== usuarioId) throw new TRPCError({ code: "FORBIDDEN" });
  return { lead, ehEmpresa };
}

// ─── Routers ──────────────────────────────────────────────────────────────────

const authRouter = router({
  me: publicProcedure.query(({ ctx }) => ctx.usuario),

  cadastro: publicProcedure.input(cadastroSchema).mutation(async ({ ctx, input }) => {
    const existente = await db.query.usuarios.findFirst({ where: eq(usuarios.email, input.email) });
    if (existente) throw new TRPCError({ code: "CONFLICT", message: "Este e-mail já está cadastrado." });
    const [usuario] = await db
      .insert(usuarios)
      .values({
        nome: input.nome,
        email: input.email,
        senhaHash: await hashSenha(input.senha),
        tipo: input.tipo,
        telefone: input.telefone || null,
      })
      .returning({ id: usuarios.id, tipo: usuarios.tipo });
    ctx.res.cookie(COOKIE_NAME, await criarToken(usuario.id), cookieOpcoes);
    return usuario;
  }),

  login: publicProcedure.input(loginSchema).mutation(async ({ ctx, input }) => {
    const usuario = await db.query.usuarios.findFirst({ where: eq(usuarios.email, input.email) });
    if (!usuario || !(await conferirSenha(input.senha, usuario.senhaHash))) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "E-mail ou senha incorretos." });
    }
    ctx.res.cookie(COOKIE_NAME, await criarToken(usuario.id), cookieOpcoes);
    return { id: usuario.id, tipo: usuario.tipo };
  }),

  logout: publicProcedure.mutation(({ ctx }) => {
    ctx.res.clearCookie(COOKIE_NAME, { path: "/" });
    return { ok: true };
  }),
});

const categoriasRouter = router({
  listar: publicProcedure.query(() =>
    db
      .select({
        id: categorias.id,
        nome: categorias.nome,
        icone: categorias.icone,
        total: sql<number>`count(${empresas.id})`.mapWith(Number),
      })
      .from(categorias)
      .leftJoin(empresas, and(eq(empresas.categoriaId, categorias.id), eq(empresas.aprovado, true)))
      .groupBy(categorias.id)
      .orderBy(asc(categorias.nome)),
  ),
});

const empresasRouter = router({
  buscar: publicProcedure
    .input(
      z.object({
        query: z.string().trim().optional(),
        categoriaId: z.string().optional(),
        cidade: z.string().optional(),
        notaMin: z.number().min(0).max(5).optional(),
        pagina: z.number().int().min(1).default(1),
        porPagina: z.number().int().min(1).max(100).default(9),
      }),
    )
    .query(async ({ input }) => {
      const termo = input.query ? `%${input.query}%` : undefined;
      const filtro = and(
        termo
          ? or(like(empresas.nomeEmpresa, termo), like(empresas.descricao, termo), like(categorias.nome, termo))
          : undefined,
        input.categoriaId ? eq(empresas.categoriaId, input.categoriaId) : undefined,
        input.cidade ? eq(empresas.cidade, input.cidade) : undefined,
      );
      let consulta = selecionarEmpresas(filtro).$dynamic();
      if (input.notaMin) consulta = consulta.having(gte(mediaNota, input.notaMin));
      const todos = await consulta.orderBy(desc(pesoPlano), desc(mediaNota), asc(empresas.nomeEmpresa));
      const inicio = (input.pagina - 1) * input.porPagina;
      return {
        itens: todos.slice(inicio, inicio + input.porPagina),
        total: todos.length,
        paginas: Math.max(1, Math.ceil(todos.length / input.porPagina)),
      };
    }),

  cidades: publicProcedure.query(async () => {
    const linhas = await db
      .selectDistinct({ cidade: empresas.cidade })
      .from(empresas)
      .where(eq(empresas.aprovado, true))
      .orderBy(asc(empresas.cidade));
    return linhas.map((l) => l.cidade);
  }),

  destaques: publicProcedure.query(() =>
    selecionarEmpresas(eq(empresas.plano, "destaque")).orderBy(desc(mediaNota)).limit(10),
  ),

  maisBemAvaliadas: publicProcedure.query(() =>
    selecionarEmpresas(undefined)
      .having(gte(totalAvaliacoes, 1))
      .orderBy(desc(mediaNota), desc(totalAvaliacoes))
      .limit(6),
  ),

  porId: publicProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    const empresa = await db.query.empresas.findFirst({
      where: eq(empresas.id, input.id),
      with: { categoria: true },
    });
    const ehDono = empresa && ctx.usuario?.id === empresa.usuarioId;
    if (!empresa || (!empresa.aprovado && !ehDono && ctx.usuario?.tipo !== "admin")) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Empresa não encontrada." });
    }
    const [resumo] = await db
      .select({ media: mediaNota, total: totalAvaliacoes })
      .from(avaliacoes)
      .where(eq(avaliacoes.empresaId, empresa.id));
    return { ...empresa, media: resumo.media, totalAvaliacoes: resumo.total };
  }),
});

const avaliacoesRouter = router({
  listar: publicProcedure.input(z.object({ empresaId: z.string() })).query(({ input }) =>
    db.query.avaliacoes.findMany({
      where: eq(avaliacoes.empresaId, input.empresaId),
      orderBy: desc(avaliacoes.criadoEm),
      with: { usuario: { columns: { nome: true, tipo: true } } },
    }),
  ),

  // Uma avaliação por usuário/empresa: reenviar atualiza a anterior
  enviar: protectedProcedure.input(avaliacaoSchema).mutation(async ({ ctx, input }) => {
    const empresa = await db.query.empresas.findFirst({ where: eq(empresas.id, input.empresaId) });
    if (!empresa) throw new TRPCError({ code: "NOT_FOUND" });
    if (empresa.usuarioId === ctx.usuario.id) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Você não pode avaliar a própria empresa." });
    }
    const anterior = await db.query.avaliacoes.findFirst({
      where: and(eq(avaliacoes.empresaId, input.empresaId), eq(avaliacoes.usuarioId, ctx.usuario.id)),
    });
    if (anterior) {
      await db
        .update(avaliacoes)
        .set({ nota: input.nota, comentario: input.comentario || null, criadoEm: new Date() })
        .where(eq(avaliacoes.id, anterior.id));
    } else {
      await db.insert(avaliacoes).values({ ...input, comentario: input.comentario || null, usuarioId: ctx.usuario.id });
    }
    return { ok: true };
  }),
});

const leadsRouter = router({
  criar: publicProcedure.input(leadSchema).mutation(async ({ ctx, input }) => {
    const empresa = await db.query.empresas.findFirst({
      where: and(eq(empresas.id, input.empresaId), eq(empresas.aprovado, true)),
    });
    if (!empresa) throw new TRPCError({ code: "NOT_FOUND", message: "Empresa não encontrada." });
    const [lead] = await db
      .insert(leads)
      .values({ ...input, telefoneContato: input.telefoneContato || null, usuarioId: ctx.usuario?.id ?? null })
      .returning({ id: leads.id });
    return lead;
  }),

  /** Leads recebidos pela empresa do prestador logado. */
  recebidos: protectedProcedure
    .input(z.object({ status: z.enum(STATUS_LEAD).optional() }))
    .query(async ({ ctx, input }) => {
      const empresa = await db.query.empresas.findFirst({ where: eq(empresas.usuarioId, ctx.usuario.id) });
      if (!empresa) return [];
      return db.query.leads.findMany({
        where: and(eq(leads.empresaId, empresa.id), input.status ? eq(leads.status, input.status) : undefined),
        orderBy: desc(leads.criadoEm),
      });
    }),

  /** Pedidos de orçamento feitos pelo usuário logado. */
  meusPedidos: protectedProcedure.query(({ ctx }) =>
    db.query.leads.findMany({
      where: eq(leads.usuarioId, ctx.usuario.id),
      orderBy: desc(leads.criadoEm),
      with: { empresa: { columns: { id: true, nomeEmpresa: true, whatsapp: true, logoUrl: true } } },
    }),
  ),

  atualizarStatus: protectedProcedure
    .input(z.object({ id: z.string(), status: z.enum(STATUS_LEAD) }))
    .mutation(async ({ ctx, input }) => {
      const { ehEmpresa } = await leadDoParticipante(input.id, ctx.usuario.id);
      if (!ehEmpresa) throw new TRPCError({ code: "FORBIDDEN" });
      await db.update(leads).set({ status: input.status }).where(eq(leads.id, input.id));
      return { ok: true };
    }),
});

const chatRouter = router({
  mensagens: protectedProcedure.input(z.object({ leadId: z.string() })).query(async ({ ctx, input }) => {
    const { lead } = await leadDoParticipante(input.leadId, ctx.usuario.id);
    const mensagens = await db.query.mensagensChat.findMany({
      where: eq(mensagensChat.leadId, input.leadId),
      orderBy: asc(mensagensChat.criadoEm),
      with: { remetente: { columns: { nome: true } } },
    });
    return { lead, mensagens };
  }),

  enviar: protectedProcedure
    .input(z.object({ leadId: z.string(), mensagem: z.string().trim().min(1).max(2000) }))
    .mutation(async ({ ctx, input }) => {
      const { lead, ehEmpresa } = await leadDoParticipante(input.leadId, ctx.usuario.id);
      await db.insert(mensagensChat).values({ ...input, remetenteId: ctx.usuario.id });
      if (ehEmpresa && lead.status === "novo") {
        await db.update(leads).set({ status: "respondido" }).where(eq(leads.id, lead.id));
      }
      return { ok: true };
    }),
});

const painelRouter = router({
  minhaEmpresa: protectedProcedure.query(async ({ ctx }) => {
    const empresa = await db.query.empresas.findFirst({
      where: eq(empresas.usuarioId, ctx.usuario.id),
      with: { categoria: true },
    });
    if (!empresa) return null;
    const [resumo] = await db
      .select({ media: mediaNota, total: totalAvaliacoes })
      .from(avaliacoes)
      .where(eq(avaliacoes.empresaId, empresa.id));
    const porStatus = await db
      .select({ status: leads.status, total: count() })
      .from(leads)
      .where(eq(leads.empresaId, empresa.id))
      .groupBy(leads.status);
    return {
      ...empresa,
      media: resumo.media,
      totalAvaliacoes: resumo.total,
      leadsPorStatus: Object.fromEntries(porStatus.map((s) => [s.status, s.total])) as Record<string, number>,
    };
  }),

  salvarEmpresa: protectedProcedure.input(empresaSchema).mutation(async ({ ctx, input }) => {
    if (ctx.usuario.tipo !== "prestador" && ctx.usuario.tipo !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: "Apenas contas de prestador podem cadastrar empresas." });
    }
    const dados = { ...input, endereco: input.endereco || null, logoUrl: input.logoUrl || null };
    const atual = await db.query.empresas.findFirst({ where: eq(empresas.usuarioId, ctx.usuario.id) });
    if (atual) {
      await db.update(empresas).set(dados).where(eq(empresas.id, atual.id));
      return { id: atual.id, nova: false };
    }
    // Novas empresas aguardam aprovação da moderação
    const [nova] = await db
      .insert(empresas)
      .values({ ...dados, usuarioId: ctx.usuario.id })
      .returning({ id: empresas.id });
    return { id: nova.id, nova: true };
  }),

  // MVP: troca de plano imediata. Integrar gateway de pagamento antes de cobrar de verdade.
  alterarPlano: protectedProcedure.input(z.object({ plano: z.enum(PLANOS) })).mutation(async ({ ctx, input }) => {
    const empresa = await minhaEmpresaOuErro(ctx.usuario.id);
    await db.update(empresas).set({ plano: input.plano }).where(eq(empresas.id, empresa.id));
    return { ok: true };
  }),
});

const blogRouter = router({
  listar: publicProcedure
    .input(z.object({ categoria: z.string().optional(), limite: z.number().int().max(50).optional() }))
    .query(({ input }) =>
      db.query.artigosBlog.findMany({
        where: and(
          eq(artigosBlog.publicado, true),
          input.categoria ? eq(artigosBlog.categoria, input.categoria) : undefined,
        ),
        orderBy: desc(artigosBlog.criadoEm),
        limit: input.limite,
        columns: { conteudo: false },
      }),
    ),

  categorias: publicProcedure.query(async () => {
    const linhas = await db
      .selectDistinct({ categoria: artigosBlog.categoria })
      .from(artigosBlog)
      .where(eq(artigosBlog.publicado, true))
      .orderBy(asc(artigosBlog.categoria));
    return linhas.map((l) => l.categoria);
  }),

  porId: publicProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    const artigo = await db.query.artigosBlog.findFirst({
      where: eq(artigosBlog.id, input.id),
      with: { autor: { columns: { nome: true } } },
    });
    if (!artigo || (!artigo.publicado && ctx.usuario?.tipo !== "admin")) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Artigo não encontrado." });
    }
    return artigo;
  }),
});

const anunciosRouter = router({
  /** Anúncios ativos de um espaço; na categoria, os segmentados vêm primeiro. */
  listar: publicProcedure
    .input(
      z.object({
        posicao: z.enum(["home", "servicos", "blog"]),
        formato: z.enum(["horizontal", "lateral"]),
        categoriaId: z.string().optional(),
      }),
    )
    .query(({ input }) =>
      db
        .select()
        .from(anuncios)
        .where(
          and(
            eq(anuncios.ativo, true),
            eq(anuncios.posicao, input.posicao),
            eq(anuncios.formato, input.formato),
            input.categoriaId
              ? or(isNull(anuncios.categoriaId), eq(anuncios.categoriaId, input.categoriaId))
              : isNull(anuncios.categoriaId),
          ),
        )
        .orderBy(sql`${anuncios.categoriaId} is null`, sql`random()`),
    ),

  registrarClique: publicProcedure.input(z.object({ id: z.string() })).mutation(async ({ input }) => {
    await db
      .update(anuncios)
      .set({ cliques: sql`${anuncios.cliques} + 1` })
      .where(eq(anuncios.id, input.id));
    return { ok: true };
  }),
});

const adminRouter = router({
  empresas: adminProcedure.query(() =>
    db.query.empresas.findMany({
      orderBy: [asc(empresas.aprovado), desc(empresas.criadoEm)],
      with: { categoria: { columns: { nome: true } }, usuario: { columns: { nome: true, email: true } } },
    }),
  ),
  definirAprovacao: adminProcedure
    .input(z.object({ id: z.string(), aprovado: z.boolean() }))
    .mutation(async ({ input }) => {
      await db.update(empresas).set({ aprovado: input.aprovado }).where(eq(empresas.id, input.id));
      return { ok: true };
    }),

  artigos: adminProcedure.query(() =>
    db.query.artigosBlog.findMany({ orderBy: desc(artigosBlog.criadoEm) }),
  ),
  salvarArtigo: adminProcedure.input(artigoSchema).mutation(async ({ ctx, input }) => {
    const { id, ...dados } = input;
    const valores = { ...dados, resumo: dados.resumo || null, imagemUrl: dados.imagemUrl || null };
    if (id) {
      await db.update(artigosBlog).set(valores).where(eq(artigosBlog.id, id));
      return { id };
    }
    const [novo] = await db
      .insert(artigosBlog)
      .values({ ...valores, autorId: ctx.usuario.id })
      .returning({ id: artigosBlog.id });
    return novo;
  }),
  excluirArtigo: adminProcedure.input(z.object({ id: z.string() })).mutation(async ({ input }) => {
    await db.delete(artigosBlog).where(eq(artigosBlog.id, input.id));
    return { ok: true };
  }),

  anuncios: adminProcedure.query(() =>
    db.query.anuncios.findMany({
      orderBy: [asc(anuncios.posicao), desc(anuncios.criadoEm)],
      with: { categoria: { columns: { nome: true } } },
    }),
  ),
  salvarAnuncio: adminProcedure.input(anuncioSchema).mutation(async ({ input }) => {
    const { id, ...dados } = input;
    const valores = {
      ...dados,
      categoriaId: dados.categoriaId || null,
      texto: dados.texto || null,
      anunciante: dados.anunciante || null,
      cta: dados.cta || null,
      preco: dados.preco || null,
      imagemUrl: dados.imagemUrl || null,
      icone: dados.icone || null,
    };
    if (id) await db.update(anuncios).set(valores).where(eq(anuncios.id, id));
    else await db.insert(anuncios).values(valores);
    return { ok: true };
  }),
  alternarAnuncio: adminProcedure
    .input(z.object({ id: z.string(), ativo: z.boolean() }))
    .mutation(async ({ input }) => {
      await db.update(anuncios).set({ ativo: input.ativo }).where(eq(anuncios.id, input.id));
      return { ok: true };
    }),
  excluirAnuncio: adminProcedure.input(z.object({ id: z.string() })).mutation(async ({ input }) => {
    await db.delete(anuncios).where(eq(anuncios.id, input.id));
    return { ok: true };
  }),
  criarAnunciosExemplo: adminProcedure.mutation(() => ({ criados: criarAnunciosExemplo() })),
});

export const appRouter = router({
  auth: authRouter,
  categorias: categoriasRouter,
  empresas: empresasRouter,
  avaliacoes: avaliacoesRouter,
  leads: leadsRouter,
  chat: chatRouter,
  painel: painelRouter,
  blog: blogRouter,
  anuncios: anunciosRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
