import { NextResponse } from "next/server";
import { formValue, isAllowedFormOrigin, redirectWithMessage } from "@/lib/http";
import { moneyToCents, safeFileName, slugify, validImage } from "@/lib/catalog";
import { createClient } from "@/lib/supabase/server";
import { parseProductVariations } from "@/lib/product-variations";

export async function POST(request: Request) {
  if (!isAllowedFormOrigin(request)) return new NextResponse("Origem inválida", { status: 403 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirectWithMessage(request, "/login", "erro", "Sua sessão expirou.");
  const { data: store } = await supabase.from("stores").select("id").eq("owner_id", user.id).maybeSingle();
  if (!store) return redirectWithMessage(request, "/painel", "erro", "Crie sua loja primeiro.");
  const formData = await request.formData();
  const name = formValue(formData, "name");
  const description = formValue(formData, "description");
  const materials = formValue(formData, "materials");
  const leadTime = formValue(formData, "lead_time");
  const customizationNotes = formValue(formData, "customization_notes");
  const categoryId = formValue(formData, "category_id") || null;
  const priceCents = moneyToCents(formValue(formData, "price"));
  const saleRaw = formValue(formData, "sale_price");
  const salePriceCents = saleRaw ? moneyToCents(saleRaw) : null;
  const trackStock = formData.get("track_stock") === "on";
  const stockQuantity = trackStock ? Number.parseInt(formValue(formData, "stock_quantity"), 10) : null;
  let variations;
  try { variations = parseProductVariations(formData.get("variations_json"), priceCents); }
  catch (error) { return redirectWithMessage(request, "/painel/produtos", "erro", error instanceof Error ? error.message : "Revise as variações."); }
  if (!name || name.length > 160 || description.length > 5000 || materials.length > 500 || leadTime.length > 300 || customizationNotes.length > 1000) return redirectWithMessage(request, "/painel/produtos", "erro", "Revise os textos do produto.");
  if (priceCents < 0 || (salePriceCents !== null && (salePriceCents < 0 || salePriceCents >= priceCents))) return redirectWithMessage(request, "/painel/produtos", "erro", "Revise os preços. O promocional deve ser menor que o normal.");
  if (!variations.enabled && trackStock && (!Number.isInteger(stockQuantity) || stockQuantity! < 0)) return redirectWithMessage(request, "/painel/produtos", "erro", "Informe um estoque válido.");
  if (categoryId) {
    const { data: category } = await supabase.from("categories").select("id").eq("id", categoryId).eq("store_id", store.id).maybeSingle();
    if (!category) return redirectWithMessage(request, "/painel/produtos", "erro", "Categoria inválida.");
  }
  const {data:lastProduct}=await supabase.from("products").select("display_position").eq("store_id",store.id).order("display_position",{ascending:false}).limit(1).maybeSingle();
  const { data: product, error } = await supabase.from("products").insert({ store_id: store.id, category_id: categoryId, name, slug: slugify(name), description: description || null, materials:materials||null, lead_time:leadTime||null, customization_notes:customizationNotes||null, price_cents: priceCents, sale_price_cents: salePriceCents, is_active: formData.get("is_active") === "on", track_stock: variations.enabled ? variations.trackStock : trackStock, stock_mode: variations.enabled ? "variant" : "product", stock_quantity: variations.enabled ? null : stockQuantity, display_position:(lastProduct?.display_position??-1)+1 }).select("id").single();
  if (error?.code === "23505") return redirectWithMessage(request, "/painel/produtos", "erro", "Já existe um produto com esse nome/endereço.");
  if (error || !product) return redirectWithMessage(request, "/painel/produtos", "erro", "Não foi possível criar o produto.");
  if (variations.enabled) {
    const { error: variationError } = await supabase.rpc("save_owned_product_variations", { p_product_id: product.id, p_options: variations.options, p_variants: variations.variants, p_track_stock: variations.trackStock });
    if (variationError) { await supabase.from("products").delete().eq("id", product.id); return redirectWithMessage(request, "/painel/produtos", "erro", "Não foi possível salvar as variações. Confirme se a migration 011 foi aplicada."); }
  }
  const files = formData.getAll("images").filter(validImage).slice(0, 5);
  for (const [position, file] of files.entries()) {
    const path = `${user.id}/${store.id}/products/${product.id}/${safeFileName(file.name)}`;
    const upload = await supabase.storage.from("store-assets").upload(path, file, { contentType: file.type });
    if (!upload.error) await supabase.from("product_images").insert({ product_id: product.id, storage_path: path, alt_text: name, position });
  }
  return redirectWithMessage(request, "/painel/produtos", "sucesso", "Produto cadastrado.");
}
