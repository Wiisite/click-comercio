import {
  ArrowRight, ArrowUpDown, Cctv, Droplets, Fingerprint, GraduationCap, LayoutDashboard, Lightbulb, Megaphone,
  PaintRoller, ShoppingBag, Smartphone, SprayCan, Waves, type LucideIcon,
} from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";

type Posicao = "home" | "servicos" | "blog";
type Formato = "horizontal" | "lateral";

export const ICONES_ANUNCIO: Record<string, LucideIcon> = {
  ShoppingBag, Smartphone, SprayCan, Fingerprint, Cctv, LayoutDashboard, Lightbulb, ArrowUpDown, Droplets, Waves,
  PaintRoller, GraduationCap, Megaphone,
};

const TEMAS = {
  marca: { fundo: "from-marca-700 via-marca-600 to-marca-500", botao: "text-marca-700", bolha: "bg-coral-500/40" },
  coral: { fundo: "from-coral-600 via-coral-500 to-amber-400", botao: "text-coral-600", bolha: "bg-white/20" },
  verde: { fundo: "from-emerald-700 via-emerald-600 to-teal-500", botao: "text-emerald-700", bolha: "bg-lime-300/30" },
  azul: { fundo: "from-sky-800 via-sky-600 to-cyan-500", botao: "text-sky-700", bolha: "bg-cyan-200/30" },
  escuro: { fundo: "from-tinta via-slate-800 to-marca-900", botao: "text-tinta", bolha: "bg-marca-500/40" },
} as const;

export type DadosAnuncio = {
  id?: string;
  titulo: string;
  texto: string | null;
  link: string;
  anunciante: string | null;
  cta: string | null;
  preco: string | null;
  imagemUrl: string | null;
  icone: string | null;
  tema: keyof typeof TEMAS;
};

/**
 * Espaço publicitário. Mostra o anúncio de número `indice` daquele espaço
 * ou, se não houver, o convite "Anuncie aqui".
 */
export function EspacoAnuncio({
  posicao, formato, categoriaId, indice = 0, className,
}: { posicao: Posicao; formato: Formato; categoriaId?: string; indice?: number; className?: string }) {
  const { data, isLoading } = trpc.anuncios.listar.useQuery(
    { posicao, formato, categoriaId },
    { staleTime: 5 * 60_000 },
  );
  if (isLoading) return null;
  const anuncio = data?.[indice];
  if (!anuncio) return <AnuncieAqui formato={formato} className={className} />;
  return <Banner anuncio={anuncio} formato={formato} className={className} />;
}

export function Banner({ anuncio, formato, className, preview }: {
  anuncio: DadosAnuncio; formato: Formato; className?: string; preview?: boolean;
}) {
  const registrar = trpc.anuncios.registrarClique.useMutation();
  const tema = TEMAS[anuncio.tema] ?? TEMAS.marca;
  const Icone = ICONES_ANUNCIO[anuncio.icone ?? ""] ?? ShoppingBag;
  const visual = anuncio.imagemUrl ? (
    <img src={anuncio.imagemUrl} alt="" className="h-full w-full object-cover" />
  ) : (
    <Icone className="h-1/2 w-1/2 text-white drop-shadow-lg" strokeWidth={1.5} />
  );
  const props = {
    href: anuncio.link,
    target: "_blank",
    rel: "noopener noreferrer sponsored",
    onClick: (e: React.MouseEvent) => {
      if (preview) return e.preventDefault();
      if (anuncio.id) registrar.mutate({ id: anuncio.id });
    },
  };
  const etiqueta = (
    <span className="selo bg-black/20 text-[10px] uppercase tracking-wider text-white/90 backdrop-blur">
      Patrocinado{anuncio.anunciante && ` · ${anuncio.anunciante}`}
    </span>
  );

  if (formato === "lateral") {
    return (
      <a
        {...props}
        className={cn(
          "group relative flex flex-col overflow-hidden rounded-3xl bg-gradient-to-br p-5 text-white shadow-lg transition hover:-translate-y-1 hover:shadow-2xl",
          tema.fundo,
          className,
        )}
      >
        <span className={cn("pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full blur-2xl", tema.bolha)} />
        <div className="relative">{etiqueta}</div>
        <div className="relative my-5 flex aspect-[4/3] items-center justify-center overflow-hidden rounded-2xl bg-white/10 transition duration-500 group-hover:scale-[1.03]">
          {visual}
        </div>
        <h3 className="relative text-lg font-extrabold leading-tight">{anuncio.titulo}</h3>
        {anuncio.texto && <p className="relative mt-1 text-sm text-white/80">{anuncio.texto}</p>}
        {anuncio.preco && <p className="relative mt-3 text-2xl font-extrabold">{anuncio.preco}</p>}
        <span className={cn("btn relative mt-4 w-full bg-white", tema.botao)}>
          {anuncio.cta || "Saiba mais"} <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
        </span>
      </a>
    );
  }

  return (
    <a
      {...props}
      className={cn(
        "group relative flex min-h-44 items-center gap-6 overflow-hidden rounded-3xl bg-gradient-to-br p-6 text-white shadow-lg transition hover:shadow-2xl sm:p-8",
        tema.fundo,
        className,
      )}
    >
      <span className={cn("pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full blur-3xl", tema.bolha)} />
      <span className="pointer-events-none absolute -bottom-24 left-1/3 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
      <div className="relative min-w-0 flex-1">
        {etiqueta}
        <h3 className="mt-3 text-xl font-extrabold leading-tight sm:text-3xl">{anuncio.titulo}</h3>
        {anuncio.texto && <p className="mt-2 max-w-xl text-sm text-white/80 sm:text-base">{anuncio.texto}</p>}
        <div className="mt-5 flex flex-wrap items-center gap-4">
          <span className={cn("btn bg-white px-5 shadow-xl", tema.botao)}>
            {anuncio.cta || "Saiba mais"} <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
          </span>
          {anuncio.preco && <span className="text-xl font-extrabold sm:text-2xl">{anuncio.preco}</span>}
        </div>
      </div>
      <div className="relative hidden h-32 w-32 shrink-0 items-center justify-center overflow-hidden rounded-3xl bg-white/10 transition duration-500 group-hover:rotate-3 group-hover:scale-105 sm:flex md:h-40 md:w-40">
        {visual}
      </div>
    </a>
  );
}

export function AnuncieAqui({ formato, className }: { formato: Formato; className?: string }) {
  return (
    <Link
      href="/anuncie"
      className={cn(
        "group flex items-center justify-center gap-4 rounded-3xl border-2 border-dashed border-slate-300 bg-white/60 p-6 text-center text-slate-500 transition hover:border-marca-500 hover:bg-marca-50 hover:text-marca-700",
        formato === "lateral" ? "min-h-72 flex-col" : "min-h-32 flex-col sm:flex-row sm:text-left",
        className,
      )}
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 transition group-hover:bg-marca-100">
        <Megaphone className="h-6 w-6" />
      </span>
      <span>
        <span className="block font-bold text-tinta">Anuncie aqui</span>
        <span className="block text-sm">
          {formato === "lateral" ? "Espaço lateral disponível" : "Seu produto visto por síndicos e administradoras"}
        </span>
      </span>
      <span className="text-sm font-semibold text-marca-600 sm:ml-auto">Ver formatos →</span>
    </Link>
  );
}

/** Miniatura usada nas listas do painel admin. */
export function MiniaturaAnuncio({ anuncio }: { anuncio: DadosAnuncio }) {
  const Icone = ICONES_ANUNCIO[anuncio.icone ?? ""] ?? ShoppingBag;
  return (
    <div
      className={cn(
        "flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br text-white",
        (TEMAS[anuncio.tema] ?? TEMAS.marca).fundo,
      )}
    >
      {anuncio.imagemUrl ? <img src={anuncio.imagemUrl} alt="" className="h-full w-full object-cover" /> : <Icone className="h-6 w-6" />}
    </div>
  );
}
