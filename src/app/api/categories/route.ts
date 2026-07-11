import { NextResponse } from "next/server";
import { formValue, isAllowedFormOrigin, redirectWithMessage } from "@/lib/http";
import { slugify } from "@/lib/catalog";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  if (!isAllowedFormOrigin(request)) return new NextResponse("Origem inválida", { status: 403 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirectWithMessage(request, "/login", "erro", "Sua sessão expirou.");
  const { data: store } = await supabase.from("stores").select("id").eq("owner_id", user.id).maybeSingle();
  if (!store) return redirectWithMessage(request, "/painel", "erro", "Crie sua loja primeiro.");
  const formData = await request.formData();
  const name = formValue(formData, "name");
  if (!name || name.length > 80) return redirectWithMessage(request, "/painel/produtos", "erro", "Informe uma categoria com até 80 caracteres.");
  const { error } = await supabase.from("categories").insert({ store_id: store.id, name, slug: slugify(name) });
  if (error?.code === "23505") return redirectWithMessage(request, "/painel/produtos", "erro", "Essa categoria já existe.");
  if (error) return redirectWithMessage(request, "/painel/produtos", "erro", "Não foi possível criar a categoria.");
  return redirectWithMessage(request, "/painel/produtos", "sucesso", "Categoria criada.");
}
