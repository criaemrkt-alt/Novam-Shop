import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { formatMoney } from "@/lib/catalog";
import { createClient } from "@/lib/supabase/server";

type Product = { id:string; name:string; price_cents:number; sale_price_cents:number|null; is_active:boolean; track_stock:boolean; stock_quantity:number|null; categories:{ name:string }|null; product_images:{ storage_path:string }[] };

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ erro?: string; sucesso?: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser(); if (!user) redirect("/login");
  const { data: store } = await supabase.from("stores").select("id").eq("owner_id", user.id).maybeSingle(); if (!store) redirect("/painel?erro=Crie+sua+loja+primeiro.");
  const [{ data: categories }, { data: productsData }] = await Promise.all([
    supabase.from("categories").select("id, name").eq("store_id", store.id).order("position").order("name"),
    supabase.from("products").select("id, name, price_cents, sale_price_cents, is_active, track_stock, stock_quantity, categories(name), product_images(storage_path)").eq("store_id", store.id).order("created_at", { ascending:false }),
  ]);
  const products = (productsData ?? []) as unknown as Product[]; const message = await searchParams;
  const imageUrl = (path?:string) => path ? supabase.storage.from("store-assets").getPublicUrl(path).data.publicUrl : null;
  return <div className="dashboard-content subpage-content">
    <div className="dashboard-topbar"><div><p>Catálogo</p><h1>Produtos</h1></div><div className="catalog-count"><strong>{products.length}</strong><span>{products.length === 1 ? "produto" : "produtos"}</span></div></div>
    <p className="dashboard-intro">Cadastre o que você vende com informações claras, imagens bonitas e estoque apenas quando precisar.</p>
    <FormMessage error={message.erro} success={message.sucesso} />
    <div className="catalog-layout">
      <div className="catalog-main">
        <details className="product-create" open={products.length === 0}><summary><span>Adicionar produto</span><b>+</b></summary>
          <form action="/api/products" method="post" encType="multipart/form-data" className="feature-form product-form">
            <div className="form-row"><label className="field"><span>Nome do produto</span><input name="name" required maxLength={160} placeholder="Ex.: Bolsa Siena" /></label><label className="field"><span>Categoria</span><select name="category_id"><option value="">Sem categoria</option>{categories?.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label></div>
            <label className="field"><span>Descrição <small>Opcional</small></span><textarea name="description" rows={4} maxLength={5000} placeholder="Materiais, acabamento e detalhes importantes." /></label>
            <div className="form-row"><label className="field"><span>Preço normal</span><input name="price" required inputMode="decimal" placeholder="289,00" /></label><label className="field"><span>Preço promocional <small>Opcional</small></span><input name="sale_price" inputMode="decimal" placeholder="249,00" /></label></div>
            <label className="upload-field"><span>Fotos do produto</span><input name="images" type="file" accept="image/jpeg,image/png,image/webp" multiple /><small>Até 5 imagens, com 5 MB cada.</small></label>
            <div className="product-switches"><label><input name="is_active" type="checkbox" defaultChecked /><span>Produto ativo</span></label><label><input name="track_stock" type="checkbox" /><span>Controlar estoque</span></label><label className="stock-input"><span>Quantidade</span><input name="stock_quantity" type="number" min="0" defaultValue="0" /></label></div>
            <SubmitButton pendingText="Cadastrando…">Cadastrar produto</SubmitButton>
          </form>
        </details>
        <div className="product-list">{products.length === 0 ? <div className="empty-state"><span>01</span><h2>Seu primeiro produto começa aqui.</h2><p>Cadastre uma peça para começar a construir sua vitrine.</p></div> : products.map(product => <article key={product.id}>
          <Link href={`/painel/produtos/${product.id}`} className="product-list-image" aria-label={`Editar ${product.name}`}>{imageUrl(product.product_images?.[0]?.storage_path) ? <Image src={imageUrl(product.product_images[0].storage_path)!} alt="" width={64} height={72} /> : <span>{product.name.slice(0,1)}</span>}</Link>
          <div className="product-list-copy"><span>{product.categories?.name || "Sem categoria"}</span><Link href={`/painel/produtos/${product.id}`}>{product.name}</Link><small>{product.track_stock ? `${product.stock_quantity ?? 0} em estoque` : "Estoque ilimitado"}</small></div>
          <div className="product-list-price">{product.sale_price_cents !== null && <del>{formatMoney(product.price_cents)}</del>}<strong>{formatMoney(product.sale_price_cents ?? product.price_cents)}</strong></div>
          <form action="/api/products/status" method="post"><input type="hidden" name="id" value={product.id} /><input type="hidden" name="is_active" value={String(!product.is_active)} /><button className={product.is_active ? "status-pill active" : "status-pill"} type="submit">{product.is_active ? "Ativo" : "Pausado"}</button></form>
        </article>)}</div>
      </div>
      <aside className="category-panel"><span>Organização</span><h2>Categorias</h2><form action="/api/categories" method="post"><input name="name" required maxLength={80} placeholder="Nova categoria" /><button type="submit">Adicionar</button></form><div>{categories?.length ? categories.map((category, index) => <p key={category.id}><i>{String(index+1).padStart(2,"0")}</i>{category.name}</p>) : <small>As categorias aparecerão aqui.</small>}</div></aside>
    </div>
  </div>;
}
