import { Building2, Eye, EyeOff, Home as Casa, KeyRound, UserRound, Users } from "lucide-react";
import { useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";
import { Link, useLocation, useSearch } from "wouter";
import { cadastroSchema, loginSchema, tiposCadastro } from "@shared/validacao";
import { Campo } from "@/components/Modal";
import { trpc } from "@/lib/trpc";
import { cn, mensagemErro } from "@/lib/utils";

const descricaoTipos = {
  sindico: { rotulo: "Síndico", icone: KeyRound },
  administradora: { rotulo: "Administradora", icone: Users },
  morador: { rotulo: "Morador", icone: Casa },
  prestador: { rotulo: "Prestador", icone: Building2 },
} as const;

function errosDe(issues: { path: PropertyKey[]; message: string }[]) {
  return Object.fromEntries(issues.map((i) => [String(i.path[0]), i.message]));
}

function CartaoAuth({ titulo, subtitulo, children }: { titulo: string; subtitulo: ReactNode; children: ReactNode }) {
  return (
    <div className="container-site flex justify-center py-12 sm:py-20">
      <div className="cartao animar-entrada w-full max-w-md p-6 shadow-xl sm:p-8">
        <h1 className="text-2xl font-extrabold tracking-tight">{titulo}</h1>
        <p className="mb-6 mt-1 text-sm text-slate-500">{subtitulo}</p>
        {children}
      </div>
    </div>
  );
}

function CampoSenha({ valor, onChange, erro }: { valor: string; onChange: (v: string) => void; erro?: string }) {
  const [ver, setVer] = useState(false);
  return (
    <Campo rotulo="Senha" erro={erro}>
      <div className="relative">
        <input
          className="campo pr-11"
          type={ver ? "text" : "password"}
          autoComplete="current-password"
          value={valor}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Mínimo 8 caracteres"
        />
        <button type="button" onClick={() => setVer((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" aria-label="Mostrar senha">
          {ver ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </Campo>
  );
}

function useAposEntrar() {
  const utils = trpc.useUtils();
  const [, navegar] = useLocation();
  return async (tipo: string) => {
    await utils.auth.me.invalidate();
    navegar(tipo === "prestador" ? "/dashboard" : tipo === "admin" ? "/admin" : "/servicos");
  };
}

export function Login() {
  const [form, setForm] = useState({ email: "", senha: "" });
  const [erros, setErros] = useState<Record<string, string>>({});
  const aposEntrar = useAposEntrar();
  const login = trpc.auth.login.useMutation();

  async function enviar(e: FormEvent) {
    e.preventDefault();
    const r = loginSchema.safeParse(form);
    if (!r.success) return setErros(errosDe(r.error.issues));
    setErros({});
    try {
      const u = await login.mutateAsync(r.data);
      await aposEntrar(u.tipo);
    } catch (err) {
      toast.error(mensagemErro(err));
    }
  }

  return (
    <CartaoAuth titulo="Bem-vindo de volta" subtitulo={<>Não tem conta? <Link href="/cadastro" className="font-semibold text-marca-600">Cadastre-se grátis</Link></>}>
      <form onSubmit={enviar} className="space-y-4" noValidate>
        <Campo rotulo="E-mail" erro={erros.email}>
          <input className="campo" type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </Campo>
        <CampoSenha valor={form.senha} onChange={(senha) => setForm({ ...form, senha })} erro={erros.senha} />
        <button className="btn-primario w-full py-3" disabled={login.isPending}>
          {login.isPending ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </CartaoAuth>
  );
}

export function Cadastro() {
  const tipoInicial = new URLSearchParams(useSearch()).get("tipo");
  const [form, setForm] = useState({
    nome: "",
    email: "",
    senha: "",
    telefone: "",
    tipo: (tiposCadastro as readonly string[]).includes(tipoInicial ?? "") ? tipoInicial! : "sindico",
  });
  const [erros, setErros] = useState<Record<string, string>>({});
  const aposEntrar = useAposEntrar();
  const cadastro = trpc.auth.cadastro.useMutation();

  async function enviar(e: FormEvent) {
    e.preventDefault();
    const r = cadastroSchema.safeParse(form);
    if (!r.success) return setErros(errosDe(r.error.issues));
    setErros({});
    try {
      const u = await cadastro.mutateAsync(r.data);
      toast.success("Conta criada com sucesso!");
      await aposEntrar(u.tipo);
    } catch (err) {
      toast.error(mensagemErro(err));
    }
  }

  return (
    <CartaoAuth titulo="Crie sua conta" subtitulo={<>Já tem conta? <Link href="/login" className="font-semibold text-marca-600">Entrar</Link></>}>
      <form onSubmit={enviar} className="space-y-4" noValidate>
        <div>
          <span className="mb-1.5 block text-sm font-medium text-slate-700">Eu sou</span>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {tiposCadastro.map((t) => {
              const { rotulo, icone: I } = descricaoTipos[t];
              return (
                <button
                  type="button"
                  key={t}
                  onClick={() => setForm({ ...form, tipo: t })}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-xl border p-3 text-xs font-semibold transition",
                    form.tipo === t ? "border-marca-600 bg-marca-50 text-marca-700 ring-4 ring-marca-100" : "border-slate-200 text-slate-600 hover:border-marca-200",
                  )}
                >
                  <I className="h-5 w-5" /> {rotulo}
                </button>
              );
            })}
          </div>
          {/* Dropdown equivalente, como pede o PRD, para leitores de tela e teclado */}
          <select className="sr-only" aria-label="Tipo de usuário" value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
            {tiposCadastro.map((t) => <option key={t} value={t}>{descricaoTipos[t].rotulo}</option>)}
          </select>
        </div>
        <Campo rotulo={form.tipo === "prestador" ? "Seu nome (responsável)" : "Nome"} erro={erros.nome}>
          <div className="relative">
            <UserRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input className="campo pl-9" autoComplete="name" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
          </div>
        </Campo>
        <Campo rotulo="E-mail" erro={erros.email}>
          <input className="campo" type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </Campo>
        <Campo rotulo="Telefone (opcional)" erro={erros.telefone}>
          <input className="campo" type="tel" autoComplete="tel" value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
        </Campo>
        <CampoSenha valor={form.senha} onChange={(senha) => setForm({ ...form, senha })} erro={erros.senha} />
        <button className="btn-primario w-full py-3" disabled={cadastro.isPending}>
          {cadastro.isPending ? "Criando conta…" : "Criar conta"}
        </button>
      </form>
    </CartaoAuth>
  );
}
