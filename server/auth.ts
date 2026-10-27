import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";

export const COOKIE_NAME = "cc_session";
const SESSAO_DIAS = 30;
const secret = new TextEncoder().encode(process.env.AUTH_SECRET ?? "dev-secret-troque-em-producao");

export const hashSenha = (senha: string) => bcrypt.hash(senha, 10);
export const conferirSenha = (senha: string, hash: string) => bcrypt.compare(senha, hash);

export function criarToken(usuarioId: string) {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(usuarioId)
    .setExpirationTime(`${SESSAO_DIAS}d`)
    .sign(secret);
}

export async function lerToken(token: string | undefined): Promise<string | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload.sub ?? null;
  } catch {
    return null;
  }
}

export const cookieOpcoes = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  maxAge: SESSAO_DIAS * 24 * 60 * 60 * 1000,
  path: "/",
};
