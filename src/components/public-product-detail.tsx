"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useStoreCart } from "@/lib/use-store-cart";

type Product={id:string;name:string;description:string|null;materials:string|null;lead_time:string|null;customization_notes:string|null;price_cents:number;sale_price_cents:number|null;category:string|null;images:string[];track_stock:boolean;stock_quantity:number|null};
type Store={id:string;slug:string;name:string;logo_url:string|null};
const money=(cents:number)=>new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(cents/100);

export function PublicProductDetail({store,product}:{store:Store;product:Product}) {
  const {cart,changeQuantity,toggle}=useStoreCart(store.slug,store.id);
  const [activeImage,setActiveImage]=useState(0);
  const [zoomOpen,setZoomOpen]=useState(false);const [notice,setNotice]=useState<string|null>(null);const touchStartX=useRef<number|null>(null);
  const quantity=cart[product.id]??0;
  const unavailable=product.track_stock&&(product.stock_quantity??0)<=0;
  const mainImage=product.images[activeImage]??product.images[0];
  const summary=product.description&&product.description.length>220?`${product.description.slice(0,217).trim()}…`:product.description;
  const details=[
    product.materials&&{label:"Materiais e acabamento",value:product.materials},
    product.lead_time&&{label:"Prazo",value:product.lead_time},
    product.customization_notes&&{label:"Personalização",value:product.customization_notes},
  ].filter((item):item is {label:string;value:string}=>Boolean(item));
  const count=Object.values(cart).reduce((sum,value)=>sum+value,0);
  const atLimit=product.track_stock&&quantity>=(product.stock_quantity??0);
  const announce=(message:string)=>{setNotice(message);window.setTimeout(()=>setNotice(null),2400);};
  const moveImage=useCallback((direction:number)=>{if(product.images.length<2)return;setActiveImage(current=>(current+direction+product.images.length)%product.images.length);},[product.images.length]);
  useEffect(()=>{if(!zoomOpen)return;const previous=document.body.style.overflow;document.body.style.overflow="hidden";const close=(event:KeyboardEvent)=>{if(event.key==="Escape")setZoomOpen(false);if(event.key==="ArrowRight")moveImage(1);if(event.key==="ArrowLeft")moveImage(-1);};window.addEventListener("keydown",close);return()=>{document.body.style.overflow=previous;window.removeEventListener("keydown",close);};},[zoomOpen,moveImage]);

  return <>
    <header className="product-detail-header"><Link href={`/loja/${store.slug}`} className="product-detail-brand">{store.logo_url?<Image src={store.logo_url} width={38} height={38} alt={`Logo ${store.name}`}/>:<i>{store.name.slice(0,1)}</i>}<strong>{store.name}</strong></Link><Link href={`/loja/${store.slug}`} className="back-to-catalog">← <span>Voltar ao catálogo</span></Link><Link href={`/loja/${store.slug}?sacola=1`} className="detail-bag" aria-label={`Abrir sacola com ${count} itens`}><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 8h14l1 13H4L5 8Z" stroke="currentColor" strokeWidth="1.5"/><path d="M9 9V6a3 3 0 0 1 6 0v3" stroke="currentColor" strokeWidth="1.5"/></svg><span>Sacola</span><b>{count}</b></Link></header>
    <main className="product-detail-page">
      <section className="product-detail-top">
        <section className="product-gallery-shell" aria-label={`Galeria de ${product.name}`}>
          {product.images.length>0?<><div className="product-gallery-thumbs">{product.images.map((image,index)=><button key={image} type="button" className={index===activeImage?"active":""} onClick={()=>setActiveImage(index)} aria-label={`Ver imagem ${index+1}`} aria-pressed={index===activeImage}><Image src={image} alt={`${product.name}, imagem ${index+1}`} width={96} height={120}/><span>{String(index+1).padStart(2,"0")}</span></button>)}</div><div className="product-gallery-main" onTouchStart={event=>{touchStartX.current=event.touches[0]?.clientX??null;}} onTouchEnd={event=>{if(touchStartX.current===null)return;const distance=(event.changedTouches[0]?.clientX??touchStartX.current)-touchStartX.current;if(Math.abs(distance)>45)moveImage(distance>0?-1:1);touchStartX.current=null;}}><button type="button" onClick={()=>setZoomOpen(true)} aria-label={`Ampliar imagem de ${product.name}`}><Image src={mainImage} alt={product.name} width={1200} height={1500} priority sizes="(max-width:800px) 100vw, 58vw"/></button><span>{activeImage+1} / {product.images.length}</span>{product.images.length>1&&<div className="gallery-mobile-hint">Deslize para ver mais</div>}</div></>:<div className="product-detail-placeholder"><span>{product.name.slice(0,1)}</span><small>Imagem em breve</small></div>}
        </section>
        <aside className="product-detail-info"><span>{product.category||"Novidades"}</span><h1>{product.name}</h1><div className="detail-prices">{product.sale_price_cents!==null&&<del>{money(product.price_cents)}</del>}<strong>{money(product.sale_price_cents??product.price_cents)}</strong></div>{summary&&<p>{summary}</p>}
          {unavailable?<div className="detail-unavailable">Produto indisponível no momento.</div>:<div className="detail-purchase"><span>Quantidade</span>{quantity?<div className="detail-cart-controls"><button type="button" onClick={()=>{changeQuantity(product.id,-1);announce("Quantidade atualizada.");}} aria-label="Diminuir quantidade">−</button><strong>{quantity}</strong><button type="button" onClick={()=>{changeQuantity(product.id,1);announce("Quantidade atualizada.");}} disabled={atLimit} aria-label="Aumentar quantidade">+</button></div>:<button className="detail-add-button" type="button" onClick={()=>{toggle(product.id);announce("Produto adicionado à sacola.");}}>Adicionar à sacola <span>→</span></button>}{quantity>0&&<Link className="detail-view-cart" href={`/loja/${store.slug}?sacola=1`}>Ver sacola e continuar <span>→</span></Link>}</div>}
          {quantity>0&&<button className="detail-remove-button" type="button" onClick={()=>toggle(product.id)}>Remover da sacola</button>}
          <div className="detail-service"><span>Compra simples e atendimento próximo</span><p>Monte sua sacola e finalize o pedido diretamente com a loja pelo WhatsApp.</p></div>
        </aside>
      </section>
      <section className="product-sales-story"><div className="product-story-heading"><span>CONHEÇA O PRODUTO</span><h2>Detalhes que ajudam você a escolher.</h2></div><div className="product-story-content"><div className="product-description-copy"><span>DESCRIÇÃO</span><p>{product.description||"Entre em contato com a loja para conhecer todos os detalhes deste produto."}</p></div>{details.length>0&&<div className="product-facts">{details.map(item=><details key={item.label} open><summary>{item.label}<b>+</b></summary><p>{item.value}</p></details>)}</div>}<aside className="product-whatsapp-note"><span>ATENDIMENTO PELO WHATSAPP</span><h3>Ficou com alguma dúvida?</h3><p>Detalhes de personalização, disponibilidade, pagamento e entrega são confirmados diretamente com a loja após você montar a sacola.</p><Link href={`/loja/${store.slug}`}>Continuar comprando <b>→</b></Link></aside></div></section>
    </main>
    {zoomOpen&&mainImage&&<div className="product-image-lightbox" role="dialog" aria-modal="true" aria-label={`Imagem ampliada de ${product.name}`}><button className="lightbox-close" type="button" onClick={()=>setZoomOpen(false)} aria-label="Fechar imagem ampliada">×</button><button className="lightbox-prev" type="button" onClick={()=>moveImage(-1)} aria-label="Imagem anterior">←</button><Image src={mainImage} alt={product.name} width={1400} height={1750} sizes="100vw"/><button className="lightbox-next" type="button" onClick={()=>moveImage(1)} aria-label="Próxima imagem">→</button><span>{activeImage+1} / {product.images.length}</span></div>}
    {notice&&<div className="store-action-toast" role="status" aria-live="polite">{notice}</div>}
  </>;
}
