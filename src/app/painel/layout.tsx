import Link from "next/link";

const StoreIcon = () => <svg viewBox="0 0 24 24" className="size-5" fill="none"><path d="M4 9h16l-1-5H5L4 9Zm1 0v11h14V9M9 20v-6h6v6" stroke="currentColor" strokeWidth="1.5" /></svg>;
const BoxIcon = () => <svg viewBox="0 0 24 24" className="size-5" fill="none"><path d="m4 7 8-4 8 4-8 4-8-4Zm0 0v10l8 4 8-4V7M12 11v10" stroke="currentColor" strokeWidth="1.5" /></svg>;
const OrdersIcon = () => <svg viewBox="0 0 24 24" className="size-5" fill="none"><path d="M6 3h12v18H6V3Zm3 5h6M9 12h6M9 16h4" stroke="currentColor" strokeWidth="1.5" /></svg>;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <Link href="/painel" className="brand-mark brand-mark-light">NOVAM<span>SHOP</span></Link>
        <nav className="dashboard-nav">
          <p>Principal</p>
          <Link className="dashboard-nav-active" href="/painel"><StoreIcon /> Minha loja</Link>
          <span><BoxIcon /> Produtos <small>Em breve</small></span>
          <span><OrdersIcon /> Pedidos <small>Em breve</small></span>
        </nav>
        <div className="sidebar-note"><span>Próxima etapa</span><p>Cadastre categorias e produtos para colocar sua loja no ar.</p></div>
        <form action="/auth/logout" method="post"><button className="sidebar-logout" type="submit">Sair da conta <span>→</span></button></form>
      </aside>
      <header className="dashboard-mobile-header"><Link href="/painel" className="brand-mark">NOVAM<span>SHOP</span></Link><form action="/auth/logout" method="post"><button type="submit">Sair</button></form></header>
      <main className="dashboard-main">{children}</main>
    </div>
  );
}
