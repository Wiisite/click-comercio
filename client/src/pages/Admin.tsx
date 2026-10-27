import { Building2, Check, FileText, Megaphone, Pencil, Plus, Sparkles, Trash2, X } from "lucide-react";
import { Banner, ICONES_ANUNCIO, MiniaturaAnuncio } from "@/components/Anuncio";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Link } from "wouter";
import { anuncioSchema, artigoSchema } from "@shared/validacao";
import { Carregando } from "@/components/Layout";
import { Campo, Modal } from "@/components/Modal";
import { SeloPlano } from "@/components/SeloPlano";
import { trpc } from "@/lib/trpc";
import { useExigirLogin } from "@/lib/useAuth";
import { cn, formatarData, mensagemErro } from "@/lib/utils";
import NaoEncontrado from "./NaoEncontrado";

type Aba = "empresas" | "artigos" | "anuncios";

export default function Admin() {
  const { usuario } = useExigirLogin();
  const [aba, setAba] = useState<Aba>("empresas");
  if (!usuario) return <Carregando />;
  if (usuario.tipo !== "admin") return <NaoEncontrado />;

  const abas = [
    { id: "empresas" as const, rotulo: "Empresas", icone: Building2 },
    { id: "artigos" as const, rotulo: "Artigos", icone: FileText },
    { id: "anuncios" as const, rotulo: "Anúncios", icone: Megaphone },
  ];
  return (
    <div className="container-site py-8">
      <h1 className="mb-6 text-3xl font-extrabold tracking-tight">Administração</h1>
      <div className="mb-6 inline-flex gap-1 rounded-2xl bg-white p-1 shadow-sm">
        {abas.map(({ id, rotulo, icone: I }) => (
          <button key={id} onClick={() => setAba(id)} className={cn("btn", aba === id ? "bg-marca-600 text-white" : "text-slate-600 hover:bg-slate-50")}>
            <I className="h-4 w-4" /> {rotulo}
          </button>
        ))}
      </div>
      {aba === "empresas" && <Empresas />}
      {aba === "artigos" && <Artigos />}
      {aba === "anuncios" && <Anuncios />}
    </div>
  );
}

function Empresas() {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.admin.empresas.useQuery();
  const aprovar = trpc.admin.definirAprovacao.useMutation({
    onSuccess: () => utils.admin.empresas.invalidate(),
    onError: (e) => toast.error(mensagemErro(e)),
  });
  if (isLoading) return <Carregando />;
  const pendentes = data?.filter((e) => !e.aprovado).length ?? 0;
  return (
    <div className="cartao overflow-hidden">
      <p className="border-b border-slate-100 p-4 text-sm text-slate-500">
        {pendentes} empresa{pendentes === 1 ? "" : "s"} aguardando aprovação
      </p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[42rem] text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr><th className="p-4">Empresa</th><th>Categoria</th><th>Responsável</th><th>Plano</th><th>Status</th><th /></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data?.map((e) => (
              <tr key={e.id} className={cn(!e.aprovado && "bg-amber-50/50")}>
                <td className="p-4">
                  <Link href={`/empresa/${e.id}`} className="font-semibold hover:text-marca-600">{e.nomeEmpresa}</Link>
                  <div className="text-xs text-slate-400">{e.cidade} · {formatarData(e.criadoEm)}</div>
                </td>
                <td>{e.categoria.nome}</td>
                <td><div>{e.usuario.nome}</div><div className="text-xs text-slate-400">{e.usuario.email}</div></td>
                <td><SeloPlano plano={e.plano} />{e.plano === "free" && <span className="text-xs text-slate-400">Free</span>}</td>
                <td>
                  <span className={cn("selo", e.aprovado ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700")}>
                    {e.aprovado ? "Aprovada" : "Pendente"}
                  </span>
                </td>
                <td className="pr-4 text-right">
                  {e.aprovado ? (
                    <button className="btn-fantasma text-rose-600" onClick={() => aprovar.mutate({ id: e.id, aprovado: false })}>
                      <X className="h-4 w-4" /> Suspender
                    </button>
                  ) : (
                    <button className="btn-primario" onClick={() => aprovar.mutate({ id: e.id, aprovado: true })}>
                      <Check className="h-4 w-4" /> Aprovar
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

type FormArtigo = { id?: string; titulo: string; resumo: string; conteudo: string; categoria: string; imagemUrl: string; destaque: boolean; publicado: boolean };
const artigoVazio: FormArtigo = { titulo: "", resumo: "", conteudo: "", categoria: "Gestão", imagemUrl: "", destaque: false, publicado: true };

function Artigos() {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.admin.artigos.useQuery();
  const [form, setForm] = useState<FormArtigo | null>(null);
  const salvar = trpc.admin.salvarArtigo.useMutation();
  const excluir = trpc.admin.excluirArtigo.useMutation({ onSuccess: () => utils.admin.artigos.invalidate() });

  async function enviar(e: FormEvent) {
    e.preventDefault();
    const r = artigoSchema.safeParse(form);
    if (!r.success) return toast.error(r.error.issues[0].message);
    try {
      await salvar.mutateAsync(r.data);
      toast.success("Artigo salvo.");
      setForm(null);
      utils.admin.artigos.invalidate();
      utils.blog.invalidate();
    } catch (err) {
      toast.error(mensagemErro(err));
    }
  }

  if (isLoading) return <Carregando />;
  return (
    <>
      <button className="btn-primario mb-4" onClick={() => setForm(artigoVazio)}><Plus className="h-4 w-4" /> Novo artigo</button>
      <div className="cartao divide-y divide-slate-100">
        {data?.map((a) => (
          <div key={a.id} className="flex items-center gap-4 p-4">
            <div className="min-w-0 flex-1">
              <div className="truncate font-semibold">{a.titulo}</div>
              <div className="text-xs text-slate-400">
                {a.categoria} · {formatarData(a.criadoEm)} · {a.publicado ? "Publicado" : "Rascunho"}{a.destaque && " · Destaque"}
              </div>
            </div>
            <button className="btn-fantasma p-2" aria-label="Editar" onClick={() => setForm({ ...a, resumo: a.resumo ?? "", imagemUrl: a.imagemUrl ?? "" })}>
              <Pencil className="h-4 w-4" />
            </button>
            <button
              className="btn-fantasma p-2 text-rose-600"
              aria-label="Excluir"
              onClick={() => confirm(`Excluir “${a.titulo}”?`) && excluir.mutate({ id: a.id })}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
      <Modal aberto={!!form} onFechar={() => setForm(null)} titulo={form?.id ? "Editar artigo" : "Novo artigo"}>
        {form && (
          <form onSubmit={enviar} className="space-y-4">
            <Campo rotulo="Título"><input className="campo" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} /></Campo>
            <Campo rotulo="Resumo"><input className="campo" value={form.resumo} onChange={(e) => setForm({ ...form, resumo: e.target.value })} /></Campo>
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo rotulo="Categoria"><input className="campo" value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} /></Campo>
              <Campo rotulo="URL da imagem"><input className="campo" value={form.imagemUrl} onChange={(e) => setForm({ ...form, imagemUrl: e.target.value })} /></Campo>
            </div>
            <Campo rotulo="Conteúdo (parágrafos separados por linha em branco)">
              <textarea className="campo min-h-48" value={form.conteudo} onChange={(e) => setForm({ ...form, conteudo: e.target.value })} />
            </Campo>
            <div className="flex gap-6 text-sm">
              <label className="flex items-center gap-2"><input type="checkbox" checked={form.publicado} onChange={(e) => setForm({ ...form, publicado: e.target.checked })} /> Publicado</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={form.destaque} onChange={(e) => setForm({ ...form, destaque: e.target.checked })} /> Destaque</label>
            </div>
            <button className="btn-primario w-full" disabled={salvar.isPending}>Salvar</button>
          </form>
        )}
      </Modal>
    </>
  );
}

const ROTULO_POSICAO = { home: "Home", servicos: "Serviços / categorias", blog: "Blog" } as const;
const TEMAS_FORM = ["marca", "coral", "verde", "azul", "escuro"] as const;
type FormAnuncio = {
  id?: string; titulo: string; texto: string; link: string; posicao: "home" | "servicos" | "blog";
  formato: "horizontal" | "lateral"; categoriaId: string; anunciante: string; cta: string; preco: string;
  imagemUrl: string; icone: string; tema: (typeof TEMAS_FORM)[number];
};
const anuncioVazio: FormAnuncio = {
  titulo: "", texto: "", link: "", posicao: "home", formato: "horizontal", categoriaId: "", anunciante: "",
  cta: "Comprar agora", preco: "", imagemUrl: "", icone: "ShoppingBag", tema: "marca",
};

function Anuncios() {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.admin.anuncios.useQuery();
  const categorias = trpc.categorias.listar.useQuery();
  const [form, setForm] = useState<FormAnuncio | null>(null);
  const atualizar = () => {
    utils.admin.anuncios.invalidate();
    utils.anuncios.invalidate();
  };
  const salvar = trpc.admin.salvarAnuncio.useMutation();
  const alternar = trpc.admin.alternarAnuncio.useMutation({ onSuccess: atualizar });
  const excluir = trpc.admin.excluirAnuncio.useMutation({ onSuccess: atualizar });
  const exemplos = trpc.admin.criarAnunciosExemplo.useMutation({
    onSuccess: (r) => {
      toast.success(`${r.criados} anúncios de exemplo criados. Veja na Home e nas categorias!`);
      atualizar();
    },
  });

  async function enviar(e: FormEvent) {
    e.preventDefault();
    const r = anuncioSchema.safeParse(form);
    if (!r.success) return toast.error(r.error.issues[0].message);
    try {
      await salvar.mutateAsync(r.data);
      toast.success("Anúncio salvo.");
      setForm(null);
      atualizar();
    } catch (err) {
      toast.error(mensagemErro(err));
    }
  }

  if (isLoading) return <Carregando />;
  const totalCliques = data?.reduce((s, a) => s + a.cliques, 0) ?? 0;
  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button className="btn-primario" onClick={() => setForm(anuncioVazio)}><Plus className="h-4 w-4" /> Novo anúncio</button>
        <button className="btn-contorno" disabled={exemplos.isPending} onClick={() => exemplos.mutate()}>
          <Sparkles className="h-4 w-4" /> Criar anúncios de exemplo
        </button>
        <Link href="/anuncie" className="btn-fantasma">Página “Anuncie” →</Link>
        <span className="ml-auto text-sm text-slate-500">{data?.length ?? 0} anúncios · {totalCliques} cliques</span>
      </div>
      {!data?.length ? (
        <div className="cartao py-16 text-center text-slate-400">
          <Megaphone className="mx-auto mb-3 h-10 w-10" />
          Nenhum anúncio. Crie um ou gere os exemplos para apresentar ao cliente.
        </div>
      ) : (
        <div className="cartao divide-y divide-slate-100">
          {data.map((a) => (
            <div key={a.id} className={cn("flex flex-wrap items-center gap-4 p-4", !a.ativo && "opacity-50")}>
              <MiniaturaAnuncio anuncio={a} />
              <div className="min-w-0 flex-1">
                <div className="font-semibold">{a.titulo}</div>
                <div className="mt-1 flex flex-wrap gap-1.5 text-xs">
                  <span className="selo bg-slate-100 text-slate-600">{ROTULO_POSICAO[a.posicao]}</span>
                  <span className="selo bg-slate-100 text-slate-600">{a.formato === "lateral" ? "Lateral" : "Horizontal"}</span>
                  {a.categoria && <span className="selo bg-marca-50 text-marca-700">{a.categoria.nome}</span>}
                  <span className="selo bg-amber-50 text-amber-700">{a.cliques} cliques</span>
                </div>
              </div>
              <button
                onClick={() => alternar.mutate({ id: a.id, ativo: !a.ativo })}
                className={cn("selo px-3 py-1", a.ativo ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500")}
              >
                {a.ativo ? "Ativo" : "Pausado"}
              </button>
              <button
                className="btn-fantasma p-2"
                aria-label="Editar"
                onClick={() => setForm({
                  id: a.id, titulo: a.titulo, texto: a.texto ?? "", link: a.link, posicao: a.posicao, formato: a.formato,
                  categoriaId: a.categoriaId ?? "", anunciante: a.anunciante ?? "", cta: a.cta ?? "", preco: a.preco ?? "",
                  imagemUrl: a.imagemUrl ?? "", icone: a.icone ?? "", tema: a.tema,
                })}
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                className="btn-fantasma p-2 text-rose-600"
                aria-label="Excluir"
                onClick={() => confirm(`Excluir “${a.titulo}”?`) && excluir.mutate({ id: a.id })}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <Modal aberto={!!form} onFechar={() => setForm(null)} titulo={form?.id ? "Editar anúncio" : "Novo anúncio"}>
        {form && (
          <form onSubmit={enviar} className="space-y-4">
            <div className={form.formato === "lateral" ? "mx-auto max-w-64" : ""}>
              <Banner
                preview
                formato={form.formato}
                anuncio={{ ...form, titulo: form.titulo || "Título do anúncio", texto: form.texto || null, anunciante: form.anunciante || null, cta: form.cta || null, preco: form.preco || null, imagemUrl: form.imagemUrl || null, icone: form.icone || null }}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo rotulo="Página">
                <select className="campo" value={form.posicao} onChange={(e) => setForm({ ...form, posicao: e.target.value as FormAnuncio["posicao"] })}>
                  {Object.entries(ROTULO_POSICAO).map(([v, r]) => <option key={v} value={v}>{r}</option>)}
                </select>
              </Campo>
              <Campo rotulo="Formato">
                <select className="campo" value={form.formato} onChange={(e) => setForm({ ...form, formato: e.target.value as FormAnuncio["formato"] })}>
                  <option value="horizontal">Horizontal (central)</option>
                  <option value="lateral">Lateral</option>
                </select>
              </Campo>
            </div>
            {form.posicao === "servicos" && (
              <Campo rotulo="Categoria (vazio = todas)">
                <select className="campo" value={form.categoriaId} onChange={(e) => setForm({ ...form, categoriaId: e.target.value })}>
                  <option value="">Todas as categorias</option>
                  {categorias.data?.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </Campo>
            )}
            <Campo rotulo="Título"><input className="campo" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} /></Campo>
            <Campo rotulo="Texto"><input className="campo" value={form.texto} onChange={(e) => setForm({ ...form, texto: e.target.value })} /></Campo>
            <div className="grid gap-4 sm:grid-cols-3">
              <Campo rotulo="Anunciante"><input className="campo" value={form.anunciante} onChange={(e) => setForm({ ...form, anunciante: e.target.value })} /></Campo>
              <Campo rotulo="Preço"><input className="campo" placeholder="R$ 99,90" value={form.preco} onChange={(e) => setForm({ ...form, preco: e.target.value })} /></Campo>
              <Campo rotulo="Botão"><input className="campo" value={form.cta} onChange={(e) => setForm({ ...form, cta: e.target.value })} /></Campo>
            </div>
            <Campo rotulo="Link de destino"><input className="campo" placeholder="https://loja.com/produto" value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} /></Campo>
            <Campo rotulo="Imagem do produto (URL, opcional — substitui o ícone)">
              <input className="campo" placeholder="https://…" value={form.imagemUrl} onChange={(e) => setForm({ ...form, imagemUrl: e.target.value })} />
            </Campo>
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo rotulo="Ícone">
                <select className="campo" value={form.icone} onChange={(e) => setForm({ ...form, icone: e.target.value })}>
                  {Object.keys(ICONES_ANUNCIO).map((i) => <option key={i}>{i}</option>)}
                </select>
              </Campo>
              <Campo rotulo="Cor">
                <div className="flex gap-2 pt-1">
                  {TEMAS_FORM.map((t) => (
                    <button
                      type="button"
                      key={t}
                      aria-label={t}
                      onClick={() => setForm({ ...form, tema: t })}
                      className={cn(
                        "h-9 w-9 rounded-full bg-gradient-to-br ring-offset-2 transition",
                        { marca: "from-marca-700 to-marca-500", coral: "from-coral-600 to-amber-400", verde: "from-emerald-700 to-teal-500", azul: "from-sky-800 to-cyan-500", escuro: "from-tinta to-marca-900" }[t],
                        form.tema === t && "ring-2 ring-marca-600",
                      )}
                    />
                  ))}
                </div>
              </Campo>
            </div>
            <button className="btn-primario w-full" disabled={salvar.isPending}>Salvar anúncio</button>
          </form>
        )}
      </Modal>
    </>
  );
}
