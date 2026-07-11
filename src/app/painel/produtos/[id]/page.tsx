import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { createClient } from "@/lib/supabase/server";

type Product = { id:string; name:string; description:string|null; category_id:string|null; price_cents:number; sale_price_cents:number|null; is_active:boolean; track_stock:boolean; stock_quantity:number|null; product_images:{ id:string; storage_path:string; position:number }[] };
const inputMoney = (cents:number|null) => cents === null ? "" : (cents/100).toFixed(2).replace(".",",");

export default async function EditProductPage({ params, searchParams }: { params:Promise<{id:string}>; searchParams:Promise<{erro?:string;sucesso?:string}> }) {
  const { id } = await params; const message = await searchParams; const supabase = await createClient();
  const { data:{user} } = await supabase.auth.getUser(); if (!user) redirect("/login");
  const { data:store } = await supabase.from("stores").select("id").eq("owner_id",user.id).maybeSingle(); if (!store) redirect("/painel");
  const [{data:productData},{data:categories}] = await Promise.all([
    supabase.from("products").select("id, name, description, category_id, price_cents, sale_price_cents, is_active, track_stock, stock_quantity, product_images(id, storage_path, position)").eq("id",id).eq("store_id",store.id).maybeSingle(),
    supabase.from("categories").select("id, name").eq("store_id",store.id).order("name"),
  ]);
  if (!productData) notFound(); const product=productData as unknown as Product;
  const images=[...(product.product_images??[])].sort((a,b)=>a.position-b.position);
  const imageUrl=(path:string)=>supabase.storage.from("store-assets").getPublicUrl(path).data.publicUrl;
  return <div className="dashboard-content subpage-content">
    <div className="edit-product-back"><Link href="/painel/produtos">← Voltar para produtos</Link></div>
    <div className="dashboard-topbar"><div><p>Edição do produto</p><h1>{product.name}</h1></div><div className={product.is_active?"store-status is-active":"store-status"}><span/>{product.is_active?"Produto ativo":"Produto pausado"}</div></div>
    <p className="dashboard-intro">Atualize as informações que seu cliente verá na vitrine.</p><FormMessage error={message.erro} success={message.sucesso}/>
    <form action="/api/products/update" method="post" encType="multipart/form-data" className="edit-product-layout"><input type="hidden" name="id" value={product.id}/>
      <div className="feature-form product-form edit-product-form">
        <div className="feature-form-heading"><span>Informações</span><h2>Detalhes do produto</h2><p>Nome, categoria, descrição e valores exibidos na loja.</p></div>
        <div className="form-row"><label className="field"><span>Nome do produto</span><input name="name" required maxLength={160} defaultValue={product.name}/></label><label className="field"><span>Categoria</span><select name="category_id" defaultValue={product.category_id??""}><option value="">Sem categoria</option>{categories?.map(category=><option key={category.id} value={category.id}>{category.name}</option>)}</select></label></div>
        <label className="field"><span>Descrição</span><textarea name="description" rows={5} maxLength={5000} defaultValue={product.description??""}/></label>
        <div className="form-row"><label className="field"><span>Preço normal</span><input name="price" required inputMode="decimal" defaultValue={inputMoney(product.price_cents)}/></label><label className="field"><span>Preço promocional</span><input name="sale_price" inputMode="decimal" defaultValue={inputMoney(product.sale_price_cents)}/></label></div>
        <div className="product-switches"><label><input name="is_active" type="checkbox" defaultChecked={product.is_active}/><span>Produto ativo</span></label><label><input name="track_stock" type="checkbox" defaultChecked={product.track_stock}/><span>Controlar estoque</span></label><label className="stock-input"><span>Quantidade</span><input name="stock_quantity" type="number" min="0" defaultValue={product.stock_quantity??0}/></label></div>
        <SubmitButton pendingText="Salvando…">Salvar alterações</SubmitButton>
      </div>
      <aside className="edit-product-media"><div className="preview-heading"><div><span>Galeria</span><strong>{images.length} de 5 imagens</strong></div></div>
        <div className="edit-product-gallery">{images.length?images.map((image,index)=><div key={image.id} className={index===0?"main-image":""}><Image src={imageUrl(image.storage_path)} alt={`${product.name} ${index+1}`} fill sizes="(max-width: 760px) 50vw, 220px"/></div>):<div className="gallery-empty"><span>{product.name.slice(0,1)}</span><p>Nenhuma imagem enviada.</p></div>}</div>
        {images.length<5&&<label className="upload-field"><span>Adicionar imagens</span><input name="images" type="file" accept="image/jpeg,image/png,image/webp" multiple/><small>Você ainda pode adicionar {5-images.length} imagem(ns).</small></label>}
      </aside>
    </form>
  </div>;
}
