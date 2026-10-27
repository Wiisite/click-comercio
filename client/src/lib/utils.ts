import { clsx, type ClassValue } from "clsx";
import { TRPCClientError } from "@trpc/client";

export const cn = (...classes: ClassValue[]) => clsx(classes);

export function mensagemErro(erro: unknown) {
  if (erro instanceof TRPCClientError) {
    const zod = erro.data?.zodError as { fieldErrors?: Record<string, string[]> } | undefined;
    const primeiro = zod && Object.values(zod.fieldErrors ?? {}).flat()[0];
    if (primeiro) return primeiro;
    try {
      const lista = JSON.parse(erro.message) as { message: string }[];
      if (Array.isArray(lista) && lista[0]?.message) return lista[0].message;
    } catch {}
    return erro.message;
  }
  return "Algo deu errado. Tente novamente.";
}

export const formatarData = (d: Date) =>
  new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).format(d);

export const formatarDataHora = (d: Date) =>
  new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(d);

export const iniciais = (nome: string) =>
  nome
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
