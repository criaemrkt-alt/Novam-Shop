import Link from "next/link";
import { DashboardNav } from "@/components/dashboard-nav";
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
        <DashboardNav />
        <div className="sidebar-note"><div><span>Próxima etapa</span><b>02</b></div><strong>Identidade visual</strong><p>Adicione logo e banner para deixar a loja com a sua cara.</p></div>
        <form action="/auth/logout" method="post"><button className="sidebar-logout" type="submit"><span>Sair da conta</span><ArrowIcon /></button></form>
      </aside>
      <header className="dashboard-mobile-header"><Link href="/painel" className="brand-mark">NOVAM<span>SHOP</span></Link><form action="/auth/logout" method="post"><button type="submit">Sair</button></form></header>
      <main className="dashboard-main">{children}</main>
    </div>
  );
}
