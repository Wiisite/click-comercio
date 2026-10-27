import { SendHorizonal } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/lib/useAuth";
import { cn, formatarDataHora, mensagemErro } from "@/lib/utils";

/** Chat de um lead (cliente ↔ empresa). Atualiza a cada 5 s. */
export function Chat({ leadId }: { leadId: string }) {
  const { usuario } = useAuth();
  const utils = trpc.useUtils();
  const { data } = trpc.chat.mensagens.useQuery({ leadId }, { refetchInterval: 5000 });
  const enviar = trpc.chat.enviar.useMutation({
    onSuccess: () => {
      utils.chat.mensagens.invalidate({ leadId });
      utils.leads.recebidos.invalidate();
    },
  });
  const [texto, setTexto] = useState("");
  const fim = useRef<HTMLDivElement>(null);

  useEffect(() => fim.current?.scrollIntoView({ block: "end" }), [data?.mensagens.length]);

  async function submeter(e: FormEvent) {
    e.preventDefault();
    if (!texto.trim()) return;
    try {
      await enviar.mutateAsync({ leadId, mensagem: texto });
      setTexto("");
    } catch (err) {
      toast.error(mensagemErro(err));
    }
  }

  return (
    <div className="flex h-[26rem] flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto rounded-2xl bg-slate-50 p-4">
        {data && (
          <div className="mx-auto max-w-[85%] rounded-xl bg-white p-3 text-center text-xs text-slate-500">
            Pedido original: “{data.lead.mensagem}”
          </div>
        )}
        {data?.mensagens.map((m) => {
          const minha = m.remetenteId === usuario?.id;
          return (
            <div key={m.id} className={cn("flex", minha ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm",
                  minha ? "rounded-br-sm bg-marca-600 text-white" : "rounded-bl-sm bg-white shadow-sm",
                )}
              >
                {!minha && <div className="mb-0.5 text-xs font-semibold text-marca-600">{m.remetente.nome}</div>}
                <p className="whitespace-pre-wrap">{m.mensagem}</p>
                <div className={cn("mt-1 text-[10px]", minha ? "text-marca-100" : "text-slate-400")}>
                  {formatarDataHora(m.criadoEm)}
                </div>
              </div>
            </div>
          );
        })}
        {data?.mensagens.length === 0 && (
          <p className="py-6 text-center text-sm text-slate-400">Nenhuma mensagem ainda. Comece a conversa!</p>
        )}
        <div ref={fim} />
      </div>
      <form onSubmit={submeter} className="mt-3 flex gap-2">
        <input
          className="campo"
          placeholder="Escreva uma mensagem…"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
        />
        <button className="btn-primario px-3" disabled={enviar.isPending || !texto.trim()} aria-label="Enviar">
          <SendHorizonal className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
