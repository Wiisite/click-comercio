import { useEffect } from "react";
import { Toaster } from "sonner";
import { Route, Switch, useLocation } from "wouter";
import { Layout } from "./components/Layout";
import Admin from "./pages/Admin";
import Anuncie from "./pages/Anuncie";
import Artigo from "./pages/Artigo";
import Blog from "./pages/Blog";
import Dashboard from "./pages/Dashboard";
import Empresa from "./pages/Empresa";
import Home from "./pages/Home";
import { Cadastro, Login } from "./pages/Auth";
import MeusPedidos from "./pages/MeusPedidos";
import NaoEncontrado from "./pages/NaoEncontrado";
import Servicos from "./pages/Servicos";

function RolarAoTopo() {
  const [local] = useLocation();
  useEffect(() => {
    if (!window.location.hash) window.scrollTo(0, 0);
  }, [local]);
  return null;
}

export default function App() {
  return (
    <Layout>
      <RolarAoTopo />
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/servicos" component={Servicos} />
        <Route path="/empresa/:id" component={Empresa} />
        <Route path="/login" component={Login} />
        <Route path="/cadastro" component={Cadastro} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/meus-pedidos" component={MeusPedidos} />
        <Route path="/blog" component={Blog} />
        <Route path="/blog/:id" component={Artigo} />
        <Route path="/admin" component={Admin} />
        <Route path="/anuncie" component={Anuncie} />
        <Route component={NaoEncontrado} />
      </Switch>
      <Toaster position="top-center" richColors />
    </Layout>
  );
}
