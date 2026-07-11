import { NextResponse } from "next/server";
import { formValue, isAllowedFormOrigin, redirectWithMessage } from "@/lib/http";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  if (!isAllowedFormOrigin(request)) return new NextResponse("Origem inválida", { status: 403 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirectWithMessage(request, "/login", "erro", "Sua sessão expirou.");
  const formData = await request.formData();
  const id = formValue(formData, "id");
  const isActive = formValue(formData, "is_active") === "true";
  const { data: store } = await supabase.from("stores").select("id").eq("owner_id", user.id).maybeSingle();
  const { error } = await supabase.from("products").update({ is_active: isActive }).eq("id", id).eq("store_id", store?.id ?? "");
  if (error) return redirectWithMessage(request, "/painel/produtos", "erro", "Não foi possível alterar o produto.");
  return redirectWithMessage(request, "/painel/produtos", "sucesso", isActive ? "Produto ativado." : "Produto pausado.");
}
