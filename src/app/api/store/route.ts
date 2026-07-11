import { NextResponse } from "next/server";
import { formValue, isAllowedFormOrigin, redirectWithMessage } from "@/lib/http";
import { createClient } from "@/lib/supabase/server";

function slugify(input: string) {
  return input.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function toE164(input: string) {
  const digits = input.replace(/\D/g, "");
  return `+${digits.length === 10 || digits.length === 11 ? `55${digits}` : digits}`;
}

export async function POST(request: Request) {
  if (!isAllowedFormOrigin(request)) return new NextResponse("Origem inválida", { status: 403 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirectWithMessage(request, "/login", "erro", "Sua sessão expirou. Entre novamente.");
  const formData = await request.formData();
  const name = formValue(formData, "name");
  const description = formValue(formData, "description");
  const slug = slugify(formValue(formData, "slug"));
  const whatsapp = toE164(formValue(formData, "whatsapp"));
  const is_active = formData.get("is_active") === "on";
  if (name.length < 2 || name.length > 100) return redirectWithMessage(request, "/painel", "erro", "O nome deve ter entre 2 e 100 caracteres.");
  if (description.length > 1000) return redirectWithMessage(request, "/painel", "erro", "A descrição deve ter no máximo 1.000 caracteres.");
  if (slug.length < 3 || slug.length > 60) return redirectWithMessage(request, "/painel", "erro", "Escolha um endereço com 3 a 60 caracteres.");
  if (!/^\+[1-9][0-9]{7,14}$/.test(whatsapp)) return redirectWithMessage(request, "/painel", "erro", "Informe um WhatsApp válido, incluindo o DDD.");
  const { error } = await supabase.from("stores").upsert(
    { owner_id: user.id, name, description: description || null, slug, whatsapp, is_active },
    { onConflict: "owner_id" },
  );
  if (error?.code === "23505") return redirectWithMessage(request, "/painel", "erro", "Este endereço já está sendo usado por outra loja.");
  if (error) return redirectWithMessage(request, "/painel", "erro", "Não foi possível salvar a loja. Tente novamente.");
  return redirectWithMessage(request, "/painel", "sucesso", "Loja salva com sucesso.");
}
