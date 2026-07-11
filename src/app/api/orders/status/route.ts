import { NextResponse } from "next/server";
import { formValue, isAllowedFormOrigin, redirectWithMessage } from "@/lib/http";
import { createClient } from "@/lib/supabase/server";

const statuses = ["new", "confirmed", "completed", "cancelled"] as const;

export async function POST(request: Request) {
  if (!isAllowedFormOrigin(request)) return new NextResponse("Origem inválida", { status: 403 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirectWithMessage(request, "/login", "erro", "Sua sessão expirou.");
  const formData = await request.formData();
  const id = formValue(formData, "id");
  const status = formValue(formData, "status");
  if (!statuses.includes(status as typeof statuses[number])) return redirectWithMessage(request, "/painel/pedidos", "erro", "Status inválido.");
  const { data: store } = await supabase.from("stores").select("id").eq("owner_id", user.id).maybeSingle();
  const { error } = await supabase.from("orders").update({ status }).eq("id", id).eq("store_id", store?.id ?? "");
  if (error) return redirectWithMessage(request, "/painel/pedidos", "erro", "Não foi possível atualizar o pedido.");
  return redirectWithMessage(request, "/painel/pedidos", "sucesso", "Status do pedido atualizado.");
}
