import { CheckCircle2, Send } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Link } from "wouter";
import { leadSchema } from "@shared/validacao";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/lib/useAuth";
import { mensagemErro } from "@/lib/utils";
import { Campo, Modal } from "./Modal";

type Props = {
  aberto: boolean;
  onFechar: () => void;
  /** Quando ausente, o usuário escolhe a empresa (CTA da Home). */
  empresa?: { id: string; nomeEmpresa: string };
};

export function LeadModal({ aberto, onFechar, empresa }: Props) {
  const { usuario } = useAuth();
  const [form, setForm] = useState({ empresaId: "", nomeContato: "", emailContato: "", telefoneContato: "", mensagem: "" });
  const [erros, setErros] = useState<Record<string, string>>({});
  const [enviado, setEnviado] = useState(false);
  const opcoes = trpc.empresas.buscar.useQuery({ porPagina: 100 }, { enabled: aberto && !empresa });
  const criar = trpc.leads.criar.useMutation();

  useEffect(() => {
    if (!aberto) return;
    setEnviado(false);
    setErros({});
    setForm((f) => ({
      ...f,
      empresaId: empresa?.id ?? "",
      nomeContato: f.nomeContato || usuario?.nome || "",
      emailContato: f.emailContato || usuario?.email || "",
      telefoneContato: f.telefoneContato || usuario?.telefone || "",
    }));
  }, [aberto, empresa?.id, usuario]);

  const set = (campo: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [campo]: e.target.value }));

  async function enviar(e: FormEvent) {
    e.preventDefault();
    const r = leadSchema.safeParse(form);
    if (!r.success) {
      setErros(Object.fromEntries(r.error.issues.map((i) => [String(i.path[0]), i.message])));
      return;
    }
    setErros({});
    try {
      await criar.mutateAsync(r.data);
      setEnviado(true);
      setForm((f) => ({ ...f, mensagem: "" }));
    } catch (err) {
      toast.error(mensagemErro(err));
    }
  }

  return (
    <Modal aberto={aberto} onFechar={onFechar} titulo={enviado ? "Pedido enviado!" : "Solicitar orçamento"}>
      {enviado ? (
        <div className="py-4 text-center">
          <CheckCircle2 className="mx-auto mb-3 h-14 w-14 text-emerald-500" />
          <p className="text-slate-600">A empresa recebeu seu pedido e entrará em contato em breve.</p>
          {usuario ? (
            <Link href="/meus-pedidos" className="btn-primario mt-6" onClick={onFechar}>
              Acompanhar meus pedidos
            </Link>
          ) : (
            <p className="mt-4 text-sm text-slate-500">
              <Link href="/cadastro" className="font-semibold text-marca-600" onClick={onFechar}>Crie uma conta</Link>{" "}
              para conversar com as empresas pelo chat.
            </p>
          )}
        </div>
      ) : (
        <form onSubmit={enviar} className="space-y-4" noValidate>
          {empresa ? (
            <p className="rounded-xl bg-marca-50 px-4 py-3 text-sm">
              Para: <strong>{empresa.nomeEmpresa}</strong>
            </p>
          ) : (
            <Campo rotulo="Empresa" erro={erros.empresaId && "Escolha uma empresa"}>
              <select className="campo" value={form.empresaId} onChange={set("empresaId")}>
                <option value="">Selecione…</option>
                {opcoes.data?.itens.map((o) => (
                  <option key={o.id} value={o.id}>{o.nomeEmpresa} — {o.categoriaNome}</option>
                ))}
              </select>
            </Campo>
          )}
          <Campo rotulo="Seu nome" erro={erros.nomeContato}>
            <input className="campo" value={form.nomeContato} onChange={set("nomeContato")} />
          </Campo>
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo rotulo="E-mail" erro={erros.emailContato}>
              <input className="campo" type="email" value={form.emailContato} onChange={set("emailContato")} />
            </Campo>
            <Campo rotulo="Telefone (opcional)" erro={erros.telefoneContato}>
              <input className="campo" type="tel" value={form.telefoneContato} onChange={set("telefoneContato")} />
            </Campo>
          </div>
          <Campo rotulo="O que você precisa?" erro={erros.mensagem}>
            <textarea
              className="campo min-h-28"
              placeholder="Ex.: manutenção mensal de 2 elevadores em prédio de 12 andares…"
              value={form.mensagem}
              onChange={set("mensagem")}
            />
          </Campo>
          <button className="btn-coral w-full py-3" disabled={criar.isPending}>
            <Send className="h-4 w-4" /> {criar.isPending ? "Enviando…" : "Enviar pedido de orçamento"}
          </button>
        </form>
      )}
    </Modal>
  );
}
