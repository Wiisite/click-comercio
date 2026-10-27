import {
  ArrowUpDown, Briefcase, Bug, Calculator, Cctv, Droplets, PaintRoller, Scale, ShieldCheck, Sparkles, Trees, Waves, Zap,
  type LucideIcon,
} from "lucide-react";

const icones: Record<string, LucideIcon> = {
  ArrowUpDown, Bug, Calculator, Cctv, Droplets, PaintRoller, Scale, ShieldCheck, Sparkles, Trees, Waves, Zap,
};

/** Renderiza o ícone de categoria salvo no banco (nome do ícone lucide). */
export function Icone({ nome, className }: { nome?: string | null; className?: string }) {
  const Comp = (nome && icones[nome]) || Briefcase;
  return <Comp className={className} />;
}

const cores = [
  "bg-marca-50 text-marca-600",
  "bg-orange-50 text-coral-500",
  "bg-emerald-50 text-emerald-600",
  "bg-sky-50 text-sky-600",
  "bg-rose-50 text-rose-500",
  "bg-amber-50 text-amber-600",
];
export const corCategoria = (indice: number) => cores[indice % cores.length];
