export function slugify(input: string) {
  return input.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export function moneyToCents(input: string) {
  const normalized = input.replace(/\s/g, "").replace(/\./g, "").replace(",", ".");
  const value = Number(normalized);
  return Number.isFinite(value) ? Math.round(value * 100) : -1;
}

export function formatMoney(cents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

export function safeFileName(name: string) {
  const extension = name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  return `${crypto.randomUUID()}.${extension}`;
}

export function validImage(file: FormDataEntryValue | null): file is File {
  return file instanceof File && file.size > 0 && file.size <= 5 * 1024 * 1024
    && ["image/jpeg", "image/png", "image/webp"].includes(file.type);
}
