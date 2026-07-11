import Link from "next/link";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-warm-white text-ink">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-5 md:px-10">
          <Link href="/painel" className="text-xl font-semibold tracking-[-0.04em]">NOVAM<span className="text-petrol">.</span></Link>
          <form action="/auth/logout" method="post"><button className="text-sm font-medium text-muted transition-colors hover:text-ink" type="submit">Sair</button></form>
        </div>
      </header>
      <div className="mx-auto grid max-w-7xl md:grid-cols-[220px_1fr]">
        <aside className="hidden min-h-[calc(100vh-72px)] border-r border-line bg-white px-5 py-8 md:block">
          <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Gerenciar</p>
          <nav><Link className="block border-l-2 border-petrol bg-warm-white px-4 py-3 text-sm font-semibold" href="/painel">Minha loja</Link></nav>
          <p className="mt-8 px-4 text-xs leading-5 text-muted">Produtos e pedidos serão liberados nas próximas etapas.</p>
        </aside>
        <main className="min-w-0 px-5 py-8 md:px-10 md:py-12">{children}</main>
      </div>
    </div>
  );
}
