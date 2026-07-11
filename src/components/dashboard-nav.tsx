"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const StoreIcon = () => <svg viewBox="0 0 24 24" fill="none"><path d="M4 9h16l-1-5H5L4 9Zm1 0v11h14V9M9 20v-6h6v6" stroke="currentColor" strokeWidth="1.5" /></svg>;
const PaletteIcon = () => <svg viewBox="0 0 24 24" fill="none"><path d="M12 3a9 9 0 1 0 0 18h1.5a2 2 0 0 0 0-4H12a1.5 1.5 0 0 1 0-3h3a6 6 0 0 0 0-12h-3Z" stroke="currentColor" strokeWidth="1.5" /><path d="M7.5 10h.01M9 6.5h.01M14 6h.01M17 9h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>;
const BoxIcon = () => <svg viewBox="0 0 24 24" fill="none"><path d="m4 7 8-4 8 4-8 4-8-4Zm0 0v10l8 4 8-4V7M12 11v10" stroke="currentColor" strokeWidth="1.5" /></svg>;
const OrdersIcon = () => <svg viewBox="0 0 24 24" fill="none"><path d="M6 3h12v18H6V3Zm3 5h6M9 12h6M9 16h4" stroke="currentColor" strokeWidth="1.5" /></svg>;

const links = [
  { href: "/painel", label: "Minha loja", icon: StoreIcon, exact: true },
  { href: "/painel/identidade", label: "Identidade visual", icon: PaletteIcon },
  { href: "/painel/produtos", label: "Produtos", icon: BoxIcon },
  { href: "/painel/pedidos", label: "Pedidos", icon: OrdersIcon },
];

export function DashboardNav() {
  const pathname = usePathname();
  return <nav className="dashboard-nav"><p>Gestão</p>{links.map(({ href, label, icon: Icon, exact }) => {
    const active = exact ? pathname === href : pathname.startsWith(href);
    return <Link key={href} className={active ? "dashboard-nav-active" : ""} href={href} aria-current={active ? "page" : undefined}><i><Icon /></i><span>{label}</span></Link>;
  })}</nav>;
}
