import Link from "next/link";

const Arrow = () => (
  <svg aria-hidden="true" viewBox="0 0 20 20" className="size-4" fill="none">
    <path d="M3 10h13M11 5l5 5-5 5" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

const Check = () => (
  <svg aria-hidden="true" viewBox="0 0 20 20" className="size-4" fill="none">
    <path d="m4 10 4 4 8-9" stroke="currentColor" strokeWidth="1.7" />
  </svg>
);

export default function Home() {
  return (
    <main className="marketing-shell">
      <header className="marketing-header">
        <Link href="/" className="brand-mark" aria-label="Novam Shop, início">NOVAM<span>SHOP</span></Link>
        <nav className="marketing-nav" aria-label="Navegação principal">
          <a href="#experiencia">Experiência</a>
          <a href="#como-funciona">Como funciona</a>
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/login" className="header-login">Entrar</Link>
          <Link href="/cadastro" className="header-cta">Criar loja <Arrow /></Link>
        </div>
      </header>

      <section className="hero-section">
        <div className="hero-copy">
          <div className="hero-kicker"><span /> Feito para pequenos negócios</div>
          <h1>Sua loja merece<br />parecer uma <strong>marca.</strong></h1>
          <p>Crie um catálogo profissional, receba pedidos organizados e continue a conversa no WhatsApp — do jeito simples que seu negócio precisa.</p>
          <div className="hero-actions">
            <Link href="/cadastro" className="hero-primary">Começar minha loja <Arrow /></Link>
            <a href="#experiencia" className="hero-secondary">Conhecer a experiência</a>
          </div>
          <div className="hero-proof">
            <span><Check /> Sem gateway de pagamento</span>
            <span><Check /> Pronto para o celular</span>
          </div>
        </div>

        <div className="storefront-stage" aria-label="Exemplo de catálogo criado no Novam Shop">
          <div className="stage-label">Vitrine digital</div>
          <div className="storefront-window">
            <div className="storefront-top">
              <div><span className="store-dot" /> ORBE STUDIO</div>
              <div className="storefront-links"><span>Novidades</span><span>Coleções</span><span>Bolsa · 02</span></div>
            </div>
            <div className="storefront-grid">
              <div className="product-visual product-visual-main"><div className="object object-a" /><span>Forma 01</span></div>
              <div className="product-visual"><div className="object object-b" /><span>Forma 02</span></div>
              <div className="product-visual"><div className="object object-c" /><span>Forma 03</span></div>
            </div>
            <div className="storefront-bottom"><span>Coleção essencial</span><strong>A partir de R$ 89</strong></div>
          </div>
          <div className="order-float">
            <div className="order-float-icon"><Check /></div>
            <div><strong>Pedido organizado</strong><span>Pronto para enviar no WhatsApp</span></div>
          </div>
        </div>
      </section>

      <section id="experiencia" className="promise-strip">
        <p>Uma experiência profissional para quem vende — e simples para quem compra.</p>
        <div><span>01</span> Sua identidade</div><div><span>02</span> Compra fácil</div><div><span>03</span> Atendimento próximo</div>
      </section>

      <section id="como-funciona" className="how-section">
        <div className="how-heading"><span>Simples por escolha</span><h2>Do cadastro ao primeiro pedido, sem complicar seu negócio.</h2></div>
        <div className="how-steps">
          <article><span>01</span><h3>Monte sua vitrine</h3><p>Configure sua marca, organize categorias e apresente seus produtos com clareza.</p></article>
          <article><span>02</span><h3>Compartilhe sua loja</h3><p>Use um endereço profissional para divulgar no Instagram, WhatsApp e onde quiser.</p></article>
          <article><span>03</span><h3>Receba o pedido</h3><p>O cliente escolhe, o pedido fica registrado e a conversa continua no WhatsApp.</p></article>
        </div>
      </section>

      <section className="final-cta">
        <div><span>Seu próximo passo</span><h2>Transforme seus produtos em uma loja de verdade.</h2></div>
        <Link href="/cadastro">Criar minha loja <Arrow /></Link>
      </section>
      <footer className="marketing-footer"><span className="brand-mark">NOVAM<span>SHOP</span></span><p>Catálogos profissionais para pequenos negócios.</p><span>© 2026</span></footer>
    </main>
  );
}
