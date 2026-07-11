import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function MasterLayout({children}:{children:React.ReactNode}) {
  const supabase=await createClient(); const {data:{user}}=await supabase.auth.getUser(); if(!user)redirect("/login");
  const {data:isAdmin}=await supabase.rpc("is_master_admin"); if(!isAdmin)redirect("/painel");
  return <div className="master-shell"><header className="master-header"><Link href="/master" className="master-brand"><i>N</i><div><strong>NOVAM.</strong><span>Master admin</span></div></Link><nav><Link href="/master">Usuários e lojas</Link><Link href="/painel">Ir para o painel</Link></nav><form action="/auth/logout" method="post"><button type="submit">Sair</button></form></header><main className="master-main">{children}</main></div>;
}
