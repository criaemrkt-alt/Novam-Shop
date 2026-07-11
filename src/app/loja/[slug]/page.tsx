import type { CSSProperties } from "react";
import { notFound } from "next/navigation";
import { PublicStorefront } from "@/components/public-storefront";
import { createClient } from "@/lib/supabase/server";

type Store = { id:string; name:string; description:string|null; logo_path:string|null; banner_path:string|null; whatsapp:string; theme_primary:string; theme_accent:string; theme_background:string; theme_text:string };
type Product = { id:string; name:string; description:string|null; price_cents:number; sale_price_cents:number|null; categories:{name:string}|null; product_images:{storage_path:string;position:number}[] };

export default async function PublicStorePage({ params }: { params:Promise<{slug:string}> }) {
  const {slug}=await params; const supabase=await createClient();
  const {data:storeData}=await supabase.from("stores").select("id, name, description, logo_path, banner_path, whatsapp, theme_primary, theme_accent, theme_background, theme_text").eq("slug",slug).eq("is_active",true).maybeSingle();
  if(!storeData){const {data:state}=await supabase.rpc("get_public_store_state",{p_slug:slug});if(state?.[0]?.publication_status==="suspended")return <main className="store-unavailable"><div><span>NOVAM SHOP</span><h1>Esta loja está temporariamente indisponível.</h1><p>Por favor, tente novamente mais tarde.</p></div></main>;notFound();} const store=storeData as Store;
  const [{data:productsData},{data:notificationSettings}]=await Promise.all([supabase.from("products").select("id, name, description, price_cents, sale_price_cents, categories(name), product_images(storage_path, position)").eq("store_id",store.id).eq("is_active",true).order("created_at",{ascending:false}),supabase.from("store_notification_settings").select("promotions_enabled").eq("store_id",store.id).maybeSingle()]);
  const products=(productsData??[]) as unknown as Product[];
  const assetUrl=(path:string|null)=>path?supabase.storage.from("store-assets").getPublicUrl(path).data.publicUrl:null;
  const logoUrl=assetUrl(store.logo_path); const bannerUrl=assetUrl(store.banner_path);
  const theme={"--shop-primary":store.theme_primary,"--shop-accent":store.theme_accent,"--shop-bg":store.theme_background,"--shop-text":store.theme_text} as CSSProperties;
  const storefrontProducts=products.map(product=>{const image=[...(product.product_images??[])].sort((a,b)=>a.position-b.position)[0];return {id:product.id,name:product.name,description:product.description,price_cents:product.price_cents,sale_price_cents:product.sale_price_cents,category:product.categories?.name??null,image_url:image?assetUrl(image.storage_path):null};});
  return <main className="public-shop" style={theme}><PublicStorefront store={{id:store.id,slug,name:store.name,description:store.description,logo_url:logoUrl,banner_url:bannerUrl,whatsapp:store.whatsapp,promotions_enabled:notificationSettings?.promotions_enabled??false}} products={storefrontProducts}/></main>;
}
