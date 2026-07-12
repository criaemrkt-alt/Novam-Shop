"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { activatePush, supportsWebPush } from "@/lib/push-client";
import { useStoreCart } from "@/lib/use-store-cart";

type Product = { id:string; name:string; description:string|null; price_cents:number; sale_price_cents:number|null; track_stock:boolean; stock_quantity:number|null; category:string|null; image_url:string|null };
type Store = { id:string; slug:string; name:string; description:string|null; hero_title:string|null; subtitle:string|null; logo_url:string|null; banner_url:string|null; whatsapp:string; promotions_enabled:boolean };

const money = (cents:number) => new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(cents/100);
const BagIcon = () => <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 8h14l1 13H4L5 8Z" stroke="currentColor" strokeWidth="1.5"/><path d="M9 9V6a3 3 0 0 1 6 0v3" stroke="currentColor" strokeWidth="1.5"/></svg>;

export function PublicStorefront({store,products}:{store:Store;products:Product[]}) {
  const [activeCategory,setActiveCategory]=useState("Todos");
  const {cart,changeQuantity,remove,toggle,restored,dismissRestored}=useStoreCart(store.slug,store.id);
  const [cartOpen,setCartOpen]=useState(false);
  const [promoPrompt,setPromoPrompt]=useState(false); const [pushMessage,setPushMessage]=useState<string|null>(null);
  const categories=useMemo(()=>["Todos","Novidades",...Array.from(new Set(products.map(product=>product.category).filter((value):value is string=>Boolean(value)))),"Promoções"].filter((value,index,array)=>array.indexOf(value)===index),[products]);
  const visibleProducts=useMemo(()=>products.filter((product,index)=>activeCategory==="Todos"||(activeCategory==="Novidades"&&index<8)||(activeCategory==="Promoções"&&product.sale_price_cents!==null)||product.category===activeCategory),[activeCategory,products]);
  const cartItems=products.filter(product=>cart[product.id]).map(product=>({...product,quantity:cart[product.id]}));
  const count=cartItems.reduce((sum,item)=>sum+item.quantity,0);
  const subtotal=cartItems.reduce((sum,item)=>sum+(item.sale_price_cents??item.price_cents)*item.quantity,0);
  const checkout=()=>{
    const lines=cartItems.map(item=>`• ${item.quantity}x ${item.name} — ${money((item.sale_price_cents??item.price_cents)*item.quantity)}`);
    const message=[`Olá! Gostaria de finalizar este pedido na ${store.name}:`,"",...lines,"",`Subtotal: ${money(subtotal)}`].join("\n");
    window.open(`https://wa.me/${store.whatsapp.replace(/\D/g,"")}?text=${encodeURIComponent(message)}`,"_blank","noopener,noreferrer");
  };
  useEffect(()=>{
    const key=`novam-promo-prompt:${store.slug}`; const rejected=Number(localStorage.getItem(key)??0); const thirtyDays=30*24*60*60*1000;
    if(!store.promotions_enabled||!supportsWebPush()||!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY||Notification.permission==="denied"||Date.now()-rejected<thirtyDays)return;
    const timer=window.setTimeout(()=>setPromoPrompt(true),8000); return()=>window.clearTimeout(timer);
  },[store.promotions_enabled,store.slug]);
  const declinePromo=()=>{localStorage.setItem(`novam-promo-prompt:${store.slug}`,String(Date.now()));setPromoPrompt(false);};
  const acceptPromo=async()=>{try{await activatePush(store.id,{promotions:true,cart_reminders:false});setPromoPrompt(false);setPushMessage("Pronto! Você poderá receber novidades desta loja.");window.setTimeout(()=>setPushMessage(null),5000);}catch(error){setPromoPrompt(false);setPushMessage(error instanceof Error&&error.message==="denied"?"Tudo bem. As notificações não foram ativadas.":"As notificações não estão disponíveis neste navegador.");}};
  return <>
    <header className="public-shop-header"><div>{store.logo_url?<Image src={store.logo_url} width={42} height={42} alt={`Logo ${store.name}`}/>:<i>{store.name.slice(0,1)}</i>}<strong>{store.name}</strong></div><nav><a href="#produtos">Produtos</a><a href={`https://wa.me/${store.whatsapp.replace(/\D/g,"")}`} target="_blank" rel="noreferrer">WhatsApp</a></nav><button className="shop-cart-trigger" type="button" onClick={()=>setCartOpen(true)} aria-label={`Abrir sacola com ${count} itens`}><BagIcon/><span>Sacola</span><b>{count}</b></button></header>

    <section className="public-shop-hero" style={store.banner_url?{backgroundImage:`linear-gradient(90deg,rgba(0,0,0,.48),rgba(0,0,0,.03)),url(${store.banner_url})`}:undefined}><div><span>LOJA OFICIAL</span><h1>{store.hero_title||`${store.name}, do seu jeito.`}</h1><a href="#produtos">Ver coleção</a></div></section>

    {store.subtitle&&<section className="public-shop-subtitle"><span>ENCONTRE O SEU</span><p>{store.subtitle}</p></section>}

    <nav className="shop-categories" aria-label="Categorias de produtos">{categories.map(category=><button key={category} type="button" className={activeCategory===category?"active":""} onClick={()=>setActiveCategory(category)}>{category}</button>)}</nav>

    <section id="produtos" className="public-products"><div className="public-products-heading"><div><span>CATÁLOGO · {activeCategory.toUpperCase()}</span><h2>{activeCategory==="Todos"?"Descubra nossos produtos":activeCategory}</h2></div><p>{visibleProducts.length} {visibleProducts.length===1?"produto":"produtos"}</p></div>
      {visibleProducts.length?<div className="public-product-grid">{visibleProducts.map(product=>{const quantity=cart[product.id]??0;const unavailable=product.track_stock&&(product.stock_quantity??0)<=0;const atLimit=product.track_stock&&quantity>=(product.stock_quantity??0);return <article key={product.id}><div className="public-product-photo"><Link href={`/loja/${store.slug}/produto/${product.id}`} aria-label={`Ver ${product.name}`}>{product.image_url?<Image src={product.image_url} alt={product.name} fill sizes="(max-width:700px) 50vw, (max-width:1100px) 33vw, 25vw"/>:<span>{product.name.slice(0,1)}</span>}</Link>{unavailable&&<span className="catalog-photo-status">Indisponível</span>}</div><small>{product.category||"Novidades"}</small><h3><Link href={`/loja/${store.slug}/produto/${product.id}`}>{product.name}</Link></h3><div className="catalog-product-price">{product.sale_price_cents!==null&&<del>{money(product.price_cents)}</del>}<strong>{money(product.sale_price_cents??product.price_cents)}</strong></div><div className="catalog-product-action">{unavailable?<span>Produto indisponível</span>:quantity>0?<div className="catalog-quantity" aria-label={`${quantity} unidades na sacola`}><button type="button" onClick={()=>changeQuantity(product.id,-1)} aria-label={`Remover uma unidade de ${product.name}`}>−</button><strong>{quantity} {quantity===1?"unidade":"unidades"}</strong><button type="button" onClick={()=>changeQuantity(product.id,1)} disabled={atLimit} aria-label={`Adicionar mais uma unidade de ${product.name}`}>+</button></div>:<button type="button" onClick={()=>toggle(product.id)}><span>Adicionar à sacola</span><b>+</b></button>}</div></article>})}</div>:<div className="public-empty"><h2>Nenhum produto nesta categoria.</h2><p>Escolha outra categoria para continuar navegando.</p></div>}
    </section>

    {store.description&&<section className="public-shop-story"><span>SOBRE A LOJA</span><div><h2>{store.name}</h2><p>{store.description}</p></div></section>}

    <footer className="public-shop-footer"><strong>{store.name}</strong><p>Atendimento e finalização pelo WhatsApp.</p><a href={`https://wa.me/${store.whatsapp.replace(/\D/g,"")}`} target="_blank" rel="noreferrer">Falar com a loja →</a></footer>

    <div className={cartOpen?"cart-backdrop visible":"cart-backdrop"} onClick={()=>setCartOpen(false)}/><aside className={cartOpen?"shop-cart-drawer open":"shop-cart-drawer"} aria-hidden={!cartOpen}><div className="cart-drawer-head"><div><span>SUA SACOLA</span><strong>{count} {count===1?"item":"itens"}</strong></div><button type="button" onClick={()=>setCartOpen(false)} aria-label="Fechar sacola">×</button></div>
        <div className="cart-drawer-items">{cartItems.length?cartItems.map(item=><article key={item.id}>{item.image_url?<div className="cart-drawer-photo"><Image src={item.image_url} alt="" fill sizes="76px"/></div>:<div className="cart-drawer-photo empty">{item.name.slice(0,1)}</div>}<div><small>{item.category||"Produto"}</small><strong>{item.name}</strong><span>{money(item.sale_price_cents??item.price_cents)}</span><div className="cart-quantity"><button type="button" onClick={()=>changeQuantity(item.id,-1)}>−</button><b>{item.quantity}</b><button type="button" onClick={()=>changeQuantity(item.id,1)} disabled={item.track_stock&&item.quantity>=(item.stock_quantity??0)}>+</button></div></div><button className="cart-remove" type="button" onClick={()=>remove(item.id)}>Remover</button></article>):<div className="cart-empty"><BagIcon/><h2>Sua sacola está vazia.</h2><p>Escolha um produto para começar seu pedido.</p><button type="button" onClick={()=>setCartOpen(false)}>Continuar comprando</button></div>}</div>
      {cartItems.length>0&&<div className="cart-drawer-footer"><div><span>Subtotal</span><strong>{money(subtotal)}</strong></div><small>O pagamento e a entrega serão combinados com a loja.</small><button type="button" onClick={checkout}>Finalizar no WhatsApp <span>→</span></button></div>}
    </aside>
    {restored&&<div className="cart-restored"><div><strong>Seu carrinho continua aqui.</strong><span>Retome a compra de onde parou.</span></div><button type="button" onClick={()=>{dismissRestored();setCartOpen(true);}}>Continuar compra</button><button className="cart-restored-close" type="button" onClick={dismissRestored} aria-label="Fechar">×</button></div>}
    {promoPrompt&&<aside className="store-soft-prompt"><span>NOVIDADES DA LOJA</span><h2>Fique por dentro das novidades</h2><p>Deseja receber promoções, lançamentos ou frete grátis? Ative as notificações e acompanhe esta loja.</p><div><button type="button" onClick={acceptPromo}>Ativar notificações</button><button type="button" onClick={declinePromo}>Agora não</button></div></aside>}
    {pushMessage&&<div className="store-notice">{pushMessage}</div>}
  </>;
}
