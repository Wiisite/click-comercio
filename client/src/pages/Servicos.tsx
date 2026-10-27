import { ChevronLeft, ChevronRight, SearchX, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { EspacoAnuncio } from "@/components/Anuncio";
import { EmpresaCard, EmpresaCardEsqueleto } from "@/components/EmpresaCard";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";

const NOTAS = [
  { valor: 0, rotulo: "Qualquer" },
  { valor: 3, rotulo: "3+ ★" },
  { valor: 4, rotulo: "4+ ★" },
  { valor: 4.5, rotulo: "4,5+ ★" },
];

export default function Servicos() {
  const busca = useSearch();
  const [, navegar] = useLocation();
  const params = new URLSearchParams(busca);
  const filtros = {
    query: params.get("query") ?? "",
    categoria: params.get("categoria") ?? "",
    cidade: params.get("cidade") ?? "",
    nota: Number(params.get("nota") ?? 0),
    pagina: Math.max(1, Number(params.get("pagina") ?? 1)),
  };
  const [texto, setTexto] = useState(filtros.query);
  const [filtrosMobile, setFiltrosMobile] = useState(false);
  useEffect(() => setTexto(filtros.query), [filtros.query]);

  const atualizar = (mudancas: Partial<Record<keyof typeof filtros, string | number>>) => {
    const p = new URLSearchParams(busca);
    for (const [k, v] of Object.entries({ pagina: 1, ...mudancas })) {
      if (v === "" || v === 0 || (k === "pagina" && v === 1)) p.delete(k);
      else p.set(k, String(v));
    }
    navegar(`/servicos${p.size ? `?${p}` : ""}`, { replace: true });
  };

  // Busca dinâmica conforme digita (debounce)
  useEffect(() => {
    if (texto === filtros.query) return;
    const t = setTimeout(() => atualizar({ query: texto.trim() }), 350);
    return () => clearTimeout(t);
  }, [texto]);

  const categorias = trpc.categorias.listar.useQuery();
  const cidades = trpc.empresas.cidades.useQuery();
  const { data, isFetching, isLoading } = trpc.empresas.buscar.useQuery(
    {
      query: filtros.query || undefined,
      categoriaId: filtros.categoria || undefined,
      cidade: filtros.cidade || undefined,
      notaMin: filtros.nota || undefined,
      pagina: filtros.pagina,
    },
    { placeholderData: (anterior) => anterior },
  );
  const nomeCategoria = categorias.data?.find((c) => c.id === filtros.categoria)?.nome;
  const temFiltro = filtros.query || filtros.categoria || filtros.cidade || filtros.nota;

  const painelFiltros = (
    <div className="space-y-6">
      <div>
        <h3 className="mb-3 text-sm font-bold">Categoria</h3>
        <div className="flex flex-wrap gap-2 lg:flex-col lg:gap-1">
          <BotaoFiltro ativo={!filtros.categoria} onClick={() => atualizar({ categoria: "" })}>Todas</BotaoFiltro>
          {categorias.data?.map((c) => (
            <BotaoFiltro key={c.id} ativo={filtros.categoria === c.id} onClick={() => atualizar({ categoria: c.id })}>
              <span className="flex-1">{c.nome}</span>
              <span className="text-xs opacity-60">{c.total}</span>
            </BotaoFiltro>
          ))}
        </div>
      </div>
      <div>
        <h3 className="mb-3 text-sm font-bold">Cidade</h3>
        <select className="campo" value={filtros.cidade} onChange={(e) => atualizar({ cidade: e.target.value })}>
          <option value="">Todas as cidades</option>
          {cidades.data?.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>
      <div>
        <h3 className="mb-3 text-sm font-bold">Avaliação mínima</h3>
        <div className="grid grid-cols-4 gap-1 rounded-xl bg-slate-100 p-1">
          {NOTAS.map((n) => (
            <button
              key={n.valor}
              onClick={() => atualizar({ nota: n.valor })}
              className={cn(
                "rounded-lg px-1 py-1.5 text-xs font-semibold transition",
                filtros.nota === n.valor ? "bg-white text-marca-700 shadow-sm" : "text-slate-500",
              )}
            >
              {n.rotulo}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="container-site py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight">{nomeCategoria ?? "Serviços para condomínios"}</h1>
        <p className="mt-1 text-slate-500">
          {data ? `${data.total} empresa${data.total === 1 ? "" : "s"} encontrada${data.total === 1 ? "" : "s"}` : "Buscando…"}
          {filtros.query && <> para “<strong className="text-tinta">{filtros.query}</strong>”</>}
        </p>
      </div>

      <div className="mb-6 flex gap-2">
        <input
          className="campo"
          placeholder="Buscar serviços para condomínio..."
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
        />
        <button className="btn-contorno lg:hidden" onClick={() => setFiltrosMobile((f) => !f)}>
          <SlidersHorizontal className="h-4 w-4" /> Filtros
        </button>
      </div>

      {filtrosMobile && <div className="cartao animar-entrada mb-6 p-5 lg:hidden">{painelFiltros}</div>}

      <div className="grid gap-8 lg:grid-cols-[16rem_1fr]">
        <aside className="hidden space-y-4 lg:block">
          <div className="cartao p-5">
            {painelFiltros}
            {temFiltro ? (
              <button onClick={() => navegar("/servicos", { replace: true })} className="btn-fantasma mt-6 w-full text-rose-600">
                <X className="h-4 w-4" /> Limpar filtros
              </button>
            ) : null}
          </div>
          <EspacoAnuncio posicao="servicos" formato="lateral" categoriaId={filtros.categoria || undefined} indice={0} />
          <EspacoAnuncio posicao="servicos" formato="lateral" categoriaId={filtros.categoria || undefined} indice={1} />
        </aside>

        <div className={cn("transition-opacity", isFetching && !isLoading && "opacity-60")}>
          <div className="mb-6"><EspacoAnuncio posicao="servicos" formato="horizontal" categoriaId={filtros.categoria || undefined} /></div>
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }, (_, i) => <EmpresaCardEsqueleto key={i} />)}
            </div>
          ) : data?.itens.length ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {data.itens.map((e) => <EmpresaCard key={e.id} empresa={e} />)}
            </div>
          ) : (
            <div className="cartao flex flex-col items-center px-6 py-16 text-center">
              <SearchX className="mb-4 h-12 w-12 text-slate-300" />
              <h3 className="text-lg font-bold">Nenhuma empresa encontrada</h3>
              <p className="mt-1 text-slate-500">Tente outros termos ou remova alguns filtros.</p>
              <button onClick={() => navegar("/servicos")} className="btn-contorno mt-5">Limpar busca</button>
            </div>
          )}

          {data && data.paginas > 1 && (
            <nav className="mt-8 flex items-center justify-center gap-2" aria-label="Paginação">
              <button
                className="btn-contorno p-2"
                disabled={filtros.pagina <= 1}
                onClick={() => atualizar({ pagina: filtros.pagina - 1 })}
                aria-label="Página anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: data.paginas }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => atualizar({ pagina: p })}
                  className={cn("btn h-10 w-10 p-0", p === filtros.pagina ? "bg-marca-600 text-white" : "hover:bg-slate-100")}
                >
                  {p}
                </button>
              ))}
              <button
                className="btn-contorno p-2"
                disabled={filtros.pagina >= data.paginas}
                onClick={() => atualizar({ pagina: filtros.pagina + 1 })}
                aria-label="Próxima página"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}

function BotaoFiltro({ ativo, onClick, children }: { ativo: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded-full border px-3 py-1.5 text-left text-sm transition lg:rounded-xl lg:border-0",
        ativo ? "border-marca-600 bg-marca-50 font-semibold text-marca-700" : "border-slate-200 text-slate-600 hover:bg-slate-50",
      )}
    >
      {children}
    </button>
  );
}
