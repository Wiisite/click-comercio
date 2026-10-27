import { eq } from "drizzle-orm";
import { hashSenha } from "./auth";
import { db } from "./db";
import { categorias, usuarios } from "./schema";

export const CATEGORIAS_PADRAO = [
  { nome: "Elevadores", icone: "ArrowUpDown" },
  { nome: "Portaria e Segurança", icone: "ShieldCheck" },
  { nome: "Limpeza", icone: "Sparkles" },
  { nome: "Jardinagem", icone: "Trees" },
  { nome: "Elétrica", icone: "Zap" },
  { nome: "Hidráulica", icone: "Droplets" },
  { nome: "Pintura e Fachada", icone: "PaintRoller" },
  { nome: "Piscinas", icone: "Waves" },
  { nome: "Dedetização", icone: "Bug" },
  { nome: "Contabilidade", icone: "Calculator" },
  { nome: "Advocacia Condominial", icone: "Scale" },
  { nome: "Câmeras e CFTV", icone: "Cctv" },
];

/** Prepara um banco vazio de produção: categorias padrão e conta admin (via ADMIN_EMAIL/ADMIN_SENHA). */
export async function bootstrap() {
  if (!db.select({ id: categorias.id }).from(categorias).limit(1).get()) {
    db.insert(categorias).values(CATEGORIAS_PADRAO).run();
    console.log("Categorias padrão criadas.");
  }

  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const senha = process.env.ADMIN_SENHA;
  if (email && senha && !db.select().from(usuarios).where(eq(usuarios.email, email)).get()) {
    if (senha.length < 8) return console.warn("ADMIN_SENHA precisa ter no mínimo 8 caracteres; admin não criado.");
    db.insert(usuarios).values({ nome: "Administrador", email, senhaHash: await hashSenha(senha), tipo: "admin" }).run();
    console.log(`Conta admin criada: ${email}`);
  }
}
