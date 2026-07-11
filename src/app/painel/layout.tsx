import Link from "next/link";
import { DashboardNav } from "@/components/dashboard-nav";
import { createClient } from "@/lib/supabase/server";
const ArrowIcon = () => <svg viewBox="0 0 20 20" className="size-4" fill="none"><path d="M4 10h12m-5-5 5 5-5 5" stroke="currentColor" strokeWidth="1.5" /></svg>;

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data:{ user } } = await supabase.auth.getUser();
  const { data:store } = user ? await supabase.from("stores").select("name, slug").eq("owner_id",user.id).maybeSingle() : { data:null };
  return (
    <div className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <div className="sidebar-brand-row">
          <Link href="/painel" className="sidebar-brand" aria-label="Novam Shop, painel"><span>N</span><strong>NOVAM.</strong></Link>
          <span className="sidebar-plan">MVP</span>
        </div>
        <div className="sidebar-workspace"><span>Minha operação</span><strong>{store?.name || "Minha loja"}</strong><i>{(store?.name || "NS").slice(0,2).toUpperCase()}</i></div>
        <DashboardNav />
        {store&&<Link className="sidebar-view-store" href={`/loja/${store.slug}`} target="_blank"><span>Ver minha loja</span><b>↗</b></Link>}
        <form action="/auth/logout" method="post"><button className="sidebar-logout" type="submit"><span>Sair da conta</span><ArrowIcon /></button></form>
      </aside>
      <header className="dashboard-mobile-header"><Link href="/painel" className="brand-mark">NOVAM<span>SHOP</span></Link><form action="/auth/logout" method="post"><button type="submit">Sair</button></form></header>
      <main className="dashboard-main">{children}</main>
    </div>
  );
}
