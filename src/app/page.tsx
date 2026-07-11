import Link from "next/link";

const Arrow = () => (
  <svg aria-hidden="true" viewBox="0 0 20 20" className="size-4" fill="none">
    <path d="M3 10h13M11 5l5 5-5 5" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

const Bag = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none">
    <path d="M6 8h12l1 12H5L6 8Z" stroke="currentColor" strokeWidth="1.5" /><path d="M9 9V6a3 3 0 0 1 6 0v3" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

export default function Home() {
  return (
    <main className="landing-page">
      <header className="landing-header">
        <Link href="/" className="landing-logo" aria-label="Novam Shop, início">NOVAM<span>.</span></Link>
        <nav className="landing-nav" aria-label="Navegação principal"><a href="#produto">O produto</a><a href="#fluxo">Como funciona</a></nav>
        <div className="landing-header-actions"><Link href="/login">Entrar</Link><Link href="/cadastro" className="landing-header-cta">Criar loja <Arrow /></Link></div>
      </header>

      <section className="landing-hero">
        <div className="landing-hero-copy">
          <p className="landing-eyebrow"><span /> E-commerce simples para pequenos negócios</p>
          <h1>Uma pequena loja.<br /><em>Com presença de grande marca.</em></h1>
          <p className="landing-lead">Crie uma loja profissional para seus produtos, organize os pedidos e finalize cada venda pelo WhatsApp — sem complicação e sem aparência de catálogo improvisado.</p>
          <div className="landing-hero-actions"><Link href="/cadastro">Criar minha loja <Arrow /></Link><a href="#produto">Ver como funciona</a></div>
          <div className="landing-trust"><span>Loja própria</span><span>Pedidos organizados</span><span>WhatsApp no final</span></div>
        </div>

        <div className="commerce-demo" aria-label="Demonstração de uma loja profissional criada no Novam Shop">
          <div className="demo-caption">Exemplo de loja criada no Novam Shop</div>
          <div className="demo-store">
            <div className="demo-store-header"><strong>MIRA</strong><nav><span>Novidades</span><span>Bolsas</span><span>Acessórios</span></nav><div><Bag /><small>2</small></div></div>
            <div className="demo-categories"><span className="active">Todos</span><span>Bolsas</span><span>Joias</span><span>Essenciais</span></div>
            <div className="demo-products">
              <article><div className="demo-photo photo-bag" /><div><span>Bolsa Siena</span><strong>R$ 289</strong></div></article>
              <article><div className="demo-photo photo-perfume" /><div><span>Essência Nº 04</span><strong>R$ 159</strong></div></article>
              <article><div className="demo-photo photo-jewelry" /><div><span>Colar Alba</span><strong>R$ 119</strong></div></article>
            </div>
          </div>

          <div className="demo-product-detail">
            <div className="detail-photo photo-bag" />
            <div className="detail-content"><p>MIRA · BOLSAS</p><h3>Bolsa Siena</h3><strong>R$ 289,00</strong><span>Cor</span><div className="color-options"><i /><i /><i /></div><button>Adicionar ao carrinho</button></div>
          </div>

          <div className="demo-cart">
            <div className="demo-cart-top"><strong>Seu pedido</strong><span>2 itens</span></div>
            <div className="demo-cart-item"><div className="cart-thumb photo-bag" /><div><strong>Bolsa Siena</strong><span>Caramelo · 1 un.</span></div><b>R$ 289</b></div>
            <div className="demo-cart-total"><span>Total</span><strong>R$ 408,00</strong></div>
            <button>Finalizar no WhatsApp <Arrow /></button>
          </div>
        </div>
      </section>

      <section className="landing-statement">
        <p>O Novam Shop não entrega apenas uma lista de produtos.</p>
        <h2>Ele transforma o que você vende em uma experiência de compra completa.</h2>
        <div className="statement-index"><span>Catálogo</span><i /><span>Produto</span><i /><span>Carrinho</span><i /><span>Pedido</span><i /><span>WhatsApp</span></div>
      </section>

      <section id="produto" className="product-experience">
        <div className="experience-copy"><p className="landing-eyebrow"><span /> Uma loja de verdade</p><h2>O produto é o protagonista. A tecnologia fica nos bastidores.</h2><p>Fotos grandes, categorias claras, variações, promoções e estoque. Seu cliente navega como em uma grande loja — mas conclui a compra no canal que você já usa todos os dias.</p><ul><li><span>01</span>Página individual para cada produto</li><li><span>02</span>Variações de tamanho, cor e modelo</li><li><span>03</span>Carrinho com pedido salvo e organizado</li></ul></div>
        <div className="experience-visual">
          <div className="experience-photo photo-shoe" />
          <div className="experience-product-info"><span>ATELIER N.</span><h3>Sapato Íris</h3><p>Couro natural · acabamento artesanal</p><div><strong>R$ 349</strong><button>Escolher opções</button></div></div>
          <div className="experience-note"><strong>Estoque por variação</strong><span>O cliente nunca compra acima do disponível.</span></div>
        </div>
      </section>

      <section id="fluxo" className="flow-section">
        <div className="flow-title"><span>Do seu jeito</span><h2>Profissional para o cliente.<br />Simples para você.</h2></div>
        <div className="flow-list">
          <article><span>01</span><div><h3>Monte sua loja</h3><p>Cadastre a marca, categorias, produtos, imagens e variações.</p></div></article>
          <article><span>02</span><div><h3>Compartilhe seu endereço</h3><p>Divulgue uma loja bonita no Instagram, WhatsApp e onde quiser.</p></div></article>
          <article><span>03</span><div><h3>Receba pedidos</h3><p>O pedido fica salvo e chega pronto para continuar no WhatsApp.</p></div></article>
        </div>
      </section>

      <section className="brand-impact">
        <div className="brand-impact-photo photo-accessories" />
        <div><p>Para negócios que levam sua imagem a sério.</p><h2>Sua loja pode ser pequena.<br /><em>Sua marca não precisa parecer.</em></h2><Link href="/cadastro">Começar agora <Arrow /></Link></div>
      </section>

      <footer className="landing-footer"><span className="landing-logo">NOVAM<span>.</span></span><p>Lojas profissionais para pequenos negócios.</p><div><Link href="/login">Entrar</Link><Link href="/cadastro">Criar loja</Link></div></footer>
    </main>
  );
}
