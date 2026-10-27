import { initTRPC, TRPCError } from "@trpc/server";
import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { eq } from "drizzle-orm";
import superjson from "superjson";
import { COOKIE_NAME, lerToken } from "./auth";
import { db } from "./db";
import { usuarios } from "./schema";

export async function createContext({ req, res }: CreateExpressContextOptions) {
  const usuarioId = await lerToken(req.cookies?.[COOKIE_NAME]);
  const usuario = usuarioId
    ? ((await db.query.usuarios.findFirst({
        where: eq(usuarios.id, usuarioId),
        columns: { senhaHash: false },
      })) ?? null)
    : null;
  return { req, res, usuario };
}
export type Context = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<Context>().create({ transformer: superjson });

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.usuario) throw new TRPCError({ code: "UNAUTHORIZED", message: "Faça login para continuar." });
  return next({ ctx: { ...ctx, usuario: ctx.usuario } });
});

export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.usuario.tipo !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito." });
  return next();
});
