"use client";

import { useMemo, useState } from "react";

export type VariationOptionInput = {
  name: string;
  values: string[];
};

export type VariationVariantInput = {
  values: string[];
  sku: string;
  price: string;
  sale_price: string;
  stock_quantity: string;
  is_active: boolean;
};

export type ProductVariationsInput = {
  enabled: boolean;
  track_stock: boolean;
  options: VariationOptionInput[];
  variants: VariationVariantInput[];
};

const optionSuggestions = ["Tamanho", "Cor", "Modelo"];
const keyFor = (values: string[]) => values.join("\u001f");

function combinations(options: VariationOptionInput[]) {
  if (!options.length || options.some((option) => !option.values.length)) return [] as string[][];
  return options.reduce<string[][]>((current, option) =>
    current.flatMap((combination) => option.values.map((value) => [...combination, value])), [[]]);
}

function reconcileVariants(options: VariationOptionInput[], current: VariationVariantInput[]) {
  const existing = new Map(current.map((variant) => [keyFor(variant.values), variant]));
  return combinations(options).map((values) => existing.get(keyFor(values)) ?? {
    values,
    sku: "",
    price: "",
    sale_price: "",
    stock_quantity: "0",
    is_active: true,
  });
}

export function ProductVariationsEditor({ initial }: { initial?: ProductVariationsInput }) {
  const [enabled, setEnabled] = useState(initial?.enabled ?? false);
  const [trackStock, setTrackStock] = useState(initial?.track_stock ?? false);
  const [options, setOptions] = useState<VariationOptionInput[]>(initial?.options ?? []);
  const [variants, setVariants] = useState<VariationVariantInput[]>(initial?.variants ?? []);
  const [draftValues, setDraftValues] = useState<Record<number, string>>({});

  const updateOptions = (next: VariationOptionInput[]) => {
    setOptions(next);
    setVariants((current) => reconcileVariants(next, current));
  };
  const addOption = () => {
    if (options.length >= 3) return;
    const name = optionSuggestions.find((suggestion) => !options.some((option) => option.name === suggestion)) ?? `Opção ${options.length + 1}`;
    updateOptions([...options, { name, values: [] }]);
  };
  const addValue = (optionIndex: number, rawValue: string) => {
    const value = rawValue.trim();
    if (!value || options[optionIndex].values.some((item) => item.toLocaleLowerCase("pt-BR") === value.toLocaleLowerCase("pt-BR"))) return;
    updateOptions(options.map((option, index) => index === optionIndex ? { ...option, values: [...option.values, value] } : option));
  };
  const moveValue = (optionIndex: number, valueIndex: number, direction: -1 | 1) => {
    const destination = valueIndex + direction;
    if (destination < 0 || destination >= options[optionIndex].values.length) return;
    const values = [...options[optionIndex].values];
    [values[valueIndex], values[destination]] = [values[destination], values[valueIndex]];
    updateOptions(options.map((option, index) => index === optionIndex ? { ...option, values } : option));
  };
  const payload = useMemo<ProductVariationsInput>(() => ({ enabled, track_stock: trackStock, options, variants }), [enabled, trackStock, options, variants]);

  return <section className="variations-editor">
    <input type="hidden" name="variations_json" value={JSON.stringify(payload)} />
    <div className="variations-heading">
      <div><span>VARIAÇÕES</span><h2>Tamanho, cor e outras opções</h2><p>Ative apenas quando o cliente precisar escolher uma combinação antes de comprar.</p></div>
      <label className="variation-master-switch"><input type="checkbox" checked={enabled} onChange={(event) => setEnabled(event.target.checked)} /><span>{enabled ? "Ativadas" : "Desativadas"}</span></label>
    </div>
    {enabled && <>
      <div className="variation-options">
        {options.map((option, optionIndex) => <article key={`${option.name}-${optionIndex}`}>
          <div className="variation-option-head"><label><span>Nome da opção</span><input value={option.name} maxLength={50} onChange={(event) => updateOptions(options.map((item, index) => index === optionIndex ? { ...item, name: event.target.value } : item))} placeholder="Ex.: Tamanho" /></label><button type="button" onClick={() => updateOptions(options.filter((_, index) => index !== optionIndex))}>Remover opção</button></div>
          <div className="variation-values"><span>Valores</span><div>{option.values.map((value, valueIndex) => <span className="variation-value" key={`${value}-${valueIndex}`}><b>{value}</b><button type="button" disabled={valueIndex === 0} onClick={() => moveValue(optionIndex, valueIndex, -1)} aria-label={`Mover ${value} para a esquerda`}>←</button><button type="button" disabled={valueIndex === option.values.length - 1} onClick={() => moveValue(optionIndex, valueIndex, 1)} aria-label={`Mover ${value} para a direita`}>→</button><button type="button" onClick={() => updateOptions(options.map((item, index) => index === optionIndex ? { ...item, values: item.values.filter((_, position) => position !== valueIndex) } : item))} aria-label={`Remover ${value}`}>×</button></span>)}</div><div className="variation-value-create"><input maxLength={80} value={draftValues[optionIndex] ?? ""} onChange={(event) => setDraftValues((current) => ({ ...current, [optionIndex]: event.target.value }))} placeholder={option.name === "Cor" ? "Ex.: Preto" : "Ex.: M"} /><button type="button" onClick={() => { addValue(optionIndex, draftValues[optionIndex] ?? ""); setDraftValues((current) => ({ ...current, [optionIndex]: "" })); }}>Adicionar valor</button></div></div>
        </article>)}
        {options.length < 3 && <button className="variation-add-option" type="button" onClick={addOption}>+ Adicionar {options.length ? "outra opção" : "Tamanho ou cor"}</button>}
      </div>
      {options.length > 0 && <label className="variation-stock-switch"><input type="checkbox" checked={trackStock} onChange={(event) => setTrackStock(event.target.checked)} /><span><strong>Controlar estoque por combinação</strong><small>Quando desativado, nenhuma quantidade será exigida.</small></span></label>}
      <div className="variation-combinations">
        <div><span>COMBINAÇÕES GERADAS</span><strong>{variants.length} {variants.length === 1 ? "variação" : "variações"}</strong></div>
        {variants.length ? <div className="variation-card-grid">{variants.map((variant, variantIndex) => <article key={keyFor(variant.values)} className={variant.is_active ? "" : "inactive"}>
          <div className="variation-card-head"><div><span>{String(variantIndex + 1).padStart(2, "0")}</span><h3>{variant.values.join(" · ")}</h3></div><label><input type="checkbox" checked={variant.is_active} onChange={(event) => setVariants(variants.map((item, index) => index === variantIndex ? { ...item, is_active: event.target.checked } : item))} /> Ativa</label></div>
          <div className="variation-card-fields"><label><span>Preço próprio <small>Opcional</small></span><input inputMode="decimal" value={variant.price} placeholder="Usar preço padrão" onChange={(event) => setVariants(variants.map((item, index) => index === variantIndex ? { ...item, price: event.target.value } : item))} /></label><label><span>Promocional <small>Opcional</small></span><input inputMode="decimal" value={variant.sale_price} placeholder="—" onChange={(event) => setVariants(variants.map((item, index) => index === variantIndex ? { ...item, sale_price: event.target.value } : item))} /></label>{trackStock && <label><span>Estoque</span><input type="number" min="0" value={variant.stock_quantity} onChange={(event) => setVariants(variants.map((item, index) => index === variantIndex ? { ...item, stock_quantity: event.target.value } : item))} /></label>}<label><span>Código interno <small>Opcional</small></span><input maxLength={100} value={variant.sku} placeholder="SKU" onChange={(event) => setVariants(variants.map((item, index) => index === variantIndex ? { ...item, sku: event.target.value } : item))} /></label></div>
        </article>)}</div> : <div className="variation-empty"><strong>Adicione valores para gerar as combinações.</strong><p>Exemplo: Tamanho P, M e G + Cor Preto e Branco.</p></div>}
      </div>
    </>}
  </section>;
}
