import { hashSenha } from "./auth";
import { criarAnunciosExemplo } from "./anunciosExemplo";
import { CATEGORIAS_PADRAO } from "./bootstrap";
import { db, runMigrations } from "./db";
import { anuncios, artigosBlog, avaliacoes, categorias, empresas, leads, mensagensChat, usuarios } from "./schema";

runMigrations();

// Limpa na ordem inversa das FKs
for (const tabela of [mensagensChat, leads, avaliacoes, anuncios, artigosBlog, empresas, categorias, usuarios]) {
  db.delete(tabela).run();
}

const senhaHash = await hashSenha("senha1234");

const [admin, sindico, morador, administradora] = db
  .insert(usuarios)
  .values([
    { nome: "Equipe Click", email: "admin@clickcomercio.com.br", senhaHash, tipo: "admin" },
    { nome: "Carla Mendes", email: "sindico@exemplo.com", senhaHash, tipo: "sindico", telefone: "11988887777" },
    { nome: "Rafael Souza", email: "morador@exemplo.com", senhaHash, tipo: "morador" },
    { nome: "Gestão Prime", email: "adm@exemplo.com", senhaHash, tipo: "administradora" },
  ])
  .returning()
  .all();

const cats = db
  .insert(categorias)
  .values(CATEGORIAS_PADRAO)
  .returning()
  .all();
const cat = (nome: string) => cats.find((c) => c.nome === nome)!.id;

const dadosEmpresas = [
  ["Ascende Elevadores", "Elevadores", "São Paulo", "destaque", "Manutenção preventiva e corretiva de elevadores de todas as marcas, modernização de cabines e atendimento 24h para emergências."],
  ["Guardião Portaria", "Portaria e Segurança", "São Paulo", "destaque", "Portaria presencial e remota, controle de acesso por biometria e equipe treinada para condomínios residenciais e comerciais."],
  ["Brilho Total Limpeza", "Limpeza", "Campinas", "premium", "Terceirização de limpeza e conservação de áreas comuns, com supervisão diária e produtos biodegradáveis."],
  ["Verde Vivo Paisagismo", "Jardinagem", "São Paulo", "free", "Projetos de paisagismo, manutenção de jardins, poda de árvores e irrigação automatizada para condomínios."],
  ["Voltagem Engenharia Elétrica", "Elétrica", "Santo André", "destaque", "Laudos elétricos, adequação à NBR 5410, instalação de carregadores para carros elétricos e manutenção de quadros."],
  ["HidroFix Soluções", "Hidráulica", "São Paulo", "premium", "Caça-vazamentos com equipamento eletrônico, limpeza de caixas d'água e manutenção de bombas de recalque."],
  ["Nova Cor Fachadas", "Pintura e Fachada", "Guarulhos", "free", "Pintura predial, restauração e impermeabilização de fachadas com equipe de alpinismo industrial certificada (NR-35)."],
  ["Azul Piscinas", "Piscinas", "Campinas", "free", "Tratamento de água, manutenção de filtros e aquecimento solar para piscinas de condomínios."],
  ["Praga Zero", "Dedetização", "São Paulo", "premium", "Dedetização, desratização e descupinização com produtos registrados na Anvisa e certificado para o condomínio."],
  ["Conta Certa Condomínios", "Contabilidade", "São Paulo", "free", "Contabilidade condominial, prestação de contas, folha de pagamento de funcionários e emissão de boletos."],
  ["Lex Condominial", "Advocacia Condominial", "Santo André", "premium", "Cobrança de inadimplentes, revisão de convenção e regimento interno, e assessoria em assembleias."],
  ["Olho Vivo CFTV", "Câmeras e CFTV", "Guarulhos", "destaque", "Instalação de câmeras IP, monitoramento remoto pelo celular e manutenção de sistemas de CFTV."],
] as const;

const emps = [];
for (const [i, [nome, categoria, cidade, plano, descricao]] of dadosEmpresas.entries()) {
  const [dono] = db
    .insert(usuarios)
    .values({ nome: `Responsável ${nome}`, email: `prestador${i + 1}@exemplo.com`, senhaHash, tipo: "prestador" })
    .returning()
    .all();
  const tel = `1199${String(1000000 + i * 1111).slice(0, 7)}`;
  const [e] = db
    .insert(empresas)
    .values({
      usuarioId: dono.id,
      nomeEmpresa: nome,
      descricao,
      categoriaId: cat(categoria),
      telefone: tel,
      whatsapp: tel,
      email: `contato${i + 1}@exemplo.com`,
      cidade,
      plano,
      aprovado: true,
    })
    .returning()
    .all();
  emps.push(e);
}

// Uma empresa aguardando aprovação, para demonstrar a moderação
const [pendente] = db
  .insert(usuarios)
  .values({ nome: "Novo Prestador", email: "pendente@exemplo.com", senhaHash, tipo: "prestador" })
  .returning()
  .all();
db.insert(empresas)
  .values({
    usuarioId: pendente.id,
    nomeEmpresa: "Reforma Já",
    descricao: "Pequenas reformas em áreas comuns, salão de festas e garagens.",
    categoriaId: cat("Pintura e Fachada"),
    telefone: "11977776666",
    whatsapp: "11977776666",
    email: "contato@reformaja.com",
    cidade: "São Paulo",
  })
  .run();

const comentarios = [
  "Atendimento rápido e muito profissional. Recomendo!",
  "Resolveram o problema no mesmo dia. Preço justo.",
  "Equipe educada, mas atrasou um pouco no primeiro dia.",
  "Excelente custo-benefício para o nosso condomínio.",
  "Serviço bem feito e com garantia. Voltaremos a contratar.",
];
const avaliadores = [sindico, morador, administradora];
emps.forEach((e, i) => {
  avaliadores.forEach((u, j) => {
    if ((i + j) % 4 === 3) return;
    db.insert(avaliacoes)
      .values({ empresaId: e.id, usuarioId: u.id, nota: 5 - ((i * 2 + j) % 3), comentario: comentarios[(i + j) % 5] })
      .run();
  });
});

const [lead] = db
  .insert(leads)
  .values({
    empresaId: emps[0].id,
    usuarioId: sindico.id,
    nomeContato: sindico.nome,
    emailContato: sindico.email,
    telefoneContato: sindico.telefone,
    mensagem: "Precisamos de contrato de manutenção para 2 elevadores em um prédio de 12 andares.",
  })
  .returning()
  .all();
db.insert(leads)
  .values({
    empresaId: emps[0].id,
    nomeContato: "Visitante do site",
    emailContato: "visitante@exemplo.com",
    mensagem: "Gostaria de um orçamento para modernização da cabine do elevador social.",
    status: "respondido",
  })
  .run();
db.insert(mensagensChat).values({ leadId: lead.id, remetenteId: sindico.id, mensagem: "Olá! Conseguem visitar o prédio esta semana?" }).run();

const artigos = [
  ["Como escolher uma empresa de manutenção de elevadores", "Manutenção", true, "Entenda o que exigir em contrato, a periodicidade obrigatória e como comparar propostas."],
  ["Inadimplência no condomínio: 5 estratégias que funcionam", "Finanças", true, "Da cobrança amigável à via judicial: um passo a passo para reduzir a inadimplência."],
  ["Portaria remota vale a pena?", "Segurança", false, "Custos, vantagens e cuidados antes de trocar a portaria presencial pela remota."],
  ["Checklist de manutenção preventiva para síndicos", "Manutenção", false, "Um calendário prático com tudo que precisa ser revisado ao longo do ano."],
  ["Assembleia digital: o que diz a lei", "Legislação", false, "Como convocar, votar e registrar uma assembleia online com validade jurídica."],
] as const;
for (const [titulo, categoria, destaque, resumo] of artigos) {
  db.insert(artigosBlog)
    .values({
      titulo,
      resumo,
      categoria,
      destaque,
      publicado: true,
      autorId: admin.id,
      conteudo: `${resumo}\n\nNeste artigo reunimos as principais orientações para síndicos e administradoras.\n\n1. Planeje com antecedência e registre tudo em ata.\n2. Peça ao menos três orçamentos e compare avaliações de outros condomínios.\n3. Exija documentação, seguro e garantia por escrito.\n\nNo Click Comércio você encontra prestadores avaliados por outros síndicos e pode solicitar orçamentos gratuitamente.`,
    })
    .run();
}

criarAnunciosExemplo();

console.log("Seed concluído. Senha de todos os usuários: senha1234");
console.log("  admin@clickcomercio.com.br (admin) · sindico@exemplo.com · prestador1@exemplo.com");
