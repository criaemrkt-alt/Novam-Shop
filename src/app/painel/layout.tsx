import Link from "next/link";

const StoreIcon = () => <svg viewBox="0 0 24 24" className="size-5" fill="none"><path d="M4 9h16l-1-5H5L4 9Zm1 0v11h14V9M9 20v-6h6v6" stroke="currentColor" strokeWidth="1.5" /></svg>;
const BoxIcon = () => <svg viewBox="0 0 24 24" className="size-5" fill="none"><path d="m4 7 8-4 8 4-8 4-8-4Zm0 0v10l8 4 8-4V7M12 11v10" stroke="currentColor" strokeWidth="1.5" /></svg>;
const OrdersIcon = () => <svg viewBox="0 0 24 24" className="size-5" fill="none"><path d="M6 3h12v18H6V3Zm3 5h6M9 12h6M9 16h4" stroke="currentColor" strokeWidth="1.5" /></svg>;
const ArrowIcon = () => <svg viewBox="0 0 20 20" className="size-4" fill="none"><path d="M4 10h12m-5-5 5 5-5 5" stroke="currentColor" strokeWidth="1.5" /></svg>;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <div className="sidebar-brand-row">
          <Link href="/painel" className="sidebar-brand" aria-label="Novam Shop, painel"><span>N</span><strong>NOVAM.</strong></Link>
          <span className="sidebar-plan">MVP</span>
        </div>
        <div className="sidebar-workspace"><span>Minha operação</span><strong>Minha loja</strong><i>NS</i></div>
        <nav className="dashboard-nav">
          <p>Gestão</p>
          <Link className="dashboard-nav-active" href="/painel"><i><StoreIcon /></i><span>Minha loja</span></Link>
          <span><i><BoxIcon /></i><span>Produtos</span><small>Em breve</small></span>
          <span><i><OrdersIcon /></i><span>Pedidos</span><small>Em breve</small></span>
        </nav>
        <div className="sidebar-note"><div><span>Próxima etapa</span><b>02</b></div><strong>Identidade visual</strong><p>Adicione logo e banner para deixar a loja com a sua cara.</p></div>
        <form action="/auth/logout" method="post"><button className="sidebar-logout" type="submit"><span>Sair da conta</span><ArrowIcon /></button></form>
      </aside>
      <header className="dashboard-mobile-header"><Link href="/painel" className="brand-mark">NOVAM<span>SHOP</span></Link><form action="/auth/logout" method="post"><button type="submit">Sair</button></form></header>
      <main className="dashboard-main">{children}</main>
    </div>
  );
}
