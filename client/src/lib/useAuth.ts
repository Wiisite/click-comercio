import { useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "./trpc";

export function useAuth() {
  const { data: usuario, isLoading } = trpc.auth.me.useQuery(undefined, { staleTime: 60_000 });
  return { usuario: usuario ?? null, carregando: isLoading };
}

/** Redireciona para /login quando não há sessão. */
export function useExigirLogin() {
  const auth = useAuth();
  const [, navegar] = useLocation();
  useEffect(() => {
    if (!auth.carregando && !auth.usuario) navegar("/login", { replace: true });
  }, [auth.carregando, auth.usuario]);
  return auth;
}
