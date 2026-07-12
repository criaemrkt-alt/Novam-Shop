import Link from "next/link";
import { DashboardNav } from "@/components/dashboard-nav";
import { DashboardMobileNav } from "@/components/dashboard-mobile-nav";
import { createClient } from "@/lib/supabase/server";
const ArrowIcon = () => <svg viewBox="0 0 20 20" className="size-4" fill="none"><path d="M4 10h12m-5-5 5 5-5 5" stroke="currentColor" strokeWidth="1.5" /></svg>;

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data:{ user } } = await supabase.auth.getUser();
  if(user)await supabase.rpc("touch_last_activity");
  const { data:store } = user ? await supabase.from("stores").select("name, slug, publication_status").eq("owner_id",user.id).maybeSingle() : { data:null };
  const { data:subscription } = user ? await supabase.from("subscriptions").select("financial_status, next_due_at").eq("user_id",user.id).maybeSingle() : { data:null };
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
      <DashboardMobileNav storeName={store?.name||"Minha loja"} storeSlug={store?.slug}/>
      <main className="dashboard-main">{store?.publication_status==="suspended"&&<div className="dashboard-account-warning"><strong>Sua loja está temporariamente suspensa.</strong><span>O catálogo público e as alterações comerciais estão indisponíveis. Entre em contato com o suporte do Novam Shop.</span></div>}{subscription?.financial_status==="past_due"&&store?.publication_status!=="suspended"&&<div className="dashboard-account-warning financial"><strong>Há uma pendência na situação da sua conta.</strong><span>Verifique o vencimento ou entre em contato com o suporte.</span></div>}{children}</main>
    </div>
  );
}
