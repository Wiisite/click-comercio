import { Star } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function Estrelas({ nota, tamanho = "w-4 h-4" }: { nota: number; tamanho?: string }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${nota} de 5 estrelas`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn(tamanho, i <= Math.round(nota) ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200")}
        />
      ))}
    </span>
  );
}

export function SeletorEstrelas({ valor, onChange }: { valor: number; onChange: (n: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          aria-label={`${i} estrela${i > 1 ? "s" : ""}`}
          onMouseEnter={() => setHover(i)}
          onClick={() => onChange(i)}
          className="transition hover:scale-110"
        >
          <Star
            className={cn("h-8 w-8", i <= (hover || valor) ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200")}
          />
        </button>
      ))}
    </div>
  );
}
