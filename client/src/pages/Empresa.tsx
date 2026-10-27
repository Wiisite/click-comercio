import { ArrowLeft, Mail, MapPin, MessageCircle, Phone, Send, Star } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Link, useParams } from "wouter";
import { linkWhatsapp } from "@shared/validacao";
import { EspacoAnuncio } from "@/components/Anuncio";
import { Estrelas, SeletorEstrelas } from "@/components/Estrelas";
import { Carregando } from "@/components/Layout";
import { LeadModal } from "@/components/LeadModal";
import { LogoEmpresa } from "@/components/Logo";
import { SeloPlano } from "@/components/SeloPlano";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/lib/useAuth";
import { formatarData, iniciais, mensagemErro } from "@/lib/utils";
import NaoEncontrado from "./NaoEncontrado";

export default function Empresa() {
  const { id } = useParams<{ id: string }>();
  const { usuario } = useAuth();
  const { data: empresa, isLoading, error } = trpc.empresas.porId.useQuery({ id });
  const [leadAberto, setLeadAberto] = useState(false);

  if (isLoading) return <Carregando />;
  if (error || !empresa) return <NaoEncontrado />;

  return (
    <>
      <div className="h-40 bg-gradient-to-br from-marca-700 via-marca-600 to-coral-500 sm:h-52" />
      <div className="container-site -mt-20 pb-24 sm:pb-8">
        <Link href="/servicos" className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-white/90 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Voltar para a busca
        </Link>
        {!empresa.aprovado && (
          <div className="mb-4 rounded-xl bg-amber-100 px-4 py-3 text-sm text-amber-800">
            Esta empresa ainda está aguardando aprovação e não aparece na busca.
          </div>
        )}
        <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
          <div className="space-y-6">
            <div className="cartao animar-entrada p-6 sm:p-8">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <LogoEmpresa nome={empresa.nomeEmpresa} url={empresa.logoUrl} className="h-24 w-24 text-3xl shadow-lg" />
                <div>
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <SeloPlano plano={empresa.plano} />
                    <Link href={`/servicos?categoria=${empresa.categoriaId}`} className="selo bg-slate-100 text-slate-600 hover:bg-slate-200">
                      {empresa.categoria.nome}
                    </Link>
                  </div>
                  <h1 className="text-3xl font-extrabold tracking-tight">{empresa.nomeEmpresa}</h1>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <Estrelas nota={empresa.media} />
                      <strong className="text-tinta">{empresa.media ? empresa.media.toFixed(1) : "—"}</strong>
                      ({empresa.totalAvaliacoes} avaliaç{empresa.totalAvaliacoes === 1 ? "ão" : "ões"})
                    </span>
                    <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {empresa.cidade}</span>
                  </div>
                </div>
              </div>
              <h2 className="mb-2 mt-8 font-bold">Sobre a empresa</h2>
              <p className="whitespace-pre-line leading-relaxed text-slate-600">{empresa.descricao}</p>
            </div>

            <Avaliacoes empresaId={empresa.id} ehDono={usuario?.id === empresa.usuarioId} />
          </div>

          <aside className="space-y-4">
            <div className="cartao space-y-3 p-6">
              <h2 className="font-bold">Fale com a empresa</h2>
              <a href={linkWhatsapp(empresa.whatsapp, empresa.nomeEmpresa)} target="_blank" rel="noopener noreferrer" className="btn-whats w-full py-3">
                <MessageCircle className="h-5 w-5" /> Conversar no WhatsApp
              </a>
              <button onClick={() => setLeadAberto(true)} className="btn-coral w-full py-3">
                <Send className="h-4 w-4" /> Solicitar orçamento
              </button>
              <div className="space-y-2 border-t border-slate-100 pt-4 text-sm">
                <a href={`tel:${empresa.telefone}`} className="flex items-center gap-3 rounded-lg p-2 hover:bg-slate-50">
                  <Phone className="h-4 w-4 text-marca-600" /> {empresa.telefone}
                </a>
                <a href={`mailto:${empresa.email}`} className="flex items-center gap-3 rounded-lg p-2 hover:bg-slate-50">
                  <Mail className="h-4 w-4 text-marca-600" /> <span className="truncate">{empresa.email}</span>
                </a>
                {empresa.endereco && (
                  <p className="flex items-center gap-3 p-2"><MapPin className="h-4 w-4 shrink-0 text-marca-600" /> {empresa.endereco}</p>
                )}
              </div>
            </div>
            <EspacoAnuncio posicao="servicos" formato="lateral" categoriaId={empresa.categoriaId} />
          </aside>
        </div>
      </div>

      {/* Barra fixa de ações no mobile */}
      <div className="fixed inset-x-0 bottom-0 z-30 flex gap-2 border-t border-slate-200 bg-white/95 p-3 backdrop-blur lg:hidden">
        <a href={linkWhatsapp(empresa.whatsapp, empresa.nomeEmpresa)} target="_blank" rel="noopener noreferrer" className="btn-whats flex-1">
          <MessageCircle className="h-4 w-4" /> WhatsApp
        </a>
        <button onClick={() => setLeadAberto(true)} className="btn-coral flex-1">Orçamento</button>
      </div>

      <LeadModal aberto={leadAberto} onFechar={() => setLeadAberto(false)} empresa={empresa} />
    </>
  );
}

export function Avaliacoes({ empresaId, ehDono }: { empresaId: string; ehDono: boolean }) {
  const { usuario } = useAuth();
  const utils = trpc.useUtils();
  const { data } = trpc.avaliacoes.listar.useQuery({ empresaId });
  const minha = data?.find((a) => usuario && a.usuarioId === usuario.id);
  const [nota, setNota] = useState(0);
  const [comentario, setComentario] = useState("");
  const enviar = trpc.avaliacoes.enviar.useMutation({
    onSuccess: () => {
      toast.success("Avaliação enviada. Obrigado!");
      setNota(0);
      setComentario("");
      utils.avaliacoes.listar.invalidate({ empresaId });
      utils.empresas.porId.invalidate({ id: empresaId });
    },
    onError: (e) => toast.error(mensagemErro(e)),
  });

  const submeter = (e: FormEvent) => {
    e.preventDefault();
    if (!nota) return toast.error("Escolha de 1 a 5 estrelas.");
    enviar.mutate({ empresaId, nota, comentario: comentario || undefined });
  };

  const distribuicao = [5, 4, 3, 2, 1].map((n) => ({ n, qtd: data?.filter((a) => a.nota === n).length ?? 0 }));

  return (
    <div className="cartao p-6 sm:p-8">
      <h2 className="text-xl font-bold">Avaliações</h2>

      {!!data?.length && (
        <div className="mt-4 space-y-1.5">
          {distribuicao.map(({ n, qtd }) => (
            <div key={n} className="flex items-center gap-3 text-sm">
              <span className="flex w-8 items-center gap-0.5 text-slate-500">{n}<Star className="h-3 w-3 fill-current" /></span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-amber-400" style={{ width: `${(qtd / data.length) * 100}%` }} />
              </div>
              <span className="w-6 text-right text-slate-400">{qtd}</span>
            </div>
          ))}
        </div>
      )}

      {!ehDono && (
        usuario ? (
          <form onSubmit={submeter} className="mt-6 rounded-2xl bg-slate-50 p-5">
            <p className="mb-3 font-semibold">{minha ? "Atualizar sua avaliação" : "Avalie esta empresa"}</p>
            <SeletorEstrelas valor={nota} onChange={setNota} />
            <textarea
              className="campo mt-3 min-h-20"
              placeholder="Conte como foi sua experiência (opcional)"
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
            />
            <button className="btn-primario mt-3" disabled={enviar.isPending}>Enviar avaliação</button>
          </form>
        ) : (
          <p className="mt-6 rounded-2xl bg-slate-50 p-5 text-sm text-slate-600">
            <Link href="/login" className="font-semibold text-marca-600">Entre na sua conta</Link> para avaliar esta empresa.
          </p>
        )
      )}

      <ul className="mt-6 divide-y divide-slate-100">
        {data?.map((a) => (
          <li key={a.id} className="flex gap-4 py-5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-marca-100 text-sm font-bold text-marca-700">
              {iniciais(a.usuario.nome)}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <strong>{a.usuario.nome}</strong>
                <span className="text-xs text-slate-400">{formatarData(a.criadoEm)}</span>
              </div>
              <Estrelas nota={a.nota} tamanho="w-3.5 h-3.5" />
              {a.comentario && <p className="mt-2 text-sm text-slate-600">{a.comentario}</p>}
            </div>
          </li>
        ))}
        {data?.length === 0 && <li className="py-6 text-center text-sm text-slate-400">Ainda não há avaliações.</li>}
      </ul>
    </div>
  );
}
