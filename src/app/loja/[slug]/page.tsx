import type { CSSProperties } from "react";
import Image from "next/image";
import { notFound } from "next/navigation";
import { formatMoney } from "@/lib/catalog";
import { createClient } from "@/lib/supabase/server";

type Store = { id:string; name:string; description:string|null; logo_path:string|null; banner_path:string|null; whatsapp:string; theme_primary:string; theme_accent:string; theme_background:string; theme_text:string };
type Product = { id:string; name:string; description:string|null; price_cents:number; sale_price_cents:number|null; categories:{name:string}|null; product_images:{storage_path:string;position:number}[] };

export default async function PublicStorePage({ params }: { params:Promise<{slug:string}> }) {
  const {slug}=await params; const supabase=await createClient();
  const {data:storeData}=await supabase.from("stores").select("id, name, description, logo_path, banner_path, whatsapp, theme_primary, theme_accent, theme_background, theme_text").eq("slug",slug).eq("is_active",true).maybeSingle();
  if(!storeData) notFound(); const store=storeData as Store;
  const {data:productsData}=await supabase.from("products").select("id, name, description, price_cents, sale_price_cents, categories(name), product_images(storage_path, position)").eq("store_id",store.id).eq("is_active",true).order("created_at",{ascending:false});
  const products=(productsData??[]) as unknown as Product[];
  const assetUrl=(path:string|null)=>path?supabase.storage.from("store-assets").getPublicUrl(path).data.publicUrl:null;
  const logoUrl=assetUrl(store.logo_path); const bannerUrl=assetUrl(store.banner_path);
  const theme={"--shop-primary":store.theme_primary,"--shop-accent":store.theme_accent,"--shop-bg":store.theme_background,"--shop-text":store.theme_text} as CSSProperties;
  return <main className="public-shop" style={theme}>
    <header className="public-shop-header"><div>{logoUrl?<Image src={logoUrl} width={42} height={42} alt={`Logo ${store.name}`}/>:<i>{store.name.slice(0,1)}</i>}<strong>{store.name}</strong></div><nav><a href="#produtos">Produtos</a><a href={`https://wa.me/${store.whatsapp.replace(/\D/g,"")}`} target="_blank" rel="noreferrer">WhatsApp</a></nav><span>Carrinho · 0</span></header>
    <section className="public-shop-hero" style={bannerUrl?{backgroundImage:`linear-gradient(90deg,rgba(0,0,0,.58),rgba(0,0,0,.08)),url(${bannerUrl})`}:undefined}><div><span>LOJA OFICIAL</span><h1>{store.description||"Produtos escolhidos com cuidado para você."}</h1><a href="#produtos">Explorar produtos</a></div></section>
    <section id="produtos" className="public-products"><div className="public-products-heading"><div><span>CATÁLOGO</span><h2>Descubra nossos produtos</h2></div><p>{products.length} {products.length===1?"produto":"produtos"}</p></div>
      {products.length?<div className="public-product-grid">{products.map(product=>{const image=[...(product.product_images??[])].sort((a,b)=>a.position-b.position)[0];return <article key={product.id}><div className="public-product-photo">{image?<Image src={assetUrl(image.storage_path)!} alt={product.name} fill sizes="(max-width:700px) 50vw, 25vw"/>:<span>{product.name.slice(0,1)}</span>}</div><small>{product.categories?.name||"Novidades"}</small><h3>{product.name}</h3><div>{product.sale_price_cents!==null&&<del>{formatMoney(product.price_cents)}</del>}<strong>{formatMoney(product.sale_price_cents??product.price_cents)}</strong></div></article>})}</div>:<div className="public-empty"><h2>Novidades chegando.</h2><p>Esta loja ainda está preparando os primeiros produtos.</p></div>}
    </section>
    <footer className="public-shop-footer"><strong>{store.name}</strong><p>Atendimento e finalização pelo WhatsApp.</p><a href={`https://wa.me/${store.whatsapp.replace(/\D/g,"")}`} target="_blank" rel="noreferrer">Falar com a loja →</a></footer>
  </main>;
}
