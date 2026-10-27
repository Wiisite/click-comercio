import { Inbox, MessageCircle, MessagesSquare } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { linkWhatsapp } from "@shared/validacao";
import { Chat } from "@/components/Chat";
import { Carregando } from "@/components/Layout";
import { LogoEmpresa } from "@/components/Logo";
import { Modal } from "@/components/Modal";
import { trpc } from "@/lib/trpc";
import { useExigirLogin } from "@/lib/useAuth";
import { cn, formatarDataHora } from "@/lib/utils";

const STATUS = {
  novo: ["Aguardando resposta", "bg-amber-100 text-amber-700"],
  respondido: ["Respondido", "bg-sky-100 text-sky-700"],
  fechado: ["Concluído", "bg-emerald-100 text-emerald-700"],
} as const;

export default function MeusPedidos() {
  const { usuario } = useExigirLogin();
  const { data, isLoading } = trpc.leads.meusPedidos.useQuery(undefined, { enabled: !!usuario });
  const [chat, setChat] = useState<{ id: string; nome: string } | null>(null);

  if (!usuario || isLoading) return <Carregando />;

  return (
    <div className="container-site max-w-4xl py-8">
      <h1 className="text-3xl font-extrabold tracking-tight">Meus orçamentos</h1>
      <p className="mb-6 mt-1 text-slate-500">Acompanhe seus pedidos e converse com as empresas.</p>
      {!data?.length ? (
        <div className="cartao py-16 text-center">
          <Inbox className="mx-auto mb-3 h-12 w-12 text-slate-300" />
          <p className="text-slate-500">Você ainda não pediu nenhum orçamento.</p>
          <Link href="/servicos" className="btn-primario mt-5">Encontrar empresas</Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {data.map((l) => (
            <li key={l.id} className="cartao flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
              <LogoEmpresa nome={l.empresa.nomeEmpresa} url={l.empresa.logoUrl} className="h-12 w-12 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/empresa/${l.empresa.id}`} className="font-bold hover:text-marca-600">{l.empresa.nomeEmpresa}</Link>
                  <span className={cn("selo", STATUS[l.status][1])}>{STATUS[l.status][0]}</span>
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-slate-600">{l.mensagem}</p>
                <p className="mt-1 text-xs text-slate-400">{formatarDataHora(l.criadoEm)}</p>
              </div>
              <div className="flex gap-2">
                <button className="btn-primario" onClick={() => setChat({ id: l.id, nome: l.empresa.nomeEmpresa })}>
                  <MessagesSquare className="h-4 w-4" /> Chat
                </button>
                <a href={linkWhatsapp(l.empresa.whatsapp, l.empresa.nomeEmpresa)} target="_blank" rel="noopener noreferrer" className="btn-whats px-3" aria-label="WhatsApp">
                  <MessageCircle className="h-4 w-4" />
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}
      <Modal aberto={!!chat} onFechar={() => setChat(null)} titulo={chat?.nome ?? ""}>
        {chat && <Chat leadId={chat.id} />}
      </Modal>
    </div>
  );
}
