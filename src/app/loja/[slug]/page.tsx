import type { CSSProperties } from "react";
import { notFound } from "next/navigation";
import { PublicStorefront } from "@/components/public-storefront";
import { createClient } from "@/lib/supabase/server";
import { accessibleTextColor, readableColor } from "@/lib/theme-contrast";

type Store = { id:string; name:string; description:string|null; hero_title:string|null; subtitle:string|null; show_hero_content:boolean; logo_path:string|null; whatsapp:string; theme_primary:string; theme_accent:string; theme_background:string; theme_text:string };
type Product = { id:string; name:string; description:string|null; price_cents:number; sale_price_cents:number|null; track_stock:boolean; stock_quantity:number|null; categories:{name:string}|null; product_images:{storage_path:string;position:number}[] };

export default async function PublicStorePage({ params }: { params:Promise<{slug:string}> }) {
  const {slug}=await params; const supabase=await createClient();
  const {data:storeData}=await supabase.from("stores").select("id, name, description, hero_title, subtitle, show_hero_content, logo_path, whatsapp, theme_primary, theme_accent, theme_background, theme_text").eq("slug",slug).eq("is_active",true).maybeSingle();
  if(!storeData){const {data:state}=await supabase.rpc("get_public_store_state",{p_slug:slug});if(state?.[0]?.publication_status==="suspended")return <main className="store-unavailable"><div><span>NOVAM SHOP</span><h1>Esta loja está temporariamente indisponível.</h1><p>Por favor, tente novamente mais tarde.</p></div></main>;notFound();} const store=storeData as Store;
  const [{data:productsData},{data:notificationSettings},{data:bannersData}]=await Promise.all([supabase.from("products").select("id, name, description, price_cents, sale_price_cents, track_stock, stock_quantity, categories(name), product_images(storage_path, position)").eq("store_id",store.id).eq("is_active",true).order("created_at",{ascending:false}),supabase.from("store_notification_settings").select("promotions_enabled").eq("store_id",store.id).maybeSingle(),supabase.from("store_banners").select("desktop_path, mobile_path, position").eq("store_id",store.id).order("position")]);
  const products=(productsData??[]) as unknown as Product[];
  const assetUrl=(path:string|null)=>path?supabase.storage.from("store-assets").getPublicUrl(path).data.publicUrl:null;
  const logoUrl=assetUrl(store.logo_path); const banners=(bannersData??[]).map(banner=>({desktop_url:assetUrl(banner.desktop_path)!,mobile_url:assetUrl(banner.mobile_path)}));
  const theme={"--shop-primary":store.theme_primary,"--shop-accent":store.theme_accent,"--shop-bg":store.theme_background,"--shop-text":accessibleTextColor(store.theme_text,store.theme_background),"--shop-on-primary":readableColor(store.theme_primary),"--shop-on-accent":readableColor(store.theme_accent)} as CSSProperties;
  const storefrontProducts=products.map(product=>{const image=[...(product.product_images??[])].sort((a,b)=>a.position-b.position)[0];return {id:product.id,name:product.name,description:product.description,price_cents:product.price_cents,sale_price_cents:product.sale_price_cents,track_stock:product.track_stock,stock_quantity:product.stock_quantity,category:product.categories?.name??null,image_url:image?assetUrl(image.storage_path):null};});
  return <main className="public-shop" style={theme}><PublicStorefront store={{id:store.id,slug,name:store.name,description:store.description,hero_title:store.hero_title,subtitle:store.subtitle,show_hero_content:store.show_hero_content,logo_url:logoUrl,banners,whatsapp:store.whatsapp,promotions_enabled:notificationSettings?.promotions_enabled??false}} products={storefrontProducts}/></main>;
}
