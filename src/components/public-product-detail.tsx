"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useStoreCart } from "@/lib/use-store-cart";

type ProductOption={id:string;name:string;position:number;values:{id:string;value:string;position:number}[]};
type ProductVariant={id:string;value_ids:string[];price_cents:number|null;sale_price_cents:number|null;stock_quantity:number|null;is_active:boolean};
type Product={id:string;name:string;description:string|null;materials:string|null;lead_time:string|null;customization_notes:string|null;price_cents:number;sale_price_cents:number|null;category:string|null;images:string[];track_stock:boolean;stock_mode:"product"|"variant";stock_quantity:number|null;options:ProductOption[];variants:ProductVariant[]};
type Store={id:string;slug:string;name:string;logo_url:string|null};
const money=(cents:number)=>new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(cents/100);
const colorMap:Record<string,string>={preto:"#111111",branco:"#ffffff",azul:"#315b8a",vermelho:"#a83d36",verde:"#42634b",amarelo:"#d4ad32",rosa:"#c97f91",roxo:"#70517d",cinza:"#888888",bege:"#d8c5a5",marrom:"#68483c",laranja:"#d67838"};

export function PublicProductDetail({store,product}:{store:Store;product:Product}) {
  const {cart,changeQuantity,toggle,add,remove}=useStoreCart(store.slug,store.id);
  const [activeImage,setActiveImage]=useState(0);
  const [zoomOpen,setZoomOpen]=useState(false);const [notice,setNotice]=useState<string|null>(null);const touchStartX=useRef<number|null>(null);
  const [selected,setSelected]=useState<Record<string,string>>({});
  const hasVariants=product.stock_mode==="variant"&&product.options.length>0;
  const availableVariants=useMemo(()=>product.variants.filter(variant=>variant.is_active&&(!product.track_stock||(variant.stock_quantity??0)>0)),[product.track_stock,product.variants]);
  const selectedValueIds=Object.values(selected);
  const selectedVariant=hasVariants&&selectedValueIds.length===product.options.length?availableVariants.find(variant=>selectedValueIds.every(value=>variant.value_ids.includes(value))):undefined;
  const cartKey=selectedVariant?.id??product.id;
  const quantity=cart[cartKey]??0;
  const unavailable=hasVariants?availableVariants.length===0:product.track_stock&&(product.stock_quantity??0)<=0;
  const currentPrice=selectedVariant?.sale_price_cents??selectedVariant?.price_cents??product.sale_price_cents??product.price_cents;
  const currentNormalPrice=selectedVariant?.price_cents??product.price_cents;
  const mainImage=product.images[activeImage]??product.images[0];
  const summary=product.description&&product.description.length>220?`${product.description.slice(0,217).trim()}…`:product.description;
  const details=[
    product.materials&&{label:"Materiais e acabamento",value:product.materials},
    product.lead_time&&{label:"Prazo",value:product.lead_time},
    product.customization_notes&&{label:"Personalização",value:product.customization_notes},
  ].filter((item):item is {label:string;value:string}=>Boolean(item));
  const count=Object.values(cart).reduce((sum,value)=>sum+value,0);
  const atLimit=product.track_stock&&quantity>=(selectedVariant?.stock_quantity??product.stock_quantity??0);
  const selectionComplete=!hasVariants||Boolean(selectedVariant);
  const valueAvailable=(optionId:string,valueId:string)=>availableVariants.some(variant=>variant.value_ids.includes(valueId)&&Object.entries(selected).every(([selectedOption,selectedValue])=>selectedOption===optionId||variant.value_ids.includes(selectedValue)));
  const selectedOptions=product.options.map(option=>({name:option.name,value:option.values.find(value=>value.id===selected[option.id])?.value??""})).filter(option=>option.value);
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
        <aside className="product-detail-info"><span>{product.category||"Novidades"}</span><h1>{product.name}</h1><div className="detail-prices">{currentPrice<currentNormalPrice&&<del>{money(currentNormalPrice)}</del>}<strong>{money(currentPrice)}</strong>{hasVariants&&!selectedVariant&&<small>A partir do preço padrão</small>}</div>{summary&&<p>{summary}</p>}
          {hasVariants&&<section className="public-variant-picker" aria-label="Opções do produto">{product.options.map(option=><fieldset key={option.id}><legend><span>{option.name}</span><strong>{option.values.find(value=>value.id===selected[option.id])?.value??"Selecione"}</strong></legend><div>{option.values.map(value=>{const available=valueAvailable(option.id,value.id);const active=selected[option.id]===value.id;const isColor=option.name.toLocaleLowerCase("pt-BR").includes("cor");const swatch=colorMap[value.value.toLocaleLowerCase("pt-BR")];return <button key={value.id} type="button" className={`${active?"active ":""}${isColor?"color-value":""}`} disabled={!available} aria-pressed={active} onClick={()=>setSelected(current=>({...current,[option.id]:value.id}))}>{isColor&&<i style={{backgroundColor:swatch??value.value}}/>}<span>{value.value}</span>{!available&&<small>Indisponível</small>}</button>;})}</div></fieldset>)}{!selectedVariant&&<p className="variant-selection-message">Selecione {product.options.map(option=>option.name.toLocaleLowerCase("pt-BR")).join(" e ")}.</p>}</section>}
          {unavailable?<div className="detail-unavailable">Produto indisponível no momento.</div>:<div className="detail-purchase"><span>Quantidade</span>{quantity&&selectionComplete?<div className="detail-cart-controls"><button type="button" onClick={()=>{changeQuantity(cartKey,-1);announce("Quantidade atualizada.");}} aria-label="Diminuir quantidade">−</button><strong>{quantity}</strong><button type="button" onClick={()=>{changeQuantity(cartKey,1);announce("Quantidade atualizada.");}} disabled={atLimit} aria-label="Aumentar quantidade">+</button></div>:<button className="detail-add-button" type="button" disabled={!selectionComplete} onClick={()=>{if(selectedVariant)add({productId:product.id,variantId:selectedVariant.id,options:selectedOptions,unitPriceCents:currentPrice,stockQuantity:selectedVariant.stock_quantity});else toggle(product.id);announce("Produto adicionado à sacola.");}}>{selectionComplete?"Adicionar à sacola":"Escolha as opções"} <span>→</span></button>}{quantity>0&&<Link className="detail-view-cart" href={`/loja/${store.slug}?sacola=1`}>Ver sacola e continuar <span>→</span></Link>}</div>}
          {quantity>0&&<button className="detail-remove-button" type="button" onClick={()=>remove(cartKey)}>Remover da sacola</button>}
          <div className="detail-service"><span>Compra simples e atendimento próximo</span><p>Monte sua sacola e finalize o pedido diretamente com a loja pelo WhatsApp.</p></div>
        </aside>
      </section>
      <section className="product-sales-story"><div className="product-story-heading"><span>CONHEÇA O PRODUTO</span><h2>Detalhes que ajudam você a escolher.</h2></div><div className="product-story-content"><div className="product-description-copy"><span>DESCRIÇÃO</span><p>{product.description||"Entre em contato com a loja para conhecer todos os detalhes deste produto."}</p></div>{details.length>0&&<div className="product-facts">{details.map(item=><details key={item.label} open><summary>{item.label}<b>+</b></summary><p>{item.value}</p></details>)}</div>}<aside className="product-whatsapp-note"><span>ATENDIMENTO PELO WHATSAPP</span><h3>Ficou com alguma dúvida?</h3><p>Detalhes de personalização, disponibilidade, pagamento e entrega são confirmados diretamente com a loja após você montar a sacola.</p><Link href={`/loja/${store.slug}`}>Continuar comprando <b>→</b></Link></aside></div></section>
    </main>
    {zoomOpen&&mainImage&&<div className="product-image-lightbox" role="dialog" aria-modal="true" aria-label={`Imagem ampliada de ${product.name}`}><button className="lightbox-close" type="button" onClick={()=>setZoomOpen(false)} aria-label="Fechar imagem ampliada">×</button><button className="lightbox-prev" type="button" onClick={()=>moveImage(-1)} aria-label="Imagem anterior">←</button><Image src={mainImage} alt={product.name} width={1400} height={1750} sizes="100vw"/><button className="lightbox-next" type="button" onClick={()=>moveImage(1)} aria-label="Próxima imagem">→</button><span>{activeImage+1} / {product.images.length}</span></div>}
    {notice&&<div className="store-action-toast" role="status" aria-live="polite">{notice}</div>}
  </>;
}
