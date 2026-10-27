import { ExternalLink, Megaphone } from "lucide-react";
import { trpc } from "@/lib/trpc";

export function Anuncio({ posicao }: { posicao: "home" | "servicos" | "blog" }) {
  const { data } = trpc.anuncios.porPosicao.useQuery({ posicao });
  const anuncio = data?.[0];
  if (!anuncio) return null;
  return (
    <a
      href={anuncio.link}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className="group flex items-center gap-4 rounded-2xl border border-dashed border-amber-300 bg-amber-50/60 p-4 transition hover:bg-amber-50"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
        <Megaphone className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Patrocinado</span>
        <span className="block font-semibold">{anuncio.titulo}</span>
        {anuncio.texto && <span className="block text-sm text-slate-600">{anuncio.texto}</span>}
      </span>
      <ExternalLink className="h-4 w-4 text-slate-400 transition group-hover:text-amber-600" />
    </a>
  );
}
