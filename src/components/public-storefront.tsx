"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

type Product = { id:string; name:string; description:string|null; price_cents:number; sale_price_cents:number|null; category:string|null; image_url:string|null };
type Store = { name:string; description:string|null; logo_url:string|null; banner_url:string|null; whatsapp:string };

const money = (cents:number) => new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(cents/100);
const BagIcon = () => <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 8h14l1 13H4L5 8Z" stroke="currentColor" strokeWidth="1.5"/><path d="M9 9V6a3 3 0 0 1 6 0v3" stroke="currentColor" strokeWidth="1.5"/></svg>;

export function PublicStorefront({store,products}:{store:Store;products:Product[]}) {
  const [activeCategory,setActiveCategory]=useState("Todos");
  const [cart,setCart]=useState<Record<string,number>>({});
  const [cartOpen,setCartOpen]=useState(false);
  const categories=useMemo(()=>["Todos","Novidades",...Array.from(new Set(products.map(product=>product.category).filter((value):value is string=>Boolean(value)))),"Promoções"].filter((value,index,array)=>array.indexOf(value)===index),[products]);
  const visibleProducts=useMemo(()=>products.filter((product,index)=>activeCategory==="Todos"||(activeCategory==="Novidades"&&index<8)||(activeCategory==="Promoções"&&product.sale_price_cents!==null)||product.category===activeCategory),[activeCategory,products]);
  const cartItems=products.filter(product=>cart[product.id]).map(product=>({...product,quantity:cart[product.id]}));
  const count=cartItems.reduce((sum,item)=>sum+item.quantity,0);
  const subtotal=cartItems.reduce((sum,item)=>sum+(item.sale_price_cents??item.price_cents)*item.quantity,0);
  const changeQuantity=(id:string,delta:number)=>setCart(current=>{const quantity=(current[id]??0)+delta;if(quantity<=0){const next={...current};delete next[id];return next;}return {...current,[id]:quantity};});
  const checkout=()=>{
    const lines=cartItems.map(item=>`• ${item.quantity}x ${item.name} — ${money((item.sale_price_cents??item.price_cents)*item.quantity)}`);
    const message=[`Olá! Gostaria de finalizar este pedido na ${store.name}:`,"",...lines,"",`Subtotal: ${money(subtotal)}`].join("\n");
    window.open(`https://wa.me/${store.whatsapp.replace(/\D/g,"")}?text=${encodeURIComponent(message)}`,"_blank","noopener,noreferrer");
  };
  return <>
    <header className="public-shop-header"><div>{store.logo_url?<Image src={store.logo_url} width={42} height={42} alt={`Logo ${store.name}`}/>:<i>{store.name.slice(0,1)}</i>}<strong>{store.name}</strong></div><nav><a href="#produtos">Produtos</a><a href={`https://wa.me/${store.whatsapp.replace(/\D/g,"")}`} target="_blank" rel="noreferrer">WhatsApp</a></nav><button className="shop-cart-trigger" type="button" onClick={()=>setCartOpen(true)} aria-label={`Abrir sacola com ${count} itens`}><BagIcon/><span>Sacola</span><b>{count}</b></button></header>

    <section className="public-shop-hero" style={store.banner_url?{backgroundImage:`linear-gradient(90deg,rgba(0,0,0,.55),rgba(0,0,0,.05)),url(${store.banner_url})`}:undefined}><div><span>LOJA OFICIAL</span><h1>{store.description||"Produtos escolhidos com cuidado para você."}</h1><a href="#produtos">Ver coleção</a></div></section>

    <nav className="shop-categories" aria-label="Categorias de produtos">{categories.map(category=><button key={category} type="button" className={activeCategory===category?"active":""} onClick={()=>setActiveCategory(category)}>{category}</button>)}</nav>

    <section id="produtos" className="public-products"><div className="public-products-heading"><div><span>CATÁLOGO · {activeCategory.toUpperCase()}</span><h2>{activeCategory==="Todos"?"Descubra nossos produtos":activeCategory}</h2></div><p>{visibleProducts.length} {visibleProducts.length===1?"produto":"produtos"}</p></div>
      {visibleProducts.length?<div className="public-product-grid">{visibleProducts.map(product=><article key={product.id}><div className="public-product-photo">{product.image_url?<Image src={product.image_url} alt={product.name} fill sizes="(max-width:700px) 50vw, 25vw"/>:<span>{product.name.slice(0,1)}</span>}<button type="button" onClick={()=>{changeQuantity(product.id,1);setCartOpen(true);}}>Adicionar à sacola</button></div><small>{product.category||"Novidades"}</small><h3>{product.name}</h3><div>{product.sale_price_cents!==null&&<del>{money(product.price_cents)}</del>}<strong>{money(product.sale_price_cents??product.price_cents)}</strong></div></article>)}</div>:<div className="public-empty"><h2>Nenhum produto nesta categoria.</h2><p>Escolha outra categoria para continuar navegando.</p></div>}
    </section>

    <footer className="public-shop-footer"><strong>{store.name}</strong><p>Atendimento e finalização pelo WhatsApp.</p><a href={`https://wa.me/${store.whatsapp.replace(/\D/g,"")}`} target="_blank" rel="noreferrer">Falar com a loja →</a></footer>

    <div className={cartOpen?"cart-backdrop visible":"cart-backdrop"} onClick={()=>setCartOpen(false)}/><aside className={cartOpen?"shop-cart-drawer open":"shop-cart-drawer"} aria-hidden={!cartOpen}><div className="cart-drawer-head"><div><span>SUA SACOLA</span><strong>{count} {count===1?"item":"itens"}</strong></div><button type="button" onClick={()=>setCartOpen(false)} aria-label="Fechar sacola">×</button></div>
      <div className="cart-drawer-items">{cartItems.length?cartItems.map(item=><article key={item.id}>{item.image_url?<div className="cart-drawer-photo"><Image src={item.image_url} alt="" fill sizes="76px"/></div>:<div className="cart-drawer-photo empty">{item.name.slice(0,1)}</div>}<div><small>{item.category||"Produto"}</small><strong>{item.name}</strong><span>{money(item.sale_price_cents??item.price_cents)}</span><div className="cart-quantity"><button type="button" onClick={()=>changeQuantity(item.id,-1)}>−</button><b>{item.quantity}</b><button type="button" onClick={()=>changeQuantity(item.id,1)}>+</button></div></div><button className="cart-remove" type="button" onClick={()=>setCart(current=>{const next={...current};delete next[item.id];return next;})}>Remover</button></article>):<div className="cart-empty"><BagIcon/><h2>Sua sacola está vazia.</h2><p>Escolha um produto para começar seu pedido.</p><button type="button" onClick={()=>setCartOpen(false)}>Continuar comprando</button></div>}</div>
      {cartItems.length>0&&<div className="cart-drawer-footer"><div><span>Subtotal</span><strong>{money(subtotal)}</strong></div><small>O pagamento e a entrega serão combinados com a loja.</small><button type="button" onClick={checkout}>Finalizar no WhatsApp <span>→</span></button></div>}
    </aside>
  </>;
}
