import { cn, iniciais } from "@/lib/utils";

/** Logo da empresa ou avatar com iniciais. */
export function LogoEmpresa({ nome, url, className }: { nome: string; url?: string | null; className?: string }) {
  if (url) return <img src={url} alt={nome} className={cn("rounded-2xl object-cover", className)} />;
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-2xl bg-gradient-to-br from-marca-500 to-coral-500 font-bold text-white",
        className,
      )}
    >
      {iniciais(nome)}
    </div>
  );
}

export function Marca({ claro = false }: { claro?: boolean }) {
  return (
    <span className="flex items-center gap-2 text-lg font-extrabold tracking-tight">
      <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden>
        <rect width="32" height="32" rx="9" className="fill-marca-600" />
        <path d="M11 9l12 7-5 1.5 3 5.5-2.5 1.3-3-5.5L11 22z" fill="white" />
      </svg>
      <span className={claro ? "text-white" : "text-tinta"}>
        Click<span className="text-coral-500">Comércio</span>
      </span>
    </span>
  );
}
