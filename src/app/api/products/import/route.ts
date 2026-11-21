import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAllowedFormOrigin, redirectWithMessage } from "@/lib/http";
import { moneyToCents, slugify } from "@/lib/catalog";

function parseCsv(source: string) {
  const delimiter = (source.split(/\r?\n/, 1)[0]?.match(/;/g)?.length ?? 0) >
    (source.split(/\r?\n/, 1)[0]?.match(/,/g)?.length ?? 0) ? ";" : ",";
  const rows: string[][] = [];
  let row: string[] = [], cell = "", quoted = false;
  for (let i = 0; i < source.length; i++) {
    const char = source[i];
    if (char === '"' && quoted && source[i + 1] === '"') { cell += '"'; i++; }
    else if (char === '"') quoted = !quoted;
    else if (!quoted && char === delimiter) { row.push(cell.trim()); cell = ""; }
    else if (!quoted && (char === "\n" || char === "\r")) {
      if (char === "\r" && source[i + 1] === "\n") i++;
      row.push(cell.trim()); if (row.some(Boolean)) rows.push(row);
      row = []; cell = "";
    } else cell += char;
  }
  row.push(cell.trim()); if (row.some(Boolean)) rows.push(row);
  return rows;
}

export async function POST(request: Request) {
  if (!isAllowedFormOrigin(request)) return new NextResponse("Origem inválida", { status: 403 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirectWithMessage(request, "/login", "erro", "Sua sessão expirou.");
  const { data: store } = await supabase.from("stores").select("id").eq("owner_id", user.id).maybeSingle();
  if (!store) return redirectWithMessage(request, "/painel", "erro", "Crie sua loja primeiro.");

  const data = await request.formData();
  const file = data.get("file");
  if (!(file instanceof File) || !file.name.toLowerCase().endsWith(".csv") || file.size > 2 * 1024 * 1024)
    return redirectWithMessage(request, "/painel/produtos", "erro", "Envie um arquivo CSV de até 2 MB.");
  const rows = parseCsv((await file.text()).replace(/^\uFEFF/, ""));
  if (rows.length < 2) return redirectWithMessage(request, "/painel/produtos", "erro", "O CSV precisa ter cabeçalho e pelo menos um produto.");
  const headers = rows[0].map((value) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase());
  const nameIndex = headers.indexOf("nome");
  const priceIndex = headers.indexOf("preco");
  if (nameIndex < 0 || priceIndex < 0)
    return redirectWithMessage(request, "/painel/produtos", "erro", "O CSV precisa ter as colunas nome e preco.");
  const descriptionIndex = headers.indexOf("descricao");
  const categoryIndex = headers.indexOf("categoria");
  const stockIndex = headers.indexOf("estoque");
  const productRows = rows.slice(1).filter((row) => row.some(Boolean));
  if (!productRows.length || productRows.length > 100)
    return redirectWithMessage(request, "/painel/produtos", "erro", "Importe de 1 a 100 produtos por arquivo.");

  const { data: categories } = await supabase.from("categories").select("id, name").eq("store_id", store.id);
  const categoryByName = new Map((categories ?? []).map((category) => [category.name.trim().toLocaleLowerCase("pt-BR"), category.id]));
  const { data: last } = await supabase.from("products").select("display_position").eq("store_id", store.id).order("display_position", { ascending: false }).limit(1).maybeSingle();
  let position = (last?.display_position ?? -1) + 1;
  let imported = 0, skipped = 0;
  for (const row of productRows) {
    const name = row[nameIndex]?.trim() ?? "";
    const price = moneyToCents(row[priceIndex] ?? "");
    const description = descriptionIndex >= 0 ? row[descriptionIndex]?.trim() ?? "" : "";
    const categoryName = categoryIndex >= 0 ? row[categoryIndex]?.trim() ?? "" : "";
    const stockText = stockIndex >= 0 ? row[stockIndex]?.trim() ?? "" : "";
    const stock = stockText === "" ? null : Number.parseInt(stockText, 10);
    if (!name || name.length > 160 || price < 0 || description.length > 5000 ||
      (stockText !== "" && (!Number.isInteger(stock) || stock! < 0))) { skipped++; continue; }
    const categoryId = categoryName ? categoryByName.get(categoryName.toLocaleLowerCase("pt-BR")) : null;
    if (categoryName && !categoryId) { skipped++; continue; }
    const { error } = await supabase.from("products").insert({
      store_id: store.id, category_id: categoryId ?? null, name, slug: slugify(name),
      description: description || null, price_cents: price, sale_price_cents: null,
      is_active: true, track_stock: stock !== null, stock_mode: "product",
      stock_quantity: stock, display_position: position,
    });
    if (error) { skipped++; continue; }
    imported++; position++;
  }
  if (!imported) return redirectWithMessage(request, "/painel/produtos", "erro", "Nenhum produto foi importado. Confira nomes de categorias, preços e estoque.");
  const suffix = skipped ? ` ${skipped} linha(s) foram ignoradas por dados inválidos ou repetidos.` : "";
  return redirectWithMessage(request, "/painel/produtos", "sucesso", `${imported} produto(s) importado(s).${suffix}`);
}
