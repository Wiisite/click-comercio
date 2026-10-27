import { Building2, Check, FileText, Megaphone, Pencil, Plus, Trash2, X } from "lucide-react";
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

function Anuncios() {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.admin.anuncios.useQuery();
  const [form, setForm] = useState({ titulo: "", texto: "", link: "", posicao: "home" as "home" | "servicos" | "blog" });
  const criar = trpc.admin.criarAnuncio.useMutation();
  const alternar = trpc.admin.alternarAnuncio.useMutation({ onSuccess: () => utils.admin.anuncios.invalidate() });

  async function enviar(e: FormEvent) {
    e.preventDefault();
    const r = anuncioSchema.safeParse(form);
    if (!r.success) return toast.error(r.error.issues[0].message);
    try {
      await criar.mutateAsync(r.data);
      setForm({ titulo: "", texto: "", link: "", posicao: "home" });
      utils.admin.anuncios.invalidate();
      toast.success("Anúncio criado.");
    } catch (err) {
      toast.error(mensagemErro(err));
    }
  }

  if (isLoading) return <Carregando />;
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
      <div className="cartao divide-y divide-slate-100">
        {data?.map((a) => (
          <div key={a.id} className="flex items-center gap-4 p-4">
            <div className="min-w-0 flex-1">
              <div className="font-semibold">{a.titulo}</div>
              <div className="truncate text-xs text-slate-400">{a.posicao} · {a.link}</div>
            </div>
            <button
              onClick={() => alternar.mutate({ id: a.id, ativo: !a.ativo })}
              className={cn("selo px-3 py-1", a.ativo ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500")}
            >
              {a.ativo ? "Ativo" : "Pausado"}
            </button>
          </div>
        ))}
      </div>
      <form onSubmit={enviar} className="cartao h-fit space-y-3 p-5">
        <h2 className="font-bold">Novo anúncio</h2>
        <input className="campo" placeholder="Título" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
        <input className="campo" placeholder="Texto (opcional)" value={form.texto} onChange={(e) => setForm({ ...form, texto: e.target.value })} />
        <input className="campo" placeholder="https://link-do-anunciante" value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} />
        <select className="campo" value={form.posicao} onChange={(e) => setForm({ ...form, posicao: e.target.value as typeof form.posicao })}>
          <option value="home">Home</option>
          <option value="servicos">Lista de serviços</option>
          <option value="blog">Blog</option>
        </select>
        <button className="btn-primario w-full" disabled={criar.isPending}><Plus className="h-4 w-4" /> Criar anúncio</button>
      </form>
    </div>
  );
}
