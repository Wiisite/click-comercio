import {
  Building2, Check, Clock, Crown, ExternalLink, Inbox, Mail, MessageCircle, MessagesSquare, Phone, Star, UserRound,
} from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Link } from "wouter";
import { empresaSchema, linkWhatsapp, PLANOS_INFO } from "@shared/validacao";
import { Chat } from "@/components/Chat";
import { Carregando } from "@/components/Layout";
import { Campo, Modal } from "@/components/Modal";
import { SeloPlano } from "@/components/SeloPlano";
import { trpc } from "@/lib/trpc";
import { useExigirLogin } from "@/lib/useAuth";
import { cn, formatarDataHora, mensagemErro } from "@/lib/utils";

type Aba = "leads" | "perfil" | "plano";
const STATUS = {
  novo: { rotulo: "Novo", cor: "bg-coral-500/10 text-coral-600" },
  respondido: { rotulo: "Respondido", cor: "bg-sky-100 text-sky-700" },
  fechado: { rotulo: "Fechado", cor: "bg-emerald-100 text-emerald-700" },
} as const;

export default function Dashboard() {
  const { usuario, carregando } = useExigirLogin();
  const { data: empresa, isLoading } = trpc.painel.minhaEmpresa.useQuery(undefined, { enabled: !!usuario });
  const [aba, setAba] = useState<Aba>("leads");

  if (carregando || !usuario || isLoading) return <Carregando />;

  if (usuario.tipo !== "prestador" && usuario.tipo !== "admin") {
    return (
      <div className="container-site py-20 text-center">
        <Building2 className="mx-auto mb-4 h-14 w-14 text-marca-200" />
        <h1 className="text-2xl font-extrabold">Painel exclusivo para empresas</h1>
        <p className="mt-2 text-slate-500">Sua conta é de cliente. Para anunciar uma empresa, crie uma conta de prestador.</p>
        <Link href="/meus-pedidos" className="btn-primario mt-6">Ver meus orçamentos</Link>
      </div>
    );
  }

  if (!empresa) {
    return (
      <div className="container-site max-w-3xl py-10">
        <h1 className="text-3xl font-extrabold tracking-tight">Cadastre sua empresa</h1>
        <p className="mb-6 mt-1 text-slate-500">
          Preencha os dados abaixo. Após a aprovação da nossa equipe, sua empresa aparecerá nas buscas.
        </p>
        <FormEmpresa />
      </div>
    );
  }

  const abas: { id: Aba; rotulo: string; icone: typeof Inbox }[] = [
    { id: "leads", rotulo: "Leads", icone: Inbox },
    { id: "perfil", rotulo: "Perfil da empresa", icone: Building2 },
    { id: "plano", rotulo: "Plano", icone: Crown },
  ];
  const totalLeads = Object.values(empresa.leadsPorStatus).reduce((a, b) => a + b, 0);

  return (
    <div className="container-site py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">Painel da empresa</p>
          <h1 className="flex flex-wrap items-center gap-3 text-3xl font-extrabold tracking-tight">
            {empresa.nomeEmpresa} <SeloPlano plano={empresa.plano} />
          </h1>
        </div>
        <Link href={`/empresa/${empresa.id}`} className="btn-contorno">
          <ExternalLink className="h-4 w-4" /> Ver página pública
        </Link>
      </div>

      {!empresa.aprovado && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl bg-amber-50 p-4 text-sm text-amber-800">
          <Clock className="h-5 w-5 shrink-0" /> Sua empresa está em análise. Você será listado assim que a equipe aprovar o cadastro.
        </div>
      )}

      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metrica rotulo="Leads recebidos" valor={totalLeads} icone={Inbox} />
        <Metrica rotulo="Novos" valor={empresa.leadsPorStatus.novo ?? 0} icone={Clock} destaque />
        <Metrica rotulo="Avaliação média" valor={empresa.media ? empresa.media.toFixed(1) : "—"} icone={Star} />
        <Metrica rotulo="Avaliações" valor={empresa.totalAvaliacoes} icone={MessagesSquare} />
      </div>

      <div className="sem-scrollbar mb-6 flex gap-1 overflow-x-auto rounded-2xl bg-white p-1 shadow-sm sm:inline-flex">
        {abas.map(({ id, rotulo, icone: I }) => (
          <button
            key={id}
            onClick={() => setAba(id)}
            className={cn("btn shrink-0", aba === id ? "bg-marca-600 text-white" : "text-slate-600 hover:bg-slate-50")}
          >
            <I className="h-4 w-4" /> {rotulo}
          </button>
        ))}
      </div>

      {aba === "leads" && <ListaLeads />}
      {aba === "perfil" && (
        <div className="max-w-3xl"><FormEmpresa inicial={empresa} /></div>
      )}
      {aba === "plano" && <Planos atual={empresa.plano} />}
    </div>
  );
}

function Metrica({ rotulo, valor, icone: I, destaque }: { rotulo: string; valor: number | string; icone: typeof Inbox; destaque?: boolean }) {
  return (
    <div className={cn("cartao p-5", destaque && "border-coral-500/20 bg-gradient-to-br from-white to-orange-50")}>
      <I className={cn("mb-3 h-5 w-5", destaque ? "text-coral-500" : "text-marca-600")} />
      <div className="text-2xl font-extrabold">{valor}</div>
      <div className="text-sm text-slate-500">{rotulo}</div>
    </div>
  );
}

function ListaLeads() {
  const [filtro, setFiltro] = useState<"" | keyof typeof STATUS>("");
  const [chatLead, setChatLead] = useState<{ id: string; nome: string } | null>(null);
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.leads.recebidos.useQuery({ status: filtro || undefined }, { refetchInterval: 30_000 });
  const status = trpc.leads.atualizarStatus.useMutation({
    onSuccess: () => {
      utils.leads.recebidos.invalidate();
      utils.painel.minhaEmpresa.invalidate();
    },
    onError: (e) => toast.error(mensagemErro(e)),
  });

  return (
    <div className="cartao overflow-hidden">
      <div className="flex flex-wrap gap-2 border-b border-slate-100 p-4">
        {(["", "novo", "respondido", "fechado"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFiltro(s)}
            className={cn("selo px-3 py-1.5 transition", filtro === s ? "bg-tinta text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200")}
          >
            {s ? STATUS[s].rotulo : "Todos"}
          </button>
        ))}
      </div>
      {isLoading ? (
        <Carregando />
      ) : !data?.length ? (
        <div className="py-16 text-center text-slate-400">
          <Inbox className="mx-auto mb-3 h-10 w-10" /> Nenhum lead {filtro && `com status “${STATUS[filtro].rotulo}”`}.
        </div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {data.map((l) => (
            <li key={l.id} className="grid gap-4 p-5 lg:grid-cols-[1fr_auto] lg:items-center">
              <div className="min-w-0">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <strong>{l.nomeContato}</strong>
                  <span className={cn("selo", STATUS[l.status].cor)}>{STATUS[l.status].rotulo}</span>
                  <span className="text-xs text-slate-400">{formatarDataHora(l.criadoEm)}</span>
                </div>
                <p className="text-sm text-slate-600">{l.mensagem}</p>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                  <a href={`mailto:${l.emailContato}`} className="flex items-center gap-1 hover:text-marca-600"><Mail className="h-3.5 w-3.5" /> {l.emailContato}</a>
                  {l.telefoneContato && <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {l.telefoneContato}</span>}
                  {!l.usuarioId && <span className="flex items-center gap-1"><UserRound className="h-3.5 w-3.5" /> Visitante sem conta</span>}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {l.usuarioId && (
                  <button className="btn-primario" onClick={() => setChatLead({ id: l.id, nome: l.nomeContato })}>
                    <MessagesSquare className="h-4 w-4" /> Chat
                  </button>
                )}
                {l.telefoneContato && (
                  <a href={linkWhatsapp(l.telefoneContato)} target="_blank" rel="noopener noreferrer" className="btn-whats">
                    <MessageCircle className="h-4 w-4" /> WhatsApp
                  </a>
                )}
                <select
                  className="campo w-auto py-2"
                  value={l.status}
                  onChange={(e) => status.mutate({ id: l.id, status: e.target.value as keyof typeof STATUS })}
                  aria-label="Status do lead"
                >
                  {Object.entries(STATUS).map(([v, { rotulo }]) => <option key={v} value={v}>{rotulo}</option>)}
                </select>
              </div>
            </li>
          ))}
        </ul>
      )}
      <Modal aberto={!!chatLead} onFechar={() => setChatLead(null)} titulo={`Conversa com ${chatLead?.nome ?? ""}`}>
        {chatLead && <Chat leadId={chatLead.id} />}
      </Modal>
    </div>
  );
}

type DadosEmpresa = {
  nomeEmpresa: string; descricao: string; categoriaId: string; telefone: string; whatsapp: string;
  email: string; endereco: string | null; cidade: string; logoUrl: string | null;
};

function FormEmpresa({ inicial }: { inicial?: DadosEmpresa }) {
  const utils = trpc.useUtils();
  const categorias = trpc.categorias.listar.useQuery();
  const salvar = trpc.painel.salvarEmpresa.useMutation();
  const vazio = { nomeEmpresa: "", descricao: "", categoriaId: "", telefone: "", whatsapp: "", email: "", endereco: "", cidade: "", logoUrl: "" };
  const [form, setForm] = useState(vazio);
  const [erros, setErros] = useState<Record<string, string>>({});

  useEffect(() => {
    if (inicial) setForm({ ...vazio, ...inicial, endereco: inicial.endereco ?? "", logoUrl: inicial.logoUrl ?? "" });
  }, [inicial]);

  const set = (campo: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [campo]: e.target.value }));

  async function enviar(e: FormEvent) {
    e.preventDefault();
    const r = empresaSchema.safeParse(form);
    if (!r.success) return setErros(Object.fromEntries(r.error.issues.map((i) => [String(i.path[0]), i.message])));
    setErros({});
    try {
      const res = await salvar.mutateAsync(r.data);
      toast.success(res.nova ? "Empresa cadastrada! Agora é só aguardar a aprovação." : "Dados atualizados.");
      utils.painel.minhaEmpresa.invalidate();
    } catch (err) {
      toast.error(mensagemErro(err));
    }
  }

  return (
    <form onSubmit={enviar} className="cartao space-y-4 p-6 sm:p-8" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo rotulo="Nome da empresa" erro={erros.nomeEmpresa}>
          <input className="campo" value={form.nomeEmpresa} onChange={set("nomeEmpresa")} />
        </Campo>
        <Campo rotulo="Categoria" erro={erros.categoriaId}>
          <select className="campo" value={form.categoriaId} onChange={set("categoriaId")}>
            <option value="">Selecione…</option>
            {categorias.data?.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </Campo>
      </div>
      <Campo rotulo="Descrição" erro={erros.descricao}>
        <textarea className="campo min-h-32" value={form.descricao} onChange={set("descricao")} placeholder="Serviços oferecidos, diferenciais, região de atendimento…" />
      </Campo>
      <div className="grid gap-4 sm:grid-cols-3">
        <Campo rotulo="Telefone" erro={erros.telefone}>
          <input className="campo" type="tel" value={form.telefone} onChange={set("telefone")} />
        </Campo>
        <Campo rotulo="WhatsApp" erro={erros.whatsapp}>
          <input className="campo" type="tel" value={form.whatsapp} onChange={set("whatsapp")} placeholder="(11) 99999-9999" />
        </Campo>
        <Campo rotulo="E-mail comercial" erro={erros.email}>
          <input className="campo" type="email" value={form.email} onChange={set("email")} />
        </Campo>
      </div>
      <div className="grid gap-4 sm:grid-cols-[1fr_14rem]">
        <Campo rotulo="Endereço (opcional)" erro={erros.endereco}>
          <input className="campo" value={form.endereco} onChange={set("endereco")} />
        </Campo>
        <Campo rotulo="Cidade" erro={erros.cidade}>
          <input className="campo" value={form.cidade} onChange={set("cidade")} />
        </Campo>
      </div>
      <Campo rotulo="URL do logo (opcional)" erro={erros.logoUrl}>
        <input className="campo" type="url" value={form.logoUrl} onChange={set("logoUrl")} placeholder="https://…" />
      </Campo>
      <button className="btn-primario" disabled={salvar.isPending}>
        {salvar.isPending ? "Salvando…" : inicial ? "Salvar alterações" : "Cadastrar empresa"}
      </button>
    </form>
  );
}

function Planos({ atual }: { atual: keyof typeof PLANOS_INFO }) {
  const utils = trpc.useUtils();
  const alterar = trpc.painel.alterarPlano.useMutation({
    onSuccess: () => {
      toast.success("Plano atualizado!");
      utils.painel.minhaEmpresa.invalidate();
    },
    onError: (e) => toast.error(mensagemErro(e)),
  });
  return (
    <div className="grid gap-5 md:grid-cols-3">
      {(Object.keys(PLANOS_INFO) as (keyof typeof PLANOS_INFO)[]).map((p) => {
        const info = PLANOS_INFO[p];
        const ehAtual = p === atual;
        const popular = p === "destaque";
        return (
          <div
            key={p}
            className={cn(
              "cartao relative flex flex-col p-6",
              popular && "border-transparent bg-gradient-to-b from-marca-700 to-marca-900 text-white shadow-xl shadow-marca-600/30",
            )}
          >
            {popular && <span className="selo absolute -top-3 left-6 bg-coral-500 text-white">Mais visibilidade</span>}
            <h3 className="text-lg font-bold">{info.nome}</h3>
            <div className="mt-2 text-3xl font-extrabold">{info.preco}</div>
            <ul className="mt-5 flex-1 space-y-2 text-sm">
              {info.beneficios.map((b) => (
                <li key={b} className="flex items-center gap-2">
                  <Check className={cn("h-4 w-4", popular ? "text-coral-400" : "text-emerald-500")} /> {b}
                </li>
              ))}
            </ul>
            <button
              disabled={ehAtual || alterar.isPending}
              onClick={() => alterar.mutate({ plano: p })}
              className={cn("mt-6 w-full", popular ? "btn bg-white text-marca-700 hover:bg-marca-50" : "btn-contorno")}
            >
              {ehAtual ? "Plano atual" : p === "free" ? "Voltar para o Free" : `Assinar ${info.nome}`}
            </button>
          </div>
        );
      })}
    </div>
  );
}
