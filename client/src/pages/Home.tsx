import { ArrowRight, BadgeCheck, ChevronLeft, ChevronRight, MessageCircle, Search, Star, Zap } from "lucide-react";
import { useRef, useState, type FormEvent } from "react";
import { Link, useLocation } from "wouter";
import { EspacoAnuncio } from "@/components/Anuncio";
import { EmpresaCard, EmpresaCardEsqueleto } from "@/components/EmpresaCard";
import { corCategoria, Icone } from "@/components/Icone";
import { LeadModal } from "@/components/LeadModal";
import { trpc } from "@/lib/trpc";
import { cn, formatarData } from "@/lib/utils";

function Hero() {
  const [, navegar] = useLocation();
  const [busca, setBusca] = useState("");
  const buscar = (e: FormEvent) => {
    e.preventDefault();
    navegar(`/servicos?query=${encodeURIComponent(busca.trim())}`);
  };
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-marca-900 via-marca-700 to-marca-500 text-white">
      <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-coral-500/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-marca-500/50 blur-3xl" />
      <div className="container-site relative py-16 text-center sm:py-24">
        <span className="selo mb-6 bg-white/15 px-3 py-1 text-white backdrop-blur">
          <BadgeCheck className="h-3.5 w-3.5" /> Prestadores verificados e avaliados por síndicos
        </span>
        <h1 className="mx-auto max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">
          Tudo que o seu condomínio precisa, <span className="text-coral-400">em um clique.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-marca-100">
          Encontre, compare e contrate prestadores de serviço confiáveis. Orçamentos grátis e sem compromisso.
        </p>
        <form
          onSubmit={buscar}
          className="mx-auto mt-10 flex max-w-2xl items-center gap-2 rounded-2xl bg-white p-2 shadow-2xl shadow-marca-900/40"
        >
          <Search className="ml-3 h-5 w-5 shrink-0 text-slate-400" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar serviços para condomínio..."
            className="min-w-0 flex-1 bg-transparent py-3 text-tinta outline-none placeholder:text-slate-400"
            aria-label="Buscar serviços"
          />
          <button className="btn-coral px-5 py-3">Buscar</button>
        </form>
        <div className="mt-8 flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm text-marca-100">
          <span className="flex items-center gap-1.5"><Zap className="h-4 w-4 text-coral-400" /> Resposta rápida</span>
          <span className="flex items-center gap-1.5"><Star className="h-4 w-4 text-coral-400" /> Avaliações reais</span>
          <span className="flex items-center gap-1.5"><MessageCircle className="h-4 w-4 text-coral-400" /> Contato direto via WhatsApp</span>
        </div>
      </div>
    </section>
  );
}

function Categorias() {
  const { data } = trpc.categorias.listar.useQuery();
  return (
    <section className="container-site -mt-10 relative z-10">
      <div className="cartao grid grid-cols-3 gap-2 p-4 shadow-xl sm:grid-cols-4 lg:grid-cols-6">
        {(data ?? Array.from({ length: 12 }, () => null)).map((c, i) =>
          c ? (
            <Link
              key={c.id}
              href={`/servicos?categoria=${c.id}`}
              className="group flex flex-col items-center gap-2 rounded-2xl p-3 text-center transition hover:bg-slate-50"
            >
              <span className={cn("flex h-14 w-14 items-center justify-center rounded-2xl transition group-hover:scale-110", corCategoria(i))}>
                <Icone nome={c.icone} className="h-6 w-6" />
              </span>
              <span className="text-xs font-semibold leading-tight sm:text-sm">{c.nome}</span>
            </Link>
          ) : (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-50" />
          ),
        )}
      </div>
    </section>
  );
}

function Carrossel() {
  const { data, isLoading } = trpc.empresas.destaques.useQuery();
  const trilho = useRef<HTMLDivElement>(null);
  const rolar = (dir: number) => trilho.current?.scrollBy({ left: dir * trilho.current.clientWidth * 0.8, behavior: "smooth" });
  if (!isLoading && !data?.length) return null;
  return (
    <section className="container-site mt-16">
      <Titulo titulo="Empresas em destaque" subtitulo="Parceiros selecionados com o melhor atendimento">
        <div className="hidden gap-2 sm:flex">
          <button onClick={() => rolar(-1)} className="btn-contorno p-2" aria-label="Anterior"><ChevronLeft className="h-5 w-5" /></button>
          <button onClick={() => rolar(1)} className="btn-contorno p-2" aria-label="Próximo"><ChevronRight className="h-5 w-5" /></button>
        </div>
      </Titulo>
      <div ref={trilho} className="sem-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4">
        {(data ?? [null, null, null]).map((e, i) => (
          <div key={e?.id ?? i} className="w-[85%] shrink-0 snap-start sm:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.7rem)]">
            {e ? <EmpresaCard empresa={e} /> : <EmpresaCardEsqueleto />}
          </div>
        ))}
      </div>
    </section>
  );
}

function MaisBemAvaliadas() {
  const { data, isLoading } = trpc.empresas.maisBemAvaliadas.useQuery();
  return (
    <section className="container-site mt-16">
      <Titulo titulo="Empresas mais bem avaliadas" subtitulo="Escolhidas por quem já contratou">
        <Link href="/servicos" className="hidden items-center gap-1 text-sm font-semibold text-marca-600 sm:flex">
          Ver todas <ArrowRight className="h-4 w-4" />
        </Link>
      </Titulo>
      <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
        <div className="grid content-start gap-4 sm:grid-cols-2">
          {isLoading
            ? Array.from({ length: 6 }, (_, i) => <EmpresaCardEsqueleto key={i} />)
            : data?.map((e) => <EmpresaCard key={e.id} empresa={e} />)}
        </div>
        <aside className="grid content-start gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <EspacoAnuncio posicao="home" formato="lateral" indice={0} />
          <EspacoAnuncio posicao="home" formato="lateral" indice={1} />
        </aside>
      </div>
    </section>
  );
}

function ComoFunciona({ onOrcamento }: { onOrcamento: () => void }) {
  const passos = [
    ["Busque", "Encontre empresas por categoria, cidade ou avaliação."],
    ["Compare", "Veja notas, comentários e detalhes de cada prestador."],
    ["Solicite", "Peça orçamentos grátis e converse pelo chat ou WhatsApp."],
  ];
  return (
    <section id="como-funciona" className="container-site mt-20 scroll-mt-24">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-coral-500 to-coral-600 p-8 text-white sm:p-12">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10" />
        <div className="relative grid items-center gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-extrabold sm:text-4xl">Solicite orçamento agora</h2>
            <p className="mt-3 text-lg text-orange-50">Receba propostas de empresas qualificadas em poucas horas. É grátis.</p>
            <button onClick={onOrcamento} className="btn mt-8 bg-white px-6 py-3.5 text-base text-coral-600 shadow-xl hover:bg-orange-50">
              Pedir orçamento grátis <ArrowRight className="h-5 w-5" />
            </button>
          </div>
          <ol className="space-y-4">
            {passos.map(([t, d], i) => (
              <li key={t} className="flex gap-4 rounded-2xl bg-white/10 p-4 backdrop-blur">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white font-extrabold text-coral-600">{i + 1}</span>
                <span><strong className="block">{t}</strong><span className="text-sm text-orange-50">{d}</span></span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

function ArtigosRecentes() {
  const { data } = trpc.blog.listar.useQuery({ limite: 3 });
  if (!data?.length) return null;
  return (
    <section className="container-site mt-20">
      <Titulo titulo="Artigos recentes" subtitulo="Conteúdo para uma gestão de condomínio mais eficiente">
        <Link href="/blog" className="hidden items-center gap-1 text-sm font-semibold text-marca-600 sm:flex">
          Ir para o blog <ArrowRight className="h-4 w-4" />
        </Link>
      </Titulo>
      <div className="grid gap-5 md:grid-cols-3">
        {data.map((a) => <CartaoArtigo key={a.id} artigo={a} />)}
      </div>
    </section>
  );
}

export function CartaoArtigo({ artigo }: { artigo: { id: string; titulo: string; resumo: string | null; categoria: string; imagemUrl: string | null; criadoEm: Date } }) {
  return (
    <Link href={`/blog/${artigo.id}`} className="cartao group overflow-hidden transition hover:-translate-y-1 hover:shadow-xl">
      <div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-marca-100 to-orange-100">
        {artigo.imagemUrl ? (
          <img src={artigo.imagemUrl} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center text-5xl font-extrabold text-marca-200">“</span>
        )}
        <span className="selo absolute left-3 top-3 bg-white/90 text-marca-700">{artigo.categoria}</span>
      </div>
      <div className="p-5">
        <h3 className="font-bold leading-snug transition group-hover:text-marca-600">{artigo.titulo}</h3>
        {artigo.resumo && <p className="mt-2 line-clamp-2 text-sm text-slate-600">{artigo.resumo}</p>}
        <p className="mt-3 text-xs text-slate-400">{formatarData(artigo.criadoEm)}</p>
      </div>
    </Link>
  );
}

function Titulo({ titulo, subtitulo, children }: { titulo: string; subtitulo?: string; children?: React.ReactNode }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{titulo}</h2>
        {subtitulo && <p className="mt-1 text-slate-500">{subtitulo}</p>}
      </div>
      {children}
    </div>
  );
}

export default function Home() {
  const [leadAberto, setLeadAberto] = useState(false);
  return (
    <>
      <Hero />
      <Categorias />
      <Carrossel />
      <section className="container-site mt-10"><EspacoAnuncio posicao="home" formato="horizontal" indice={0} /></section>
      <MaisBemAvaliadas />
      <ComoFunciona onOrcamento={() => setLeadAberto(true)} />
      <section className="container-site mt-16"><EspacoAnuncio posicao="home" formato="horizontal" indice={1} /></section>
      <ArtigosRecentes />
      <LeadModal aberto={leadAberto} onFechar={() => setLeadAberto(false)} />
    </>
  );
}
