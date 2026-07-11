"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const value = (formData: FormData, key: string) => String(formData.get(key) ?? "").trim();
const messageUrl = (key: "erro" | "sucesso", message: string) => `/painel?${key}=${encodeURIComponent(message)}`;

function slugify(input: string) {
  return input.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function toE164(input: string) {
  const digits = input.replace(/\D/g, "");
  const withCountry = digits.length === 10 || digits.length === 11 ? `55${digits}` : digits;
  return `+${withCountry}`;
}

export async function saveStore(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(messageUrl("erro", "Sua sessão expirou. Entre novamente."));

  const name = value(formData, "name");
  const description = value(formData, "description");
  const slug = slugify(value(formData, "slug"));
  const whatsapp = toE164(value(formData, "whatsapp"));
  const is_active = formData.get("is_active") === "on";

  if (name.length < 2 || name.length > 100) redirect(messageUrl("erro", "O nome deve ter entre 2 e 100 caracteres."));
  if (description.length > 1000) redirect(messageUrl("erro", "A descrição deve ter no máximo 1.000 caracteres."));
  if (slug.length < 3 || slug.length > 60) redirect(messageUrl("erro", "Escolha um endereço com 3 a 60 caracteres."));
  if (!/^\+[1-9][0-9]{7,14}$/.test(whatsapp)) redirect(messageUrl("erro", "Informe um WhatsApp válido, incluindo o DDD."));

  const { error } = await supabase.from("stores").upsert(
    { owner_id: user.id, name, description: description || null, slug, whatsapp, is_active },
    { onConflict: "owner_id" },
  );
  if (error?.code === "23505") redirect(messageUrl("erro", "Este endereço já está sendo usado por outra loja."));
  if (error) redirect(messageUrl("erro", "Não foi possível salvar a loja. Tente novamente."));

  revalidatePath("/painel");
  redirect(messageUrl("sucesso", "Loja salva com sucesso."));
}
