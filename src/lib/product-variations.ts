import { moneyToCents } from "@/lib/catalog";
import type { ProductVariationsInput } from "@/components/product-variations-editor";

export type NormalizedVariations = {
  enabled: boolean;
  trackStock: boolean;
  options: { name: string; values: string[] }[];
  variants: {
    values: string[];
    sku: string;
    price_cents: number | null;
    sale_price_cents: number | null;
    stock_quantity: number | null;
    is_active: boolean;
  }[];
};

const combinationKey = (values: string[]) => values.map((value) => value.toLocaleLowerCase("pt-BR")).join("\u001f");

export function parseProductVariations(raw: FormDataEntryValue | null, productPriceCents: number): NormalizedVariations {
  if (typeof raw !== "string" || !raw) return { enabled: false, trackStock: false, options: [], variants: [] };
  let parsed: ProductVariationsInput;
  try { parsed = JSON.parse(raw) as ProductVariationsInput; } catch { throw new Error("Revise as variações do produto."); }
  if (!parsed.enabled) return { enabled: false, trackStock: false, options: [], variants: [] };
  if (!Array.isArray(parsed.options) || parsed.options.length < 1 || parsed.options.length > 3) throw new Error("Adicione entre uma e três opções de variação.");

  const optionNames = new Set<string>();
  const options = parsed.options.map((option) => {
    const name = String(option.name ?? "").trim();
    if (!name || name.length > 50) throw new Error("Revise o nome das opções de variação.");
    const normalizedName = name.toLocaleLowerCase("pt-BR");
    if (optionNames.has(normalizedName)) throw new Error("Não repita o nome de uma opção.");
    optionNames.add(normalizedName);
    if (!Array.isArray(option.values) || option.values.length < 1 || option.values.length > 30) throw new Error(`Adicione valores para ${name}.`);
    const seen = new Set<string>();
    const values = option.values.map((rawValue) => {
      const value = String(rawValue ?? "").trim();
      const normalized = value.toLocaleLowerCase("pt-BR");
      if (!value || value.length > 80 || seen.has(normalized)) throw new Error(`Revise os valores de ${name}.`);
      seen.add(normalized); return value;
    });
    return { name, values };
  });
  const expected = options.reduce((total, option) => total * option.values.length, 1);
  if (expected > 100) throw new Error("Use no máximo 100 combinações por produto.");
  if (!Array.isArray(parsed.variants) || parsed.variants.length !== expected) throw new Error("Gere novamente as combinações das variações.");
  const seenVariants = new Set<string>();
  const variants = parsed.variants.map((variant) => {
    if (!Array.isArray(variant.values) || variant.values.length !== options.length) throw new Error("Combinação de variação inválida.");
    variant.values.forEach((value, index) => { if (!options[index].values.includes(value)) throw new Error("Combinação de variação inválida."); });
    const key = combinationKey(variant.values);
    if (seenVariants.has(key)) throw new Error("Há combinações de variação repetidas.");
    seenVariants.add(key);
    const priceCents = variant.price.trim() ? moneyToCents(variant.price) : null;
    const salePriceCents = variant.sale_price.trim() ? moneyToCents(variant.sale_price) : null;
    const effectivePrice = priceCents ?? productPriceCents;
    if (priceCents !== null && priceCents < 0) throw new Error("Revise os preços das variações.");
    if (salePriceCents !== null && (salePriceCents < 0 || salePriceCents >= effectivePrice)) throw new Error("O promocional da variação deve ser menor que seu preço normal.");
    const stock = parsed.track_stock ? Number.parseInt(variant.stock_quantity, 10) : null;
    if (parsed.track_stock && (!Number.isInteger(stock) || stock! < 0)) throw new Error("Revise o estoque das variações.");
    return { values: variant.values, sku: String(variant.sku ?? "").trim().slice(0, 100), price_cents: priceCents, sale_price_cents: salePriceCents, stock_quantity: stock, is_active: Boolean(variant.is_active) };
  });
  return { enabled: true, trackStock: Boolean(parsed.track_stock), options, variants };
}
