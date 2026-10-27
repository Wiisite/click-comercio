import { z } from "zod";

export const tiposCadastro = ["sindico", "administradora", "prestador", "morador"] as const;

export const rotuloTipo: Record<string, string> = {
  sindico: "Síndico",
  administradora: "Administradora",
  prestador: "Prestador de serviço",
  morador: "Morador",
  admin: "Administrador",
};

const telefone = z
  .string()
  .trim()
  .regex(/^[\d\s()+-]{8,20}$/, "Telefone inválido");

export const loginSchema = z.object({
  email: z.email("Informe um e-mail válido").trim().toLowerCase(),
  senha: z.string().min(8, "A senha deve ter no mínimo 8 caracteres"),
});

export const cadastroSchema = loginSchema.extend({
  nome: z.string().trim().min(2, "Informe seu nome").max(100),
  tipo: z.enum(tiposCadastro),
  telefone: telefone.optional().or(z.literal("")),
});

export const empresaSchema = z.object({
  nomeEmpresa: z.string().trim().min(2, "Informe o nome da empresa").max(150),
  descricao: z.string().trim().min(20, "Descreva sua empresa (mínimo 20 caracteres)"),
  categoriaId: z.string().min(1, "Escolha uma categoria"),
  telefone,
  whatsapp: telefone,
  email: z.email("Informe um e-mail válido").trim(),
  endereco: z.string().trim().max(255).optional().or(z.literal("")),
  cidade: z.string().trim().min(2, "Informe a cidade").max(100),
  logoUrl: z.url("URL inválida").optional().or(z.literal("")),
});

export const leadSchema = z.object({
  empresaId: z.string(),
  nomeContato: z.string().trim().min(2, "Informe seu nome").max(100),
  emailContato: z.email("Informe um e-mail válido").trim(),
  telefoneContato: telefone.optional().or(z.literal("")),
  mensagem: z.string().trim().min(10, "Descreva o que precisa (mínimo 10 caracteres)"),
});

export const avaliacaoSchema = z.object({
  empresaId: z.string(),
  nota: z.number().int().min(1).max(5),
  comentario: z.string().trim().max(1000).optional(),
});

export const artigoSchema = z.object({
  id: z.string().optional(),
  titulo: z.string().trim().min(5).max(200),
  resumo: z.string().trim().max(300).optional(),
  conteudo: z.string().trim().min(20),
  categoria: z.string().trim().min(2).max(60),
  imagemUrl: z.url().optional().or(z.literal("")),
  destaque: z.boolean(),
  publicado: z.boolean(),
});

export const anuncioSchema = z.object({
  id: z.string().optional(),
  titulo: z.string().trim().min(3, "Informe o título").max(120),
  texto: z.string().trim().max(255).optional(),
  link: z.url("Link inválido"),
  posicao: z.enum(["home", "servicos", "blog"]),
  formato: z.enum(["horizontal", "lateral"]),
  categoriaId: z.string().optional(),
  anunciante: z.string().trim().max(100).optional(),
  cta: z.string().trim().max(40).optional(),
  preco: z.string().trim().max(40).optional(),
  imagemUrl: z.url("URL da imagem inválida").optional().or(z.literal("")),
  icone: z.string().max(40).optional(),
  tema: z.enum(["marca", "coral", "verde", "azul", "escuro"]),
});

/** Formatos vendidos na página /anuncie (valores de referência — ajuste à sua tabela). */
export const FORMATOS_VENDA = [
  {
    id: "home-central",
    nome: "Banner central da Home",
    onde: "Página inicial, entre as seções principais",
    medida: "1200 × 250 px",
    preco: "R$ 490/mês",
  },
  {
    id: "home-lateral",
    nome: "Banner lateral da Home",
    onde: "Coluna ao lado das empresas mais bem avaliadas",
    medida: "300 × 400 px",
    preco: "R$ 290/mês",
  },
  {
    id: "categoria",
    nome: "Patrocinador de categoria",
    onde: "Topo e lateral da categoria escolhida + páginas das empresas dela",
    medida: "1200 × 250 px e 300 × 400 px",
    preco: "R$ 390/mês",
  },
  {
    id: "blog",
    nome: "Banner no Blog",
    onde: "Lista de artigos e final de cada artigo",
    medida: "1200 × 250 px",
    preco: "R$ 190/mês",
  },
] as const;

export const PLANOS_INFO = {
  free: { nome: "Free", preco: "Grátis", beneficios: ["Perfil na busca", "Receber orçamentos", "Avaliações de clientes"] },
  premium: {
    nome: "Premium",
    preco: "R$ 79/mês",
    beneficios: ["Tudo do Free", "Prioridade na busca", "Selo Premium", "Chat com clientes"],
  },
  destaque: {
    nome: "Destaque",
    preco: "R$ 149/mês",
    beneficios: ["Tudo do Premium", "Carrossel da Home", "Topo da busca", "Selo Destaque"],
  },
} as const;

/** Monta o link wa.me com a mensagem padrão do PRD. */
export function linkWhatsapp(numero: string, nomeEmpresa?: string) {
  let digitos = numero.replace(/\D/g, "");
  if (digitos.length <= 11) digitos = "55" + digitos;
  const texto = `Olá, encontrei sua empresa${nomeEmpresa ? ` (${nomeEmpresa})` : ""} no Click Comércio e gostaria de mais informações.`;
  return `https://wa.me/${digitos}?text=${encodeURIComponent(texto)}`;
}
