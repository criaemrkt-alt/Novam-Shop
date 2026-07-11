"use client";

import Image from "next/image";
import Link from "next/link";
import { useStoreCart } from "@/lib/use-store-cart";

type Product={id:string;name:string;description:string|null;price_cents:number;sale_price_cents:number|null;category:string|null;images:string[];track_stock:boolean;stock_quantity:number|null};
type Store={id:string;slug:string;name:string;logo_url:string|null};
const money=(cents:number)=>new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(cents/100);

export function PublicProductDetail({store,product}:{store:Store;product:Product}) {
  const {cart,changeQuantity,toggle}=useStoreCart(store.slug,store.id); const quantity=cart[product.id]??0;
  const unavailable=product.track_stock&&(product.stock_quantity??0)<=0;
  return <>
    <header className="product-detail-header"><Link href={`/loja/${store.slug}`} className="product-detail-brand">{store.logo_url?<Image src={store.logo_url} width={38} height={38} alt={`Logo ${store.name}`}/>:<i>{store.name.slice(0,1)}</i>}<strong>{store.name}</strong></Link><Link href={`/loja/${store.slug}`} className="back-to-catalog">← Voltar ao catálogo</Link><Link href={`/loja/${store.slug}#produtos`} className="detail-bag">Sacola <b>{Object.values(cart).reduce((sum,value)=>sum+value,0)}</b></Link></header>
    <main className="product-detail-page"><section className="product-detail-gallery">{product.images.length?product.images.map((image,index)=><div key={image} className={index===0?"main":""}><Image src={image} alt={`${product.name} ${index+1}`} fill priority={index===0} sizes="(max-width:800px) 100vw, 55vw"/></div>):<div className="product-detail-placeholder">{product.name.slice(0,1)}</div>}</section>
      <aside className="product-detail-info"><span>{product.category||"Novidades"}</span><h1>{product.name}</h1><div className="detail-prices">{product.sale_price_cents!==null&&<del>{money(product.price_cents)}</del>}<strong>{money(product.sale_price_cents??product.price_cents)}</strong></div>{product.description&&<p>{product.description}</p>}
        {unavailable?<div className="detail-unavailable">Produto indisponível no momento.</div>:quantity?<div className="detail-cart-controls"><button type="button" onClick={()=>changeQuantity(product.id,-1)}>−</button><strong>{quantity} na sacola</strong><button type="button" onClick={()=>changeQuantity(product.id,1)} disabled={product.track_stock&&quantity>=(product.stock_quantity??0)}>+</button></div>:<button className="detail-add-button" type="button" onClick={()=>toggle(product.id)}>Adicionar à sacola <span>→</span></button>}
        {quantity>0&&<button className="detail-remove-button" type="button" onClick={()=>toggle(product.id)}>Remover da sacola</button>}
        <div className="detail-service"><span>Compra simples</span><p>Adicione à sacola e finalize o atendimento diretamente com a loja.</p></div>
      </aside>
    </main>
  </>;
}
