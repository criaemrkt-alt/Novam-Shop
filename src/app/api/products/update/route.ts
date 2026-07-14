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
  const formData = await request.formData();
  const id = formValue(formData, "id");
  const back = `/painel/produtos/${id}`;
  const { data: store } = await supabase.from("stores").select("id").eq("owner_id", user.id).maybeSingle();
  const { data: current } = await supabase.from("products").select("id").eq("id", id).eq("store_id", store?.id ?? "").maybeSingle();
  if (!store || !current) return redirectWithMessage(request, "/painel/produtos", "erro", "Produto não encontrado.");
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
  catch (error) { return redirectWithMessage(request, back, "erro", error instanceof Error ? error.message : "Revise as variações."); }
  if (!name || name.length > 160 || description.length > 5000 || materials.length > 500 || leadTime.length > 300 || customizationNotes.length > 1000) return redirectWithMessage(request, back, "erro", "Revise os textos do produto.");
  if (priceCents < 0 || (salePriceCents !== null && (salePriceCents < 0 || salePriceCents >= priceCents))) return redirectWithMessage(request, back, "erro", "O preço promocional deve ser menor que o preço normal.");
  if (!variations.enabled && trackStock && (!Number.isInteger(stockQuantity) || stockQuantity! < 0)) return redirectWithMessage(request, back, "erro", "Informe um estoque válido.");
  if (categoryId) {
    const { data: category } = await supabase.from("categories").select("id").eq("id", categoryId).eq("store_id", store.id).maybeSingle();
    if (!category) return redirectWithMessage(request, back, "erro", "Categoria inválida.");
  }
  const { error } = await supabase.from("products").update({ category_id: categoryId, name, slug: slugify(name), description: description || null, materials:materials||null, lead_time:leadTime||null, customization_notes:customizationNotes||null, price_cents: priceCents, sale_price_cents: salePriceCents, is_active: formData.get("is_active") === "on" }).eq("id", id).eq("store_id", store.id);
  if (error?.code === "23505") return redirectWithMessage(request, back, "erro", "Já existe outro produto com esse nome/endereço.");
  if (error) return redirectWithMessage(request, back, "erro", "Não foi possível salvar as alterações.");
  const variationResult = variations.enabled
    ? await supabase.rpc("save_owned_product_variations", { p_product_id: id, p_options: variations.options, p_variants: variations.variants, p_track_stock: variations.trackStock })
    : await supabase.rpc("disable_owned_product_variations", { p_product_id: id, p_track_stock: trackStock, p_stock_quantity: stockQuantity });
  if (variationResult.error) return redirectWithMessage(request, back, "erro", "Os dados principais foram salvos, mas as variações não. Confirme se a migration 011 foi aplicada.");
  const { count } = await supabase.from("product_images").select("id", { count: "exact", head: true }).eq("product_id", id);
  const files = formData.getAll("images").filter(validImage).slice(0, Math.max(0, 5 - (count ?? 0)));
  for (const [index, file] of files.entries()) {
    const path = `${user.id}/${store.id}/products/${id}/${safeFileName(file.name)}`;
    const upload = await supabase.storage.from("store-assets").upload(path, file, { contentType: file.type });
    if (upload.error) return redirectWithMessage(request, back, "erro", "Produto salvo, mas as imagens não foram enviadas. Aplique a migration do Storage.");
    await supabase.from("product_images").insert({ product_id: id, storage_path: path, alt_text: name, position: (count ?? 0) + index });
  }
  return redirectWithMessage(request, back, "sucesso", "Produto atualizado com sucesso.");
}
