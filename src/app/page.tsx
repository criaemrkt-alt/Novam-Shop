const ArrowUpRight = () => (
  <svg aria-hidden="true" viewBox="0 0 20 20" className="size-4" fill="none">
    <path d="M5 15 15 5M7 5h8v8" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

const Bag = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none">
    <path d="M6.5 8.5h11l1 12h-13l1-12Z" stroke="currentColor" strokeWidth="1.5" />
    <path d="M9 10V7a3 3 0 0 1 6 0v3" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

export default function Home() {
  const features = [
    ["01", "Sua identidade", "Logo, banner, cores e produtos apresentados com a personalidade da sua marca."],
    ["02", "Compra simples", "O cliente escolhe produtos e variações em uma experiência rápida no celular."],
    ["03", "Atendimento próximo", "O pedido chega organizado e a conversa continua diretamente no WhatsApp."],
  ];

  return (
    <main className="min-h-screen overflow-hidden bg-warm-white text-ink">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-6 md:px-10 md:py-8">
        <a href="#" className="text-xl font-semibold tracking-[-0.04em]" aria-label="Novam Shop, início">
          NOVAM<span className="text-petrol">.</span>
        </a>
        <nav className="hidden items-center gap-8 text-sm text-muted md:flex" aria-label="Navegação principal">
          <a className="transition-colors hover:text-ink" href="#como-funciona">Como funciona</a>
          <a className="transition-colors hover:text-ink" href="#recursos">Recursos</a>
        </nav>
        <a href="/login" className="inline-flex h-10 items-center gap-2 border-b border-ink text-sm font-medium">
          Entrar <ArrowUpRight />
        </a>
      </header>

      <section className="mx-auto grid max-w-7xl items-center gap-12 px-5 pb-16 pt-12 md:px-10 md:pb-24 md:pt-16 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20 lg:pt-24">
        <div className="relative z-10">
          <p className="mb-7 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-petrol">
            <span className="h-px w-8 bg-petrol" /> Catálogo profissional
          </p>
          <h1 className="max-w-2xl font-editorial text-[clamp(3.5rem,9vw,7rem)] leading-[0.88] tracking-[-0.055em]">
            Sua loja.<br />Seu estilo.<br /><em className="font-normal text-petrol">Seu negócio.</em>
          </h1>
          <p className="mt-8 max-w-md text-base leading-7 text-muted md:text-lg md:leading-8">
            Uma vitrine elegante para seus produtos, pedidos organizados e o atendimento humano que seus clientes já conhecem no WhatsApp.
          </p>
          <div className="mt-9 flex flex-col gap-4 sm:flex-row sm:items-center">
            <a id="comecar" href="/cadastro" className="inline-flex h-14 items-center justify-center gap-3 bg-petrol px-7 text-sm font-semibold text-white transition-colors hover:bg-deep-petrol">
              Criar minha loja <ArrowUpRight />
            </a>
            <span className="text-xs leading-5 text-muted">Configure em poucos minutos.<br />Sem complicação.</span>
          </div>
        </div>

        <div className="relative min-h-[470px] md:min-h-[620px]" aria-label="Prévia de uma loja criada no Novam Shop">
          <div className="absolute inset-x-8 bottom-0 top-10 bg-petrol md:inset-x-12" />
          <div className="absolute left-0 top-0 w-[78%] border border-line bg-white p-3 shadow-[0_32px_80px_rgba(8,61,64,0.18)] md:p-5">
            <div className="flex items-center justify-between border-b border-line px-1 pb-4">
              <span className="font-editorial text-lg italic">Atelier N.</span>
              <div className="flex items-center gap-4 text-[10px] uppercase tracking-widest"><span>Novidades</span><Bag /></div>
            </div>
            <div className="product-scene mt-4 aspect-[4/5] overflow-hidden bg-soft-gray">
              <div className="product-plinth" /><div className="product-vase" />
              <div className="product-stem product-stem-one" /><div className="product-stem product-stem-two" />
            </div>
            <div className="flex items-start justify-between gap-3 pt-4">
              <div><p className="text-xs font-medium">Vaso Essência 01</p><p className="mt-1 text-[10px] text-muted">Coleção Forma</p></div>
              <p className="text-xs font-semibold">R$ 189</p>
            </div>
          </div>
          <div className="absolute bottom-8 right-0 w-[46%] border border-line bg-warm-white p-4 shadow-[0_24px_60px_rgba(17,17,17,0.14)] md:bottom-12 md:p-6">
            <p className="text-[10px] uppercase tracking-[0.18em] text-muted">Seu pedido</p>
            <p className="mt-4 font-editorial text-2xl">Tudo certo.</p>
            <div className="my-5 h-px bg-line" />
            <div className="flex justify-between text-xs"><span>2 produtos</span><strong>R$ 278</strong></div>
            <div className="mt-5 bg-deep-petrol px-3 py-3 text-center text-[10px] font-semibold uppercase tracking-wider text-white">Finalizar no WhatsApp</div>
          </div>
        </div>
      </section>

      <section id="recursos" className="border-t border-line bg-white">
        <div className="mx-auto grid max-w-7xl gap-px bg-line md:grid-cols-3">
          {features.map(([number, title, copy]) => (
            <article key={number} className="bg-white px-6 py-10 md:px-10 md:py-14">
              <span className="text-xs font-semibold text-petrol">{number}</span>
              <h2 className="mt-8 font-editorial text-3xl tracking-tight">{title}</h2>
              <p className="mt-4 max-w-sm text-sm leading-6 text-muted">{copy}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
