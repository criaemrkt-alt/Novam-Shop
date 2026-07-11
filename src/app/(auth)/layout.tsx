import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <Link href="/" className="brand-mark">NOVAM<span>SHOP</span></Link>
        <div className="auth-form-wrap">{children}</div>
        <p className="auth-footer">© 2026 Novam Shop · Feito para pequenos negócios</p>
      </section>
      <aside className="auth-showcase">
        <div className="auth-showcase-top"><span>Catálogo profissional</span><span>01 — 03</span></div>
        <div className="auth-product-card">
          <div className="auth-product-photo"><div className="auth-object" /></div>
          <div className="auth-product-info"><div><strong>Essência 01</strong><span>Coleção Forma</span></div><strong>R$ 189</strong></div>
        </div>
        <div className="auth-quote"><span>“</span><p>Uma presença digital que valoriza o que você vende.</p></div>
      </aside>
    </main>
  );
}
