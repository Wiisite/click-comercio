import { ArrowRight } from "lucide-react";
import { useLocation, useSearch, Link } from "wouter";
import { EspacoAnuncio } from "@/components/Anuncio";
import { trpc } from "@/lib/trpc";
import { cn, formatarData } from "@/lib/utils";
import { CartaoArtigo } from "./Home";

export default function Blog() {
  const categoria = new URLSearchParams(useSearch()).get("categoria") ?? "";
  const [, navegar] = useLocation();
  const categorias = trpc.blog.categorias.useQuery();
  const { data } = trpc.blog.listar.useQuery({ categoria: categoria || undefined });
  const destaques = !categoria ? (data?.filter((a) => a.destaque) ?? []) : [];
  const demais = data?.filter((a) => !destaques.includes(a)) ?? [];

  return (
    <div className="container-site py-10">
      <h1 className="text-4xl font-extrabold tracking-tight">Blog Click Comércio</h1>
      <p className="mt-2 text-lg text-slate-500">Guias e dicas práticas para síndicos, administradoras e moradores.</p>

      <div className="sem-scrollbar my-8 flex gap-2 overflow-x-auto">
        {["", ...(categorias.data ?? [])].map((c) => (
          <button
            key={c}
            onClick={() => navegar(c ? `/blog?categoria=${encodeURIComponent(c)}` : "/blog")}
            className={cn("selo shrink-0 px-4 py-2 text-sm transition", categoria === c ? "bg-marca-600 text-white" : "bg-white text-slate-600 shadow-sm hover:bg-marca-50")}
          >
            {c || "Todos"}
          </button>
        ))}
      </div>

      {destaques.length > 0 && (
        <div className="mb-10 grid gap-5 lg:grid-cols-2">
          {destaques.map((a) => (
            <Link
              key={a.id}
              href={`/blog/${a.id}`}
              className="group relative flex min-h-64 flex-col justify-end overflow-hidden rounded-3xl bg-gradient-to-br from-marca-700 to-coral-500 p-8 text-white"
            >
              {a.imagemUrl && <img src={a.imagemUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-40 transition duration-500 group-hover:scale-105" />}
              <div className="relative">
                <span className="selo bg-white/20 text-white backdrop-blur">Destaque · {a.categoria}</span>
                <h2 className="mt-3 text-2xl font-extrabold leading-tight">{a.titulo}</h2>
                {a.resumo && <p className="mt-2 text-white/80">{a.resumo}</p>}
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold">
                  Ler artigo <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </span>
                <span className="ml-3 text-xs text-white/60">{formatarData(a.criadoEm)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="mb-8"><EspacoAnuncio posicao="blog" formato="horizontal" /></div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {demais.map((a) => <CartaoArtigo key={a.id} artigo={a} />)}
      </div>
      {data?.length === 0 && <p className="py-16 text-center text-slate-400">Nenhum artigo nesta categoria ainda.</p>}
    </div>
  );
}
