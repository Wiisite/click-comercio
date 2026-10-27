import { db } from "./db";
import { anuncios, categorias } from "./schema";

type Exemplo = Omit<typeof anuncios.$inferInsert, "categoriaId"> & { categoria?: string };

/** Banners de demonstração para apresentar os espaços publicitários a clientes. */
const EXEMPLOS: Exemplo[] = [
  // Home — banners horizontais (central)
  {
    titulo: "Interfone IP com vídeo no celular",
    texto: "Atenda a portaria de qualquer lugar. Instalação inclusa para condomínios.",
    anunciante: "Click Store",
    preco: "12x de R$ 89,90",
    cta: "Comprar agora",
    icone: "Smartphone",
    tema: "marca",
    posicao: "home",
    formato: "horizontal",
    link: "https://exemplo.com/interfone-ip",
  },
  {
    titulo: "Kit Limpeza Profissional para áreas comuns",
    texto: "Produtos concentrados e biodegradáveis. Rende até 3 meses.",
    anunciante: "Click Store",
    preco: "R$ 249,00",
    cta: "Ver kit",
    icone: "SprayCan",
    tema: "verde",
    posicao: "home",
    formato: "horizontal",
    link: "https://exemplo.com/kit-limpeza",
  },
  // Home — laterais
  {
    titulo: "Fechadura digital com biometria",
    texto: "Acesso por digital, senha ou app.",
    anunciante: "Click Store",
    preco: "R$ 599,00",
    cta: "Eu quero",
    icone: "Fingerprint",
    tema: "coral",
    posicao: "home",
    formato: "lateral",
    link: "https://exemplo.com/fechadura",
  },
  {
    titulo: "Câmera Wi‑Fi Full HD",
    texto: "Visão noturna e alerta no celular.",
    anunciante: "Click Store",
    preco: "R$ 189,90",
    cta: "Comprar",
    icone: "Cctv",
    tema: "escuro",
    posicao: "home",
    formato: "lateral",
    link: "https://exemplo.com/camera",
  },
  // Lista de serviços — gerais
  {
    titulo: "Software de gestão para síndicos",
    texto: "Boletos, reservas e comunicados em um só app. 30 dias grátis.",
    anunciante: "Click Gestão",
    preco: "a partir de R$ 99/mês",
    cta: "Testar grátis",
    icone: "LayoutDashboard",
    tema: "azul",
    posicao: "servicos",
    formato: "horizontal",
    link: "https://exemplo.com/software",
  },
  {
    titulo: "Lâmpadas LED — economize até 60%",
    texto: "Kit com 20 unidades para garagens e corredores.",
    anunciante: "Click Store",
    preco: "R$ 159,00",
    cta: "Ver oferta",
    icone: "Lightbulb",
    tema: "coral",
    posicao: "servicos",
    formato: "lateral",
    link: "https://exemplo.com/led",
  },
  // Páginas de categoria — patrocinadores segmentados
  {
    titulo: "Peças originais para elevadores",
    texto: "Botoeiras, cabos de tração e painéis com entrega em 48h.",
    anunciante: "ElevaPeças",
    preco: "Orçamento grátis",
    cta: "Pedir orçamento",
    icone: "ArrowUpDown",
    tema: "escuro",
    posicao: "servicos",
    formato: "horizontal",
    categoria: "Elevadores",
    link: "https://exemplo.com/pecas-elevador",
  },
  {
    titulo: "Bomba d'água 1 CV",
    texto: "Ideal para recalque de prédios até 15 andares.",
    anunciante: "HidroShop",
    preco: "R$ 1.290,00",
    cta: "Comprar",
    icone: "Droplets",
    tema: "azul",
    posicao: "servicos",
    formato: "lateral",
    categoria: "Hidráulica",
    link: "https://exemplo.com/bomba",
  },
  {
    titulo: "Cloro e kit de tratamento para piscinas",
    texto: "Água cristalina o verão inteiro.",
    anunciante: "Azul Store",
    preco: "R$ 219,00",
    cta: "Ver kit",
    icone: "Waves",
    tema: "azul",
    posicao: "servicos",
    formato: "horizontal",
    categoria: "Piscinas",
    link: "https://exemplo.com/piscina",
  },
  {
    titulo: "Tinta acrílica premium 18L",
    texto: "Rendimento de até 380 m² por demão.",
    anunciante: "Cores & Cia",
    preco: "R$ 489,00",
    cta: "Comprar",
    icone: "PaintRoller",
    tema: "coral",
    posicao: "servicos",
    formato: "lateral",
    categoria: "Pintura e Fachada",
    link: "https://exemplo.com/tinta",
  },
  {
    titulo: "Kit DVR + 8 câmeras",
    texto: "Monitoramento completo do condomínio pelo celular.",
    anunciante: "Click Store",
    preco: "12x de R$ 149,00",
    cta: "Eu quero",
    icone: "Cctv",
    tema: "escuro",
    posicao: "servicos",
    formato: "horizontal",
    categoria: "Câmeras e CFTV",
    link: "https://exemplo.com/kit-cftv",
  },
  // Blog
  {
    titulo: "Curso de Síndico Profissional",
    texto: "Certificado reconhecido. Aulas online e ao vivo.",
    anunciante: "Click Academy",
    preco: "R$ 397,00",
    cta: "Quero me inscrever",
    icone: "GraduationCap",
    tema: "marca",
    posicao: "blog",
    formato: "horizontal",
    link: "https://exemplo.com/curso",
  },
];

/** Insere os banners de exemplo. Categorias inexistentes viram anúncios gerais. */
export function criarAnunciosExemplo() {
  const cats = db.select({ id: categorias.id, nome: categorias.nome }).from(categorias).all();
  const valores = EXEMPLOS.map(({ categoria, ...a }) => ({
    ...a,
    categoriaId: cats.find((c) => c.nome === categoria)?.id ?? null,
  }));
  db.insert(anuncios).values(valores).run();
  return valores.length;
}
