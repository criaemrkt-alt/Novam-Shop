"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { DashboardNav } from "@/components/dashboard-nav";

const pageNames:Record<string,string>={
  "/painel":"Minha loja",
  "/painel/identidade":"Identidade visual",
  "/painel/produtos":"Produtos",
  "/painel/pedidos":"Pedidos",
};

export function DashboardMobileNav({storeName,storeSlug}:{storeName:string;storeSlug?:string}){
  const pathname=usePathname(); const [open,setOpen]=useState(false);
  const pageTitle=pathname.startsWith("/painel/produtos/")?"Editar produto":pageNames[pathname]??"Painel";
  useEffect(()=>{document.body.style.overflow=open?"hidden":"";return()=>{document.body.style.overflow="";};},[open]);
  return <>
    <header className="dashboard-mobile-header"><button className="mobile-menu-trigger" type="button" onClick={()=>setOpen(true)} aria-label="Abrir menu" aria-expanded={open}><span/><span/></button><Link href="/painel" className="mobile-dashboard-brand"><i>N</i><div><strong>NOVAM.</strong><span>{pageTitle}</span></div></Link>{storeSlug?<Link href={`/loja/${storeSlug}`} target="_blank" className="mobile-view-store">Ver loja</Link>:<span className="mobile-header-spacer"/>}</header>
    <div className={`mobile-nav-backdrop${open?" visible":""}`} onClick={()=>setOpen(false)}/>
    <aside className={`mobile-nav-drawer${open?" open":""}`} aria-hidden={!open} onClick={event=>{if((event.target as HTMLElement).closest("a"))setOpen(false);}}><div className="mobile-drawer-head"><div><span>Minha operação</span><strong>{storeName}</strong></div><button type="button" onClick={()=>setOpen(false)} aria-label="Fechar menu">×</button></div><DashboardNav/>{storeSlug&&<Link className="mobile-drawer-store" href={`/loja/${storeSlug}`} target="_blank">Ver minha loja <b>↗</b></Link>}<form action="/auth/logout" method="post"><button className="mobile-drawer-logout" type="submit">Sair da conta <span>→</span></button></form></aside>
  </>;
}
