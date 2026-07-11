import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-screen bg-warm-white lg:grid-cols-[0.8fr_1.2fr]">
      <section className="flex min-h-screen flex-col px-5 py-6 md:px-10 md:py-8">
        <Link href="/" className="text-xl font-semibold tracking-[-0.04em]">NOVAM<span className="text-petrol">.</span></Link>
        <div className="mx-auto flex w-full max-w-md flex-1 items-center py-12">{children}</div>
        <p className="text-xs text-muted">© 2026 Novam Shop</p>
      </section>
      <aside className="auth-art hidden overflow-hidden bg-deep-petrol p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/60">Seu negócio, bem apresentado</p>
        <blockquote className="max-w-2xl font-editorial text-6xl leading-[0.98] tracking-[-0.04em]">
          Uma loja bonita abre a conversa. Um atendimento próximo fecha a venda.
        </blockquote>
        <div className="flex items-center gap-3 text-sm text-white/60"><span className="h-px w-10 bg-white/40" /> Catálogo + WhatsApp</div>
      </aside>
    </main>
  );
}
