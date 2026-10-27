import { MapPin } from "lucide-react";
import { Link } from "wouter";
import type { EmpresaCard as Empresa } from "@server/routers";
import { Estrelas } from "./Estrelas";
import { LogoEmpresa } from "./Logo";
import { SeloPlano } from "./SeloPlano";

export function EmpresaCard({ empresa }: { empresa: Empresa }) {
  return (
    <Link
      href={`/empresa/${empresa.id}`}
      className="cartao group flex h-full flex-col p-5 transition duration-300 hover:-translate-y-1 hover:border-marca-200 hover:shadow-xl hover:shadow-marca-600/10"
    >
      <div className="flex items-start gap-4">
        <LogoEmpresa nome={empresa.nomeEmpresa} url={empresa.logoUrl} className="h-14 w-14 shrink-0 text-lg" />
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <SeloPlano plano={empresa.plano} />
            <span className="text-xs font-medium text-slate-500">{empresa.categoriaNome}</span>
          </div>
          <h3 className="truncate font-bold transition group-hover:text-marca-600">{empresa.nomeEmpresa}</h3>
        </div>
      </div>
      <p className="mt-3 line-clamp-2 flex-1 text-sm text-slate-600">{empresa.descricao}</p>
      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-sm">
        <span className="flex items-center gap-1.5">
          <Estrelas nota={empresa.media} />
          <span className="font-semibold">{empresa.media ? empresa.media.toFixed(1) : "Novo"}</span>
          {empresa.totalAvaliacoes > 0 && <span className="text-slate-400">({empresa.totalAvaliacoes})</span>}
        </span>
        <span className="flex items-center gap-1 text-slate-500">
          <MapPin className="h-3.5 w-3.5" /> {empresa.cidade}
        </span>
      </div>
    </Link>
  );
}

export function EmpresaCardEsqueleto() {
  return (
    <div className="cartao h-48 animate-pulse p-5">
      <div className="flex gap-4">
        <div className="h-14 w-14 rounded-2xl bg-slate-100" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-1/3 rounded bg-slate-100" />
          <div className="h-4 w-2/3 rounded bg-slate-100" />
        </div>
      </div>
      <div className="mt-5 space-y-2">
        <div className="h-3 rounded bg-slate-100" />
        <div className="h-3 w-4/5 rounded bg-slate-100" />
      </div>
    </div>
  );
}
