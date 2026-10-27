import { relations, sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

const id = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());
const criadoEm = () =>
  integer("criado_em", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`);

export const TIPOS_USUARIO = ["sindico", "administradora", "prestador", "morador", "admin"] as const;
export const PLANOS = ["free", "premium", "destaque"] as const;
export const STATUS_LEAD = ["novo", "respondido", "fechado"] as const;

export const usuarios = sqliteTable("usuarios", {
  id: id(),
  nome: text("nome", { length: 100 }).notNull(),
  email: text("email", { length: 255 }).notNull().unique(),
  senhaHash: text("senha_hash", { length: 255 }).notNull(),
  // "admin" é uma extensão do PRD para moderação (aprovar empresas, publicar artigos)
  tipo: text("tipo", { enum: TIPOS_USUARIO }).notNull(),
  telefone: text("telefone", { length: 20 }),
  criadoEm: criadoEm(),
});

export const categorias = sqliteTable("categorias", {
  id: id(),
  nome: text("nome", { length: 100 }).notNull(),
  icone: text("icone", { length: 100 }),
});

export const empresas = sqliteTable("empresas", {
  id: id(),
  usuarioId: text("usuario_id")
    .notNull()
    .references(() => usuarios.id, { onDelete: "cascade" }),
  nomeEmpresa: text("nome_empresa", { length: 150 }).notNull(),
  descricao: text("descricao").notNull(),
  categoriaId: text("categoria_id")
    .notNull()
    .references(() => categorias.id),
  telefone: text("telefone", { length: 20 }).notNull(),
  whatsapp: text("whatsapp", { length: 20 }).notNull(),
  email: text("email", { length: 255 }).notNull(),
  endereco: text("endereco", { length: 255 }),
  cidade: text("cidade", { length: 100 }).notNull(),
  logoUrl: text("logo_url", { length: 500 }),
  plano: text("plano", { enum: PLANOS }).notNull().default("free"),
  aprovado: integer("aprovado", { mode: "boolean" }).notNull().default(false),
  criadoEm: criadoEm(),
});

export const avaliacoes = sqliteTable("avaliacoes", {
  id: id(),
  empresaId: text("empresa_id")
    .notNull()
    .references(() => empresas.id, { onDelete: "cascade" }),
  usuarioId: text("usuario_id")
    .notNull()
    .references(() => usuarios.id, { onDelete: "cascade" }),
  nota: integer("nota").notNull(),
  comentario: text("comentario"),
  criadoEm: criadoEm(),
});

export const leads = sqliteTable("leads", {
  id: id(),
  empresaId: text("empresa_id")
    .notNull()
    .references(() => empresas.id, { onDelete: "cascade" }),
  // Opcional para permitir orçamento de visitantes sem conta (dados de contato abaixo)
  usuarioId: text("usuario_id").references(() => usuarios.id, { onDelete: "set null" }),
  nomeContato: text("nome_contato", { length: 100 }).notNull(),
  emailContato: text("email_contato", { length: 255 }).notNull(),
  telefoneContato: text("telefone_contato", { length: 20 }),
  mensagem: text("mensagem").notNull(),
  status: text("status", { enum: STATUS_LEAD }).notNull().default("novo"),
  criadoEm: criadoEm(),
});

export const mensagensChat = sqliteTable("mensagens_chat", {
  id: id(),
  leadId: text("lead_id")
    .notNull()
    .references(() => leads.id, { onDelete: "cascade" }),
  remetenteId: text("remetente_id")
    .notNull()
    .references(() => usuarios.id, { onDelete: "cascade" }),
  mensagem: text("mensagem").notNull(),
  criadoEm: criadoEm(),
});

export const artigosBlog = sqliteTable("artigos_blog", {
  id: id(),
  titulo: text("titulo", { length: 200 }).notNull(),
  resumo: text("resumo", { length: 300 }),
  conteudo: text("conteudo").notNull(),
  categoria: text("categoria", { length: 60 }).notNull().default("Gestão"),
  imagemUrl: text("imagem_url", { length: 500 }),
  destaque: integer("destaque", { mode: "boolean" }).notNull().default(false),
  autorId: text("autor_id").references(() => usuarios.id, { onDelete: "set null" }),
  publicado: integer("publicado", { mode: "boolean" }).notNull().default(false),
  criadoEm: criadoEm(),
});

// Funcionalidade 10 do PRD: espaços de anúncio vendidos para produtos e serviços
export const POSICOES_ANUNCIO = ["home", "servicos", "blog"] as const;
export const FORMATOS_ANUNCIO = ["horizontal", "lateral"] as const;
export const TEMAS_ANUNCIO = ["marca", "coral", "verde", "azul", "escuro"] as const;

export const anuncios = sqliteTable("anuncios", {
  id: id(),
  titulo: text("titulo", { length: 120 }).notNull(),
  texto: text("texto", { length: 255 }),
  link: text("link", { length: 500 }).notNull(),
  posicao: text("posicao", { enum: POSICOES_ANUNCIO }).notNull(),
  formato: text("formato", { enum: FORMATOS_ANUNCIO }).notNull().default("horizontal"),
  // Quando preenchido, o anúncio aparece só nas páginas dessa categoria
  categoriaId: text("categoria_id").references(() => categorias.id, { onDelete: "set null" }),
  anunciante: text("anunciante", { length: 100 }),
  cta: text("cta", { length: 40 }),
  preco: text("preco", { length: 40 }),
  imagemUrl: text("imagem_url", { length: 500 }),
  icone: text("icone", { length: 40 }),
  tema: text("tema", { enum: TEMAS_ANUNCIO }).notNull().default("marca"),
  cliques: integer("cliques").notNull().default(0),
  ativo: integer("ativo", { mode: "boolean" }).notNull().default(true),
  criadoEm: criadoEm(),
});

export const usuariosRelations = relations(usuarios, ({ many }) => ({
  empresas: many(empresas),
}));
export const categoriasRelations = relations(categorias, ({ many }) => ({
  empresas: many(empresas),
}));
export const empresasRelations = relations(empresas, ({ one, many }) => ({
  usuario: one(usuarios, { fields: [empresas.usuarioId], references: [usuarios.id] }),
  categoria: one(categorias, { fields: [empresas.categoriaId], references: [categorias.id] }),
  avaliacoes: many(avaliacoes),
  leads: many(leads),
}));
export const avaliacoesRelations = relations(avaliacoes, ({ one }) => ({
  empresa: one(empresas, { fields: [avaliacoes.empresaId], references: [empresas.id] }),
  usuario: one(usuarios, { fields: [avaliacoes.usuarioId], references: [usuarios.id] }),
}));
export const leadsRelations = relations(leads, ({ one, many }) => ({
  empresa: one(empresas, { fields: [leads.empresaId], references: [empresas.id] }),
  usuario: one(usuarios, { fields: [leads.usuarioId], references: [usuarios.id] }),
  mensagens: many(mensagensChat),
}));
export const mensagensChatRelations = relations(mensagensChat, ({ one }) => ({
  lead: one(leads, { fields: [mensagensChat.leadId], references: [leads.id] }),
  remetente: one(usuarios, { fields: [mensagensChat.remetenteId], references: [usuarios.id] }),
}));
export const anunciosRelations = relations(anuncios, ({ one }) => ({
  categoria: one(categorias, { fields: [anuncios.categoriaId], references: [categorias.id] }),
}));
export const artigosBlogRelations = relations(artigosBlog, ({ one }) => ({
  autor: one(usuarios, { fields: [artigosBlog.autorId], references: [usuarios.id] }),
}));
