import { BarChart3, Check, Eye, Mail, MessageCircle, Target, Users } from "lucide-react";
import { FORMATOS_VENDA, linkWhatsapp } from "@shared/validacao";
import { AnuncieAqui, Banner, type DadosAnuncio } from "@/components/Anuncio";
import { cn } from "@/lib/utils";

// Contato comercial exibido nesta página — troque pelo número/e-mail reais
const WHATSAPP_COMERCIAL = "11999999999";
const EMAIL_COMERCIAL = "anuncie@clickcomercio.com.br";

const exemplo: DadosAnuncio = {
  titulo: "Seu produto em destaque aqui",
  texto: "Alcance síndicos, administradoras e moradores no momento da decisão de compra.",
  link: "#",
  anunciante: "Sua marca",
  cta: "Comprar agora",
  preco: "R$ 199,90",
  imagemUrl: null,
  icone: "ShoppingBag",
  tema: "marca",
};

/** Miniatura de página mostrando onde fica cada espaço. */
function Mapa({ destaque }: { destaque: string }) {
  const bloco = (ativo: boolean, cls: string) => (
    <div className={cn("rounded", ativo ? "bg-coral-500 shadow-md shadow-coral-500/40" : "bg-slate-200", cls)} />
  );
  return (
    <div className="space-y-1.5 rounded-xl border border-slate-200 bg-white p-3">
      <div className="h-2 w-1/3 rounded bg-marca-200" />
      {bloco(destaque === "home-central" || destaque === "blog" || destaque === "categoria", "h-6")}
      <div className="grid grid-cols-[1fr_28%] gap-1.5">
        <div className="grid grid-cols-2 gap-1.5">
          {Array.from({ length: 4 }, (_, i) => <div key={i} className="h-7 rounded bg-slate-100" />)}
        </div>
        {bloco(destaque === "home-lateral" || destaque === "categoria", "h-full")}
      </div>
    </div>
  );
}

export default function Anuncie() {
  const mensagem = "Olá! Tenho interesse em anunciar no Click Comércio.";
  return (
    <>
      <section className="bg-gradient-to-br from-marca-900 via-marca-700 to-marca-500 text-white">
        <div className="container-site py-16 text-center sm:py-20">
          <span className="selo bg-white/15 px-3 py-1 text-white">Publicidade</span>
          <h1 className="mx-auto mt-5 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            Venda seus produtos para quem <span className="text-coral-400">decide as compras</span> do condomínio
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-marca-100">
            Banners na página inicial, nas categorias e no blog — exibidos para síndicos, administradoras e moradores.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a href={`https://wa.me/55${WHATSAPP_COMERCIAL}?text=${encodeURIComponent(mensagem)}`} target="_blank" rel="noopener noreferrer" className="btn-whats px-6 py-3">
              <MessageCircle className="h-5 w-5" /> Falar com o comercial
            </a>
            <a href={`mailto:${EMAIL_COMERCIAL}?subject=Quero anunciar`} className="btn bg-white/10 px-6 py-3 text-white hover:bg-white/20">
              <Mail className="h-5 w-5" /> {EMAIL_COMERCIAL}
            </a>
          </div>
        </div>
      </section>

      <section className="container-site -mt-8 grid gap-3 sm:grid-cols-3">
        {[
          [Target, "Público qualificado", "Quem acessa está procurando produtos e serviços para condomínio."],
          [Eye, "Segmentação por categoria", "Apareça só para quem busca Elevadores, Piscinas, CFTV…"],
          [BarChart3, "Relatório de cliques", "Acompanhe quantas pessoas clicaram no seu anúncio."],
        ].map(([I, t, d]) => {
          const Icone = I as typeof Target;
          return (
            <div key={t as string} className="cartao p-5 shadow-lg">
              <Icone className="mb-3 h-6 w-6 text-coral-500" />
              <h3 className="font-bold">{t as string}</h3>
              <p className="mt-1 text-sm text-slate-500">{d as string}</p>
            </div>
          );
        })}
      </section>

      <section className="container-site mt-16">
        <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Formatos disponíveis</h2>
        <p className="mt-1 text-slate-500">Escolha onde sua marca vai aparecer.</p>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FORMATOS_VENDA.map((f) => (
            <div key={f.id} className="cartao flex flex-col p-5">
              <Mapa destaque={f.id} />
              <h3 className="mt-4 font-bold">{f.nome}</h3>
              <p className="mt-1 flex-1 text-sm text-slate-500">{f.onde}</p>
              <p className="mt-3 text-xs text-slate-400">Arte: {f.medida}</p>
              <p className="mt-1 text-xl font-extrabold text-marca-700">{f.preco}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-site mt-16">
        <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Como seu anúncio aparece</h2>
        <p className="mt-1 text-slate-500">Exemplos reais dos formatos — criamos a arte para você, se preferir.</p>
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_18rem]">
          <div className="space-y-6">
            <div>
              <p className="mb-2 text-sm font-semibold text-slate-500">Banner horizontal (Home, categorias e blog)</p>
              <Banner anuncio={exemplo} formato="horizontal" preview />
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold text-slate-500">Espaço livre, como o visitante vê hoje</p>
              <AnuncieAqui formato="horizontal" />
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold text-slate-500">Banner lateral</p>
            <Banner anuncio={{ ...exemplo, tema: "coral", titulo: "Seu produto aqui", texto: "Ideal para ofertas." }} formato="lateral" preview />
          </div>
        </div>
      </section>

      <section className="container-site mt-16">
        <div className="cartao grid gap-8 p-8 lg:grid-cols-2 lg:items-center">
          <div>
            <Users className="mb-3 h-8 w-8 text-marca-600" />
            <h2 className="text-2xl font-extrabold">Como contratar</h2>
            <p className="mt-2 text-slate-500">Em até 24h seu anúncio está no ar.</p>
          </div>
          <ol className="space-y-3">
            {["Escolha o formato e as categorias", "Envie a arte ou peça para criarmos", "Aprovamos e publicamos — você acompanha os cliques"].map((p) => (
              <li key={p} className="flex items-center gap-3">
                <Check className="h-5 w-5 shrink-0 text-emerald-500" /> {p}
              </li>
            ))}
          </ol>
        </div>
      </section>
    </>
  );
}
