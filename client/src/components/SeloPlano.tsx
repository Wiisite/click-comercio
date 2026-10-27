import { Crown, Gem } from "lucide-react";

export function SeloPlano({ plano }: { plano: string }) {
  if (plano === "destaque")
    return (
      <span className="selo bg-gradient-to-r from-coral-500 to-amber-400 text-white">
        <Crown className="h-3 w-3" /> Destaque
      </span>
    );
  if (plano === "premium")
    return (
      <span className="selo bg-marca-100 text-marca-700">
        <Gem className="h-3 w-3" /> Premium
      </span>
    );
  return null;
}
