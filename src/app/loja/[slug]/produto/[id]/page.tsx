import type { CSSProperties } from "react";
import { notFound } from "next/navigation";
import { PublicProductDetail } from "@/components/public-product-detail";
import { createClient } from "@/lib/supabase/server";
import { accessibleTextColor, readableColor } from "@/lib/theme-contrast";

export default async function ProductPage({params}:{params:Promise<{slug:string;id:string}>}) {
  const {slug,id}=await params; const supabase=await createClient();
  const {data:store}=await supabase.from("stores").select("id, name, logo_path, theme_primary, theme_accent, theme_background, theme_text").eq("slug",slug).eq("is_active",true).maybeSingle();
  if(!store){const {data:state}=await supabase.rpc("get_public_store_state",{p_slug:slug});if(state?.[0]?.publication_status==="suspended")return <main className="store-unavailable"><div><span>NOVAM SHOP</span><h1>Esta loja está temporariamente indisponível.</h1><p>Por favor, tente novamente mais tarde.</p></div></main>;notFound();}
  const {data:product}=await supabase.from("products").select("id, name, description, materials, lead_time, customization_notes, price_cents, sale_price_cents, track_stock, stock_quantity, categories(name), product_images(storage_path, position)").eq("id",id).eq("store_id",store.id).eq("is_active",true).maybeSingle();
  if(!product)notFound();
  const assetUrl=(path:string|null)=>path?supabase.storage.from("store-assets").getPublicUrl(path).data.publicUrl:null;
  const images=[...(product.product_images??[])].sort((a,b)=>a.position-b.position).map(image=>assetUrl(image.storage_path)!).filter(Boolean);
  const theme={"--shop-primary":store.theme_primary,"--shop-accent":store.theme_accent,"--shop-bg":store.theme_background,"--shop-text":accessibleTextColor(store.theme_text,store.theme_background),"--shop-on-primary":readableColor(store.theme_primary),"--shop-on-accent":readableColor(store.theme_accent)} as CSSProperties;
  const category=(product.categories as unknown as {name:string}[]|null)?.[0]?.name??null;
  return <div className="public-shop product-public-shell" style={theme}><PublicProductDetail store={{id:store.id,slug,name:store.name,logo_url:assetUrl(store.logo_path)}} product={{id:product.id,name:product.name,description:product.description,materials:product.materials,lead_time:product.lead_time,customization_notes:product.customization_notes,price_cents:product.price_cents,sale_price_cents:product.sale_price_cents,category:category??null,images,track_stock:product.track_stock,stock_quantity:product.stock_quantity}}/></div>;
}
