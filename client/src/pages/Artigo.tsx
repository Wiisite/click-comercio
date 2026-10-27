import { ArrowLeft, Search } from "lucide-react";
import { Link, useParams } from "wouter";
import { EspacoAnuncio } from "@/components/Anuncio";
import { Carregando } from "@/components/Layout";
import { trpc } from "@/lib/trpc";
import { formatarData } from "@/lib/utils";
import NaoEncontrado from "./NaoEncontrado";

export default function Artigo() {
  const { id } = useParams<{ id: string }>();
  const { data: artigo, isLoading, error } = trpc.blog.porId.useQuery({ id });
  if (isLoading) return <Carregando />;
  if (error || !artigo) return <NaoEncontrado />;

  return (
    <article className="container-site max-w-3xl py-10">
      <Link href="/blog" className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-marca-600">
        <ArrowLeft className="h-4 w-4" /> Voltar ao blog
      </Link>
      <span className="selo mt-6 bg-marca-50 text-marca-700">{artigo.categoria}</span>
      <h1 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">{artigo.titulo}</h1>
      <p className="mt-4 text-sm text-slate-500">
        {artigo.autor?.nome ?? "Equipe Click Comércio"} · {formatarData(artigo.criadoEm)}
      </p>
      {artigo.imagemUrl && <img src={artigo.imagemUrl} alt="" className="mt-8 aspect-[16/9] w-full rounded-3xl object-cover" />}
      <div className="mt-8 space-y-5 text-lg leading-relaxed text-slate-700">
        {artigo.conteudo.split(/\n{2,}/).map((p, i) => (
          <p key={i} className="whitespace-pre-line">{p}</p>
        ))}
      </div>
      <div className="mt-12 rounded-3xl bg-marca-50 p-8 text-center">
        <h2 className="text-xl font-bold">Precisa de um prestador de serviço?</h2>
        <p className="mt-1 text-slate-600">Compare empresas avaliadas por outros síndicos.</p>
        <Link href="/servicos" className="btn-primario mt-5"><Search className="h-4 w-4" /> Buscar serviços</Link>
      </div>
      <div className="mt-8"><EspacoAnuncio posicao="blog" formato="horizontal" /></div>
    </article>
  );
}
