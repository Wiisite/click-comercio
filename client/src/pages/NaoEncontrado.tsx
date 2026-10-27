import { Compass } from "lucide-react";
import { Link } from "wouter";

export default function NaoEncontrado() {
  return (
    <div className="container-site flex flex-col items-center py-24 text-center">
      <Compass className="mb-4 h-16 w-16 text-marca-200" />
      <h1 className="text-3xl font-extrabold">Página não encontrada</h1>
      <p className="mt-2 text-slate-500">O endereço pode ter mudado ou não existe mais.</p>
      <Link href="/" className="btn-primario mt-6">Voltar ao início</Link>
    </div>
  );
}
