import { Building2, ChevronDown, Inbox, LayoutDashboard, LogOut, Menu, Shield, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { rotuloTipo } from "@shared/validacao";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/lib/useAuth";
import { cn, iniciais } from "@/lib/utils";
import { Marca } from "./Logo";

const links = [
  { href: "/servicos", rotulo: "Serviços" },
  { href: "/blog", rotulo: "Blog" },
  { href: "/#como-funciona", rotulo: "Como funciona" },
  { href: "/anuncie", rotulo: "Anuncie" },
];

function MenuUsuario() {
  const { usuario } = useAuth();
  const [aberto, setAberto] = useState(false);
  const utils = trpc.useUtils();
  const [, navegar] = useLocation();
  const sair = trpc.auth.logout.useMutation({
    onSuccess: async () => {
      await utils.invalidate();
      navegar("/");
    },
  });
  if (!usuario) return null;
  return (
    <div className="relative">
      <button onClick={() => setAberto((a) => !a)} className="btn-fantasma gap-2 px-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-marca-100 text-xs font-bold text-marca-700">
          {iniciais(usuario.nome)}
        </span>
        <span className="hidden max-w-32 truncate md:inline">{usuario.nome.split(" ")[0]}</span>
        <ChevronDown className="h-4 w-4 text-slate-400" />
      </button>
      {aberto && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setAberto(false)} />
          <div className="animar-entrada absolute right-0 z-50 mt-2 w-60 rounded-2xl border border-slate-100 bg-white p-2 shadow-xl">
            <div className="px-3 py-2">
              <div className="truncate font-semibold">{usuario.nome}</div>
              <div className="text-xs text-slate-500">{rotuloTipo[usuario.tipo]}</div>
            </div>
            <hr className="my-1 border-slate-100" />
            {(usuario.tipo === "prestador" || usuario.tipo === "admin") && (
              <ItemMenu href="/dashboard" icone={<LayoutDashboard className="h-4 w-4" />} fechar={() => setAberto(false)}>
                Painel da empresa
              </ItemMenu>
            )}
            <ItemMenu href="/meus-pedidos" icone={<Inbox className="h-4 w-4" />} fechar={() => setAberto(false)}>
              Meus orçamentos
            </ItemMenu>
            {usuario.tipo === "admin" && (
              <ItemMenu href="/admin" icone={<Shield className="h-4 w-4" />} fechar={() => setAberto(false)}>
                Administração
              </ItemMenu>
            )}
            <button
              onClick={() => sair.mutate()}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50"
            >
              <LogOut className="h-4 w-4" /> Sair
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function ItemMenu({ href, icone, children, fechar }: { href: string; icone: ReactNode; children: ReactNode; fechar: () => void }) {
  return (
    <Link href={href} onClick={fechar} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-slate-50">
      {icone} {children}
    </Link>
  );
}

function Header() {
  const { usuario, carregando } = useAuth();
  const [local] = useLocation();
  const [menuMobile, setMenuMobile] = useState(false);
  const [rolou, setRolou] = useState(false);

  useEffect(() => setMenuMobile(false), [local]);
  useEffect(() => {
    const f = () => setRolou(window.scrollY > 8);
    window.addEventListener("scroll", f, { passive: true });
    return () => window.removeEventListener("scroll", f);
  }, []);

  const ctaEmpresa = usuario ? "/dashboard" : "/cadastro?tipo=prestador";

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b bg-white/85 backdrop-blur-lg transition",
        rolou ? "border-slate-200 shadow-sm" : "border-transparent",
      )}
    >
      <div className="container-site flex h-16 items-center gap-6">
        <Link href="/"><Marca /></Link>
        <nav className="hidden flex-1 items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:text-marca-600",
                local === l.href && "text-marca-600",
              )}
            >
              {l.rotulo}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          {!carregando && !usuario && (
            <Link href="/login" className="btn-fantasma hidden sm:inline-flex">Entrar</Link>
          )}
          {usuario?.tipo !== "admin" && (
            <Link href={ctaEmpresa} className="btn-primario hidden sm:inline-flex">
              <Building2 className="h-4 w-4" /> Cadastrar empresa
            </Link>
          )}
          <MenuUsuario />
          <button className="btn-fantasma p-2 md:hidden" onClick={() => setMenuMobile((m) => !m)} aria-label="Menu">
            {menuMobile ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {menuMobile && (
        <nav className="animar-entrada container-site flex flex-col gap-1 border-t border-slate-100 pb-4 pt-2 md:hidden">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="rounded-xl px-3 py-3 font-medium hover:bg-slate-50">
              {l.rotulo}
            </Link>
          ))}
          {!usuario && (
            <Link href="/login" className="rounded-xl px-3 py-3 font-medium hover:bg-slate-50">Entrar</Link>
          )}
          {usuario?.tipo !== "admin" && (
            <Link href={ctaEmpresa} className="btn-primario mt-2">
              <Building2 className="h-4 w-4" /> Cadastrar empresa
            </Link>
          )}
        </nav>
      )}
    </header>
  );
}

function Footer() {
  const { data: categorias } = trpc.categorias.listar.useQuery();
  return (
    <footer className="mt-20 bg-tinta text-slate-300">
      <div className="container-site grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Marca claro />
          <p className="mt-4 text-sm leading-relaxed text-slate-400">
            Conectamos síndicos, administradoras e moradores aos melhores prestadores de serviço para condomínios.
          </p>
        </div>
        <div>
          <h4 className="mb-4 font-semibold text-white">Categorias</h4>
          <ul className="space-y-2 text-sm">
            {categorias?.slice(0, 6).map((c) => (
              <li key={c.id}>
                <Link href={`/servicos?categoria=${c.id}`} className="hover:text-white">{c.nome}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="mb-4 font-semibold text-white">Plataforma</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/servicos" className="hover:text-white">Buscar serviços</Link></li>
            <li><Link href="/blog" className="hover:text-white">Blog</Link></li>
            <li><Link href="/cadastro?tipo=prestador" className="hover:text-white">Cadastrar minha empresa</Link></li>
            <li><Link href="/dashboard" className="hover:text-white">Planos para empresas</Link></li>
            <li><Link href="/anuncie" className="hover:text-white">Anuncie seus produtos</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-4 font-semibold text-white">Contato</h4>
          <ul className="space-y-2 text-sm">
            <li>contato@clickcomercio.com.br</li>
            <li>Atendimento de seg. a sex., 9h às 18h</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-site flex flex-col justify-between gap-2 py-6 text-xs text-slate-500 sm:flex-row">
          <span>© {new Date().getFullYear()} Click Comércio. Todos os direitos reservados.</span>
          <span>Termos de uso · Política de privacidade</span>
        </div>
      </div>
    </footer>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

export function Carregando() {
  return (
    <div className="flex justify-center py-24">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-marca-100 border-t-marca-600" />
    </div>
  );
}
